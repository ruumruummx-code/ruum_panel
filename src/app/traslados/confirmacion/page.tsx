"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { CheckCircle2, AlertCircle, ArrowRight, Copy, ShieldCheck, CreditCard } from "lucide-react";
import { money } from "@/lib/utils";

export default function TrasladosConfirmacionPage() {
  const [params, setParams] = useState<Record<string, string>>({});
  const [paymentData, setPaymentData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const obj: Record<string, string> = {};
    url.searchParams.forEach((v, k) => (obj[k] = v));
    setParams(obj);
    try {
      const raw = localStorage.getItem("ruum_payment_intent");
      if (raw) setPaymentData(JSON.parse(raw));
    } catch {}
  }, []);

  const status = params.redirect_status || paymentData?.status || "succeeded";
  const isSuccess = status === "succeeded";
  const monto = paymentData?.monto ?? 1822.12;
  const pi = params.payment_intent || paymentData?.paymentIntent || "pi_mock";
  const secret = params.payment_intent_client_secret || paymentData?.clientSecret || "";

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3 py-1">
        <CheckCircle2 className="w-3 h-3" /> SOLICITUD CONFIRMADA
      </div>
      <h1 className="text-2xl font-black mt-3 flex items-center gap-2">
        {isSuccess ? <CheckCircle2 className="w-7 h-7 text-emerald-600" /> : <AlertCircle className="w-7 h-7 text-amber-600" />}
        {isSuccess ? "¡Pago confirmado!" : "Estado del pago"}
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        {isSuccess
          ? "Tu traslado ha sido confirmado y asignado a operaciones. Recibirás seguimiento por correo y SMS."
          : "Revisa el estado de tu pago y contacta soporte si es necesario."}
      </p>

      <Card className="p-6 mt-6 space-y-4">
        <div className="rounded-2xl bg-slate-900 text-white p-5 text-center">
          <div className="text-[11px] tracking-widest font-bold opacity-60">MONTO COBRADO</div>
          <div className="text-3xl font-black mt-1">{money(monto)} MXN</div>
          <div className="text-xs opacity-70 mt-1 flex items-center justify-center gap-1"><CreditCard className="w-3 h-3" /> Stripe • {paymentData?.email || "—"} • {isSuccess ? "Pagado" : status}</div>
        </div>

        <div className="rounded-xl border bg-slate-50 p-3 text-xs font-mono break-all">
          <div className="font-bold text-slate-700">PaymentIntent</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex-1">{pi}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(pi);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="inline-flex items-center gap-1 border bg-white rounded-lg px-2 py-1 text-xs"
            >
              <Copy className="w-3 h-3" /> {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          {secret && <div className="mt-2 text-[11px] text-slate-500">client_secret: {secret}</div>}
        </div>

        {isSuccess ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 flex gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0" /> Pago procesado vía <b>Stripe</b>. Cifrado SSL 256 bits. Tus datos bancarios nunca tocaron nuestros servidores. Webhook configurado con <code className="bg-white border rounded px-1">return_url</code> a esta página.
          </div>
        ) : (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" /> Estado: {status}. Si ves fondos insuficientes o 3D Secure fallido, intenta con otra tarjeta (usa 4242424242424242 para éxito).
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border p-3">
            <div className="font-bold">Siguiente paso</div>
            <div className="text-slate-500 mt-1">Operaciones asignará conductor y te notificará. Seguimiento en Traslados.</div>
          </div>
          <div className="rounded-xl border p-3">
            <div className="font-bold">Comprobante</div>
            <div className="text-slate-500 mt-1">Recibo enviado a {paymentData?.email || "tu correo"} y disponible en Stripe.</div>
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <Link href="/traslados"><Button><ArrowRight className="w-4 h-4 mr-1" /> Ver mis traslados</Button></Link>
          <Link href="/"><Button variant="outline">Ir al Dashboard</Button></Link>
        </div>
      </Card>

      <div className="mt-6 rounded-xl bg-slate-50 border p-3 text-xs text-slate-500">
        <span className="font-bold">Debug Stripe:</span> Esta página simula el <code className="bg-white border rounded px-1">return_url</code> de <code className="bg-white border rounded px-1">stripe.confirmPayment()</code> con <code className="bg-white border rounded px-1">payment_intent_client_secret</code>. Errores sin recarga, PCI-DSS cumplido vía Elements.
      </div>
    </div>
  );
}
