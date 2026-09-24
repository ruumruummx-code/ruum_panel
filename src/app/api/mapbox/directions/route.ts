import { NextRequest, NextResponse } from "next/server";
import { mapboxDirections, isMapboxConfigured } from "@/lib/mapbox";

export const dynamic = "force-dynamic";

function corsJson(body: any, status: number, cache = "public, s-maxage=60") {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": cache,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// GET /api/mapbox/directions?coords=-99.13,19.43;-100.31,20.58
// POST { coords: [[lng,lat],[lng,lat]], alternatives?: boolean }
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const coordsParam = searchParams.get("coords") || searchParams.get("coordinates") || "";

  if (!isMapboxConfigured()) {
    return corsJson({ ok: false, error: "Mapbox token no configurado" }, 503, "no-store");
  }

  let coordsList: [number, number][] = [];
  if (coordsParam) {
    try {
      // coords=-99.13,19.43;-100.31,20.58
      coordsList = coordsParam.split(";").map((p) => {
        const [lng, lat] = p.split(",").map(Number);
        if (isNaN(lng) || isNaN(lat)) throw new Error("Coordenada inválida");
        return [lng, lat] as [number, number];
      });
    } catch (e: any) {
      return corsJson({ ok: false, error: e.message, example: "/api/mapbox/directions?coords=-99.13,19.43;-100.31,20.58" }, 400, "no-store");
    }
  } else {
    return corsJson({ ok: false, error: "Parámetro 'coords' requerido. Formato: lng,lat;lng,lat", coords: coordsParam }, 400, "no-store");
  }

  if (coordsList.length < 2) {
    return corsJson({ ok: false, error: "Se requieren al menos 2 coordenadas" }, 400, "no-store");
  }
  if (coordsList.length > 25) {
    return corsJson({ ok: false, error: "Máximo 25 coordenadas" }, 400, "no-store");
  }

  try {
    const result = await mapboxDirections(coordsList);
    return corsJson({ ok: true, ...result, coords: coordsList }, 200);
  } catch (e: any) {
    return corsJson({ ok: false, error: e?.message ?? "Error en directions", coords: coordsList }, 502, "no-store");
  }
}

export async function POST(req: NextRequest) {
  if (!isMapboxConfigured()) {
    return corsJson({ ok: false, error: "Mapbox token no configurado" }, 503, "no-store");
  }
  try {
    const body = await req.json();
    const coordsList: [number, number][] = body.coords || body.coordinates;
    if (!Array.isArray(coordsList) || coordsList.length < 2) {
      return corsJson({ ok: false, error: "Body requiere { coords: [[lng,lat],[lng,lat]] }" }, 400, "no-store");
    }
    const result = await mapboxDirections(coordsList, { alternatives: body.alternatives });
    return corsJson({ ok: true, ...result, coords: coordsList }, 200);
  } catch (e: any) {
    return corsJson({ ok: false, error: e?.message ?? "Error en directions" }, 502, "no-store");
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
