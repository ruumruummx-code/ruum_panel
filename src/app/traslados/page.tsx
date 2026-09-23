"use client";
import { useState } from "react";
import Link from "next/link";
import { traslados, type trasladostatus } from "@/data/mock";
import { Badge, Button, Input, Card } from "@/components/ui";
import { money } from "@/lib/utils";
import { Search, Plus, Filter, ArrowUpRight } from "lucide-react";

const tabs: (trasladostatus | "Todos")[] = ["Todos","Pendiente de asignación","Conductor asignado","En curso","Finalizado","Cancelado","En revisión por incidencia"];

const statusVariant: Record<string, "success"|"warning"|"danger"|"neutral"|"outline"> = {
  "En curso":"warning", "Conductor asignado":"neutral", "Pendiente de asignación":"danger", "Finalizado":"success", "Cancelado":"outline", "En revisión por incidencia":"danger", "Solicitud recibida":"neutral", "Evidencia pendiente":"warning"
};

export default function trasladosPage(){
  const [q,setQ]=useState("");
  const [tab,setTab]=useState<string>("Todos");
  const filtered = traslados.filter(v=>{
    const matchTab = tab==="Todos" || v.estatus===tab;
    const matchQ = !q || `${v.id} ${v.cliente} ${v.vehiculo} ${v.conductor??""}`.toLowerCase().includes(q.toLowerCase());
    return matchTab && matchQ;
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">traslados</h1>
          <p className="text-sm text-slate-500">Centro operativo — crear, asignar, monitorear y cerrar traslados</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2"/>Nuevo traslados</Button>
      </div>

      <Card className="p-3 flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
          <Input placeholder="Buscar por ID, cliente, vehículo, conductor..." value={q} onChange={e=>setQ(e.target.value)} className="pl-9"/>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Filter className="w-4 h-4 mr-2"/>Filtros</Button>
          <Button variant="outline">Exportar</Button>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium border ${tab===t ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>{t}</button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 border-b">
              <tr>
                <th className="text-left font-medium px-4 py-3">traslados</th>
                <th className="text-left font-medium px-4 py-3">Cliente / Empresa</th>
                <th className="text-left font-medium px-4 py-3">Ruta</th>
                <th className="text-left font-medium px-4 py-3">Fecha</th>
                <th className="text-left font-medium px-4 py-3">Conductor</th>
                <th className="text-left font-medium px-4 py-3">Estatus</th>
                <th className="text-right font-medium px-4 py-3">Tarifa</th>
                <th className="text-left font-medium px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(v=>(
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-semibold">{v.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.cliente}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[220px]">{v.vehiculo}</div>
                    {v.empresa && <div className="text-xs text-slate-400">{v.empresa}</div>}
                  </td>
                  <td className="px-4 py-3 max-w-[240px]">
                    <div className="truncate text-xs">{v.origen}</div>
                    <div className="truncate text-xs text-slate-500">→ {v.destino}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{v.fecha}<div className="text-xs text-slate-500">{v.hora}</div></td>
                  <td className="px-4 py-3">{v.conductor ? <span className="inline-flex items-center gap-1.5"><span className="w-6 h-6 rounded-full bg-slate-900 text-white grid place-items-center text-[10px]">{v.conductor.split(" ").map(s=>s[0]).join("")}</span>{v.conductor}</span> : <span className="text-slate-400 text-xs">Sin asignar</span>}</td>
                  <td className="px-4 py-3"><Badge variant={statusVariant[v.estatus] ?? "neutral"}>{v.estatus}</Badge></td>
                  <td className="px-4 py-3 text-right font-semibold">{money(v.tarifa)}</td>
                  <td className="px-4 py-3"><Link href={`/traslados/${v.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-[#ff4d11] hover:underline">Detalle <ArrowUpRight className="w-3 h-3"/></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length===0 && <div className="p-8 text-center text-sm text-slate-500">Sin resultados</div>}
      </Card>
    </div>
  )
}
