// Vehículos — lookup marca + modelo → segmento / gama (TAD v2.0)
// Fuente primaria: catalogos/vehiculos-clasificacion.json (1365 registros)
// Fallback: MARCA_DEFAULTS + KEYWORD_RULES
import type { Segmento, Gama } from "./tad";
import { getM_activo } from "./tad";

export type VehiculoLookupResult = {
  marca: string;
  marcaInput: string;
  modelo: string;
  modeloInput: string;
  segmento: Segmento;
  gama: Gama;
  mActivoBase: number | null;
  confidence: "exact" | "keyword" | "marca_default" | "fallback";
  source: string;
  extra?: Record<string, any>;
};

// ---------- Normalización ----------
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
export function normalizeMarca(raw: string): string {
  const s = stripAccents(String(raw).trim().toLowerCase());
  const alias: Record<string, string> = {
    vw: "volkswagen",
    mercedes: "mercedes-benz",
    "mercedes benz": "mercedes-benz",
    "mercedes-benz": "mercedes-benz",
    seat: "seat",
    "land rover": "land rover",
  };
  return alias[s] ?? s;
}
export function normalizeModelo(raw: string): string {
  const s = stripAccents(String(raw).trim().toLowerCase());
  return s.replace(/\s+/g, " ").replace(/[-_]+/g, " ").trim();
}

// ---------- Catálogo: defaults por marca ----------
export const MARCA_DEFAULTS: Record<string, { segmento: Segmento; gama: Gama; canon: string }> = {
  acura: { canon: "Acura", segmento: "Lujo / Blindado", gama: "Alta" },
  audi: { canon: "Audi", segmento: "Lujo / Blindado", gama: "Alta" },
  bmw: { canon: "BMW", segmento: "Lujo / Blindado", gama: "Premium" },
  byd: { canon: "BYD", segmento: "Subcompacto / Compacto", gama: "Media" },
  chevrolet: { canon: "Chevrolet", segmento: "Subcompacto / Compacto", gama: "Media" },
  chrysler: { canon: "Chrysler", segmento: "Subcompacto / Compacto", gama: "Media" },
  dodge: { canon: "Dodge", segmento: "Subcompacto / Compacto", gama: "Media" },
  fiat: { canon: "Fiat", segmento: "Subcompacto / Compacto", gama: "Entrada" },
  ford: { canon: "Ford", segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  gmc: { canon: "GMC", segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  honda: { canon: "Honda", segmento: "Subcompacto / Compacto", gama: "Media" },
  hyundai: { canon: "Hyundai", segmento: "Subcompacto / Compacto", gama: "Entrada" },
  jaguar: { canon: "Jaguar", segmento: "Lujo / Blindado", gama: "Premium" },
  jeep: { canon: "Jeep", segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  kia: { canon: "Kia", segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "land rover": { canon: "Land Rover", segmento: "Lujo / Blindado", gama: "Premium" },
  lexus: { canon: "Lexus", segmento: "Lujo / Blindado", gama: "Alta" },
  lincoln: { canon: "Lincoln", segmento: "Lujo / Blindado", gama: "Premium" },
  mazda: { canon: "Mazda", segmento: "Subcompacto / Compacto", gama: "Media" },
  "mercedes-benz": { canon: "Mercedes-Benz", segmento: "Lujo / Blindado", gama: "Premium" },
  mg: { canon: "MG", segmento: "Subcompacto / Compacto", gama: "Entrada" },
  mini: { canon: "Mini", segmento: "Subcompacto / Compacto", gama: "Alta" },
  mitsubishi: { canon: "Mitsubishi", segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  nissan: { canon: "Nissan", segmento: "Subcompacto / Compacto", gama: "Entrada" },
  peugeot: { canon: "Peugeot", segmento: "Subcompacto / Compacto", gama: "Entrada" },
  porsche: { canon: "Porsche", segmento: "Deportivo", gama: "Premium" },
  ram: { canon: "RAM", segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  renault: { canon: "Renault", segmento: "Subcompacto / Compacto", gama: "Entrada" },
  seat: { canon: "Seat", segmento: "Subcompacto / Compacto", gama: "Media" },
  subaru: { canon: "Subaru", segmento: "Subcompacto / Compacto", gama: "Media" },
  suzuki: { canon: "Suzuki", segmento: "Subcompacto / Compacto", gama: "Entrada" },
  tesla: { canon: "Tesla", segmento: "Deportivo", gama: "Alta" },
  toyota: { canon: "Toyota", segmento: "Subcompacto / Compacto", gama: "Media" },
  volkswagen: { canon: "Volkswagen", segmento: "Subcompacto / Compacto", gama: "Media" },
  volvo: { canon: "Volvo", segmento: "Lujo / Blindado", gama: "Alta" },
};

export const MARCAS_CANONICAS = Object.values(MARCA_DEFAULTS).map((v) => v.canon);

// ---------- Mapeo segmento catálogo → interno ----------
const SEGMENTO_MAP: Record<string, Segmento> = {
  "Subcompactos": "Subcompacto / Compacto",
  "Compactos": "Subcompacto / Compacto",
  "SUV's": "SUV / Minivan / Pick-up",
  "SUV": "SUV / Minivan / Pick-up",
  "SUVs": "SUV / Minivan / Pick-up",
  "Pick Ups": "SUV / Minivan / Pick-up",
  "Pick-Up": "SUV / Minivan / Pick-up",
  "Minivans": "SUV / Minivan / Pick-up",
  "De Lujo": "Lujo / Blindado",
  "Deportivos": "Deportivo",
};

function mapSegmento(raw: string): Segmento {
  const t = String(raw).trim();
  return (SEGMENTO_MAP[t] as Segmento) ?? "Subcompacto / Compacto";
}
function mapGama(raw: string): Gama {
  const g = String(raw).trim() as Gama;
  if (["Entrada", "Media", "Alta", "Premium"].includes(g)) return g;
  return "Media";
}

// ---------- Carga catálogo JSON (server-side) ----------
type CatalogVehiculo = {
  marca: string;
  modelo: string;
  segmento: string;
  gama: string;
  categoria: string;
  tipo: string;
  origen: string;
  paisOrigen: string;
};

let _catalogLoaded = false;
let _catalogVehiculos: CatalogVehiculo[] = [];
let _catalogIndex: Map<string, CatalogVehiculo> = new Map(); // key = marcaNorm::modeloNorm
let _catalogByMarca: Map<string, CatalogVehiculo[]> = new Map();

function loadCatalog(): void {
  if (_catalogLoaded) return;
  _catalogLoaded = true;
  try {
    // Solo en server (fs disponible)
    if (typeof window !== "undefined") return;
    const fs = require("fs");
    const path = require("path");
    const catalogPath = path.join(process.cwd(), "catalogos", "vehiculos-clasificacion.json");
    const raw = fs.readFileSync(catalogPath, "utf8");
    const parsed = JSON.parse(raw);
    const list: CatalogVehiculo[] = parsed.vehiculos ?? [];
    _catalogVehiculos = list;

    for (const v of list) {
      const mNorm = normalizeMarca(v.marca);
      const modNorm = normalizeModelo(v.modelo);
      const key = `${mNorm}::${modNorm}`;
      // Deduplicar: si ya existe y tiene mismo segmento/gama, skip; si distinto, mantener primero
      if (!_catalogIndex.has(key)) {
        _catalogIndex.set(key, v);
      }
      // Variante sin marca prefix (ej. "Mazda 3 Hatchback" -> "3 hatchback" sin "mazda")
      const noBrand = modNorm.startsWith(mNorm + " ") ? modNorm.slice(mNorm.length + 1) : modNorm;
      if (noBrand !== modNorm) {
        const key2 = `${mNorm}::${noBrand}`;
        if (!_catalogIndex.has(key2)) _catalogIndex.set(key2, v);
      }
      // Variante sin espacios (cx 5 -> cx5)
      const noSpace = modNorm.replace(/\s+/g, "");
      if (noSpace !== modNorm) {
        const k3 = `${mNorm}::${noSpace}`;
        if (!_catalogIndex.has(k3)) _catalogIndex.set(k3, v);
      }
      // Index por marca
      if (!_catalogByMarca.has(mNorm)) _catalogByMarca.set(mNorm, []);
      _catalogByMarca.get(mNorm)!.push(v);
    }
  } catch (e) {
    // Fallback silencioso a catálogo hardcodeado previo si falla carga
    console.warn("[vehiculos] No se pudo cargar catalogos/vehiculos-clasificacion.json, usando fallback", (e as any)?.message);
  }
}

// Intentar cargar al importar (server)
if (typeof window === "undefined") {
  loadCatalog();
}

// Fallback hardcodeado mínimo (por si el archivo no está disponible, ej. cliente)
export const MODELO_EXACT: Record<string, { segmento: Segmento; gama: Gama }> = {
  // Se mantiene para compatibilidad pero ahora es derivado del catálogo cuando existe
  // Si el catálogo cargó, MODELO_EXACT se ignora y se usa _catalogIndex
  "nissan::march": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "nissan::versa": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
};

// Si catálogo cargó, exponer también como MODELO_EXACT dinámico para rutas que lo usan
function getDynamicModeloExact(): Record<string, { segmento: Segmento; gama: Gama }> {
  if (_catalogIndex.size > 0) {
    const out: Record<string, { segmento: Segmento; gama: Gama }> = {};
    for (const [k, v] of _catalogIndex.entries()) {
      out[k] = { segmento: mapSegmento(v.segmento), gama: mapGama(v.gama) };
    }
    // También añadir originales hardcodeados si no están
    for (const [k, v] of Object.entries(MODELO_EXACT)) {
      if (!out[k]) out[k] = v;
    }
    return out;
  }
  return MODELO_EXACT;
}

// Para mantener compatibilidad con import { MODELO_EXACT } en rutas, exportamos getter dinámico
// Pero como const no se puede reasignar, exponemos función helper
export function getModeloExactMap(): Record<string, { segmento: Segmento; gama: Gama }> {
  loadCatalog();
  return getDynamicModeloExact();
}

// Mapa normalizado dinámico (incluye variantes)
let _dynamicNormMap: Record<string, { segmento: Segmento; gama: Gama }> | null = null;
function getDynamicNormMap(): Record<string, { segmento: Segmento; gama: Gama }> {
  loadCatalog();
  if (_dynamicNormMap) return _dynamicNormMap;
  const map = getDynamicModeloExact();
  const out: Record<string, { segmento: Segmento; gama: Gama }> = { ...map };
  // Añadir variantes noSpace y hyphen ya incluidas en load, pero aseguramos
  for (const [k, v] of Object.entries(map)) {
    const [ma, mo] = k.split("::");
    const noSpace = mo.replace(/\s+/g, "");
    if (noSpace !== mo) out[`${ma}::${noSpace}`] = v;
    const withHyphen = mo.replace(/\s+/g, "-");
    if (withHyphen !== mo && withHyphen !== noSpace) out[`${ma}::${withHyphen}`] = v;
  }
  _dynamicNormMap = out;
  return out;
}

// ---------- Keywords fallback ----------
type KeywordRule = { keywords: string[]; segmento: Segmento; gama: Gama };
const KEYWORD_RULES: KeywordRule[] = [
  { keywords: ["911", "cayman", "boxster", "panamera", "corvette", "supra", "gtr", "gt-r", "mustang", "camaro", "challenger", "charger"], segmento: "Deportivo", gama: "Premium" },
  { keywords: ["mx-5", "miata", "mx5", "brz", "86", "wrx", "type r", "gti", "golf r"], segmento: "Deportivo", gama: "Media" },
  { keywords: ["hilux", "tacoma", "tundra", "frontier", "np300", "navara", "l200", "triton", "amarok", "saveiro", "ranger", "f-150", "f150", "lobo", "silverado", "cheyenne", "colorado", "s10", "gladiator", "titan"], segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  { keywords: ["tahoe", "suburban", "yukon", "escalade", "expedition", "pilot", "highlander", "palissade", "palisade", "teramont", "atlas", "traverse", "grand cherokee", "wrangler", "4runner", "land cruiser", "prado", "montero"], segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  { keywords: ["cx-5", "cx5", "cx-50", "cx-30", "cx30", "cr-v", "crv", "rav4", "rav 4", "tiguan", "taos", "forester", "outback", "sportage", "tucson", "qashqai", "x-trail", "xtrail", "equinox", "escape", "edge", "hr-v", "hrv", "zr-v", "corolla cross", "outlander"], segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  { keywords: ["kicks", "creta", "venue", "soul", "seltos", "sonet", "tracker", "trax", "groove", "captur", "duster", "renegade", "jimny", "vitara", "ertiga", "xl7", "arona", "t-cross", "tcross", "nivus", "pulse", "kwid"], segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  { keywords: ["odyssey", "sienna", "carnival", "sedona", "pacifica", "sharan", "alaskan", "touran"], segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  { keywords: ["camry", "accord", "altima", "maxima", "passat", "fusion", "malibu", "sonata"], segmento: "Subcompacto / Compacto", gama: "Alta" },
  { keywords: ["jetta", "golf", "civic", "corolla", "sentra", "mazda3", "mazda 3", "forte", "elantra", "leon"], segmento: "Subcompacto / Compacto", gama: "Media" },
  { keywords: ["march", "versa", "aveo", "onix", "rio", "swift", "baleno", "ignis", "polo", "virtus", "vento", "kwid", "logan", "sandero", "208", "301"], segmento: "Subcompacto / Compacto", gama: "Entrada" },
];

// ---------- Lookup principal ----------
export function lookupVehiculo(marcaRaw: string, modeloRaw: string): VehiculoLookupResult | null {
  loadCatalog();
  const marcaInput = String(marcaRaw).trim();
  const modeloInput = String(modeloRaw).trim();
  if (!marcaInput || !modeloInput) return null;

  const mNorm = normalizeMarca(marcaInput);
  const modNorm = normalizeModelo(modeloInput);

  const marcaEntry = MARCA_DEFAULTS[mNorm];
  const canonMarca = marcaEntry?.canon ?? marcaInput.trim();

  // 1) Catálogo exacto (normalizado) — fuente primaria catalogos/vehiculos-clasificacion.json
  const dynamicMap = getDynamicNormMap();
  const exactKey = `${mNorm}::${modNorm}`;
  const exactKeyNoSpace = `${mNorm}::${modNorm.replace(/\s+/g, "")}`;
  let exact = dynamicMap[exactKey] ?? dynamicMap[exactKeyNoSpace] ?? null;

  // Si no exacto, intentar búsqueda parcial en catálogo para casos como "3" -> "3 hatchback"
  if (!exact && _catalogByMarca.has(mNorm)) {
    const candidates = _catalogByMarca.get(mNorm)!;
    // Buscar donde modelo sin marca prefix empieza con el input
    const inputNoSpace = modNorm.replace(/\s+/g, " ");
    for (const cand of candidates) {
      const candNorm = normalizeModelo(cand.modelo);
      const candNoBrand = candNorm.startsWith(mNorm + " ") ? candNorm.slice(mNorm.length + 1) : candNorm;
      // Exact sin marca
      if (candNoBrand === modNorm) {
        exact = { segmento: mapSegmento(cand.segmento), gama: mapGama(cand.gama) };
        break;
      }
      // Prefijo: "3 hatchback" startsWith "3 "
      if (candNoBrand.startsWith(modNorm + " ") || candNorm.startsWith(mNorm + " " + modNorm + " ")) {
        exact = { segmento: mapSegmento(cand.segmento), gama: mapGama(cand.gama) };
        break;
      }
      // Substring como último recurso si input es substring del modelo (ej. Hilux dentro de Hilux Cc)
      if (candNoBrand.includes(modNorm) || candNorm.includes(modNorm)) {
        // Solo si el input es palabra completa contenida
        // Evitar falsos positivos de "3" en "cx 3" — requerir que sea palabra aislada
        const tokens = candNoBrand.split(" ");
        if (tokens.includes(modNorm) || tokens.some(t => t === modNorm || t.startsWith(modNorm))) {
          exact = { segmento: mapSegmento(cand.segmento), gama: mapGama(cand.gama) };
          break;
        }
        // Si no es token exacto pero es substring largo (ej. hilux), aceptar
        if (modNorm.length >= 4 && candNoBrand.includes(modNorm)) {
          exact = { segmento: mapSegmento(cand.segmento), gama: mapGama(cand.gama) };
          break;
        }
      }
    }
    // Si aún no encontrado, buscar sin filtro de marca para modelos únicos (opcional)
  }

  if (exact) {
    // Encontrado en catálogo JSON
    const source = _catalogIndex.size > 0 ? "catalogos/vehiculos-clasificacion.json" : "catalog_exact";
    // Recuperar entrada completa para extra si existe
    let extra: Record<string, any> | undefined;
    if (_catalogIndex.has(exactKey) || _catalogIndex.has(exactKeyNoSpace)) {
      const rawEntry = _catalogIndex.get(exactKey) ?? _catalogIndex.get(exactKeyNoSpace);
      if (rawEntry) extra = { tipo: rawEntry.tipo, categoria: rawEntry.categoria, origen: rawEntry.origen, paisOrigen: rawEntry.paisOrigen, modeloCatalogo: rawEntry.modelo };
    } else if (_catalogByMarca.has(mNorm)) {
      const cand = _catalogByMarca.get(mNorm)!.find(c => normalizeModelo(c.modelo).includes(modNorm));
      if (cand) extra = { tipo: cand.tipo, categoria: cand.categoria, origen: cand.origen, paisOrigen: cand.paisOrigen, modeloCatalogo: cand.modelo };
    }
    return {
      marca: canonMarca,
      marcaInput,
      modelo: modeloInput.trim(),
      modeloInput,
      segmento: exact.segmento,
      gama: exact.gama,
      mActivoBase: (() => { try { return getM_activo(exact.segmento, exact.gama, "SEMINUEVO"); } catch { return null; } })(),
      confidence: "exact",
      source,
      extra,
    };
  }

  // 2) Keyword fallback
  const modNormNoSpace = modNorm.replace(/\s+/g, "");
  for (const rule of KEYWORD_RULES) {
    if (
      rule.keywords.some((kw) => {
        const kwNorm = normalizeModelo(kw);
        const kwNoSpace = kwNorm.replace(/\s+/g, "");
        return modNorm.includes(kwNorm) || modNormNoSpace.includes(kwNoSpace) || modNorm.includes(kwNoSpace) || modNormNoSpace.includes(kwNorm);
      })
    ) {
      return {
        marca: canonMarca,
        marcaInput,
        modelo: modeloInput.trim(),
        modeloInput,
        segmento: rule.segmento,
        gama: rule.gama,
        mActivoBase: (() => { try { return getM_activo(rule.segmento, rule.gama, "SEMINUEVO"); } catch { return null; } })(),
        confidence: "keyword",
        source: "keyword_match",
      };
    }
  }

  // 3) Marca default
  if (marcaEntry) {
    return {
      marca: canonMarca,
      marcaInput,
      modelo: modeloInput.trim(),
      modeloInput,
      segmento: marcaEntry.segmento,
      gama: marcaEntry.gama,
      mActivoBase: (() => { try { return getM_activo(marcaEntry.segmento, marcaEntry.gama, "SEMINUEVO"); } catch { return null; } })(),
      confidence: "marca_default",
      source: "marca_default",
    };
  }

  // 4) Fallback
  return {
    marca: canonMarca,
    marcaInput,
    modelo: modeloInput.trim(),
    modeloInput,
    segmento: "Subcompacto / Compacto",
    gama: "Media",
    mActivoBase: (() => { try { return getM_activo("Subcompacto / Compacto", "Media", "SEMINUEVO"); } catch { return null; } })(),
    confidence: "fallback",
    source: "fallback",
  };
}

export function listModelosForMarca(marcaRaw: string): { marca: string; modelos: { modelo: string; segmento: Segmento; gama: Gama }[] } | null {
  loadCatalog();
  const mNorm = normalizeMarca(marcaRaw);
  const entry = MARCA_DEFAULTS[mNorm];
  if (!entry) return null;

  // Si catálogo cargado, listar desde ahí
  if (_catalogByMarca.has(mNorm)) {
    const list = _catalogByMarca.get(mNorm)!;
    // Deduplicar por modelo normalizado
    const seen = new Set<string>();
    const modelos: { modelo: string; segmento: Segmento; gama: Gama }[] = [];
    for (const v of list) {
      const key = normalizeModelo(v.modelo);
      if (seen.has(key)) continue;
      seen.add(key);
      modelos.push({ modelo: v.modelo, segmento: mapSegmento(v.segmento), gama: mapGama(v.gama) });
    }
    modelos.sort((a, b) => a.modelo.localeCompare(b.modelo));
    return { marca: entry.canon, modelos };
  }

  // Fallback a MODELO_EXACT hardcodeado
  const modelos = Object.entries(getDynamicModeloExact())
    .filter(([k]) => k.startsWith(`${mNorm}::`))
    .map(([k, v]) => ({ modelo: k.split("::")[1], segmento: v.segmento, gama: v.gama }));
  return { marca: entry.canon, modelos };
}

export function validateVehiculoInput(marca: unknown, modelo: unknown): { valid: boolean; error?: string; marca?: string; modelo?: string } {
  if (!marca || String(marca).trim().length === 0) return { valid: false, error: "Parámetro 'marca' es requerido." };
  if (!modelo || String(modelo).trim().length === 0) return { valid: false, error: "Parámetro 'modelo' es requerido." };
  const m = String(marca).trim();
  const mod = String(modelo).trim();
  if (m.length < 2) return { valid: false, error: "Marca debe tener al menos 2 caracteres." };
  if (mod.length < 1) return { valid: false, error: "Modelo debe tener al menos 1 caracter." };
  if (m.length > 40) return { valid: false, error: "Marca demasiado larga (máx 40)." };
  if (mod.length > 60) return { valid: false, error: "Modelo demasiado largo (máx 60)." };
  return { valid: true, marca: m, modelo: mod };
}

// Exponer util para rutas que necesitan contar modelos
export function getCatalogStats(): { total: number; porMarca: Record<string, number> } {
  loadCatalog();
  if (_catalogVehiculos.length === 0) return { total: 0, porMarca: {} };
  const porMarca: Record<string, number> = {};
  for (const v of _catalogVehiculos) {
    const m = normalizeMarca(v.marca);
    porMarca[m] = (porMarca[m] || 0) + 1;
  }
  return { total: _catalogVehiculos.length, porMarca };
}
