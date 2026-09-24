// Backend Mapbox helpers — token oculto, cache, geocode/directions
// Usa MAPBOX_ACCESS_TOKEN (server) con fallback a NEXT_PUBLIC para compatibilidad

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const MAPBOX_BASE = "https://api.mapbox.com";

export function isMapboxConfigured(): boolean {
  return !!MAPBOX_TOKEN;
}

export function getMapboxToken(): string {
  return MAPBOX_TOKEN;
}

// Simple in-memory cache con TTL
type CacheEntry<T> = { data: T; exp: number };
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_GEOCODE = 1000 * 60 * 60 * 24; // 24h
const CACHE_TTL_DIRECTIONS = 1000 * 60 * 30; // 30min

function getCached<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.exp) {
    cache.delete(key);
    return null;
  }
  return e.data as T;
}
function setCached<T>(key: string, data: T, ttl: number) {
  if (cache.size > 500) {
    const first = cache.keys().next().value as string;
    cache.delete(first);
  }
  cache.set(key, { data, exp: Date.now() + ttl });
}

// Geocode — búsqueda predictiva
export async function mapboxGeocode(query: string, opts?: { limit?: number; country?: string; language?: string; types?: string }): Promise<any[]> {
  if (!MAPBOX_TOKEN) throw new Error("Mapbox token no configurado");
  const q = query.trim();
  if (q.length < 3) return [];
  const cacheKey = `geocode:${q}:${opts?.limit ?? 5}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    country: opts?.country ?? "MX",
    language: opts?.language ?? "es",
    limit: String(opts?.limit ?? 5),
    types: opts?.types ?? "address,place,locality,neighborhood,postcode,poi",
  });
  const url = `${MAPBOX_BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?${params.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mapbox geocode error ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  const features = data.features || [];
  setCached(cacheKey, features, CACHE_TTL_GEOCODE);
  return features;
}

// Geocode CP → coords (para cotizar por CP)
export async function geocodeByCp(cp: string): Promise<[number, number] | null> {
  if (!/^\d{5}$/.test(cp)) return null;
  const cacheKey = `cp:${cp}`;
  const cached = getCached<[number, number]>(cacheKey);
  if (cached) return cached;
  const features = await mapboxGeocode(cp, { limit: 1, types: "postcode" });
  if (!features.length || !features[0].center) return null;
  const coords: [number, number] = [features[0].center[0], features[0].center[1]];
  setCached(cacheKey, coords, CACHE_TTL_GEOCODE);
  return coords;
}

// Directions — distancia/tiempo
export type DirectionsResult = {
  distanceKm: number;
  durationMin: number;
  durationSec: number;
  distanceM: number;
  geometry?: any;
  source: "mapbox";
};

export async function mapboxDirections(coordsList: [number, number][], opts?: { alternatives?: boolean }): Promise<DirectionsResult> {
  if (!MAPBOX_TOKEN) throw new Error("Mapbox token no configurado");
  if (coordsList.length < 2) throw new Error("Se requieren al menos 2 coordenadas");
  const key = `directions:${coordsList.map((c) => c.join(",")).join(";")}`;
  const cached = getCached<DirectionsResult>(key);
  if (cached) return cached;

  const coordsStr = coordsList.map((c) => `${c[0]},${c[1]}`).join(";");
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    alternatives: String(opts?.alternatives ?? false),
    geometries: "geojson",
    overview: "full",
  });
  const url = `${MAPBOX_BASE}/directions/v5/mapbox/driving/${coordsStr}?${params.toString()}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mapbox directions error ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = await res.json();
  if (!data.routes || data.routes.length === 0) throw new Error("No se pudo resolver la ruta con Mapbox");
  const route = data.routes[0];
  const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
  const durationMin = Math.round(route.duration / 60);
  const result: DirectionsResult = {
    distanceKm,
    durationMin,
    durationSec: Math.round(route.duration),
    distanceM: Math.round(route.distance),
    geometry: route.geometry,
    source: "mapbox",
  };
  setCached(key, result, CACHE_TTL_DIRECTIONS);
  return result;
}

// Heurística determinística por CP (fallback idéntico a cotizar/ paso3)
export function estimateDistanceByCp(cpOrigen: string, cpDestino: string): { km: number; horas: number; min: number } {
  const a = parseInt(cpOrigen, 10);
  const b = parseInt(cpDestino, 10);
  const diff = Math.abs(a - b);
  let km = (diff % 380) + 12 + ((a % 7) + (b % 5));
  km = Math.max(8, Math.min(420, Math.round(km)));
  const horas = Math.max(1, Math.round((km / 62 + 0.5) * 2) / 2);
  const min = Math.round(horas * 60);
  return { km, horas, min };
}

// Intenta Mapbox por CP, fallback a heurística
export async function getDistanceByCp(cpOrigen: string, cpDestino: string): Promise<{ distanceKm: number; durationMin: number; horas: number; source: string }> {
  if (isMapboxConfigured()) {
    try {
      const [c1, c2] = await Promise.all([geocodeByCp(cpOrigen), geocodeByCp(cpDestino)]);
      if (c1 && c2) {
        const r = await mapboxDirections([c1, c2]);
        const horas = Math.max(1, Math.round((r.distanceKm / 62 + 0.5) * 2) / 2);
        return { distanceKm: r.distanceKm, durationMin: r.durationMin, horas, source: "mapbox" };
      }
    } catch {
      // fallback
    }
  }
  const est = estimateDistanceByCp(cpOrigen, cpDestino);
  return { distanceKm: est.km, durationMin: est.min, horas: est.horas, source: "estimado" };
}
