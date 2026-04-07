function normalizeJsonCandidate(text) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3')
    .trim();
}

function extractBalancedObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

export function parseAiJsonResponse(text) {
  const rawCandidate = extractBalancedObject(text);
  if (!rawCandidate) {
    throw new Error("JSON inválido na resposta");
  }

  try {
    return JSON.parse(rawCandidate);
  } catch {
    const normalizedCandidate = normalizeJsonCandidate(rawCandidate);
    return JSON.parse(normalizedCandidate);
  }
}
