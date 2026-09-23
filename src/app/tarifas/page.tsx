"use client";
import { useState, useMemo, useEffect } from "react";
import { Card, Button, Input, Badge } from "@/components/ui";
import { money } from "@/lib/utils";
import {
  DEFAULT_VARIABLES, VariablesBase, M_ACTIVO, M_TEMPORAL, M_CLIENTE, M_URGENCIA, CONDICION_AJUSTE,
  calcularTAD, type Segmento, type Gama, type Condicion, type ClienteTipo, type Urgencia, type DiaTipo, type Horario
} from "@/lib/tad";
import { fetchTadConfig, saveTadConfig } from "@/lib/supabase/tad";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { Calculator, Settings2, Copy, RotateCcw, Info, AlertTriangle, Fuel, Ticket, ArrowLeftRight, Database, Cloud, Check, Loader2, ExternalLink } from "lucide-react";

const segmentos: Segmento[] = ["Subcompacto / Compacto","SUV / Minivan / Pick-up","Deportivo","Lujo / Blindado"];
const gamas: Gama[] = ["Entrada","Media","Alta","Premium"];
const condiciones: Condicion[] = ["NUEVO","SEMINUEVO","USADO"];
const clienteTipos: ClienteTipo[] = ["Personal","Empresarial (PYME)","Corporativo / Renting"];
const urgencias: Urgencia[] = ["Programado (>24h)","Express (<4h)"];
const dias: DiaTipo[] = ["Lunes a Viernes","Sábado","Domingo y Feriados"];
const horarios: Horario[] = ["Diurno (06:00-20:00)","Nocturno (20:01-05:59)"];

export default function TarifasPage(){
  const [vars, setVars] = useState<VariablesBase>(DEFAULT_VARIABLES);
  const [distancia, setDistancia] = useState(87);
  const [horas, setHoras] = useState(1.5);
  const [segmento, setSegmento] = useState<Segmento>("Subcompacto / Compacto");
  const [gama, setGama] = useState<Gama>("Media");
  const [condicion, setCondicion] = useState<Condicion>("SEMINUEVO");
  const [diaTipo, setDiaTipo] = useState<DiaTipo>("Lunes a Viernes");
  const [horario, setHorario] = useState<Horario>("Diurno (06:00-20:00)");
  const [clienteTipo, setClienteTipo] = useState<ClienteTipo>("Personal");
  const [urgencia, setUrgencia] = useState<Urgencia>("Programado (>24h)");
  const [combustible, setCombustible] = useState(450);
  const [casetas, setCasetas] = useState(320);
  const [viatico, setViatico] = useState(0);
  const [tab, setTab] = useState<"simulador"|"config"|"matrices">("simulador");

  // Supabase state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(()=>{
    let mounted = true;
    async function load(){
      setLoading(true);
      const res = await fetchTadConfig();
      if(!mounted) return;
      if(res.needsSetup) setNeedsSetup(true);
      if(res.error && !res.needsSetup) setSupabaseError(res.error);
      else setConnected(!res.needsSetup && !res.error && configured);
      setVars(res.vars);
      setLoading(false);
    }
    load();
    return ()=>{ mounted=false; };
  },[]);

  const activoInvalido = M_ACTIVO[segmento][gama] === null;
  const result = useMemo(()=>{
    try {
      return calcularTAD({
        distanciaKm: distancia, horas, segmento, gama, condicion, diaTipo, horario, clienteTipo, urgencia,
        variables: vars, gastos:{ combustible, casetas, viaticoRetorno: viatico }
      });
    } catch { return null; }
  },[distancia,horas,segmento,gama,condicion,diaTipo,horario,clienteTipo,urgencia,vars,combustible,casetas,viatico]);

  const reset = ()=> setVars(DEFAULT_VARIABLES);
  const save = async ()=>{
    setSaving(true); setSupabaseError(null);
    const { error } = await saveTadConfig(vars);
    setSaving(false);
    if(error){ setSupabaseError(error); return; }
    setConnected(true); setNeedsSetup(false); setLastSaved(new Date().toLocaleTimeString("es-MX"));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">Tarifas</h1>
            <span className="rounded-full bg-[#ff4d11] text-white text-xs font-bold px-2.5 py-1">TAD v2.0</span>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Algoritmo activo</Badge>
            {configured ? (
              needsSetup ? <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Supabase: falta esquema</Badge>
              : connected ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700"><Cloud className="w-3 h-3"/>Conectado a Supabase</span>
              : loading ? <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border px-2.5 py-1 text-xs text-slate-600"><Loader2 className="w-3 h-3 animate-spin"/>Conectando...</span>
              : <Badge variant="outline" className="bg-slate-50">Supabase: local</Badge>
            ) : <Badge variant="outline" className="bg-slate-100">Sin Supabase (.env)</Badge>}
          </div>
          <p className="text-sm text-slate-500 mt-1">Tarifador Automático Dinámico — Fee del servicio + Módulos separados de Gastos y Liquidación</p>
          {lastSaved && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Check className="w-3 h-3"/>Guardado en Supabase a las {lastSaved}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}><RotateCcw className="w-4 h-4 mr-2"/>Restablecer</Button>
          <Button onClick={()=>navigator.clipboard.writeText(JSON.stringify(result,null,2))}><Copy className="w-4 h-4 mr-2"/>Copiar desglose</Button>
        </div>
      </div>

      {/* Setup banner */}
      {needsSetup && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <div className="flex gap-3">
            <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">Supabase conectado pero sin esquema</div>
              <div className="text-sm text-amber-800 mt-1">Proyecto <code className="bg-white border rounded px-1.5 py-0.5 font-mono text-xs">puomblsfbxuthcunmirg</code> no tiene la tabla <code className="bg-white border rounded px-1.5 py-0.5">tad_config</code>. Ejecuta el SQL en el Dashboard para persistir las Variables Base.</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href="https://supabase.com/dashboard/project/puomblsfbxuthcunmirg/sql/new" target="_blank" className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl px-3 py-2 text-xs font-bold">Abrir SQL Editor <ExternalLink className="w-3 h-3"/></a>
                <span className="text-xs text-amber-700 self-center">Luego pega el contenido de <code className="bg-white border rounded px-1">supabase/schema.sql</code> y Run.</span>
              </div>
              <details className="mt-3">
                <summary className="text-xs font-semibold text-amber-800 cursor-pointer">Ver SQL (tad_config)</summary>
                <pre className="mt-2 bg-slate-900 text-slate-100 rounded-xl p-3 text-[11px] overflow-auto leading-relaxed">{`create table public.tad_config (
  id int primary key check (id=1),
  tarifa_base numeric default 400,
  costo_km_urbano numeric default 16.50,
  costo_km_interurbano numeric default 14.50,
  costo_km_interestatal numeric default 12.50,
  costo_hora numeric default 300,
  tarifa_minima numeric default 650,
  updated_at timestamptz default now()
);
insert into public.tad_config (id) values (1) on conflict do nothing;
alter table public.tad_config enable row level security;
create policy tad_config_all on public.tad_config for all using (true) with check (true);`}</pre>
              </details>
            </div>
          </div>
        </div>
      )}
      {supabaseError && !needsSetup && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> {supabaseError}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          {id:"simulador", label:"Simulador en vivo", icon:Calculator},
          {id:"config", label:"Variables Base", icon:Settings2},
          {id:"matrices", label:"Matrices de Multiplicadores", icon:Copy},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id as any)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab===t.id ? "border-[#ff4d11] text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            <t.icon className="w-4 h-4"/>{t.label}
          </button>
        ))}
      </div>

      {/* Regla de oro */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"/>
        <div className="text-sm">
          <span className="font-bold text-amber-900">Regla de Oro — Separación de Módulos:</span>
          <span className="text-amber-800"> El TAD solo calcula el <b>Fee del servicio</b> (valor + riesgo + logística). </span>
          <span className="text-slate-600"><b>Módulo de Gastos</b> (combustible + casetas + viático retorno) y <b>Módulo de Liquidación</b> (comisión app / pago conductor) se suman <b>después</b>. Fórmula final: </span>
          <code className="bg-white border rounded-lg px-2 py-1 font-mono text-xs">Total a Pagar = TAD + Gastos Estimados</code>
          <span className="ml-2 text-xs text-slate-500">(Gastos y Liquidación — pendientes)</span>
        </div>
      </div>

      {tab==="simulador" && (
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2"><Calculator className="w-4 h-4 text-[#ff4d11]"/> Parámetros del traslado</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Distancia (km)</label>
                  <Input type="number" value={distancia} onChange={e=>setDistancia(Number(e.target.value))} className="mt-1"/>
                  <p className="text-[11px] text-slate-400 mt-1">0-50 urbano · 51-150 interurbano · &gt;150 interestatal (progresivo)</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tiempo estimado (horas)</label>
                  <Input type="number" step="0.5" value={horas} onChange={e=>setHoras(Number(e.target.value))} className="mt-1"/>
                  <p className="text-[11px] text-slate-400 mt-1">Maniobras / tráfico × ${vars.COSTO_HORA}/h</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Segmento</label>
                  <select value={segmento} onChange={e=>setSegmento(e.target.value as Segmento)} className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {segmentos.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Gama</label>
                  <select value={gama} onChange={e=>setGama(e.target.value as Gama)} className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {gamas.map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Condición</label>
                  <select value={condicion} onChange={e=>setCondicion(e.target.value as Condicion)} className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {condiciones.map(c=><option key={c} value={c}>{c} — {CONDICION_AJUSTE[c]>=1?`+${Math.round((CONDICION_AJUSTE[c]-1)*100)}%`:`${Math.round((CONDICION_AJUSTE[c]-1)*100)}%`}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tipo de cliente</label>
                  <select value={clienteTipo} onChange={e=>setClienteTipo(e.target.value as ClienteTipo)} className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {clienteTipos.map(c=><option key={c} value={c}>{c} — ×{M_CLIENTE[c].toFixed(2)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Día</label>
                  <select value={diaTipo} onChange={e=>setDiaTipo(e.target.value as DiaTipo)} className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {dias.map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Horario</label>
                  <select value={horario} onChange={e=>setHorario(e.target.value as Horario)} className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    {horarios.map(h=><option key={h} value={h}>{h} — ×{M_TEMPORAL[diaTipo][h].toFixed(2)}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Urgencia</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {urgencias.map(u=>(
                      <button key={u} onClick={()=>setUrgencia(u)} className={`rounded-xl border px-3 py-2.5 text-sm font-medium text-left ${urgencia===u? "bg-slate-900 text-white border-slate-900":"bg-white border-slate-200 hover:bg-slate-50"}`}>
                        {u} <span className={`ml-1 text-xs ${urgencia===u?"text-white/70":"text-slate-500"}`}>×{M_URGENCIA[u].toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {activoInvalido && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs p-3">Combinación no válida: {segmento} no existe en gama {gama} (N/A). Selecciona otra gama.</div>}
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold flex items-center gap-2"><Fuel className="w-4 h-4"/> Módulo de Gastos — separado del TAD</h3>
              <p className="text-xs text-slate-500 mt-1">Se suma al final. No multiplica. Estimación operativa.</p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div><label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Fuel className="w-3 h-3"/> Combustible</label><Input type="number" value={combustible} onChange={e=>setCombustible(Number(e.target.value))} className="mt-1"/></div>
                <div><label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Ticket className="w-3 h-3"/> Casetas</label><Input type="number" value={casetas} onChange={e=>setCasetas(Number(e.target.value))} className="mt-1"/></div>
                <div><label className="text-xs font-medium text-slate-600 flex items-center gap-1"><ArrowLeftRight className="w-3 h-3"/> Viático retorno</label><Input type="number" value={viatico} onChange={e=>setViatico(Number(e.target.value))} className="mt-1"/></div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            {!result ? (
              <Card className="p-8 text-center text-sm text-slate-500">Corrige la combinación de activo para calcular</Card>
            ) : (
              <>
                <Card className="overflow-hidden">
                  <div className="bg-slate-900 text-white p-5">
                    <div className="text-xs opacity-60 tracking-widest font-semibold">RESULTADO TAD — FEE DEL SERVICIO</div>
                    <div className="text-3xl font-black mt-1">{money(result.tad)}</div>
                    <div className="text-xs opacity-60 mt-1">Subtotal {money(result.subtotal)} × M_total {result.mTotal.toFixed(4)} = {money(result.tadBruto)} {result.isMinimaAplicada && <span className="ml-2 bg-amber-500 text-white rounded-full px-2 py-0.5 font-bold">Piso mínima aplicada {money(result.tarifaMinima)}</span>}</div>
                  </div>
                  <div className="p-5 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Tarifa base (banderazo)</span><span className="font-medium">{money(result.tarifaBase)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{result.tramo}</span><span className="font-medium">{money(result.costoDistancia)} <span className="text-xs text-slate-400">({result.costoDistanciaDetalle})</span></span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tiempo {horas}h × {money(vars.COSTO_HORA)}</span><span className="font-medium">{money(result.costoTiempo)}</span></div>
                    <div className="h-px bg-slate-200"/>
                    <div className="flex justify-between font-semibold"><span>Subtotal</span><span>{money(result.subtotal)}</span></div>
                    <div className="rounded-xl bg-slate-50 border p-3 space-y-1.5">
                      <div className="flex justify-between text-xs"><span>M_activo ({segmento} · {gama} · {condicion})</span><span className="font-mono font-bold">×{result.mActivo.toFixed(2)}</span></div>
                      <div className="flex justify-between text-xs"><span>M_temporal ({diaTipo} · {horario})</span><span className="font-mono font-bold">×{result.mTemporal.toFixed(2)}</span></div>
                      <div className="flex justify-between text-xs"><span>M_cliente ({clienteTipo})</span><span className="font-mono font-bold">×{result.mCliente.toFixed(2)}</span></div>
                      <div className="flex justify-between text-xs"><span>M_urgencia ({urgencia})</span><span className="font-mono font-bold">×{result.mUrgencia.toFixed(2)}</span></div>
                      <div className="h-px bg-slate-200 my-1"/>
                      <div className="flex justify-between font-bold"><span>M_total</span><span className="font-mono">×{result.mTotal.toFixed(4)}</span></div>
                    </div>
                    <div className="flex justify-between items-center rounded-xl bg-[#ff4d11]/10 border border-[#ff4d11]/20 p-3">
                      <span className="font-bold text-[#ff4d11]">TAD (Fee) </span><span className="font-black text-lg">{money(result.tad)}</span>
                    </div>
                    {result.isMinimaAplicada && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2">Bruto {money(result.tadBruto)} &lt; Tarifa mínima {money(result.tarifaMinima)} — se aplica piso.</div>}
                  </div>
                </Card>

                <Card className="p-5">
                  <h3 className="font-semibold text-sm">Total a pagar — Cliente</h3>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">TAD (Fee)</span><span className="font-bold">{money(result.tad)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">+ Combustible</span><span>{money(result.desgloseGastos.combustible)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">+ Casetas</span><span>{money(result.desgloseGastos.casetas)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">+ Viático retorno</span><span>{money(result.desgloseGastos.viaticoRetorno)}</span></div>
                    <div className="h-px bg-slate-200"/>
                    <div className="flex justify-between items-center text-base"><span className="font-bold">Total</span><span className="font-black text-xl">{money(result.totalPagar)}</span></div>
                    <p className="text-[11px] text-slate-400">Módulo de Liquidación (comisión app / pago conductor) pendiente — no afecta este cálculo.</p>
                  </div>
                </Card>

                <Card className="p-4 bg-slate-50 border-dashed">
                  <div className="text-xs font-mono text-slate-600 whitespace-pre-wrap">{`calcularTAD({ distancia:${distancia}, horas:${horas}, segmento:"${segmento}", gama:"${gama}", condicion:"${condicion}", dia:"${diaTipo}", horario:"${horario}", cliente:"${clienteTipo}", urgencia:"${urgencia}" }) // → ${money(result.tad)} + gastos ${money(result.gastosTotal)} = ${money(result.totalPagar)}`}</div>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {tab==="config" && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><Settings2 className="w-4 h-4"/> Variables Monetarias Base</h3>
              {loading ? <span className="text-xs text-slate-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/>Cargando desde Supabase...</span>
              : connected ? <span className="text-xs text-emerald-600 flex items-center gap-1"><Database className="w-3 h-3"/>Persistido en Supabase</span>
              : <span className="text-xs text-slate-500">Modo local</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1">Editables sin tocar código. Se aplican en tiempo real y se guardan en <code className="bg-slate-100 border rounded px-1">tad_config</code>.</p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {[
                {k:"TARIFA_BASE", label:"Tarifa base (banderazo)", desc:"Activación, despacho y verificación"},
                {k:"COSTO_KM_URBANO", label:"Costo km urbano (0-50 km)", desc:"Tramo urbano"},
                {k:"COSTO_KM_INTERURBANO", label:"Costo km interurbano (51-150 km)", desc:"Tramo interurbano"},
                {k:"COSTO_KM_INTERESTATAL", label:"Costo km interestatal (>150 km)", desc:"Tramo interestatal"},
                {k:"COSTO_HORA", label:"Costo por hora", desc:"Tiempo / maniobras / tráfico"},
                {k:"TARIFA_MINIMA", label:"Tarifa mínima (piso)", desc:"Garantía de rentabilidad"},
              ].map(f=>(
                <div key={f.k} className="rounded-xl border p-3 bg-white">
                  <label className="text-xs font-bold text-slate-700">{f.label}</label>
                  <div className="text-[11px] text-slate-400">{f.desc}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-slate-500">$</span>
                    <Input type="number" step="0.5" value={(vars as any)[f.k]} onChange={e=>setVars({...vars, [f.k]: Number(e.target.value)})}/>
                    <span className="text-xs text-slate-500">MXN</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={save} disabled={saving || !configured || needsSetup} className="flex-1">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Guardando...</> : <><Database className="w-4 h-4 mr-2"/>Guardar en Supabase</>}
              </Button>
              <Button variant="outline" onClick={reset}>Restablecer defaults</Button>
            </div>
            {needsSetup && <p className="text-xs text-amber-600 mt-2">Crea la tabla primero (ver banner arriba).</p>}
            {!configured && <p className="text-xs text-slate-500 mt-2">Configura .env.local para habilitar persistencia.</p>}
          </Card>
          <Card className="p-4 flex items-center gap-3 text-sm">
            <Info className="w-4 h-4 text-slate-400"/>
            <span className="text-slate-600">Los cambios se aplican al simulador en vivo. Usa <b>Guardar en Supabase</b> para que todo el equipo vea los mismos valores.</span>
          </Card>
        </div>
      )}

      {tab==="matrices" && (
        <div className="space-y-6">
          <Card className="p-5 overflow-hidden">
            <h3 className="font-semibold">A. Multiplicador de Activo (M_activo) — Segmento × Gama + Condición</h3>
            <p className="text-xs text-slate-500 mt-1">Condición: NUEVO ×1.05 · SEMINUEVO ×1.00 · USADO ×0.95 — El valor mostrado ya incluye el ajuste seleccionado en el simulador ({condicion}).</p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-slate-900 text-white text-xs">
                    <th className="text-left p-2.5 border">Segmento \ Gama</th>
                    {gamas.map(g=><th key={g} className="p-2.5 border text-center">{g}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {segmentos.map(seg=>(
                    <tr key={seg} className="even:bg-slate-50">
                      <td className="p-2.5 font-medium border bg-slate-50">{seg}</td>
                      {gamas.map(g=>{
                        const base = M_ACTIVO[seg][g];
                        if (base===null) return <td key={g} className="p-2.5 text-center border bg-slate-100 text-slate-400 text-xs">N/A</td>;
                        const ajustado = +(base * CONDICION_AJUSTE[condicion]).toFixed(2);
                        const isSelected = seg===segmento && g===gama;
                        return <td key={g} className={`p-2.5 text-center border font-mono font-bold ${isSelected ? "bg-[#ff4d11] text-white" : ""}`}>{ajustado.toFixed(2)}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold">B. Multiplicador Temporal (M_temporal)</h3>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border">
                  <thead><tr className="bg-slate-900 text-white text-xs"><th className="p-2 border text-left">Día</th><th className="p-2 border text-center">Diurno</th><th className="p-2 border text-center">Nocturno</th></tr></thead>
                  <tbody>
                    {dias.map(d=>(
                      <tr key={d} className={d===diaTipo ? "bg-amber-50" : "even:bg-slate-50"}>
                        <td className="p-2 border font-medium text-xs">{d}</td>
                        <td className={`p-2 border text-center font-mono ${d===diaTipo && horario==="Diurno (06:00-20:00)"?"bg-[#ff4d11] text-white font-bold":""}`}>×{M_TEMPORAL[d]["Diurno (06:00-20:00)"].toFixed(2)}</td>
                        <td className={`p-2 border text-center font-mono ${d===diaTipo && horario==="Nocturno (20:01-05:59)"?"bg-[#ff4d11] text-white font-bold":""}`}>×{M_TEMPORAL[d]["Nocturno (20:01-05:59)"].toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold">C. Multiplicador de Cliente (M_cliente)</h3>
              <div className="mt-3 space-y-2">
                {clienteTipos.map(c=>(
                  <div key={c} className={`flex justify-between items-center rounded-xl border p-3 ${c===clienteTipo?"bg-slate-900 text-white border-slate-900":"bg-white"}`}>
                    <span className="text-sm font-medium">{c}</span><span className="font-mono font-bold">×{M_CLIENTE[c].toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">Estrategia comercial por volumen y facturación.</p>
            </Card>
            <Card className="p-5">
              <h3 className="font-semibold">D. Multiplicador de Urgencia (M_urgencia)</h3>
              <div className="mt-3 space-y-2">
                {urgencias.map(u=>(
                  <div key={u} className={`flex justify-between items-center rounded-xl border p-3 ${u===urgencia?"bg-slate-900 text-white border-slate-900":"bg-white"}`}>
                    <span className="text-sm font-medium">{u}</span><span className="font-mono font-bold">×{M_URGENCIA[u].toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="p-5 bg-slate-900 text-white">
            <h3 className="font-semibold">Fórmula TAD v2.0</h3>
            <div className="mt-3 font-mono text-xs leading-relaxed bg-white/10 rounded-xl p-4 border border-white/10 overflow-x-auto">
              <div>subtotal = TARIFA_BASE + costoDistancia(distancia) + (horas × COSTO_HORA)</div>
              <div>costoDistancia = progresivo: 0-50×urbano + 51-150×interurbano + &gt;150×interestatal</div>
              <div>mActivo = M_ACTIVO[segmento][gama] × ajusteCondición</div>
              <div>mTotal = mActivo × mTemporal × mCliente × mUrgencia</div>
              <div>tadBruto = subtotal × mTotal</div>
              <div>tad = max(tadBruto, TARIFA_MINIMA)</div>
              <div className="text-amber-300 mt-2">totalPagar = tad + (combustible + casetas + viáticoRetorno)  // + liquidación (pendiente)</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
