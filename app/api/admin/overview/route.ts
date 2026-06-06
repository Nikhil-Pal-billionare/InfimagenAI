import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const [{ count: users }, { data: revenue }, { count: events }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("subscriptions").select("amount"),
      supabase.from("usage_events").select("*", { count: "exact", head: true }),
    ]);
    return NextResponse.json({ users: users ?? 0, totalRevenue: revenue?.reduce((s, r) => s + Number(r.amount ?? 0), 0) ?? 0, usageEvents: events ?? 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: err.message === "Unauthorized" ? 401 : 403 });
  }
}
