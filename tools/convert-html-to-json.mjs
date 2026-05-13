import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const RAW_DIR = path.join(ROOT, "data/library/raw");
const OUT_DIR = path.join(ROOT, "data/library/books");

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(str) {
  return decodeEntities(str.replace(/<[^>]+>/g, "").trim());
}

/**
 * Parse a simple biblical HTML file.
 * Walks the HTML sequentially: <h2>=title, <h3>=new section, <p>=paragraph.
 * Within <p>, <strong>(N)</strong> extracts numbered items.
 */
function parseHtml(filePath, tradition) {
  const html = fs.readFileSync(filePath, "utf-8");
  const id = path.basename(filePath, ".html");

  // Extract <body> or use entire content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;

  // Tokenise: split on top-level block tags (h2, h3, p, hr)
  // We process sequentially by finding tag positions
  const tagRegex = /<\/?(h[23]|p|hr)\b[^>]*>/gi;
  const tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(body)) !== null) {
    const tag = match[0].replace(/<\/?/, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
    if (lastIndex < match.index) {
      tokens.push({ type: "text", content: body.slice(lastIndex, match.index) });
    }
    tokens.push({ type: match[0].startsWith("</") ? `close_${tag}` : tag, raw: match[0] });
    lastIndex = match.index + match[0].length;
  }

  let title = id.replace(/-/g, " ");
  const sections = [];
  let currentSection = { heading: null, paragraphs: [] };
  let insideH2 = false;
  let insideH3 = false;
  let insideP = false;
  let currentTagContent = "";
  let h3Heading = null;

  // Simpler approach: regex-extract h2, h3, and p blocks
  const h2Match = body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (h2Match) title = stripHtml(h2Match[1]);

  // Split body by <h3> sections
  const h3SplitRegex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  const h3s = [];
  let h3m;
  while ((h3m = h3SplitRegex.exec(body)) !== null) {
    h3s.push({ heading: stripHtml(h3m[1]), start: h3m.index + h3m[0].length });
  }

  // Extract all <p> blocks with their positions
  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs = [];
  let pm;
  while ((pm = pRegex.exec(body)) !== null) {
    paragraphs.push({ index: pm.index, text: stripHtml(pm[1]) });
  }

  if (h3s.length === 0) {
    // No H3 headings — single section
    const sectionParagraphs = paragraphs
      .map((p) => parseParagraph(p.text))
      .filter((p) => p.text.length > 0);
    if (sectionParagraphs.length > 0) {
      sections.push({ heading: null, paragraphs: sectionParagraphs });
    }
  } else {
    // Distribute paragraphs into H3-headed sections
    for (let i = 0; i < h3s.length; i++) {
      const nextStart = i + 1 < h3s.length ? h3s[i + 1].start : Infinity;
      const sectionParagraphs = paragraphs
        .filter((p) => p.index >= h3s[i].start && p.index < nextStart)
        .map((p) => parseParagraph(p.text))
        .filter((p) => p.text.length > 0);

      sections.push({ heading: h3s[i].heading, paragraphs: sectionParagraphs });
    }

    // Handle paragraphs before first H3
    if (h3s.length > 0) {
      const beforeFirst = paragraphs
        .filter((p) => p.index < h3s[0].start)
        .map((p) => parseParagraph(p.text))
        .filter((p) => p.text.length > 0);
      if (beforeFirst.length > 0) {
        sections.unshift({ heading: null, paragraphs: beforeFirst });
      }
    }
  }

  // Count total numbered items
  let totalNumbered = 0;
  for (const section of sections) {
    for (const p of section.paragraphs) {
      if (p.number !== null) totalNumbered++;
    }
  }

  const totalSections = totalNumbered > 0 ? totalNumbered : sections.reduce((sum, s) => sum + s.paragraphs.length, 0);

  return { id, title, tradition, totalSections, sections };
}

function parseParagraph(text) {
  // Extract leading number like (1) or (114) or 1.
  const numMatch = text.match(/^\s*\(?(\d+)\)?[\.\s]+/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const cleanText = text.slice(numMatch[0].length).trim();
    return { number: num, text: cleanText };
  }
  return { number: null, text };
}

function convertDirectory(tradition) {
  const srcDir = path.join(RAW_DIR, tradition);
  const outDir = path.join(OUT_DIR, tradition);
  fs.mkdirSync(outDir, { recursive: true });

  if (!fs.existsSync(srcDir)) {
    console.log(`  SKIP ${tradition} (no raw data)`);
    return [];
  }

  const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".html"));
  const entries = [];

  for (const file of files) {
    const filePath = path.join(srcDir, file);
    try {
      const data = parseHtml(filePath, tradition);
      const outPath = path.join(outDir, `${data.id}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
      entries.push(data);
      console.log(`  OK   ${tradition}/${data.id} (${data.sections.length} sections, ${data.totalSections} items)`);
    } catch (err) {
      console.error(`  FAIL ${tradition}/${file}: ${err.message}`);
    }
  }

  return entries;
}

const dssEntries = convertDirectory("dss");
const gnosticEntries = convertDirectory("gnostic");

console.log(`\nConverted: ${dssEntries.length + gnosticEntries.length} books`);
