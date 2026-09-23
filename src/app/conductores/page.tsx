"use client";
import { useState } from "react";
import { conductores } from "@/data/mock";
import { Card, Badge, Button, Input } from "@/components/ui";
import { money } from "@/lib/utils";
import { Search, Star } from "lucide-react";

export default function ConductoresPage(){
  const [q,setQ]=useState("");
  const f = conductores.filter(c=> c.nombre.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Conductores</h1><p className="text-sm text-slate-500">Conductores certificados — validación, disponibilidad y desempeño</p></div>
        <Button>Validar nuevo conductor</Button>
      </div>
      <Card className="p-3 flex gap-3">
        <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><Input placeholder="Buscar conductor..." value={q} onChange={e=>setQ(e.target.value)} className="pl-9"/></div>
        <Button variant="outline">Filtros</Button>
      </Card>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {f.map(c=>(
          <Card key={c.id} className="p-5">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#ff4d11] text-white grid place-items-center font-bold">{c.foto}</div>
              <div className="flex-1">
                <div className="font-semibold">{c.nombre}</div>
                <div className="text-xs text-slate-500">{c.tel} • {c.id}</div>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  <Badge variant={c.disp==="Disponible"?"success":c.disp==="En Traslado"?"warning":"neutral"}>{c.disp}</Badge>
                  <Badge variant={c.cert==="Activo"?"success":c.cert==="Vencido"?"danger":"warning"}>{c.cert}</Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="rounded-xl border bg-slate-50 p-2"><div className="font-bold">{c.Traslado}</div><div className="text-[11px] text-slate-500">Traslado</div></div>
              <div className="rounded-xl border bg-slate-50 p-2 flex flex-col items-center"><div className="font-bold flex items-center gap-1">{c.cal || "—"} {c.cal ? <Star className="w-3 h-3 fill-amber-400 text-amber-400"/>:null}</div><div className="text-[11px] text-slate-500">Calificación</div></div>
              <div className="rounded-xl border bg-slate-50 p-2"><div className="font-bold text-xs">{money(c.ganancias)}</div><div className="text-[11px] text-slate-500">Ganancias</div></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1">Ver perfil</Button>
              <Button size="sm" className="flex-1">Asignar Traslado</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
