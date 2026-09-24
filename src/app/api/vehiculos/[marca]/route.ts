import { NextRequest, NextResponse } from "next/server";
import { MARCA_DEFAULTS, MODELO_EXACT, normalizeMarca } from "@/lib/vehiculos";

export const dynamic = "force-dynamic";

function json(body: any, status: number, cache = "public, s-maxage=3600") {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": cache, "Access-Control-Allow-Origin": "*" },
  });
}

// GET /api/vehiculos/Nissan  → lista modelos
export async function GET(_req: NextRequest, { params }: { params: Promise<{ marca: string }> }) {
  const { marca: marcaRaw } = await params;
  const marcaDec = decodeURIComponent(marcaRaw);
  const mNorm = normalizeMarca(marcaDec);
  const entry = MARCA_DEFAULTS[mNorm];
  if (!entry) {
    return json({ ok: false, error: `Marca '${marcaDec}' no encontrada`, marcasDisponibles: Object.values(MARCA_DEFAULTS).map((v) => v.canon) }, 404, "no-store");
  }
  const modelos = Object.entries(MODELO_EXACT)
    .filter(([k]) => k.startsWith(`${mNorm}::`))
    .map(([k, v]) => ({ modelo: k.split("::")[1], segmento: v.segmento, gama: v.gama }))
    .sort((a, b) => a.modelo.localeCompare(b.modelo));

  return json(
    {
      ok: true,
      marca: entry.canon,
      segmentoDefault: entry.segmento,
      gamaDefault: entry.gama,
      modelos,
      total: modelos.length,
      hint: `Usa /api/vehiculos/${encodeURIComponent(entry.canon)}/{{modelo}} o ?marca=${encodeURIComponent(entry.canon)}&modelo={{modelo}} para lookup exacto`,
    },
    200
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
