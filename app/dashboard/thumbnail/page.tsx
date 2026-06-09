"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";

type Template = {
  id: string;
  title: string;
  image_url: string;
  prompt: string;
  is_free: boolean;
};

export default function ThumbnailPage() {
  const supabase = createClient();

  const [prompt, setPrompt]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<{ imageBase64: string; mimeType: string } | null>(null);
  const [error, setError]           = useState("");
  const [isPaid, setIsPaid]         = useState(false);
  const [templates, setTemplates]   = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showProPopup, setShowProPopup]         = useState(false);
  const [showPromptModal, setShowPromptModal]   = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        setIsPaid(!!data);
      }
      const { data: tmpl } = await supabase
        .from("thumbnail_templates")
        .select("id, title, image_url, prompt, is_free")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      setTemplates(tmpl ?? []);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleTemplateClick(template: Template) {
    if (!template.is_free && !isPaid) { setShowProPopup(true); return; }
    setSelectedTemplate(template);
    setShowPromptModal(true);
  }

  function copyPrompt() {
    if (!selectedTemplate) return;
    navigator.clipboard.writeText(selectedTemplate.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function useThisPrompt() {
    if (!selectedTemplate) return;
    setPrompt(selectedTemplate.prompt);
    setShowPromptModal(false);
  }

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res  = await fetch("/api/ai/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed"); return; }
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">🎨</span>
          <h1 className="text-2xl font-black text-white">Thumbnail Creator</h1>
        </div>
        <p className="text-sm text-white/30 ml-11">Generate YouTube-ready thumbnails in 16:9</p>
      </div>

      {/* ── Generator + Preview ── */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-6 mb-10">
        {/* Left */}
        <div className="space-y-4">
          <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <label className="text-xs font-semibold text-white/30 uppercase tracking-wider">Describe your thumbnail</label>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.metaKey && generate()}
              placeholder="Describe the thumbnail — include text, colors, mood, subject..."
              rows={5}
              className="w-full bg-transparent px-4 pb-4 text-sm text-white placeholder-white/20 outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3.5">
            <p className="text-xs text-amber-400/80 font-semibold mb-1.5">💡 Tips for better thumbnails</p>
            <ul className="space-y-1">
              {["Mention bold text for titles", "Specify the emotion (shocked, happy, curious)", "Include colors or style (dark, neon, minimal)", "Add 'YouTube thumbnail' at the end"].map((t) => (
                <li key={t} className="text-xs text-white/30 flex items-start gap-1.5">
                  <span className="text-white/20 mt-0.5">·</span>{t}
                </li>
              ))}
            </ul>
          </div>

          <button onClick={generate} disabled={loading || !prompt.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
            {loading ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
            ) : "✦ Generate Thumbnail"}
          </button>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
        </div>

        {/* Right — Preview */}
        <div className="space-y-3">
          <p className="text-xs text-white/25 uppercase tracking-wider">Preview (16:9)</p>
          <div className="relative w-full aspect-video bg-[#111] border border-white/8 rounded-2xl overflow-hidden flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                <p className="text-xs text-white/30">Creating your thumbnail…</p>
              </div>
            ) : result ? (
              <>
                <img src={`data:${result.mimeType};base64,${result.imageBase64}`} alt={prompt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                  <a href={`data:${result.mimeType};base64,${result.imageBase64}`} download="thumbnail.png" className="bg-white text-black text-sm font-bold px-5 py-2.5 rounded-xl">↓ Download PNG</a>
                </div>
              </>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2 opacity-20">🎨</div>
                <p className="text-xs text-white/15">16:9 thumbnail preview</p>
              </div>
            )}
          </div>
          {result && (
            <div className="bg-[#111] border border-white/5 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50 font-medium">Thumbnail ready!</p>
                <p className="text-xs text-white/20">1280×720 · PNG</p>
              </div>
              <a href={`data:${result.mimeType};base64,${result.imageBase64}`} download="thumbnail.png"
                className="text-xs bg-violet-600/80 hover:bg-violet-600 text-white font-semibold px-4 py-2 rounded-xl transition-colors">
                ↓ Download
              </a>
            </div>
          )}
        </div>
      </div>

      {/* ── TEMPLATES — NEECHE ── */}
      {templates.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Templates ({templates.length})
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Free</span>
              <span className="text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-full">Pro</span>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {templates.map((template) => (
              <div key={template.id} onClick={() => handleTemplateClick(template)}
                className="relative rounded-xl overflow-hidden cursor-pointer group border border-white/8 hover:border-violet-500/40 transition-all w-full"
style={{ aspectRatio: "16/9" }}>
                <img src={template.image_url} alt={template.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  {template.is_free
                    ? <span className="text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">FREE</span>
                    : <span className="text-[9px] font-bold bg-violet-600 text-white px-1.5 py-0.5 rounded-full">PRO</span>}
                </div>
                {!template.is_free && !isPaid && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-2xl">🔒</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-bold bg-white/20 backdrop-blur px-3 py-1.5 rounded-lg">
                    {!template.is_free && !isPaid ? "Upgrade to Pro" : "View Prompt"}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs font-semibold">{template.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro Popup */}
      {showProPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProPopup(false)}>
          <div className="bg-[#111] border border-violet-500/30 rounded-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="text-lg font-bold text-white mb-2">Pro Templates</h2>
            <p className="text-sm text-white/50 mb-5">Ye templates sirf paid users ke liye hain. Koi bhi plan lo aur sab templates unlock ho jayenge!</p>
            <div className="space-y-2">
              <a href="/payment?plan=starter" className="block w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-all text-sm">Starter — ₹149 (1,400 credits)</a>
              <a href="/payment?plan=pro" className="block w-full bg-violet-700/50 hover:bg-violet-600/50 border border-violet-500/30 text-white/80 font-semibold py-3 rounded-xl transition-all text-sm">Pro — ₹499 (5,000 credits)</a>
            </div>
            <button onClick={() => setShowProPopup(false)} className="mt-4 text-xs text-white/25 hover:text-white/50 transition-colors">Maybe later</button>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {showPromptModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPromptModal(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">{selectedTemplate.title}</h2>
              <button onClick={() => setShowPromptModal(false)} className="text-white/30 hover:text-white text-lg leading-none">×</button>
            </div>
            <img src={selectedTemplate.image_url} alt={selectedTemplate.title} className="w-full rounded-xl mb-3 aspect-video object-cover" />
            <div className="bg-white/5 border border-white/8 rounded-xl p-3 mb-3">
              <p className="text-xs text-white/60 leading-relaxed">{selectedTemplate.prompt}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={copyPrompt}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${copied ? "bg-emerald-600 text-white" : "bg-white/8 border border-white/10 text-white/60 hover:text-white hover:bg-white/12"}`}>
                {copied ? "✓ Copied!" : "Copy Prompt"}
              </button>
              <button onClick={useThisPrompt} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                Use This →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
