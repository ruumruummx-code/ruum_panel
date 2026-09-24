"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { money } from "@/lib/utils";
import {
  MapPin,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Route,
  Navigation,
  Phone,
  User,
  FileText,
  Loader2,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

// Storage keys
const STORAGE_PASO3 = "ruum_solicitud_paso3";
const STORAGE_COTIZACION = "ruum_cotizacion_result";

// Mapbox ahora vía backend proxy (token oculto en servidor)
// Frontend ya no expone NEXT_PUBLIC token — usa /api/mapbox/*

// Types
type Coords = [number, number]; // [lng, lat]
type Direccion = {
  search: string;
  cp: string;
  estado: string;
  ciudad: string;
  colonia: string;
  calle: string;
  numExt: string;
  numInt: string;
  referencias: string;
  coords: Coords | null;
  placeName: string;
  coloniasSugeridas: string[];
  _cpLoading?: boolean;
};

type Escala = Direccion & {
  id: string;
  tipo: "parada" | "tarea";
  descripcion: string;
};

type Contacto = {
  nombre: string;
  apellido: string;
  telefono: string;
};

const emptyDireccion = (): Direccion => ({
  search: "",
  cp: "",
  estado: "",
  ciudad: "",
  colonia: "",
  calle: "",
  numExt: "",
  numInt: "",
  referencias: "",
  coords: null,
  placeName: "",
  coloniasSugeridas: [],
});

const emptyEscala = (id: string): Escala => ({
  ...emptyDireccion(),
  id,
  tipo: "parada",
  descripcion: "",
});

const CP_REGEX = /^\d{5}$/;
const TEL_REGEX = /^\d{10}$/;

// Helper to parse Mapbox feature into Direccion partial
function parseMapboxFeature(feature: any): Partial<Direccion> {
  const coords: Coords | null = feature.center ? [feature.center[0], feature.center[1]] : null;
  const placeName: string = feature.place_name || feature.text || "";
  // Context contains place, region, postcode, etc.
  const context: any[] = feature.context || [];
  // Also properties
  const text = feature.text || "";
  const address = feature.address || "";
  // Intentar extraer componentes
  let cp = "";
  let ciudad = "";
  let estado = "";
  let colonia = "";
  let calle = text;

  // Buscar postcode
  const postcodeCtx = context.find((c: any) => c.id?.startsWith("postcode"));
  if (postcodeCtx) cp = postcodeCtx.text || "";
  // Si feature es postcode type, text es CP
  if (feature.id?.startsWith("postcode") && !cp) cp = feature.text || "";

  // Ciudad / place
  const placeCtx = context.find((c: any) => c.id?.startsWith("place"));
  if (placeCtx) ciudad = placeCtx.text || "";
  // locality
  const localityCtx = context.find((c: any) => c.id?.startsWith("locality"));
  if (localityCtx && !ciudad) ciudad = localityCtx.text || "";

  // Estado / region
  const regionCtx = context.find((c: any) => c.id?.startsWith("region"));
  if (regionCtx) estado = regionCtx.text || "";

  // Colonia / neighborhood
  const neighCtx = context.find((c: any) => c.id?.startsWith("neighborhood"));
  if (neighCtx) colonia = neighCtx.text || "";

  // Calle: si es address type, text es número, y context tiene street
  // Para simplificar, si feature.properties?.address y text
  // Si es address, feature.text es nombre calle?
  // Mapbox: para address, text es número de calle, y place_name contiene calle
  // Extraer calle de place_name primer componente
  if (feature.place_type?.includes("address")) {
    // place_name ej: "Av Patriotismo 12, Escandón, Ciudad de México, 11800, México"
    const first = placeName.split(",")[0] || text;
    calle = first.trim();
  } else if (feature.place_type?.includes("poi") || feature.place_type?.includes("place")) {
    calle = text;
  }

  return { cp, estado, ciudad, colonia, calle, coords, placeName };
}

function DireccionBlock({
  title,
  icon,
  value,
  onChange,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  value: Direccion;
  onChange: (patch: Partial<Direccion>) => void;
  color: string;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearchChange = (q: string) => {
    onChange({ search: q });
    if (q.trim().length < 3) {
      setSuggestions([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `/api/mapbox/geocode?q=${encodeURIComponent(q)}&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.ok && data.error) throw new Error(data.error);
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    }, 320);
  };

  const handleSelectSuggestion = (feature: any) => {
    const parsed = parseMapboxFeature(feature);
    // Si CP viene, disparar fetch de colonias después
    onChange({
      search: feature.place_name || "",
      placeName: feature.place_name || "",
      calle: parsed.calle || value.calle,
      colonia: parsed.colonia || value.colonia,
      ciudad: parsed.ciudad || value.ciudad,
      estado: parsed.estado || value.estado,
      cp: parsed.cp && CP_REGEX.test(parsed.cp) ? parsed.cp : value.cp,
      coords: parsed.coords || value.coords,
    });
    setSuggestions([]);
    setShowSuggestions(false);
    // Si CP autocompletado, el useEffect del parent hará fetch de colonias
  };

  // Fetch colonias cuando CP cambia a 5 dígitos
  useEffect(() => {
    const cp = value.cp.trim();
    if (!CP_REGEX.test(cp)) {
      if (value.coloniasSugeridas.length) onChange({ coloniasSugeridas: [] });
      return;
    }
    // Avoid refetch if already has same CP colonias
    let cancelled = false;
    onChange({ _cpLoading: true } as any);
    fetch(`/api/cp?cp=${cp}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("no cp");
        const j = await r.json();
        if (cancelled) return;
        const colonias: string[] = j.colonias || [];
        onChange({ coloniasSugeridas: colonias, estado: j.estado || value.estado, ciudad: j.ciudad || j.municipio || value.ciudad, _cpLoading: false } as any);
        // Si estado/ciudad vacíos, autocompletar; si ya hay, no sobrescribir si usuario editó?
        // Para simplificar, autocompletar si vacío
      })
      .catch(() => {
        if (!cancelled) onChange({ coloniasSugeridas: [], _cpLoading: false } as any);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.cp]);

  const cpError = value.cp.length > 0 && value.cp.length < 5 ? "Faltan dígitos" : value.cp.length === 5 && !CP_REGEX.test(value.cp) ? "Debe tener 5 dígitos" : null;
  const cpValid = CP_REGEX.test(value.cp);

  return (
    <div ref={containerRef} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg grid place-items-center text-white ${color}`}>
          {icon}
        </div>
        <h3 className="text-sm font-black tracking-tight">{title}</h3>
        {value.coords && <span className="ml-auto text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2 py-0.5 font-bold">Geolocalizado</span>}
      </div>

      {/* Buscador Autocomplete */}
      <div>
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Search className="w-3 h-3" /> Búsqueda predictiva <span className="text-slate-400 font-normal">— Origen / Destino</span>
        </label>
        <div className="relative mt-1.5">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={value.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => value.search.trim().length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Ej. Av Patriotismo 12, Escandón, CDMX"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 focus:border-[#ff4d11]"
          />
          {searchLoading && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
          {!searchLoading && value.search && (
            <button
              onClick={() => { onChange({ search: "" }); setSuggestions([]); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-100 rounded-full w-6 h-6 grid place-items-center"
            >
              ×
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
              {suggestions.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelectSuggestion(f)}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b last:border-b-0 border-slate-100 flex gap-2"
                >
                  <MapPin className="w-4 h-4 text-[#ff4d11] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{f.text}{f.address ? ` ${f.address}` : ""}</div>
                    <div className="text-xs text-slate-500 truncate">{f.place_name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">Escribe al menos 3 letras y elige una sugerencia. Precargamos calle, colonia, ciudad, estado y CP — puedes editarlos abajo.</p>
        {value.placeName && <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1 mt-2 truncate">📍 {value.placeName}</p>}
      </div>

      {/* Grid dirección */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-700">Código Postal <span className="text-red-500">*</span></label>
          <input
            inputMode="numeric"
            maxLength={5}
            value={value.cp}
            onChange={(e) => onChange({ cp: e.target.value.replace(/\D/g, "").slice(0, 5) })}
            placeholder="Ej. 52104"
            className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 ${cpError ? "border-red-300 bg-red-50/30" : cpValid ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200"}`}
          />
          {cpError ? <p className="text-[11px] text-red-600 mt-1">{cpError}</p> : <p className="text-[11px] text-slate-400 mt-1">5 dígitos. Actualiza Estado, Ciudad y Colonias.</p>}
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs font-bold text-slate-700">Colonias sugeridas</label>
          <div className="mt-1.5 min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 p-2 flex flex-wrap gap-1.5">
            {value._cpLoading ? (
              <span className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Cargando colonias...</span>
            ) : value.coloniasSugeridas.length ? (
              value.coloniasSugeridas.map((col) => (
                <button
                  key={col}
                  onClick={() => onChange({ colonia: col })}
                  className={`text-xs rounded-full px-2.5 py-1 border font-medium transition ${value.colonia === col ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 hover:border-[#ff4d11]/40 hover:bg-[#ff4d11]/5 text-slate-700"}`}
                >
                  {col}
                </button>
              ))
            ) : (
              <span className="text-xs text-slate-400">Ingresa un CP válido para sugerencias.</span>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700">Estado <span className="text-red-500">*</span></label>
          <input value={value.estado} onChange={(e) => onChange({ estado: e.target.value })} placeholder="Ej. Estado de México" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Ciudad <span className="text-red-500">*</span></label>
          <input value={value.ciudad} onChange={(e) => onChange({ ciudad: e.target.value })} placeholder="Ej. San Mateo Atenco" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Colonia <span className="text-red-500">*</span></label>
          <input value={value.colonia} onChange={(e) => onChange({ colonia: e.target.value })} placeholder="Ej. Santa Elena" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Calle <span className="text-red-500">*</span></label>
          <input value={value.calle} onChange={(e) => onChange({ calle: e.target.value })} placeholder="Ej. Av. Benito Juárez" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Número ext. <span className="text-red-500">*</span></label>
          <input value={value.numExt} onChange={(e) => onChange({ numExt: e.target.value })} placeholder="Ej. 123" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Número int.</label>
          <input value={value.numInt} onChange={(e) => onChange({ numInt: e.target.value })} placeholder="Ej. 2B (opcional)" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-700">Referencias</label>
          <textarea value={value.referencias} onChange={(e) => onChange({ referencias: e.target.value })} placeholder="Entre calles, color de fachada, acceso, piso, etc." rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20" />
        </div>
      </div>
    </div>
  );
}

export default function SolicitudPaso3Page() {
  const [origen, setOrigen] = useState<Direccion>(emptyDireccion());
  const [destino, setDestino] = useState<Direccion>(emptyDireccion());
  const [escalas, setEscalas] = useState<Escala[]>([]);

  const [contactoRecoleccion, setContactoRecoleccion] = useState<Contacto>({ nombre: "", apellido: "", telefono: "" });
  const [contactoEntrega, setContactoEntrega] = useState<Contacto>({ nombre: "", apellido: "", telefono: "" });
  const [instrucciones, setInstrucciones] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [routeMetrics, setRouteMetrics] = useState<{ distanceKm: number; durationMin: number; source: string } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [needsManualReview, setNeedsManualReview] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [tarifa, setTarifa] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);

  // Cargar storage + tarifa
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PASO3);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.origen) setOrigen((p) => ({ ...p, ...d.origen }));
        if (d.destino) setDestino((p) => ({ ...p, ...d.destino }));
        if (Array.isArray(d.escalas)) setEscalas(d.escalas);
        if (d.contactoRecoleccion) setContactoRecoleccion(d.contactoRecoleccion);
        if (d.contactoEntrega) setContactoEntrega(d.contactoEntrega);
        if (typeof d.instrucciones === "string") setInstrucciones(d.instrucciones);
      }
      const rawCot = localStorage.getItem(STORAGE_COTIZACION) || localStorage.getItem("ruum_last_cotizacion");
      if (rawCot) {
        const c = JSON.parse(rawCot);
        if (c.tarifa) setTarifa(c.tarifa);
        else if (c.totalConGastos) setTarifa(c.totalConGastos);
      }
    } catch {}
    hasLoadedRef.current = true;
  }, []);

  // Auto-guardado
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const payload = { origen, destino, escalas, contactoRecoleccion, contactoEntrega, instrucciones, routeMetrics, needsManualReview, updatedAt: new Date().toISOString() };
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_PASO3, JSON.stringify(payload));
        setSavedAt(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1200);
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [origen, destino, escalas, contactoRecoleccion, contactoEntrega, instrucciones, routeMetrics, needsManualReview]);

  // Métricas Mapbox Directions
  const coordsList = useMemo(() => {
    const list: Coords[] = [];
    if (origen.coords) list.push(origen.coords);
    escalas.forEach((e) => e.coords && list.push(e.coords));
    if (destino.coords) list.push(destino.coords);
    return list;
  }, [origen.coords, destino.coords, escalas]);

  // Fallback estimación si no hay coords pero sí CPs válidos (usa cotizar heuristic)
  const fallbackDistance = useMemo(() => {
    const o = origen.cp;
    const d = destino.cp;
    if (!CP_REGEX.test(o) || !CP_REGEX.test(d)) return null;
    const a = parseInt(o, 10);
    const b = parseInt(d, 10);
    const diff = Math.abs(a - b);
    let km = (diff % 380) + 12 + ((a % 7) + (b % 5));
    km = Math.max(8, Math.min(420, Math.round(km)));
    const horas = Math.max(1, Math.round((km / 62 + 0.5) * 2) / 2);
    return { km, min: Math.round(horas * 60) };
  }, [origen.cp, destino.cp]);

  useEffect(() => {
    if (coordsList.length < 2) {
      if (fallbackDistance) {
        setRouteMetrics({ distanceKm: fallbackDistance.km, durationMin: fallbackDistance.min, source: "estimado" });
        setRouteError(null);
        setNeedsManualReview(false);
      } else {
        setRouteMetrics(null);
        setRouteError(null);
      }
      return;
    }
    setRouteLoading(true);
    setRouteError(null);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const coordsParam = coordsList.map((c) => `${c[0]},${c[1]}`).join(";");
        const url = `/api/mapbox/directions?coords=${encodeURIComponent(coordsParam)}`;
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "No se pudo resolver la ruta");
        setRouteMetrics({ distanceKm: data.distanceKm, durationMin: data.durationMin, source: data.source || "mapbox" });
        setNeedsManualReview(false);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setRouteError(e?.message || "Error calculando ruta");
        if (fallbackDistance) {
          setRouteMetrics({ distanceKm: fallbackDistance.km, durationMin: fallbackDistance.min, source: "estimado (fallback)" });
          setNeedsManualReview(true);
        } else {
          setRouteMetrics(null);
          setNeedsManualReview(true);
        }
      } finally {
        setRouteLoading(false);
      }
    }, 500);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [coordsList, fallbackDistance]);

  // Validaciones
  const isOrigenValid =
    CP_REGEX.test(origen.cp) &&
    origen.estado.trim().length > 0 &&
    origen.ciudad.trim().length > 0 &&
    origen.colonia.trim().length > 0 &&
    origen.calle.trim().length > 0 &&
    origen.numExt.trim().length > 0;
  const isDestinoValid =
    CP_REGEX.test(destino.cp) &&
    destino.estado.trim().length > 0 &&
    destino.ciudad.trim().length > 0 &&
    destino.colonia.trim().length > 0 &&
    destino.calle.trim().length > 0 &&
    destino.numExt.trim().length > 0;

  const isRecoleccionValid =
    contactoRecoleccion.nombre.trim().length > 0 &&
    contactoRecoleccion.apellido.trim().length > 0 &&
    TEL_REGEX.test(contactoRecoleccion.telefono.replace(/\D/g, ""));
  const isEntregaValid =
    contactoEntrega.nombre.trim().length > 0 &&
    contactoEntrega.apellido.trim().length > 0 &&
    TEL_REGEX.test(contactoEntrega.telefono.replace(/\D/g, ""));

  const isFormValid = isOrigenValid && isDestinoValid && isRecoleccionValid && isEntregaValid;
  const canContinuar = isFormValid;

  const addEscala = () => {
    if (escalas.length >= 8) return;
    const id = `esc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setEscalas((prev) => [...prev, emptyEscala(id)]);
  };
  const removeEscala = (id: string) => setEscalas((prev) => prev.filter((e) => e.id !== id));
  const updateEscala = (id: string, patch: Partial<Escala>) =>
    setEscalas((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const formatDuration = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  };

  return (
    <div className="max-w-[1160px] mx-auto pb-24 lg:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#ff4d11] bg-[#ff4d11]/10 border border-[#ff4d11]/20 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-[#ff4d11] animate-pulse" /> PASO 3 DE 5: ¿DÓNDE LO RECOGEMOS Y LLEVAMOS?
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 text-[11px]">
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> 1. Conoce tu tarifa — Completado
            </span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> 2. ¿Qué vehículo trasladamos? — Completado
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-900 text-white rounded-full px-2.5 py-1 font-bold">3. ¿Dónde lo recogemos y llevamos? — Activo</span>
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-500 rounded-full px-2.5 py-1">4. Detalles del servicio</span>
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-500 rounded-full px-2.5 py-1">5. Pago</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${savedFlash ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500"}`}>
            {savedFlash ? <><CheckCircle2 className="w-3 h-3" /> Guardado</> : savedAt ? <>💾 Guardado {savedAt}</> : <>💾 Guardado automático</>}
          </span>
          <Link href="/solicitud/paso2" className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-3.5 h-3.5" /> Atrás
          </Link>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden flex">
          <div className="h-full bg-[#ff4d11] transition-all" style={{ width: "60%" }} />
          <div className="h-full bg-slate-200" style={{ width: "40%" }} />
        </div>
        <span className="text-xs font-bold text-slate-600">Paso 3 / 5</span>
        <span className="text-xs text-slate-400 hidden sm:inline">• Ruta y contactos</span>
      </div>

      <div className="grid lg:grid-cols-[1.65fr_0.9fr] gap-6 items-start">
        {/* Izquierda: Direcciones + Escalas + Contactos */}
        <div className="space-y-6">
          {/* Origen */}
          <DireccionBlock title="Domicilio de Origen" icon={<MapPin className="w-4 h-4" />} value={origen} onChange={(p) => setOrigen((prev) => ({ ...prev, ...p }))} color="bg-[#ff4d11]" />

          {/* Destino */}
          <DireccionBlock title="Domicilio de Destino" icon={<Navigation className="w-4 h-4" />} value={destino} onChange={(p) => setDestino((prev) => ({ ...prev, ...p }))} color="bg-emerald-600" />

          {/* Gestor Escalas */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Route className="w-4 h-4 text-slate-700" /> Escalas / Tareas intermedias
                <span className="ml-2 text-xs font-bold bg-slate-900 text-white rounded-full px-2 py-0.5">{escalas.length} / 8</span>
              </h3>
              <Button onClick={addEscala} disabled={escalas.length >= 8} variant="outline" size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Agregar escala/tarea {escalas.length} /8
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Añade hasta 8 paradas entre origen y destino. Cada escala puede ser solo parada o tarea específica.</p>

            {escalas.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                Sin escalas. Origen → Destino directo.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {escalas.map((esc, idx) => (
                  <div key={esc.id} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-bold">{idx + 1}</span>
                      <span className="text-sm font-bold">Escala {idx + 1}</span>
                      <select
                        value={esc.tipo}
                        onChange={(e) => updateEscala(esc.id, { tipo: e.target.value as any })}
                        className="ml-2 h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
                      >
                        <option value="parada">Solo parada</option>
                        <option value="tarea">Tarea específica</option>
                      </select>
                      <button onClick={() => removeEscala(esc.id)} className="ml-auto text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-2 py-1 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    </div>
                    {esc.tipo === "tarea" && (
                      <input
                        value={esc.descripcion}
                        onChange={(e) => updateEscala(esc.id, { descripcion: e.target.value })}
                        placeholder="Describe la tarea (ej. Recoger documentos, inspección...)"
                        className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400"
                      />
                    )}
                    {/* Reuse small dirección block for escala */}
                    <DireccionBlock
                      title={`Dirección escala ${idx + 1}`}
                      icon={<MapPin className="w-4 h-4" />}
                      value={esc}
                      onChange={(p) => updateEscala(esc.id, p)}
                      color="bg-slate-700"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Contactos */}
          <Card className="p-5">
            <h3 className="text-sm font-black flex items-center gap-2">
              <User className="w-4 h-4 text-[#ff4d11]" /> Contactos e instrucciones
            </h3>

            <div className="mt-4 space-y-6">
              {/* Recolección */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <div className="text-xs font-black tracking-widest text-slate-600 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#ff4d11] text-white grid place-items-center text-xs">1</span> CONTACTO DE RECOLECCIÓN — Quien entrega
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Nombre <span className="text-red-500">*</span></label>
                    <input value={contactoRecoleccion.nombre} onChange={(e) => setContactoRecoleccion((p) => ({ ...p, nombre: e.target.value }))} onBlur={() => setTouched((s) => ({ ...s, recNombre: true }))} placeholder="Ej. Ana" className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm ${!contactoRecoleccion.nombre && touched.recNombre ? "border-red-300" : "border-slate-200"}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Apellido <span className="text-red-500">*</span></label>
                    <input value={contactoRecoleccion.apellido} onChange={(e) => setContactoRecoleccion((p) => ({ ...p, apellido: e.target.value }))} onBlur={() => setTouched((s) => ({ ...s, recApellido: true }))} placeholder="Ej. Torres" className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm ${!contactoRecoleccion.apellido && touched.recApellido ? "border-red-300" : "border-slate-200"}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono <span className="text-red-500">*</span></label>
                    <div className="mt-1.5 flex">
                      <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600">+52</span>
                      <input inputMode="numeric" maxLength={10} value={contactoRecoleccion.telefono} onChange={(e) => setContactoRecoleccion((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, "").slice(0, 10) }))} onBlur={() => setTouched((s) => ({ ...s, recTel: true }))} placeholder="10 dígitos" className={`h-10 flex-1 rounded-r-xl border bg-white px-3 text-sm ${touched.recTel && !TEL_REGEX.test(contactoRecoleccion.telefono) ? "border-red-300 bg-red-50/30" : "border-slate-200"}`} />
                    </div>
                    {touched.recTel && !TEL_REGEX.test(contactoRecoleccion.telefono) && contactoRecoleccion.telefono.length > 0 && <p className="text-[11px] text-red-600 mt-1">Debe tener 10 dígitos.</p>}
                  </div>
                </div>
              </div>

              {/* Entrega */}
              <div className="rounded-xl border border-slate-200 p-4 bg-white">
                <div className="text-xs font-black tracking-widest text-emerald-700 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white grid place-items-center text-xs">2</span> CONTACTO DE ENTREGA — Quien recibe
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Nombre <span className="text-red-500">*</span></label>
                    <input value={contactoEntrega.nombre} onChange={(e) => setContactoEntrega((p) => ({ ...p, nombre: e.target.value }))} onBlur={() => setTouched((s) => ({ ...s, entNombre: true }))} placeholder="Ej. Carlos" className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm ${!contactoEntrega.nombre && touched.entNombre ? "border-red-300" : "border-slate-200"}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Apellido <span className="text-red-500">*</span></label>
                    <input value={contactoEntrega.apellido} onChange={(e) => setContactoEntrega((p) => ({ ...p, apellido: e.target.value }))} onBlur={() => setTouched((s) => ({ ...s, entApellido: true }))} placeholder="Ej. Mendoza" className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm ${!contactoEntrega.apellido && touched.entApellido ? "border-red-300" : "border-slate-200"}`} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Phone className="w-3 h-3" /> Teléfono <span className="text-red-500">*</span></label>
                    <div className="mt-1.5 flex">
                      <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600">+52</span>
                      <input inputMode="numeric" maxLength={10} value={contactoEntrega.telefono} onChange={(e) => setContactoEntrega((p) => ({ ...p, telefono: e.target.value.replace(/\D/g, "").slice(0, 10) }))} onBlur={() => setTouched((s) => ({ ...s, entTel: true }))} placeholder="10 dígitos" className={`h-10 flex-1 rounded-r-xl border bg-white px-3 text-sm ${touched.entTel && !TEL_REGEX.test(contactoEntrega.telefono) ? "border-red-300 bg-red-50/30" : "border-slate-200"}`} />
                    </div>
                    {touched.entTel && !TEL_REGEX.test(contactoEntrega.telefono) && contactoEntrega.telefono.length > 0 && <p className="text-[11px] text-red-600 mt-1">Debe tener 10 dígitos.</p>}
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Instrucciones especiales</label>
                <textarea value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} placeholder="Detalles sobre caseta de acceso, horarios de entrega en privada o requisitos de seguridad." rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20" />
              </div>
            </div>
          </Card>
        </div>

        {/* Derecha: Métricas + Resumen + CTA */}
        <div className="space-y-4 lg:sticky lg:top-[80px]">
          {/* Métricas ruta */}
          <Card className="overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b flex items-center gap-2">
              <Route className="w-4 h-4 text-[#ff4d11]" />
              <h3 className="text-xs font-black tracking-[0.14em] text-slate-700">RESUMEN DE RUTA</h3>
              {routeLoading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin ml-auto" />}
            </div>
            <div className="p-5 space-y-4">
              {routeMetrics ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-900 text-white p-4 text-center">
                    <div className="text-[11px] tracking-widest font-bold opacity-60">DISTANCIA</div>
                    <div className="text-2xl font-black mt-1">{routeMetrics.distanceKm} km</div>
                    <div className="text-[11px] opacity-60 mt-1">{routeMetrics.source}</div>
                  </div>
                  <div className="rounded-2xl bg-white border border-slate-200 p-4 text-center">
                    <div className="text-[11px] tracking-widest font-bold text-slate-500">TIEMPO</div>
                    <div className="text-2xl font-black mt-1 flex items-center justify-center gap-1"><Clock className="w-5 h-5 text-[#ff4d11]" /> {formatDuration(routeMetrics.durationMin)}</div>
                    <div className="text-[11px] text-slate-400 mt-1">estimado</div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                  <Navigation className="w-6 h-6 mx-auto text-slate-300" />
                  <p className="mt-2">Ingresa origen y destino para calcular distancia y tiempo.</p>
                </div>
              )}
              <p className="text-[11px] text-slate-500 flex gap-1.5"><Info className="w-3 h-3 mt-0.5 shrink-0" /> Se calcula con Mapbox usando origen y destino. Si no se puede resolver, nuestro equipo de operaciones lo revisará.</p>
              {routeError && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold">No se pudo resolver la ruta:</span> {routeError}
                    <div className="mt-1">Se usará estimación y se marcará para revisión manual.</div>
                  </div>
                </div>
              )}
              {needsManualReview && <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-2 text-center font-bold">⚠️ Revisión manual por Operaciones</div>}
              {escalas.length > 0 && <p className="text-xs text-slate-600">Incluye {escalas.length} escala(s) en el cálculo.</p>}
              {tarifa != null && <div className="text-xs text-slate-600 flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#ff4d11]" /> Tarifa aceptada: <span className="font-black">{money(tarifa)}</span> (Paso 1)</div>}
            </div>
          </Card>

          {/* Validación / CTA */}
          <Card className="p-5 space-y-3">
            {!isFormValid && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> Completa direcciones con número ext/int y teléfonos de 10 dígitos para habilitar Continuar.
              </div>
            )}
            <Button
              disabled={!canContinuar}
              onClick={() => {
                try {
                  localStorage.setItem("ruum_solicitud_paso3_ready", "1");
                  if (needsManualReview) localStorage.setItem("ruum_needs_manual_review", "true");
                  else localStorage.removeItem("ruum_needs_manual_review");
                } catch {}
                window.location.href = "/solicitud/paso4";
              }}
              className="w-full h-11 text-sm font-bold gap-2 disabled:opacity-40"
            >
              Continuar a Detalles del servicio <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-[11px] text-slate-400 text-center">{!canContinuar ? "Habilitado tras completar origen, destino y contactos" : needsManualReview ? "Avanzas con revisión manual — Operaciones verificará la ruta" : "Validado — avanzas al Paso 4"}</p>
            <div className="flex gap-2">
              <Link href="/solicitud/paso2" className="flex-1">
                <Button variant="outline" className="w-full h-10">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
                </Button>
              </Link>
              <Link href="/solicitud/paso4" className={`flex-1 ${!canContinuar ? "pointer-events-none opacity-50" : ""}`}>
                <Button variant="outline" className="w-full h-10 bg-slate-900 text-white hover:bg-slate-800">Ir a Paso 4</Button>
              </Link>
            </div>
            <div className="hidden lg:block rounded-xl border bg-slate-50 p-3 text-xs text-slate-600">
              <div className="font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Datos técnicos</div>
              <ul className="mt-1 list-disc pl-4 space-y-1">
                <li>Geocoding API para búsqueda predictiva y CP</li>
                <li>Directions API para distancia/tiempo</li>
                <li>Fallback estimado si Mapbox falla</li>
                <li>Array de escalas mapeado a coordenadas</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile fixed nav */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2">
          <Link href="/solicitud/paso2" className="flex-1"><Button variant="outline" className="w-full h-11">Atrás</Button></Link>
          <Button disabled={!canContinuar} onClick={() => (window.location.href = "/solicitud/paso4")} className="flex-[1.4] h-11 text-sm font-bold">Continuar <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>
        {!canContinuar && <p className="text-[11px] text-slate-400 text-center mt-1.5">Completa origen, destino y teléfonos</p>}
      </div>
    </div>
  );
}
