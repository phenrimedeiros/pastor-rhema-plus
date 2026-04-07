import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { PROMPTS } from "@/lib/prompts";

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

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const { weekId, passage, bigIdea, points } = body;
  if (!weekId || !passage || !bigIdea || !points?.length) {
    return Response.json({ error: "weekId, passage, bigIdea e points são obrigatórios" }, { status: 400 });
  }

  let content;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      messages: [{ role: "user", content: PROMPTS.application({ passage, bigIdea, points }) }],
    });
    const jsonMatch = completion.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON inválido na resposta");
    content = JSON.parse(jsonMatch[0]);
  } catch (err) {
    return Response.json({ error: "Falha ao gerar aplicações: " + err.message }, { status: 500 });
  }

  await supabase.from("sermon_content").insert([{ week_id: weekId, step: "application", content, version: 1, is_active: true }]);

  return Response.json({ content }, { status: 201 });
}
