"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [credits, setCredits] = useState<number | null>(null);
  const [initial, setInitial] = useState("U");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/sign-in"); return; }
      setInitial((user.email?.[0] ?? "U").toUpperCase());
      const res = await fetch("/api/credits/get");
      const json = await res.json();
      setCredits(json.balance ?? 0);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const NAV = [
    { href: "/dashboard", label: "Home", icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )},
    { href: "/dashboard/Image", label: "Library", icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    )},
    { href: "/dashboard/remove-bg", label: "BG Remove", icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
       <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    )},
  ];

  return (
    <div className="flex min-h-screen bg-[#080808] text-white">

      {/* ── DESKTOP SIDEBAR (hidden on mobile) ── */}
      <aside className="hidden md:flex fixed top-0 left-0 h-screen w-[72px] bg-[#0d0d0d] border-r border-white/5 flex-col items-center py-4 z-50">
        <Link href="/dashboard" className="mb-6 flex-shrink-0">
          <img 
  src="https://lrdwqsllipznxajlyyea.supabase.co/storage/v1/object/public/media-uploads/1000055271-removebg-preview.png" 
  alt="InfiMagen" 
  className="w-8 h-8 rounded-full object-cover"
/>
        </Link>
        <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
          {NAV.map((item) => {
            const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            return (
              <Link key={item.label} href={item.href}
                className={`w-full flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all ${active ? "bg-white/10 text-white" : "text-white/30 hover:bg-white/5 hover:text-white/70"}`}>
                {item.icon}
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          <Link href="#" className="w-full flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-white/30 hover:bg-white/5 hover:text-white/70 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            <span className="text-[9px] font-medium">More</span>
          </Link>
        </nav>
        <div className="flex flex-col items-center gap-2 w-full px-2 mb-2">
          <Link href="/dashboard/tts" className="w-full flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-white/30 hover:bg-white/5 hover:text-white/70 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
            <span className="text-[9px] font-medium">Settings</span>
          </Link>
          <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 rounded-lg px-2 py-1.5 w-full justify-center">
            <span className="text-emerald-400 text-xs">⬡</span>
            <span className="text-emerald-300 text-xs font-bold">{credits ?? "…"}</span>
          </div>
          <button onClick={() => router.push("/payment?plan=pro")}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold py-1.5 rounded-lg transition-all">
            Upgrade
          </button>
          <button onClick={signOut} title="Sign out"
            className="w-10 h-10 rounded-full bg-violet-600/40 border-2 border-violet-500/40 flex items-center justify-center hover:border-violet-400/60 transition-all mt-1">
            <span className="text-violet-200 text-sm font-bold">{initial}</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP NAV ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 h-12">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <img src="https://lrdwqsllipznxajlyyea.supabase.co/storage/v1/object/public/media-uploads/1000055271-removebg-preview.png" alt="logo" className="w-7 h-7 rounded-full object-cover" />
          </div>
          <span className="text-white font-bold text-sm">InfiMagen</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 rounded-lg px-2 py-1 ">
            <span className="text-emerald-400 text-xs">⬡</span>
            <span className="text-emerald-300 text-xs font-bold">{credits ?? "…"}</span>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="md:hidden fixed top-12 left-0 right-0 z-50 bg-[#111] border-b border-white/10 px-4 py-3 space-y-1">
          {[
            { href: "/dashboard", label: "Home" },
            { href: "/dashboard/Image", label: "Image" },
            { href: "/dashboard/video", label: "Video" },
            { href: "/dashboard/thumbnail", label: "Thumbnail" },
            { href: "/dashboard/Script", label: "Script" },
            { href: "/dashboard/tts", label: "TTS" },
            { href: "/dashboard/remove-bg", label: "BG Remover" },
          ].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">
              {item.label}
            </Link>
          ))}
          <div className="border-t border-white/5 pt-2 mt-2">
            <button onClick={() => router.push("/payment?plan=pro")}
              className="w-full bg-violet-600 text-white text-sm font-bold py-2.5 rounded-xl mb-2">
              Upgrade
            </button>
            <button onClick={signOut}
              className="w-full text-white/30 text-sm py-2 hover:text-white/60 transition-all">
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:ml-[72px] min-h-screen overflow-y-auto pt-12 md:pt-0">
        {children}
      </main>
    </div>
  );
}
