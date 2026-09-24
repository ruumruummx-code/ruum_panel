import { NextRequest, NextResponse } from "next/server";
import { calcularTAD, DEFAULT_VARIABLES, type Segmento, type Gama, type Condicion, type DiaTipo, type Horario } from "@/lib/tad";
import { fetchTadConfig } from "@/lib/supabase/tad";
import { lookupVehiculo } from "@/lib/vehiculos";

// Validaciones CP
const CP_REGEX = /^\d{5}$/;

function estimateDistance(cpOrigen: string, cpDestino: string): { km: number; horas: number } {
  const a = parseInt(cpOrigen, 10);
  const b = parseInt(cpDestino, 10);
  const diff = Math.abs(a - b);
  // Heurística determinística: diff % 400 + base 12 km + pequeño aleatorio determinístico por CP
  // Asegura rutas cortas/medias/largas cubriendo los 3 tramos TAD
  let km = (diff % 380) + 12 + ((a % 7) + (b % 5));
  // Clamp 8 - 420
  km = Math.max(8, Math.min(420, Math.round(km)));
  // Horas: velocidad promedio 65 km/h urbanos/inter + 0.5h maniobra
  const horas = Math.max(1, Math.round((km / 62 + 0.5) * 2) / 2); // redondeo 0.5h
  return { km, horas };
}

function condicionMap(v: string): Condicion {
  const n = v.toLowerCase().trim();
  if (n === "nueva" || n === "nuevo") return "NUEVO";
  if (n === "seminueva" || n === "seminuevo") return "SEMINUEVO";
  if (n.includes("rescate") || n.includes("mec")) return "USADO";
  if (n === "usado" || n === "usada") return "USADO";
  return "SEMINUEVO";
}

function dateToDiaHorario(fecha?: string): { diaTipo: DiaTipo; horario: Horario } {
  if (!fecha) return { diaTipo: "Lunes a Viernes", horario: "Diurno (06:00-20:00)" };
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return { diaTipo: "Lunes a Viernes", horario: "Diurno (06:00-20:00)" };
  const day = d.getDay(); // 0 dom, 6 sab
  let diaTipo: DiaTipo = "Lunes a Viernes";
  if (day === 6) diaTipo = "Sábado";
  if (day === 0) diaTipo = "Domingo y Feriados";
  const hour = d.getHours();
  const horario: Horario = hour >= 6 && hour <= 20 ? "Diurno (06:00-20:00)" : "Nocturno (20:01-05:59)";
  return { diaTipo, horario };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      cpOrigen,
      cpDestino,
      marca,
      modelo,
      condicion,
      cuando, // "inmediato" | "programado"
      fechaProgramada,
      // opcionales avanzados
      clienteTipo,
      segmento,
      gama,
    } = body ?? {};

    const errors: Record<string, string> = {};

    if (!cpOrigen || !CP_REGEX.test(String(cpOrigen).trim())) {
      errors.cpOrigen = "El Código Postal debe tener 5 dígitos.";
    }
    if (!cpDestino || !CP_REGEX.test(String(cpDestino).trim())) {
      errors.cpDestino = "El Código Postal debe tener 5 dígitos.";
    }
    if (!marca || String(marca).trim().length === 0) {
      errors.marca = "Requerido para el cálculo.";
    }
    if (!modelo || String(modelo).trim().length === 0) {
      errors.modelo = "Requerido para el cálculo.";
    }
    if (!condicion || String(condicion).trim().length === 0) {
      errors.condicion = "Requerido para definir tipo de grúa/traslado.";
    }
    if (!cuando || !["inmediato", "programado", "Lo antes posible", "Programar fecha"].includes(String(cuando))) {
      // normalizar: si no viene, asumir inmediato
    }
    const cuandoNorm = String(cuando ?? "inmediato").toLowerCase().includes("program") ? "programado" : "inmediato";
    if (cuandoNorm === "programado" && !fechaProgramada) {
      errors.fechaProgramada = "Selecciona la fecha programada.";
    }
    if (fechaProgramada) {
      const d = new Date(fechaProgramada);
      if (isNaN(d.getTime())) errors.fechaProgramada = "Fecha no válida.";
      else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (d < today) errors.fechaProgramada = "La fecha no puede ser en el pasado.";
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    const cpO = String(cpOrigen).trim();
    const cpD = String(cpDestino).trim();

    // Distancia estimada
    const { km: distanciaKm, horas } = estimateDistance(cpO, cpD);

    // Resolver segmento/gama — usa catálogo centralizado vehiculos (marca+modelo)
    let seg: Segmento = segmento as Segmento;
    let gam: Gama = gama as Gama;
    if (!seg || !gam) {
      const veh = lookupVehiculo(String(marca).trim(), String(modelo).trim());
      if (veh) {
        seg = veh.segmento;
        gam = veh.gama;
      } else {
        seg = "Subcompacto / Compacto";
        gam = "Media";
      }
    }

    const condicionTad = condicionMap(String(condicion));
    const urgencia = cuandoNorm === "inmediato" ? "Express (<4h)" : "Programado (>24h)";
    const { diaTipo, horario } = dateToDiaHorario(fechaProgramada);

    // Intentar cargar variables base desde Supabase (si falla usa defaults)
    let variables = DEFAULT_VARIABLES;
    try {
      const res = await fetchTadConfig();
      if (res.vars) variables = res.vars;
    } catch {
      // ignore, use defaults
    }

    const result = calcularTAD({
      distanciaKm,
      horas,
      segmento: seg,
      gama: gam,
      condicion: condicionTad,
      diaTipo,
      horario,
      clienteTipo: (clienteTipo as any) ?? "Personal",
      urgencia: urgencia as any,
      variables,
      gastos: { combustible: 0, casetas: 0, viaticoRetorno: 0 },
    });

    // Estimación gastos operativos (heurística simple, separada del TAD)
    const combustibleEst = Math.round(distanciaKm * 3.2); // $3.2/km promedio
    const casetasEst = distanciaKm > 100 ? Math.round(distanciaKm * 0.9) : distanciaKm > 50 ? 180 : 0;
    const totalConGastos = result.tad + combustibleEst + casetasEst;

    return NextResponse.json({
      ok: true,
      tarifa: result.tad,
      totalConGastos,
      moneda: "MXN",
      desglose: result,
      gastosEstimados: { combustible: combustibleEst, casetas: casetasEst, viaticoRetorno: 0 },
      meta: {
        distanciaKm,
        horas,
        segmento: seg,
        gama: gam,
        condicion: condicionTad,
        diaTipo,
        horario,
        urgencia,
        cpOrigen: cpO,
        cpDestino: cpD,
        marca: String(marca).trim(),
        modelo: String(modelo).trim(),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error interno" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "POST /api/cotizar con { cpOrigen, cpDestino, marca, modelo, condicion, cuando, fechaProgramada }",
    validacion: {
      cpOrigen: "Exactamente 5 dígitos numéricos",
      cpDestino: "Exactamente 5 dígitos numéricos",
      marca: "Obligatorio",
      modelo: "Obligatorio texto libre",
      condicion: "Nueva | Seminueva | Rescate mecánico",
      cuando: "inmediato (Lo antes posible) | programado (Programar fecha)",
    },
    ejemplo: {
      cpOrigen: "37000",
      cpDestino: "76100",
      marca: "Mazda",
      modelo: "3",
      condicion: "Seminueva",
      cuando: "inmediato",
    },
  });
}
