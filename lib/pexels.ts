export async function searchPexelsVideos(query: string, perPage = 4) {
  const res = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    { headers: { Authorization: process.env.PEXELS_API_KEY! } }
  );
  if (!res.ok) throw new Error("Pexels API error");
  return (await res.json()).videos ?? [];
}
