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
    const texto = completion.choices[0].message.content;
    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON inválido na resposta");
    serieGerada = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Erro ao chamar OpenAI:", err);
    return Response.json({ error: "Falha ao gerar série com IA: " + err.message }, { status: 500 });
  }

  try {
    const { data: novaSerie, error: serieError } = await supabase
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

    const semanas = serieGerada.weeks.map((week) => ({
      series_id: novaSerie.id,
      week_number: week.week,
      title: week.title,
      passage: week.passage,
      focus: week.focus,
      big_idea: week.bigIdea,
    }));

    const { error: semanasError } = await supabase.from("series_weeks").insert(semanas);
    if (semanasError) throw new Error(semanasError.message);

    return Response.json({ id: novaSerie.id, serie: serieGerada }, { status: 201 });
  } catch (err) {
    console.error("Erro ao salvar no Supabase:", err);
    return Response.json({ error: "Falha ao salvar série: " + err.message }, { status: 500 });
  }
}
