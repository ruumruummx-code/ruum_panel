import { NextRequest, NextResponse } from "next/server";
import { mapboxGeocode, isMapboxConfigured } from "@/lib/mapbox";

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

// GET /api/mapbox/geocode?q=Av Patriotismo 12&limit=5
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || searchParams.get("query") || searchParams.get("search") || "";

  if (!q || q.trim().length < 3) {
    return corsJson({ ok: false, error: "Parámetro 'q' requerido (mín 3 caracteres)", example: "/api/mapbox/geocode?q=Av Patriotismo 12" }, 400, "no-store");
  }

  if (!isMapboxConfigured()) {
    return corsJson({ ok: false, error: "Mapbox token no configurado en backend (MAPBOX_ACCESS_TOKEN)" }, 503, "no-store");
  }

  const limit = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") || "5", 10) || 5));
  const country = searchParams.get("country") || "MX";
  const language = searchParams.get("language") || "es";
  const types = searchParams.get("types") || "address,place,locality,neighborhood,postcode,poi";

  try {
    const features = await mapboxGeocode(q, { limit, country, language, types });
    return corsJson(
      {
        ok: true,
        query: q,
        count: features.length,
        features: features.map((f: any) => ({
          id: f.id,
          text: f.text,
          place_name: f.place_name,
          center: f.center, // [lng, lat]
          place_type: f.place_type,
          address: f.address,
          context: f.context,
          properties: f.properties,
        })),
      },
      200,
      "public, s-maxage=300"
    );
  } catch (e: any) {
    return corsJson({ ok: false, error: e?.message ?? "Error en geocoding", query: q }, 502, "no-store");
  }
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
