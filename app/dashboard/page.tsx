"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

const TOOL_CARDS = [
  { href: "/dashboard/image",     icon: "🖼️", label: "Image",       desc: "Generate stunning images from text",     color: "from-violet-500/10 border-violet-500/15" },
  { href: "/dashboard/video",     icon: "🎬", label: "B-Roll",      desc: "AI-matched video footage for content",   color: "from-blue-500/10 border-blue-500/15" },
  { href: "/dashboard/thumbnail", icon: "🎨", label: "Thumbnail",   desc: "YouTube-ready 16:9 thumbnails",          color: "from-pink-500/10 border-pink-500/15" },
  { href: "/dashboard/script",    icon: "📝", label: "Script",      desc: "Scripts for YouTube, Reels & Podcasts",  color: "from-emerald-500/10 border-emerald-500/15" },
  { href: "/dashboard/tts",       icon: "🔊", label: "Text to Speech", desc: "Natural voiceovers from your scripts", color: "from-amber-500/10 border-amber-500/15" },
];

type RecentGen = {
  id: string;
  reason: string;
  created_at: string;
};

export default function DashboardHome() {
  const router   = useRouter();
  const supabase = createClient();

  const [prompt, setPrompt]         = useState("");
  const [activeTab, setActiveTab]   = useState<"image" | "video">("image");
  const [recent, setRecent]         = useState<RecentGen[]>([]);
  const [bannerBg, setBannerBg]     = useState<string | null>(null);
  const [greeting, setGreeting]     = useState("Good morning");
  const [userName, setUserName]     = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }
      setUserName(user.email?.split("@")[0] ?? "Creator");

      const [recentRes, bannerRes] = await Promise.all([
        supabase.from("credit_logs").select("id, reason, created_at")
          .eq("user_id", user.id)
          .lt("amount", 0)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase.from("app_settings").select("value").eq("key", "dashboard_banner").single(),
      ]);

      setRecent(recentRes.data ?? []);
      if (bannerRes.data?.value) setBannerBg(bannerRes.data.value);
    }
    load();
  }, []);

  function handleGenerate() {
    if (!prompt.trim()) return;
    const route = activeTab === "image" ? "/dashboard/image" : "/dashboard/video";
    router.push(`${route}?prompt=${encodeURIComponent(prompt)}`);
  }

  const TOOL_LABELS: Record<string, string> = {
    image_generation:     "🖼️ Image",
    thumbnail_generation: "🎨 Thumbnail",
    broll_generation:     "🎬 B-Roll",
    text_to_speech:       "🔊 TTS",
    script_generation:    "📝 Script",
    ai_cut_editor:        "✂️ AI Cut",
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero Banner ── */}
      <div className="relative h-52 md:h-64 overflow-hidden flex-shrink-0">
        {bannerBg ? (
          <>
            <img src={bannerBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080808]" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-indigo-900/20 to-[#080808]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] rounded-full bg-violet-600/10 blur-[80px]" />
          </div>
        )}
        <div className="relative z-10 h-full flex flex-col justify-end px-6 pb-6">
          <p className="text-xs text-white/30 uppercase tracking-widest mb-1">{greeting}</p>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            YOURS TO CREATE
          </h1>
        </div>
      </div>

      {/* ── Prompt Box ── */}
      <div className="px-4 md:px-6 -mt-6 relative z-10">
        <div className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
          {/* Input row */}
          <div className="flex items-center gap-3 p-3 md:p-4">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 text-white/30 text-sm">
              +
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Type a prompt..."
              className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="hidden sm:block bg-white/8 hover:bg-white/15 disabled:opacity-30 text-white/60 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-all border border-white/8"
            >
              Generate
            </button>
          </div>

          {/* Tab row */}
          <div className="flex items-center gap-2 px-3 md:px-4 pb-3 border-t border-white/5 pt-3">
            {(["image", "video"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? "bg-violet-600/80 text-white border border-violet-500/50"
                    : "bg-white/5 text-white/40 hover:text-white/70 border border-transparent"
                }`}
              >
                {tab === "image" ? "🖼️" : "🎬"} {tab}
              </button>
            ))}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              className="sm:hidden ml-auto bg-violet-600 disabled:opacity-30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Go →
            </button>
          </div>
        </div>
      </div>

      {/* ── Tool Cards ── */}
      <div className="px-4 md:px-6 mt-8">
        <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-4">AI Tools</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {TOOL_CARDS.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className={`group bg-gradient-to-br ${tool.color} to-transparent border rounded-2xl p-4 hover:border-white/20 transition-all duration-200`}
            >
              <div className="text-2xl mb-3">{tool.icon}</div>
              <p className="text-sm font-bold text-white mb-1">{tool.label}</p>
              <p className="text-xs text-white/30 leading-tight group-hover:text-white/50 transition-colors">
                {tool.desc}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* ── Recent Activity ── */}
      {recent.length > 0 && (
        <div className="px-4 md:px-6 mt-8 pb-10">
          <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-4">Recent Activity</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {recent.map((r) => (
              <div
                key={r.id}
                className="bg-[#111] border border-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-white/3 transition-colors"
              >
                <span className="text-lg">{(TOOL_LABELS[r.reason] ?? "⚡").slice(0, 2)}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/60 truncate">
                    {TOOL_LABELS[r.reason] ?? r.reason.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-white/20">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
