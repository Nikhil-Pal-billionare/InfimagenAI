import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  const imageUrl = formData.get("url") as string | null;

  if (!file && !imageUrl) {
    return NextResponse.json({ error: "Image or URL required" }, { status: 400 });
  }

  // Deduct 10 credits
  const { error: deductErr } = await supabaseAdmin.rpc("deduct_credits", {
    p_user_id: user.id, p_amount: 10,
    p_reason: "bg_removal", p_meta: {},
  });
  if (deductErr) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });

  try {
    const bgFormData = new FormData();
    bgFormData.append("size", "auto");

    if (file) {
      bgFormData.append("image_file", file);
    } else {
      bgFormData.append("image_url", imageUrl!);
    }

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": process.env.REMOVE_BG_API_KEY! },
      body: bgFormData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.errors?.[0]?.title ?? "Remove.bg failed");
    }

    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    return new Response(bytes, {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(bytes.length),
      },
    });

  } catch (err: any) {
    // Refund
    await supabaseAdmin.rpc("deduct_credits", {
      p_user_id: user.id, p_amount: -10,
      p_reason: "refund_bg_removal_failed", p_meta: {},
    });
    return NextResponse.json({ error: err.message || "BG removal failed" }, { status: 500 });
  }
}
