import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { PROMPTS } from "@/lib/prompts";
import { saveVersionedSermonContent } from "@/lib/versionedContent";
import { parseAiJsonResponse } from "@/lib/aiJson";

export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
  if (profile?.plan !== "plus") return Response.json({ error: "Plano Plus necessário" }, { status: 403 });

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const { weekId, passage, points } = body;
  if (!weekId || !passage || !points?.length) {
    return Response.json({ error: "weekId, passage e points são obrigatórios" }, { status: 400 });
  }

  let content;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      messages: [{ role: "user", content: PROMPTS.illustrations({ passage, points }) }],
    });
    content = parseAiJsonResponse(completion.choices[0].message.content || "");
  } catch (err) {
    return Response.json({ error: "Falha ao gerar ilustrações: " + err.message }, { status: 500 });
  }

  const record = await saveVersionedSermonContent(supabase, weekId, "illustrations", content);

  return Response.json({ content, version: record.version }, { status: 201 });
}
