import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isPublic = PUBLIC_PATHS.some(p => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(p + "/"));

  if (!url || !anonKey) return supabaseResponse;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay sesión y no es ruta pública → login
  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  // Si hay sesión y va a /login → dashboard
  if (user && request.nextUrl.pathname === "/login") {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = "/";
    return NextResponse.redirect(dashUrl);
  }

  return supabaseResponse;
}
