import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { PROMPTS } from "@/lib/prompts";
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

  let form;
  try { form = await request.json(); } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const { theme, weeks, audience, tone, goal } = form;
  if (!theme || !weeks || !audience || !tone || !goal) {
    return Response.json({ error: "Campos obrigatórios: theme, weeks, audience, tone, goal" }, { status: 400 });
  }

  let serieGerada;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4096,
      messages: [{ role: "user", content: PROMPTS.series({ theme, weeks, audience, tone, goal }) }],
    });
    serieGerada = parseAiJsonResponse(completion.choices[0].message.content || "");
  } catch (err) {
    console.error("Erro ao chamar OpenAI:", err);
    return Response.json({ error: "Falha ao gerar série com IA: " + err.message }, { status: 500 });
  }

  // Validate AI response structure before touching the database
  if (!serieGerada.seriesName || !serieGerada.overview) {
    return Response.json({ error: "Resposta da IA inválida: seriesName e overview são obrigatórios" }, { status: 500 });
  }
  if (!Array.isArray(serieGerada.weeks) || serieGerada.weeks.length === 0) {
    return Response.json({ error: "Resposta da IA inválida: nenhuma semana foi gerada" }, { status: 500 });
  }
  const invalidWeek = serieGerada.weeks.find((w) => !w.week || !w.title || !w.passage);
  if (invalidWeek) {
    return Response.json({ error: "Resposta da IA inválida: semana com dados faltando" }, { status: 500 });
  }

  // Insert series first, then weeks — rollback series on weeks failure
  let novaSerie;
  try {
    const { data, error: serieError } = await supabase
      .from("series")
      .insert([{
        user_id: user.id,
        series_name: serieGerada.seriesName,
        overview: serieGerada.overview,
        current_week: 1,
        completed_steps: [],
      }])
      .select()
      .single();

    if (serieError) throw new Error(serieError.message);
    novaSerie = data;
  } catch (err) {
    console.error("Erro ao salvar série:", err);
    return Response.json({ error: "Falha ao salvar série: " + err.message }, { status: 500 });
  }

  const semanas = serieGerada.weeks.map((week) => ({
    series_id: novaSerie.id,
    week_number: week.week,
    title: week.title,
    passage: week.passage,
    focus: week.focus || "",
    big_idea: week.bigIdea || "",
  }));

  const { error: semanasError } = await supabase.from("series_weeks").insert(semanas);
  if (semanasError) {
    // Weeks failed — delete the orphaned series to avoid partial state
    await supabase.from("series").delete().eq("id", novaSerie.id);
    console.error("Erro ao salvar semanas (série revertida):", semanasError);
    return Response.json({ error: "Falha ao salvar semanas da série: " + semanasError.message }, { status: 500 });
  }

  return Response.json({ id: novaSerie.id, serie: serieGerada }, { status: 201 });
}
