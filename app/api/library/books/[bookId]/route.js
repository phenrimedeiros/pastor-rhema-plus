import { getBookContent, getBookMeta, getBookChapter, getBookSection } from "@/lib/library";

export async function GET(request, { params }) {
  const { bookId } = await params;
  const { searchParams } = new URL(request.url);
  const chapter = parseInt(searchParams.get("chapter") || "0", 10);
  const section = parseInt(searchParams.get("section") || "0", 10);

  const meta = getBookMeta(bookId);
  if (!meta) {
    return Response.json({ error: "Book not found" }, { status: 404 });
  }

  if (meta.source === "bible") {
    return Response.json({
      id: bookId,
      title: meta.title,
      tradition: meta.tradition,
      source: "bible",
      bibleIndex: meta.bibleIndex,
      totalChapters: meta.totalChapters,
    });
  }

  if (chapter > 0) {
    const data = getBookChapter(bookId, chapter);
    if (!data) {
      return Response.json({ error: "Chapter not found" }, { status: 404 });
    }
    return Response.json(data, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  if (section > 0) {
    const data = getBookSection(bookId, section - 1);
    if (!data) {
      return Response.json({ error: "Section not found" }, { status: 404 });
    }
    return Response.json(data, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  const content = getBookContent(bookId);
  if (!content) {
    return Response.json({ error: "Book content not found" }, { status: 404 });
  }

  return Response.json(content, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
