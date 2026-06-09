import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CREDIT_COSTS } from "@/lib/creditCosts";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const supabase = createClient();
  let userId: string | null = null;
  let deducted = false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;

    const { mode, prompt, imageUrl, motionPreset = "auto", duration = 5 } = await req.json();

    if (mode === "text" && !prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    if (mode === "image" && !imageUrl) return NextResponse.json({ error: "Image required" }, { status: 400 });

    const cost = CREDIT_COSTS.VIDEO_PLAN;
    const { error: deductErr } = await supabaseAdmin.rpc("deduct_credits", {
      p_user_id: userId, p_amount: cost, p_reason: "video_generation", p_meta: { mode, prompt },
    });
    if (deductErr) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    deducted = true;

    const falModel = mode === "image"
      ? "fal-ai/wan/v2.1/image-to-video"
      : "fal-ai/wan/v2.1/text-to-video";

    const falBody = mode === "image"
      ? {
          image_url: imageUrl,
          prompt: prompt || "cinematic smooth motion",
          num_frames: duration * 16,
          motion_strength: motionPreset === "strong" ? 0.9 : motionPreset === "subtle" ? 0.3 : 0.6,
        }
      : {
          prompt,
          num_frames: duration * 16,
          guidance_scale: 7.5,
        };

    const falRes = await fetch(`https://fal.run/${falModel}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Key ${process.env.FAL_API_KEY}`,
      },
      body: JSON.stringify(falBody),
    });

    if (!falRes.ok) throw new Error("fal.ai error: " + await falRes.text());

    const falData = await falRes.json();
    const videoUrl = falData.video?.url ?? falData.video_url ?? falData.url;
    if (!videoUrl) throw new Error("No video URL returned");

    return NextResponse.json({ videoUrl });

  } catch (err: any) {
    if (userId && deducted) {
      await supabaseAdmin.rpc("deduct_credits", {
        p_user_id: userId, p_amount: -CREDIT_COSTS.VIDEO_PLAN,
        p_reason: "refund_video_failed", p_meta: {},
      }).catch(() => {});
    }
    return NextResponse.json({ error: err.message || "Video generation failed" }, { status: 500 });
  }
}
