"use client";
import { useState } from "react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { useAuth, INTERNAL_USERS } from "@/lib/auth";
import { ROLES, ALL_PERMISSIONS, hasPermission, type RoleId } from "@/lib/roles";
import { Shield, Lock, Users, UserCog, Check, AlertTriangle, Database, Eye, EyeOff, Crown, Briefcase, Headphones, FileCheck, Building2 } from "lucide-react";

const roleIcons: Record<RoleId, any> = {
  superadmin: Crown,
  admin_operativo: Shield,
  finanzas: Briefcase,
  soporte: Headphones,
  validador: FileCheck,
  comercial: Building2,
};

export default function ConfigPage(){
  const { user: currentUser, role, setUserId } = useAuth();
  const isSuperadmin = role==="superadmin";
  const [users, setUsers] = useState(INTERNAL_USERS);
  const [showMatrix, setShowMatrix] = useState(true);
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [audit, setAudit] = useState<{from:string,to:string,actor:string,target:string,time:string}[]>([
    { actor:"Sofía Ramírez", target:"Diego Martínez", from:"Soporte", to:"Administrador Operativo", time:"hace 2 h" },
    { actor:"Sofía Ramírez", target:"Valeria Torres", from:"—", to:"Asesor de Finanzas", time:"hace 1 d" },
  ]);

  const changeRole = (targetId: string, newRole: RoleId)=>{
    if(!isSuperadmin){ setToast("Solo Superadministrador puede asignar roles"); setTimeout(()=>setToast(null),2500); return; }
    setUsers(prev=> prev.map(u=> u.id===targetId ? {...u, role:newRole} : u));
    const target = users.find(u=>u.id===targetId);
    const actor = currentUser.nombre;
    setAudit(a=> [{ actor, target: target?.nombre ?? targetId, from: target ? ROLES[target.role].label : "", to: ROLES[newRole].label, time:"ahora" }, ...a].slice(0,8));
    setToast(`Rol de ${target?.nombre} → ${ROLES[newRole].label}`);
    setTimeout(()=>setToast(null),2500);
  };

  const filteredUsers = users.filter(u=> !filter || `${u.nombre} ${u.email} ${ROLES[u.role].label}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">Configuración <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${isSuperadmin ? "bg-slate-900 text-white border-slate-900" : "bg-amber-50 text-amber-700 border-amber-200"}`}><Shield className="w-3 h-3"/>{isSuperadmin ? "Superadmin" : ROLES[role].label}</span></h1>
          <p className="text-sm text-slate-500 mt-1">Roles, permisos, usuarios internos y zonas de operación</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=>setShowMatrix(v=>!v)}>{showMatrix ? <><EyeOff className="w-4 h-4 mr-2"/>Ocultar matriz</> : <><Eye className="w-4 h-4 mr-2"/>Ver matriz</>}</Button>
        </div>
      </div>

      {toast && <div className="rounded-xl bg-slate-900 text-white text-sm px-4 py-3 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400"/>{toast}</div>}
      {!isSuperadmin && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
          <div className="text-sm">
            <span className="font-bold text-amber-900">Solo lectura:</span>
            <span className="text-amber-800"> Tu rol <b>{ROLES[role].label}</b> puede ver la configuración, pero solo el <b>Superadministrador</b> puede asignar / revocar roles y gestionar usuarios. Usa el switch de demo en la barra lateral para probar como Superadmin (Sofía Ramírez).</span>
          </div>
        </div>
      )}

      {/* 6 roles cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.values(ROLES).map(r=>{
          const Icon = roleIcons[r.id];
          const isCurrent = role===r.id;
          return (
            <Card key={r.id} className={`p-5 relative overflow-hidden ${isCurrent ? "ring-2 ring-[#ff4d11] border-[#ff4d11]/30" : ""}`}>
              {r.id==="superadmin" && <div className="absolute top-0 right-0 bg-[#ff4d11] text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">ÚNICO CON GESTIÓN DE ROLES</div>}
              <div className="flex gap-3">
                <div className={`w-11 h-11 rounded-xl grid place-items-center border ${r.color}`}><Icon className="w-5 h-5"/></div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold leading-none">{r.label}</div>
                  <div className="text-xs text-slate-500 mt-1 leading-relaxed">{r.description}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {((r.permissions as string[]).includes("*") ? ["Acceso total (*)"] : (r.permissions as string[]).slice(0,6)).map(p=>(
                  <span key={p} className="text-[11px] bg-slate-50 border rounded-full px-2 py-1 font-mono">{p}</span>
                ))}
                {!(r.permissions as string[]).includes("*") && (r.permissions as string[]).length>6 && <span className="text-[11px] text-slate-500">+{(r.permissions as string[]).length-6} más</span>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="outline">{users.filter(u=>u.role===r.id).length} usuario(s)</Badge>
                {isCurrent && <span className="text-xs font-bold text-[#ff4d11]">● Tu rol</span>}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Matriz permisos */}
      {showMatrix && (
        <Card className="p-5 overflow-hidden">
          <h3 className="font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-[#ff4d11]"/> Matriz de permisos — 6 roles × {ALL_PERMISSIONS.length} permisos</h3>
          <p className="text-xs text-slate-500 mt-1">✓ = tiene permiso · — = sin acceso. Superadmin = * (todo).</p>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs border">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left p-2 border min-w-[180px]">Permiso</th>
                  {Object.values(ROLES).map(r=>(
                    <th key={r.id} className="p-2 border text-center min-w-[110px]">
                      <div className="font-bold leading-none">{r.label.split(" ")[0]}</div>
                      <div className="font-normal opacity-70 text-[10px]">{r.label.split(" ").slice(1).join(" ")}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map(perm=>(
                  <tr key={perm} className="even:bg-slate-50">
                    <td className="p-2 border font-mono font-medium bg-slate-50">{perm}</td>
                    {Object.values(ROLES).map(r=>(
                      <td key={r.id} className={`p-2 border text-center ${(hasPermission as any)(r.id, perm) ? "bg-emerald-50 text-emerald-700 font-bold" : "text-slate-300"}`}>
                        {(hasPermission as any)(r.id, perm) ? "✓" : "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        {/* Usuarios internos */}
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4"/> Usuarios internos <Badge variant="outline">{users.length}</Badge></h3>
            <Input placeholder="Buscar usuario, email, rol..." value={filter} onChange={e=>setFilter(e.target.value)} className="max-w-[260px] h-8 text-xs"/>
          </div>
          <p className="text-xs text-slate-500 mt-1">{isSuperadmin ? "Como Superadmin puedes cambiar el rol de cualquier usuario. Se audita en la bitácora." : "Solo Superadmin puede modificar. Contacta a sofia@moviliax.mx"}</p>
          <div className="mt-4 space-y-2">
            {filteredUsers.map(u=>{
              const isMe = u.id===currentUser.id;
              return (
                <div key={u.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isMe ? "bg-amber-50 border-amber-200" : "bg-white"}`}>
                  <img src={u.avatar} alt="" className="w-10 h-10 rounded-full"/>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2">{u.nombre} {isMe && <span className="text-[10px] bg-slate-900 text-white rounded-full px-2 py-0.5">TÚ</span>}</div>
                    <div className="text-xs text-slate-500 truncate">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={e=>changeRole(u.id, e.target.value as RoleId)}
                      disabled={!isSuperadmin}
                      className={`h-8 rounded-xl border px-2 text-xs font-medium ${!isSuperadmin ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"}`}
                    >
                      {Object.values(ROLES).map(r=> <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                    {!isSuperadmin && <Lock className="w-3.5 h-3.5 text-slate-400"/>}
                  </div>
                </div>
              )
            })}
          </div>
          {isSuperadmin && <Button variant="outline" className="w-full mt-4"><UserCog className="w-4 h-4 mr-2"/>Invitar nuevo usuario interno</Button>}
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2"><Database className="w-4 h-4"/> Supabase — Persistencia de roles</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="rounded-xl bg-slate-900 text-white p-3 font-mono leading-relaxed">
                <div>tabla: <span className="text-amber-300">public.profiles</span></div>
                <div>roles: superadmin | admin_operativo | finanzas | soporte | validador | comercial</div>
                <div className="opacity-60 mt-1">RLS: profiles_all (all using true) — ajustar a auth real después</div>
              </div>
              <div className="rounded-xl border bg-amber-50 border-amber-200 p-3 text-amber-800">
                <div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Demo local:</div>
                <div className="mt-1">Los cambios de rol se guardan en memoria/localStorage. Para producción, conectar <code className="bg-white border rounded px-1">profiles</code> a Supabase y usar <code className="bg-white border rounded px-1">role_audit</code> para auditoría.</div>
              </div>
              <div className="text-slate-500">Ejecuta <code className="bg-slate-100 border rounded px-1">supabase/schema.sql</code> en el SQL Editor para crear las tablas.</div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold">Bitácora de cambios de roles</h3>
            <div className="mt-3 space-y-2 text-sm">
              {audit.map((a,i)=>(
                <div key={i} className="rounded-xl bg-slate-50 border p-3">
                  <div className="font-medium text-xs"><span className="font-bold">{a.actor}</span> cambió a <span className="font-bold">{a.target}</span></div>
                  <div className="text-xs text-slate-600">{a.from} → <span className="font-bold text-slate-900">{a.to}</span> <span className="text-slate-400">• {a.time}</span></div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold">Zonas de operación</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {["León","Querétaro","Irapuato","Silao","Guanajuato","Aguascalientes","CDMX","Guadalajara"].map(z=>(
                <span key={z} className="rounded-full border bg-white px-3 py-1.5 text-sm">{z}</span>
              ))}
            </div>
            <div className="mt-3 flex gap-2"><Input placeholder="Nueva zona"/><Button disabled={!isSuperadmin && !hasPermission(role,"config:manage_zonas")}>{isSuperadmin || hasPermission(role,"config:manage_zonas") ? "Agregar" : "Solo admin"}</Button></div>
          </Card>
        </div>
      </div>
    </div>
  )
}
