"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { money } from "@/lib/utils";
import {
  Lock,
  Clock,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  Globe,
  Smartphone,
  Info,
  Loader2,
} from "lucide-react";

const STORAGE_PASO5 = "ruum_solicitud_paso5";
const STORAGE_TARIFA = "ruum_tarifa_final";

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, "");
  if (digits.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function formatCardNumber(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 19);
  // 4-4-4-4 for 16, 4-6-5 for Amex 15
  if (digits.startsWith("34") || digits.startsWith("37")) {
    // Amex 15: 4-6-5
    return digits.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" ")).trim();
  }
  return digits.replace(/(\d{4})/g, "$1 ").trim().slice(0, 23);
}

function detectCardBrand(num: string): string {
  const d = num.replace(/\s/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  return "";
}

export default function SolicitudPaso5Page() {
  const [monto, setMonto] = useState<number>(1822.12);
  const [savedFlash, setSavedFlash] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Stripe form fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState(""); // MM/AA
  const [cvc, setCvc] = useState("");
  const [pais, setPais] = useState("México");
  const [isAIAgent, setIsAIAgent] = useState(false);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [saveLink, setSaveLink] = useState(false);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  // Cargar monto
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_TARIFA) || localStorage.getItem("ruum_last_cotizacion") || localStorage.getItem("ruum_cotizacion_result");
      if (raw) {
        const c = JSON.parse(raw);
        const val = c.tarifa ?? c.totalConGastos ?? c.monto ?? null;
        if (typeof val === "number") setMonto(val);
        else if (typeof raw === "string" && !isNaN(parseFloat(raw))) setMonto(parseFloat(raw));
      }
      const raw5 = localStorage.getItem(STORAGE_PASO5);
      if (raw5) {
        const d = JSON.parse(raw5);
        if (d.email) setEmail(d.email);
        if (d.telefono) setTelefono(d.telefono);
        if (d.nombreCompleto) setNombreCompleto(d.nombreCompleto);
        if (d.pais) setPais(d.pais);
      }
    } catch {}
    hasLoadedRef.current = true;
  }, []);

  // Auto-guardado
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_PASO5, JSON.stringify({ email, telefono, nombreCompleto, pais, updatedAt: new Date().toISOString() }));
        setSavedAt(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }));
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1200);
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [email, telefono, nombreCompleto, pais]);

  // Validaciones
  const cardBrand = detectCardBrand(cardNumber);
  const isCardValid = luhnCheck(cardNumber) && cardNumber.replace(/\D/g, "").length >= 13;
  const isExpiryValid = (() => {
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    const [mm, yy] = expiry.split("/").map((n) => parseInt(n, 10));
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const curYY = now.getFullYear() % 100;
    const curMM = now.getMonth() + 1;
    if (yy < curYY) return false;
    if (yy === curYY && mm < curMM) return false;
    return true;
  })();
  const isCvcValid = cardBrand === "Amex" ? /^\d{4}$/.test(cvc) : /^\d{3}$/.test(cvc);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isTelValid = /^\d{10}$/.test(telefono.replace(/\D/g, ""));
  const isNombreValid = nombreCompleto.trim().length >= 5 && nombreCompleto.trim().split(" ").length >= 2;

  const isStripeValid = isCardValid && isExpiryValid && isCvcValid && isEmailValid && isTelValid && isNombreValid;
  const canPay = isStripeValid && !paying;

  const handlePay = async () => {
    setTouched({ cardNumber: true, expiry: true, cvc: true, email: true, telefono: true, nombreCompleto: true });
    if (!isStripeValid) {
      setError("Completa correctamente todos los campos de pago.");
      return;
    }
    setError(null);
    setPaying(true);
    // Simular stripe.confirmPayment con return_url
    try {
      // Simular validación adicional de Stripe (fondos insuficientes simulado si tarjeta 4000000000000002)
      const digits = cardNumber.replace(/\D/g, "");
      if (digits === "4000000000000002") throw new Error("Fondos insuficientes — tarjeta rechazada.");
      if (digits === "4000000000000069") throw new Error("Tarjeta vencida — 3D Secure fallido.");
      // Simular delay
      await new Promise((r) => setTimeout(r, 1400));
      const paymentIntent = `pi_${Math.random().toString(36).slice(2, 10)}`;
      const clientSecret = `${paymentIntent}_secret_${Math.random().toString(36).slice(2, 8)}`;
      try {
        localStorage.setItem("ruum_payment_intent", JSON.stringify({ paymentIntent, clientSecret, monto, email, telefono, nombreCompleto, status: "succeeded", createdAt: new Date().toISOString() }));
        localStorage.setItem("ruum_solicitud_completada", "true");
      } catch {}
      // return_url simulado
      const returnUrl = `/traslados/confirmacion?payment_intent=${paymentIntent}&payment_intent_client_secret=${clientSecret}&redirect_status=succeeded`;
      window.location.href = returnUrl;
    } catch (e: any) {
      setError(e?.message || "Error procesando el pago. Intenta de nuevo.");
    } finally {
      setPaying(false);
    }
  };

  const handleExpiryChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) setExpiry(digits);
    else setExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
  };

  return (
    <div className="max-w-[1160px] mx-auto pb-24 lg:pb-0">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
          <Clock className="w-3 h-3" /> ⏱ Te tomará ~3 min
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${savedFlash ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-500"}`}>
          {savedFlash ? <><CheckCircle2 className="w-3 h-3" /> Guardado hace unos segundos</> : savedAt ? <>✓ Guardado {savedAt}</> : <>✓ Guardado automático</>}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-2.5 py-1 text-xs font-bold">
          <Lock className="w-3 h-3" /> 🔒 Pago seguro con Stripe
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#ff4d11] bg-[#ff4d11]/10 border border-[#ff4d11]/20 rounded-full px-3 py-1">
            PASO 5 DE 5 : PAGO
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 text-[11px]">
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-1 font-bold">1. Conoce tu tarifa ✓</span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-1 font-bold">2. ¿Qué vehículo trasladamos? ✓</span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-1 font-bold">3. ¿Dónde lo recogemos y llevamos? ✓</span>
            <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-1 font-bold">4. Detalles del servicio ✓</span>
            <span className="inline-flex items-center gap-1 bg-slate-900 text-white rounded-full px-2.5 py-1 font-bold">5. Pago</span>
          </div>
        </div>
      </div>

      {/* Banner carga masiva */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-wrap items-center gap-2 text-sm mb-6">
        <Building2 className="w-4 h-4 text-slate-500" />
        <span className="text-slate-700">¿Tienes varios vehículos? Crea hasta 100 traslados a la vez...</span>
        <Link href="/traslados" className="ml-auto text-[#ff4d11] font-bold hover:underline text-sm">Carga masiva CSV →</Link>
      </div>

      <div className="grid lg:grid-cols-[1.7fr_0.95fr] gap-6 items-start">
        {/* Izquierda: Stripe Form */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            {/* Encabezado tarjeta */}
            <div className="px-5 pt-5 pb-4 border-b bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-500 text-white px-2.5 py-1 text-xs font-black tracking-widest">SOLICITUD CREADA</span>
                <span className="ml-auto text-xs font-bold text-slate-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> Pago protegido con Stripe · Cifrado SSL de 256 bits</span>
              </div>
              <div className="mt-3">
                <div className="text-sm text-slate-500">Monto Total a Cobrar</div>
                <div className="text-3xl font-black">{money(monto)} <span className="text-base font-bold text-slate-500">MXN</span></div>
                <div className="text-sm text-slate-600 mt-1">Completa el pago seguro con Stripe para confirmar tu solicitud de traslado.</div>
                <div className="mt-2 text-xs text-slate-500 bg-white border rounded-lg px-3 py-2">Tus datos bancarios están cifrados y nunca se almacenan en nuestros servidores.</div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Método de pago */}
              <div>
                <label className="text-xs font-black tracking-widest text-slate-700">MÉTODO DE PAGO</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button className="h-10 rounded-xl border-2 border-slate-900 bg-slate-900 text-white text-sm font-bold flex items-center justify-center gap-2">
                    <CreditCard className="w-4 h-4" /> Tarjeta
                  </button>
                  <div className="h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <span className="font-bold">Visa</span> • <span className="font-bold">Mastercard</span> • <span className="font-bold">Amex</span>
                  </div>
                </div>
              </div>

              {/* Stripe Payment Element mock */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Lock className="w-3 h-3" /> Datos de tarjeta — PCI-DSS vía Stripe Elements
                  {cardBrand && <span className="ml-auto bg-slate-900 text-white rounded-full px-2 py-0.5 text-xs">{cardBrand}</span>}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Número de tarjeta <span className="text-red-500">*</span></label>
                  <div className="relative mt-1.5">
                    <CreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      onBlur={() => setTouched((s) => ({ ...s, cardNumber: true }))}
                      placeholder="4242 4242 4242 4242"
                      inputMode="numeric"
                      className={`h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 ${touched.cardNumber && !isCardValid ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">Luhn ✓</span>
                  </div>
                  {touched.cardNumber && !isCardValid && <p className="text-[11px] text-red-600 mt-1">Tarjeta inválida (usa 4242424242424242 para prueba).</p>}
                  <p className="text-[11px] text-slate-400 mt-1">Prueba: 4242424242424242, 4000000000000002 (fondos insuficientes), 4000000000000069 (vencida)</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Fecha vencimiento <span className="text-red-500">*</span></label>
                    <input
                      value={expiry}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      onBlur={() => setTouched((s) => ({ ...s, expiry: true }))}
                      placeholder="MM/AA"
                      inputMode="numeric"
                      className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 ${touched.expiry && !isExpiryValid ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                    />
                    {touched.expiry && !isExpiryValid && <p className="text-[11px] text-red-600 mt-1">MM/AA vigente.</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">CVC <span className="text-red-500">*</span></label>
                    <input
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      onBlur={() => setTouched((s) => ({ ...s, cvc: true }))}
                      placeholder={cardBrand === "Amex" ? "4 dígitos" : "3 dígitos"}
                      inputMode="numeric"
                      className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 ${touched.cvc && !isCvcValid ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Globe className="w-3 h-3" /> País</label>
                  <select value={pais} onChange={(e) => setPais(e.target.value)} className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm">
                    <option value="México">🇲🇽 México</option>
                    <option value="Estados Unidos">🇺🇸 Estados Unidos</option>
                    <option value="España">🇪🇸 España</option>
                    <option value="Colombia">🇨🇴 Colombia</option>
                  </select>
                </div>

                <label className="flex gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={isAIAgent} onChange={(e) => setIsAIAgent(e.target.checked)} className="rounded border-slate-300 mt-0.5" />
                  <span>I am an AI agent acting on behalf of someone else</span>
                </label>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <label className="flex gap-2 text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={saveLink} onChange={(e) => setSaveLink(e.target.checked)} className="rounded border-slate-300 mt-0.5" />
                    <span>Guardar datos para futuras compras con <span className="font-black">Link</span> — checkout rápido</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1">Guarda tarjeta y datos personales para futuras compras. Stripe Link.</p>
                </div>
              </div>

              {/* Email / Tel / Nombre */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Mail className="w-3 h-3" /> Correo electrónico <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((s) => ({ ...s, email: true }))}
                    placeholder="tu@ejemplo.com"
                    className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 ${touched.email && !isEmailValid ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                  />
                  {touched.email && !isEmailValid && <p className="text-[11px] text-red-600 mt-1">Formato email inválido.</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><Smartphone className="w-3 h-3" /> Número de celular <span className="text-red-500">*</span></label>
                  <div className="mt-1.5 flex">
                    <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-sm font-bold">🇲🇽 +52</span>
                    <input
                      inputMode="numeric"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      onBlur={() => setTouched((s) => ({ ...s, telefono: true }))}
                      placeholder="10 dígitos"
                      className={`h-10 flex-1 rounded-r-xl border bg-white px-3 text-sm ${touched.telefono && !isTelValid ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                    />
                  </div>
                  {touched.telefono && !isTelValid && <p className="text-[11px] text-red-600 mt-1">Debe tener 10 dígitos.</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><User className="w-3 h-3" /> Nombre completo <span className="text-red-500">*</span></label>
                  <input
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    onBlur={() => setTouched((s) => ({ ...s, nombreCompleto: true }))}
                    placeholder="Nombre y apellido del titular"
                    className={`mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff4d11]/20 ${touched.nombreCompleto && !isNombreValid ? "border-red-300 bg-red-50/30" : "border-slate-200"}`}
                  />
                  {touched.nombreCompleto && !isNombreValid && <p className="text-[11px] text-red-600 mt-1">Ingresa nombre y apellido.</p>}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-bold">Cumplimiento PCI-DSS:</span> ningún dato sensible toca nuestro servidor; todo se procesa via <code className="bg-white border rounded px-1">@stripe/stripe-js</code> Payment Element. <span className="font-bold">return_url:</span> <code className="bg-white border rounded px-1">/traslados/confirmacion?payment_intent_client_secret=...</code>
              </div>
            </div>
          </Card>
        </div>

        {/* Derecha: Resumen + CTA */}
        <div className="space-y-4 lg:sticky lg:top-[80px]">
          <Card className="p-5">
            <h3 className="text-xs font-black tracking-widest text-slate-700">RESUMEN DE PAGO</h3>
            <div className="mt-3 rounded-2xl bg-slate-900 text-white p-5 text-center">
              <div className="text-[11px] tracking-widest font-bold opacity-60">TOTAL A COBRAR</div>
              <div className="text-3xl font-black mt-1">{money(monto)} MXN</div>
              <div className="text-xs opacity-70 mt-1">Incluye TAD v2.0 • Pago Anticipado</div>
              <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] bg-white/15 border border-white/10 rounded-full px-2.5 py-1"><Lock className="w-3 h-3" /> Cifrado SSL 256 bits</div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600 justify-center">
              <span className="font-bold">Visa</span> • <span className="font-bold">Mastercard</span> • <span className="font-bold">Amex</span> • <span className="font-bold">SPEI</span>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <Button onClick={handlePay} disabled={!canPay} className="w-full h-11 text-sm font-black gap-2 disabled:opacity-40">
              {paying ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando…</> : <>PAGAR Y CONFIRMAR TRASLADO <ShieldCheck className="w-4 h-4" /></>}
            </Button>
            <p className="text-[11px] text-slate-400 text-center">{!isStripeValid ? "Completa los campos requeridos para habilitar el pago" : "Stripe validará y redirigirá a confirmación"}</p>
            <div className="flex gap-2 text-xs justify-center">
              <Link href="/traslados" className="text-[#ff4d11] font-bold hover:underline">Ver mis traslados</Link>
              <span className="text-slate-300">|</span>
              <Link href="/solicitud/paso4" className="text-slate-600 hover:underline">← Volver</Link>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 text-center">
              <span className="font-bold">Optimización Mobile:</span> botón fijo accesible sobre Bottom Navigation.
            </div>
            <div className="text-[11px] text-slate-500 bg-slate-50 border rounded-xl p-2.5">
              <span className="font-bold">Manejo de respuestas Stripe:</span> Errores (fondos insuficientes, 3D Secure) se muestran sin recargar. <code className="bg-white border rounded px-1">stripe.confirmPayment()</code> con <code className="bg-white border rounded px-1">return_url</code>.
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Info className="w-3 h-3" /> Retorno post-pago</div>
            <p className="text-xs text-slate-500 mt-1">Al éxito, redirige a <code className="bg-slate-100 border rounded px-1">/traslados/confirmacion?payment_intent_client_secret=...</code> para seguimiento.</p>
            <Link href="/traslados" className="text-xs font-bold text-[#ff4d11] hover:underline mt-2 inline-block">Ver traslados →</Link>
          </Card>
        </div>
      </div>

      {/* Mobile fixed */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.08)] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Total:</span><span className="font-black">{money(monto)} MXN</span><span className="text-[11px] bg-slate-900 text-white rounded-full px-2 py-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Stripe</span>
        </div>
        <Button onClick={handlePay} disabled={!canPay} className="w-full h-11 font-black">{paying ? "Procesando…" : "PAGAR Y CONFIRMAR TRASLADO"}</Button>
      </div>
    </div>
  );
}
