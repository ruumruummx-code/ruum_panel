// CP Lookup — Catálogo local catalogos/codigo_postal_mx.json
// Fallback externo si no se encuentra (opcional)

export const CP_REGEX = /^\d{5}$/;

export type Asentamiento = {
  colonia: string;
  tipo: string;
  zona: string;
  ciudad: string | null;
  cp: string;
};

export type CpLookupResult = {
  cp: string;
  estado: string;
  municipio: string;
  ciudad: string | null;
  colonias: string[];
  asentamientos: Asentamiento[];
  estadoCodigo?: string;
  municipioCodigo?: string;
  source: string;
};

// Cache en memoria TTL 24h para resultados individuales
const CACHE_TTL = 1000 * 60 * 60 * 24;
const cache = new Map<string, { data: CpLookupResult; exp: number }>();

function getCached(cp: string): CpLookupResult | null {
  const entry = cache.get(cp);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    cache.delete(cp);
    return null;
  }
  return entry.data;
}
function setCached(cp: string, data: CpLookupResult) {
  if (cache.size > 500) {
    const first = cache.keys().next().value as string;
    cache.delete(first);
  }
  cache.set(cp, { data, exp: Date.now() + CACHE_TTL });
}

// ---------- Carga catálogo local ----------
type CpEntry = {
  codigo_postal: string;
  colonia: string;
  ciudad: string;
  estado: string;
};

let _cpLoaded = false;
let _cpByCode: Map<string, CpEntry[]> = new Map();
let _cpLoadError: string | null = null;

function loadCpCatalog(): void {
  if (_cpLoaded) return;
  _cpLoaded = true;
  try {
    if (typeof window !== "undefined") return; // solo server
    const fs = require("fs");
    const path = require("path");
    const catalogPath = path.join(process.cwd(), "catalogos", "codigo_postal_mx.json");
    const raw = fs.readFileSync(catalogPath, "utf8");
    const trimmed = raw.trim();
    // El archivo viene como objetos sueltos separados por coma sin [] -> envolver
    let jsonStr = trimmed;
    if (!trimmed.startsWith("[")) {
      jsonStr = "[" + trimmed + "]";
    }
    // Puede tener trailing comma antes de cierre si original terminaba con , -> limpiar
    jsonStr = jsonStr.replace(/,\s*]/, "]");
    const arr: CpEntry[] = JSON.parse(jsonStr);
    const map = new Map<string, CpEntry[]>();
    for (const e of arr) {
      const cp = String(e.codigo_postal).trim().padStart(5, "0");
      if (!CP_REGEX.test(cp)) continue;
      if (!map.has(cp)) map.set(cp, []);
      map.get(cp)!.push(e);
    }
    _cpByCode = map;
  } catch (e: any) {
    _cpLoadError = e?.message ?? String(e);
    console.warn("[sepomex] No se pudo cargar catalogos/codigo_postal_mx.json", _cpLoadError);
    _cpByCode = new Map();
  }
}

if (typeof window === "undefined") {
  loadCpCatalog();
}

function lookupFromCatalog(cp: string): CpLookupResult | null {
  loadCpCatalog();
  if (_cpLoadError && _cpByCode.size === 0) return null;
  const entries = _cpByCode.get(cp);
  if (!entries || entries.length === 0) return null;

  const first = entries[0];
  const estado = String(first.estado).trim();
  const ciudad = String(first.ciudad).trim();
  // En el catálogo nuevo, "ciudad" equivale a municipio/alcaldía (ej. Álvaro Obregón, Querétaro)
  const municipio = ciudad;

  // Validar que estado/municipio existan
  const colonias = [...new Set(entries.map((e) => String(e.colonia).trim()).filter(Boolean))];
  const asentamientos: Asentamiento[] = entries.map((e) => ({
    colonia: String(e.colonia).trim(),
    tipo: "", // no disponible en este catálogo (antes d_tipo_asenta)
    zona: "",
    ciudad: String(e.ciudad).trim() || null,
    cp,
  }));

  if (!estado || colonias.length === 0) return null;

  return {
    cp,
    estado,
    municipio,
    ciudad: ciudad || null,
    colonias,
    asentamientos,
    source: "catalogos/codigo_postal_mx.json",
  };
}

// Mantener fallback externo opcional (desactivado por defecto, solo si no está en catálogo)
async function fetchExternal(cp: string): Promise<CpLookupResult | null> {
  // Intentar sepomex.kurenn como fallback si el CP no está en catálogo local
  try {
    const url = `https://sepomex.kurenn.dev/api/v1/zip_codes?zip_code=${cp}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const json = await res.json();
    const items: any[] = json.zip_codes ?? [];
    if (!items.length) return null;
    const first = items[0];
    const estado = String(first.d_estado ?? "").trim();
    const municipio = String(first.d_mnpio ?? "").trim();
    const ciudad = first.d_ciudad ? String(first.d_ciudad).trim() : null;
    const asentamientos: Asentamiento[] = items.map((it: any) => ({
      colonia: String(it.d_asenta ?? "").trim(),
      tipo: String(it.d_tipo_asenta ?? "").trim(),
      zona: String(it.d_zona ?? "").trim(),
      ciudad: it.d_ciudad ? String(it.d_ciudad).trim() : null,
      cp: String(it.d_codigo ?? cp).trim(),
    }));
    const colonias = [...new Set(asentamientos.map((a) => a.colonia).filter(Boolean))];
    if (!estado || !municipio || !colonias.length) return null;
    return { cp, estado, municipio, ciudad, colonias, asentamientos, estadoCodigo: first.c_estado, municipioCodigo: first.c_mnpio, source: "sepomex.kurenn.dev (fallback)" };
  } catch {
    return null;
  }
}

export async function lookupCp(cpRaw: string): Promise<CpLookupResult | null> {
  const cp = String(cpRaw).trim();
  if (!CP_REGEX.test(cp)) return null;

  const cached = getCached(cp);
  if (cached) return cached;

  // 1) Catálogo local (fuente primaria solicitada)
  const fromCatalog = lookupFromCatalog(cp);
  if (fromCatalog) {
    setCached(cp, fromCatalog);
    return fromCatalog;
  }

  // 2) Fallback externo solo si no está en catálogo (para cobertura 100%)
  const ext = await fetchExternal(cp);
  if (ext) {
    setCached(cp, ext);
    return ext;
  }

  return null;
}

export function validateCp(cp: string | null | undefined): { valid: boolean; cp?: string; error?: string } {
  if (!cp) return { valid: false, error: "Falta parámetro cp. Usa ?cp=01000 o /api/cp/01000" };
  const trimmed = String(cp).trim();
  if (!CP_REGEX.test(trimmed)) return { valid: false, error: "El Código Postal debe tener exactamente 5 dígitos numéricos." };
  return { valid: true, cp: trimmed };
}

// Util para rutas que quieran stats
export function getCpCatalogStats(): { loaded: boolean; uniqueCp: number; totalEntries: number; error: string | null; source: string } {
  loadCpCatalog();
  return {
    loaded: _cpLoaded,
    uniqueCp: _cpByCode.size,
    totalEntries: Array.from(_cpByCode.values()).reduce((a, b) => a + b.length, 0),
    error: _cpLoadError,
    source: "catalogos/codigo_postal_mx.json",
  };
}
