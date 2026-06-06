import { supabaseAdmin } from "@/lib/supabaseAdmin";
const FREE_DAILY_CREDITS = 50;
const TRIAL_DAYS = 3;
export async function ensureDailyFreeCredits(userId: string) {
  const { data: sub } = await supabaseAdmin
    .from("subscriptions").select("id").eq("user_id", userId).eq("status", "active").maybeSingle();
  if (sub) return;
  const { data: credits } = await supabaseAdmin
    .from("credits").select("balance, created_at, last_free_reset").eq("user_id", userId).maybeSingle();
  if (!credits) return;
  const diffDays = Math.floor((Date.now() - new Date(credits.created_at).getTime()) / 86400000);
  if (diffDays >= TRIAL_DAYS) return;
  const today = new Date().toDateString();
  if (credits.last_free_reset && new Date(credits.last_free_reset).toDateString() === today) return;
  await supabaseAdmin.from("credits").update({
    balance: Math.max(Number(credits.balance), FREE_DAILY_CREDITS),
    last_free_reset: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);
}
