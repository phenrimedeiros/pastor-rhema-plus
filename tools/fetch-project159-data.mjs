import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "data/library/raw");

const BASE = "https://raw.githubusercontent.com/Ringmast4r/PROJECT-159/main";

const SOURCES = [
  { url: `${BASE}/data/bible-text/deuterocanonical-texts.json`, dest: "deuterocanonical-texts.json" },
];

const DSS_FILES = [
  "community-rule.html",
  "war-scroll.html",
  "temple-scroll.html",
  "damascus-document.html",
  "thanksgiving-hymns.html",
  "pesher-habakkuk.html",
  "genesis-apocryphon.html",
  "book-of-giants.html",
  "copper-scroll.html",
  "songs-sabbath-sacrifice.html",
];

const GNOSTIC_FILES = [
  "gospel-of-thomas.html",
  "gospel-of-judas.html",
  "gospel-of-mary.html",
  "gospel-of-peter.html",
  "gospel-of-philip.html",
  "gospel-of-truth.html",
  "gospel-of-nicodemus.html",
  "gospel-of-hebrews.html",
  "gospel-of-egyptians.html",
  "infancy-gospel-thomas.html",
  "protoevangelium-james.html",
  "secret-gospel-mark.html",
  "apocryphon-of-john.html",
  "sophia-jesus-christ.html",
  "pistis-sophia.html",
  "dialogue-savior.html",
  "book-thomas-contender.html",
  "didache.html",
  "epistle-barnabas.html",
  "acts-paul-thecla.html",
  "apocalypse-abraham.html",
  "testament-abraham.html",
  "testament-job.html",
  "assumption-moses.html",
  "4-ezra.html",
  "3-maccabees.html",
  "4-maccabees.html",
  "psalms-solomon.html",
];

for (const file of DSS_FILES) {
  SOURCES.push({ url: `${BASE}/data/dead-sea-scrolls/${file}`, dest: `dss/${file}` });
}

for (const file of GNOSTIC_FILES) {
  SOURCES.push({ url: `${BASE}/data/gnostic/${file}`, dest: `gnostic/${file}` });
}

fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(path.join(RAW_DIR, "dss"), { recursive: true });
fs.mkdirSync(path.join(RAW_DIR, "gnostic"), { recursive: true });

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const { url, dest } of SOURCES) {
  const filePath = path.join(RAW_DIR, dest);
  if (fs.existsSync(filePath)) {
    skipped++;
    continue;
  }
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  FAIL ${res.status} ${url}`);
      failed++;
      continue;
    }
    const text = await res.text();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, text, "utf-8");
    downloaded++;
    console.log(`  OK   ${dest}`);
  } catch (err) {
    console.error(`  ERR  ${url}: ${err.message}`);
    failed++;
  }
}

console.log(`\nDownloaded: ${downloaded}  Skipped: ${skipped}  Failed: ${failed}`);
