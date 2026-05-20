import { expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseRef, lookupRef } from "../lib/bible";

test("deve parsear referências bíblicas simples em PT", () => {
  const ref = "João 3:16";
  const parsed = parseRef(ref);
  expect(parsed).toEqual({
    bookIdx: 42,
    chapter: 3,
    verseStart: 16,
    verseEnd: 16,
  });
});

test("deve parsear referências bíblicas com intervalos em PT", () => {
  const ref = "Salmos 23:1-6";
  const parsed = parseRef(ref);
  expect(parsed).toEqual({
    bookIdx: 18,
    chapter: 23,
    verseStart: 1,
    verseEnd: 6,
  });
});

test("deve parsear referências em EN e ES", () => {
  expect(parseRef("John 3:16")).toEqual({ bookIdx: 42, chapter: 3, verseStart: 16, verseEnd: 16 });
  expect(parseRef("Juan 3:16")).toEqual({ bookIdx: 42, chapter: 3, verseStart: 16, verseEnd: 16 });
});

test("deve parsear abreviações comuns", () => {
  expect(parseRef("Gn 1")).toEqual({ bookIdx: 0, chapter: 1, verseStart: null, verseEnd: null });
  expect(parseRef("1Co 13:4-7")).toEqual({ bookIdx: 45, chapter: 13, verseStart: 4, verseEnd: 7 });
});

test("deve retornar null para referências inválidas", () => {
  expect(parseRef("LivroInexistente 1:1")).toBeNull();
  expect(parseRef("João 3")).toEqual({ bookIdx: 42, chapter: 3, verseStart: null, verseEnd: null });
});

test("deve buscar versos corretos usando lookupRef", () => {
  const result = lookupRef("João 3:16", "pt");
  expect(result).not.toBeNull();
  expect(result.bookName).toBe("João");
  expect(result.chapter).toBe(3);
  expect(result.verses).toHaveLength(1);
  expect(result.verses[0].num).toBe(16);
});
