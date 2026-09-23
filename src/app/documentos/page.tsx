import { documentos } from "@/data/mock";
import { Card, Badge, Button } from "@/components/ui";

export default function DocumentosPage(){
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Documentos</h1><p className="text-sm text-slate-500">Validación de conductores, usuarios y empresas</p></div>
        <div className="flex gap-2"><Button variant="outline">Solicitar actualización</Button><Button>Aprobar seleccionados</Button></div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 border-b">
              <tr><th className="text-left px-4 py-3">Titular</th><th className="text-left px-4 py-3">Documento</th><th className="text-left px-4 py-3">Vencimiento</th><th className="text-left px-4 py-3">Estatus</th><th className="text-right px-4 py-3">Acciones</th></tr>
            </thead>
            <tbody className="divide-y">
              {documentos.map(d=>(
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{d.titular}</td>
                  <td className="px-4 py-3">{d.tipo}</td>
                  <td className="px-4 py-3">{d.vence}</td>
                  <td className="px-4 py-3"><Badge variant={d.estatus==="Aprobado"?"success":d.estatus==="Vencido"||d.estatus==="Rechazado"?"danger":d.estatus==="En revisión"?"warning":"neutral"}>{d.estatus}</Badge></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="outline" size="sm">Ver</Button>
                    <Button variant="ghost" size="sm">Aprobar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
