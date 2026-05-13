import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const BOOKS_DIR = path.join(ROOT, "data/library/books");
const OUT_PATH = path.join(ROOT, "data/library/index.json");

const TRADITIONS = {
  protestant: {
    label: { pt: "Cânon Protestante", en: "Protestant Canon", es: "Canon Protestante" },
    color: "#2ecc71",
    icon: "book-open",
  },
  deuterocanonical: {
    label: { pt: "Deuterocanônico", en: "Deuterocanonical", es: "Deuterocanónico" },
    color: "#9370DB",
    icon: "scroll",
  },
  dss: {
    label: { pt: "Manuscritos do Mar Morto", en: "Dead Sea Scrolls", es: "Manuscritos del Mar Muerto" },
    color: "#00BFFF",
    icon: "scroll-text",
  },
  gnostic: {
    label: { pt: "Gnósticos e Cristãos Primitivos", en: "Gnostic & Early Christian", es: "Gnósticos y Cristianos Primitivos" },
    color: "#ff4444",
    icon: "book-marked",
  },
};

const PROTESTANT_BOOKS = [
  { id: "genesis", idx: 0, name: { pt: "Gênesis", en: "Genesis", es: "Génesis" }, chapters: 50, testament: "OT" },
  { id: "exodus", idx: 1, name: { pt: "Êxodo", en: "Exodus", es: "Éxodo" }, chapters: 40, testament: "OT" },
  { id: "leviticus", idx: 2, name: { pt: "Levítico", en: "Leviticus", es: "Levítico" }, chapters: 27, testament: "OT" },
  { id: "numbers", idx: 3, name: { pt: "Números", en: "Numbers", es: "Números" }, chapters: 36, testament: "OT" },
  { id: "deuteronomy", idx: 4, name: { pt: "Deuteronômio", en: "Deuteronomy", es: "Deuteronomio" }, chapters: 34, testament: "OT" },
  { id: "joshua", idx: 5, name: { pt: "Josué", en: "Joshua", es: "Josué" }, chapters: 24, testament: "OT" },
  { id: "judges", idx: 6, name: { pt: "Juízes", en: "Judges", es: "Jueces" }, chapters: 21, testament: "OT" },
  { id: "ruth", idx: 7, name: { pt: "Rute", en: "Ruth", es: "Rut" }, chapters: 4, testament: "OT" },
  { id: "1samuel", idx: 8, name: { pt: "1 Samuel", en: "1 Samuel", es: "1 Samuel" }, chapters: 31, testament: "OT" },
  { id: "2samuel", idx: 9, name: { pt: "2 Samuel", en: "2 Samuel", es: "2 Samuel" }, chapters: 24, testament: "OT" },
  { id: "1kings", idx: 10, name: { pt: "1 Reis", en: "1 Kings", es: "1 Reyes" }, chapters: 22, testament: "OT" },
  { id: "2kings", idx: 11, name: { pt: "2 Reis", en: "2 Kings", es: "2 Reyes" }, chapters: 25, testament: "OT" },
  { id: "1chronicles", idx: 12, name: { pt: "1 Crônicas", en: "1 Chronicles", es: "1 Crónicas" }, chapters: 29, testament: "OT" },
  { id: "2chronicles", idx: 13, name: { pt: "2 Crônicas", en: "2 Chronicles", es: "2 Crónicas" }, chapters: 36, testament: "OT" },
  { id: "ezra", idx: 14, name: { pt: "Esdras", en: "Ezra", es: "Esdras" }, chapters: 10, testament: "OT" },
  { id: "nehemiah", idx: 15, name: { pt: "Neemias", en: "Nehemiah", es: "Nehemías" }, chapters: 13, testament: "OT" },
  { id: "esther", idx: 16, name: { pt: "Ester", en: "Esther", es: "Ester" }, chapters: 10, testament: "OT" },
  { id: "job", idx: 17, name: { pt: "Jó", en: "Job", es: "Job" }, chapters: 42, testament: "OT" },
  { id: "psalms", idx: 18, name: { pt: "Salmos", en: "Psalms", es: "Salmos" }, chapters: 150, testament: "OT" },
  { id: "proverbs", idx: 19, name: { pt: "Provérbios", en: "Proverbs", es: "Proverbios" }, chapters: 31, testament: "OT" },
  { id: "ecclesiastes", idx: 20, name: { pt: "Eclesiastes", en: "Ecclesiastes", es: "Eclesiastés" }, chapters: 12, testament: "OT" },
  { id: "song-of-solomon", idx: 21, name: { pt: "Cânticos", en: "Song of Solomon", es: "Cantares" }, chapters: 8, testament: "OT" },
  { id: "isaiah", idx: 22, name: { pt: "Isaías", en: "Isaiah", es: "Isaías" }, chapters: 66, testament: "OT" },
  { id: "jeremiah", idx: 23, name: { pt: "Jeremias", en: "Jeremiah", es: "Jeremías" }, chapters: 52, testament: "OT" },
  { id: "lamentations", idx: 24, name: { pt: "Lamentações", en: "Lamentations", es: "Lamentaciones" }, chapters: 5, testament: "OT" },
  { id: "ezekiel", idx: 25, name: { pt: "Ezequiel", en: "Ezekiel", es: "Ezequiel" }, chapters: 48, testament: "OT" },
  { id: "daniel", idx: 26, name: { pt: "Daniel", en: "Daniel", es: "Daniel" }, chapters: 12, testament: "OT" },
  { id: "hosea", idx: 27, name: { pt: "Oséias", en: "Hosea", es: "Oseas" }, chapters: 14, testament: "OT" },
  { id: "joel", idx: 28, name: { pt: "Joel", en: "Joel", es: "Joel" }, chapters: 3, testament: "OT" },
  { id: "amos", idx: 29, name: { pt: "Amós", en: "Amos", es: "Amós" }, chapters: 9, testament: "OT" },
  { id: "obadiah", idx: 30, name: { pt: "Obadias", en: "Obadiah", es: "Abdías" }, chapters: 1, testament: "OT" },
  { id: "jonah", idx: 31, name: { pt: "Jonas", en: "Jonah", es: "Jonás" }, chapters: 4, testament: "OT" },
  { id: "micah", idx: 32, name: { pt: "Miquéias", en: "Micah", es: "Miqueas" }, chapters: 7, testament: "OT" },
  { id: "nahum", idx: 33, name: { pt: "Naum", en: "Nahum", es: "Nahúm" }, chapters: 3, testament: "OT" },
  { id: "habakkuk", idx: 34, name: { pt: "Habacuque", en: "Habakkuk", es: "Habacuc" }, chapters: 3, testament: "OT" },
  { id: "zephaniah", idx: 35, name: { pt: "Sofonias", en: "Zephaniah", es: "Sofonías" }, chapters: 3, testament: "OT" },
  { id: "haggai", idx: 36, name: { pt: "Ageu", en: "Haggai", es: "Ageo" }, chapters: 2, testament: "OT" },
  { id: "zechariah", idx: 37, name: { pt: "Zacarias", en: "Zechariah", es: "Zacarías" }, chapters: 14, testament: "OT" },
  { id: "malachi", idx: 38, name: { pt: "Malaquias", en: "Malachi", es: "Malaquías" }, chapters: 4, testament: "OT" },
  { id: "matthew", idx: 39, name: { pt: "Mateus", en: "Matthew", es: "Mateo" }, chapters: 28, testament: "NT" },
  { id: "mark", idx: 40, name: { pt: "Marcos", en: "Mark", es: "Marcos" }, chapters: 16, testament: "NT" },
  { id: "luke", idx: 41, name: { pt: "Lucas", en: "Luke", es: "Lucas" }, chapters: 24, testament: "NT" },
  { id: "john", idx: 42, name: { pt: "João", en: "John", es: "Juan" }, chapters: 21, testament: "NT" },
  { id: "acts", idx: 43, name: { pt: "Atos", en: "Acts", es: "Hechos" }, chapters: 28, testament: "NT" },
  { id: "romans", idx: 44, name: { pt: "Romanos", en: "Romans", es: "Romanos" }, chapters: 16, testament: "NT" },
  { id: "1corinthians", idx: 45, name: { pt: "1 Coríntios", en: "1 Corinthians", es: "1 Corintios" }, chapters: 16, testament: "NT" },
  { id: "2corinthians", idx: 46, name: { pt: "2 Coríntios", en: "2 Corinthians", es: "2 Corintios" }, chapters: 13, testament: "NT" },
  { id: "galatians", idx: 47, name: { pt: "Gálatas", en: "Galatians", es: "Gálatas" }, chapters: 6, testament: "NT" },
  { id: "ephesians", idx: 48, name: { pt: "Efésios", en: "Ephesians", es: "Efesios" }, chapters: 6, testament: "NT" },
  { id: "philippians", idx: 49, name: { pt: "Filipenses", en: "Philippians", es: "Filipenses" }, chapters: 4, testament: "NT" },
  { id: "colossians", idx: 50, name: { pt: "Colossenses", en: "Colossians", es: "Colosenses" }, chapters: 4, testament: "NT" },
  { id: "1thessalonians", idx: 51, name: { pt: "1 Tessalonicenses", en: "1 Thessalonians", es: "1 Tesalonicenses" }, chapters: 5, testament: "NT" },
  { id: "2thessalonians", idx: 52, name: { pt: "2 Tessalonicenses", en: "2 Thessalonians", es: "2 Tesalonicenses" }, chapters: 3, testament: "NT" },
  { id: "1timothy", idx: 53, name: { pt: "1 Timóteo", en: "1 Timothy", es: "1 Timoteo" }, chapters: 6, testament: "NT" },
  { id: "2timothy", idx: 54, name: { pt: "2 Timóteo", en: "2 Timothy", es: "2 Timoteo" }, chapters: 4, testament: "NT" },
  { id: "titus", idx: 55, name: { pt: "Tito", en: "Titus", es: "Tito" }, chapters: 3, testament: "NT" },
  { id: "philemon", idx: 56, name: { pt: "Filemom", en: "Philemon", es: "Filemón" }, chapters: 1, testament: "NT" },
  { id: "hebrews", idx: 57, name: { pt: "Hebreus", en: "Hebrews", es: "Hebreos" }, chapters: 13, testament: "NT" },
  { id: "james", idx: 58, name: { pt: "Tiago", en: "James", es: "Santiago" }, chapters: 5, testament: "NT" },
  { id: "1peter", idx: 59, name: { pt: "1 Pedro", en: "1 Peter", es: "1 Pedro" }, chapters: 5, testament: "NT" },
  { id: "2peter", idx: 60, name: { pt: "2 Pedro", en: "2 Peter", es: "2 Pedro" }, chapters: 3, testament: "NT" },
  { id: "1john", idx: 61, name: { pt: "1 João", en: "1 John", es: "1 Juan" }, chapters: 5, testament: "NT" },
  { id: "2john", idx: 62, name: { pt: "2 João", en: "2 John", es: "2 Juan" }, chapters: 1, testament: "NT" },
  { id: "3john", idx: 63, name: { pt: "3 João", en: "3 John", es: "3 Juan" }, chapters: 1, testament: "NT" },
  { id: "jude", idx: 64, name: { pt: "Judas", en: "Jude", es: "Judas" }, chapters: 1, testament: "NT" },
  { id: "revelation", idx: 65, name: { pt: "Apocalipse", en: "Revelation", es: "Apocalipsis" }, chapters: 22, testament: "NT" },
];

function buildIndex() {
  const index = [];
  const traditions = {};

  // Protestant books — link to Bible module
  for (const book of PROTESTANT_BOOKS) {
    index.push({
      id: book.id,
      title: book.name,
      tradition: "protestant",
      testament: book.testament,
      bibleIndex: book.idx,
      totalChapters: book.chapters,
      sectionType: "chapter",
      source: "bible",
    });
  }

  // Non-Protestant books — from generated JSON files
  for (const tradition of Object.keys(TRADITIONS).filter((t) => t !== "protestant")) {
    const dir = path.join(BOOKS_DIR, tradition);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const bookPath = path.join(dir, file);
      try {
        const book = JSON.parse(fs.readFileSync(bookPath, "utf-8"));
        index.push({
          id: book.id,
          title: { en: book.title },
          tradition: book.tradition,
          totalChapters: book.totalChapters || book.totalSections || 0,
          sectionType: book.chapters ? "chapter" : "section",
          source: "library",
        });
      } catch (err) {
        console.error(`  SKIP ${tradition}/${file}: ${err.message}`);
      }
    }
  }

  // Build tradition summary
  for (const [key, meta] of Object.entries(TRADITIONS)) {
    const books = index.filter((b) => b.tradition === key);
    if (books.length > 0) {
      traditions[key] = { ...meta, count: books.length };
    }
  }

  const output = { traditions, books: index };
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\nIndex generated: ${index.length} books, ${Object.keys(traditions).length} traditions`);
}

buildIndex();
