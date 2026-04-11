import { getBooks } from "@/lib/bible";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "pt";

  const books = getBooks(lang);
  return Response.json(
    { lang, books },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
