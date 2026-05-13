import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "data/library/raw/deuterocanonical-texts.json");
const OUT_DIR = path.join(ROOT, "data/library/books/deuterocanonical");

const TRADITION_LABELS = {
  pt: "Deuterocanônico",
  en: "Deuterocanonical",
  es: "Deuterocanónico",
};

if (!fs.existsSync(SRC)) {
  console.log("SKIP deuterocanonical (no raw data)");
  process.exit(0);
}

const raw = JSON.parse(fs.readFileSync(SRC, "utf-8"));
const books = raw.books || {};

fs.mkdirSync(OUT_DIR, { recursive: true });

let count = 0;

for (const [abbrev, book] of Object.entries(books)) {
  const id = abbrev.toLowerCase();

  const verseEntries = book.verses || {};
  const chapterMap = {};

  for (const [ref, text] of Object.entries(verseEntries)) {
    const [c, v] = ref.split(":");
    const chapterNum = parseInt(c, 10);
    const verseNum = parseInt(v, 10);
    if (!chapterMap[chapterNum]) chapterMap[chapterNum] = [];
    chapterMap[chapterNum][verseNum - 1] = text;
  }

  const chapters = [];
  for (let c = 1; c <= Math.max(...Object.keys(chapterMap).map(Number), 0); c++) {
    const verseArray = chapterMap[c] || [];
    chapters.push(verseArray.filter((v) => v !== undefined));
  }

  const output = {
    id,
    title: book.name || abbrev,
    tradition: "deuterocanonical",
    totalChapters: chapters.length,
    chapters,
  };

  const outPath = path.join(OUT_DIR, `${id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
  console.log(`  OK   deuterocanonical/${id} (${chapters.length} chapters)`);
  count++;
}

console.log(`\nConverted: ${count} deuterocanonical books`);
