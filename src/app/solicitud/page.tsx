"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { Card, Button } from "@/components/ui";
import { money } from "@/lib/utils";
import { Clock, Calendar, MapPin, Car, AlertCircle, CheckCircle2, Loader2, Sparkles, Wrench, ShieldCheck, ArrowRight, FileSearch } from "lucide-react";
import Link from "next/link";

const MARCAS = [
  "Acura","Audi","BMW","BYD","Chevrolet","Chrysler","Dodge","Fiat","Ford","GMC","Honda","Hyundai","Jaguar","Jeep","Kia","Land Rover","Lexus","Lincoln","Mazda","Mercedes-Benz","MG","Mini","Mitsubishi","Nissan","Peugeot","Porsche","RAM","Renault","Seat","Subaru","Suzuki","Tesla","Toyota","Volkswagen","Volvo",
];

const CONDICIONES = ["Nueva","Seminueva","Usada"] as const;

type Cuando = "inmediato" | "programado";

const STORAGE_KEY = "ruum_solicitud_paso1";
const CP_REGEX = /^\d{5}$/;

function fieldValidCp(v: string) { return CP_REGEX.test(v.trim()); }

export default function SolicitudPaso1Page(){
  // Form state
  const [cpOrigen, setCpOrigen] = useState("");
  const [cpDestino, setCpDestino] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [condicion, setCondicion] = useState<string>("");
  const [cuando, setCuando] = useState<Cuando>("inmediato");
  const [fechaProgramada, setFechaProgramada] = useState("");

  // UI state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [cotizacion, setCotizacion] = useState<any>(null);
  const [cotizacionError, setCotizacionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [manualSent, setManualSent] = useState(false);

  const hasLoadedRef = useRef(false);

  // Load from localStorage
  useEffect(()=>{
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const d = JSON.parse(raw);
        if(d.cpOrigen) setCpOrigen(d.cpOrigen);
        if(d.cpDestino) setCpDestino(d.cpDestino);
        if(d.marca) setMarca(d.marca);
        if(d.modelo) setModelo(d.modelo);
        if(d.condicion) setCondicion(d.condicion);
        if(d.cuando) setCuando(d.cuando);
        if(d.fechaProgramada) setFechaProgramada(d.fechaProgramada);
      }
    } catch {}
    hasLoadedRef.current = true;
  },[]);

  // Auto-guardado
  useEffect(()=>{
    if(!hasLoadedRef.current) return;
    const data = { cpOrigen, cpDestino, marca, modelo, condicion, cuando, fechaProgramada };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); setSaved(true); const t=setTimeout(()=>setSaved(false),1200); return ()=>clearTimeout(t);} catch {}
  },[cpOrigen,cpDestino,marca,modelo,condicion,cuando,fechaProgramada]);

  // Validaciones
  const errors = useMemo(()=>{
    const e: Record<string,string> = {};
    if(cpOrigen && !fieldValidCp(cpOrigen)) e.cpOrigen = "El Código Postal debe tener 5 dígitos.";
    if(cpDestino && !fieldValidCp(cpDestino)) e.cpDestino = "El Código Postal debe tener 5 dígitos.";
    // Mostrar required solo si touched y vacío no es helper pero podemos marcar
    return e;
  },[cpOrigen,cpDestino]);

  const cpOrigenError = (touched.cpOrigen || cpOrigen.length>0) && !fieldValidCp(cpOrigen) ? "El Código Postal debe tener 5 dígitos." : null;
  const cpDestinoError = (touched.cpDestino || cpDestino.length>0) && !fieldValidCp(cpDestino) ? (cpDestino.length>0 ? "El Código Postal debe tener 5 dígitos." : null) : null;
  // Para destino si no hay helper pero spec dice muestra helper/error si no cumple formato de 5 dígitos -> usamos mismo mensaje
  const showCpDestinoHelper = !cpDestinoError && cpDestino.length>0 && !fieldValidCp(cpDestino);

  const isCpOrigenValid = fieldValidCp(cpOrigen);
  const isCpDestinoValid = fieldValidCp(cpDestino);
  const isMarcaValid = marca.trim().length>0;
  const isModeloValid = modelo.trim().length>0;
  const isCondicionValid = condicion.length>0;
  const isFechaValid = cuando==="inmediato" ? true : (fechaProgramada.length>0 && !isNaN(new Date(fechaProgramada).getTime()));

  const isFormMinValid = isCpOrigenValid && isCpDestinoValid && isMarcaValid && isModeloValid && isCondicionValid && isFechaValid;
  const canContinuar = !!cotizacion && isFormMinValid && !loading;

  // Cálculo dinámico — debounce 650ms
  useEffect(()=>{
    if(!isFormMinValid){
      setCotizacion(null);
      setCotizacionError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setCotizacionError(null);
    const controller = new AbortController();
    const t = setTimeout(async ()=>{
      try {
        const res = await fetch("/api/cotizar",{
          method:"POST",
          headers:{ "Content-Type":"application/json"},
          body: JSON.stringify({
            cpOrigen: cpOrigen.trim(),
            cpDestino: cpDestino.trim(),
            marca,
            modelo,
            condicion,
            cuando,
            fechaProgramada: cuando==="programado" ? fechaProgramada : undefined,
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if(!res.ok){
          setCotizacion(null);
          const msg = data.errors ? Object.values(data.errors).join(" ") : data.error ?? "No se pudo cotizar";
          setCotizacionError(msg);
        } else {
          setCotizacion(data);
          setCotizacionError(null);
        }
      } catch (err:any){
        if(err?.name!=="AbortError"){
          setCotizacion(null);
          setCotizacionError("Error de conexión. Intenta de nuevo.");
        }
      } finally {
        setLoading(false);
      }
    },650);
    return ()=>{ clearTimeout(t); controller.abort(); };
  },[cpOrigen,cpDestino,marca,modelo,condicion,cuando,fechaProgramada,isFormMinValid]);

  // Persistir cotización para Paso 2 (tarifa aceptada)
  useEffect(()=>{
    try {
      if(cotizacion) {
        localStorage.setItem("ruum_cotizacion_result", JSON.stringify(cotizacion));
        localStorage.setItem("ruum_last_cotizacion", JSON.stringify(cotizacion));
      }
    } catch {}
  },[cotizacion]);

  const handleGuardarManual = ()=>{
    // Persist and show confirmation
    const payload = { cpOrigen, cpDestino, marca, modelo, condicion, cuando, fechaProgramada, origen:"manual_review" };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch {}
    setManualSent(true);
    setTimeout(()=>setManualSent(false),3000);
  };

  const clearForm = ()=>{
    setCpOrigen(""); setCpDestino(""); setMarca(""); setModelo(""); setCondicion(""); setCuando("inmediato"); setFechaProgramada("");
    setCotizacion(null); setCotizacionError(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <div className="max-w-[960px] mx-auto pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#ff4d11] bg-[#ff4d11]/10 border border-[#ff4d11]/20 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-[#ff4d11] animate-pulse"/> PASO 1 DE 5 • COTIZACIÓN
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mt-3">Solicita tu traslado</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-[560px]">Completa los datos de ruta y vehículo para calcular tu tarifa al instante. Guardado automático activo.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${saved ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500"}`}>
            {saved ? <><CheckCircle2 className="w-3 h-3"/> Guardado automático</> : <>💾 Guardado automático</>}
          </span>
          <button onClick={clearForm} className="text-slate-500 hover:text-slate-700 underline-offset-4 hover:underline">Limpiar</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.35fr_0.85fr] gap-6 items-start">
        {/* Form */}
        <Card className="p-5 lg:p-6">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-[#ff4d11] rounded-full transition-all" style={{width: isFormMinValid ? "55%" : "22%"}}/>
            </div>
            <span className="text-xs font-semibold text-slate-500">Paso 1</span>
          </div>

          {/* Grid fields — 2 cols desktop, 1 mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* CP Origen */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-[#ff4d11]"/> Código Postal de origen <span className="text-red-500">*</span></label>
              <input
                inputMode="numeric"
                maxLength={5}
                placeholder="Ej. 37000"
                value={cpOrigen}
                onChange={e=> setCpOrigen(e.target.value.replace(/\D/g,"").slice(0,5))}
                onBlur={()=>setTouched(s=>({...s, cpOrigen:true}))}
                className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${cpOrigenError ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
              />
              <p className={`text-[11px] mt-1.5 min-h-[16px] ${cpOrigenError ? "text-red-600 font-medium" : "text-slate-400"}`}>
                {cpOrigenError ? cpOrigenError : "Exactamente 5 dígitos numéricos."}
              </p>
            </div>

            {/* CP Destino */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><MapPin className="w-3 h-3 text-emerald-600"/> Código Postal de destino <span className="text-red-500">*</span></label>
              <input
                inputMode="numeric"
                maxLength={5}
                placeholder="Ej. 76100"
                value={cpDestino}
                onChange={e=> setCpDestino(e.target.value.replace(/\D/g,"").slice(0,5))}
                onBlur={()=>setTouched(s=>({...s, cpDestino:true}))}
                className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${cpDestinoError ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
              />
              <p className={`text-[11px] mt-1.5 min-h-[16px] ${cpDestinoError ? "text-red-600 font-medium" : "text-slate-400"}`}>
                {cpDestinoError ? "El Código Postal debe tener 5 dígitos." : showCpDestinoHelper ? "Formato: 5 dígitos." : "Obligatorio. Exactamente 5 dígitos numéricos."}
              </p>
            </div>

            {/* Marca */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Car className="w-3 h-3"/> Marca <span className="text-red-500">*</span></label>
              <select
                value={marca}
                onChange={e=> setMarca(e.target.value)}
                onBlur={()=>setTouched(s=>({...s, marca:true}))}
                className={`mt-1.5 w-full h-10 rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${(!isMarcaValid && touched.marca) ? "border-red-300" : "border-slate-200"}`}
              >
                <option value="">Selecciona marca</option>
                {MARCAS.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5 min-h-[16px]">{(!isMarcaValid && touched.marca) ? <span className="text-red-600 font-medium">Requerido para el cálculo.</span> : "Requerido para el cálculo."}</p>
            </div>

            {/* Modelo */}
            <div>
              <label className="text-xs font-bold text-slate-700">Modelo <span className="text-red-500">*</span></label>
              <input
                placeholder="Escribe el modelo"
                value={modelo}
                onChange={e=> setModelo(e.target.value)}
                onBlur={()=>setTouched(s=>({...s, modelo:true}))}
                className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${(!isModeloValid && touched.modelo) ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
              />
              <p className="text-[11px] text-slate-400 mt-1.5 min-h-[16px]">{(!isModeloValid && touched.modelo) ? <span className="text-red-600 font-medium">Requerido para el cálculo.</span> : "Ej. Jetta, Civic, NP300"}</p>
            </div>

            {/* Condición */}
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Wrench className="w-3 h-3"/> Condición <span className="text-red-500">*</span></label>
              <select
                value={condicion}
                onChange={e=> setCondicion(e.target.value)}
                onBlur={()=>setTouched(s=>({...s, condicion:true}))}
                className={`mt-1.5 w-full h-10 rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${(!isCondicionValid && touched.condicion) ? "border-red-300" : "border-slate-200"}`}
              >
                <option value="">Selecciona condición</option>
                {CONDICIONES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5 min-h-[16px]">{(!isCondicionValid && touched.condicion) ? <span className="text-red-600 font-medium">Requerido para definir tipo de grúa/traslado.</span> : "Requerido para definir tipo de grúa/traslado."}</p>
            </div>

            {/* Cuando */}
            <div className="lg:col-span-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Clock className="w-3 h-3"/> ¿Cuándo necesitas el traslado? <span className="text-red-500">*</span></label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={()=>setCuando("inmediato")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left flex items-center gap-2 transition ${cuando==="inmediato" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}`}
                >
                  <span className="text-base">⚡</span> Lo antes posible
                </button>
                <button
                  type="button"
                  onClick={()=>setCuando("programado")}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left flex items-center gap-2 transition ${cuando==="programado" ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"}`}
                >
                  <span className="text-base">📅</span> Programar fecha
                </button>
              </div>
              {cuando==="programado" && (
                <div className="mt-3">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1"><Calendar className="w-3 h-3"/> Fecha programada</label>
                  <input
                    type="date"
                    value={fechaProgramada}
                    onChange={e=> setFechaProgramada(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11]"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Selecciona día y el sistema asigna tarifa nocturna/diurna automáticamente.</p>
                </div>
              )}
            </div>
          </div>

          {/* Helper bottom for a11y */}
          {!isFormMinValid && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
              <span>Completa todos los campos obligatorios para calcular tu tarifa. Los CP deben tener 5 dígitos.</span>
            </div>
          )}
        </Card>

        {/* Tarifa + CTAs — Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-[80px]">
          <Card className="overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-xs font-black tracking-[0.14em] text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ff4d11]"/> TARIFA DE TU TRASLADO
              </h3>
            </div>

            {/* Estado Incompleto */}
            {!isFormMinValid && !loading && !cotizacion && (
              <div className="px-5 pb-5">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white border grid place-items-center mx-auto text-slate-400"><FileSearch className="w-5 h-5"/></div>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">Completa el CP de origen y destino, vehículo y fecha para conocer tu tarifa antes de llenar el resto del formulario.</p>
                  <div className="mt-4 grid gap-2">
                    <div className="h-3 rounded-full bg-slate-200 animate-pulse"/>
                    <div className="h-3 rounded-full bg-slate-200 animate-pulse w-3/4 mx-auto"/>
                    <div className="h-8 rounded-xl bg-slate-200 animate-pulse mt-2"/>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 text-center">El precio permanece oculto hasta validar todos los campos.</p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="px-5 pb-5 space-y-3">
                <div className="rounded-2xl bg-slate-900 p-5">
                  <div className="h-3 w-24 rounded bg-white/20 animate-pulse"/>
                  <div className="h-8 w-40 rounded bg-white/20 animate-pulse mt-3"/>
                  <div className="h-3 w-56 rounded bg-white/10 animate-pulse mt-2"/>
                </div>
                <div className="space-y-2">
                  <div className="h-4 rounded-lg bg-slate-100 animate-pulse"/>
                  <div className="h-4 rounded-lg bg-slate-100 animate-pulse w-5/6"/>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin"/> Calculando tarifa con TAD v2.0...</div>
              </div>
            )}

            {/* Estado Calculado */}
            {!loading && cotizacion && (
              <div className="px-5 pb-5 space-y-4">
                <div className="rounded-2xl bg-slate-900 text-white p-5 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10"/>
                  <div className="text-[11px] tracking-widest font-bold opacity-60">TOTAL ESTIMADO</div>
                  <div className="text-3xl font-black mt-1">{money(cotizacion.tarifa)}</div>
                  <div className="text-xs opacity-70 mt-1">MXN • Fee TAD {money(cotizacion.desglose.tad)} + gastos estimados</div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="bg-white/15 border border-white/10 rounded-full px-2 py-1">{cotizacion.meta.distanciaKm} km • {cotizacion.meta.horas}h</span>
                    <span className="bg-white/15 border border-white/10 rounded-full px-2 py-1">{cotizacion.meta.segmento} • {cotizacion.meta.gama}</span>
                    <span className="bg-emerald-500 text-white rounded-full px-2 py-1 font-bold">✓ Cotizado</span>
                  </div>
                </div>

                <div className="rounded-xl border bg-slate-50 p-3 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Tarifa base</span><span className="font-medium">{money(cotizacion.desglose.tarifaBase)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{cotizacion.desglose.tramo}</span><span className="font-medium">{money(cotizacion.desglose.costoDistancia)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tiempo {cotizacion.desglose.costoTiempo>0 ? `${cotizacion.meta.horas}h` : "—"}</span><span className="font-medium">{money(cotizacion.desglose.costoTiempo)}</span></div>
                  <div className="h-px bg-slate-200"/>
                  <div className="flex justify-between"><span className="text-slate-500">Combustible estimado</span><span>{money(cotizacion.gastosEstimados.combustible)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Casetas estimado</span><span>{money(cotizacion.gastosEstimados.casetas)}</span></div>
                  <div className="flex justify-between font-bold text-sm"><span>Total con gastos</span><span>{money(cotizacion.totalConGastos)}</span></div>
                </div>

                <div className="text-[11px] text-slate-400 flex gap-1.5 items-start">
                  <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0"/> Incluye multiplicadores: activo ×{cotizacion.desglose.mActivo.toFixed(2)} • temporal ×{cotizacion.desglose.mTemporal.toFixed(2)} • urgencia ×{cotizacion.desglose.mUrgencia.toFixed(2)}
                </div>

                {cotizacion.desglose.isMinimaAplicada && <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2">Se aplicó tarifa mínima {money(cotizacion.desglose.tarifaMinima)}.</div>}
              </div>
            )}

            {/* Error */}
            {!loading && cotizacionError && (
              <div className="px-5 pb-5">
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/> {cotizacionError}</div>
              </div>
            )}

            {/* CTAs */}
            <div className="px-5 pb-5 space-y-3 border-t bg-white">
              <Button
                disabled={!canContinuar}
                onClick={()=>{
                  try {
                    localStorage.setItem("ruum_solicitud_paso2_ready","1");
                    if(cotizacion) {
                      localStorage.setItem("ruum_cotizacion_result", JSON.stringify(cotizacion));
                      localStorage.setItem("ruum_last_cotizacion", JSON.stringify(cotizacion));
                    }
                  } catch {}
                  window.location.href = "/solicitud/paso2";
                }}
                className="w-full h-11 text-sm font-bold gap-2 disabled:opacity-40"
              >
                Continuar con mi solicitud <ArrowRight className="w-4 h-4"/>
              </Button>
              <p className="text-[11px] text-slate-400 text-center -mt-1">{!canContinuar ? "Se habilita al calcular tu tarifa" : "Avanza al Paso 2: ¿Qué vehículo trasladamos?"}</p>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"/></div>
                <div className="relative flex justify-center"><span className="bg-white px-2 text-[11px] text-slate-400">¿No pudimos cotizar tu ruta?</span></div>
              </div>

              <button
                onClick={handleGuardarManual}
                className="w-full rounded-xl border border-slate-200 bg-white hover:bg-slate-50 h-10 text-sm font-medium flex items-center justify-center gap-2"
              >
                <FileSearch className="w-4 h-4"/> Solicitar revisión manual
              </button>
              <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1"><ShieldCheck className="w-3 h-3"/> Operación confirmará tu tarifa antes de asignar conductor.</p>
              {manualSent && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-2.5 text-center flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Solicitud enviada. Te contactaremos para confirmar tarifa.</div>}
            </div>
          </Card>

          {/* Trust / info */}
          <div className="hidden lg:block rounded-2xl border bg-white p-4 text-xs text-slate-500 leading-relaxed">
            <div className="font-bold text-slate-700">¿Cómo calculamos tu tarifa?</div>
            <p className="mt-1">Usamos el Tarifador Automático Dinámico (TAD v2.0): distancia progresiva + tiempo + multiplicadores de activo, temporalidad y urgencia. Los gastos de combustible y casetas se suman al final.</p>
            <Link href="/tarifas" className="text-[#ff4d11] font-medium hover:underline mt-2 inline-flex">Ver matrices TAD →</Link>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2">
          <button onClick={handleGuardarManual} className="flex-1 rounded-xl border border-slate-200 bg-white h-11 text-xs font-semibold">Revisión manual</button>
          <Button disabled={!canContinuar} onClick={()=> {
            try {
              localStorage.setItem("ruum_solicitud_paso2_ready","1");
              if(cotizacion) {
                localStorage.setItem("ruum_cotizacion_result", JSON.stringify(cotizacion));
                localStorage.setItem("ruum_last_cotizacion", JSON.stringify(cotizacion));
              }
            } catch {}
            window.location.href="/solicitud/paso2";
          }} className="flex-[1.4] h-11 text-sm font-bold">Continuar <ArrowRight className="w-4 h-4 ml-1"/></Button>
        </div>
        {!canContinuar && <p className="text-[11px] text-slate-400 text-center mt-1.5">Completa todos los campos para continuar</p>}
      </div>
    </div>
  );
}
