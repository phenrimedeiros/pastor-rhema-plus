import { createClient } from "@supabase/supabase-js";
import { getBooks } from "@/lib/bible";

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

  const books = getBooks(lang);
  return Response.json(
    { lang, books },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
