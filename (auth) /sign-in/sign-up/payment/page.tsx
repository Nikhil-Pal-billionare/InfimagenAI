"use client";

import { useEffect, useState, Suspense } from "react"; // ✅ Added Suspense
import { useRouter, useSearchParams } from "next/navigation";
import FoxgenLogo from "@/components/branding/FoxgenLogo";

type Pricing = {
  currency: string;
  symbol: string;
  plans: Record<
    "starter" | "pro" | "elite",
    { original: number; discounted: number }
  >;
};

// --- 1. Create a logic component ---
function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("plan") as "starter" | "pro" | "elite";

  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [basePrice, setBasePrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);

  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((data) => {
        // Fallback agar planId na mile
        const selectedPlan = planId || "starter";
        const price = data.plans[selectedPlan].discounted;
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
    if (code === "AVT100") {
      const discounted =
        pricing.currency === "INR"
          ? Math.max(basePrice - 100, 0)
          : Math.max(basePrice - 2, 0);

      setAppliedPromo(code);
      setFinalPrice(discounted);
      setError("");
      return;
    }
    setAppliedPromo(null);
    setFinalPrice(basePrice);
    setError("Invalid promotion code");
  }

  async function handlePayment() {
    if (!email) return setError("Email required");
    setLoading(true);
    setError("");

    const res = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        planId,
        discountCode: appliedPromo,
      }),
    });

    const data = await res.json();

    if (data.free) {
      router.push("/dashboard");
      return;
    }

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    await new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = resolve;
      document.body.appendChild(s);
    });

    const rzp = new (window as any).Razorpay({
      key: data.key_id,
      order_id: data.order.id,
      name: `Foxgen – ${data.planName}`,
      prefill: { email },
      handler: () => router.push("/dashboard"),
      theme: { color: "#C1272D" },
    });

    rzp.open();
    setLoading(false);
  }

  if (!pricing) return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-white">
      Loading payment details...
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
      <div className="w-full max-w-md bg-[#121212] border border-gray-800 rounded-xl p-8 space-y-6 text-white">
        <div className="text-center">
          <FoxgenLogo size={80} />
          <h1 className="text-2xl font-bold mt-4">Complete Payment</h1>
        </div>

        <div className="bg-[#1A1A1A] p-4 rounded text-center">
          <p className="text-sm text-gray-400">Selected Plan</p>
          <p className="text-xl font-bold capitalize">{planId || "Starter"}</p>
          <p className="text-2xl font-extrabold text-[#C1272D] mt-2">
            {pricing.symbol}
            {finalPrice}
            <span className="text-sm text-gray-400"> </span>
          </p>
        </div>

        <div>
          <label className="text-sm text-gray-400">Add promotion code</label>
          <div className="flex gap-2 mt-1">
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 bg-black border border-gray-700 rounded px-3 py-2 text-white"
            />
            <button
              onClick={applyPromo}
              className="px-4 border border-gray-600 rounded hover:bg-gray-800"
            >
              Apply
            </button>
          </div>

          {appliedPromo && (
            <p className="text-green-400 text-sm mt-1">
              🎉 {(appliedPromo === "YDTA100" || appliedPromo === "PRCH100A")
                ? "100% discount applied"
                : "Discount applied"}
            </p>
          )}
        </div>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-red-600 py-3 rounded font-semibold transition-opacity disabled:opacity-50"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          Payments are securely processed by Razorpay
        </p>
      </div>
    </main>
  );
}

// --- 2. Main Export with Suspense ---
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-white">
        Loading...
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
