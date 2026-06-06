import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CREDIT_COSTS } from "@/lib/creditCosts";
import { searchPexelsVideos } from "@/lib/pexels";
import { generateContent } from "@/lib/gemini";
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { description } = await req.json();
  if (!description) return NextResponse.json({ error: "Description required" }, { status: 400 });
  const { error } = await supabaseAdmin.rpc("deduct_credits", {
    p_user_id: user.id, p_amount: CREDIT_COSTS.BROLL_GENERATION, p_reason: "broll_generation",
  });
  if (error) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  const text = await generateContent(`Convert this into 4 short B-roll search queries (6-8 words each, visual only). Return JSON array only:\n"${description}"`);
  let scenes: string[] = [];
  try { scenes = JSON.parse(text.replace(/```json|```/g, "").trim()); } catch { scenes = [description]; }
  const clips = (await Promise.all(scenes.slice(0, 4).map((s) => searchPexelsVideos(s, 2)))).flat();
  return NextResponse.json({ clips, scenes });
}
