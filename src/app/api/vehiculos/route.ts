import { NextRequest, NextResponse } from "next/server";
import { lookupVehiculo, validateVehiculoInput, MARCAS_CANONICAS, MARCA_DEFAULTS, getModeloExactMap, getCatalogStats, listModelosForMarca, normalizeMarca } from "@/lib/vehiculos";
import type { Segmento, Gama } from "@/lib/tad";

export const dynamic = "force-dynamic";

function json(body: any, status: number, cache = "public, s-maxage=3600, stale-while-revalidate=600") {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": cache,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// GET /api/vehiculos?marca=Toyota&modelo=Hilux
// Soporta alias: ?brand= & ?make= & ?model=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marcaRaw =
    searchParams.get("marca") ??
    searchParams.get("brand") ??
    searchParams.get("make") ??
    searchParams.get("fabricante");
  const modeloRaw =
    searchParams.get("modelo") ??
    searchParams.get("model") ??
    searchParams.get("version") ??
    searchParams.get("modelo_vehiculo");

  const listFlag = searchParams.get("list") === "true" || searchParams.get("catalog") === "true";

  // Modo info / catálogo si no hay params
  if (!marcaRaw && !modeloRaw) {
    const stats = getCatalogStats();
    const modeloMap = getModeloExactMap();
    const catalogo = Object.entries(MARCA_DEFAULTS).map(([k, v]) => ({
      marca: v.canon,
      segmentoDefault: v.segmento,
      gamaDefault: v.gama,
      modelosExactos: Object.entries(modeloMap).filter(([key]) => key.startsWith(`${k}::`)).length,
    }));
    return json(
      {
        ok: true,
        info: "Endpoint de lookup de vehículos — marca + modelo → segmento / gama (TAD v2.0)",
        endpoint: "GET /api/vehiculos?marca={marca}&modelo={modelo}",
        alternativas: [
          "GET /api/vehiculos?marca=Toyota&modelo=Hilux",
          "GET /api/vehiculos/Nissan/Versa",
          "GET /api/vehiculos?brand=Ford&model=Mustang",
        ],
        params: {
          marca: "Requerido — ej. Toyota, Nissan, Mazda, Volkswagen",
          modelo: "Requerido — ej. Hilux, Versa, 3, Jetta, NP300",
        },
        validacion: {
          marca: "string 2-40 chars",
          modelo: "string 1-60 chars",
        },
        segmentos: ["Subcompacto / Compacto", "SUV / Minivan / Pick-up", "Deportivo", "Lujo / Blindado"] as Segmento[],
        gamas: ["Entrada", "Media", "Alta", "Premium"] as Gama[],
        marcasDisponibles: MARCAS_CANONICAS,
        catalogo,
        source: "catalogos/vehiculos-clasificacion.json",
        stats,
        ejemplo: {
          request: "/api/vehiculos?marca=Mazda&modelo=3",
          response: {
            ok: true,
            marca: "Mazda",
            modelo: "3",
            segmento: "Subcompacto / Compacto",
            gama: "Media",
            confidence: "exact",
          },
        },
      },
      200,
      "public, s-maxage=300"
    );
  }

  // Si solo viene marca y pide lista de modelos
  if (marcaRaw && !modeloRaw) {
    const data = listModelosForMarca(marcaRaw);
    if (!data) {
      return json(
        {
          ok: false,
          error: `Marca '${marcaRaw}' no encontrada`,
          marcasDisponibles: MARCAS_CANONICAS,
          hint: "Verifica la marca. Usa /api/vehiculos sin params para ver el catálogo.",
        },
        404,
        "no-store"
      );
    }
    const modelos = data.modelos.sort((a, b) => a.modelo.localeCompare(b.modelo));

    // Si explicitamente ?list=true o simplemente solo marca, devolvemos lista
    return json(
      {
        ok: true,
        marca: data.marca,
        segmentoDefault: MARCA_DEFAULTS[normalizeMarca(marcaRaw!)].segmento,
        gamaDefault: MARCA_DEFAULTS[normalizeMarca(marcaRaw!)].gama,
        modelos,
        total: modelos.length,
        source: "catalogos/vehiculos-clasificacion.json",
        hint: "Añade ?modelo={modelo} para lookup exacto. Ej: ?marca=Mazda&modelo=CX-5",
      },
      200
    );
  }

  // Ambos presentes → lookup
  const v = validateVehiculoInput(marcaRaw, modeloRaw);
  if (!v.valid) {
    return json({ ok: false, error: v.error }, 400, "no-store");
  }

  const result = lookupVehiculo(v.marca!, v.modelo!);
  if (!result) {
    return json({ ok: false, error: "No se pudo clasificar el vehículo", marca: v.marca, modelo: v.modelo }, 400, "no-store");
  }

  return json(
    {
      ok: true,
      marca: result.marca,
      modelo: result.modelo,
      segmento: result.segmento,
      gama: result.gama,
      confidence: result.confidence,
      mActivoBase: result.mActivoBase,
      categoria: (result.extra as any)?.categoria ?? null,
      tipo: (result.extra as any)?.tipo ?? null,
      meta: {
        marcaInput: result.marcaInput,
        modeloInput: result.modeloInput,
        source: result.source,
        modeloCatalogo: (result.extra as any)?.modeloCatalogo ?? null,
        origen: (result.extra as any)?.origen ?? null,
      },
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
