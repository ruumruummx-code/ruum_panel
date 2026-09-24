"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { Card, Button } from "@/components/ui";
import { money } from "@/lib/utils";
import {
  Car,
  Wrench,
  Cog,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Clock,
  History,
  Loader2,
  Info,
  FileText,
  Hash,
  Palette,
} from "lucide-react";
import Link from "next/link";

// Constantes
const STORAGE_PASO1 = "ruum_solicitud_paso1";
const STORAGE_PASO2 = "ruum_solicitud_paso2";
const STORAGE_COTIZACION = "ruum_cotizacion_result";
const STORAGE_PASO2_PENDING = "ruum_solicitud_paso2_has_pending";

const MARCAS = [
  "Acura","Audi","BMW","BYD","Chevrolet","Chrysler","Dodge","Fiat","Ford","GMC","Honda","Hyundai","Jaguar","Jeep","Kia","Land Rover","Lexus","Lincoln","Mazda","Mercedes-Benz","MG","Mini","Mitsubishi","Nissan","Peugeot","Porsche","RAM","Renault","Seat","Subaru","Suzuki","Tesla","Toyota","Volkswagen","Volvo",
];

const TRANSMISIONES = ["Automática", "Manual", "Eléctrica"] as const;
const CONDICIONES = ["Nueva", "Seminueva", "Usada"] as const;
const ESTADOS_GENERAL = ["Excelente", "Bueno", "Regular", "Daños visibles"] as const;
const COLORES = ["Blanco","Negro","Plata","Gris","Rojo","Azul","Verde","Beige","Café","Amarillo","Naranja"];

const CURRENT_YEAR = new Date().getFullYear();
const ANIOS = Array.from({ length: CURRENT_YEAR + 1 - 1990 + 1 }, (_, i) => CURRENT_YEAR + 1 - i);

// Mock historial vehículos registrados
const HISTORIAL_MOCK = [
  { id: "VH-101", marca: "Mazda", modelo: "3", anio: 2023, transmision: "Automática" as const, condicion: "Seminueva" as const, color: "Rojo", placas: "GHT-341-A", vin: "1HGCM82633A123456", segmento: "Subcompacto / Compacto", gama: "Media" },
  { id: "VH-102", marca: "Nissan", modelo: "NP300", anio: 2024, transmision: "Manual" as const, condicion: "Nueva" as const, color: "Blanco", placas: "PQR-112-C", vin: "3N1AB7AP0KY123457", segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  { id: "VH-103", marca: "Volkswagen", modelo: "Jetta", anio: 2022, transmision: "Automática" as const, condicion: "Usada" as const, color: "Plata", placas: "JKL-882-B", vin: "3VWDX7AJ5DM123458", segmento: "Subcompacto / Compacto", gama: "Media" },
];

type Clasificacion = { segmento: string; gama: string; confidence?: string } | null;

export default function SolicitudPaso2Page() {
  // Form fields - requeridos paso 2
  const [transmision, setTransmision] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [condicion, setCondicion] = useState<string>("");
  const [anio, setAnio] = useState<string>("");

  // Detalles profundos - acordeón
  const [color, setColor] = useState("");
  const [placas, setPlacas] = useState("");
  const [vin, setVin] = useState("");
  const [estadoGeneral, setEstadoGeneral] = useState("");
  const [docTarjeta, setDocTarjeta] = useState(false);
  const [docIne, setDocIne] = useState(false);

  // UI
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [clasificacion, setClasificacion] = useState<Clasificacion>(null);
  const [clasificacionLoading, setClasificacionLoading] = useState(false);
  const [clasificacionError, setClasificacionError] = useState<string | null>(null);
  const [modelosCatalogo, setModelosCatalogo] = useState<string[]>([]);
  const [modelosLoading, setModelosLoading] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [tarifa, setTarifa] = useState<number | null>(null);
  const [hasPendingDetails, setHasPendingDetails] = useState(false);

  const hasLoadedRef = useRef(false);
  const marcaModeloRef = useRef({ marca, modelo });

  // Cargar paso 1 + paso 2 + tarifa
  useEffect(() => {
    try {
      const raw1 = localStorage.getItem(STORAGE_PASO1);
      if (raw1) {
        const d = JSON.parse(raw1);
        if (d.marca && !marca) setMarca(d.marca);
        if (d.modelo && !modelo) setModelo(d.modelo);
        if (d.condicion && !condicion) {
          // Normaliza condicion paso1 "Nueva" etc.
          const c = String(d.condicion).trim();
          const norm = c.charAt(0).toUpperCase() + c.slice(1).toLowerCase();
          if ((CONDICIONES as readonly string[]).includes(norm)) setCondicion(norm);
          else if (c.toLowerCase() === "nueva") setCondicion("Nueva");
          else if (c.toLowerCase().includes("semi")) setCondicion("Seminueva");
          else if (c.toLowerCase().includes("usad")) setCondicion("Usada");
        }
      }
      const raw2 = localStorage.getItem(STORAGE_PASO2);
      if (raw2) {
        const d = JSON.parse(raw2);
        if (d.transmision) setTransmision(d.transmision);
        if (d.marca) setMarca(d.marca);
        if (d.modelo) setModelo(d.modelo);
        if (d.condicion) setCondicion(d.condicion);
        if (d.anio) setAnio(String(d.anio));
        if (d.color) setColor(d.color);
        if (d.placas) setPlacas(d.placas);
        if (d.vin) setVin(d.vin);
        if (d.estadoGeneral) setEstadoGeneral(d.estadoGeneral);
        if (typeof d.docTarjeta === "boolean") setDocTarjeta(d.docTarjeta);
        if (typeof d.docIne === "boolean") setDocIne(d.docIne);
      }
      // Tarifa desde cotización
      const rawCot = localStorage.getItem(STORAGE_COTIZACION);
      if (rawCot) {
        const c = JSON.parse(rawCot);
        if (c.tarifa) setTarifa(c.tarifa);
        else if (c.totalConGastos) setTarifa(c.totalConGastos);
      } else {
        // Intentar recuperar de último fetch cotizar guardado en session? fallback
        const rawLast = localStorage.getItem("ruum_last_cotizacion");
        if (rawLast) {
          try { const j = JSON.parse(rawLast); if (j.tarifa) setTarifa(j.tarifa); } catch {}
        }
      }
      // También intentar leer historial si existe
    } catch {}
    hasLoadedRef.current = true;
  }, []);

  // Fetch modelos cuando cambia marca (catálogo ligado)
  useEffect(() => {
    if (!marca) { setModelosCatalogo([]); return; }
    const m = marca.trim();
    if (m.length < 2) { setModelosCatalogo([]); return; }
    setModelosLoading(true);
    const ctrl = new AbortController();
    fetch(`/api/vehiculos?marca=${encodeURIComponent(m)}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error("no catalog");
        const j = await r.json();
        if (j.modelos && Array.isArray(j.modelos)) {
          setModelosCatalogo(j.modelos.map((x: any) => x.modelo));
        } else {
          setModelosCatalogo([]);
        }
      })
      .catch(() => setModelosCatalogo([]))
      .finally(() => setModelosLoading(false));
    return () => ctrl.abort();
  }, [marca]);

  // Clasificación automática asíncrona (marca + modelo)
  useEffect(() => {
    const m = marca.trim();
    const mo = modelo.trim();
    if (!m || !mo) {
      setClasificacion(null);
      setClasificacionError(null);
      setClasificacionLoading(false);
      return;
    }
    // Evitar request si no cambió
    if (marcaModeloRef.current.marca === m && marcaModeloRef.current.modelo === mo && clasificacion) return;
    setClasificacionLoading(true);
    setClasificacionError(null);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vehiculos?marca=${encodeURIComponent(m)}&modelo=${encodeURIComponent(mo)}`, { signal: ctrl.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo clasificar");
        setClasificacion({ segmento: data.segmento, gama: data.gama, confidence: data.confidence });
        marcaModeloRef.current = { marca: m, modelo: mo };
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setClasificacion(null);
          setClasificacionError(e?.message ?? "Error clasificando");
        }
      } finally {
        setClasificacionLoading(false);
      }
    }, 400);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [marca, modelo]);

  // Cálculo de pendiente detalles
  useEffect(() => {
    const pending = !color || !placas || !vin || !estadoGeneral;
    setHasPendingDetails(pending);
    // Guardar bandera para paso 5
    try {
      if (hasLoadedRef.current) {
        localStorage.setItem(STORAGE_PASO2_PENDING, pending ? "true" : "false");
      }
    } catch {}
  }, [color, placas, vin, estadoGeneral]);

  // Auto-guardado borrador
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const payload = { transmision, marca, modelo, condicion, anio, color, placas, vin, estadoGeneral, docTarjeta, docIne, has_pending_vehicle_details: hasPendingDetails, updatedAt: new Date().toISOString() };
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_PASO2, JSON.stringify(payload));
        const now = new Date();
        setSavedAt(now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1200);
      } catch {}
    }, 700);
    return () => clearTimeout(t);
  }, [transmision, marca, modelo, condicion, anio, color, placas, vin, estadoGeneral, docTarjeta, docIne, hasPendingDetails]);

  // Validaciones
  const isTransmisionValid = (TRANSMISIONES as readonly string[]).includes(transmision);
  const isMarcaValid = marca.trim().length >= 2;
  const isModeloValid = modelo.trim().length >= 1;
  const isCondicionValid = (CONDICIONES as readonly string[]).includes(condicion as any);
  const anioNum = parseInt(anio, 10);
  const isAnioValid = !isNaN(anioNum) && anioNum >= 1990 && anioNum <= CURRENT_YEAR + 1;

  const isPaso2MinValid = isTransmisionValid && isMarcaValid && isModeloValid && isCondicionValid && isAnioValid;
  const canContinuar = isPaso2MinValid; // progresiva: permite avanzar aunque detalles pendientes
  const showPendingWarning = isPaso2MinValid && hasPendingDetails;

  const handleSelectHistorial = (vh: typeof HISTORIAL_MOCK[0]) => {
    setMarca(vh.marca);
    setModelo(vh.modelo);
    setAnio(String(vh.anio));
    setTransmision(vh.transmision);
    setCondicion(vh.condicion);
    setColor(vh.color);
    setPlacas(vh.placas);
    setVin(vh.vin);
    // Clasificación se disparará automáticamente
    setTouched((s) => ({ ...s, marca: true, modelo: true, transmision: true, condicion: true, anio: true }));
  };

  const clearPaso2 = () => {
    setTransmision(""); setMarca(""); setModelo(""); setCondicion(""); setAnio("");
    setColor(""); setPlacas(""); setVin(""); setEstadoGeneral(""); setDocTarjeta(false); setDocIne(false);
    try { localStorage.removeItem(STORAGE_PASO2); localStorage.removeItem(STORAGE_PASO2_PENDING); } catch {}
  };

  return (
    <div className="max-w-[1080px] mx-auto pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#ff4d11] bg-[#ff4d11]/10 border border-[#ff4d11]/20 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-[#ff4d11] animate-pulse" /> PASO 2 DE 5 • VEHÍCULO
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight mt-3 flex items-center gap-2">
            <Car className="w-7 h-7 text-slate-900" /> ¿Qué vehículo trasladamos?
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-[560px]">Especificaciones técnicas para clasificar automáticamente categoría, gama y tipo. Puedes precargar desde tu historial.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors ${savedFlash ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500"}`}>
            {savedFlash ? <><CheckCircle2 className="w-3 h-3" /> Guardado hace unos segundos</> : savedAt ? <>💾 Guardado {savedAt}</> : <>💾 Guardado automático</>}
          </span>
          <button onClick={clearPaso2} className="text-slate-500 hover:text-slate-700 underline-offset-4 hover:underline">Limpiar</button>
          <Link href="/solicitud" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver
          </Link>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden flex">
          <div className="h-full bg-[#ff4d11] rounded-full transition-all" style={{ width: "40%" }} />
          <div className="h-full bg-slate-200" style={{ width: "60%" }} />
        </div>
        <span className="text-xs font-bold text-slate-600">Paso 2 / 5</span>
        <span className="text-xs text-slate-400 hidden sm:inline">• Especificaciones técnicas</span>
      </div>

      {/* Historial / Vehículos registrados */}
      <Card className="p-4 mb-6 border-slate-200">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <History className="w-4 h-4 text-[#ff4d11]" /> Vehículos registrados
          <span className="ml-2 text-xs font-normal text-slate-500">Selecciona para precargar</span>
          <span className="ml-auto text-xs font-normal text-slate-400">3 en historial</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          {HISTORIAL_MOCK.map((vh) => (
            <button
              key={vh.id}
              onClick={() => handleSelectHistorial(vh)}
              className="text-left rounded-xl border border-slate-200 hover:border-[#ff4d11]/40 hover:bg-[#ff4d11]/5 p-3 transition group"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white grid place-items-center text-xs font-bold">{vh.marca.slice(0, 2).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold leading-none">{vh.marca} {vh.modelo}</div>
                  <div className="text-xs text-slate-500">{vh.anio} • {vh.transmision} • {vh.placas}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#ff4d11] transition" />
              </div>
              <div className="mt-2 flex gap-1.5 flex-wrap">
                <span className="text-[11px] bg-slate-100 border rounded-full px-2 py-0.5">{vh.segmento}</span>
                <span className="text-[11px] bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-0.5">{vh.gama}</span>
              </div>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-3">Tip: al seleccionar se autocompletan marca, modelo, año, transmisión y detalles.</p>
      </Card>

      <div className="grid lg:grid-cols-[1.45fr_0.85fr] gap-6 items-start">
        {/* Columna izquierda: Ficha + Form */}
        <div className="space-y-6">
          {/* Ficha de Clasificación Automática */}
          <Card className="overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b bg-slate-50/50 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff4d11]" />
              <h3 className="text-xs font-black tracking-[0.14em] text-slate-700">FICHA DE CLASIFICACIÓN AUTOMÁTICA</h3>
              <span className="ml-auto text-[11px] text-slate-500 flex items-center gap-1"><Info className="w-3 h-3" /> Calculado por marca, modelo y condición</span>
            </div>
            <div className="p-4">
              {clasificacionLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 animate-pulse">
                      <div className="h-3 w-12 bg-slate-200 rounded" />
                      <div className="h-5 w-20 bg-slate-200 rounded mt-2" />
                    </div>
                  ))}
                </div>
              ) : clasificacion ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border bg-white p-3 text-center">
                    <div className="text-[11px] tracking-widest font-bold text-slate-500">GAMA</div>
                    <div className="text-sm font-black mt-1">{clasificacion.gama}</div>
                    <div className="text-[11px] text-slate-400 mt-1 capitalize">{clasificacion.confidence}</div>
                  </div>
                  <div className="rounded-xl border bg-slate-900 text-white p-3 text-center">
                    <div className="text-[11px] tracking-widest font-bold opacity-60">SEGMENTO</div>
                    <div className="text-sm font-black mt-1 leading-tight">{clasificacion.segmento}</div>
                  </div>
                  <div className="rounded-xl border bg-white p-3 text-center">
                    <div className="text-[11px] tracking-widest font-bold text-slate-500">CONDICIÓN</div>
                    <div className="text-sm font-black mt-1">{condicion || "—"}</div>
                    <div className="text-[11px] text-slate-400 mt-1">{condicion ? "Seleccionada" : "Pendiente"}</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  <Car className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="mt-2">Ingresa <b>Marca</b> y <b>Modelo</b> para calcular automáticamente <b>Gama</b> y <b>Segmento</b>. La <b>Condición</b> se toma del selector inferior.</p>
                  {clasificacionError && <p className="text-xs text-amber-600 mt-2">{clasificacionError}</p>}
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3 h-3" /> Regla de negocio: se reclasifica automáticamente al cambiar Marca/Modelo vía <code className="bg-slate-100 border rounded px-1">/api/vehiculos?marca=&modelo=</code> (debounce 400ms).
              </div>
            </div>
          </Card>

          {/* Campos de Entrada */}
          <Card className="p-5 lg:p-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#ff4d11]" /> Especificaciones técnicas
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              {/* Transmisión */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Cog className="w-3 h-3" /> Transmisión <span className="text-red-500">*</span></label>
                <select
                  value={transmision}
                  onChange={(e) => setTransmision(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, transmision: true }))}
                  className={`mt-1.5 w-full h-10 rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${!isTransmisionValid && touched.transmision ? "border-red-300" : "border-slate-200"}`}
                >
                  <option value="">Selecciona transmisión</option>
                  {TRANSMISIONES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5 min-h-[16px]">
                  {!isTransmisionValid && touched.transmision ? <span className="text-red-600 font-medium">Obligatorio. Elige una opción.</span> : "Obligatorio. Automática / Manual / Eléctrica"}
                </p>
              </div>

              {/* Marca */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Car className="w-3 h-3" /> Marca <span className="text-red-500">*</span></label>
                <input
                  list="marcas-list"
                  placeholder="Ej. Toyota"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, marca: true }))}
                  className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${!isMarcaValid && touched.marca ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                />
                <datalist id="marcas-list">
                  {MARCAS.map((m) => <option key={m} value={m} />)}
                </datalist>
                <p className="text-[11px] text-slate-400 mt-1.5 min-h-[16px]">
                  {!isMarcaValid && touched.marca ? <span className="text-red-600 font-medium">Ingresa al menos 2 caracteres.</span> : "Selecciona una marca del catálogo o escribe libremente."}
                </p>
              </div>

              {/* Modelo */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Modelo <span className="text-red-500">*</span></label>
                <input
                  list="modelos-list"
                  placeholder={modelosCatalogo.length ? `Ej. ${modelosCatalogo[0]}` : "Ej. Hilux, Versa, Jetta"}
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, modelo: true }))}
                  className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${!isModeloValid && touched.modelo ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                />
                <datalist id="modelos-list">
                  {modelosCatalogo.map((m) => <option key={m} value={m} />)}
                </datalist>
                <p className="text-[11px] text-slate-400 mt-1.5 min-h-[16px] flex items-center gap-1">
                  {modelosLoading ? <><Loader2 className="w-3 h-3 animate-spin" /> Cargando modelos para {marca}…</> : !isModeloValid && touched.modelo ? <span className="text-red-600 font-medium">Obligatorio.</span> : modelosCatalogo.length ? `Catálogo ligado a ${marca}: ${modelosCatalogo.slice(0, 3).join(", ")}${modelosCatalogo.length > 3 ? "…" : ""}` : "Entrada de texto o catálogo ligado a la marca."}
                </p>
              </div>

              {/* Condición */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Wrench className="w-3 h-3" /> Condición <span className="text-red-500">*</span></label>
                <select
                  value={condicion}
                  onChange={(e) => setCondicion(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, condicion: true }))}
                  className={`mt-1.5 w-full h-10 rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${!isCondicionValid && touched.condicion ? "border-red-300" : "border-slate-200"}`}
                >
                  <option value="">Selecciona condición</option>
                  {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5 min-h-[16px]">
                  {!isCondicionValid && touched.condicion ? <span className="text-red-600 font-medium">Requerido.</span> : "Debe tener placeholder explícito."}
                </p>
              </div>

              {/* Año */}
              <div className="lg:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Año <span className="text-red-500">*</span></label>
                <select
                  value={anio}
                  onChange={(e) => setAnio(e.target.value)}
                  onBlur={() => setTouched((s) => ({ ...s, anio: true }))}
                  className={`mt-1.5 w-full h-10 rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11] ${!isAnioValid && touched.anio ? "border-red-300" : "border-slate-200"}`}
                >
                  <option value="">Selecciona año</option>
                  {ANIOS.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {!isAnioValid && touched.anio ? <span className="text-red-600 font-medium">Rango permitido 1990 - {CURRENT_YEAR + 1}.</span> : `Rango permitido 1990 - ${CURRENT_YEAR + 1}.`}
                </p>
              </div>
            </div>

            {!isPaso2MinValid && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex gap-2 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Completa Transmisión, Marca, Modelo, Condición y Año para habilitar el avance. La clasificación se recalcula automáticamente.</span>
              </div>
            )}
          </Card>
        </div>

        {/* Columna derecha: Tarifa + Detalles */}
        <div className="space-y-4 lg:sticky lg:top-[80px]">
          {/* Tarifa */}
          <Card className="overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b flex items-center justify-between">
              <h3 className="text-xs font-black tracking-[0.14em] text-slate-600">TARIFA ACEPTADA</h3>
              <Link href="/solicitud" className="text-xs font-bold text-[#ff4d11] hover:underline flex items-center gap-1">
                Editar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-5">
              <div className="rounded-2xl bg-slate-900 text-white p-5 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="text-[11px] tracking-widest font-bold opacity-60">MONTO FIJADO EN PASO 1</div>
                <div className="text-3xl font-black mt-1">{tarifa != null ? money(tarifa) : "—"}</div>
                <div className="text-xs opacity-70 mt-1">MXN • Incluye TAD v2.0</div>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] bg-white/15 border border-white/10 rounded-full px-2.5 py-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Cotización bloqueada
                </div>
              </div>
              {tarifa == null && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mt-3">
                  No se encontró tarifa del Paso 1. <Link href="/solicitud" className="underline font-bold">Vuelve a cotizar</Link> para fijar el monto.
                </p>
              )}
              <div className="mt-3 text-[11px] text-slate-500 flex gap-1.5">
                <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0" /> Puedes editar la cotización sin perder los datos del vehículo.
              </div>
            </div>
          </Card>

          {/* Acordeón Detalles */}
          <Card className="overflow-hidden">
            <button
              type="button"
              onClick={() => setAccordionOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 grid place-items-center text-amber-700">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold leading-none flex items-center gap-2">
                  Detalles del vehículo
                  {hasPendingDetails && <span className="bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5 text-[11px] font-bold">Requerido antes de confirmar</span>}
                  {!hasPendingDetails && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 text-[11px] font-bold">Completo</span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">color, placas, VIN, estado general y documentación</div>
              </div>
              {accordionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {accordionOpen && (
              <div className="px-5 pb-5 border-t bg-white space-y-4">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold">Requerido antes de confirmar:</span> color, placas, VIN, estado general y documentación. Puedes avanzar y volver, pero la solicitud no se enviará sin estos datos. Se validarán al intentar confirmar.
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Palette className="w-3 h-3" /> Color</label>
                    <select value={color} onChange={(e) => setColor(e.target.value)} className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20">
                      <option value="">Selecciona color</option>
                      {COLORES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Hash className="w-3 h-3" /> Placas</label>
                    <input placeholder="Ej. GHT-341-A" value={placas} onChange={(e) => setPlacas(e.target.value.toUpperCase())} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20" />
                    <p className="text-[11px] text-slate-400 mt-1">Formato libre, se normaliza a mayúsculas.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">VIN (17 caracteres)</label>
                    <input placeholder="1HGCM82633A123456" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17))} maxLength={17} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 font-mono" />
                    <p className={`text-[11px] mt-1 ${vin.length === 17 ? "text-emerald-600" : vin.length > 0 ? "text-amber-600" : "text-slate-400"}`}>{vin.length}/17 caracteres {vin.length === 17 ? "✓" : ""}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Estado general</label>
                    <select value={estadoGeneral} onChange={(e) => setEstadoGeneral(e.target.value)} className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20">
                      <option value="">Selecciona estado</option>
                      {ESTADOS_GENERAL.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="rounded-xl border bg-slate-50 p-3">
                    <div className="text-xs font-bold text-slate-700">Documentación</div>
                    <label className="flex items-center gap-2 mt-2 text-sm">
                      <input type="checkbox" checked={docTarjeta} onChange={(e) => setDocTarjeta(e.target.checked)} className="rounded border-slate-300" /> Tarjeta de circulación
                    </label>
                    <label className="flex items-center gap-2 mt-2 text-sm">
                      <input type="checkbox" checked={docIne} onChange={(e) => setDocIne(e.target.checked)} className="rounded border-slate-300" /> Identificación oficial
                    </label>
                    <p className="text-[11px] text-slate-400 mt-2">Se validará al confirmar en Paso 5.</p>
                  </div>
                </div>

                {hasPendingDetails && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs p-2.5 flex gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> Faltan datos para el expediente. Puedes avanzar al Paso 3, pero se marcará <b>has_pending_vehicle_details=true</b>.
                  </div>
                )}
              </div>
            )}
            {!accordionOpen && hasPendingDetails && (
              <div className="px-5 pb-3">
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Expediente incompleto. Despliega para completar.
                </div>
              </div>
            )}
          </Card>

          {/* CTAs */}
          <Card className="p-5 space-y-3">
            <Button
              disabled={!canContinuar}
              onClick={() => {
                try {
                  // Persist flag ya guardado por efecto, pero asegurar
                  localStorage.setItem(STORAGE_PASO2_PENDING, hasPendingDetails ? "true" : "false");
                  localStorage.setItem("ruum_solicitud_paso2_ready", "1");
                } catch {}
                window.location.href = "/solicitud/paso3";
              }}
              className="w-full h-11 text-sm font-bold gap-2 disabled:opacity-40"
            >
              Continuar al Paso 3 <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-[11px] text-slate-400 text-center">
              {!canContinuar ? "Completa los campos obligatorios para continuar" : hasPendingDetails ? "Avanzas con detalles pendientes — se solicitarán antes de pagar" : "Todo listo para el siguiente paso"}
            </p>
            <div className="flex gap-2">
              <Link href="/solicitud" className="flex-1">
                <Button variant="outline" className="w-full h-10 text-sm">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Regresar
                </Button>
              </Link>
              <button onClick={() => setAccordionOpen(true)} className="flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 h-10 text-sm font-medium">
                Completar detalles
              </button>
            </div>
            {showPendingWarning && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2 text-center">
                Avance progresivo activo: has_pending_vehicle_details = true
              </p>
            )}
          </Card>

          {/* Info sticky */}
          <div className="hidden lg:block rounded-2xl border bg-white p-4 text-xs text-slate-500 leading-relaxed">
            <div className="font-bold text-slate-700 flex items-center gap-1.5"><Info className="w-3 h-3" /> ¿Cómo funciona la clasificación?</div>
            <p className="mt-1">Usa el endpoint <code className="bg-slate-100 border rounded px-1">GET /api/vehiculos?marca=&modelo=</code> con debounce. Gama/Segmento vienen del catálogo TAD v2.0, Condición del selector.</p>
            <p className="mt-2">Auto-guardado en <code className="bg-slate-100 border rounded px-1">localStorage</code> con estado &quot;Guardado hace unos segundos&quot;.</p>
          </div>
        </div>
      </div>

      {/* Mobile fixed nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2">
          <Link href="/solicitud" className="flex-1"><Button variant="outline" className="w-full h-11 text-sm">Atrás</Button></Link>
          <Button disabled={!canContinuar} onClick={() => (window.location.href = "/solicitud/paso3")} className="flex-[1.4] h-11 text-sm font-bold">
            Continuar <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {!canContinuar && <p className="text-[11px] text-slate-400 text-center mt-1.5">Completa Transmisión, Marca, Modelo, Condición y Año</p>}
      </div>
    </div>
  );
}
