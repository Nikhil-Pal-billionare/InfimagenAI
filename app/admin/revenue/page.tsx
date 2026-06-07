import { createClient } from "@/lib/supabaseServer";
export default async function AdminRevenue() {
  const supabase = createClient();
  const { data: subs } = await supabase.from("subscriptions").select("plan_name, amount, created_at, status").order("created_at", { ascending: false }).limit(100);
  const total = subs?.reduce((s, r) => s + Number(r.amount ?? 0), 0) ?? 0;
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Revenue</h1><p className="text-sm text-white/30 mt-0.5">All plan purchases</p></div>
      <div className="bg-gradient-to-br from-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Revenue</p>
        <p className="text-3xl font-bold text-white">₹{total.toLocaleString()}</p>
      </div>
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/5">
            <th className="px-5 py-3 text-left text-xs text-white/30 uppercase">Plan</th>
            <th className="px-5 py-3 text-left text-xs text-white/30 uppercase">Amount</th>
            <th className="px-5 py-3 text-left text-xs text-white/30 uppercase">Status</th>
            <th className="px-5 py-3 text-left text-xs text-white/30 uppercase">Date</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {subs?.map((s, i) => (
              <tr key={i} className="hover:bg-white/3">
                <td className="px-5 py-3 capitalize text-white/70">{s.plan_name}</td>
                <td className="px-5 py-3 text-white/60">₹{s.amount}</td>
                <td className="px-5 py-3"><span className={`text-xs px-2 py-0.5 rounded ${s.status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-white/30"}`}>{s.status}</span></td>
                <td className="px-5 py-3 text-white/30 text-xs">{new Date(s.created_at).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
