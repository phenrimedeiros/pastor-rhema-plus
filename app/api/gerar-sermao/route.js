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

  const { weekId, passage, title, focus, bigIdea, seriesId, weekNumber } = body;
  if (!weekId || !passage) return Response.json({ error: "weekId e passage são obrigatórios" }, { status: 400 });

  // ── AI Continuity: fetch previous week's sermon if available ──
  let previousContext = null;
  if (seriesId && weekNumber && weekNumber > 1) {
    const { data: prevWeek } = await supabase
      .from("series_weeks")
      .select("title, passage, big_idea")
      .eq("series_id", seriesId)
      .eq("week_number", weekNumber - 1)
      .single();

    if (prevWeek) {
      const { data: prevBuilder } = await supabase
        .from("sermon_content")
        .select("content")
        .eq("week_id", prevWeek.id ?? "")
        .eq("step", "builder")
        .eq("is_active", true)
        .single()
        .catch(() => ({ data: null }));

      if (prevWeek) {
        previousContext = {
          title: prevWeek.title,
          passage: prevWeek.passage,
          bigIdea: prevWeek.big_idea,
          mainPoint: prevBuilder?.content?.bigIdea || null,
        };
      }
    }
  }

  let content;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      messages: [{ role: "user", content: PROMPTS.builder({ passage, title, focus, centralTruth: bigIdea, previousContext }) }],
    });
    const jsonMatch = completion.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON inválido na resposta");
    content = JSON.parse(jsonMatch[0]);
  } catch (err) {
    return Response.json({ error: "Falha ao gerar sermão: " + err.message }, { status: 500 });
  }

  await supabase.from("sermon_content").insert([{ week_id: weekId, step: "builder", content, version: 1, is_active: true }]);

  return Response.json({ content }, { status: 201 });
}
