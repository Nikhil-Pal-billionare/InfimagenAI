"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const FORMATS  = ["YouTube Video", "YouTube Shorts", "Instagram Reel", "Podcast", "Blog Post"];
const TONES    = ["Educational", "Entertaining", "Inspirational", "Professional", "Casual", "Funny"];
const DURATIONS = ["30 seconds", "1 minute", "3 minutes", "5 minutes", "10 minutes"];

export default function ScriptPage() {
  const supabase = createClient();
  const [topic, setTopic]       = useState("");
  const [format, setFormat]     = useState("YouTube Video");
  const [tone, setTone]         = useState("Educational");
  const [duration, setDuration] = useState("3 minutes");
  const [loading, setLoading]   = useState(false);
  const [script, setScript]     = useState("");
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);

  async function generate() {
    if (!topic.trim() || loading) return;
    setLoading(true);
    setError("");
    setScript("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Not logged in"); return; }

      /* 🔥 Calls Gemini via deduct credits — same backend pattern */
      const res = await fetch("/api/script-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ topic, format, tone, duration }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? "Script generation failed"); return; }
      setScript(data.script ?? "");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const TOPIC_EXAMPLES = [
    "How to grow on YouTube in 2025",
    "10 morning habits that changed my life",
    "Why AI will replace most jobs",
    "The best budget travel tips",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">📝</span>
          <h1 className="text-2xl font-black text-white">Script Generator</h1>
        </div>
        <p className="text-sm text-white/30 ml-11">AI-written scripts for any platform and format</p>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* Left — Settings */}
        <div className="space-y-4">
          {/* Topic */}
          <div className="bg-[#111] border border-white/8 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-white/30 uppercase tracking-wider">Topic / Title</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What is your video about?"
              className="w-full bg-white/5 border border-white/8 focus:border-violet-500/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors"
            />
            <div className="flex flex-wrap gap-1.5">
              {TOPIC_EXAMPLES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="text-xs bg-white/5 hover:bg-white/10 border border-white/8 text-white/35 hover:text-white/70 px-2.5 py-1 rounded-lg transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="bg-[#111] border border-white/8 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-white/30 uppercase tracking-wider">Format</label>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`text-xs py-2.5 px-3 rounded-xl border transition-all text-left ${
                    format === f
                      ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
                      : "bg-white/3 border-white/8 text-white/40 hover:text-white/70 hover:bg-white/8"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div className="bg-[#111] border border-white/8 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-white/30 uppercase tracking-wider">Tone</label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`text-xs py-2 px-2 rounded-xl border transition-all ${
                    tone === t
                      ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                      : "bg-white/3 border-white/8 text-white/40 hover:text-white/70 hover:bg-white/8"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="bg-[#111] border border-white/8 rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-white/30 uppercase tracking-wider">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`text-xs py-2 px-3 rounded-xl border transition-all ${
                    duration === d
                      ? "bg-amber-600/20 border-amber-500/40 text-amber-300"
                      : "bg-white/3 border-white/8 text-white/40 hover:text-white/70 hover:bg-white/8"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Writing script…
              </>
            ) : "✦ Generate Script"}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Right — Output */}
        <div className="bg-[#111] border border-white/8 rounded-2xl flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <div>
              <span className="text-sm font-semibold text-white/60">Generated Script</span>
              {script && (
                <span className="ml-2 text-xs text-white/20">
                  {script.length} chars · ~{Math.ceil(script.split(" ").length / 150)} min read
                </span>
              )}
            </div>
            {script && (
              <button
                onClick={copy}
                className="text-xs bg-white/8 hover:bg-white/15 border border-white/10 text-white/50 hover:text-white px-3 py-1.5 rounded-lg transition-all"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            )}
          </div>
          <div className="flex-1 p-5 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  <p className="text-sm text-white/30">Writing your script…</p>
                </div>
              </div>
            ) : script ? (
              <pre className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed font-sans">
                {script}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <div className="text-4xl opacity-20">📝</div>
                <p className="text-sm text-white/20">Your script will appear here</p>
                <p className="text-xs text-white/10">Fill in the details and click Generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
        }
