"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PlanId = "starter" | "pro" | "elite";
type Pricing = {
  currency: string; symbol: string;
  plans: Record<PlanId, { original: number; discounted: number }>;
};

const PLAN_CREDITS: Record<PlanId, number> = { starter: 1400, pro: 5000, elite: 10000 };
const PLAN_FEATURES: Record<PlanId, string[]> = {
  starter: ["1,400 credits", "All AI tools", "Image generation", "Script & TTS"],
  pro:     ["5,000 credits", "All AI tools", "Priority generation", "B-Roll videos", "No watermark"],
  elite:   ["10,000 credits", "All AI tools", "Fastest generation", "B-Roll videos", "API access", "Priority support"],
};

function PaymentContent() {
  const router  = useRouter();
  const params  = useSearchParams();
  const planId  = (params.get("plan") ?? "pro") as PlanId;

  const [pricing, setPricing]           = useState<Pricing | null>(null);
  const [finalPrice, setFinalPrice]     = useState(0);
  const [basePrice, setBasePrice]       = useState(0);
  const [email, setEmail]               = useState("");
  const [promoCode, setPromoCode]       = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError]     = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  // Load Razorpay on mount
  useEffect(() => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    fetch("/api/pricing").then(r => r.json()).then(data => {
      const p = data.plans[planId]?.discounted ?? 0;
      setPricing(data);
      setBasePrice(p);
      setFinalPrice(p);
    });
  }, [planId]);

  function applyPromo() {
    const code = promoCode.trim().toUpperCase();
    if (code === "YDTA100" || code === "PRCH100A") {
      setPromoApplied(true);
      setFinalPrice(0);
      setPromoError("");
    } else {
      setPromoApplied(false);
      setFinalPrice(basePrice);
      setPromoError("Invalid code");
    }
  }

  async function handlePay() {
    if (!email.trim()) { setError("Email required"); return; }
    setError("");
    setLoading(true);

    try {
      const res  = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, planId, discountCode: promoApplied ? promoCode.toUpperCase() : null }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
      if (data.free) { router.push("/dashboard"); return; }

      if (!(window as any).Razorpay) {
        setError("Payment system not ready, please refresh and try again");
        setLoading(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: data.key,
        order_id: data.order.id,
        name: "InfiMagen",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
        prefill: { email },
        theme: { color: "#7c3aed" },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (response: any) => {
          const vRes = await fetch("/api/payment/success", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId,
              razorpay_order_id:  response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            }),
          });
          if (vRes.ok) router.push("/dashboard?payment=success");
          else { setError("Verification failed. Contact support."); setLoading(false); }
        },
      });
      rzp.on("payment.failed", (r: any) => {
        setError(r.error?.description ?? "Payment failed");
        setLoading(false);
      });
      rzp.open();

    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  if (!pricing) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  const sym = pricing.symbol;

  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-4 py-10">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <img src="https://lrdwqsllipznxajlyyea.supabase.co/storage/v1/object/public/media-uploads/1000055271-removebg-preview.png" alt="logo" className="w-9 h-9 rounded-full object-cover" />
        <span className="text-white font-bold text-lg">InfiMagen</span>
      </div>

      <div className="w-full max-w-sm space-y-4">

        {/* Plan Card */}
        <div className="bg-[#111] border border-violet-500/30 rounded-2xl p-5 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-indigo-600/5" />
          <div className="relative">
            <span className="inline-block bg-violet-600/20 text-violet-300 text-xs font-semibold px-3 py-1 rounded-full mb-3 capitalize">
              {planId} Plan
            </span>
            <div className="flex items-end justify-center gap-1 mb-1">
              <span className="text-white/40 text-lg line-through">{sym}{pricing.plans[planId].original}</span>
              <span className="text-4xl font-black text-white">{sym}{promoApplied ? 0 : finalPrice.toLocaleString()}</span>
            </div>
            <p className="text-white/40 text-sm mb-4">{PLAN_CREDITS[planId].toLocaleString()} credits</p>
            <div className="space-y-2 text-left">
              {PLAN_FEATURES[planId].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 text-[10px]">✓</span>
                  </div>
                  <span className="text-white/60 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Other plans */}
        <div className="grid grid-cols-2 gap-2">
          {(["starter", "pro", "elite"] as PlanId[]).filter(p => p !== planId).map(p => (
            <a key={p} href={`/payment?plan=${p}`}
              className="bg-[#111] border border-white/8 rounded-xl p-3 text-center hover:border-violet-500/40 transition-all">
              <p className="text-white/50 text-xs font-semibold capitalize mb-0.5">{p}</p>
              <p className="text-white font-bold text-sm">{sym}{pricing.plans[p].discounted}</p>
              <p className="text-white/25 text-xs">{PLAN_CREDITS[p].toLocaleString()} cr</p>
            </a>
          ))}
        </div>

        {/* Promo */}
        <div className="bg-[#111] border border-white/8 rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            <input value={promoCode} onChange={e => setPromoCode(e.target.value)}
              placeholder="Promo code (optional)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50" />
            <button onClick={applyPromo}
              className="bg-white/8 border border-white/10 rounded-xl px-4 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/12 transition-all">
              Apply
            </button>
          </div>
          {promoApplied && <p className="text-emerald-400 text-xs bg-emerald-500/10 rounded-lg px-3 py-2">🎉 100% discount applied — FREE!</p>}
          {promoError && <p className="text-red-400 text-xs">{promoError}</p>}

          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address" type="email"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50" />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button onClick={handlePay} disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 py-4 rounded-2xl font-bold text-base transition-all shadow-lg shadow-violet-500/20">
          {loading ? "Please wait..." : promoApplied ? "Activate Free Plan →" : `Pay ${sym}${finalPrice.toLocaleString()} →`}
        </button>

        <p className="text-center text-xs text-white/20">🔒 Secure payment by Razorpay</p>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
