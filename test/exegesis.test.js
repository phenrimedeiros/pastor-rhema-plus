import { expect, test } from "vitest";
import { PROMPTS } from "../lib/prompts";

test("deve gerar prompt de exegese contendo informações corretas de Hebraico no AT", () => {
  const prompt = PROMPTS.exegesis({
    reference: "Salmos 23:1",
    selectedText: "O Senhor é o meu pastor",
    testament: "OT (Hebrew/Aramaic)",
    language: "Portuguese (Brazil)",
  });

  expect(prompt).toContain("Salmos 23:1");
  expect(prompt).toContain("O Senhor é o meu pastor");
  expect(prompt).toContain("OT (Hebrew/Aramaic)");
  expect(prompt).toContain("Portuguese (Brazil)");
  expect(prompt).toContain("RESPOND ONLY IN VALID JSON");
});

test("deve gerar prompt de exegese contendo informações corretas de Grego no NT", () => {
  const prompt = PROMPTS.exegesis({
    reference: "João 3:16",
    selectedText: "Porque Deus amou o mundo",
    testament: "NT (Greek)",
    language: "English",
  });

  expect(prompt).toContain("João 3:16");
  expect(prompt).toContain("Porque Deus amou o mundo");
  expect(prompt).toContain("NT (Greek)");
  expect(prompt).toContain("English");
});
