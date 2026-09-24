"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { money } from "@/lib/utils";
import {
  Clock,
  Calendar,
  Truck,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Info,
  FileText,
  CreditCard,
  MapPin,
  Car,
  Star,
  Lock,
  Loader2,
  Sparkles,
  Wrench,
  Route,
  Building2,
  FileWarning,
} from "lucide-react";

const STORAGE_PASO1 = "ruum_solicitud_paso1";
const STORAGE_PASO2 = "ruum_solicitud_paso2";
const STORAGE_PASO3 = "ruum_solicitud_paso3";
const STORAGE_PASO4 = "ruum_solicitud_paso4";
const STORAGE_COTIZACION = "ruum_cotizacion_result";

type Ventana = "Flexible (sin preferencia)" | "Mañana 09:00–13:00" | "Tarde 13:00–18:00" | "Noche 18:00–21:00" | "Otra (especificar)";
const VENTANAS: Ventana[] = ["Flexible (sin preferencia)", "Mañana 09:00–13:00", "Tarde 13:00–18:00", "Noche 18:00–21:00", "Otra (especificar)"];

type TipoTraslado = "Local" | "Foráneo";
type Servicio = "Traslado personal" | "Traslado empresarial" | "Para agencia" | "Para lote" | "Para flotilla";
type Motivo = "Entrega a cliente" | "Recuperación" | "Traslado especial";

const SERVICIOS: Servicio[] = ["Traslado personal", "Traslado empresarial", "Para agencia", "Para lote", "Para flotilla"];
const MOTIVOS: Motivo[] = ["Entrega a cliente", "Recuperación", "Traslado especial"];

export default function SolicitudPaso4Page() {
  // Agenda / ventanas
  const [tipoTraslado, setTipoTraslado] = useState<TipoTraslado>("Local");
  const [ventanaRecoleccion, setVentanaRecoleccion] = useState<Ventana>("Flexible (sin preferencia)");
  const [ventanaRecoleccionOtra, setVentanaRecoleccionOtra] = useState("");
  const [ventanaEntrega, setVentanaEntrega] = useState<Ventana>("Flexible (sin preferencia)");
  const [ventanaEntregaOtra, setVentanaEntregaOtra] = useState("");

  // Servicio / motivo
  const [servicio, setServicio] = useState<Servicio>("Traslado personal");
  const [motivo, setMotivo] = useState<Motivo>("Entrega a cliente");

  // Políticas
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [touchedPolicy, setTouchedPolicy] = useState(false);

  // Datos acumulados para resumen
  const [paso1, setPaso1] = useState<any>(null);
  const [paso2, setPaso2] = useState<any>(null);
  const [paso3, setPaso3] = useState<any>(null);
  const [cotizacion, setCotizacion] = useState<any>(null);
  const [tarifaFinal, setTarifaFinal] = useState<number | null>(null);
  const [tarifaLoading, setTarifaLoading] = useState(false);
  const [agendaLabel, setAgendaLabel] = useState<string>("Lo antes posible");

  // Auto-guardado
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const hasLoadedRef = useRef(false);
  const recalcRef = useRef(false);

  // Cargar datos previos
  useEffect(() => {
    try {
      const raw1 = localStorage.getItem(STORAGE_PASO1);
      if (raw1) setPaso1(JSON.parse(raw1));
      const raw2 = localStorage.getItem(STORAGE_PASO2);
      if (raw2) setPaso2(JSON.parse(raw2));
      const raw3 = localStorage.getItem(STORAGE_PASO3);
      if (raw3) setPaso3(JSON.parse(raw3));
      const rawCot = localStorage.getItem(STORAGE_COTIZACION) || localStorage.getItem("ruum_last_cotizacion");
      if (rawCot) {
        const c = JSON.parse(rawCot);
        setCotizacion(c);
        if (c.tarifa) setTarifaFinal(c.tarifa);
        else if (c.totalConGastos) setTarifaFinal(c.totalConGastos);
        // Agenda label desde paso1
        if (c.meta?.urgencia) setAgendaLabel(c.meta.urgencia.includes("Express") ? "Lo antes posible" : "Programado");
      }
      // Si paso1 tiene cuando
      if (raw1) {
        const p1 = JSON.parse(raw1);
        if (p1.cuando === "programado" && p1.fechaProgramada) setAgendaLabel(`Programado: ${p1.fechaProgramada}`);
        else if (p1.cuando === "inmediato" || !p1.cuando) setAgendaLabel("Lo antes posible");
      }
      const raw4 = localStorage.getItem(STORAGE_PASO4);
      if (raw4) {
        const d = JSON.parse(raw4);
        if (d.tipoTraslado) setTipoTraslado(d.tipoTraslado);
        if (d.ventanaRecoleccion) setVentanaRecoleccion(d.ventanaRecoleccion);
        if (d.ventanaRecoleccionOtra) setVentanaRecoleccionOtra(d.ventanaRecoleccionOtra);
        if (d.ventanaEntrega) setVentanaEntrega(d.ventanaEntrega);
        if (d.ventanaEntregaOtra) setVentanaEntregaOtra(d.ventanaEntregaOtra);
        if (d.servicio) setServicio(d.servicio);
        if (d.motivo) setMotivo(d.motivo);
        if (typeof d.policyAccepted === "boolean") setPolicyAccepted(d.policyAccepted);
      }
    } catch {}
    hasLoadedRef.current = true;
  }, []);

  // Auto-guardado Paso 4
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const payload = {
      tipoTraslado,
      ventanaRecoleccion,
      ventanaRecoleccionOtra,
      ventanaEntrega,
      ventanaEntregaOtra,
      servicio,
      motivo,
      policyAccepted,
      tarifaFinal,
      updatedAt: new Date().toISOString(),
    };
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_PASO4, JSON.stringify(payload));
        setSavedAt(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1200);
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [tipoTraslado, ventanaRecoleccion, ventanaRecoleccionOtra, ventanaEntrega, ventanaEntregaOtra, servicio, motivo, policyAccepted, tarifaFinal]);

  // Recalcular tarifa cuando cambia Tipo de traslado o Ventanas
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (!paso1 || !paso1.cpOrigen || !paso1.cpDestino || !paso1.marca || !paso1.modelo) return;
    // Evitar recalcular en primera carga si no ha cambiado nada relevante
    if (!recalcRef.current) {
      recalcRef.current = true;
      return;
    }
    setTarifaLoading(true);
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        const body: any = {
          cpOrigen: paso1.cpOrigen,
          cpDestino: paso1.cpDestino,
          marca: paso1.marca,
          modelo: paso1.modelo,
          condicion: paso1.condicion || paso2?.condicion || "Seminueva",
          cuando: paso1.cuando || "inmediato",
          fechaProgramada: paso1.fechaProgramada,
          // Ajuste por tipo de traslado: foráneo aumenta distancia simulada? Enviamos flag para que cotizar pueda ajustar
          tipoTraslado,
          ventanaRecoleccion: ventanaRecoleccion === "Otra (especificar)" ? ventanaRecoleccionOtra : ventanaRecoleccion,
          ventanaEntrega: ventanaEntrega === "Otra (especificar)" ? ventanaEntregaOtra : ventanaEntrega,
        };
        const res = await fetch("/api/cotizar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok && data.tarifa) {
          setTarifaFinal(data.tarifa);
          setCotizacion(data);
          try {
            localStorage.setItem(STORAGE_COTIZACION, JSON.stringify(data));
          } catch {}
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          // mantener tarifa anterior
        }
      } finally {
        setTarifaLoading(false);
      }
    }, 700);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [tipoTraslado, ventanaRecoleccion, ventanaRecoleccionOtra, ventanaEntrega, ventanaEntregaOtra]);

  // Resumen derivado
  const resumen = useMemo(() => {
    const vehiculo = paso2 ? `${paso2.marca || paso1?.marca || "—"} ${paso2.modelo || paso1?.modelo || ""} ${paso2.anio || ""}`.trim() : `${paso1?.marca || "—"} ${paso1?.modelo || ""}`.trim();
    const clasificacion = (() => {
      if (cotizacion?.meta) return `${cotizacion.meta.segmento || "—"} · ${cotizacion.meta.gama || "—"} · ${cotizacion.meta.condicion || paso2?.condicion || "—"}`;
      if (paso2) return `${paso2.marca || ""} · ${paso2.condicion || ""}`;
      return "—";
    })();
    const ruta = (() => {
      if (paso3?.origen && paso3?.destino) {
        const o = `${paso3.origen.ciudad || paso3.origen.estado || paso3.origen.cp || "Origen"}`;
        const d = `${paso3.destino.ciudad || paso3.destino.estado || paso3.destino.cp || "Destino"}`;
        return `${o} → ${d}`;
      }
      if (paso1?.cpOrigen && paso1?.cpDestino) return `${paso1.cpOrigen} → ${paso1.cpDestino}`;
      return "—";
    })();
    const estimacion = (() => {
      if (paso3?.routeMetrics) return `${paso3.routeMetrics.distanceKm} km · ${Math.round(paso3.routeMetrics.durationMin / 60 * 10) / 10} h`;
      if (cotizacion?.meta) return `${cotizacion.meta.distanciaKm} km · ${cotizacion.meta.horas} h`;
      return "—";
    })();
    return { vehiculo: vehiculo || "Acura ADX 2020", clasificacion, ruta, estimacion, agenda: agendaLabel, servicio };
  }, [paso1, paso2, paso3, cotizacion, agendaLabel, servicio]);

  const montoMostrar = tarifaFinal ?? cotizacion?.tarifa ?? 1822.12;
  const canConfirm = policyAccepted && !!montoMostrar;

  return (
    <div className="max-w-[1160px] mx-auto pb-24 lg:pb-0">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
          <Clock className="w-3 h-3" /> ⏱ Te tomará ~3 min
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${savedFlash ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500"}`}>
          {savedFlash ? <><CheckCircle2 className="w-3 h-3" /> Guardado hace unos segundos</> : savedAt ? <>✓ Guardado {savedAt}</> : <>✓ Guardado automático</>}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-2.5 py-1 text-xs font-bold">
          <Lock className="w-3 h-3" /> 🔒 Pago seguro con Stripe
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#ff4d11] bg-[#ff4d11]/10 border border-[#ff4d11]/20 rounded-full px-3 py-1">
            PASO 4 DE 5: DETALLES DEL SERVICIO
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 text-[11px]">
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-1 font-bold">1. Conoce tu tarifa ✓</span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-1 font-bold">2. ¿Qué vehículo trasladamos? ✓</span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-1 font-bold">3. ¿Dónde lo recogemos y llevamos? ✓</span>
            <span className="inline-flex items-center gap-1 bg-slate-900 text-white rounded-full px-2.5 py-1 font-bold">4. Detalles del servicio</span>
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-500 rounded-full px-2.5 py-1">5. Pago</span>
          </div>
        </div>
      </div>

      {/* Banner carga masiva */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-wrap items-center gap-2 text-sm mb-6">
        <Building2 className="w-4 h-4 text-slate-500" />
        <span className="text-slate-700">¿Tienes varios vehículos? Crea hasta 100 traslados a la vez...</span>
        <Link href="/traslados" className="ml-auto text-[#ff4d11] font-bold hover:underline text-sm">Carga masiva CSV →</Link>
      </div>

      <div className="grid lg:grid-cols-[1.6fr_0.9fr] gap-6 items-start">
        {/* Izquierda: Fecha/Horario + Servicio */}
        <div className="space-y-6">
          {/* Fecha y Horario */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2"><Calendar className="w-4 h-4 text-[#ff4d11]" /> Fecha y horario de recolección</h3>
              <Link href="/solicitud" className="text-xs font-bold text-[#ff4d11] hover:underline">Editar</Link>
            </div>
            <div className="mt-3 rounded-xl bg-slate-900 text-white p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 grid place-items-center">⚡</div>
              <div>
                <div className="text-sm font-bold">Lo antes posible</div>
                <div className="text-xs opacity-70">Opción activa seleccionada</div>
              </div>
              <span className="ml-auto text-xs bg-emerald-500 text-white rounded-full px-2 py-1 font-bold">Activa</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <label className="text-xs font-bold text-slate-700">Tipo de traslado <span className="text-red-500">*</span></label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(["Local", "Foráneo"] as TipoTraslado[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipoTraslado(t)}
                      className={`h-10 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 ${tipoTraslado === t ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:bg-slate-50"}`}
                    >
                      {t === "Local" ? <MapPin className="w-4 h-4" /> : <Route className="w-4 h-4" />} {t}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Local = rango urbano metropolitano.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Ventana de recolección</label>
                <select value={ventanaRecoleccion} onChange={(e) => setVentanaRecoleccion(e.target.value as Ventana)} className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  {VENTANAS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                {ventanaRecoleccion === "Otra (especificar)" && (
                  <input value={ventanaRecoleccionOtra} onChange={(e) => setVentanaRecoleccionOtra(e.target.value)} placeholder="Especifica ventana" className="mt-2 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Ventana de entrega</label>
                <select value={ventanaEntrega} onChange={(e) => setVentanaEntrega(e.target.value as Ventana)} className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  {VENTANAS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
                {ventanaEntrega === "Otra (especificar)" && (
                  <input value={ventanaEntregaOtra} onChange={(e) => setVentanaEntregaOtra(e.target.value)} placeholder="Especifica ventana" className="mt-2 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" />
                )}
              </div>

              <div className="sm:col-span-2">
                <p className="text-[11px] text-slate-500">Acota el rango horario límite de entrega a la grúa/conductor y recepción en destino.</p>
              </div>
            </div>
          </Card>

          {/* Tipo servicio y motivo */}
          <Card className="p-5">
            <h3 className="text-sm font-black flex items-center gap-2"><Wrench className="w-4 h-4 text-slate-700" /> Tipo de servicio y motivo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Servicio <span className="text-red-500">*</span></label>
                <select value={servicio} onChange={(e) => setServicio(e.target.value as Servicio)} className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  {SERVICIOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Ajusta clasificación fiscal/facturación.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Motivo <span className="text-red-500">*</span></label>
                <select value={motivo} onChange={(e) => setMotivo(e.target.value as Motivo)} className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                  {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Clasificación operativa para el conductor.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Derecha: Resumen cotización */}
        <div className="space-y-4 lg:sticky lg:top-[80px]">
          <Card className="overflow-hidden">
            <div className="px-5 pt-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff4d11]" />
                <h3 className="text-xs font-black tracking-[0.14em] text-slate-600">TARIFA FINAL</h3>
                {tarifaLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />}
              </div>
              <div className="mt-3 rounded-2xl bg-slate-900 text-white p-5 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="text-[11px] tracking-widest font-bold opacity-60">MONTO A PAGAR</div>
                <div className="text-3xl font-black mt-1">{money(montoMostrar)}</div>
                <div className="text-xs opacity-70">MXN — Pago Anticipado</div>
                <div className="mt-2 text-[11px] opacity-60">Este es el monto final calculado para tu traslado, no una estimación.</div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Se recalcula si cambias Local/Foráneo o ventanas.</p>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="rounded-xl border bg-slate-50 p-3 space-y-2 text-xs">
                <div className="flex gap-2"><Car className="w-4 h-4 text-slate-500 shrink-0" /><span><b>Vehículo:</b> {resumen.vehiculo}</span></div>
                <div className="flex gap-2"><Wrench className="w-4 h-4 text-slate-500 shrink-0" /><span><b>Clasificación:</b> {resumen.clasificacion}</span></div>
                <div className="flex gap-2"><MapPin className="w-4 h-4 text-slate-500 shrink-0" /><span><b>Ruta:</b> {resumen.ruta}</span></div>
                <div className="flex gap-2"><Clock className="w-4 h-4 text-slate-500 shrink-0" /><span><b>Estimación:</b> {resumen.estimacion}</span></div>
                <div className="flex gap-2"><Calendar className="w-4 h-4 text-slate-500 shrink-0" /><span><b>Agenda:</b> {resumen.agenda}</span></div>
                <div className="flex gap-2"><Building2 className="w-4 h-4 text-slate-500 shrink-0" /><span><b>Servicio:</b> {resumen.servicio}</span></div>
              </div>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1"><FileWarning className="w-3 h-3" /> Políticas y Términos</div>
                <p className="mt-1">Ruum Ruum solo acepta métodos electrónicos. No se permite pago en efectivo. Sin historial suficiente o sin método de pago registrado. Cancelar ahora puede generar un cargo según el avance operativo del servicio. Cancelar ahora genera un cargo del 0%. ¿Deseas continuar?</p>
                <label className="flex gap-2 mt-3 cursor-pointer">
                  <input type="checkbox" checked={policyAccepted} onChange={(e) => { setPolicyAccepted(e.target.checked); setTouchedPolicy(true); }} className="mt-0.5 rounded border-slate-300" />
                  <span className="font-medium">Acepto la política de cancelación y que el pago es solo por medios electrónicos.</span>
                </label>
                {!policyAccepted && touchedPolicy && <p className="text-red-600 font-bold mt-1">Debes aceptar para continuar.</p>}
              </div>

              <div className="rounded-xl border bg-white p-3 flex flex-wrap gap-2 text-[11px] text-slate-600 items-center">
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Conductores certificados ★ 4.8/5</span>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span>+2,340 traslados verificados este mes</span>
                <span className="ml-auto inline-flex items-center gap-1 bg-slate-900 text-white rounded-full px-2 py-1 font-bold"><Lock className="w-3 h-3" /> Pago seguro Stripe</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <CreditCard className="w-4 h-4" />
                <span>Visa</span><span className="w-1 h-1 bg-slate-300 rounded-full" /><span>Mastercard</span><span className="w-1 h-1 bg-slate-300 rounded-full" /><span>Amex</span><span className="w-1 h-1 bg-slate-300 rounded-full" /><span>SPEI</span><span className="w-1 h-1 bg-slate-300 rounded-full" /><span>3-D Secure</span>
              </div>
            </div>

            <div className="p-5 border-t bg-white space-y-3">
              <Button
                disabled={!canConfirm}
                onClick={() => {
                  if (!canConfirm) { setTouchedPolicy(true); return; }
                  try {
                    localStorage.setItem("ruum_solicitud_paso4_ready", "1");
                    localStorage.setItem("ruum_tarifa_final", String(montoMostrar));
                  } catch {}
                  window.location.href = "/solicitud/paso5";
                }}
                className="w-full h-11 text-sm font-black gap-2 disabled:opacity-40"
              >
                Confirmar y pagar <ArrowRight className="w-4 h-4" />
              </Button>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tarifa estimada:</span>
                <span className="font-black">{money(montoMostrar)} MXN</span>
              </div>
              <div className="flex gap-2">
                <Link href="/solicitud/paso3" className="flex-1"><Button variant="outline" className="w-full"><ArrowLeft className="w-4 h-4 mr-1" /> Atrás</Button></Link>
                <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">Recalcular</Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Info className="w-3 h-3" /> Persistencia de resumen</div>
            <p className="text-xs text-slate-500 mt-1">Pasos 1-3 inmutables en estado para consistencia del desglose previo al pago.</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <div className="rounded-lg bg-slate-50 border p-2 text-center"><div className="font-bold">1</div><div className="text-slate-500">Tarifa</div><div className="text-emerald-600">✓</div></div>
              <div className="rounded-lg bg-slate-50 border p-2 text-center"><div className="font-bold">2</div><div className="text-slate-500">Vehículo</div><div className="text-emerald-600">✓</div></div>
              <div className="rounded-lg bg-slate-50 border p-2 text-center"><div className="font-bold">3</div><div className="text-slate-500">Ruta</div><div className="text-emerald-600">✓</div></div>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile fixed */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Tarifa:</span><span className="font-black">{money(montoMostrar)} MXN</span><span className="text-[11px] bg-slate-900 text-white rounded-full px-2 py-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Stripe</span>
        </div>
        <div className="flex gap-2">
          <Link href="/solicitud/paso3" className="flex-1"><Button variant="outline" className="w-full h-11">Atrás</Button></Link>
          <Button disabled={!canConfirm} onClick={() => window.location.href="/solicitud/paso5"} className="flex-[1.4] h-11 font-black">Confirmar y pagar <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>
      </div>
    </div>
  );
}
