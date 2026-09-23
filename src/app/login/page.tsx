"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import { Shield, LogIn, AlertTriangle, Eye, EyeOff } from "lucide-react";

function LoginContent(){
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const callbackError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(callbackError ? "Sesión expirada o callback inválido. Vuelve a iniciar sesión." : null);

  const handleSubmit = async (ev: React.FormEvent)=>{
    ev.preventDefault();
    setError(null); setLoading(true);
    const supabase = getSupabaseBrowser();
    if(!supabase){
      setError("Supabase no configurado. Contacta al administrador.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if(error){
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
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
            <h1 className="text-4xl font-black leading-tight mt-4">La consola que mueve cada traslado.</h1>
            <p className="text-white/60 mt-3 leading-relaxed">Valida usuarios y conductores, asigna traslados, revisa evidencia, atiende incidencias y controla pagos — todo desde un solo lugar. Acceso exclusivo para equipo autorizado.</p>
            <div className="grid grid-cols-3 gap-3 mt-8">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-2xl font-black">8</div>
                <div className="text-xs opacity-60">Traslados activos</div>
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

      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#ff4d11] grid place-items-center font-black text-white">RR</div>
            <div className="font-bold leading-none">Ruum Ruum <span className="text-xs tracking-widest opacity-60 ml-1">ADMIN</span></div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white grid place-items-center mb-4"><Shield className="w-6 h-6"/></div>
            <h2 className="text-xl font-bold">Iniciar sesión</h2>
            <p className="text-sm text-slate-500 mt-1">Acceso exclusivo para equipo interno. Contacta al Superadministrador para solicitar acceso.</p>

            {error && <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>{error}</div>}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Correo corporativo</label>
                <Input placeholder="tu@moviliax.mx" value={email} onChange={e=>setEmail(e.target.value)} required className="mt-1" autoComplete="email"/>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Contraseña</label>
                <div className="relative mt-1">
                  <Input type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required className="pr-10" autoComplete="current-password"/>
                  <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100">
                    {show ? <EyeOff className="w-4 h-4 text-slate-500"/> : <Eye className="w-4 h-4 text-slate-500"/>}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Ingresando..." : <><LogIn className="w-4 h-4 mr-2"/>Entrar a Ruum Admin</>}
              </Button>
              {next !== "/" && <p className="text-xs text-slate-500 text-center">Serás redirigido a <code className="bg-slate-100 border rounded px-1">{next}</code> tras iniciar sesión.</p>}
            </form>

            <div className="mt-6 rounded-xl bg-slate-50 border p-3 text-xs text-slate-600">
              <span className="font-semibold">¿No tienes acceso?</span> Solicita tu cuenta al Superadministrador desde <span className="font-mono bg-white border rounded px-1">Configuración → Usuarios internos</span>.
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">Acceso auditado. Solo el Superadministrador puede crear usuarios y asignar roles.</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPageWrapper(){
  return <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-slate-500">Cargando...</div>}><LoginContent/></Suspense>
}
