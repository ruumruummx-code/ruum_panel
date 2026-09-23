"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { canAccessRoute, ROLES } from "@/lib/roles";
import {
  LayoutDashboard, Truck, Users, Car, Camera, AlertTriangle,
  CreditCard, FileCheck, Tags, Building2, BarChart3, Settings, Menu, X, Search, Bell, ChevronDown, LogOut, Shield
} from "lucide-react";

const nav = [
  { href:"/", label:"Dashboard", icon: LayoutDashboard },
  { href:"/traslados", label:"Traslados", icon: Truck, badge: "8" },
  { href:"/usuarios", label:"Usuarios", icon: Users },
  { href:"/conductores", label:"Conductores", icon: Car },
  { href:"/evidencia", label:"Evidencia", icon: Camera, badge: "6" },
  { href:"/incidencias", label:"Incidencias", icon: AlertTriangle, badge: "4" },
  { href:"/pagos", label:"Pagos", icon: CreditCard },
  { href:"/documentos", label:"Documentos", icon: FileCheck, badge: "6" },
  { href:"/tarifas", label:"Tarifas", icon: Tags },
  { href:"/empresas", label:"Empresas", icon: Building2 },
  { href:"/reportes", label:"Reportes", icon: BarChart3 },
  { href:"/configuracion", label:"Configuración", icon: Settings },
];

export default function AdminShell({children}:{children:React.ReactNode}){
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const roleDef = ROLES[role];
  const filteredNav = nav.filter(item => canAccessRoute(role, item.href));
  const isBlocked = !canAccessRoute(role, pathname);

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-[#0b0f1a] text-slate-200 sticky top-0 h-screen">
        <div className="h-[64px] flex items-center gap-3 px-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-[#ff4d11] flex items-center justify-center font-black text-white text-sm">RR</div>
          <div>
            <div className="font-bold leading-none text-white">Ruum Ruum</div>
            <div className="text-[11px] tracking-widest text-white/60 font-semibold">ADMIN • BY MOVILIAX</div>
          </div>
        </div>
        <div className="px-3 pt-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400"/>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white leading-none flex items-center gap-1.5">
                {roleDef.label}
                {role==="superadmin" && <span className="bg-[#ff4d11] text-white text-[10px] px-1.5 py-0.5 rounded-full">● SUPER</span>}
              </div>
              <div className="text-[11px] text-white/50 truncate">{role==="superadmin" ? "Acceso total + gestión de usuarios y roles" : roleDef.description.slice(0,48)+"..."}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredNav.map(item=>{
            const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href));
            const Icon=item.icon;
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-white text-slate-900" : "text-slate-400 hover:text-white hover:bg-white/10")}>
                <Icon className="w-[18px] h-[18px] shrink-0"/>{item.label}
                {item.badge && <span className={cn("ml-auto text-xs rounded-full px-2 py-0.5 font-bold", active ? "bg-[#ff4d11] text-white" : "bg-white/10 text-white")}>{item.badge}</span>}
              </Link>
            )
          })}
          {filteredNav.length!==nav.length && (
            <div className="pt-3 mt-3 border-t border-white/10 text-[11px] text-white/40 px-3">
              {nav.length - filteredNav.length} secciones ocultas por tu rol
            </div>
          )}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="rounded-xl bg-white/5 p-3 flex items-center gap-3">
            <img src={user.avatar} alt="" className="w-9 h-9 rounded-full"/>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white leading-none">{user.nombre}</div>
              <div className="text-xs text-white/60 truncate">{user.email}</div>
            </div>
            <button onClick={signOut} title="Cerrar sesión" className="p-1.5 rounded-lg hover:bg-white/10"><LogOut className="w-4 h-4 text-white/60"/></button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setOpen(false)}/>
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-[#0b0f1a] text-slate-200 flex flex-col">
            <div className="h-[64px] flex items-center justify-between px-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ff4d11] flex items-center justify-center font-black text-white">RR</div>
                <div className="font-bold text-white">Ruum Ruum</div>
              </div>
              <button onClick={()=>setOpen(false)} className="p-2"><X className="w-5 h-5"/></button>
            </div>
            <div className="px-3 pt-3">
              <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-white">
                <div className="font-bold">{roleDef.label}</div>
                <div className="opacity-60 text-[11px]">{user.nombre} • {user.email}</div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {filteredNav.map(item=>{
                const active = pathname===item.href || (item.href!=="/" && pathname.startsWith(item.href));
                const Icon=item.icon;
                return <Link key={item.href} href={item.href} onClick={()=>setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", active ? "bg-white text-slate-900" : "text-slate-400")}><Icon className="w-[18px] h-[18px]"/>{item.label}</Link>
              })}
            </nav>
            <div className="p-3 border-t border-white/10">
              <button onClick={signOut} className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-slate-900 py-2.5 text-sm font-medium">Cerrar sesión</button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-[64px] bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center gap-3 px-4 lg:px-6">
          <button className="lg:hidden p-2 -ml-2" onClick={()=>setOpen(true)}><Menu className="w-5 h-5"/></button>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <span className="hidden lg:inline">Operación en vivo</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"/>
            <span className="text-slate-900 font-medium">8 traslados activos</span>
            <span className={`ml-3 hidden lg:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${role==="superadmin"?"bg-slate-900 text-white border-slate-900":"bg-slate-100 text-slate-700"}`}><Shield className="w-3 h-3"/>{roleDef.label}</span>
          </div>
          <div className="flex-1 flex justify-center lg:justify-start lg:ml-6">
            <div className="relative w-full max-w-[480px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <input placeholder="Buscar traslados, usuario, conductor, empresa..." className="w-full h-9 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20"/>
            </div>
          </div>
          <button className="relative p-2 rounded-xl hover:bg-slate-100">
            <Bell className="w-5 h-5 text-slate-600"/>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff4d11] text-white text-[11px] font-bold rounded-full grid place-items-center">3</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 pl-2">
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full"/>
            <button onClick={signOut} className="text-xs text-slate-500 hover:text-slate-700">Salir</button>
            <ChevronDown className="w-4 h-4 text-slate-400"/>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] w-full mx-auto">
          {isBlocked ? (
            <div className="max-w-xl mx-auto mt-16 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <Shield className="w-10 h-10 mx-auto text-amber-600"/>
              <h2 className="text-lg font-bold mt-3">Acceso restringido</h2>
              <p className="text-sm text-slate-600 mt-2">Tu rol <b>{roleDef.label}</b> no tiene permiso para ver <code className="bg-white border rounded px-1.5 py-0.5">{pathname}</code>.</p>
              <p className="text-xs text-slate-500 mt-2">Solicita al Superadministrador que te asigne el permiso.</p>
              <Link href="/" className="inline-flex mt-4 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm font-medium">Ir al Dashboard</Link>
            </div>
          ) : children}
        </main>
      </div>
    </div>
  )
}
