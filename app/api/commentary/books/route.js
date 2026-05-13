import { createClient } from "@supabase/supabase-js";
import { getCommentaryBookList } from "@/lib/commentary";

export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const books = getCommentaryBookList();
  return Response.json(
    { books, total: books.reduce((s, b) => s + b.commentaryCount, 0) },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
