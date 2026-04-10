import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { PROMPTS } from "@/lib/prompts";
import { parseAiJsonResponse } from "@/lib/aiJson";
import { getMissingServerEnv } from "@/lib/serverEnv";

export async function POST(request) {
  const missingEnv = getMissingServerEnv([
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]);
  if (missingEnv.length > 0) {
    return Response.json({ error: `Variáveis ausentes no servidor: ${missingEnv.join(", ")}` }, { status: 500 });
  }

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

  const { mode, situation, category } = body;
  if (!mode || !situation?.trim()) {
    return Response.json({ error: "mode e situation são obrigatórios" }, { status: 400 });
  }

  const promptFn = mode === "comfort" ? PROMPTS.comfort : PROMPTS.counsel;
  if (!promptFn) return Response.json({ error: "Modo inválido" }, { status: 400 });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let content;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2048,
      messages: [{ role: "user", content: promptFn({ situation: situation.trim(), category }) }],
    });
    content = parseAiJsonResponse(completion.choices[0].message.content || "");
  } catch (err) {
    return Response.json({ error: "Falha ao gerar resposta pastoral: " + err.message }, { status: 500 });
  }

  return Response.json({ content }, { status: 200 });
}
