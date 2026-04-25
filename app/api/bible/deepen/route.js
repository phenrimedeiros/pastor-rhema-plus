import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { parseAiJsonResponse } from "@/lib/aiJson";
import { getMissingServerEnv } from "@/lib/serverEnv";

const LANGUAGE_LABELS = {
  pt: "Portuguese (Brazil)",
  en: "English",
  es: "Spanish",
};

function normalizeVerses(verses) {
  if (!Array.isArray(verses)) return "";
  return verses
    .slice(0, 12)
    .map((verse) => `${verse.num}. ${verse.text}`)
    .join("\n");
}

function buildPrompt(input) {
  const language = LANGUAGE_LABELS[input.lang] || LANGUAGE_LABELS.pt;

  return `You are Pastor Rhema, a careful Bible study assistant for pastors and serious students of Scripture.

Respond in ${language}.

TASK
Deepen the user's understanding of the selected biblical text with reverent, pastoral, and context-aware interpretation.

SELECTED REFERENCE
${input.reference}

SELECTED TEXT
${input.selectedText}

NEARBY CHAPTER CONTEXT
${normalizeVerses(input.contextVerses)}

RESPOND ONLY IN VALID JSON. Do not use markdown fences. Use this exact shape:
{
  "title": "short study title",
  "summary": "2-3 concise sentences explaining the main idea of the selected text",
  "immediateContext": "2-3 concise sentences explaining what comes before/after and why it matters",
  "historicalContext": "2-3 concise sentences with careful background; say when something is uncertain",
  "keyIdeas": ["3-5 brief ideas from the text"],
  "crossReferences": ["3-5 references with one short explanation each"],
  "applications": ["3-5 pastoral applications that flow from the selected text"],
  "interpretationCare": ["2-4 cautions against common misunderstandings or overstatements"]
}

RULES
- Do not fabricate historical facts, original-language claims, manuscript claims, or quotes.
- If a detail is uncertain, state that plainly.
- Keep the answer practical for sermon preparation and Bible teaching.
- Ground every point in the selected text and its immediate context.`;
}

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
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const selectedText = String(body.selectedText || "").trim();
  const reference = String(body.reference || "").trim();
  const lang = ["pt", "en", "es"].includes(body.lang) ? body.lang : "pt";

  if (!selectedText || !reference) {
    return Response.json({ error: "reference e selectedText são obrigatórios" }, { status: 400 });
  }

  if (selectedText.length > 4000) {
    return Response.json({ error: "Texto selecionado muito longo" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2200,
      messages: [{ role: "user", content: buildPrompt({ ...body, lang, selectedText, reference }) }],
    });

    const content = parseAiJsonResponse(completion.choices[0].message.content || "");
    return Response.json({ content }, { status: 201 });
  } catch (err) {
    console.error("Erro ao aprofundar texto bíblico:", err);
    return Response.json({ error: "Falha ao aprofundar texto: " + err.message }, { status: 500 });
  }
}
