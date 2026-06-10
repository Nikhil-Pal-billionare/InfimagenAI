"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const TOOLS = [
  { href: "/dashboard/Image",     icon: "🖼️", label: "Image" },
  { href: "/dashboard/video",     icon: "🎬", label: "Video" },
  { href: "/dashboard/thumbnail", icon: "🎨", label: "Thumbnail" },
  { href: "/dashboard/Script",    icon: "📝", label: "Script" },
  { href: "/dashboard/tts",       icon: "🔊", label: "Speech" },
  { href: "#", icon: "⬆️", label: "Upscale", badge: "Soon" },
  { href: "#", icon: "✏️", label: "Draw",    badge: "Soon" },
];

const CATEGORIES = ["All", "Photography", "Animals", "Anime", "Architecture", "Character", "Food", "Sci-Fi"];

type CommunityImage = {
  id: string;
  image_url: string;
  prompt: string;
  title: string;
  is_free: boolean;
  likes: number;
  uses: number;
  copies: number;
  total_count: number;
};

export default function DashboardHome() {
  const router   = useRouter();
  const supabase = createClient();

  const [prompt, setPrompt]           = useState("");
  const [activeTab, setActiveTab]     = useState<"image" | "video">("image");
  const [bannerBg, setBannerBg]       = useState<string | null>(null);
  const [category, setCategory]       = useState("All");
  const [images, setImages]           = useState<CommunityImage[]>([]);
  const [loading, setLoading]         = useState(true);
  const [isPaid, setIsPaid]           = useState(false);
  const [userId, setUserId]           = useState<string | null>(null);
  const [likedIds, setLikedIds]       = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<CommunityImage | null>(null);
  const [showProPopup, setShowProPopup]   = useState(false);
  const [copied, setCopied]           = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }
      setUserId(user.id);

      // Paid check
      const { data: sub } = await supabase
        .from("subscriptions").select("id")
        .eq("user_id", user.id).eq("status", "active").maybeSingle();
      setIsPaid(!!sub);

      // Banner
      const { data: banner } = await supabase
        .from("app_settings").select("value").eq("key", "dashboard_banner").single();
      if (banner?.value) setBannerBg(banner.value);

      // Community images
      const { data: imgs } = await supabase
        .from("community_images")
        .select("id, image_url, prompt, title, is_free, likes, uses, copies, total_count")
        .eq("is_public", true).eq("active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      setImages(imgs ?? []);

      // User likes
      if (imgs && imgs.length > 0) {
        const { data: liked } = await supabase
          .from("image_likes").select("image_id")
          .eq("user_id", user.id);
        setLikedIds(new Set(liked?.map((l: any) => l.image_id) ?? []));
      }

      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGenerate() {
    if (!prompt.trim()) return;
    const route = activeTab === "image" ? "/dashboard/Image" : "/dashboard/video";
    router.push(`${route}?prompt=${encodeURIComponent(prompt)}`);
  }

  function handleImageClick(img: CommunityImage) {
    if (!img.is_free && !isPaid) { setShowProPopup(true); return; }
    setSelectedImage(img);
    setCopied(false);
  }

  async function handleLike(e: React.MouseEvent, imageId: string) {
    e.stopPropagation();
    if (!userId) return;
    const res = await fetch("/api/community/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    const data = await res.json();
    setLikedIds(prev => {
      const next = new Set(prev);
      data.liked ? next.add(imageId) : next.delete(imageId);
      return next;
    });
    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, likes: img.likes + (data.liked ? 1 : -1) } : img
    ));
  }

  async function handleCopy() {
    if (!selectedImage) return;
    navigator.clipboard.writeText(selectedImage.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    await fetch("/api/community/use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId: selectedImage.id, type: "copy" }),
    });
    setImages(prev => prev.map(img =>
      img.id === selectedImage.id ? { ...img, copies: img.copies + 1 } : img
    ));
  }

  async function handleUsePrompt() {
    if (!selectedImage) return;
    await fetch("/api/community/use", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId: selectedImage.id, type: "use" }),
    });
    router.push(`/dashboard/Image?prompt=${encodeURIComponent(selectedImage.prompt)}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#080808] text-white">

      {/* ── HERO BANNER ── */}
      <div className="relative w-full" style={{ height: "56vw", maxHeight: 420, minHeight: 220 }}>
        {bannerBg ? (
          <img src={bannerBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a00] via-[#2a1000] to-[#0d0d0d]">
            <div className="absolute inset-0 opacity-60" style={{ background: "radial-gradient(ellipse at 60% 40%, rgba(180,80,20,0.5) 0%, transparent 60%)" }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080808]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-white font-black text-center select-none"
            style={{ fontSize: "clamp(2.2rem, 8vw, 6rem)", letterSpacing: "-0.02em", textShadow: "0 2px 40px rgba(0,0,0,0.8)", fontFamily: "'Arial Black', 'Impact', sans-serif" }}>
            YOURS TO CREATE
          </h1>
        </div>
        {/* Prompt Bar */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 md:px-8 md:pb-6">
          <div className="max-w-3xl mx-auto bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <button className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </button>
              <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="Type a prompt..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none" />
              <button className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)" stroke="none"><path d="M12 2l2.4 7.6H22l-6.4 4.6 2.4 7.6L12 17.2l-6 4.6 2.4-7.6L2 9.6h7.6z"/></svg>
              </button>
              <button onClick={handleGenerate} disabled={!prompt.trim()} className="text-white/40 disabled:opacity-30 text-sm font-medium px-3 py-1.5 rounded-xl hover:text-white transition-all">Generate</button>
            </div>
            <div className="flex items-center gap-5 px-4 pb-3.5 pt-0.5 border-t border-white/5">
              {([{ icon: "🖼️", label: "Image", tab: "image" as const }, { icon: "🎬", label: "Video", tab: "video" as const }]).map((t) => (
                <button key={t.tab} onClick={() => setActiveTab(t.tab)}
                  className={`flex items-center gap-1.5 text-xs font-medium py-1 border-b-2 transition-all ${activeTab === t.tab ? "border-violet-500 text-white" : "border-transparent text-white/35 hover:text-white/60"}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-4 md:gap-8 flex-wrap">
          {TOOLS.map((tool) => (
            <a key={tool.label} href={tool.badge ? "#" : tool.href} className="flex flex-col items-center gap-2 group relative">
              {tool.badge && <span className="absolute -top-1.5 -right-3 bg-violet-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none z-10">{tool.badge}</span>}
              <div className={`w-14 h-14 rounded-full border flex items-center justify-center text-2xl transition-all ${tool.badge ? "bg-white/3 border-white/8 opacity-40" : "bg-[#1a1a1a] border-white/12 hover:border-violet-500/50 hover:bg-violet-500/10 group-hover:scale-105"}`}>
                {tool.icon}
              </div>
              <span className={`text-xs font-medium transition-colors ${tool.badge ? "text-white/25" : "text-white/45 group-hover:text-white/80"}`}>{tool.label}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-white/5 mx-4 md:mx-8 my-2" />

      {/* Community Images */}
      <div className="px-4 md:px-8 pt-4 pb-10">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <h2 className="text-lg font-bold text-white">Community Creations</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-violet-600/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">🔥 Trending ▾</button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`whitespace-nowrap text-xs font-medium px-3.5 py-2 rounded-full border transition-all flex-shrink-0 ${category === cat ? "bg-violet-600/80 border-violet-500/50 text-white" : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"}`}>
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white/5 animate-pulse w-full" style={{ height: i % 2 === 0 ? 280 : 200 }} />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🖼️</p>
            <p className="text-white/30 text-sm">Koi image abhi tak nahi hai</p>
            <a href="/dashboard/Image" className="inline-block mt-4 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all">
              Pehli Image Banao →
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {images.map((img, i) => (
              <div key={img.id}
                onClick={() => handleImageClick(img)}
                className="rounded-xl overflow-hidden relative group cursor-pointer w-full">

                {img.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={img.image_url} className="w-full h-auto" muted loop playsInline
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                    onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }} />
                ) : (
                  <img src={img.image_url} alt={img.prompt} className="w-full h-auto" loading="lazy" />
                )}

                {/* Pro lock overlay */}
                {!img.is_free && !isPaid && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">🔒</span>
                    <span className="text-white/70 text-xs font-semibold">Pro</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex flex-col items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                  {/* Like button */}
                  <button onClick={(e) => handleLike(e, img.id)}
                    className="flex items-center gap-1 bg-black/40 backdrop-blur rounded-full px-2 py-1">
                    <span className={likedIds.has(img.id) ? "text-red-400" : "text-white/60"}>♥</span>
                    <span className="text-white/70 text-xs">{img.likes}</span>
                  </button>

                  {/* Bottom info */}
                  <div className="w-full">
                    {img.title && <p className="text-white text-xs font-medium truncate mb-1">{img.title}</p>}
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 text-xs">🔁 {img.total_count} uses</span>
                      {!img.is_free && <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── IMAGE MODAL ── */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {selectedImage.title && <h2 className="text-sm font-bold text-white">{selectedImage.title}</h2>}
                {!selectedImage.is_free && <span className="text-[9px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
              </div>
              <button onClick={() => setSelectedImage(null)} className="text-white/30 hover:text-white text-lg leading-none">×</button>
            </div>

            <img src={selectedImage.image_url} alt={selectedImage.prompt}
              className="w-full rounded-xl mb-3 aspect-square object-cover" />

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3">
              <button onClick={(e) => handleLike(e, selectedImage.id)}
                className="flex items-center gap-1.5 text-sm">
                <span className={likedIds.has(selectedImage.id) ? "text-red-400" : "text-white/40"}>♥</span>
                <span className="text-white/50 text-xs">{selectedImage.likes}</span>
              </button>
              <span className="text-white/30 text-xs">🔁 {selectedImage.total_count} uses</span>
            </div>

            {/* Prompt */}
            <div className="bg-white/5 border border-white/8 rounded-xl p-3 mb-3">
              <p className="text-xs text-white/60 leading-relaxed line-clamp-3">{selectedImage.prompt}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={handleCopy}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${copied ? "bg-emerald-600 text-white" : "bg-white/8 border border-white/10 text-white/60 hover:text-white hover:bg-white/12"}`}>
                {copied ? "✓ Copied!" : "Copy Prompt"}
              </button>
              <button onClick={handleUsePrompt}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                Use This →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRO POPUP ── */}
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
