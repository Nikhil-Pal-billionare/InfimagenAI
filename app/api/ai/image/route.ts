import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CREDIT_COSTS } from "@/lib/creditCosts";
import { ensureDailyFreeCredits } from "@/lib/freeCredits";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
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

    const { prompt, aspectRatio = "1:1", isPublic = true } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    // Credits deduct
    const { error: deductErr } = await supabaseAdmin.rpc("deduct_credits", {
      p_user_id: userId, p_amount: CREDIT_COSTS.TEXT_TO_IMAGE,
      p_reason: "image_generation", p_meta: { prompt },
    });
    if (deductErr) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    deducted = true;

    // Generate image
    const response = await genAI.models.generateImages({
      model: "imagen-4.0-generate-001", prompt,
      config: { numberOfImages: 1, aspectRatio },
    });
    const imageBase64 = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBase64) throw new Error("No image returned");

    // Base64 → Buffer → Supabase Storage mein upload
    const buffer = Buffer.from(imageBase64, "base64");
    const fileName = `${userId}/${Date.now()}.png`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("media-uploads")
      .upload(fileName, buffer, { contentType: "image/png", upsert: false });

    if (uploadErr) throw new Error("Upload failed: " + uploadErr.message);

    // Public URL banao
    const { data: urlData } = supabaseAdmin.storage
      .from("media-uploads")
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // Generations table mein save karo
    await supabaseAdmin.from("generations").insert({
      user_id: userId,
      image_url: imageUrl,
      prompt,
      is_public: isPublic,
    });

    return NextResponse.json({ imageBase64, imageUrl, mimeType: "image/png" });

  } catch (err: any) {
    if (userId && deducted) {
      try {
  await supabaseAdmin.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: -CREDIT_COSTS.TEXT_TO_IMAGE,
    p_reason: "refund_image_failed",
    p_meta: {},
  });
} catch {}
    }
    return NextResponse.json({ error: err.message || "Image generation failed" }, { status: 500 });
  }
}

