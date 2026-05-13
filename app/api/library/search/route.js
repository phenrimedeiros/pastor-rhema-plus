import { createClient } from "@supabase/supabase-js";
import { searchLibrary } from "@/lib/library";

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
  const q = (searchParams.get("q") || "").trim();
  const lang = searchParams.get("lang") || "en";

  if (!q || q.length < 2) {
    return Response.json({ results: [] });
  }

  const results = searchLibrary(q, lang);

  return Response.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
