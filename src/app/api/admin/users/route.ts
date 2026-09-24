import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createServiceClient } from "@supabase/supabase-js";

async function getActor(){
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll(){ return cookieStore.getAll(); }, setAll(c){ try{ c.forEach(({name,value,options})=> cookieStore.set(name,value,options)); }catch{} } } }
  );
  const { data:{ user } } = await supabase.auth.getUser();
  if(!user) return null;
  const { data: profile } = await supabase.from("profiles").select("user_role").eq("id", user.id).maybeSingle();
  const role = (profile as any)?.user_role || (user.email === "lomelinhectorm@gmail.com" ? "superadmin" : null);
  if(role !== "superadmin") return null;
  return { user, role };
}

export async function POST(request: Request){
  const actor = await getActor();
  if(!actor) return NextResponse.json({ error: "No autorizado — solo Superadmin" }, { status: 403 });
  const { nombre, email, password, role } = await request.json();
  if(!nombre || !email || !password || !role) return NextResponse.json({ error: "Faltan campos: nombre, email, password, role" }, { status: 400 });
  if(!["superadmin","admin_operativo","finanzas","soporte","validador","comercial"].includes(role)){
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }
  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SECRET_SUPABASE_ROLE_PLAY!);
  const { data, error } = await service.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: { nombre, role }
  });
  if(error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { error: pErr } = await service.from("profiles").upsert({
    id: data.user.id,
    email: email.toLowerCase(),
    nombre,
    user_role: role,
    is_active: true,
  }, { onConflict: "id" });
  if(pErr && !pErr.message.includes("schema cache")){
    return NextResponse.json({ error: `Usuario creado pero perfil falló: ${pErr.message}` }, { status: 207 });
  }
  try { await service.from("role_audit").insert({ actor_id: actor.user.id, target_id: data.user.id, from_role: null, to_role: role }); } catch{}
  return NextResponse.json({ ok:true, id: data.user.id });
}

export async function PATCH(request: Request){
  const actor = await getActor();
  if(!actor) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { userId, role, email } = await request.json();
  if(!role) return NextResponse.json({ error: "Rol requerido" }, { status: 400 });
  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SECRET_SUPABASE_ROLE_PLAY!);
  if(userId){
    await service.auth.admin.updateUserById(userId, { user_metadata: { role } });
  }
  let targetId = userId;
  if(!targetId && email){
    const { data } = await service.from("profiles").select("id").eq("email", email.toLowerCase()).maybeSingle();
    targetId = (data as any)?.id;
  }
  if(targetId){
    const { error } = await service.from("profiles").update({ user_role: role }).eq("id", targetId);
    if(error && !error.message.includes("schema cache")) return NextResponse.json({ error: error.message }, { status: 400 });
    try { await service.from("role_audit").insert({ actor_id: actor.user.id, target_id: targetId, from_role: null, to_role: role }); } catch{}
  }
  return NextResponse.json({ ok:true });
}

export async function GET(){
  const actor = await getActor();
  if(!actor) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const service = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SECRET_SUPABASE_ROLE_PLAY!);
  const { data, error } = await service.from("profiles").select("*").order("created_at", { ascending: true });
  if(error) return NextResponse.json({ error: error.message, fallback: true }, { status: 200 });
  return NextResponse.json({ users: data });
}
