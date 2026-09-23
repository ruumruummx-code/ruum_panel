import { incidencias } from "@/data/mock";
import { Card, Badge, Button } from "@/components/ui";
import { AlertTriangle } from "lucide-react";

export default function IncidenciasPage(){
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Incidencias</h1><p className="text-sm text-slate-500">Daños, retrasos, faltas de evidencia y conflictos operativos</p></div>
        <Button>Nueva incidencia</Button>
      </div>
      <div className="grid gap-3">
        {incidencias.map(i=>(
          <Card key={i.id} className="p-4 flex gap-4">
            <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${i.estatus==="Nueva"?"bg-red-100 text-red-600":i.estatus==="En revisión"?"bg-amber-100 text-amber-700":"bg-emerald-100 text-emerald-700"}`}><AlertTriangle className="w-5 h-5"/></div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-mono font-bold text-sm">{i.id}</span>
                <Badge variant="outline">{i.tipo}</Badge>
                <Badge variant={i.estatus==="Resuelta"?"success":i.estatus==="Nueva"?"danger":"warning"}>{i.estatus}</Badge>
                <span className="text-xs text-slate-500">traslados {i.traslados} • {i.fecha}</span>
              </div>
              <div className="text-sm mt-1">{i.desc}</div>
              <div className="text-xs text-slate-500 mt-1">Responsable: {i.responsable}</div>
            </div>
            <div className="hidden md:flex flex-col gap-2 shrink-0">
              <Button variant="outline" size="sm">Ver detalle</Button>
              <Button variant="ghost" size="sm">Asignar</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
