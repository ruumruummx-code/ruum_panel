// Vehículos — lookup marca + modelo → segmento / gama (TAD v2.0)
// Segmento / Gama alineados con src/lib/tad.ts
import type { Segmento, Gama } from "./tad";
import { getM_activo } from "./tad";

export type VehiculoLookupResult = {
  marca: string; // canónica
  marcaInput: string;
  modelo: string; // canónico / input normalizado
  modeloInput: string;
  segmento: Segmento;
  gama: Gama;
  mActivoBase: number | null; // valor de matriz sin ajuste condición
  confidence: "exact" | "keyword" | "marca_default" | "fallback";
  source: string;
};

// ---------- Normalización ----------
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
export function normalizeMarca(raw: string): string {
  const s = stripAccents(String(raw).trim().toLowerCase());
  // alias
  const alias: Record<string, string> = {
    vw: "volkswagen",
    "mercedes": "mercedes-benz",
    "mercedes benz": "mercedes-benz",
    "mercedes-benz": "mercedes-benz",
    seat: "seat",
    "land rover": "land rover",
  };
  return alias[s] ?? s;
}
export function normalizeModelo(raw: string): string {
  const s = stripAccents(String(raw).trim().toLowerCase());
  // colapsa espacios, guiones
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

// ---------- Catálogo exacto marca::modelo ----------
// Clave: `${marcaNorm}::${modeloNorm}`
// Mantiene casos donde el modelo cambia segmento/gama respecto al default de marca
export const MODELO_EXACT: Record<string, { segmento: Segmento; gama: Gama }> = {
  // Nissan
  "nissan::march": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "nissan::versa": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "nissan::v-drive": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "nissan::sentra": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "nissan::altima": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "nissan::maxima": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "nissan::kicks": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "nissan::qashqai": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "nissan::x-trail": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "nissan::xtrail": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "nissan::rogue": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "nissan::pathfinder": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "nissan::patrol": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "nissan::np300": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "nissan::frontier": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "nissan::navara": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "nissan::titan": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "nissan::urvan": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "nissan::gt-r": { segmento: "Deportivo", gama: "Premium" },
  "nissan::gtr": { segmento: "Deportivo", gama: "Premium" },
  "nissan::370z": { segmento: "Deportivo", gama: "Alta" },
  "nissan::z": { segmento: "Deportivo", gama: "Alta" },

  // Toyota
  "toyota::yaris": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "toyota::corolla": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "toyota::camry": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "toyota::avalon": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "toyota::prius": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "toyota::yaris cross": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "toyota::corolla cross": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "toyota::rav4": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "toyota::rav 4": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "toyota::highlander": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "toyota::4runner": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "toyota::fortuner": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "toyota::land cruiser": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "toyota::prado": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "toyota::hilux": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "toyota::tacoma": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "toyota::tundra": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "toyota::sienna": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "toyota::avanza": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "toyota::innova": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "toyota::sequoia": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "toyota::supra": { segmento: "Deportivo", gama: "Premium" },
  "toyota::86": { segmento: "Deportivo", gama: "Media" },
  "toyota::gr86": { segmento: "Deportivo", gama: "Media" },

  // Volkswagen
  "volkswagen::polo": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "volkswagen::virtus": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "volkswagen::vento": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "volkswagen::jetta": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "volkswagen::golf": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "volkswagen::passat": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "volkswagen::t-cross": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "volkswagen::tcross": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "volkswagen::t cross": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "volkswagen::nivus": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "volkswagen::taos": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "volkswagen::tiguan": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "volkswagen::teramont": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "volkswagen::touareg": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "volkswagen::saveiro": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "volkswagen::amarok": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "volkswagen::caddy": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "volkswagen::sharan": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "volkswagen::gti": { segmento: "Deportivo", gama: "Media" },
  "volkswagen::golf gti": { segmento: "Deportivo", gama: "Media" },
  "volkswagen::golf r": { segmento: "Deportivo", gama: "Alta" },

  // Mazda
  "mazda::2": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "mazda::mazda2": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "mazda::3": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "mazda::mazda3": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "mazda::6": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "mazda::cx-3": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "mazda::cx-30": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "mazda::cx30": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "mazda::cx-5": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "mazda::cx5": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "mazda::cx-50": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "mazda::cx-9": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "mazda::cx-90": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "mazda::mx-5": { segmento: "Deportivo", gama: "Media" },
  "mazda::miata": { segmento: "Deportivo", gama: "Media" },
  "mazda::bt-50": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },

  // Honda
  "honda::city": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "honda::civic": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "honda::accord": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "honda::insight": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "honda::br-v": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "honda::brv": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "honda::hr-v": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "honda::hrv": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "honda::zr-v": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "honda::cr-v": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "honda::crv": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "honda::pilot": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "honda::passport": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "honda::odyssey": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "honda::ridgeline": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "honda::type r": { segmento: "Deportivo", gama: "Alta" },

  // Chevrolet
  "chevrolet::aveo": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "chevrolet::sail": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "chevrolet::onix": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "chevrolet::cavalier": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "chevrolet::malibu": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "chevrolet::camaro": { segmento: "Deportivo", gama: "Alta" },
  "chevrolet::corvette": { segmento: "Deportivo", gama: "Premium" },
  "chevrolet::tracker": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "chevrolet::trax": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "chevrolet::groove": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "chevrolet::captiva": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "chevrolet::equinox": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "chevrolet::traverse": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "chevrolet::tahoe": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "chevrolet::suburban": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "chevrolet::colorado": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "chevrolet::silverado": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "chevrolet::cheyenne": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "chevrolet::s10": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "chevrolet::tornado": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "chevrolet::express": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },

  // Ford
  "ford::figo": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "ford::fiesta": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "ford::focus": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "ford::fusion": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "ford::mustang": { segmento: "Deportivo", gama: "Alta" },
  "ford::bronco": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "ford::escape": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "ford::edge": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "ford::explorer": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "ford::expedition": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "ford::territory": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "ford::ecosport": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "ford::ranger": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "ford::f-150": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "ford::f150": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "ford::lobo": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "ford::maverick": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },

  // Kia
  "kia::rio": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "kia::forte": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "kia::k3": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "kia::k4": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "kia::stinger": { segmento: "Deportivo", gama: "Alta" },
  "kia::soul": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "kia::seltos": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "kia::sonet": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "kia::nro": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "kia::niro": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "kia::sportage": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "kia::sorento": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "kia::carnival": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "kia::sedona": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },

  // Hyundai
  "hyundai::grand i10": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "hyundai::hb20": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "hyundai::elantra": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "hyundai::sonata": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "hyundai::creta": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "hyundai::creta grand": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "hyundai::venue": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "hyundai::tucson": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "hyundai::santa fe": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "hyundai::palisade": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },

  // Suzuki
  "suzuki::swift": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "suzuki::baleno": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "suzuki::ignis": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "suzuki::celerio": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "suzuki::jimny": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "suzuki::vitara": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "suzuki::s-cross": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "suzuki::ertiga": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "suzuki::xl7": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },

  // Seat
  "seat::ibiza": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "seat::leon": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "seat::toledo": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "seat::arona": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "seat::ateca": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "seat::tarraco": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },

  // Renault
  "renault::kwid": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "renault::logan": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "renault::sandero": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "renault::stepway": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "renault::duster": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "renault::captur": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "renault::koleos": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "renault::oroch": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },

  // Peugeot
  "peugeot::208": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "peugeot::2008": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "peugeot::3008": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "peugeot::5008": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "peugeot::301": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "peugeot::partner": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },

  // Jeep / RAM / Dodge / Chrysler
  "jeep::renegade": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "jeep::compass": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "jeep::commander": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "jeep::cherokee": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "jeep::grand cherokee": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "jeep::wrangler": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "jeep::gladiator": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "ram::700": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "ram::1200": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "ram::1500": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "ram::2500": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "dodge::attitude": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "dodge::journey": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "dodge::durango": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "dodge::challenger": { segmento: "Deportivo", gama: "Alta" },
  "dodge::charger": { segmento: "Deportivo", gama: "Alta" },
  "chrysler::pacifica": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },

  // Mitsubishi
  "mitsubishi::mirage": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "mitsubishi::lancer": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "mitsubishi::outlander": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "mitsubishi::montero": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "mitsubishi::l200": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },

  // Subaru
  "subaru::impreza": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "subaru::legacy": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "subaru::wrx": { segmento: "Deportivo", gama: "Media" },
  "subaru::brz": { segmento: "Deportivo", gama: "Media" },
  "subaru::forester": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "subaru::outback": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "subaru::crosstrek": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },

  // BMW / Mercedes / Audi / etc Lujo
  "bmw::serie 1": { segmento: "Lujo / Blindado", gama: "Alta" },
  "bmw::serie 3": { segmento: "Lujo / Blindado", gama: "Alta" },
  "bmw::serie 5": { segmento: "Lujo / Blindado", gama: "Premium" },
  "bmw::x1": { segmento: "Lujo / Blindado", gama: "Alta" },
  "bmw::x3": { segmento: "Lujo / Blindado", gama: "Alta" },
  "bmw::x5": { segmento: "Lujo / Blindado", gama: "Premium" },
  "mercedes-benz::clase a": { segmento: "Lujo / Blindado", gama: "Alta" },
  "mercedes-benz::clase c": { segmento: "Lujo / Blindado", gama: "Alta" },
  "mercedes-benz::clase e": { segmento: "Lujo / Blindado", gama: "Premium" },
  "mercedes-benz::gla": { segmento: "Lujo / Blindado", gama: "Alta" },
  "mercedes-benz::glc": { segmento: "Lujo / Blindado", gama: "Premium" },
  "audi::a1": { segmento: "Lujo / Blindado", gama: "Alta" },
  "audi::a4": { segmento: "Lujo / Blindado", gama: "Alta" },
  "audi::q5": { segmento: "Lujo / Blindado", gama: "Premium" },
  "audi::q7": { segmento: "Lujo / Blindado", gama: "Premium" },
  "porsche::911": { segmento: "Deportivo", gama: "Premium" },
  "porsche::cayenne": { segmento: "Lujo / Blindado", gama: "Premium" },
  "porsche::macan": { segmento: "Lujo / Blindado", gama: "Premium" },
  "tesla::model 3": { segmento: "Deportivo", gama: "Alta" },
  "tesla::model y": { segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  "tesla::model x": { segmento: "SUV / Minivan / Pick-up", gama: "Premium" },
  "tesla::model s": { segmento: "Deportivo", gama: "Premium" },

  // MG / BYD / Volvo / etc
  "mg::mg3": { segmento: "Subcompacto / Compacto", gama: "Entrada" },
  "mg::zs": { segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  "mg::hs": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "byd::dolphin": { segmento: "Subcompacto / Compacto", gama: "Media" },
  "byd::seal": { segmento: "Subcompacto / Compacto", gama: "Alta" },
  "byd::atto 3": { segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  "volvo::xc40": { segmento: "Lujo / Blindado", gama: "Alta" },
  "volvo::xc60": { segmento: "Lujo / Blindado", gama: "Premium" },
  "volvo::s60": { segmento: "Lujo / Blindado", gama: "Alta" },
};

// Mapa normalizado para lookup insensible a guiones/espacios/case
const MODELO_EXACT_NORM: Record<string, { segmento: Segmento; gama: Gama }> = {};
for (const [k, v] of Object.entries(MODELO_EXACT)) {
  const [ma, mo] = k.split("::");
  const normMo = normalizeModelo(mo);
  const normKey = `${ma}::${normMo}`;
  MODELO_EXACT_NORM[normKey] = v;
  // variante sin espacios (cx 5 -> cx5, t cross -> tcross) para tolerar escritura
  const noSpace = normMo.replace(/\s+/g, "");
  if (noSpace !== normMo) {
    MODELO_EXACT_NORM[`${ma}::${noSpace}`] = v;
  }
  // variante con guión (cx 5 -> cx-5) para compatibilidad histórica
  const withHyphen = normMo.replace(/\s+/g, "-");
  if (withHyphen !== normMo && withHyphen !== noSpace) {
    MODELO_EXACT_NORM[`${ma}::${withHyphen}`] = v;
  }
}

// ---------- Keywords fallback (substring) ----------
// Orden importa: más específico primero
type KeywordRule = { keywords: string[]; segmento: Segmento; gama: Gama };
const KEYWORD_RULES: KeywordRule[] = [
  // Deportivos
  { keywords: ["911", "cayman", "boxster", "panamera", "corvette", "supra", "gtr", "gt-r", "mustang", "camaro", "challenger", "charger"], segmento: "Deportivo", gama: "Premium" },
  { keywords: ["mx-5", "miata", "mx5", "brz", "86", "wrx", "type r", "gti", "golf r"], segmento: "Deportivo", gama: "Media" },
  // Pickups
  { keywords: ["hilux", "tacoma", "tundra", "frontier", "np300", "navara", "l200", "triton", "amarok", "saveiro", "ranger", "f-150", "f150", "lobo", "silverado", "cheyenne", "colorado", "s10", "gladiator", "titan"], segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  // SUVs grandes Alta
  { keywords: ["tahoe", "suburban", "yukon", "escalade", "expedition", "pilot", "highlander", "palissade", "palisade", "teramont", "atlas", "traverse", "grand cherokee", "wrangler", "4runner", "land cruiser", "prado", "montero"], segmento: "SUV / Minivan / Pick-up", gama: "Alta" },
  // SUVs medianos Media
  { keywords: ["cx-5", "cx5", "cx-50", "cx-30", "cx30", "cr-v", "crv", "rav4", "rav 4", "tiguan", "taos", "forester", "outback", "sportage", "tucson", "qashqai", "x-trail", "xtrail", "equinox", "escape", "edge", "hr-v", "hrv", "zr-v", "corolla cross", "outlander"], segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  // SUVs entrada
  { keywords: ["kicks", "creta", "venue", "soul", "seltos", "sonet", "tracker", "trax", "groove", "captur", "duster", "renegade", "jimny", "vitara", "ertiga", "xl7", "arona", "t-cross", "tcross", "nivus", "pulse", "kwid"], segmento: "SUV / Minivan / Pick-up", gama: "Entrada" },
  // Minivans
  { keywords: ["odyssey", "sienna", "carnival", "sedona", "pacifica", "sharan", "alaskan", "touran"], segmento: "SUV / Minivan / Pick-up", gama: "Media" },
  // Sedanes Alta
  { keywords: ["camry", "accord", "altima", "maxima", "passat", "fusion", "malibu", "sonata"], segmento: "Subcompacto / Compacto", gama: "Alta" },
  // Sedanes Media
  { keywords: ["jetta", "golf", "civic", "corolla", "sentra", "mazda3", "mazda 3", "forte", "elantra", "leon"], segmento: "Subcompacto / Compacto", gama: "Media" },
  // Sedanes Entrada
  { keywords: ["march", "versa", "aveo", "onix", "rio", "swift", "baleno", "ignis", "polo", "virtus", "vento", "kwid", "logan", "sandero", "208", "301"], segmento: "Subcompacto / Compacto", gama: "Entrada" },
];

// ---------- Lookup principal ----------
export function lookupVehiculo(marcaRaw: string, modeloRaw: string): VehiculoLookupResult | null {
  const marcaInput = String(marcaRaw).trim();
  const modeloInput = String(modeloRaw).trim();
  if (!marcaInput || !modeloInput) return null;

  const mNorm = normalizeMarca(marcaInput);
  const modNorm = normalizeModelo(modeloInput);

  // Resolver marca canónica
  const marcaEntry = MARCA_DEFAULTS[mNorm];
  const canonMarca = marcaEntry?.canon ?? marcaInput.trim();

  // 1) Exact (normalizado)
  const exactKey = `${mNorm}::${modNorm}`;
  const exactKeyNoSpace = `${mNorm}::${modNorm.replace(/\s+/g, "")}`;
  const exact = MODELO_EXACT_NORM[exactKey] ?? MODELO_EXACT_NORM[exactKeyNoSpace] ?? MODELO_EXACT[`${mNorm}::${modeloInput.toLowerCase().trim()}`];
  if (exact) {
    return {
      marca: canonMarca,
      marcaInput,
      modelo: modeloInput.trim(),
      modeloInput,
      segmento: exact.segmento,
      gama: exact.gama,
      mActivoBase: (() => { try { return getM_activo(exact.segmento, exact.gama, "SEMINUEVO"); } catch { return null; } })(),
      confidence: "exact",
      source: "catalog_exact",
    };
  }

  // 2) Keyword substring (sobre modelo normalizado, tolerante a guiones/espacios)
  const modNormNoSpace = modNorm.replace(/\s+/g, "");
  for (const rule of KEYWORD_RULES) {
    if (
      rule.keywords.some((kw) => {
        const kwNorm = normalizeModelo(kw);
        const kwNoSpace = kwNorm.replace(/\s+/g, "");
        return modNorm.includes(kwNorm) || modNormNoSpace.includes(kwNoSpace) || modNorm.includes(kwNoSpace) || modNormNoSpace.includes(kwNorm);
      })
    ) {
      // Para marcas premium, elevar gama a Premium si keyword sugiere Premium pero default es Premium ya
      // No cambiar segmento; usar regla tal cual
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
  const mNorm = normalizeMarca(marcaRaw);
  const entry = MARCA_DEFAULTS[mNorm];
  if (!entry) return null;
  const modelos = Object.entries(MODELO_EXACT)
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
  // longitudes razonables
  if (m.length > 40) return { valid: false, error: "Marca demasiado larga (máx 40)." };
  if (mod.length > 60) return { valid: false, error: "Modelo demasiado largo (máx 60)." };
  return { valid: true, marca: m, modelo: mod };
}
