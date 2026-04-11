"use client";

import {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { auth, profiles } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";

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

async function searchRef(ref, lang) {
  const res = await fetch(`/api/bible?ref=${encodeURIComponent(ref)}&lang=${lang}`);
  if (!res.ok) return null;
  return res.json();
}

function BiblePageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
      <div className="font-sans text-white">Loading...</div>
    </div>
  );
}

function BookSelector({ books, selectedIdx, onSelect, onClose, t }) {
  const [tab, setTab] = useState(selectedIdx < 39 ? "OT" : "NT");
  const [query, setQuery] = useState("");

  const filtered = books.filter(
    (book) => book.testament === tab && book.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm md:items-center">
      <div className="flex max-h-[85vh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl md:rounded-[24px]">
        <div className="flex items-center justify-between border-b border-slate-100 px-[20px] pb-[14px] pt-[20px]">
          <h3 className="m-0 text-[18px] font-serif text-brand-primary">{t("bible_select_book")}</h3>
          <button
            onClick={onClose}
            className="grid h-[32px] w-[32px] cursor-pointer place-items-center rounded-full border-none bg-slate-100 text-[18px] font-bold text-slate-500 transition-colors hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <div className="px-[16px] pb-[8px] pt-[12px]">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("bible_book_search_ph")}
            className="w-full rounded-[10px] border border-slate-200 bg-slate-50 px-[12px] py-[8px] text-[14px] font-sans outline-none focus:border-brand-primary focus:bg-white"
          />
        </div>

        <div className="flex gap-[8px] px-[16px] pb-[10px]">
          {["OT", "NT"].map((value) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
                setQuery("");
              }}
              className={`flex-1 cursor-pointer rounded-[10px] border-none py-[8px] text-[13px] font-bold transition-colors ${
                tab === value
                  ? "bg-brand-primary text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {value === "OT" ? t("bible_ot") : t("bible_nt")}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-[16px] pb-[20px]">
          <div className="grid grid-cols-2 gap-[6px]">
            {filtered.map((book) => (
              <button
                key={book.idx}
                onClick={() => onSelect(book.idx)}
                className={`flex cursor-pointer items-center justify-between rounded-[10px] border px-[12px] py-[10px] text-left text-[13px] font-medium transition-colors ${
                  book.idx === selectedIdx
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-slate-100 bg-slate-50 text-slate-700 hover:border-brand-primary/30 hover:bg-brand-surface-3"
                }`}
              >
                <span className="truncate">{book.name}</span>
                <span
                  className={`ml-[4px] shrink-0 text-[11px] ${
                    book.idx === selectedIdx ? "text-white/70" : "text-slate-400"
                  }`}
                >
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

function BiblePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(42);
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [chapterData, setChapterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookSelectorOpen, setBookSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [copiedVerse, setCopiedVerse] = useState(null);
  const topRef = useRef(null);

  // Auth check on mount only — never redirect mid-session
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const session = await auth.getSession();
        if (!session) { router.push("/login"); return; }
        const user = await auth.getUser();
        if (!user) { router.push("/login"); return; }
        const currentProfile = await profiles.getProfile(user.id);
        if (active) setProfile(currentProfile);
      } catch {
        if (active) router.push("/login");
      }
    }
    init();
    return () => { active = false; };
  }, [router]);

  // Load books whenever language changes (after auth)
  useEffect(() => {
    if (!profile) return;
    fetchBooks(lang).then(setBooks).catch(console.error);
  }, [profile, lang]);

  // Read initial position from URL params
  useEffect(() => {
    const bookParam = searchParams.get("b");
    const chapterParam = searchParams.get("c");
    startTransition(() => {
      if (bookParam !== null) setSelectedBook(parseInt(bookParam, 10));
      if (chapterParam !== null) setSelectedChapter(parseInt(chapterParam, 10));
    });
  }, [searchParams]);

  // Load chapter — token fetched fresh on every call
  const loadChapter = useCallback(async (bookIdx, chapter, langCode) => {
    setLoading(true);
    setChapterData(null);
    const data = await fetchChapter(langCode, bookIdx, chapter);
    setChapterData(data);
    setLoading(false);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChapter(selectedBook, selectedChapter, lang);
  }, [profile, selectedBook, selectedChapter, lang, loadChapter]);

  const currentBook = books[selectedBook];
  const totalChapters = currentBook?.chapters || 1;

  const goToBook = (bookIdx) => {
    setSelectedBook(bookIdx);
    setSelectedChapter(1);
    setBookSelectorOpen(false);
  };

  const goToChapter = (chapter) => {
    if (chapter < 1 || chapter > totalChapters) return;
    setSelectedChapter(chapter);
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchError("");
    const data = await searchRef(searchQuery.trim(), lang);
    if (!data) {
      setSearchError(t("bible_not_found"));
      return;
    }
    setSelectedBook(data.bookIdx ?? selectedBook);
    setSelectedChapter(data.chapter ?? selectedChapter);
    setSearchQuery("");
  };

  const copyVerse = (verse) => {
    const book = books[selectedBook];
    const text = `"${verse.text}" - ${book?.name} ${selectedChapter}:${verse.num}`;

    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedVerse(verse.num);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  if (!profile) return <BiblePageFallback />;

  return (
    <AppLayout profile={profile}>
      <div ref={topRef} />

      <div className="mb-[16px] flex flex-wrap items-center gap-[10px]">
        <button
          onClick={() => setBookSelectorOpen(true)}
          className="flex cursor-pointer items-center gap-[8px] rounded-[12px] border border-brand-line bg-white px-[14px] py-[9px] text-[14px] font-bold text-brand-primary shadow-sm transition-all hover:border-brand-primary/40 hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>{currentBook?.name || "..."}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div className="flex items-center gap-[6px] rounded-[12px] border border-brand-line bg-white px-[10px] py-[7px] shadow-sm">
          <button
            onClick={() => goToChapter(selectedChapter - 1)}
            disabled={selectedChapter <= 1}
            className="grid h-[24px] w-[24px] cursor-pointer place-items-center rounded-[6px] border-none bg-slate-100 text-[14px] text-slate-500 transition-colors hover:bg-slate-200 disabled:cursor-default disabled:opacity-30"
          >
            ‹
          </button>
          <select
            value={selectedChapter}
            onChange={(event) => goToChapter(Number(event.target.value))}
            className="cursor-pointer border-none bg-transparent text-[14px] font-bold text-brand-primary outline-none"
          >
            {Array.from({ length: totalChapters }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {t("bible_chapter")} {index + 1}
              </option>
            ))}
          </select>
          <button
            onClick={() => goToChapter(selectedChapter + 1)}
            disabled={selectedChapter >= totalChapters}
            className="grid h-[24px] w-[24px] cursor-pointer place-items-center rounded-[6px] border-none bg-slate-100 text-[14px] text-slate-500 transition-colors hover:bg-slate-200 disabled:cursor-default disabled:opacity-30"
          >
            ›
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex min-w-[200px] flex-1 items-center gap-[6px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setSearchError("");
            }}
            placeholder={t("bible_search_ph")}
            className="flex-1 rounded-[12px] border border-brand-line bg-white px-[14px] py-[9px] text-[14px] font-sans shadow-sm outline-none transition-colors focus:border-brand-primary"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-[12px] border-none bg-brand-primary px-[16px] py-[9px] text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-brand-primary-2"
          >
            {t("bible_search_btn")}
          </button>
        </form>

        <span className="rounded-[8px] border border-brand-gold/30 bg-brand-amber-soft px-[10px] py-[5px] text-[11px] font-bold text-brand-gold">
          {t("bible_version")}
        </span>
      </div>

      {searchError && (
        <p className="mb-[12px] rounded-[10px] bg-red-50 px-[14px] py-[10px] text-[13px] font-sans text-red-500">
          {searchError}
        </p>
      )}

      <div className="rounded-[20px] border border-brand-line bg-white shadow-brand">
        <div className="border-b border-brand-line px-[20px] py-[16px] md:px-[32px]">
          <h2 className="m-0 font-serif text-[22px] text-brand-primary md:text-[26px]">
            {currentBook?.name} {selectedChapter}
          </h2>
        </div>

        <div className="px-[20px] py-[24px] md:px-[32px] md:py-[32px]">
          {loading && (
            <div className="flex items-center justify-center gap-[10px] py-[40px] text-[14px] font-sans text-brand-muted">
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
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
                  <span className="mt-[3px] w-[24px] shrink-0 select-none text-right font-sans text-[11px] font-bold text-brand-gold/70">
                    {verse.num}
                  </span>
                  <p className="m-0 flex-1 font-serif text-[17px] leading-[1.75] text-brand-text md:text-[18px]">
                    {verse.text}
                  </p>
                  <button
                    onClick={() => copyVerse(verse)}
                    title={t("bible_copy_verse")}
                    className="mt-[4px] grid h-[26px] w-[26px] shrink-0 cursor-pointer place-items-center rounded-[6px] border-none bg-slate-100 text-[12px] text-slate-400 opacity-0 transition-all hover:bg-brand-primary hover:text-white group-hover:opacity-100"
                  >
                    {copiedVerse === verse.num ? (
                      "✓"
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-brand-line px-[20px] py-[14px] md:px-[32px]">
          <button
            onClick={() => {
              if (selectedChapter > 1) {
                goToChapter(selectedChapter - 1);
              } else if (selectedBook > 0) {
                const previousBook = selectedBook - 1;
                setSelectedBook(previousBook);
                setSelectedChapter(books[previousBook]?.chapters || 1);
              }
            }}
            disabled={selectedChapter <= 1 && selectedBook === 0}
            className="flex cursor-pointer items-center gap-[6px] rounded-[10px] border border-brand-line bg-slate-50 px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted transition-colors hover:border-brand-primary/30 hover:text-brand-primary disabled:cursor-default disabled:opacity-30"
          >
            {t("bible_prev_chapter")}
          </button>

          <div className="hidden items-center gap-[4px] md:flex">
            {Array.from({ length: Math.min(totalChapters, 7) }, (_, index) => {
              const half = 3;
              let start = Math.max(1, selectedChapter - half);
              const end = Math.min(totalChapters, start + 6);
              start = Math.max(1, end - 6);
              const chapter = start + index;
              if (chapter > totalChapters) return null;

              return (
                <button
                  key={chapter}
                  onClick={() => goToChapter(chapter)}
                  className={`h-[28px] w-[28px] cursor-pointer rounded-[6px] border-none text-[12px] font-bold transition-colors ${
                    chapter === selectedChapter
                      ? "bg-brand-primary text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {chapter}
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
            className="flex cursor-pointer items-center gap-[6px] rounded-[10px] border border-brand-line bg-slate-50 px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted transition-colors hover:border-brand-primary/30 hover:text-brand-primary disabled:cursor-default disabled:opacity-30"
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

export default function BiblePage() {
  return (
    <Suspense fallback={<BiblePageFallback />}>
      <BiblePageClient />
    </Suspense>
  );
}
