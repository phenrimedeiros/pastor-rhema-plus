import { lookupRef } from "@/lib/bible";
import { auth } from "@/lib/supabase_client";

export async function GET(request) {
  const session = await auth.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");
  const lang = searchParams.get("lang") || "pt";

  if (!ref) {
    return Response.json({ error: "Missing ref parameter" }, { status: 400 });
  }

  const result = lookupRef(ref, lang);
  if (!result) {
    return Response.json({ error: "Reference not found", ref }, { status: 404 });
  }

  return Response.json(
    { ref, lang, ...result },
    { headers: { "Cache-Control": "public, max-age=86400" } }
  );
}

// POST: look up multiple references at once
export async function POST(request) {
  const session = await auth.getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const refs = body.refs; // array of ref strings
  const lang = body.lang || "pt";

  if (!Array.isArray(refs) || refs.length === 0) {
    return Response.json({ error: "Missing refs array" }, { status: 400 });
  }

  const results = refs.map((ref) => {
    const result = lookupRef(ref, lang);
    return result ? { ref, ...result } : { ref, error: "not found" };
  });

  return Response.json({ lang, results });
}
