import { kpis, Traslado, incidencias } from "@/data/mock";
import { Card, Badge } from "@/components/ui";
import { money } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight, Clock, MapPinned, AlertTriangle, CheckCircle2, Truck, Wallet, FileWarning, Users, Activity } from "lucide-react";

const kpiCards = [
  { label:"Traslado activos", value:kpis.activos, sub:"+2 vs ayer", icon:Truck, color:"bg-[#ff4d11]" },
  { label:"Pendientes de asignación", value:kpis.pendientes, sub:"Requieren atención", icon:Clock, color:"bg-amber-500" },
  { label:"Conductores disponibles", value:kpis.conductoresDisponibles, sub:`${kpis.conductoresEnTraslado} en Traslado`, icon:Users, color:"bg-emerald-500" },
  { label:"Ingresos del día", value: money(kpis.ingresosHoy), sub:"Estimado", icon:Wallet, color:"bg-slate-900" },
  { label:"Incidencias abiertas", value:kpis.incidenciasAbiertas, sub:"1 nueva hoy", icon:AlertTriangle, color:"bg-red-500" },
  { label:"Docs pendientes", value:kpis.docsPendientes, sub:"Revisión requerida", icon:FileWarning, color:"bg-violet-500" },
];

export default function Dashboard(){
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">¿Qué está pasando en la operación?</h1>
          <p className="text-sm text-slate-500 mt-1">Vista ejecutiva del {new Date().toLocaleDateString("es-MX",{weekday:"long", day:"numeric", month:"long"}) } • Actualizado hace 2 min</p>
        </div>
        <Link href="/Traslado" className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-xl px-4 h-9 text-sm font-medium">Ver todos los Traslado <ArrowUpRight className="w-4 h-4"/></Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map(c=>(
          <Card key={c.label} className="p-4">
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-xl grid place-items-center text-white ${c.color}`}><c.icon className="w-5 h-5"/></div>
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">{c.sub}</span>
            </div>
            <div className="mt-3 text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Mapa operativo */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><MapPinned className="w-4 h-4 text-[#ff4d11]"/> Operación en vivo — Bajío</h3>
            <Badge variant="success">8 activos • 14 disponibles</Badge>
          </div>
          <div className="mx-5 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-[280px] relative">
            <div className="absolute inset-0 opacity-30" style={{backgroundImage:"radial-gradient(#94a3b8 1px, transparent 1px)", backgroundSize:"18px 18px"}}/>
            {/* fake map pins */}
            <div className="absolute left-[22%] top-[38%]">
              <div className="w-3 h-3 bg-[#ff4d11] rounded-full animate-ping absolute"/>
              <div className="w-3 h-3 bg-[#ff4d11] rounded-full relative border-2 border-white shadow"/>
              <div className="text-[11px] bg-slate-900 text-white rounded-full px-2 py-0.5 mt-1 whitespace-nowrap">RR-24081 • En curso</div>
            </div>
            <div className="absolute left-[55%] top-[52%]">
              <div className="w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow"/>
              <div className="text-[11px] bg-white border rounded-full px-2 py-0.5 mt-1">Luis R. • Disponible</div>
            </div>
            <div className="absolute left-[68%] top-[28%]">
              <div className="w-3 h-3 bg-amber-500 rounded-full border-2 border-white shadow"/>
              <div className="text-[11px] bg-white border rounded-full px-2 py-0.5 mt-1">Pendiente León</div>
            </div>
            <div className="absolute bottom-3 left-3 bg-white rounded-xl border shadow-sm p-3 text-xs leading-tight">
              <div className="font-semibold">Zonas activas</div>
              <div className="text-slate-500">León • Querétaro • Irapuato • Silao</div>
            </div>
            <div className="absolute bottom-3 right-3 bg-slate-900 text-white rounded-xl px-3 py-2 text-xs">
              <div className="opacity-60">Tiempo promedio asignación</div>
              <div className="font-bold text-sm">18 min</div>
            </div>
          </div>
          <div className="p-4 flex gap-2 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ff4d11]"/>En curso</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"/>Disponible</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"/>Pendiente</span>
          </div>
        </Card>

        {/* Alertas */}
        <Card className="flex flex-col">
          <div className="p-5 pb-3 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500"/> Alertas operativas</h3>
            <span className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-1 font-medium">5 requieren acción</span>
          </div>
          <div className="px-3 space-y-2 flex-1">
            {[
              {t:"Traslado sin conductor", d:"RR-24082 • Ana Torres • hace 42 min", c:"warning"},
              {t:"Evidencia incompleta", d:"RR-24085 • MasterFix • fotos ilegibles", c:"danger"},
              {t:"Documento vencido", d:"Gabriela Ortiz • Licencia vencida 03 Sep", c:"danger"},
              {t:"Conductor retrasado", d:"RR-24081 • +25 min tráfico Qro", c:"warning"},
              {t:"Pago en revisión", d:"RR-24085 • $4,600 pendiente autorizar", c:"neutral"},
            ].map(a=>(
              <div key={a.t} className="flex gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                <div className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${a.c==="warning"?"bg-amber-100 text-amber-700":a.c==="danger"?"bg-red-100 text-red-700":"bg-slate-100 text-slate-700"}`}><AlertTriangle className="w-4 h-4"/></div>
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-none">{a.t}</div>
                  <div className="text-xs text-slate-500 mt-1">{a.d}</div>
                </div>
                <button className="ml-auto text-xs font-medium text-[#ff4d11] shrink-0">Atender</button>
              </div>
            ))}
          </div>
          <div className="p-3">
            <Link href="/incidencias" className="block text-center text-sm font-medium text-slate-600 hover:text-slate-900 py-2 rounded-xl bg-slate-50">Ver todas las alertas</Link>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <div className="p-5 pb-3 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4"/> Actividad reciente</h3><span className="text-xs text-slate-500">Hoy</span></div>
          <div className="px-5 pb-5 space-y-3">
            {[
              {t:"Evidencia final cargada", d:"RR-24084 • Fernando Cruz • hace 18 min", ok:true},
              {t:"Conductor aceptó Traslado", d:"RR-24083 • Jorge Herrera • hace 32 min", ok:true},
              {t:"Nuevo Traslado solicitado", d:"RR-24086 • Roberto Salas • hace 51 min", ok:false},
              {t:"Pago liberado", d:"RR-24084 • $7,400 — GNP • hace 1 h", ok:true},
              {t:"Incidencia creada", d:"INC-881 • RR-24085 • hace 2 h", ok:false},
            ].map(r=>(
              <div key={r.t} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${r.ok?"bg-emerald-500":"bg-slate-300"}`}/>
                <div><div className="text-sm font-medium">{r.t}</div><div className="text-xs text-slate-500">{r.d}</div></div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-5 pb-3 flex items-center justify-between"><h3 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4"/> Próximos Traslado</h3><Link href="/Traslado" className="text-xs font-medium text-[#ff4d11]">Ver todos</Link></div>
          <div className="px-3 pb-3 space-y-2">
            {Traslado.slice(0,4).map(v=>(
              <Link key={v.id} href={`/Traslado/${v.id}`} className="flex gap-3 p-3 rounded-xl border hover:bg-slate-50">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white grid place-items-center font-bold text-xs">{v.id.slice(-3)}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{v.cliente} • {v.hora}</div>
                  <div className="text-xs text-slate-500 truncate">{v.origen.split("—")[0]} → {v.destino.split("—")[0]}</div>
                </div>
                <Badge variant={v.estatus==="En curso"?"warning":v.estatus==="Finalizado"?"success":"neutral"} className="shrink-0 h-fit">{v.estatus}</Badge>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <div className="p-5 pb-3"><h3 className="font-semibold">Resumen financiero</h3></div>
          <div className="px-5 pb-5 space-y-4">
            <div className="rounded-xl bg-slate-900 text-white p-4">
              <div className="text-xs opacity-70">Ingresos estimados hoy</div>
              <div className="text-2xl font-bold mt-1">{money(kpis.ingresosHoy)}</div>
              <div className="text-xs opacity-60 mt-1">5 Traslado finalizados + 8 activos</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border p-3"><div className="text-slate-500 text-xs">Por cobrar</div><div className="font-bold">{money(14250)}</div></div>
              <div className="rounded-xl border p-3"><div className="text-slate-500 text-xs">Por pagar conductores</div><div className="font-bold">{money(8350)}</div></div>
              <div className="rounded-xl border p-3"><div className="text-slate-500 text-xs">Margen estimado</div><div className="font-bold text-emerald-600">+38%</div></div>
              <div className="rounded-xl border p-3"><div className="text-slate-500 text-xs">Gastos autorizados</div><div className="font-bold">{money(1240)}</div></div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> 3 pagos verificados hoy</div>
          </div>
        </Card>
      </div>
    </div>
  )
}
