import { createClient } from "@supabase/supabase-js";
import { getLibraryIndex } from "@/lib/library";

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
