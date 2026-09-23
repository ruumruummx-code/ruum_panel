"use client";
import { useState, useEffect } from "react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { useAuth, INTERNAL_USERS } from "@/lib/auth";
import { ROLES, ALL_PERMISSIONS, hasPermission, type RoleId } from "@/lib/roles";
import { Shield, Lock, Users, UserCog, Check, AlertTriangle, Database, Eye, EyeOff, Crown, Briefcase, Headphones, FileCheck, Building2, Plus, Loader2 } from "lucide-react";

const roleIcons: Record<RoleId, any> = {
  superadmin: Crown,
  admin_operativo: Shield,
  finanzas: Briefcase,
  soporte: Headphones,
  validador: FileCheck,
  comercial: Building2,
};

type UserRow = { id: string; nombre: string; email: string; role: RoleId; avatar?: string };

export default function ConfigPage(){
  const { user: currentUser, role } = useAuth();
  const isSuperadmin = role==="superadmin";
  const [users, setUsers] = useState<UserRow[]>(INTERNAL_USERS as UserRow[]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showMatrix, setShowMatrix] = useState(true);
  const [filter, setFilter] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [audit, setAudit] = useState<{from:string,to:string,actor:string,target:string,time:string}[]>([
    { actor:"Hector Lomelin", target:"—", from:"—", to:"Superadmin (inicial)", time:"ahora" },
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nombre:"", email:"", password:"", role:"soporte" as RoleId });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar usuarios reales desde Supabase vía API (solo superadmin puede)
  useEffect(()=>{
    if(!isSuperadmin) return;
    setLoadingUsers(true);
    fetch("/api/admin/users")
      .then(r=>r.json())
      .then(j=>{
        if(j.users && Array.isArray(j.users) && j.users.length>0){
          const mapped: UserRow[] = j.users.map((u:any)=>({
            id: u.id,
            nombre: u.nombre || u.email,
            email: u.email,
            role: u.role as RoleId,
            avatar: `https://i.pravatar.cc/100?u=${u.email}`
          }));
          setUsers(mapped);
        }
      })
      .catch(()=>{})
      .finally(()=>setLoadingUsers(false));
  },[isSuperadmin]);

  const changeRole = async (targetId: string, newRole: RoleId)=>{
    if(!isSuperadmin){ setToast("Solo Superadministrador puede asignar roles"); setTimeout(()=>setToast(null),2500); return; }
    const prev = users.find(u=>u.id===targetId);
    setUsers(prevU=> prevU.map(u=> u.id===targetId ? {...u, role:newRole} : u));
    const res = await fetch("/api/admin/users", { method:"PATCH", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ userId: targetId, role: newRole, email: prev?.email }) });
    const j = await res.json().catch(()=>({}));
    if(!res.ok){
      setUsers(prevU=> prevU.map(u=> u.id===targetId ? {...u, role: prev?.role ?? u.role } : u));
      setToast(j.error || "Error al actualizar rol");
    } else {
      setAudit(a=> [{ actor: currentUser.nombre, target: prev?.nombre ?? targetId, from: prev ? ROLES[prev.role].label : "", to: ROLES[newRole].label, time:"ahora" }, ...a].slice(0,8));
      setToast(`Rol de ${prev?.nombre} → ${ROLES[newRole].label}`);
    }
    setTimeout(()=>setToast(null),2500);
  };

  const handleCreate = async (e: React.FormEvent)=>{
    e.preventDefault();
    setFormError(null); setCreating(true);
    const res = await fetch("/api/admin/users", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(form) });
    const j = await res.json().catch(()=>({}));
    setCreating(false);
    if(!res.ok){
      setFormError(j.error || "Error al crear usuario");
      return;
    }
    const newUser: UserRow = { id: j.id, nombre: form.nombre, email: form.email.toLowerCase(), role: form.role, avatar: `https://i.pravatar.cc/100?u=${form.email}` };
    setUsers(u=> [...u, newUser]);
    setAudit(a=> [{ actor: currentUser.nombre, target: newUser.nombre, from:"—", to: ROLES[newUser.role].label, time:"ahora" }, ...a].slice(0,8));
    setToast(`Usuario ${newUser.nombre} creado como ${ROLES[newUser.role].label}`);
    setTimeout(()=>setToast(null),3000);
    setShowCreate(false);
    setForm({ nombre:"", email:"", password:"", role:"soporte" });
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
            <span className="text-amber-800"> Tu rol <b>{ROLES[role].label}</b> puede ver la configuración, pero solo el <b>Superadministrador (lomelinhectorm@gmail.com)</b> puede crear usuarios y asignar / revocar roles.</span>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.values(ROLES).map(r=>{
          const Icon = roleIcons[r.id];
          const isCurrent = role===r.id;
          return (
            <Card key={r.id} className={`p-5 relative overflow-hidden ${isCurrent ? "ring-2 ring-[#ff4d11] border-[#ff4d11]/30" : ""}`}>
              {r.id==="superadmin" && <div className="absolute top-0 right-0 bg-[#ff4d11] text-white text-[10px] font-bold px-2 py-1 rounded-bl-xl">ÚNICO CON GESTIÓN</div>}
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
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4"/> Usuarios internos <Badge variant="outline">{users.length}</Badge> {loadingUsers && <Loader2 className="w-4 h-4 animate-spin text-slate-400"/>}</h3>
            <Input placeholder="Buscar usuario, email, rol..." value={filter} onChange={e=>setFilter(e.target.value)} className="max-w-[220px] h-8 text-xs"/>
          </div>
          <p className="text-xs text-slate-500 mt-1">{isSuperadmin ? "Como Superadmin puedes crear usuarios y cambiar roles. Se audita en la bitácora y se crea en Supabase Auth." : "Solo Superadmin (lomelinhectorm@gmail.com) puede gestionar usuarios."}</p>

          {isSuperadmin && (
            <div className="mt-4">
              {!showCreate ? (
                <Button onClick={()=>setShowCreate(true)} className="w-full"><Plus className="w-4 h-4 mr-2"/>Crear nuevo usuario</Button>
              ) : (
                <form onSubmit={handleCreate} className="rounded-2xl border bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between"><span className="font-semibold text-sm">Nuevo usuario interno</span><button type="button" onClick={()=>setShowCreate(false)} className="text-xs text-slate-500">Cancelar</button></div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div><label className="text-xs font-semibold">Nombre completo</label><Input value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required placeholder="Ej. Ana López" className="mt-1"/></div>
                    <div><label className="text-xs font-semibold">Correo</label><Input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required placeholder="ana@ruum.mx" className="mt-1"/></div>
                    <div><label className="text-xs font-semibold">Contraseña temporal</label><Input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required placeholder="Mín. 6 caracteres" className="mt-1"/></div>
                    <div><label className="text-xs font-semibold">Rol</label>
                      <select value={form.role} onChange={e=>setForm({...form, role:e.target.value as RoleId})} className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                        {Object.values(ROLES).map(r=> <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {formError && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0"/>{formError}</div>}
                  <Button type="submit" disabled={creating} className="w-full">{creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Creando...</> : <><UserCog className="w-4 h-4 mr-2"/>Crear usuario en Supabase</>}</Button>
                  <p className="text-[11px] text-slate-500">Se creará en Supabase Auth (email confirmado) y en <code className="bg-white border rounded px-1">profiles</code> para el RBAC.</p>
                </form>
              )}
            </div>
          )}

          <div className="mt-4 space-y-2">
            {filteredUsers.map(u=>{
              const isMe = u.id===currentUser.id || u.email.toLowerCase()===currentUser.email.toLowerCase();
              return (
                <div key={u.id} className={`flex items-center gap-3 rounded-xl border p-3 ${isMe ? "bg-amber-50 border-amber-200" : "bg-white"}`}>
                  <img src={u.avatar || `https://i.pravatar.cc/100?u=${u.email}`} alt="" className="w-10 h-10 rounded-full"/>
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
            {filteredUsers.length===0 && <div className="text-center text-sm text-slate-500 py-6">Sin usuarios que coincidan.</div>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2"><Database className="w-4 h-4"/> Supabase — Persistencia</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="rounded-xl bg-slate-900 text-white p-3 font-mono leading-relaxed">
                <div>tabla: <span className="text-amber-300">public.profiles</span> + <span className="text-amber-300">auth.users</span></div>
                <div>superadmin: <span className="text-emerald-300">lomelinhectorm@gmail.com</span></div>
                <div className="opacity-60 mt-1">Solo superadmin puede POST/PATCH /api/admin/users</div>
              </div>
              <div className="rounded-xl border bg-emerald-50 border-emerald-200 p-3 text-emerald-800">
                <div className="font-bold">Demo eliminado:</div>
                <div className="mt-1">Login ya no muestra usuarios demo. Todo alta de usuarios se hace aquí con rol y contraseña temporal.</div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold">Bitácora de cambios de roles</h3>
            <div className="mt-3 space-y-2 text-sm">
              {audit.map((a,i)=>(
                <div key={i} className="rounded-xl bg-slate-50 border p-3">
                  <div className="font-medium text-xs"><span className="font-bold">{a.actor}</span> → <span className="font-bold">{a.target}</span></div>
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
