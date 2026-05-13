import "server-only";

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data/library");

let _index = null;
let _bookCache = new Map();

export function getLibraryIndex() {
  if (!_index) {
    _index = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, "index.json"), "utf-8")
    );
  }
  return _index;
}

export function getTraditions() {
  const index = getLibraryIndex();
  return index.traditions || {};
}

export function getBooksByTradition(tradition) {
  const index = getLibraryIndex();
  if (tradition === "all") return index.books || [];
  return (index.books || []).filter((b) => b.tradition === tradition);
}

export function getBookMeta(bookId) {
  const index = getLibraryIndex();
  return (index.books || []).find((b) => b.id === bookId) || null;
}

export function getBookContent(bookId) {
  const meta = getBookMeta(bookId);
  if (!meta) return null;

  if (meta.source === "bible") {
    return { id: bookId, source: "bible", bibleIndex: meta.bibleIndex };
  }

  if (_bookCache.has(bookId)) {
    return _bookCache.get(bookId);
  }

  const filePath = path.join(DATA_DIR, "books", meta.tradition, `${bookId}.json`);
  if (!fs.existsSync(filePath)) return null;

  const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  _bookCache.set(bookId, content);
  return content;
}

export function searchLibrary(query, lang = "en") {
  const index = getLibraryIndex();
  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const book of index.books || []) {
    const title = typeof book.title === "string" ? book.title : (book.title?.[lang] || book.title?.en || "");
    if (title.toLowerCase().includes(lowerQuery)) {
      results.push({ ...book, matchType: "title" });
      continue;
    }

    const content = getBookContent(book.id);
    if (!content) continue;

    if (content.source === "bible") continue;

    const chapters = content.chapters || [];
    const sections = content.sections || [];

    let matched = false;

    for (let c = 0; c < chapters.length && !matched; c++) {
      for (const verse of chapters[c]) {
        if (typeof verse === "string" && verse.toLowerCase().includes(lowerQuery)) {
          results.push({
            ...book,
            matchType: "content",
            matchChapter: c + 1,
            matchExcerpt: verse.slice(0, 200),
          });
          matched = true;
          break;
        }
      }
    }

    if (matched) continue;

    for (const section of sections) {
      for (const para of (section.paragraphs || [])) {
        if (para.text && para.text.toLowerCase().includes(lowerQuery)) {
          results.push({
            ...book,
            matchType: "content",
            matchSection: section.heading,
            matchExcerpt: para.text.slice(0, 200),
          });
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  return results.slice(0, 50);
}

export function getBookChapter(bookId, chapter) {
  const content = getBookContent(bookId);
  if (!content || !content.chapters) return null;

  const chapterIdx = chapter - 1;
  if (chapterIdx < 0 || chapterIdx >= content.chapters.length) return null;

  const verses = content.chapters[chapterIdx].map((text, i) => ({
    num: i + 1,
    text,
  }));

  return {
    bookId,
    title: content.title,
    chapter,
    totalChapters: content.chapters.length,
    verses,
  };
}

export function getBookSection(bookId, sectionIdx) {
  const content = getBookContent(bookId);
  if (!content || !content.sections) return null;

  if (sectionIdx < 0 || sectionIdx >= content.sections.length) return null;

  return {
    bookId,
    title: content.title,
    sectionIdx,
    totalSections: content.sections.length,
    heading: content.sections[sectionIdx].heading,
    paragraphs: content.sections[sectionIdx].paragraphs,
  };
}
