import { createClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data } = await supabaseAdmin.from("profiles").select("role").eq("id", user.id).single();
  if (data?.role !== "admin") throw new Error("Forbidden");
  return { supabase: supabaseAdmin, user };
}
