import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CREDIT_COSTS } from "@/lib/creditCosts";
import { ensureDailyFreeCredits } from "@/lib/freeCredits";
import { GoogleGenAI } from "@google/genai";
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureDailyFreeCredits(user.id);
  const { topic, format = "YouTube Video", tone = "Educational", duration = "3 minutes" } = await req.json();
  if (!topic) return NextResponse.json({ error: "Topic required" }, { status: 400 });
  if (process.env.TESTER_MODE !== "true") {
    const { error } = await supabaseAdmin.rpc("deduct_credits", {
      p_user_id: user.id, p_amount: CREDIT_COSTS.SCRIPT_GENERATION, p_reason: "script_generation",
    });
    if (error) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }
  const prompt = `Write a ${duration} ${format} script about: "${topic}"\nTone: ${tone}\n\nInclude: hook, main content, CTA. Return only the script.`;
  const response = await genAI.models.generateContent({ model: "gemini-2.0-flash", contents: [{ role: "user", parts: [{ text: prompt }] }] });
  return NextResponse.json({ script: response.text ?? "" });
}
