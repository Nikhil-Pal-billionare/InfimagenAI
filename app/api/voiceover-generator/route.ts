import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { CREDIT_COSTS } from "@/lib/creditCosts";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text, voice = "alloy", provider = "google" } = await req.json();
  if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

  const wordCount = text.trim().split(/\s+/).length;
  const minutes   = Math.ceil(wordCount / 150);
  const cost      = CREDIT_COSTS.VOICEOVER_PER_MIN * minutes;

  const { error: deductErr } = await supabaseAdmin.rpc("deduct_credits", {
    p_user_id: user.id, p_amount: cost,
    p_reason: "voiceover_generation", p_meta: { voice, words: wordCount, provider },
  });
  if (deductErr) return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });

  try {
    let audioBuffer: Buffer;

    if (provider === "elevenlabs") {
      // ── ElevenLabs ──
      const voiceMap: Record<string, string> = {
        alloy:   "21m00Tcm4TlvDq8ikWAM",  // Rachel
        echo:    "AZnzlk1XvdvUeBnXmlld",  // Domi
        fable:   "EXAVITQu4vr4xnSDxMaL",  // Bella
        onyx:    "ErXwobaYiN019PkySvjV",  // Antoni
        nova:    "MF3mGyEYCl7XYWbV9V6O",  // Elli
        shimmer: "ThT5KcBeYPX3keUQqHPh",  // Dorothy
      };
      const elevenVoiceId = voiceMap[voice] ?? voiceMap["alloy"];

      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY!,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        }
      );
      if (!res.ok) throw new Error("ElevenLabs error: " + await res.text());
      audioBuffer = Buffer.from(await res.arrayBuffer());

    } else {
      // ── Google Cloud TTS ──
      const googleVoiceMap: Record<string, string> = {
        alloy:   "en-US-Wavenet-D",
        echo:    "en-US-Wavenet-A",
        fable:   "en-US-Wavenet-B",
        onyx:    "en-US-Wavenet-C",
        nova:    "en-US-Wavenet-F",
        shimmer: "en-US-Wavenet-E",
      };
      const googleVoice = googleVoiceMap[voice] ?? "en-US-Wavenet-D";

      const res = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: "en-US", name: googleVoice },
            audioConfig: { audioEncoding: "MP3" },
          }),
        }
      );
      if (!res.ok) throw new Error("Google TTS error: " + await res.text());
      const data = await res.json();
      audioBuffer = Buffer.from(data.audioContent, "base64");
    }

    return new Response(audioBuffer.buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
      },
    });

  } catch (err: any) {
    // Refund credits
    await supabaseAdmin.rpc("deduct_credits", {
      p_user_id: user.id, p_amount: -cost,
      p_reason: "refund_tts_failed", p_meta: { error: err.message },
    });
    return NextResponse.json({ error: err.message || "TTS failed" }, { status: 500 });
  }
}
