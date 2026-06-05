"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabaseClient";

/* ─── tiny helpers ─── */
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ─── NAVBAR ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow">
            <span className="text-white text-sm font-black">I</span>
          </div>
          <span className="text-white font-bold text-lg tracking-wide">InfiMagen</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "Pricing", "Community", "API"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/sign-in" className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2">
            Sign In
          </a>
          <a
            href="/sign-up"
            className="text-sm font-semibold bg-white text-black hover:bg-white/90 px-5 py-2.5 rounded-xl transition-all duration-150"
          >
            Get Started
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-white/60 hover:text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className="w-5 space-y-1.5">
            <span className={cn("block h-px bg-current transition-all", menuOpen && "rotate-45 translate-y-2")} />
            <span className={cn("block h-px bg-current transition-all", menuOpen && "opacity-0")} />
            <span className={cn("block h-px bg-current transition-all", menuOpen && "-rotate-45 -translate-y-2")} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-3">
          {["Features", "Pricing", "Community", "API"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="block text-sm text-white/50 hover:text-white py-2">
              {item}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <a href="/sign-in" className="text-sm text-center text-white/50 border border-white/10 rounded-xl py-2.5">Sign In</a>
            <a href="/sign-up" className="text-sm font-semibold text-center bg-white text-black rounded-xl py-2.5">Get Started Free</a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── HERO ─── */
function Hero({ heroBg }: { heroBg: string | null }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">

      {/* Background image or gradient */}
      {heroBg ? (
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black" />
        </div>
      ) : (
        <div className="absolute inset-0">
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-purple-900/10 blur-[150px]" />
        </div>
      )}

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }} />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/50 font-medium">AI-Powered Creative Platform</span>
        </div>

        {/* Giant headline */}
        <h1 className="text-[clamp(3rem,10vw,9rem)] font-black leading-[0.9] tracking-tighter text-white mb-6 select-none">
          <span className="block text-white">YOUR IDEAS</span>
          <span className="block text-violet-400">YOUR TOOLS</span>
          <span className="block text-white/80">YOURS TO</span>
          <span className="block" style={{ WebkitTextStroke: "2px rgba(255,255,255,0.3)", color: "transparent" }}>
            CREATE
          </span>
        </h1>

        <p className="text-lg md:text-xl text-white/40 max-w-2xl mx-auto mb-10 font-medium">
          The creator-first AI platform. Generate stunning images, videos, thumbnails,
          scripts, and more — all in one place.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/sign-up"
            className="w-full sm:w-auto bg-white text-black font-bold px-8 py-4 rounded-2xl text-base hover:bg-white/90 transition-all duration-150 shadow-2xl shadow-white/10"
          >
            Start Creating — Free
          </a>
          <a
            href="#features"
            className="w-full sm:w-auto bg-white/5 border border-white/10 text-white/70 font-medium px-8 py-4 rounded-2xl text-base hover:bg-white/10 hover:text-white transition-all duration-150"
          >
            See what's possible →
          </a>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-white/20">
          <span>✦ No credit card required</span>
          <span className="hidden sm:block">✦ 150 free credits daily</span>
          <span className="hidden sm:block">✦ 50,000+ creators</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <div className="w-px h-10 bg-gradient-to-b from-white/0 to-white/20" />
        <div className="w-1 h-1 rounded-full bg-white/20" />
      </div>
    </section>
  );
}

/* ─── PROMPT DEMO ─── */
function PromptDemo() {
  const [active, setActive] = useState<"image" | "video">("image");
  const prompts = [
    "A cyberpunk city at night with neon reflections on wet streets",
    "Portrait of a futuristic warrior in golden armor",
    "Abstract flowing liquid metal sculpture in dramatic lighting",
    "A magical forest with bioluminescent plants glowing blue",
  ];
  const [promptIdx, setPromptIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPromptIdx((i) => (i + 1) % prompts.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden shadow-2xl">
          {/* Top bar */}
          <div className="relative h-52 bg-gradient-to-br from-violet-900/30 to-indigo-900/20 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: "radial-gradient(circle at 30% 50%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 70% 50%, #4f46e5 0%, transparent 50%)"
            }} />
            <p className="relative text-white/60 text-2xl font-bold text-center px-8 leading-tight transition-all duration-500">
              "{prompts[promptIdx]}"
            </p>
          </div>

          {/* Controls */}
          <div className="p-4 flex items-center gap-3 border-t border-white/5">
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {(["image", "video"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActive(tab)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                    active === tab
                      ? "bg-violet-600 text-white"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Type a prompt..."
              defaultValue={prompts[promptIdx]}
              className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-violet-500/50"
            />
            <a
              href="/sign-up"
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
            >
              Generate →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES GRID ─── */
const FEATURES = [
  {
    icon: "🖼️",
    title: "AI Image Generation",
    desc: "Create photorealistic images, illustrations, and art from text prompts using Imagen 4.",
    tag: "Powered by Imagen 4",
    color: "from-violet-500/10",
  },
  {
    icon: "🎬",
    title: "B-Roll Video",
    desc: "Auto-generate relevant video clips for your content using AI scene matching.",
    tag: "Pexels + AI",
    color: "from-blue-500/10",
  },
  {
    icon: "🎨",
    title: "Thumbnail Creator",
    desc: "Design eye-catching YouTube thumbnails in 16:9 with one prompt.",
    tag: "16:9 Optimized",
    color: "from-pink-500/10",
  },
  {
    icon: "📝",
    title: "Script Generator",
    desc: "Write engaging scripts for YouTube, Reels, Podcasts — in your tone and style.",
    tag: "Multi-format",
    color: "from-emerald-500/10",
  },
  {
    icon: "🔊",
    title: "Text to Speech",
    desc: "Convert scripts to natural-sounding voiceovers in multiple voices and languages.",
    tag: "Natural voices",
    color: "from-amber-500/10",
  },
  {
    icon: "✂️",
    title: "AI Cut Editor",
    desc: "Automatically identify and remove silences, filler words from your recordings.",
    tag: "Coming soon",
    color: "from-cyan-500/10",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">AI Tools</p>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Everything a creator needs
          </h2>
          <p className="text-white/30 mt-4 text-lg max-w-xl mx-auto">
            One platform, six powerful AI tools — all working together seamlessly.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={cn(
                "group relative bg-gradient-to-br",
                f.color,
                "to-transparent border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all duration-300 cursor-pointer"
              )}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed mb-4">{f.desc}</p>
              <span className="inline-block text-xs font-medium text-white/25 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
                {f.tag}
              </span>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 text-sm">
                →
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── STATS ─── */
function Stats() {
  return (
    <section className="py-16 px-6 border-y border-white/5">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { num: "50K+",  label: "Creators" },
          { num: "5M+",   label: "Images Generated" },
          { num: "150",   label: "Free Credits Daily" },
          { num: "6",     label: "AI Tools" },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-3xl md:text-4xl font-black text-white">{s.num}</p>
            <p className="text-sm text-white/30 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    desc: "Perfect to get started",
    features: ["150 credits/day", "Image generation", "Community gallery", "Basic tools"],
    cta: "Start Free",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Creator",
    price: "₹499",
    period: "/month",
    desc: "For serious creators",
    features: ["5,000 credits/month", "All AI tools", "Private generations", "Priority queue", "No watermark"],
    cta: "Get Creator",
    href: "/sign-up?plan=creator",
    highlight: true,
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/month",
    desc: "Maximum power",
    features: ["Unlimited credits", "All AI tools", "API access", "Fastest generation", "Priority support"],
    cta: "Get Pro",
    href: "/sign-up?plan=pro",
    highlight: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-black text-white">Simple, transparent pricing</h2>
          <p className="text-white/30 mt-4 text-lg">Start free, upgrade when you're ready.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl p-6 flex flex-col gap-4",
                plan.highlight
                  ? "bg-violet-600/15 border-2 border-violet-500/50 relative"
                  : "bg-[#111] border border-white/8"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white/50">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-white/30 text-sm">{plan.period}</span>
                </div>
                <p className="text-xs text-white/30 mt-1">{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                    <span className="text-emerald-400 text-xs">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={cn(
                  "text-center text-sm font-semibold py-3 rounded-xl transition-all",
                  plan.highlight
                    ? "bg-violet-600 hover:bg-violet-500 text-white"
                    : "bg-white/8 hover:bg-white/12 border border-white/10 text-white/70 hover:text-white"
                )}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── WAITLIST / CTA ─── */
function WaitlistCTA() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const { error } = await supabase.from("waitlist").insert({
      email,
      whatsapp: whatsapp || null,
      role: role || null,
      status: "waitlisted",
    });
    if (error) {
      setErrMsg(error.code === "23505" ? "You're already on the list!" : error.message);
      setStatus("error");
    } else {
      setStatus("done");
    }
  }

  return (
    <section className="py-24 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-xs text-violet-300 font-medium">Early Access Open</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
          Join 50,000+ creators
        </h2>
        <p className="text-white/30 text-lg mb-10">
          Get early access, exclusive credits, and be first to try every new feature.
        </p>

        {status === "done" ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">You're on the list!</h3>
            <p className="text-white/40 text-sm">We'll notify you at <strong className="text-white/70">{email}</strong> when your access is ready.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#111] border border-white/8 rounded-2xl p-6 space-y-3 text-left">
            <div>
              <label className="block text-xs font-medium text-white/30 mb-1.5 uppercase tracking-wider">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/5 border border-white/8 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/30 mb-1.5 uppercase tracking-wider">WhatsApp</label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white/5 border border-white/8 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/30 mb-1.5 uppercase tracking-wider">I am a...</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 focus:border-violet-500/50 rounded-xl px-4 py-3 text-sm text-white/60 outline-none transition-colors"
                >
                  <option value="">Select role</option>
                  <option value="youtuber">YouTuber</option>
                  <option value="designer">Designer</option>
                  <option value="marketer">Marketer</option>
                  <option value="developer">Developer</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            {status === "error" && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{errMsg}</p>
            )}
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20"
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Joining…
                </span>
              ) : "Join the Waitlist — Free"}
            </button>
            <p className="text-xs text-center text-white/15">No spam, ever. Unsubscribe anytime.</p>
          </form>
        )}
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-black">I</span>
          </div>
          <span className="text-white/50 text-sm font-semibold">InfiMagen</span>
        </div>
        <p className="text-xs text-white/20">© {new Date().getFullYear()} InfiMagen. All rights reserved.</p>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a key={l} href="#" className="text-xs text-white/20 hover:text-white/50 transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

/* ─── PAGE EXPORT ─── */
export default function HomePage() {
  const supabase = createClient();
  const [heroBg, setHeroBg] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "hero_bg")
      .single()
      .then(({ data }) => { if (data?.value) setHeroBg(data.value); });
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <Hero heroBg={heroBg} />
      <PromptDemo />
      <Stats />
      <Features />
      <Pricing />
      <WaitlistCTA />
      <Footer />
    </div>
  );
}
