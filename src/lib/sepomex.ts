// CP Lookup — SEPOMEX aggregator
// Proveedores: sepomex.kurenn.dev (primario, datos oficiales), zippopotam.us (fallback), copomex (si token)
// Cache en memoria con TTL para evitar rate-limit upstream.

export const CP_REGEX = /^\d{5}$/;

export type Asentamiento = {
  colonia: string;
  tipo: string; // d_tipo_asenta
  zona: string; // Urbano / Rural
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

// Cache simple LRU TTL 24h
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
  // Evitar crecimiento infinito
  if (cache.size > 500) {
    const first = cache.keys().next().value as string;
    cache.delete(first);
  }
  cache.set(cp, { data, exp: Date.now() + CACHE_TTL });
}

// ----- Provider: sepomex.kurenn.dev -----
async function fetchSepomexKurenn(cp: string): Promise<CpLookupResult | null> {
  const url = `https://sepomex.kurenn.dev/api/v1/zip_codes?zip_code=${cp}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const items: any[] = json.zip_codes ?? json.data ?? [];
  if (!Array.isArray(items) || items.length === 0) return null;

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

  if (!estado || !municipio || colonias.length === 0) return null;

  return {
    cp,
    estado,
    municipio,
    ciudad,
    colonias,
    asentamientos,
    estadoCodigo: first.c_estado ?? undefined,
    municipioCodigo: first.c_mnpio ?? undefined,
    source: "sepomex.kurenn.dev",
  };
}

// ----- Provider: Copomex (si hay token) -----
async function fetchCopomex(cp: string): Promise<CpLookupResult | null> {
  const token =
    process.env.COPOMEX_TOKEN ??
    process.env.NEXT_PUBLIC_COPOMEX_TOKEN ??
    process.env.CP_TOKEN;
  if (!token) return null;

  const url = `https://api.copomex.com/query/info_cp/${cp}?token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const json = await res.json();

  // Copomex devuelve { error, response: { estado, municipio, ciudad, asentamiento, ...} } o { response: { cp, ... } }
  if (json.error) return null;
  const r = json.response ?? json;
  // Cuando es simplified o extended el shape varía
  // Intentamos normalizar:
  let estado: string | null = null;
  let municipio: string | null = null;
  let ciudad: string | null = null;
  let colonias: string[] = [];
  let asentamientos: Asentamiento[] = [];

  if (Array.isArray(r)) {
    // array de asentamientos
    if (r.length === 0) return null;
    estado = r[0].estado ?? r[0].response?.estado ?? null;
    municipio = r[0].municipio ?? r[0].response?.municipio ?? null;
    ciudad = r[0].ciudad ?? null;
    colonias = r.map((x: any) => x.asentamiento ?? x.colonia ?? x.nombre ?? "").filter(Boolean);
    asentamientos = r.map((x: any) => ({
      colonia: String(x.asentamiento ?? x.colonia ?? "").trim(),
      tipo: String(x.tipo_asentamiento ?? x.tipo ?? "").trim(),
      zona: String(x.zona ?? "").trim(),
      ciudad: x.ciudad ? String(x.ciudad).trim() : null,
      cp,
    }));
  } else if (r.estado || r.municipio || r.asentamiento) {
    estado = r.estado ?? null;
    municipio = r.municipio ?? null;
    ciudad = r.ciudad ?? null;
    if (Array.isArray(r.asentamiento)) {
      colonias = r.asentamiento;
      asentamientos = r.asentamiento.map((c: string) => ({
        colonia: String(c).trim(),
        tipo: String(r.tipo_asentamiento ?? "").trim(),
        zona: "",
        ciudad,
        cp,
      }));
    } else if (typeof r.asentamiento === "string") {
      colonias = [r.asentamiento];
      asentamientos = [{ colonia: r.asentamiento, tipo: String(r.tipo_asentamiento ?? "").trim(), zona: "", ciudad, cp }];
    } else if (Array.isArray(r.colonias)) {
      colonias = r.colonias;
      asentamientos = r.colonias.map((c: string) => ({ colonia: c, tipo: "", zona: "", ciudad, cp }));
    }
  } else if (r.cp || r.codigo_postal) {
    // otro shape
    return null;
  }

  if (!estado || !municipio || colonias.length === 0) return null;

  return {
    cp,
    estado: String(estado).trim(),
    municipio: String(municipio).trim(),
    ciudad: ciudad ? String(ciudad).trim() : null,
    colonias: [...new Set(colonias.map((c) => String(c).trim()).filter(Boolean))],
    asentamientos,
    source: "copomex",
  };
}

// ----- Provider: Zippopotam.us (fallback) -----
async function fetchZippopotam(cp: string): Promise<CpLookupResult | null> {
  const url = `https://api.zippopotam.us/mx/${cp}`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  const json = await res.json();
  const places: any[] = json.places ?? [];
  if (!Array.isArray(places) || places.length === 0) return null;

  // Zippopotam no distingue municipio; usamos place name como colonia, state como estado
  // Heurística: si hay más de 1 place, todos son colonias del mismo estado
  const estado = String(places[0].state ?? "").trim();
  // Municipio no disponible → usamos place name del primer registro como fallback municipio/ciudad
  // Mejor dejar municipio como primer place o estado_abbr dependent
  // Para no mentir, marcamos municipio = places[0]["place name"] si no hay otro dato, pero anotamos source
  const colonias = [...new Set(places.map((p: any) => String(p["place name"] ?? "").trim()).filter(Boolean))];
  const municipio = colonias[0] ?? estado;

  const asentamientos: Asentamiento[] = places.map((p: any) => ({
    colonia: String(p["place name"] ?? "").trim(),
    tipo: "",
    zona: "",
    ciudad: String(p["place name"] ?? "").trim(),
    cp,
  }));

  if (!estado || colonias.length === 0) return null;

  return {
    cp,
    estado,
    municipio,
    ciudad: colonias[0] ?? null,
    colonias,
    asentamientos,
    source: "zippopotam.us",
  };
}

export async function lookupCp(cpRaw: string): Promise<CpLookupResult | null> {
  const cp = String(cpRaw).trim();
  if (!CP_REGEX.test(cp)) return null;

  const cached = getCached(cp);
  if (cached) return cached;

  // Orden: Copomex (si token) → Kurenn → Zippopotam
  const providers: Array<() => Promise<CpLookupResult | null>> = [];

  // Copomex primero si hay token (más preciso + oficial)
  if (process.env.COPOMEX_TOKEN || process.env.NEXT_PUBLIC_COPOMEX_TOKEN || process.env.CP_TOKEN) {
    providers.push(() => fetchCopomex(cp));
  }
  providers.push(() => fetchSepomexKurenn(cp));
  providers.push(() => fetchZippopotam(cp));

  let lastError: unknown = null;
  for (const fn of providers) {
    try {
      const result = await fn();
      if (result) {
        setCached(cp, result);
        return result;
      }
    } catch (e) {
      lastError = e;
      // continuar con siguiente proveedor
    }
  }

  if (lastError) {
    // Si todos fallaron por error de red, propagar null (caller decidirá 502)
    // console.error("[sepomex] all providers failed", lastError);
  }
  return null;
}

export function validateCp(cp: string | null | undefined): { valid: boolean; cp?: string; error?: string } {
  if (!cp) return { valid: false, error: "Falta parámetro cp. Usa ?cp=01000 o /api/cp/01000" };
  const trimmed = String(cp).trim();
  if (!CP_REGEX.test(trimmed)) return { valid: false, error: "El Código Postal debe tener exactamente 5 dígitos numéricos." };
  return { valid: true, cp: trimmed };
}
