import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { PLAN_CREDITS, PlanId } from "@/lib/planCredits";
import { PRICING } from "@/lib/pricing";
export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { email, planId, discountCode } = await req.json();
    if (!email || !planId || !["starter", "pro", "elite"].includes(planId))
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const h = headers();
    const country = h.get("cf-ipcountry") || h.get("x-vercel-ip-country") || "US";
    const pricing = country === "IN" ? PRICING.INR : PRICING.USD;
    const safePlan = planId as PlanId;
    let finalAmount = pricing.plans[safePlan].discounted;
    if (discountCode === "YDTA100" || discountCode === "PRCH100A") finalAmount = 0;
    if (finalAmount === 0) {
      await supabaseAdmin.from("subscriptions").insert({ user_id: user.id, plan_name: safePlan, credits_granted: PLAN_CREDITS[safePlan], status: "active", start_date: new Date().toISOString() });
      await supabaseAdmin.from("payments").insert({ user_id: user.id, amount: 0, currency: pricing.currency, provider: "promo", status: "success" });
      await supabaseAdmin.rpc("add_credits", { p_user_id: user.id, p_amount: PLAN_CREDITS[safePlan], p_reason: "plan_purchase", p_meta: { plan: safePlan, source: "promo" } });
      return NextResponse.json({ free: true, plan: safePlan, credits: PLAN_CREDITS[safePlan] });
    }
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: process.env.RAZORPAY_KEY_SECRET! });
    const order = await razorpay.orders.create({ amount: Math.round(finalAmount * 100), currency: pricing.currency, receipt: `infimagen-${safePlan}-${Date.now()}` });
    return NextResponse.json({ free: false, order, key: process.env.RAZORPAY_KEY_ID, credits: PLAN_CREDITS[safePlan] });
  } catch (err) { return NextResponse.json({ error: "Order creation failed" }, { status: 500 }); }
}
