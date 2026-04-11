import { createClient } from "@supabase/supabase-js";
import { getChapter } from "@/lib/bible";

function getAuthenticatedClient(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function GET(request) {
  const supabase = getAuthenticatedClient(request);
  if (!supabase) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Sessao invalida" }, { status: 401 });
  }

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
