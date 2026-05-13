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

const PROTESTANT_BOOK_NAMES = {
  pt: [
    "Gênesis", "Êxodo", "Levítico", "Números", "Deuteronômio",
    "Josué", "Juízes", "Rute", "1 Samuel", "2 Samuel",
    "1 Reis", "2 Reis", "1 Crônicas", "2 Crônicas", "Esdras",
    "Neemias", "Ester", "Jó", "Salmos", "Provérbios",
    "Eclesiastes", "Cânticos", "Isaías", "Jeremias", "Lamentações",
    "Ezequiel", "Daniel", "Oséias", "Joel", "Amós",
    "Obadias", "Jonas", "Miquéias", "Naum", "Habacuque",
    "Sofonias", "Ageu", "Zacarias", "Malaquias", "Mateus",
    "Marcos", "Lucas", "João", "Atos", "Romanos",
    "1 Coríntios", "2 Coríntios", "Gálatas", "Efésios", "Filipenses",
    "Colossenses", "1 Tessalonicenses", "2 Tessalonicenses", "1 Timóteo", "2 Timóteo",
    "Tito", "Filemom", "Hebreus", "Tiago", "1 Pedro",
    "2 Pedro", "1 João", "2 João", "3 João", "Judas",
    "Apocalipse",
  ],
  en: [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
    "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
    "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
    "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew",
    "Mark", "Luke", "John", "Acts", "Romans",
    "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
    "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy",
    "Titus", "Philemon", "Hebrews", "James", "1 Peter",
    "2 Peter", "1 John", "2 John", "3 John", "Jude",
    "Revelation",
  ],
  es: [
    "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio",
    "Josué", "Jueces", "Rut", "1 Samuel", "2 Samuel",
    "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras",
    "Nehemías", "Ester", "Job", "Salmos", "Proverbios",
    "Eclesiastés", "Cantares", "Isaías", "Jeremías", "Lamentaciones",
    "Ezequiel", "Daniel", "Oseas", "Joel", "Amós",
    "Abdías", "Jonás", "Miqueas", "Nahúm", "Habacuc",
    "Sofonías", "Ageo", "Zacarías", "Malaquías", "Mateo",
    "Marcos", "Lucas", "Juan", "Hechos", "Romanos",
    "1 Corintios", "2 Corintios", "Gálatas", "Efesios", "Filipenses",
    "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses", "1 Timoteo", "2 Timoteo",
    "Tito", "Filemón", "Hebreos", "Santiago", "1 Pedro",
    "2 Pedro", "1 Juan", "2 Juan", "3 Juan", "Judas",
    "Apocalipsis",
  ],
};

let _chapterCache = new Map();
let _bookCountCache = null;

export function invalidateCommentaryCache() {
  _chapterCache = new Map();
  _bookCountCache = null;
}

export function getBookNameByIdx(bookIdx) {
  return BOOK_NAME_BY_INDEX[bookIdx] || null;
}

export { BOOK_NAME_BY_INDEX, PROTESTANT_BOOK_NAMES };

export function getCommentaryBookList() {
  if (_bookCountCache) return _bookCountCache;

  if (!fs.existsSync(DATA_DIR)) return [];

  const result = [];
  for (let i = 0; i < BOOK_NAME_BY_INDEX.length; i++) {
    const bookName = BOOK_NAME_BY_INDEX[i];
    const dirPath = path.join(DATA_DIR, bookName);
    if (!fs.existsSync(dirPath)) continue;

    const chapters = fs.readdirSync(dirPath).filter(f => f.endsWith(".json"));
    let totalCommentaries = 0;
    let uniqueAuthors = new Set();

    for (const file of chapters) {
      const data = JSON.parse(fs.readFileSync(path.join(dirPath, file), "utf-8"));
      totalCommentaries += data.length;
      for (const c of data) {
        if (c.author) uniqueAuthors.add(c.author);
      }
    }

    result.push({
      bibleIndex: i,
      title: {
        pt: PROTESTANT_BOOK_NAMES.pt[i],
        en: PROTESTANT_BOOK_NAMES.en[i],
        es: PROTESTANT_BOOK_NAMES.es[i],
      },
      testament: i < 39 ? "OT" : "NT",
      chapterCount: chapters.length,
      commentaryCount: totalCommentaries,
      authorCount: uniqueAuthors.size,
    });
  }

  _bookCountCache = result;
  return result;
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
