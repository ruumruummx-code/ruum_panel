import { NextRequest, NextResponse } from "next/server";
import { lookupVehiculo, validateVehiculoInput } from "@/lib/vehiculos";

export const dynamic = "force-dynamic";

function json(body: any, status: number, cache = "public, s-maxage=3600") {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": cache, "Access-Control-Allow-Origin": "*" },
  });
}

// GET /api/vehiculos/Nissan/Versa
// GET /api/vehiculos/Toyota/Hilux
export async function GET(_req: NextRequest, { params }: { params: Promise<{ marca: string; modelo: string }> }) {
  const { marca: marcaRaw, modelo: modeloRaw } = await params;

  // Decodificar URI (next ya lo hace, pero por si hay %20)
  const marcaDec = decodeURIComponent(marcaRaw);
  const modeloDec = decodeURIComponent(modeloRaw);

  const v = validateVehiculoInput(marcaDec, modeloDec);
  if (!v.valid) {
    return json({ ok: false, error: v.error }, 400, "no-store");
  }

  const result = lookupVehiculo(v.marca!, v.modelo!);
  if (!result) {
    return json({ ok: false, error: "No se pudo clasificar el vehículo" }, 400, "no-store");
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
      meta: { marcaInput: result.marcaInput, modeloInput: result.modeloInput, source: result.source },
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
