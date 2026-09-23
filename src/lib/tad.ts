// TAD v2.0 — Tarifador Automático Dinámico
// Especificación técnica fiel. Sin módulos de Gastos/Liquidación.

export type Segmento = "Subcompacto / Compacto" | "SUV / Minivan / Pick-up" | "Deportivo" | "Lujo / Blindado";
export type Gama = "Entrada" | "Media" | "Alta" | "Premium";
export type Condicion = "NUEVO" | "SEMINUEVO" | "USADO";
export type ClienteTipo = "Personal" | "Empresarial (PYME)" | "Corporativo / Renting";
export type Urgencia = "Programado (>24h)" | "Express (<4h)";
export type DiaTipo = "Lunes a Viernes" | "Sábado" | "Domingo y Feriados";
export type Horario = "Diurno (06:00-20:00)" | "Nocturno (20:01-05:59)";

export type VariablesBase = {
  TARIFA_BASE: number;
  COSTO_KM_URBANO: number;
  COSTO_KM_INTERURBANO: number;
  COSTO_KM_INTERESTATAL: number;
  COSTO_HORA: number;
  TARIFA_MINIMA: number;
};

export const DEFAULT_VARIABLES: VariablesBase = {
  TARIFA_BASE: 400,
  COSTO_KM_URBANO: 16.50,
  COSTO_KM_INTERURBANO: 14.50,
  COSTO_KM_INTERESTATAL: 12.50,
  COSTO_HORA: 300,
  TARIFA_MINIMA: 650,
};

// Matriz M_activo — Segmento x Gama (valores base sin condición)
export const M_ACTIVO: Record<Segmento, Record<Gama, number | null>> = {
  "Subcompacto / Compacto": { "Entrada": 0.95, "Media": 1.00, "Alta": 1.15, "Premium": 1.25 },
  "SUV / Minivan / Pick-up": { "Entrada": 1.10, "Media": 1.15, "Alta": 1.30, "Premium": 1.45 },
  "Deportivo": { "Entrada": null, "Media": 1.30, "Alta": 1.60, "Premium": 1.80 },
  "Lujo / Blindado": { "Entrada": null, "Media": 1.40, "Alta": 1.70, "Premium": 2.00 },
};

export const CONDICION_AJUSTE: Record<Condicion, number> = {
  "NUEVO": 1.05,
  "SEMINUEVO": 1.00,
  "USADO": 0.95,
};

export const M_TEMPORAL: Record<DiaTipo, Record<Horario, number>> = {
  "Lunes a Viernes": { "Diurno (06:00-20:00)": 1.00, "Nocturno (20:01-05:59)": 1.20 },
  "Sábado": { "Diurno (06:00-20:00)": 1.15, "Nocturno (20:01-05:59)": 1.25 },
  "Domingo y Feriados": { "Diurno (06:00-20:00)": 1.35, "Nocturno (20:01-05:59)": 1.50 },
};

export const M_CLIENTE: Record<ClienteTipo, number> = {
  "Personal": 1.00,
  "Empresarial (PYME)": 0.95,
  "Corporativo / Renting": 0.85,
};

export const M_URGENCIA: Record<Urgencia, number> = {
  "Programado (>24h)": 1.00,
  "Express (<4h)": 1.20,
};

// Helpers
export function getM_activo(segmento: Segmento, gama: Gama, condicion: Condicion): number {
  const base = M_ACTIVO[segmento][gama];
  if (base === null) throw new Error(`Combinación no válida: ${segmento} + ${gama}`);
  return +(base * CONDICION_AJUSTE[condicion]).toFixed(4);
}

export function getM_temporal(dia: DiaTipo, horario: Horario): number {
  return M_TEMPORAL[dia][horario];
}

// Lógica de costo por distancia — progresiva por tramos (0-50, 51-150, >150)
export function costoDistancia(distanciaKm: number, v: VariablesBase): { tramo: string; costo: number; detalle: string } {
  if (distanciaKm <= 0) return { tramo: "—", costo: 0, detalle: "Sin distancia" };
  if (distanciaKm <= 50) {
    return { tramo: "Urbano (0-50 km)", costo: distanciaKm * v.COSTO_KM_URBANO, detalle: `${distanciaKm} km × $${v.COSTO_KM_URBANO.toFixed(2)}` };
  }
  if (distanciaKm <= 150) {
    const c1 = 50 * v.COSTO_KM_URBANO;
    const c2 = (distanciaKm - 50) * v.COSTO_KM_INTERURBANO;
    return { tramo: "Interurbano (51-150 km)", costo: c1 + c2, detalle: `50×$${v.COSTO_KM_URBANO.toFixed(2)} + ${distanciaKm - 50}×$${v.COSTO_KM_INTERURBANO.toFixed(2)}` };
  }
  const c1 = 50 * v.COSTO_KM_URBANO;
  const c2 = 100 * v.COSTO_KM_INTERURBANO;
  const c3 = (distanciaKm - 150) * v.COSTO_KM_INTERESTATAL;
  return { tramo: "Interestatal (>150 km)", costo: c1 + c2 + c3, detalle: `50×$${v.COSTO_KM_URBANO.toFixed(2)} + 100×$${v.COSTO_KM_INTERURBANO.toFixed(2)} + ${distanciaKm - 150}×$${v.COSTO_KM_INTERESTATAL.toFixed(2)}` };
}

export type TadInput = {
  distanciaKm: number;
  horas: number;
  segmento: Segmento;
  gama: Gama;
  condicion: Condicion;
  diaTipo: DiaTipo;
  horario: Horario;
  clienteTipo: ClienteTipo;
  urgencia: Urgencia;
  variables?: VariablesBase;
  // Gastos separados (no afectan TAD, solo total)
  gastos?: { combustible?: number; casetas?: number; viaticoRetorno?: number };
};

export type TadResult = {
  // Paso a paso
  tarifaBase: number;
  costoDistancia: number;
  costoDistanciaDetalle: string;
  tramo: string;
  costoTiempo: number;
  subtotal: number; // base + distancia + tiempo
  mActivo: number;
  mTemporal: number;
  mCliente: number;
  mUrgencia: number;
  mTotal: number;
  tadBruto: number; // subtotal * mTotal
  tad: number; // max(bruto, minima)
  tarifaMinima: number;
  isMinimaAplicada: boolean;
  // Gastos / total (separados)
  gastosTotal: number;
  totalPagar: number; // tad + gastos
  desgloseGastos: { combustible: number; casetas: number; viaticoRetorno: number };
};

export function calcularTAD(input: TadInput): TadResult {
  const v = input.variables ?? DEFAULT_VARIABLES;
  const { costo, detalle, tramo } = costoDistancia(input.distanciaKm, v);
  const costoTiempo = input.horas * v.COSTO_HORA;
  const subtotal = v.TARIFA_BASE + costo + costoTiempo;

  const mActivo = getM_activo(input.segmento, input.gama, input.condicion);
  const mTemporal = getM_temporal(input.diaTipo, input.horario);
  const mCliente = M_CLIENTE[input.clienteTipo];
  const mUrgencia = M_URGENCIA[input.urgencia];
  const mTotal = +(mActivo * mTemporal * mCliente * mUrgencia).toFixed(4);

  const tadBruto = subtotal * mTotal;
  const isMinimaAplicada = tadBruto < v.TARIFA_MINIMA;
  const tad = isMinimaAplicada ? v.TARIFA_MINIMA : Math.round(tadBruto);

  const desgloseGastos = {
    combustible: input.gastos?.combustible ?? 0,
    casetas: input.gastos?.casetas ?? 0,
    viaticoRetorno: input.gastos?.viaticoRetorno ?? 0,
  };
  const gastosTotal = desgloseGastos.combustible + desgloseGastos.casetas + desgloseGastos.viaticoRetorno;
  const totalPagar = tad + gastosTotal;

  return {
    tarifaBase: v.TARIFA_BASE,
    costoDistancia: costo,
    costoDistanciaDetalle: detalle,
    tramo,
    costoTiempo,
    subtotal,
    mActivo,
    mTemporal,
    mCliente,
    mUrgencia,
    mTotal,
    tadBruto: Math.round(tadBruto),
    tad,
    tarifaMinima: v.TARIFA_MINIMA,
    isMinimaAplicada,
    gastosTotal,
    totalPagar,
    desgloseGastos,
  };
}

// Pseudocódigo referencia (para docs)
// 1  function calcularTAD(distancia, horas, segmento, gama, condicion, dia, horario, cliente, urgencia):
// 2    costoDist = tramo(distancia)  // urbano / interurbano / interestatal (progresivo)
// 3    subtotal = TARIFA_BASE + costoDist + (horas * COSTO_HORA)
// 4    mActivo = M_ACTIVO[segmento][gama] * AJUSTE_CONDICION[condicion]
// 5    mTemporal = M_TEMPORAL[dia][horario]
// 6    mCliente = M_CLIENTE[cliente]
// 7    mUrgencia = M_URGENCIA[urgencia]
// 8    tadBruto = subtotal * mActivo * mTemporal * mCliente * mUrgencia
// 9    tad = max(tadBruto, TARIFA_MINIMA)
// 10   gastos = combustible + casetas + viaticoRetorno  // Módulo separado
// 11   total = tad + gastos
// 12   return { tad, gastos, total, desglose }
