import { getBooks } from "@/lib/bible";
import { auth } from "@/lib/supabase_client";

export async function GET(request) {
  const session = await auth.getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "pt";

  const books = getBooks(lang);
  return Response.json(
    { lang, books },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}
