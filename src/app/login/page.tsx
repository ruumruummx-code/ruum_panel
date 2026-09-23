"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { ROLES, type RoleId } from "@/lib/roles";
import { INTERNAL_USERS } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { Shield, Crown, Briefcase, Headphones, FileCheck, Building2, LogIn, AlertTriangle, Eye, EyeOff, Zap, ArrowRight } from "lucide-react";

const roleIcons: Record<RoleId, any> = {
  superadmin: Crown,
  admin_operativo: Shield,
  finanzas: Briefcase,
  soporte: Headphones,
  validador: FileCheck,
  comercial: Building2,
};

const DEMO_CREDS: Record<string, { email: string; password: string }> = {
  superadmin: { email:"sofia@moviliax.mx", password:"Ruum2026!" },
  admin_operativo: { email:"diego@moviliax.mx", password:"Ruum2026!" },
  finanzas: { email:"valeria@ruum.mx", password:"Ruum2026!" },
  soporte: { email:"laura@ruum.mx", password:"Ruum2026!" },
  validador: { email:"jorge@ruum.mx", password:"Ruum2026!" },
  comercial: { email:"ana@ruum.mx", password:"Ruum2026!" },
};

export default function LoginPage(){
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async (e: string, p: string, roleHint?: string)=>{
    setError(null); setLoading(roleHint ?? "form");
    const supabase = getSupabaseBrowser();
    // Fallback demo si no hay Supabase configurado: solo localStorage
    if(!supabase){
      // demo local
      const user = INTERNAL_USERS.find(u=> u.email.toLowerCase()===e.toLowerCase());
      if(!user){ setError("Usuario demo no encontrado"); setLoading(null); return; }
      localStorage.setItem("ruum_user_id", user.id);
      localStorage.setItem("ruum_role", user.role);
      router.push("/");
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email:e, password:p });
    if(error){
      // Si es demo y no existe usuario en Supabase Auth, mostrar ayuda
      if(Object.values(DEMO_CREDS).some(c=>c.email===e)){
        setError(`${error.message} — ¿Creaste los usuarios en Supabase Auth? Ver instrucciones abajo.`);
      } else {
        setError(error.message);
      }
      setLoading(null);
      return;
    }
    router.push("/");
    router.refresh();
  };

  const handleSubmit = (ev: React.FormEvent)=>{
    ev.preventDefault();
    doLogin(email, password, "form");
  };

  const demoLogin = (role: RoleId)=>{
    const c = DEMO_CREDS[role];
    setEmail(c.email); setPassword(c.password);
    doLogin(c.email, c.password, role);
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Left — branding */}
      <div className="hidden lg:flex w-[52%] bg-[#0b0f1a] text-white relative overflow-hidden flex-col">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(#fff 1px, transparent 1px)", backgroundSize:"22px 22px"}}/>
        <div className="relative z-10 p-10 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ff4d11] grid place-items-center font-black">RR</div>
            <div>
              <div className="font-bold leading-none">Ruum Ruum</div>
              <div className="text-xs tracking-widest opacity-60 font-semibold">ADMIN • BY MOVILIAX</div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center max-w-[520px]">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-medium w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/> Plataforma operativa en vivo
            </div>
            <h1 className="text-4xl font-black leading-tight mt-4">La consola que mueve cada traslados.</h1>
            <p className="text-white/60 mt-3 leading-relaxed">Valida usuarios y conductores, asigna traslados, revisa evidencia, atiende incidencias y controla pagos — todo desde un solo lugar.</p>
            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-2xl font-black">8</div>
                <div className="text-xs opacity-60">traslados activos</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-2xl font-black">14</div>
                <div className="text-xs opacity-60">Conductores disp.</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-2xl font-black">TAD 2.0</div>
                <div className="text-xs opacity-60">Tarifador dinámico</div>
              </div>
            </div>
          </div>
          <div className="text-xs opacity-40">© 2026 MoviliaX • Ruum Ruum Admin — acceso exclusivo para equipo operativo</div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#ff4d11] grid place-items-center font-black text-white">RR</div>
            <div className="font-bold leading-none">Ruum Ruum <span className="text-xs tracking-widest opacity-60 ml-1">ADMIN</span></div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7">
            <h2 className="text-xl font-bold">Iniciar sesión</h2>
            <p className="text-sm text-slate-500 mt-1">Acceso exclusivo para equipo interno. Tu rol define qué puedes ver y gestionar.</p>

            {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>{error}</div>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Correo corporativo</label>
                <Input placeholder="tu@moviliax.mx" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Contraseña</label>
                <div className="relative mt-1">
                  <Input type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required className="pr-10"/>
                  <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100">
                    {show ? <EyeOff className="w-4 h-4 text-slate-500"/> : <Eye className="w-4 h-4 text-slate-500"/>}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={!!loading} className="w-full">
                {loading==="form" ? "Ingresando..." : <><LogIn className="w-4 h-4 mr-2"/>Entrar a Ruum Admin</>}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t"/></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-500">o entra como demo (sin Supabase requerido)</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.values(ROLES).map(r=>{
                const Icon = roleIcons[r.id];
                const isLoading = loading===r.id;
                return (
                  <button
                    key={r.id}
                    onClick={()=>demoLogin(r.id)}
                    disabled={!!loading}
                    className="rounded-2xl border bg-white hover:bg-slate-50 p-3 text-left flex gap-2.5 items-start disabled:opacity-50"
                  >
                    <span className={`w-8 h-8 rounded-xl grid place-items-center border text-white shrink-0 ${r.color}`}><Icon className="w-4 h-4"/></span>
                    <span className="min-w-0 flex-1">
                      <span className="text-xs font-bold leading-none block">{r.label}</span>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-1 line-clamp-2">{r.id==="superadmin" ? "Acceso total" : r.id==="admin_operativo" ? "traslados, conductores..." : r.id==="finanzas" ? "Pagos y reportes" : r.id==="soporte" ? "Usuarios e incidencias" : r.id==="validador" ? "Documentos" : "Empresas y comercial"}</span>
                      <span className="text-[11px] font-mono text-slate-400 block mt-1">{DEMO_CREDS[r.id].email}</span>
                    </span>
                    {isLoading ? <span className="text-xs">…</span> : <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-1"/>}
                  </button>
                )
              })}
            </div>

            <div className="mt-6 rounded-xl bg-slate-900 text-white p-3 text-xs flex gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"/>
              <div>
                <div className="font-bold">¿Primera vez?</div>
                <div className="opacity-70 mt-1">Crea los 6 usuarios en <b>Supabase Auth</b> con las credenciales de arriba (password <code className="bg-white/10 border border-white/20 rounded px-1">Ruum2026!</code>) y asegúrate de tener <code className="bg-white/10 border rounded px-1">profiles</code> + <code className="bg-white/10 border rounded px-1">tad_config</code> creados con <code className="bg-white/10 border rounded px-1">supabase/schema.sql</code>.</div>
                <a href="https://supabase.com/dashboard/project/puomblsfbxuthcunmirg/auth/users" target="_blank" className="inline-flex items-center gap-1 mt-2 text-amber-300 hover:underline">Abrir Auth Users <ArrowRight className="w-3 h-3"/></a>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">Al entrar aceptas el uso interno y la auditoría de roles. Solo Superadmin puede asignar permisos.</p>
        </div>
      </div>
    </div>
  )
}
