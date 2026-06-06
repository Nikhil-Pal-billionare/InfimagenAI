import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { searchPexelsVideos } from "@/lib/pexels";
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });
  const clips = await searchPexelsVideos(query, 8);
  return NextResponse.json({ clips });
}
