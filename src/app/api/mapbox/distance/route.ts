import { NextRequest, NextResponse } from "next/server";
import { getDistanceByCp, isMapboxConfigured } from "@/lib/mapbox";

export const dynamic = "force-dynamic";

function corsJson(body: any, status: number, cache = "public, s-maxage=300") {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": cache,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

const CP_REGEX = /^\d{5}$/;

// GET /api/mapbox/distance?cpOrigen=01000&cpDestino=76100
// GET /api/mapbox/distance?origen=01000&destino=76100
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cpOrigen = searchParams.get("cpOrigen") || searchParams.get("origen") || searchParams.get("cpO") || "";
  const cpDestino = searchParams.get("cpDestino") || searchParams.get("destino") || searchParams.get("cpD") || "";

  if (!CP_REGEX.test(cpOrigen) || !CP_REGEX.test(cpDestino)) {
    return corsJson(
      {
        ok: false,
        error: "cpOrigen y cpDestino deben ser 5 dígitos",
        example: "/api/mapbox/distance?cpOrigen=01000&cpDestino=76100",
        validacion: "CP_REGEX = /^\\d{5}$/",
        mapbox: isMapboxConfigured() ? "configurado" : "no configurado (usará estimado)",
      },
      400,
      "no-store"
    );
  }

  try {
    const r = await getDistanceByCp(cpOrigen.trim(), cpDestino.trim());
    return corsJson(
      {
        ok: true,
        cpOrigen: cpOrigen.trim(),
        cpDestino: cpDestino.trim(),
        distanceKm: r.distanceKm,
        durationMin: r.durationMin,
        horas: r.horas,
        source: r.source,
        mapbox: isMapboxConfigured() ? "enabled" : "fallback-estimado",
      },
      200
    );
  } catch (e: any) {
    return corsJson({ ok: false, error: e?.message ?? "Error calculando distancia" }, 502, "no-store");
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cpOrigen = String(body.cpOrigen || body.origen || "").trim();
    const cpDestino = String(body.cpDestino || body.destino || "").trim();
    if (!CP_REGEX.test(cpOrigen) || !CP_REGEX.test(cpDestino)) {
      return corsJson({ ok: false, error: "cpOrigen y cpDestino 5 dígitos requeridos" }, 400, "no-store");
    }
    const r = await getDistanceByCp(cpOrigen, cpDestino);
    return corsJson({ ok: true, cpOrigen, cpDestino, distanceKm: r.distanceKm, durationMin: r.durationMin, horas: r.horas, source: r.source }, 200);
  } catch (e: any) {
    return corsJson({ ok: false, error: e?.message ?? "Error" }, 500, "no-store");
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
