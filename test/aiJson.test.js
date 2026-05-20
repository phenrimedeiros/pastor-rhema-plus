import { expect, test } from "vitest";
import { parseAiJsonResponse } from "../lib/aiJson";

test("deve analisar JSON válido comum", () => {
  const input = '{"key": "value"}';
  const result = parseAiJsonResponse(input);
  expect(result).toEqual({ key: "value" });
});

test("deve extrair e analisar JSON envelopado em blocos de markdown", () => {
  const input = "Algum preâmbulo... ```json\n{\n  \"key\": \"value\"\n}\n``` Algum posfácio...";
  const result = parseAiJsonResponse(input);
  expect(result).toEqual({ key: "value" });
});

test("deve normalizar aspas inteligentes e vírgulas pendentes", () => {
  const input = '{\n  “key”: “value”,\n}';
  const result = parseAiJsonResponse(input);
  expect(result).toEqual({ key: "value" });
});

test("deve lançar erro para JSON inválido", () => {
  const input = "não é um json";
  expect(() => parseAiJsonResponse(input)).toThrow("JSON inválido na resposta");
});
