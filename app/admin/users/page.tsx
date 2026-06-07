import { createClient } from "@/lib/supabaseServer";

export default async function AdminUsers() {
  const supabase = createClient();

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

  const [{ data: users }, { count: newToday }, { count: newWeek }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, role, created_at, last_sign_in_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since7d),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-white/30 mt-0.5">All registered accounts</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Users",   value: users?.length ?? 0,  color: "text-violet-300" },
          { label: "Joined Today",  value: newToday ?? 0,        color: "text-emerald-300" },
          { label: "Joined (7d)",   value: newWeek ?? 0,         color: "text-blue-300" },
        ].map((s) => (
          <div key={s.label} className="bg-[#111] border border-white/5 rounded-xl p-4">
            <p className="text-xs text-white/30 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-sm font-medium text-white/60">Recent Users</span>
          <span className="text-xs text-white/20">Showing latest 100</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-white/30 uppercase tracking-wider">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-5 py-3 text-white/80">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === "admin"
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/20"
                        : "bg-white/5 text-white/40"
                    }`}>
                      {u.role ?? "user"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {new Date(u.created_at).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleString("en-IN")
                      : <span className="text-white/20">Never</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
