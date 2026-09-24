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

// GET /api/cp/01000
export async function GET(_req: NextRequest, { params }: { params: Promise<{ cp: string }> }) {
  const { cp: raw } = await params;

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
          hint: "Verifica que el CP exista en el catálogo SEPOMEX.",
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
