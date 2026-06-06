import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CREDIT_COSTS } from "@/lib/creditCosts";
import { ensureDailyFreeCredits } from "@/lib/freeCredits";
import { GoogleGenAI } from "@google/genai";
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
export async function POST(req: Request) {
  const supabase = createClient();
  let userId: string | null = null;
  let deducted = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;
    await ensureDailyFreeCredits(userId);
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    const { error: deductErr } = await supabaseAdmin.rpc("deduct_credits", {
      p_user_id: userId, p_amount: CREDIT_COSTS.THUMBNAIL_GENERATION, p_reason: "thumbnail_generation", p_meta: { prompt },
    });
    if (deductErr) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    deducted = true;
    const response = await genAI.models.generateImages({
      model: "imagen-4.0-generate-001", prompt, config: { aspectRatio: "16:9", numberOfImages: 1 },
    });
    const imageBase64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBase64) throw new Error("No image returned");
    return NextResponse.json({ imageBase64, mimeType: "image/png" });
  } catch (err: any) {
    if (userId && deducted) {
      await supabaseAdmin.rpc("deduct_credits", { p_user_id: userId, p_amount: -CREDIT_COSTS.THUMBNAIL_GENERATION, p_reason: "refund_thumbnail_failed", p_meta: {} }).catch(() => {});
    }
    return NextResponse.json({ error: err.message || "Thumbnail failed" }, { status: 500 });
  }
}
