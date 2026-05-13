import { getCommentaryBookList } from "@/lib/commentary";

export async function GET() {
  const books = getCommentaryBookList();
  return Response.json(
    { books, total: books.reduce((s, b) => s + b.commentaryCount, 0) },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
