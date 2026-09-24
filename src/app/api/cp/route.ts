import { NextRequest, NextResponse } from "next/server";
import { lookupCp, validateCp } from "@/lib/sepomex";

export const dynamic = "force-dynamic";

function jsonWithCache(body: any, status: number, cache: string = "public, s-maxage=86400, stale-while-revalidate=43200") {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": cache,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// GET /api/cp?cp=01000
// También acepta ?codigo=, ?zip=, ?q= por flexibilidad
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw =
    searchParams.get("cp") ??
    searchParams.get("codigo") ??
    searchParams.get("codigo_postal") ??
    searchParams.get("zip") ??
    searchParams.get("q") ??
    searchParams.get("code");

  // Modo info si no hay cp: documenta el endpoint
  if (!raw) {
    return jsonWithCache(
      {
        ok: true,
        info: "Endpoint de consulta de Códigos Postales (SEPOMEX)",
        endpoint: "GET /api/cp?cp={5 digitos}",
        alternativas: ["GET /api/cp?cp=01000", "GET /api/cp/01000", "GET /api/cp?codigo=01000"],
        params: {
          cp: "Requerido — exactamente 5 dígitos numéricos (ej. 01000)",
        },
        response: {
          cp: "01000",
          estado: "Ciudad de México",
          municipio: "Álvaro Obregón",
          ciudad: "Ciudad de México",
          colonias: ["San Ángel", "San Ángel Inn"],
          asentamientos: [{ colonia: "San Ángel", tipo: "Colonia", zona: "Urbano", ciudad: "Ciudad de México", cp: "01000" }],
          source: "sepomex.kurenn.dev",
        },
        validacion: "CP_REGEX = /^\\d{5}$/",
      },
      200,
      "public, s-maxage=300"
    );
  }

  const v = validateCp(raw);
  if (!v.valid) {
    return jsonWithCache({ ok: false, error: v.error, cp: raw ? String(raw).trim() : null }, 400, "no-store");
  }

  const cp = v.cp!;

  try {
    const result = await lookupCp(cp);

    if (!result) {
      return jsonWithCache(
        {
          ok: false,
          error: "Código postal no encontrado",
          cp,
          hint: "Verifica que el CP exista en el catálogo SEPOMEX (01000-99998).",
        },
        404,
        "public, s-maxage=60"
      );
    }

    return jsonWithCache(
      {
        ok: true,
        cp: result.cp,
        estado: result.estado,
        municipio: result.municipio,
        ciudad: result.ciudad,
        colonias: result.colonias,
        asentamientos: result.asentamientos,
        meta: {
          totalColonias: result.colonias.length,
          totalAsentamientos: result.asentamientos.length,
          estadoCodigo: result.estadoCodigo ?? null,
          municipioCodigo: result.municipioCodigo ?? null,
          source: result.source,
        },
      },
      200
    );
  } catch (e: any) {
    return jsonWithCache(
      {
        ok: false,
        error: "Error consultando el catálogo de códigos postales",
        cp,
        detail: e?.message ?? String(e),
      },
      502,
      "no-store"
    );
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
