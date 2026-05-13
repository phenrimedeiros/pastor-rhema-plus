import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const DB_PATH = path.join(ROOT, "data/commentary/raw/commentaries.sqlite");
const OUT_DIR = path.join(ROOT, "data/commentary");

if (!fs.existsSync(DB_PATH)) {
  console.error("FAIL — commentaries.sqlite not found.");
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

// Book name → our 0-based Bible index mapping
const BOOK_TO_INDEX = {
  "genesis": 0, "exodus": 1, "leviticus": 2, "numbers": 3, "deuteronomy": 4,
  "joshua": 5, "judges": 6, "ruth": 7, "1samuel": 8, "2samuel": 9,
  "1kings": 10, "2kings": 11, "1chronicles": 12, "2chronicles": 13, "ezra": 14,
  "nehemiah": 15, "esther": 16, "job": 17, "psalms": 18, "psalm": 18,
  "proverbs": 19, "ecclesiastes": 20, "songofsolomon": 21, "isaiah": 22,
  "jeremiah": 23, "lamentations": 24, "ezekiel": 25, "daniel": 26,
  "hosea": 27, "joel": 28, "amos": 29, "obadiah": 30, "jonah": 31,
  "micah": 32, "nahum": 33, "habakkuk": 34, "zephaniah": 35, "haggai": 36,
  "zechariah": 37, "malachi": 38, "matthew": 39, "mark": 40, "luke": 41,
  "john": 42, "acts": 43, "romans": 44, "1corinthians": 45, "2corinthians": 46,
  "galatians": 47, "ephesians": 48, "philippians": 49, "colossians": 50,
  "1thessalonians": 51, "2thessalonians": 52, "1timothy": 53, "2timothy": 54,
  "titus": 55, "philemon": 56, "hebrews": 57, "james": 58,
  "1peter": 59, "1pet": 59, "2peter": 60, "2pet": 60,
  "1john": 61, "2john": 62, "3john": 63, "jude": 64, "revelation": 65,
};

// Book names for output directory
const INDEX_TO_NAME = [
  "genesis", "exodus", "leviticus", "numbers", "deuteronomy",
  "joshua", "judges", "ruth", "1-samuel", "2-samuel",
  "1-kings", "2-kings", "1-chronicles", "2-chronicles", "ezra",
  "nehemiah", "esther", "job", "psalms", "proverbs",
  "ecclesiastes", "song-of-solomon", "isaiah", "jeremiah", "lamentations",
  "ezekiel", "daniel", "hosea", "joel", "amos",
  "obadiah", "jonah", "micah", "nahum", "habakkuk",
  "zephaniah", "haggai", "zechariah", "malachi", "matthew",
  "mark", "luke", "john", "acts", "romans",
  "1-corinthians", "2-corinthians", "galatians", "ephesians", "philippians",
  "colossians", "1-thessalonians", "2-thessalonians", "1-timothy", "2-timothy",
  "titus", "philemon", "hebrews", "james", "1-peter",
  "2-peter", "1-john", "2-john", "3-john", "jude",
  "revelation",
];

function decodeLocation(loc) {
  const verse = loc % 1_000_000;
  const chapter = Math.floor(loc / 1_000_000);
  return { chapter, verse };
}

const { total } = db.prepare("SELECT COUNT(*) as total FROM commentary").get();
console.log(`Total rows: ${total}`);

const rows = db.prepare("SELECT father_name, book, location_start, location_end, txt, source_title, source_url, ts, append_to_author_name FROM commentary").all();
db.close();

const grouped = {};
let skipped = 0;

for (const row of rows) {
  const bookIdx = BOOK_TO_INDEX[row.book];
  if (bookIdx === undefined) {
    skipped++;
    continue;
  }

  const start = decodeLocation(row.location_start);
  const end = decodeLocation(row.location_end);

  const bookName = INDEX_TO_NAME[bookIdx];
  const chapter = start.chapter;
  const key = `${bookName}/${chapter}`;

  if (!grouped[key]) grouped[key] = [];

  grouped[key].push({
    author: row.father_name,
    quote: row.txt || "",
    verseStart: start.verse,
    verseEnd: end.verse,
    sourceTitle: row.source_title || "",
    sourceUrl: row.source_url || "",
    year: row.ts || null,
    appendAuthor: row.append_to_author_name || "",
  });
}

// Write per-chapter JSON
fs.mkdirSync(OUT_DIR, { recursive: true });
let written = 0;

for (const [key, commentaries] of Object.entries(grouped)) {
  const filePath = path.join(OUT_DIR, `${key}.json`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(commentaries, null, 2), "utf-8");
  written++;
}

console.log(`Written: ${written} chapter files`);
console.log(`Skipped: ${skipped} rows (non-Protestant books)`);
console.log(`Total commentaries in output: ${Object.values(grouped).reduce((s, c) => s + c.length, 0)}`);
