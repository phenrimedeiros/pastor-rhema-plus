"use client";

import { useCallback, useEffect, useRef, useState, startTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "@/lib/supabase_client";
import AppLayout from "@/components/AppLayout";
import { loadFullState } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";

// ─── helpers ─────────────────────────────────────────────────────────────────

async function fetchBooks(lang) {
  const res = await fetch(`/api/bible/books?lang=${lang}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.books || [];
}

async function fetchChapter(lang, bookIdx, chapter) {
  const res = await fetch(`/api/bible/chapter?lang=${lang}&book=${bookIdx}&chapter=${chapter}`);
  if (!res.ok) return null;
  return res.json();
}

// ─── Book selector overlay ────────────────────────────────────────────────────

function BookSelector({ books, selectedIdx, onSelect, onClose, t }) {
  const [tab, setTab] = useState(selectedIdx < 39 ? "OT" : "NT");
  const [query, setQuery] = useState("");

  const filtered = books.filter((b) =>
    b.testament === tab &&
    b.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-t-[28px] md:rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-[20px] pt-[20px] pb-[14px] border-b border-slate-100">
          <h3 className="m-0 text-[18px] font-serif text-brand-primary">{t("bible_select_book")}</h3>
          <button
            onClick={onClose}
            className="grid h-[32px] w-[32px] place-items-center rounded-full bg-slate-100 text-slate-500 text-[18px] font-bold border-none cursor-pointer hover:bg-slate-200 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-[16px] pt-[12px] pb-[8px]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar livro…"
            className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-[12px] py-[8px] text-[14px] font-sans outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>

        {/* AT / NT tabs */}
        <div className="flex gap-[8px] px-[16px] pb-[10px]">
          {["OT", "NT"].map((t_val) => (
            <button
              key={t_val}
              onClick={() => { setTab(t_val); setQuery(""); }}
              className={`flex-1 rounded-[10px] border-none py-[8px] text-[13px] font-bold transition-colors cursor-pointer ${
                tab === t_val
                  ? "bg-brand-primary text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {t_val === "OT" ? t("bible_ot") : t("bible_nt")}
            </button>
          ))}
        </div>

        {/* Book grid */}
        <div className="overflow-y-auto px-[16px] pb-[20px]">
          <div className="grid grid-cols-2 gap-[6px]">
            {filtered.map((book) => (
              <button
                key={book.idx}
                onClick={() => onSelect(book.idx)}
                className={`flex items-center justify-between rounded-[10px] border px-[12px] py-[10px] text-left text-[13px] font-medium transition-colors cursor-pointer ${
                  book.idx === selectedIdx
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-slate-100 bg-slate-50 text-slate-700 hover:border-brand-primary/30 hover:bg-brand-surface-3"
                }`}
              >
                <span className="truncate">{book.name}</span>
                <span className={`ml-[4px] shrink-0 text-[11px] ${book.idx === selectedIdx ? "text-white/70" : "text-slate-400"}`}>
                  {book.chapters}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BiblePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const [estado, setEstado] = useState(null);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(42); // João / John
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [chapterData, setChapterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookSelectorOpen, setBookSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [copiedVerse, setCopiedVerse] = useState(null);
  const topRef = useRef(null);

  // Auth
  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }
      const novo = await loadFullState();
      if (!novo.authenticated) { router.push("/login"); return; }
      setEstado(novo);
    };
    init();
  }, [router]);

  // Load books when language changes
  useEffect(() => {
    fetchBooks(lang).then(setBooks);
  }, [lang]);

  // Read initial position from URL params
  useEffect(() => {
    const b = searchParams.get("b");
    const c = searchParams.get("c");
    startTransition(() => {
      if (b !== null) setSelectedBook(parseInt(b, 10));
      if (c !== null) setSelectedChapter(parseInt(c, 10));
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load chapter whenever book/chapter/lang changes
  const loadChapter = useCallback(async (bookIdx, chapter, langCode) => {
    setLoading(true);
    setChapterData(null);
    const data = await fetchChapter(langCode, bookIdx, chapter);
    setChapterData(data);
    setLoading(false);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!estado) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChapter(selectedBook, selectedChapter, lang);
  }, [selectedBook, selectedChapter, lang, estado, loadChapter]);

  const currentBook = books[selectedBook];
  const totalChapters = currentBook?.chapters || 1;

  const goToBook = (bookIdx) => {
    setSelectedBook(bookIdx);
    setSelectedChapter(1);
    setBookSelectorOpen(false);
  };

  const goToChapter = (ch) => {
    if (ch < 1 || ch > totalChapters) return;
    setSelectedChapter(ch);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchError("");
    const res = await fetch(`/api/bible?ref=${encodeURIComponent(searchQuery.trim())}&lang=${lang}`);
    if (!res.ok) { setSearchError(t("bible_not_found")); return; }
    const data = await res.json();
    setSelectedBook(data.bookIdx ?? selectedBook);
    setSelectedChapter(data.chapter ?? selectedChapter);
    setSearchQuery("");
  };

  const copyVerse = (verse) => {
    const book = books[selectedBook];
    const text = `"${verse.text}" — ${book?.name} ${selectedChapter}:${verse.num}`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedVerse(verse.num);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  if (!estado) return null;

  return (
    <AppLayout profile={estado.profile}>
      <div ref={topRef} />

      {/* ── Top bar ── */}
      <div className="mb-[16px] flex flex-wrap items-center gap-[10px]">
        {/* Book selector button */}
        <button
          onClick={() => setBookSelectorOpen(true)}
          className="flex items-center gap-[8px] rounded-[12px] border border-brand-line bg-white px-[14px] py-[9px] text-[14px] font-bold text-brand-primary shadow-sm transition-all hover:border-brand-primary/40 hover:shadow-md cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>{currentBook?.name || "…"}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {/* Chapter selector */}
        <div className="flex items-center gap-[6px] rounded-[12px] border border-brand-line bg-white px-[10px] py-[7px] shadow-sm">
          <button
            onClick={() => goToChapter(selectedChapter - 1)}
            disabled={selectedChapter <= 1}
            className="grid h-[24px] w-[24px] place-items-center rounded-[6px] border-none bg-slate-100 text-[14px] text-slate-500 disabled:opacity-30 cursor-pointer hover:bg-slate-200 disabled:cursor-default transition-colors"
          >
            ‹
          </button>
          <select
            value={selectedChapter}
            onChange={(e) => goToChapter(Number(e.target.value))}
            className="border-none bg-transparent text-[14px] font-bold text-brand-primary outline-none cursor-pointer"
          >
            {Array.from({ length: totalChapters }, (_, i) => (
              <option key={i + 1} value={i + 1}>{t("bible_chapter")} {i + 1}</option>
            ))}
          </select>
          <button
            onClick={() => goToChapter(selectedChapter + 1)}
            disabled={selectedChapter >= totalChapters}
            className="grid h-[24px] w-[24px] place-items-center rounded-[6px] border-none bg-slate-100 text-[14px] text-slate-500 disabled:opacity-30 cursor-pointer hover:bg-slate-200 disabled:cursor-default transition-colors"
          >
            ›
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-1 min-w-[200px] items-center gap-[6px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchError(""); }}
            placeholder={t("bible_search_ph")}
            className="flex-1 rounded-[12px] border border-brand-line bg-white px-[14px] py-[9px] text-[14px] font-sans shadow-sm outline-none focus:border-brand-primary transition-colors"
          />
          <button
            type="submit"
            className="rounded-[12px] border-none bg-brand-primary px-[16px] py-[9px] text-[13px] font-bold text-white shadow-sm cursor-pointer hover:bg-brand-primary-2 transition-colors"
          >
            {t("bible_search_btn")}
          </button>
        </form>

        {/* Version badge */}
        <span className="rounded-[8px] border border-brand-gold/30 bg-brand-amber-soft px-[10px] py-[5px] text-[11px] font-bold text-brand-gold">
          {t("bible_version")}
        </span>
      </div>

      {searchError && (
        <p className="mb-[12px] rounded-[10px] bg-red-50 px-[14px] py-[10px] text-[13px] text-red-500 font-sans">{searchError}</p>
      )}

      {/* ── Chapter reader ── */}
      <div className="rounded-[20px] border border-brand-line bg-white shadow-brand">
        {/* Chapter header */}
        <div className="border-b border-brand-line px-[20px] py-[16px] md:px-[32px]">
          <h2 className="m-0 font-serif text-[22px] md:text-[26px] text-brand-primary">
            {currentBook?.name} {selectedChapter}
          </h2>
        </div>

        {/* Verses */}
        <div className="px-[20px] py-[24px] md:px-[32px] md:py-[32px]">
          {loading && (
            <div className="flex items-center gap-[10px] py-[40px] justify-center text-brand-muted font-sans text-[14px]">
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {t("bible_loading")}
            </div>
          )}

          {!loading && chapterData && (
            <div className="flex flex-col gap-[2px]">
              {chapterData.verses.map((verse) => (
                <div
                  key={verse.num}
                  className="group flex items-start gap-[12px] rounded-[10px] px-[8px] py-[6px] transition-colors hover:bg-brand-surface-3"
                >
                  <span className="mt-[3px] w-[24px] shrink-0 text-right text-[11px] font-bold text-brand-gold/70 font-sans select-none">
                    {verse.num}
                  </span>
                  <p className="m-0 flex-1 font-serif text-[17px] md:text-[18px] leading-[1.75] text-brand-text">
                    {verse.text}
                  </p>
                  <button
                    onClick={() => copyVerse(verse)}
                    title={t("bible_copy_verse")}
                    className="mt-[4px] shrink-0 opacity-0 group-hover:opacity-100 grid h-[26px] w-[26px] place-items-center rounded-[6px] border-none bg-slate-100 text-slate-400 text-[12px] cursor-pointer hover:bg-brand-primary hover:text-white transition-all"
                  >
                    {copiedVerse === verse.num ? "✓" : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between border-t border-brand-line px-[20px] py-[14px] md:px-[32px]">
          <button
            onClick={() => {
              if (selectedChapter > 1) {
                goToChapter(selectedChapter - 1);
              } else if (selectedBook > 0) {
                const prevBook = selectedBook - 1;
                setSelectedBook(prevBook);
                // Will be set after books load; use max chapters
                setSelectedChapter(books[prevBook]?.chapters || 1);
              }
            }}
            disabled={selectedChapter <= 1 && selectedBook === 0}
            className="flex items-center gap-[6px] rounded-[10px] border border-brand-line bg-slate-50 px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted disabled:opacity-30 cursor-pointer hover:border-brand-primary/30 hover:text-brand-primary transition-colors disabled:cursor-default"
          >
            {t("bible_prev_chapter")}
          </button>

          {/* Chapter pills — show nearby chapters */}
          <div className="hidden items-center gap-[4px] md:flex">
            {Array.from({ length: Math.min(totalChapters, 7) }, (_, i) => {
              const half = 3;
              let start = Math.max(1, selectedChapter - half);
              const end = Math.min(totalChapters, start + 6);
              start = Math.max(1, end - 6);
              const ch = start + i;
              if (ch > totalChapters) return null;
              return (
                <button
                  key={ch}
                  onClick={() => goToChapter(ch)}
                  className={`h-[28px] w-[28px] rounded-[6px] border-none text-[12px] font-bold transition-colors cursor-pointer ${
                    ch === selectedChapter
                      ? "bg-brand-primary text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {ch}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (selectedChapter < totalChapters) {
                goToChapter(selectedChapter + 1);
              } else if (selectedBook < 65) {
                setSelectedBook(selectedBook + 1);
                setSelectedChapter(1);
              }
            }}
            disabled={selectedChapter >= totalChapters && selectedBook === 65}
            className="flex items-center gap-[6px] rounded-[10px] border border-brand-line bg-slate-50 px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted disabled:opacity-30 cursor-pointer hover:border-brand-primary/30 hover:text-brand-primary transition-colors disabled:cursor-default"
          >
            {t("bible_next_chapter")}
          </button>
        </div>
      </div>

      {bookSelectorOpen && (
        <BookSelector
          books={books}
          selectedIdx={selectedBook}
          onSelect={goToBook}
          onClose={() => setBookSelectorOpen(false)}
          t={t}
        />
      )}
    </AppLayout>
  );
}
