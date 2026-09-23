import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    // Retorna null si no hay env — permite build sin Supabase y usar fallback mock
    return null as any;
  }
  return createBrowserClient(url, anonKey);
}

// Singleton para uso en client components
let _browserClient: ReturnType<typeof createClient> | null = null;
export function getSupabaseBrowser() {
  if (_browserClient) return _browserClient;
  _browserClient = createClient();
  return _browserClient;
}

export function isSupabaseConfigured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
