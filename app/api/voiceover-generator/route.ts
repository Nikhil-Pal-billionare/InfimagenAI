import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CREDIT_COSTS } from "@/lib/creditCosts";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, voice = "alloy" } = await req.json();
  if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

  const wordCount = text.trim().split(/\s+/).length;
  const minutes   = Math.ceil(wordCount / 150);
  const cost      = CREDIT_COSTS.VOICEOVER_PER_MIN * minutes;

  const { error } = await supabaseAdmin.rpc("deduct_credits", {
    p_user_id: user.id, p_amount: cost,
    p_reason: "voiceover_generation", p_meta: { voice, words: wordCount },
  });
  if (error) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });

  const googleVoiceMap: Record<string, string> = {
    alloy:   "en-US-Wavenet-D",
    echo:    "en-US-Wavenet-A",
    fable:   "en-US-Wavenet-B",
    onyx:    "en-US-Wavenet-C",
    nova:    "en-US-Wavenet-F",
    shimmer: "en-US-Wavenet-E",
  };

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "en-US", name: googleVoiceMap[voice] ?? "en-US-Wavenet-D" },
        audioConfig: { audioEncoding: "MP3" },
      }),
    }
  );

  if (!res.ok) {
    await supabaseAdmin.rpc("deduct_credits", {
      p_user_id: user.id, p_amount: -cost,
      p_reason: "refund_tts_failed", p_meta: {},
    });
    return NextResponse.json({ error: "TTS generation failed" }, { status: 500 });
  }

  const data = await res.json();
  const audioBase64 = data.audioContent as string;
  const binaryStr = atob(audioBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  return new Response(bytes, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(bytes.length),
    },
  });
}
