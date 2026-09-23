import { getSupabaseBrowser } from "./client";
import type { VariablesBase } from "@/lib/tad";
import { DEFAULT_VARIABLES } from "@/lib/tad";

export type TadConfigRow = {
  id: number;
  tarifa_base: number;
  costo_km_urbano: number;
  costo_km_interurbano: number;
  costo_km_interestatal: number;
  costo_hora: number;
  tarifa_minima: number;
  updated_at: string;
};

export function rowToVars(row: TadConfigRow): VariablesBase {
  return {
    TARIFA_BASE: Number(row.tarifa_base),
    COSTO_KM_URBANO: Number(row.costo_km_urbano),
    COSTO_KM_INTERURBANO: Number(row.costo_km_interurbano),
    COSTO_KM_INTERESTATAL: Number(row.costo_km_interestatal),
    COSTO_HORA: Number(row.costo_hora),
    TARIFA_MINIMA: Number(row.tarifa_minima),
  };
}

export function varsToRow(vars: VariablesBase): Omit<TadConfigRow, "updated_at"> {
  return {
    id: 1,
    tarifa_base: vars.TARIFA_BASE,
    costo_km_urbano: vars.COSTO_KM_URBANO,
    costo_km_interurbano: vars.COSTO_KM_INTERURBANO,
    costo_km_interestatal: vars.COSTO_KM_INTERESTATAL,
    costo_hora: vars.COSTO_HORA,
    tarifa_minima: vars.TARIFA_MINIMA,
  };
}

export async function fetchTadConfig(): Promise<{ vars: VariablesBase; row: TadConfigRow | null; error: string | null; needsSetup: boolean }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { vars: DEFAULT_VARIABLES, row: null, error: "Supabase no configurado (.env)", needsSetup: false };
  const { data, error } = await supabase.from("tad_config").select("*").eq("id", 1).maybeSingle();
  if (error) {
    // PGRST205 = table not in schema cache
    if ((error as any).code === "PGRST205" || error.message.includes("schema cache")) {
      return { vars: DEFAULT_VARIABLES, row: null, error: "Tabla tad_config no existe", needsSetup: true };
    }
    return { vars: DEFAULT_VARIABLES, row: null, error: error.message, needsSetup: false };
  }
  if (!data) return { vars: DEFAULT_VARIABLES, row: null, error: null, needsSetup: false };
  return { vars: rowToVars(data as TadConfigRow), row: data as TadConfigRow, error: null, needsSetup: false };
}

export async function saveTadConfig(vars: VariablesBase): Promise<{ error: string | null }> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return { error: "Supabase no configurado" };
  const row = varsToRow(vars);
  const { error } = await supabase.from("tad_config").upsert(row as any, { onConflict: "id" });
  if (error) return { error: error.message };
  return { error: null };
}
