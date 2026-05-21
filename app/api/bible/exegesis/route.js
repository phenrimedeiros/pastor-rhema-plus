import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { parseAiJsonResponse } from "@/lib/aiJson";
import { getMissingServerEnv } from "@/lib/serverEnv";
import { PROMPTS } from "@/lib/prompts";

const LANGUAGE_LABELS = {
  pt: "Portuguese (Brazil)",
  en: "English",
  es: "Spanish",
};

export async function POST(request) {
  const missingEnv = getMissingServerEnv([
    "OPENAI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]);
  if (missingEnv.length > 0) {
    return Response.json(
      { error: `Variáveis ausentes no servidor: ${missingEnv.join(", ")}` },
      { status: 500 }
    );
  }

  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Sessão inválida" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const selectedText = String(body.selectedText || "").trim();
  const reference = String(body.reference || "").trim();
  const bookIdx = typeof body.bookIdx === "number" ? body.bookIdx : 0;
  const lang = ["pt", "en", "es"].includes(body.lang) ? body.lang : "pt";

  if (!selectedText || !reference) {
    return Response.json(
      { error: "reference e selectedText são obrigatórios" },
      { status: 400 }
    );
  }

  if (selectedText.length > 4000) {
    return Response.json({ error: "Texto selecionado muito longo" }, { status: 400 });
  }

  // Detect Testament: OT is Hebrew/Aramaic, NT is Greek
  const testament = bookIdx < 39 ? "OT (Hebrew/Aramaic)" : "NT (Greek)";
  const language = LANGUAGE_LABELS[lang] || LANGUAGE_LABELS.pt;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const prompt = PROMPTS.exegesis({
      reference,
      selectedText,
      testament,
      language,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Low temperature for factual exegesis & valid JSON
    });

    const content = parseAiJsonResponse(completion.choices[0].message.content || "");
    return Response.json({ content }, { status: 201 });
  } catch (err) {
    console.error("Erro na exegese original de texto bíblico:", err);
    return Response.json(
      { error: "Falha ao realizar exegese: " + err.message },
      { status: 500 }
    );
  }
}
