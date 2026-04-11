import { getChapter } from "@/lib/bible";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "pt";
  const bookIdx = parseInt(searchParams.get("book") ?? "42", 10);
  const chapter = parseInt(searchParams.get("chapter") ?? "3", 10);

  const result = getChapter(lang, bookIdx, chapter);
  if (!result) {
    return Response.json({ error: "Chapter not found" }, { status: 404 });
  }

  return Response.json(
    { lang, bookIdx, ...result },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
