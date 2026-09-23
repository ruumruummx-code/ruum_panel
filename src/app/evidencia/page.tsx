import { Card, Badge, Button } from "@/components/ui";
import Link from "next/link";

const items = [
  { traslado:"RR-24081", cliente:"Carlos Mendoza", tipo:"Inicial", fotos:6, estatus:"En revisión", conductor:"Luis Ramírez" },
  { traslado:"RR-24084", cliente:"Daniela Ruiz", tipo:"Final", fotos:8, estatus:"Aprobada", conductor:"Fernando Cruz" },
  { traslado:"RR-24085", cliente:"MasterFix", tipo:"Inicial", fotos:4, estatus:"Incompleta", conductor:"—" },
  { traslado:"RR-24087", cliente:"Aseguradora GNP", tipo:"Inicial", fotos:5, estatus:"Rechazada", conductor:"—" },
  { traslado:"RR-24083", cliente:"Grupo Bimbo", tipo:"Durante traslado", fotos:2, estatus:"Pendiente", conductor:"Jorge Herrera" },
];

export default function EvidenciaPage(){
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Evidencia</h1><p className="text-sm text-slate-500">Revisión visual antes, durante y después del traslado</p></div>
        <Button variant="outline">Comparar inicial vs final</Button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((i)=>(
          <Card key={i.traslado} className="overflow-hidden">
            <div className="h-36 bg-slate-100 grid grid-cols-3 gap-1 p-2">
              {Array.from({length:6}).map((_,k)=>(
                <div key={k} className={`rounded-lg ${k < i.fotos ? "bg-slate-300" : "bg-white border-2 border-dashed"} grid place-items-center text-[10px] text-slate-500`}>{k < i.fotos ? "Foto" : "+"}</div>
              ))}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm">{i.traslado}</span>
                <Badge variant={i.estatus==="Aprobada"?"success":i.estatus==="Incompleta"||i.estatus==="Rechazada"?"danger":i.estatus==="En revisión"?"warning":"neutral"}>{i.estatus}</Badge>
              </div>
              <div className="text-sm font-medium mt-1">{i.cliente} • {i.tipo}</div>
              <div className="text-xs text-slate-500">{i.fotos} fotos • {i.conductor}</div>
              <div className="flex gap-2 mt-3">
                <Link href={`/traslados/${i.traslado}`} className="flex-1"><Button variant="outline" size="sm" className="w-full">Ver traslado</Button></Link>
                <Button size="sm" className="flex-1">Revisar</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
