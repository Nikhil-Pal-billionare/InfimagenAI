"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type CommunityImage = {
  id: string;
  image_url: string;
  prompt: string;
  title: string;
  is_free: boolean;
  likes: number;
  total_count: number;
};

function ImageTool() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [prompt, setPrompt]     = useState(searchParams.get("prompt") ?? "");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<{ imageBase64: string; mimeType: string } | null>(null);
  const [error, setError]       = useState("");
  const [history, setHistory]   = useState<{ src: string; prompt: string }[]>([]);

  // Community images state
  const [images, setImages]         = useState<CommunityImage[]>([]);
  const [isPaid, setIsPaid]         = useState(false);
  const [userId, setUserId]         = useState<string | null>(null);
  const [likedIds, setLikedIds]     = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<CommunityImage | null>(null);
  const [showProPopup, setShowProPopup]   = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: sub } = await supabase
        .from("subscriptions").select("id")
        .eq("user_id", user.id).eq("status", "active").maybeSingle();
      setIsPaid(!!sub);

      const { data: imgs } = await supabase
        .from("community_images")
        .select("id, image_url, prompt, title, is_free, likes, total_count")
        .eq("is_public", true).eq("active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setImages(imgs ?? []);

      if (imgs?.length) {
        const { data: liked } = await supabase
          .from("image_likes").select("image_id").eq("user_id", user.id);
        setLikedIds(new Set(liked?.map((l: any) => l.image_id) ?? []));
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res  = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed"); return; }
      setResult(data);
      setHistory((prev) => [{ src: `data:${data.mimeType};base64,${data.imageBase64}`, prompt }, ...prev.slice(0, 5)]);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleImageClick(img: CommunityImage) {
    if (!img.is_free && !isPaid) { setShowProPopup(true); return; }
    setSelectedImage(img);
    setCopied(false);
  }

  async function handleLike(e: React.MouseEvent, imageId: string) {
    e.stopPropagation();
    if (!userId) return;
    const res  = await fetch("/api/community/like", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    const data = await res.json();
    setLikedIds(prev => { const n = new Set(prev); data.liked ? n.add(imageId) : n.delete(imageId); return n; });
    setImages(prev => prev.map(img => img.id === imageId ? { ...img, likes: img.likes + (data.liked ? 1 : -1) } : img));
  }

  async function handleCopy() {
    if (!selectedImage) return;
    navigator.clipboard.writeText(selectedImage.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    await fetch("/api/community/use", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId: selectedImage.id, type: "copy" }),
    });
  }

  function handleUsePrompt() {
    if (!selectedImage) return;
    setPrompt(selectedImage.prompt);
    setSelectedImage(null);
    fetch("/api/community/use", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId: selectedImage.id, type: "use" }),
    });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🖼️</span>
          <h1 className="text-2xl font-black text-white">Image Generation</h1>
        </div>
        <p className="text-sm text-white/30 ml-11">Create stunning images from text prompts using Imagen 4</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 mb-12">
        {/* Left */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">Prompt</label>
            </div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.metaKey && generate()}
              placeholder="Describe the image you want to create..."
              rows={4}
              className="w-full bg-transparent px-4 pb-4 text-sm text-white placeholder-white/20 outline-none resize-none leading-relaxed" />
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-white/20">{prompt.length} chars · ⌘↵ to generate</span>
              <button onClick={() => setPrompt("")} className="text-xs text-white/20 hover:text-white/50 transition-colors">Clear</button>
            </div>
          </div>

          <button onClick={generate} disabled={loading || !prompt.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all text-base shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2">
            {loading ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
            ) : "✦ Generate Image"}
          </button>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden aspect-square flex items-center justify-center relative">
            {loading ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-white/30">Creating your image…</p>
                <p className="text-xs text-white/15">Usually 10–20 seconds</p>
              </div>
            ) : result ? (
              <>
                <img src={`data:${result.mimeType};base64,${result.imageBase64}`} alt={prompt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                  <a href={`data:${result.mimeType};base64,${result.imageBase64}`} download="infimagen.png"
                    className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-xl">↓ Download</a>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center text-3xl">🖼️</div>
                <p className="text-sm text-white/20">Your image will appear here</p>
                <p className="text-xs text-white/10">Type a prompt and click Generate</p>
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div>
              <p className="text-xs text-white/25 uppercase tracking-wider mb-2">Recent</p>
              <div className="grid grid-cols-3 gap-2">
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setResult({ imageBase64: h.src.split(",")[1], mimeType: "image/png" }); setPrompt(h.prompt); }}
                    className="aspect-square rounded-xl overflow-hidden border border-white/8 hover:border-white/20 transition-colors">
                    <img src={h.src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── COMMUNITY IMAGES ── */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Community Images</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Free</span>
              <span className="text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">Pro</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {images.map((img, i) => (
              <div key={img.id} onClick={() => handleImageClick(img)}
                className="rounded-xl overflow-hidden relative group cursor-pointer w-full">
                <img src={img.image_url} alt={img.prompt} className="w-full h-auto" loading="lazy" />

                {/* Pro lock */}
                {!img.is_free && !isPaid && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🔒</span>
                    <span className="text-[9px] bg-violet-600 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>
                  </div>
                )}

                {/* Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                  <button onClick={(e) => handleLike(e, img.id)}
                    className="flex items-center gap-1 bg-black/40 backdrop-blur rounded-full px-2 py-1">
                    <span className={likedIds.has(img.id) ? "text-red-400" : "text-white/60"}>♥</span>
                    <span className="text-white/70 text-xs">{img.likes}</span>
                  </button>
                  <div className="w-full">
                    {img.title && <p className="text-white text-xs font-medium truncate mb-0.5">{img.title}</p>}
                    <span className="text-white/40 text-xs">🔁 {img.total_count} uses</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {selectedImage.title && <h2 className="text-sm font-bold text-white">{selectedImage.title}</h2>}
                {!selectedImage.is_free && <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
              </div>
              <button onClick={() => setSelectedImage(null)} className="text-white/30 hover:text-white text-lg">×</button>
            </div>
            <img src={selectedImage.image_url} alt={selectedImage.prompt} className="w-full rounded-xl mb-3 aspect-square object-cover" />
            <div className="flex items-center gap-3 mb-3">
              <button onClick={(e) => handleLike(e, selectedImage.id)} className="flex items-center gap-1.5">
                <span className={likedIds.has(selectedImage.id) ? "text-red-400" : "text-white/40"}>♥</span>
                <span className="text-white/50 text-xs">{selectedImage.likes}</span>
              </button>
              <span className="text-white/30 text-xs">🔁 {selectedImage.total_count} uses</span>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-3 mb-3">
              <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{selectedImage.prompt}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCopy}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${copied ? "bg-emerald-600 text-white" : "bg-white/8 border border-white/10 text-white/60 hover:text-white"}`}>
                {copied ? "✓ Copied!" : "Copy Prompt"}
              </button>
              <button onClick={handleUsePrompt} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                Use This →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Popup */}
      {showProPopup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProPopup(false)}>
          <div className="bg-[#111] border border-violet-500/30 rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="text-lg font-bold text-white mb-2">Pro Content</h2>
            <p className="text-sm text-white/50 mb-5">Ye image sirf paid users ke liye hai. Koi bhi plan lo aur sab unlock ho jayega!</p>
            <div className="space-y-2">
              <a href="/payment?plan=starter" className="block w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-sm">Starter — ₹149 (1,400 credits)</a>
              <a href="/payment?plan=pro" className="block w-full bg-violet-700/50 border border-violet-500/30 text-white/80 font-semibold py-3 rounded-xl text-sm">Pro — ₹499 (5,000 credits)</a>
            </div>
            <button onClick={() => setShowProPopup(false)} className="mt-4 text-xs text-white/25 hover:text-white/50 transition-colors">Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImagePage() {
  return <Suspense><ImageTool /></Suspense>;
}
