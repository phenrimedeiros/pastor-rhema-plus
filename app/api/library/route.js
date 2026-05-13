import { getLibraryIndex, getTraditions } from "@/lib/library";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tradition = searchParams.get("tradition") || "all";

  const index = getLibraryIndex();
  const traditions = index.traditions || {};
  const books = tradition === "all"
    ? index.books || []
    : (index.books || []).filter((b) => b.tradition === tradition);

  return Response.json(
    { traditions, books },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
