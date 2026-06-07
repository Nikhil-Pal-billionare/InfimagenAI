"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin",              label: "Overview",    icon: "📊" },
  { href: "/admin/users",        label: "Users",       icon: "👥" },
  { href: "/admin/waitlist",     label: "Waitlist",    icon: "📋" },
  { href: "/admin/revenue",      label: "Revenue",     icon: "💰" },
  { href: "/admin/usage",        label: "Usage",       icon: "📈" },
  { href: "/admin/submissions",  label: "Submissions", icon: "🏆" },
  { href: "/admin/refferrals",   label: "Referrals",   icon: "🔗" },
  { href: "/admin/media",        label: "Media",       icon: "🖼️" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-[#0e0e0e] border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="h-14 flex items-center gap-3 px-5 border-b border-white/5 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-black">I</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">InfiMagen</p>
          <p className="text-violet-400 text-xs font-semibold">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-violet-600/15 text-violet-300 border border-violet-500/20"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Back to App */}
      <div className="p-3 border-t border-white/5 flex-shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/25 hover:text-white/60 hover:bg-white/5 transition-all"
        >
          ← Back to App
        </Link>
      </div>
    </aside>
  );
}

