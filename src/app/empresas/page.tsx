import { empresas } from "@/data/mock";
import { Card, Badge, Button, Input } from "@/components/ui";
import { Search, Building2 } from "lucide-react";

export default function EmpresasPage(){
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Empresas</h1><p className="text-sm text-slate-500">Cuentas corporativas — agencias, lotes, flotillas y aseguradoras</p></div>
        <Button>Nueva empresa</Button>
      </div>
      <Card className="p-3 flex gap-3">
        <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><Input placeholder="Buscar empresa, RFC, contacto..." className="pl-9"/></div>
        <Button variant="outline">Filtros</Button>
      </Card>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {empresas.map(e=>(
          <Card key={e.id} className="p-5">
            <div className="flex gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white grid place-items-center"><Building2 className="w-5 h-5"/></div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{e.comercial}</div>
                <div className="text-xs text-slate-500 truncate">{e.razon}</div>
                <div className="text-xs text-slate-400">{e.rfc}</div>
              </div>
              <Badge variant="outline">{e.tipo}</Badge>
            </div>
            <div className="mt-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-slate-500">Contacto</span><span className="font-medium">{e.contacto}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">traslados</span><span className="font-bold">{e.traslados}</span></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1">Ver perfil</Button>
              <Button variant="ghost" size="sm" className="flex-1">Facturación</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
