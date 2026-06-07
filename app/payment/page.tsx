"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function InfiLogo() {
  return (
    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
      <span className="text-white text-2xl font-black">I</span>
    </div>
  );
}

type Pricing = {
  currency: string;
  symbol: string;
  plans: Record<"starter" | "pro" | "elite", { original: number; discounted: number }>;
};

const PLAN_CREDITS = { starter: 1600, pro: 2800, elite: 5800 };

function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = (params.get("plan") ?? "starter") as "starter" | "pro" | "elite";

  const [pricing, setPricing]       = useState<Pricing | null>(null);
  const [basePrice, setBasePrice]   = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [email, setEmail]           = useState("");
  const [promoCode, setPromoCode]   = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // Load Razorpay script on mount
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => {
        const price = data.plans[planId]?.discounted ?? 0;
        setPricing(data);
        setBasePrice(price);
        setFinalPrice(price);
      });
  }, [planId]);

  function applyPromo() {
    if (!pricing) return;
    const code = promoCode.trim().toUpperCase();
    if (code === "YDTA100" || code === "PRCH100A") {
      setAppliedPromo(code);
      setFinalPrice(0);
      setError("");
      return;
    }
    setAppliedPromo(null);
    setFinalPrice(basePrice);
    setError("Invalid promotion code");
  }

  async function handlePayment() {
    if (!email) { setError("Email required"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, planId, discountCode: appliedPromo }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Order creation failed");
        setLoading(false);
        return;
      }

      // Free plan
      if (data.free) {
        router.push("/dashboard");
        return;
      }

      // Razorpay available check
      if (!(window as any).Razorpay) {
        setError("Payment system loading, please try again in a moment");
        setLoading(false);
        return;
      }

      const rzp = new (window as any).Razorpay({
        key: data.key,
        order_id: data.order.id,
        name: "InfiMagen",
        description: `${planId} Plan — ${PLAN_CREDITS[planId]} credits`,
        prefill: { email },
        theme: { color: "#7c3aed" },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        },
        handler: async (response: any) => {
          const verifyRes = await fetch("/api/payments/success", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            router.push("/dashboard");
          } else {
            setError("Payment verification failed. Contact support.");
            setLoading(false);
          }
        },
      });

      rzp.on("payment.failed", (response: any) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzp.open();

    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  }

  if (!pricing) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111] border border-white/7 rounded-2xl p-8 space-y-6 text-white">

        <div className="text-center space-y-3">
          <InfiLogo />
          <h1 className="text-2xl font-bold">Complete Payment</h1>
        </div>

        {/* Plan box */}
        <div className="bg-[#181818] border border-white/5 rounded-xl p-5 text-center">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Selected Plan</p>
          <p className="text-lg font-bold capitalize">{planId}</p>
          <p className="text-3xl font-extrabold mt-1">
            {pricing.symbol}{finalPrice.toLocaleString()}
          </p>
          <p className="text-xs text-white/30 mt-1">{PLAN_CREDITS[planId].toLocaleString()} credits</p>
        </div>

        {/* Promo */}
        <div className="space-y-2">
          <label className="text-xs text-white/40 font-medium uppercase tracking-wider">Promo Code</label>
          <div className="flex gap-2">
            <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code..."
              className="flex-1 bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/40" />
            <button onClick={applyPromo}
              className="px-4 bg-white/6 border border-white/8 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all">
              Apply
            </button>
          </div>
          {appliedPromo && (
            <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              🎉 100% discount — Plan is FREE!
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-xs text-white/40 font-medium uppercase tracking-wider">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" type="email"
            className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/40" />
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button onClick={handlePayment} disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-base transition-all">
          {loading
            ? "Opening payment..."
            : finalPrice === 0
            ? "Activate Free Plan"
            : `Pay ${pricing.symbol}${finalPrice.toLocaleString()}`}
        </button>

        <p className="text-xs text-white/20 text-center">🔒 Payments securely processed by Razorpay</p>
      </div>
    </main>
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
