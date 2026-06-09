"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";

const MOTION_PRESETS = [
  { id: "auto",   label: "Auto",        icon: "✨", desc: "AI decides best motion" },
  { id: "subtle", label: "Subtle",      icon: "🌊", desc: "Gentle, smooth movement" },
  { id: "strong", label: "Dynamic",     icon: "⚡", desc: "Strong dramatic motion" },
];

const DURATION_OPTIONS = [3, 5, 8];

export default function VideoPage() {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode]               = useState<"text" | "image">("text");
  const [prompt, setPrompt]           = useState("");
  const [imageUrl, setImageUrl]       = useState<string | null>(null);
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [motionPreset, setMotionPreset] = useState("auto");
  const [duration, setDuration]       = useState(5);
  const [loading, setLoading]         = useState(false);
  const [progress, setProgress]       = useState(0);
  const [result, setResult]           = useState<string | null>(null);
  const [error, setError]             = useState("");

  async function uploadImage(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not logged in");
    const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
    const fileName = `${user.id}/video-input-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabaseAdmin.storage
      .from("media-uploads")
      .upload(fileName, file, { contentType: file.type });
    if (error) throw new Error("Upload failed");
    const { data } = supabaseAdmin.storage.from("media-uploads").getPublicUrl(fileName);
    return data.publicUrl;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMode("image");
  }

  async function generate() {
    if (loading) return;
    if (mode === "text" && !prompt.trim()) { setError("Prompt required"); return; }
    if (mode === "image" && !imageFile && !imageUrl) { setError("Image required"); return; }

    setLoading(true);
    setError("");
    setResult(null);
    setProgress(0);

    // Progress simulation
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 8, 85));
    }, 2000);

    try {
      let finalImageUrl = imageUrl;
      if (mode === "image" && imageFile) {
        setProgress(10);
        finalImageUrl = await uploadImage(imageFile);
      }

      const res = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, prompt, imageUrl: finalImageUrl, motionPreset, duration }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed"); return; }

      clearInterval(interval);
      setProgress(100);
      setResult(data.videoUrl);

    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🎬</span>
          <h1 className="text-2xl font-black text-white">AI Video Generator</h1>
        </div>
        <p className="text-sm text-white/30 ml-11">Wan 2.1 — Text to Video & Image to Video</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">

        {/* ── LEFT ── */}
        <div className="space-y-4">

          {/* Mode tabs */}
          <div className="flex bg-white/5 rounded-2xl p-1 gap-1">
            {([
              { id: "text",  label: "Text to Video",  icon: "📝" },
              { id: "image", label: "Image to Video", icon: "🖼️" },
            ] as const).map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode === m.id ? "bg-violet-600 text-white shadow-lg" : "text-white/40 hover:text-white/70"}`}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Prompt */}
          <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                {mode === "text" ? "Describe your video" : "Describe the motion (optional)"}
              </label>
            </div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === "text"
                ? "A cinematic shot of mountains at golden hour, slow camera pan..."
                : "Camera slowly zooms in, gentle wind effect..."}
              rows={4}
              className="w-full bg-transparent px-4 pb-4 text-sm text-white placeholder-white/20 outline-none resize-none leading-relaxed" />
          </div>

          {/* Image upload (image mode) */}
          {mode === "image" && (
            <div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-white/8">
                  <img src={imagePreview} alt="Input" className="w-full h-48 object-cover" />
                  <button onClick={() => { setImagePreview(null); setImageFile(null); setImageUrl(null); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white/60 hover:text-white">
                    ×
                  </button>
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                    {imageFile?.name}
                  </div>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-white/15 rounded-2xl p-8 text-center hover:border-violet-500/50 hover:bg-violet-500/5 transition-all">
                  <div className="text-3xl mb-3">🖼️</div>
                  <p className="text-sm text-white/50 font-medium">Click to upload image</p>
                  <p className="text-xs text-white/20 mt-1">JPG, PNG, WEBP — max 10MB</p>
                </button>
              )}
            </div>
          )}

          {/* Motion Presets */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Motion Style</p>
            <div className="grid grid-cols-3 gap-2">
              {MOTION_PRESETS.map((preset) => (
                <button key={preset.id} onClick={() => setMotionPreset(preset.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${motionPreset === preset.id ? "bg-violet-600/20 border-violet-500/40 text-white" : "bg-white/3 border-white/8 text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
                  <div className="text-lg mb-1">{preset.icon}</div>
                  <div className="text-xs font-semibold">{preset.label}</div>
                  <div className="text-[10px] text-white/30 mt-0.5 leading-tight">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Duration</p>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${duration === d ? "bg-violet-600/20 border-violet-500/40 text-white" : "bg-white/3 border-white/8 text-white/40 hover:text-white/70"}`}>
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all text-base flex items-center justify-center gap-2">
            {loading ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating… ({Math.round(progress)}%)</>
            ) : "🎬 Generate Video"}
          </button>

          {/* Progress bar */}
          {loading && (
            <div className="space-y-2">
              <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-white/30 text-center">
                Video ban rahi hai… usually 30–90 seconds lagta hai
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* ── RIGHT — Preview ── */}
        <div className="space-y-4">
          <p className="text-xs text-white/25 uppercase tracking-wider">Preview</p>

          <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden aspect-video flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-xl">🎬</div>
                </div>
                <p className="text-sm text-white/40">Wan 2.1 working…</p>
                <p className="text-xs text-white/20">{Math.round(progress)}% complete</p>
              </div>
            ) : result ? (
              <video src={result} controls autoPlay loop className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <div className="text-4xl mb-3 opacity-20">🎬</div>
                <p className="text-sm text-white/20">Video preview yahan aayega</p>
                <p className="text-xs text-white/10 mt-1">Generate karo dekhne ke liye</p>
              </div>
            )}
          </div>

          {result && (
            <div className="bg-[#111] border border-white/5 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50 font-medium">Video ready! 🎉</p>
                <p className="text-xs text-white/20">Wan 2.1 · MP4</p>
              </div>
              <a href={result} download="infimagen-video.mp4" target="_blank"
                className="text-xs bg-violet-600/80 hover:bg-violet-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors">
                ↓ Download
              </a>
            </div>
          )}

          {/* Credits info */}
          <div className="bg-white/3 border border-white/6 rounded-xl p-3">
            <p className="text-xs text-white/30 font-semibold mb-1.5">Credits used per video:</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/20">Wan 2.1 ({duration}s)</span>
              <span className="text-xs text-white/50 font-bold">52 credits</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
