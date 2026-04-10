/**
 * Bible utility — parses references and looks up verses
 * Data source: MaatheusGois/bible (MIT) — ACF (PT), KJV (EN), RVR (ES)
 * All translations are public domain.
 * SERVER-ONLY: never import this in client components.
 */
import "server-only";

import ptBible from "@/data/bible/pt.json";
import enBible from "@/data/bible/en.json";
import esBible from "@/data/bible/es.json";

const BIBLES = { pt: ptBible, en: enBible, es: esBible };

// Book aliases → 0-based index. Covers PT/EN/ES full names + common abbreviations.
const BOOK_ALIASES = {
  // 0 — Genesis
  "genesis": 0, "gênesis": 0, "génesis": 0, "gn": 0, "gen": 0,
  // 1 — Exodus
  "exodus": 1, "êxodo": 1, "exodo": 1, "éxodo": 1, "ex": 1, "exo": 1,
  // 2 — Leviticus
  "leviticus": 2, "levítico": 2, "levitico": 2, "levíticos": 2, "lv": 2, "lev": 2,
  // 3 — Numbers
  "numbers": 3, "números": 3, "numeros": 3, "nm": 3, "num": 3,
  // 4 — Deuteronomy
  "deuteronomy": 4, "deuteronômio": 4, "deuteronomio": 4, "dt": 4, "deu": 4,
  // 5 — Joshua
  "joshua": 5, "josué": 5, "josue": 5, "js": 5, "jos": 5,
  // 6 — Judges
  "judges": 6, "juízes": 6, "juizes": 6, "jueces": 6, "jz": 6, "jud": 6,
  // 7 — Ruth
  "ruth": 7, "rute": 7, "rut": 7, "rt": 7,
  // 8 — 1 Samuel
  "1 samuel": 8, "1samuel": 8, "1sm": 8, "1sa": 8,
  // 9 — 2 Samuel
  "2 samuel": 9, "2samuel": 9, "2sm": 9, "2sa": 9,
  // 10 — 1 Kings
  "1 kings": 10, "1kings": 10, "1 reis": 10, "1reis": 10, "1 reyes": 10, "1reyes": 10, "1kgs": 10, "1re": 10,
  // 11 — 2 Kings
  "2 kings": 11, "2kings": 11, "2 reis": 11, "2reis": 11, "2 reyes": 11, "2reyes": 11, "2kgs": 11, "2re": 11,
  // 12 — 1 Chronicles
  "1 chronicles": 12, "1chronicles": 12, "1 crônicas": 12, "1cronicas": 12, "1 crónicas": 12, "1ch": 12, "1cr": 12,
  // 13 — 2 Chronicles
  "2 chronicles": 13, "2chronicles": 13, "2 crônicas": 13, "2cronicas": 13, "2 crónicas": 13, "2ch": 13, "2cr": 13,
  // 14 — Ezra
  "ezra": 14, "esdras": 14, "ezr": 14, "ed": 14,
  // 15 — Nehemiah
  "nehemiah": 15, "neemias": 15, "nehemías": 15, "ne": 15, "neh": 15,
  // 16 — Esther
  "esther": 16, "ester": 16, "et": 16, "est": 16,
  // 17 — Job
  "job": 17, "jó": 17, "jo": 17, "jb": 17,
  // 18 — Psalms
  "psalms": 18, "psalm": 18, "salmos": 18, "salmo": 18, "ps": 18, "sl": 18, "sal": 18,
  // 19 — Proverbs
  "proverbs": 19, "provérbios": 19, "proverbios": 19, "pv": 19, "prv": 19, "pro": 19,
  // 20 — Ecclesiastes
  "ecclesiastes": 20, "eclesiastes": 20, "eclesiastés": 20, "ec": 20, "ecl": 20,
  // 21 — Song of Solomon
  "song of solomon": 21, "song of songs": 21, "cânticos": 21, "canticos": 21, "cantares": 21, "ct": 21, "so": 21,
  // 22 — Isaiah
  "isaiah": 22, "isaías": 22, "isaias": 22, "is": 22, "isa": 22,
  // 23 — Jeremiah
  "jeremiah": 23, "jeremias": 23, "jr": 23, "jer": 23,
  // 24 — Lamentations
  "lamentations": 24, "lamentações": 24, "lamentaciones": 24, "lm": 24, "lam": 24,
  // 25 — Ezekiel
  "ezekiel": 25, "ezequiel": 25, "ez": 25, "eze": 25,
  // 26 — Daniel
  "daniel": 26, "dn": 26, "dan": 26,
  // 27 — Hosea
  "hosea": 27, "oséias": 27, "oseias": 27, "oseas": 27, "ho": 27, "os": 27,
  // 28 — Joel
  "joel": 28, "jl": 28,
  // 29 — Amos
  "amos": 29, "amós": 29, "am": 29,
  // 30 — Obadiah
  "obadiah": 30, "obadias": 30, "abdías": 30, "ob": 30,
  // 31 — Jonah
  "jonah": 31, "jonas": 31, "jonás": 31, "jn": 31, "jon": 31,
  // 32 — Micah
  "micah": 32, "miquéias": 32, "miqueias": 32, "miqueas": 32, "mi": 32, "mic": 32,
  // 33 — Nahum
  "nahum": 33, "naum": 33, "na": 33, "nah": 33,
  // 34 — Habakkuk
  "habakkuk": 34, "habacuque": 34, "habacuc": 34, "hc": 34, "hab": 34,
  // 35 — Zephaniah
  "zephaniah": 35, "sofonias": 35, "sofonías": 35, "sf": 35, "zph": 35, "zep": 35,
  // 36 — Haggai
  "haggai": 36, "ageu": 36, "ageo": 36, "ag": 36, "hag": 36,
  // 37 — Zechariah
  "zechariah": 37, "zacarias": 37, "zacarías": 37, "zc": 37, "zec": 37,
  // 38 — Malachi
  "malachi": 38, "malaquias": 38, "malaquías": 38, "ml": 38, "mal": 38,
  // 39 — Matthew
  "matthew": 39, "mateus": 39, "mateo": 39, "mt": 39, "mat": 39,
  // 40 — Mark
  "mark": 40, "marcos": 40, "mc": 40, "mk": 40, "mar": 40,
  // 41 — Luke
  "luke": 41, "lucas": 41, "lc": 41, "lk": 41, "luc": 41,
  // 42 — John
  "john": 42, "joão": 42, "joao": 42, "juan": 42, "jo": 42,
  // 43 — Acts
  "acts": 43, "atos": 43, "hechos": 43, "at": 43, "act": 43,
  // 44 — Romans
  "romans": 44, "romanos": 44, "rm": 44, "rom": 44,
  // 45 — 1 Corinthians
  "1 corinthians": 45, "1corinthians": 45, "1 coríntios": 45, "1corintios": 45, "1 corintios": 45, "1co": 45, "1cor": 45,
  // 46 — 2 Corinthians
  "2 corinthians": 46, "2corinthians": 46, "2 coríntios": 46, "2corintios": 46, "2 corintios": 46, "2co": 46, "2cor": 46,
  // 47 — Galatians
  "galatians": 47, "gálatas": 47, "galatas": 47, "gl": 47, "gal": 47,
  // 48 — Ephesians
  "ephesians": 48, "efésios": 48, "efesios": 48, "ef": 48, "eph": 48,
  // 49 — Philippians
  "philippians": 49, "filipenses": 49, "fl": 49, "fp": 49, "fil": 49, "php": 49,
  // 50 — Colossians
  "colossians": 50, "colossenses": 50, "colosenses": 50, "cl": 50, "col": 50,
  // 51 — 1 Thessalonians
  "1 thessalonians": 51, "1thessalonians": 51, "1 tessalonicenses": 51, "1 tesalonicenses": 51, "1ts": 51, "1tes": 51, "1th": 51,
  // 52 — 2 Thessalonians
  "2 thessalonians": 52, "2thessalonians": 52, "2 tessalonicenses": 52, "2 tesalonicenses": 52, "2ts": 52, "2tes": 52, "2th": 52,
  // 53 — 1 Timothy
  "1 timothy": 53, "1timothy": 53, "1 timóteo": 53, "1 timoteo": 53, "1tm": 53, "1ti": 53, "1tim": 53,
  // 54 — 2 Timothy
  "2 timothy": 54, "2timothy": 54, "2 timóteo": 54, "2 timoteo": 54, "2tm": 54, "2ti": 54, "2tim": 54,
  // 55 — Titus
  "titus": 55, "tito": 55, "tt": 55, "tit": 55,
  // 56 — Philemon
  "philemon": 56, "filemom": 56, "filemón": 56, "fm": 56, "phm": 56,
  // 57 — Hebrews
  "hebrews": 57, "hebreus": 57, "hebreos": 57, "hb": 57, "heb": 57,
  // 58 — James
  "james": 58, "tiago": 58, "santiago": 58, "tg": 58, "jm": 58, "jas": 58,
  // 59 — 1 Peter
  "1 peter": 59, "1peter": 59, "1 pedro": 59, "1pe": 59, "1pt": 59,
  // 60 — 2 Peter
  "2 peter": 60, "2peter": 60, "2 pedro": 60, "2pe": 60, "2pt": 60,
  // 61 — 1 John
  "1 john": 61, "1john": 61, "1 joão": 61, "1joao": 61, "1 juan": 61, "1jo": 61, "1jn": 61,
  // 62 — 2 John
  "2 john": 62, "2john": 62, "2 joão": 62, "2joao": 62, "2 juan": 62, "2jo": 62, "2jn": 62,
  // 63 — 3 John
  "3 john": 63, "3john": 63, "3 joão": 63, "3joao": 63, "3 juan": 63, "3jo": 63, "3jn": 63,
  // 64 — Jude
  "jude": 64, "judas": 64, "jd": 64, "jud2": 64,
  // 65 — Revelation
  "revelation": 65, "revelations": 65, "apocalipse": 65, "apocalipsis": 65, "ap": 65, "rv": 65, "rev": 65,
};

/**
 * Parse a reference string into components.
 * Handles: "João 3:16", "João 3:16-18", "Salmos 23", "1Co 13:4-7", "Gn 1"
 * Returns null if the reference cannot be parsed.
 */
export function parseRef(ref) {
  if (!ref || typeof ref !== "string") return null;

  // Normalize: trim, collapse whitespace
  const s = ref.trim().replace(/\s+/g, " ");

  // Regex: optional leading number (e.g. "1 Coríntios"), then book name, then chapter, optional :verse[-verse]
  const match = s.match(
    /^(\d\s*)?([a-záàâãéèêíïóôõúüçñÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇÑA-Z][a-záàâãéèêíïóôõúüçñÁÀÂÃÉÈÊÍÏÓÔÕÚÜÇÑA-Z\s]*?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i
  );
  if (!match) return null;

  const bookRaw = ((match[1] || "").replace(/\s/, "") + match[2]).trim();
  const chapter = parseInt(match[3], 10);
  const verseStart = match[4] ? parseInt(match[4], 10) : null;
  const verseEnd = match[5] ? parseInt(match[5], 10) : verseStart;

  const bookIdx = BOOK_ALIASES[bookRaw.toLowerCase()];
  if (bookIdx === undefined) return null;

  return { bookIdx, chapter, verseStart, verseEnd };
}

/**
 * Fetch verses from the in-memory Bible data.
 * Returns { bookName, chapter, verses: [{ num, text }] } or null.
 */
export function getVerses(lang, bookIdx, chapter, verseStart = null, verseEnd = null) {
  const bible = BIBLES[lang] || BIBLES.pt;
  const book = bible[bookIdx];
  if (!book) return null;

  const chapterData = book.chapters[chapter - 1];
  if (!chapterData) return null;

  let verses;
  if (verseStart === null) {
    // Full chapter
    verses = chapterData.map((text, i) => ({ num: i + 1, text }));
  } else {
    const start = Math.max(1, verseStart);
    const end = Math.min(chapterData.length, verseEnd || verseStart);
    verses = [];
    for (let v = start; v <= end; v++) {
      const text = chapterData[v - 1];
      if (text) verses.push({ num: v, text });
    }
  }

  return { bookName: book.name, chapter, verses };
}

/**
 * High-level lookup: takes a ref string and language, returns result or null.
 */
export function lookupRef(ref, lang = "pt") {
  const parsed = parseRef(ref);
  if (!parsed) return null;
  const { bookIdx, chapter, verseStart, verseEnd } = parsed;
  return getVerses(lang, bookIdx, chapter, verseStart, verseEnd);
}
