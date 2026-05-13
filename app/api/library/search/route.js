import { searchLibrary } from "@/lib/library";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const lang = searchParams.get("lang") || "en";

  if (!q || q.length < 2) {
    return Response.json({ results: [] });
  }

  const results = searchLibrary(q, lang);

  return Response.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
