import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "data/commentary/raw");

const RELEASE_URL = "https://github.com/HistoricalChristianFaith/Commentaries-Database/releases/download/latest/commentaries.sqlite";
const OUT_PATH = path.join(RAW_DIR, "commentaries.sqlite");

fs.mkdirSync(RAW_DIR, { recursive: true });

if (fs.existsSync(OUT_PATH)) {
  console.log("SKIP — commentaries.sqlite already downloaded.");
  process.exit(0);
}

console.log("Downloading commentaries.sqlite (125 MB)...");
const res = await fetch(RELEASE_URL);
if (!res.ok) {
  console.error(`FAIL HTTP ${res.status}: ${res.statusText}`);
  process.exit(1);
}

const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB chunks
const totalSize = parseInt(res.headers.get("content-length") || "0", 10);
let downloaded = 0;
const fileStream = fs.createWriteStream(OUT_PATH);

const reader = res.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  fileStream.write(value);
  downloaded += value.length;
  if (totalSize > 0) {
    const pct = Math.round((downloaded / totalSize) * 100);
    process.stdout.write(`\r  ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} MB)`);
  }
}

fileStream.end();
console.log("\nDone — commentaries.sqlite downloaded.");
