import { pagos } from "@/data/mock";
import { Card, Badge, Button } from "@/components/ui";
import { money } from "@/lib/utils";

export default function PagosPage(){
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Pagos</h1><p className="text-sm text-slate-500">Ingresos, pagos a conductores, gastos y ajustes</p></div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5"><div className="text-xs text-slate-500">Por cobrar (clientes)</div><div className="text-2xl font-bold">{money(28900)}</div><div className="text-xs text-amber-600 mt-1">4 pagos pendientes</div></Card>
        <Card className="p-5"><div className="text-xs text-slate-500">Por pagar (conductores)</div><div className="text-2xl font-bold">{money(18450)}</div><div className="text-xs text-slate-500 mt-1">Semana 15-21 Sep</div></Card>
        <Card className="p-5 bg-slate-900 text-white"><div className="text-xs opacity-70">Margen estimado mes</div><div className="text-2xl font-bold">{money(127400)}</div><div className="text-xs opacity-60 mt-1">+38% promedio</div></Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 flex items-center justify-between"><h3 className="font-semibold">Pagos de usuarios</h3><Button variant="outline" size="sm">Exportar</Button></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 border-y">
              <tr><th className="text-left px-4 py-2">Traslado</th><th className="text-left px-4 py-2">Cliente</th><th className="text-right px-4 py-2">Tarifa</th><th className="text-left px-4 py-2">Método</th><th className="text-left px-4 py-2">Estatus</th><th className="text-left px-4 py-2">Fecha</th></tr>
            </thead>
            <tbody className="divide-y">
              {pagos.map(p=>(
                <tr key={p.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-mono font-medium">{p.Traslado}</td><td className="px-4 py-3">{p.cliente}</td><td className="px-4 py-3 text-right font-semibold">{money(p.tarifa)}</td><td className="px-4 py-3">{p.metodo}</td><td className="px-4 py-3"><Badge variant={p.estatus==="Pagado"?"success":p.estatus==="Pendiente"?"warning":"neutral"}>{p.estatus}</Badge></td><td className="px-4 py-3 text-slate-500">{p.fecha}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold">Pagos a conductores — esta semana</h3>
          <div className="mt-3 space-y-2 text-sm">
            {[
              {n:"Luis Ramírez", v:3, g: money(6600)},
              {n:"Fernando Cruz", v:2, g: money(8400)},
              {n:"Jorge Herrera", v:1, g: money(3100)},
            ].map(r=>(
              <div key={r.n} className="flex items-center justify-between rounded-xl border p-3">
                <div><div className="font-medium">{r.n}</div><div className="text-xs text-slate-500">{r.v} Traslado</div></div>
                <div className="font-bold">{r.g}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Gastos reportados</h3>
          <div className="mt-3 space-y-2 text-sm">
            {[
              {t:"Peaje", Traslado:"RR-24081", monto:450, est:"Aprobado"},
              {t:"Combustible", Traslado:"RR-24084", monto:800, est:"En revisión"},
              {t:"Peaje", Traslado:"RR-24085", monto:320, est:"Rechazado"},
            ].map(g=>(
              <div key={g.Traslado} className="flex items-center justify-between rounded-xl border p-3">
                <div><div className="font-medium">{g.t} • {g.Traslado}</div><div className="text-xs text-slate-500">{money(g.monto)}</div></div>
                <Badge variant={g.est==="Aprobado"?"success":g.est==="Rechazado"?"danger":"warning"}>{g.est}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
