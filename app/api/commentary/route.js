import { getCommentariesForChapter, getCommentariesForVerseRange } from "@/lib/commentary";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const book = parseInt(searchParams.get("book") || "0", 10);
  const chapter = parseInt(searchParams.get("chapter") || "1", 10);
  const verse = parseInt(searchParams.get("verse") || "0", 10);
  const verseEnd = parseInt(searchParams.get("verseEnd") || "0", 10);

  let commentaries;
  if (verse > 0 && verseEnd > 0) {
    commentaries = getCommentariesForVerseRange(book, chapter, verse, verseEnd);
  } else if (verse > 0) {
    commentaries = getCommentariesForVerseRange(book, chapter, verse, verse);
  } else {
    commentaries = getCommentariesForChapter(book, chapter);
  }

  return Response.json(
    { book, chapter, commentaries, total: commentaries.length },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
