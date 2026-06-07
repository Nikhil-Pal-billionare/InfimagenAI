import { createClient } from "@/lib/supabaseServer";
export default async function AdminUsage() {
  const supabase = createClient();
  const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: logs } = await supabase.from("credit_logs").select("reason, amount").gte("created_at", since7d);
  const breakdown: Record<string, number> = {};
  (logs ?? []).forEach((l) => { const k = l.reason ?? "other"; breakdown[k] = (breakdown[k] ?? 0) + Math.abs(l.amount); });
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] ?? 1;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Usage</h1><p className="text-sm text-white/30 mt-0.5">Credits used in last 7 days</p></div>
      <div className="bg-[#111] border border-white/5 rounded-xl p-5 space-y-4">
        {entries.map(([reason, count]) => (
          <div key={reason} className="flex items-center gap-3">
            <span className="text-xs text-white/40 w-44 truncate capitalize">{reason.replace(/_/g, " ")}</span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.round((count / max) * 100)}%` }} />
            </div>
            <span className="text-xs text-white/60 w-12 text-right">{count}</span>
          </div>
        ))}
        {entries.length === 0 && <p className="text-sm text-white/30 text-center py-4">No usage data yet</p>}
      </div>
    </div>
  );
}
