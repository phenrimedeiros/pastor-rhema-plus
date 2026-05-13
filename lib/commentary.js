import "server-only";

import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data/commentary");

const BOOK_NAME_BY_INDEX = [
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

let _chapterCache = new Map();

export function getBookNameByIdx(bookIdx) {
  return BOOK_NAME_BY_INDEX[bookIdx] || null;
}

export function getCommentariesForChapter(bookIdx, chapter) {
  const bookName = BOOK_NAME_BY_INDEX[bookIdx];
  if (!bookName) return [];

  const cacheKey = `${bookIdx}_${chapter}`;
  if (_chapterCache.has(cacheKey)) return _chapterCache.get(cacheKey);

  const filePath = path.join(DATA_DIR, bookName, `${chapter}.json`);
  if (!fs.existsSync(filePath)) return [];

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  _chapterCache.set(cacheKey, data);
  return data;
}

export function getCommentariesForVerse(bookIdx, chapter, verse) {
  const all = getCommentariesForChapter(bookIdx, chapter);
  return all.filter(
    (c) => c.verseStart <= verse && c.verseEnd >= verse
  );
}

export function getCommentariesForVerseRange(bookIdx, chapter, verseStart, verseEnd) {
  const all = getCommentariesForChapter(bookIdx, chapter);
  return all.filter(
    (c) => c.verseStart <= verseEnd && c.verseEnd >= verseStart
  );
}

export function hasCommentaries(bookIdx) {
  const bookName = BOOK_NAME_BY_INDEX[bookIdx];
  if (!bookName) return false;
  const dirPath = path.join(DATA_DIR, bookName);
  return fs.existsSync(dirPath) && fs.readdirSync(dirPath).length > 0;
}
