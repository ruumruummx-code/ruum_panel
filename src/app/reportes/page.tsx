import { Card } from "@/components/ui";
import { money } from "@/lib/utils";

export default function ReportesPage(){
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Reportes</h1><p className="text-sm text-slate-500">Desempeño operativo, financiero y de conductores</p></div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5"><div className="text-xs text-slate-500">Viajes esta semana</div><div className="text-2xl font-bold">48</div><div className="text-xs text-emerald-600">+12% vs semana anterior</div></Card>
        <Card className="p-5"><div className="text-xs text-slate-500">Cancelaciones</div><div className="text-2xl font-bold">3 <span className="text-sm font-normal text-slate-500">(6.2%)</span></div></Card>
        <Card className="p-5"><div className="text-xs text-slate-500">Tiempo promedio asignación</div><div className="text-2xl font-bold">18 min</div></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold">Viajes por día (últimos 7 días)</h3>
          <div className="mt-4 flex items-end gap-2 h-[160px]">
            {[5,8,6,12,9,7,11].map((v,i)=>(
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-[#ff4d11] rounded-t-xl" style={{height: v*12}}/>
                <span className="text-xs text-slate-500">{["L","M","X","J","V","S","D"][i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">Ingresos por periodo</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between rounded-xl border p-3"><span>Hoy</span><span className="font-bold">{money(42850)}</span></div>
            <div className="flex justify-between rounded-xl border p-3"><span>Esta semana</span><span className="font-bold">{money(187400)}</span></div>
            <div className="flex justify-between rounded-xl border p-3 bg-slate-900 text-white"><span>Este mes</span><span className="font-bold">{money(642000)}</span></div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold">Top conductores del mes</h3>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b"><tr><th className="text-left py-2">Conductor</th><th className="text-center py-2">Viajes</th><th className="text-center py-2">Calif.</th><th className="text-right py-2">Ganancias</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="py-2 font-medium">Fernando Cruz</td><td className="py-2 text-center">18</td><td className="py-2 text-center">4.95</td><td className="py-2 text-right font-bold">{money(71200)}</td></tr>
              <tr><td className="py-2 font-medium">Luis Ramírez</td><td className="py-2 text-center">14</td><td className="py-2 text-center">4.90</td><td className="py-2 text-right font-bold">{money(48200)}</td></tr>
              <tr><td className="py-2 font-medium">Jorge Herrera</td><td className="py-2 text-center">9</td><td className="py-2 text-center">4.80</td><td className="py-2 text-right font-bold">{money(36100)}</td></tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
