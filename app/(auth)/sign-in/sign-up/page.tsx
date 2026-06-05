"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [bgImage, setBgImage]   = useState<string | null>(null);

  /* Load admin-set background image */
  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "signup_bg")
      .single()
      .then(({ data }) => {
        if (data?.value) setBgImage(data.value);
      });
  }, []);

  /* 📝 Email + Password signup — PRESERVED FROM ORIGINAL */
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { alert(error.message); setLoading(false); return; }
    setDone(true);
    setTimeout(() => router.push("/sign-in"), 2000);
  }

  /* 🚀 Google OAuth — PRESERVED FROM ORIGINAL */
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      {/* ── Left panel ── */}
      <div className="flex flex-col justify-center items-center w-full md:w-[420px] lg:w-[460px] flex-shrink-0 px-8 py-12 relative z-10">

        {/* Logo */}
        <div className="w-full max-w-sm mb-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white text-sm font-bold">I</span>
            </div>
            <span className="text-white font-bold text-lg tracking-wide">InfiMagen</span>
          </div>
        </div>

        {/* Success state */}
        {done ? (
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-emerald-400 text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
            <p className="text-sm text-white/30">
              We sent a confirmation link to <span className="text-white/60">{email}</span>. Redirecting to sign in…
            </p>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
            <p className="text-sm text-white/30 mb-8">Start creating with AI today — free to join</p>

            {/* Google button */}
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 text-sm font-medium py-3 px-4 rounded-xl transition-all duration-150 mb-4"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-white/20 font-medium">OR</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-150 text-sm mt-2 shadow-lg shadow-violet-500/20"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-white/25">
              Already have an account?{" "}
              <a href="/sign-in" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                Sign in
              </a>
            </p>
          </div>
        )}

        {/* Bottom links */}
        <div className="w-full max-w-sm mt-auto pt-10 flex gap-4">
          <a href="#" className="text-xs text-white/15 hover:text-white/30 transition-colors">Privacy Policy</a>
          <a href="#" className="text-xs text-white/15 hover:text-white/30 transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* ── Right panel — full-bleed image ── */}
      <div className="hidden md:block flex-1 relative overflow-hidden">
        {bgImage ? (
          <img
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-indigo-900/30 to-black">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-12 space-y-6">
                <p className="text-5xl font-black text-white/10 leading-tight select-none">
                  YOUR IDEAS<br />YOUR TOOLS<br />YOURS TO<br />CREATE
                </p>
                <div className="flex flex-col gap-3 items-start">
                  {["AI Image Generation", "Video & B-Roll", "Thumbnail Creator", "Script & TTS"].map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400/50" />
                      <span className="text-sm text-white/20">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <div className="absolute bottom-4 right-4 text-xs text-white/20 font-mono">
          InfiMagen AI
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.33 1.54 7.79 2.83l5.68-5.68C33.84 3.4 29.28 1.5 24 1.5 14.73 1.5 6.96 7.6 4.19 15.85l6.63 5.15C12.33 14.1 17.67 9.5 24 9.5z" />
      <path fill="#34A853" d="M46.1 24.5c0-1.34-.12-2.63-.35-3.88H24v7.34h12.47c-.54 2.9-2.18 5.36-4.64 7.02l7.18 5.57c4.2-3.87 6.09-9.57 6.09-16.05z" />
      <path fill="#4A90E2" d="M10.82 28.01A14.5 14.5 0 0 1 10 24c0-1.4.24-2.76.68-4.01l-6.63-5.15A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.59 10.76l8.23-6.75z" />
      <path fill="#FBBC05" d="M24 46.5c5.28 0 9.72-1.74 12.96-4.74l-7.18-5.57c-1.99 1.34-4.54 2.13-5.78 2.13-6.33 0-11.67-4.6-13.18-10.5l-8.23 6.75C6.96 40.4 14.73 46.5 24 46.5z" />
    </svg>
  );
}
