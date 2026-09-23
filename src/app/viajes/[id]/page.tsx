import { Traslado } from "@/data/mock";
import { Card, Badge, Button } from "@/components/ui";
import { money } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, MapPin, Car, User, CreditCard, Clock, Camera, FileText, AlertTriangle } from "lucide-react";

export default async function TrasladoDetalle({params}:{params: Promise<{id:string}>}){
  const {id}= await params;
  const v = Traslado.find(x=>x.id===id) ?? Traslado[0];
  return (
    <div className="space-y-4">
      <Link href="/Traslado" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4"/> Volver a Traslado</Link>

      <div className="flex flex-wrap gap-3 items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{v.id}</h1>
            <Badge variant={v.estatus==="En curso"?"warning":v.estatus==="Finalizado"?"success":"neutral"}>{v.estatus}</Badge>
          </div>
          <p className="text-sm text-slate-500">{v.vehiculo} • {v.fecha} {v.hora}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline">Cambiar conductor</Button>
          <Button variant="outline">Registrar incidencia</Button>
          <Button>Asignar conductor</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2"><User className="w-4 h-4"/> Resumen</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Cliente</span><span className="font-medium">{v.cliente}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Empresa</span><span className="font-medium">{v.empresa ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Conductor</span><span className="font-medium">{v.conductor ?? "Sin asignar"}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Evidencia</span><Badge variant={v.evidencia==="Aprobada"?"success":v.evidencia==="Incompleta"?"danger":"warning"}>{v.evidencia}</Badge></div>
              </dl>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2"><Car className="w-4 h-4"/> Vehículo</h3>
              <div className="mt-3 text-sm space-y-1">
                <div className="font-medium">{v.vehiculo}</div>
                <div className="text-slate-500">VIN: 1HGCM82633A004352 • Transmisión Automática</div>
                <div className="text-slate-500">Placas: GHT-341-A • Color Rojo • Año 2023</div>
                <div className="text-xs bg-amber-50 border border-amber-200 rounded-xl p-2 mt-2">Observaciones: Entrega con tanque 1/2, sin daños visibles previos.</div>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-[#ff4d11]"/> Ruta</h3>
            <div className="grid md:grid-cols-2 gap-4 mt-3 text-sm">
              <div className="rounded-xl border p-3 bg-slate-50">
                <div className="text-xs font-bold tracking-widest text-slate-500">ORIGEN</div>
                <div className="font-medium mt-1">{v.origen}</div>
                <div className="text-slate-500">Contacto: Juan Pérez — 477 123 4567</div>
                <div className="text-xs text-slate-400">Ref: Portón negro, preguntar en recepción</div>
              </div>
              <div className="rounded-xl border p-3 bg-white">
                <div className="text-xs font-bold tracking-widest text-slate-500">DESTINO</div>
                <div className="font-medium mt-1">{v.destino}</div>
                <div className="text-slate-500">Contacto: Ana López — 442 987 2233</div>
                <div className="text-xs text-slate-400">Instrucciones: Entregar llaves en caseta 2</div>
              </div>
            </div>
            <div className="mt-3 rounded-xl overflow-hidden border h-[160px] bg-slate-100 grid place-items-center text-sm text-slate-500">Mapa de ruta — 187 km • 2h 15m estimado</div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2"><Camera className="w-4 h-4"/> Evidencia</h3>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {["Frente","Lateral","Tablero / KM","Interior","Placas","Combustible"].map((k,i)=>(
                <div key={k} className="rounded-xl border overflow-hidden">
                  <div className={`h-24 ${i<3?"bg-slate-200":"bg-slate-100 border-dashed border-2"} grid place-items-center text-xs text-slate-500`}>{i<3?"Foto":"Pendiente"}</div>
                  <div className="p-2 text-xs font-medium">{k}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm">Comparar inicial vs final</Button>
              <Button variant="secondary" size="sm">Aprobar evidencia</Button>
              <Button variant="ghost" size="sm">Solicitar aclaración</Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4"/> Pagos</h3>
            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div className="rounded-xl border p-3"><div className="text-xs text-slate-500">Tarifa cliente</div><div className="font-bold text-lg">{money(v.tarifa)}</div></div>
              <div className="rounded-xl border p-3"><div className="text-xs text-slate-500">Pago conductor</div><div className="font-bold text-lg">{money(v.pagoConductor)}</div></div>
              <div className="rounded-xl border p-3"><div className="text-xs text-slate-500">Gastos reportados</div><div className="font-bold">{money(450)} <span className="font-normal text-slate-500">• Peaje</span></div></div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3"><div className="text-xs text-emerald-700">Margen estimado</div><div className="font-bold text-emerald-700">{money(v.tarifa - v.pagoConductor - 450)} (36%)</div></div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2"><Clock className="w-4 h-4"/> Línea de tiempo</h3>
            <ol className="mt-4 relative border-l border-slate-200 ml-2 space-y-4">
              {[
                {t:"Solicitud creada", d:"21 Sep 09:12 • Sistema", done:true},
                {t:"Conductor asignado", d:"21 Sep 09:18 • Sofía R. → Luis Ramírez", done:true},
                {t:"Conductor aceptó", d:"21 Sep 09:22", done:true},
                {t:"Llegada a origen", d:"21 Sep 09:35", done:true},
                {t:"Evidencia inicial cargada", d:"21 Sep 09:38 • 6 fotos", done:true},
                {t:"Traslado en curso", d:"Ahora • 187 km", done:true, current:true},
                {t:"Evidencia final pendiente", d:"Pendiente llegada destino", done:false},
                {t:"Entrega confirmada", d:"Pendiente", done:false},
              ].map(s=>(
                <li key={s.t} className="ml-4">
                  <span className={`absolute -left-[5px] w-2.5 h-2.5 rounded-full border-2 ${s.current?"bg-[#ff4d11] border-[#ff4d11]": s.done?"bg-emerald-500 border-emerald-500":"bg-white border-slate-300"}`}/>
                  <div className={`text-sm font-medium ${s.current?"text-[#ff4d11]":""}`}>{s.t}</div>
                  <div className="text-xs text-slate-500">{s.d}</div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4"/> Notas internas</h3>
            <textarea placeholder="Agregar nota visible solo para operación..." className="mt-3 w-full min-h-[90px] rounded-xl border border-slate-200 p-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20"/>
            <Button className="mt-2 w-full">Guardar nota</Button>
            <div className="mt-4 space-y-2 text-sm">
              <div className="rounded-xl bg-slate-50 border p-3"><div className="font-medium">Sofía R. • 21 Sep 09:20</div><div className="text-slate-600">Cliente solicita entrega antes de las 12:00. Coordinar con contacto destino.</div></div>
            </div>
          </Card>

          <Card className="p-5 border-amber-200 bg-amber-50">
            <h3 className="font-semibold flex items-center gap-2 text-amber-800"><AlertTriangle className="w-4 h-4"/> Acciones rápidas</h3>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button variant="outline" size="sm">Editar horario</Button>
              <Button variant="outline" size="sm">Cambiar estatus</Button>
              <Button variant="outline" size="sm">Cancelar Traslado</Button>
              <Button variant="secondary" size="sm">Marcar finalizado</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
