"use client";

import { useState, useRef } from "react";

export default function RemoveBgPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<string | null>(null);
  const [result, setResult]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [dragOver, setDragOver]   = useState(false);

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) { setError("Sirf image files allowed hain"); return; }
    if (f.size > 12 * 1024 * 1024) { setError("Image 12MB se chhoti honi chahiye"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function removeBackground() {
    if (!file || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed");
        return;
      }

      const blob = await res.blob();
      setResult(URL.createObjectURL(blob));

    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">✂️</span>
          <h1 className="text-2xl font-black text-white">Background Remover</h1>
        </div>
        <p className="text-sm text-white/30 ml-11">Remove background from any image instantly · 10 credits</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Left — Upload */}
        <div className="space-y-4">
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

          {!preview ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver ? "border-violet-500 bg-violet-500/10" : "border-white/15 hover:border-violet-500/50 hover:bg-white/3"}`}>
              <div className="text-5xl mb-4">🖼️</div>
              <p className="text-white/60 font-semibold mb-1">Click ya drag karo image yahan</p>
              <p className="text-white/25 text-sm">JPG, PNG, WEBP · max 12MB</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-white/8">
                <img src={preview} alt="Original" className="w-full h-auto" />
                <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
                  Original
                </div>
                <button onClick={reset}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white/60 hover:text-white text-lg">
                  ×
                </button>
              </div>
            </div>
          )}

          {preview && (
            <button onClick={removeBackground} disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Removing background…</>
              ) : "✂️ Remove Background"}
            </button>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Credits info */}
          <div className="bg-white/3 border border-white/5 rounded-xl p-3.5">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-2">Credits</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">Per image</span>
              <span className="text-xs text-violet-400 font-bold">10 credits</span>
            </div>
          </div>
        </div>

        {/* Right — Result */}
        <div className="space-y-3">
          <p className="text-xs text-white/25 uppercase tracking-wider">Result</p>

          <div className="rounded-2xl overflow-hidden border border-white/8 min-h-[300px] flex items-center justify-center"
            style={{ background: "repeating-conic-gradient(#1a1a1a 0% 25%, #111 0% 50%) 0 0 / 20px 20px" }}>
            {loading ? (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-white/30">Background remove ho raha hai…</p>
              </div>
            ) : result ? (
              <img src={result} alt="Result" className="w-full h-auto" />
            ) : (
              <div className="text-center p-8">
                <div className="text-4xl mb-3 opacity-20">✂️</div>
                <p className="text-sm text-white/15">Background removed image yahan aayegi</p>
              </div>
            )}
          </div>

          {result && (
            <a href={result} download="removed-bg.png"
              className="flex items-center justify-center gap-2 w-full bg-violet-600/80 hover:bg-violet-600 text-white font-semibold py-3 rounded-xl transition-all text-sm">
              ↓ Download PNG
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
