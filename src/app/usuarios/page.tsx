"use client";
import { useState } from "react";
import { usuarios } from "@/data/mock";
import { Card, Badge, Button, Input } from "@/components/ui";
import { Search, UserPlus, MoreHorizontal } from "lucide-react";

export default function UsuariosPage(){
  const [q,setQ]=useState("");
  const f = usuarios.filter(u=> `${u.nombre} ${u.correo} ${u.tipo}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Usuarios</h1><p className="text-sm text-slate-500">Personas y empresas que solicitan traslados</p></div>
        <Button><UserPlus className="w-4 h-4 mr-2"/> Nuevo usuario</Button>
      </div>
      <Card className="p-3 flex gap-3">
        <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><Input placeholder="Buscar por nombre, correo, empresa..." value={q} onChange={e=>setQ(e.target.value)} className="pl-9"/></div>
        <Button variant="outline">Filtros</Button>
      </Card>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {f.map(u=>(
          <Card key={u.id} className="p-5">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">{u.nombre.split(" ").map(s=>s[0]).slice(0,2).join("")}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{u.nombre}</div>
                <div className="text-xs text-slate-500 truncate">{u.correo}</div>
                <div className="flex gap-2 mt-2"><Badge variant="outline">{u.tipo}</Badge><Badge variant={u.estatus==="Activo"?"success":"danger"}>{u.estatus}</Badge></div>
              </div>
              <button className="p-1 h-fit hover:bg-slate-100 rounded-lg"><MoreHorizontal className="w-4 h-4 text-slate-500"/></button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 text-center text-sm">
              <div className="rounded-xl bg-slate-50 border p-2"><div className="font-bold">{u.Traslado}</div><div className="text-xs text-slate-500">Traslado</div></div>
              <div className="rounded-xl bg-slate-50 border p-2"><div className="font-bold">{u.registro}</div><div className="text-xs text-slate-500">Registro</div></div>
              <div className="rounded-xl bg-slate-50 border p-2"><div className="font-bold">{u.tel}</div><div className="text-xs text-slate-500">Tel</div></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1">Ver perfil</Button>
              <Button variant="ghost" size="sm" className="flex-1">Ver Traslado</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
