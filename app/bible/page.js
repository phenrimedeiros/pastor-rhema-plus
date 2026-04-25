"use client";

import {
  Fragment,
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { auth, bibleNotes, profiles } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
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

const NOTE_COLORS = [
  { value: "gold", className: "border-amber-300 bg-amber-50", dotClassName: "bg-amber-400" },
  { value: "blue", className: "border-sky-300 bg-sky-50", dotClassName: "bg-sky-400" },
  { value: "green", className: "border-emerald-300 bg-emerald-50", dotClassName: "bg-emerald-400" },
  { value: "rose", className: "border-rose-300 bg-rose-50", dotClassName: "bg-rose-400" },
];

function getColorMeta(color) {
  return NOTE_COLORS.find((item) => item.value === color) || NOTE_COLORS[0];
}

function formatVerseRange(chapter, start, end) {
  return `${chapter}:${start}${end && end !== start ? `-${end}` : ""}`;
}

function noteOverlapsVerse(note, verseNum) {
  return note.verse_start <= verseNum && note.verse_end >= verseNum;
}

function getNearbyVerses(verses, start, end) {
  if (!Array.isArray(verses)) return [];
  return verses.filter((verse) => verse.num >= start - 3 && verse.num <= end + 3);
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

function DeepDiveResult({ content, t }) {
  if (!content) return null;

  const sections = [
    ["summary", t("bible_deepen_summary"), content.summary],
    ["immediateContext", t("bible_deepen_immediate"), content.immediateContext],
    ["historicalContext", t("bible_deepen_historical"), content.historicalContext],
  ];

  const lists = [
    ["keyIdeas", t("bible_deepen_key_ideas"), content.keyIdeas],
    ["crossReferences", t("bible_deepen_cross_refs"), content.crossReferences],
    ["applications", t("bible_deepen_applications"), content.applications],
    ["interpretationCare", t("bible_deepen_care"), content.interpretationCare],
  ];

  return (
    <div className="mt-[12px] rounded-[12px] border border-brand-line bg-white p-[12px]">
      {content.title && (
        <h4 className="m-0 mb-[8px] font-serif text-[16px] text-brand-primary md:text-[17px]">
          {content.title}
        </h4>
      )}

      <div className="space-y-[10px]">
        {sections.map(([key, label, value]) => value && (
          <section key={key}>
            <h5 className="m-0 mb-[4px] text-[11px] font-bold uppercase text-brand-gold">
              {label}
            </h5>
            <p className="m-0 whitespace-pre-line text-[12px] leading-[1.6] text-brand-text md:text-[13px]">
              {value}
            </p>
          </section>
        ))}

        {lists.map(([key, label, values]) => Array.isArray(values) && values.length > 0 && (
          <section key={key}>
            <h5 className="m-0 mb-[6px] text-[11px] font-bold uppercase text-brand-gold">
              {label}
            </h5>
            <ul className="m-0 space-y-[5px] pl-[18px] text-[12px] leading-[1.5] text-brand-text md:text-[13px]">
              {values.map((item, index) => (
                <li key={`${key}-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function NotesPanel({ notes, onEdit, onDelete, onDeepen, t }) {
  return (
    <aside className="rounded-[18px] border border-brand-line bg-white shadow-brand lg:sticky lg:top-[18px] lg:max-h-[calc(100vh-36px)] lg:overflow-y-auto">
      <div className="border-b border-brand-line px-[18px] py-[15px]">
        <h3 className="m-0 font-serif text-[19px] text-brand-primary">{t("bible_notes_title")}</h3>
      </div>

      <div className="space-y-[10px] p-[14px]">
        {notes.length === 0 && (
          <p className="m-0 rounded-[12px] bg-slate-50 px-[12px] py-[14px] text-[13px] leading-[1.5] text-brand-muted">
            {t("bible_notes_empty")}
          </p>
        )}

        {notes.map((note) => {
          const color = getColorMeta(note.highlight_color);
          return (
            <article
              key={note.id}
              className={`rounded-[12px] border p-[12px] ${color.className}`}
            >
              <div className="mb-[8px] flex items-center justify-between gap-[8px]">
                <span className="text-[12px] font-bold text-brand-primary">
                  {note.book_name} {formatVerseRange(note.chapter, note.verse_start, note.verse_end)}
                </span>
                <span className={`h-[9px] w-[9px] rounded-full ${color.dotClassName}`} />
              </div>

              <p className="m-0 mb-[8px] font-serif text-[14px] leading-[1.55] text-brand-text">
                {note.selected_text}
              </p>

              {note.note && (
                <p className="m-0 whitespace-pre-line rounded-[10px] bg-white/70 px-[10px] py-[8px] text-[13px] leading-[1.5] text-slate-700">
                  {note.note}
                </p>
              )}

              {note.local_only && (
                <p className="m-0 mt-[8px] text-[11px] font-semibold text-amber-700">
                  {t("bible_local_note")}
                </p>
              )}

              <div className="mt-[10px] flex flex-wrap gap-[6px]">
                <button
                  onClick={() => onEdit(note)}
                  className="cursor-pointer rounded-[8px] border border-white/80 bg-white/80 px-[9px] py-[6px] text-[12px] font-bold text-brand-primary transition-colors hover:bg-white"
                >
                  {t("bible_edit_note")}
                </button>
                <button
                  onClick={() => onDeepen(note)}
                  className="cursor-pointer rounded-[8px] border border-white/80 bg-white/80 px-[9px] py-[6px] text-[12px] font-bold text-brand-primary transition-colors hover:bg-white"
                >
                  {t("bible_deepen")}
                </button>
                <button
                  onClick={() => onDelete(note)}
                  className="cursor-pointer rounded-[8px] border border-white/80 bg-white/80 px-[9px] py-[6px] text-[12px] font-bold text-red-500 transition-colors hover:bg-white"
                >
                  {t("bible_delete_note")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}

function PassageEditor({
  deepDive,
  deepDiveError,
  deepDiveLoading,
  editorRef,
  editingNoteId,
  layout = "mobile",
  noteColor,
  noteDraft,
  onClear,
  onDeepen,
  onSave,
  onUpdateColor,
  onUpdateNote,
  passage,
  savingNote,
  t,
}) {
  if (!passage) return null;

  const containerClassName = layout === "desktop"
    ? "hidden rounded-[18px] border border-brand-line bg-white p-[16px] shadow-[0_16px_36px_rgba(15,23,42,.12)] md:my-[12px] md:ml-[44px] md:mr-[8px] md:block"
    : "fixed inset-x-0 bottom-[calc(92px_+_env(safe-area-inset-bottom,0px))] z-40 max-h-[calc(100dvh_-_132px_-_env(safe-area-inset-bottom,0px))] overflow-y-auto rounded-[18px] border border-brand-line bg-white px-[12px] py-[12px] shadow-[0_-16px_36px_rgba(15,23,42,.2)] md:hidden";

  return (
    <div ref={editorRef} className={containerClassName}>
      <div className="mx-auto mb-[8px] h-[4px] w-[42px] rounded-full bg-slate-200 md:hidden" />

      <div className="mb-[8px] flex items-start justify-between gap-[8px]">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase text-brand-gold md:text-[11px]">
            {t("bible_selected_label")}
          </span>
          <h3 className="m-0 mt-[2px] truncate font-serif text-[17px] text-brand-primary md:text-[18px]">
            {passage.bookName} {formatVerseRange(passage.chapter, passage.verseStart, passage.verseEnd)}
          </h3>
        </div>
        <button
          onClick={onClear}
          className="shrink-0 cursor-pointer rounded-[9px] border border-brand-line bg-slate-50 px-[9px] py-[6px] text-[12px] font-bold text-brand-muted transition-colors hover:text-brand-primary"
        >
          {t("bible_clear_selection")}
        </button>
      </div>

      <p className="m-0 mb-[10px] max-h-[92px] overflow-y-auto rounded-[10px] bg-brand-surface-3 px-[10px] py-[8px] font-serif text-[14px] leading-[1.55] text-brand-text md:max-h-none md:text-[15px] md:leading-[1.6]">
        {passage.selectedText}
      </p>

      <textarea
        value={noteDraft}
        onChange={(event) => onUpdateNote(event.target.value)}
        placeholder={t("bible_note_ph")}
        rows={2}
        className="mb-[8px] w-full resize-y rounded-[10px] border border-brand-line bg-white px-[10px] py-[8px] text-[13px] leading-[1.45] text-brand-text outline-none transition-colors focus:border-brand-primary md:rounded-[12px] md:px-[12px] md:py-[10px] md:text-[14px] md:leading-[1.55]"
      />

      <div className="flex flex-wrap items-center gap-[7px]">
        {NOTE_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onUpdateColor(color.value)}
            title={t(`bible_color_${color.value}`)}
            className={`grid h-[28px] w-[28px] cursor-pointer place-items-center rounded-full border transition-transform hover:scale-105 md:h-[30px] md:w-[30px] ${color.className} ${
              noteColor === color.value ? "ring-2 ring-brand-primary/50" : ""
            }`}
          >
            <span className={`h-[11px] w-[11px] rounded-full ${color.dotClassName}`} />
          </button>
        ))}

        <button
          onClick={onSave}
          disabled={savingNote}
          className="min-h-[34px] cursor-pointer rounded-[9px] border-none bg-brand-primary px-[12px] py-[7px] text-[12px] font-bold text-white transition-colors hover:bg-brand-primary-2 disabled:cursor-default disabled:opacity-60 md:text-[13px]"
        >
          {savingNote
            ? t("bible_saving_note")
            : editingNoteId
              ? t("bible_update_note")
              : t("bible_save_note")}
        </button>

        <button
          onClick={onDeepen}
          disabled={deepDiveLoading}
          className="min-h-[34px] cursor-pointer rounded-[9px] border border-brand-primary/25 bg-white px-[12px] py-[7px] text-[12px] font-bold text-brand-primary transition-colors hover:bg-brand-surface-3 disabled:cursor-default disabled:opacity-60 md:text-[13px]"
        >
          {deepDiveLoading ? t("bible_deepening") : t("bible_deepen")}
        </button>
      </div>

      {deepDiveError && (
        <p className="m-0 mt-[8px] rounded-[10px] bg-red-50 px-[10px] py-[8px] text-[12px] text-red-500 md:text-[13px]">
          {deepDiveError}
        </p>
      )}

      <DeepDiveResult content={deepDive} t={t} />
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
  const [selectedPassage, setSelectedPassage] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteColor, setNoteColor] = useState("gold");
  const [notes, setNotes] = useState([]);
  const [notesPanelOpen, setNotesPanelOpen] = useState(true);
  const [noteMessage, setNoteMessage] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [deepDive, setDeepDive] = useState(null);
  const [deepDiveLoading, setDeepDiveLoading] = useState(false);
  const [deepDiveError, setDeepDiveError] = useState("");
  const topRef = useRef(null);
  const desktopEditorRef = useRef(null);

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
    loadChapter(selectedBook, selectedChapter, lang);
  }, [profile, selectedBook, selectedChapter, lang, loadChapter]);

  useEffect(() => {
    if (!profile) return;
    let active = true;

    async function loadNotes() {
      try {
        const data = await bibleNotes.getForChapter(profile.id, lang, selectedBook, selectedChapter);
        if (active) setNotes(data);
      } catch (err) {
        console.error("Erro ao carregar notas bíblicas:", err);
        if (active) setNoteMessage(err.message || t("bible_note_error"));
      }
    }

    loadNotes();
    return () => { active = false; };
  }, [profile, lang, selectedBook, selectedChapter, t]);

  const currentBook = books[selectedBook];
  const totalChapters = currentBook?.chapters || 1;

  useEffect(() => {
    if (!selectedPassage) return;
    if (!window.matchMedia("(min-width: 768px)").matches) return;

    const frame = window.requestAnimationFrame(() => {
      desktopEditorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedPassage]);

  const clearPassageEditor = () => {
    setSelectedPassage(null);
    setEditingNoteId(null);
    setNoteDraft("");
    setNoteColor("gold");
    setDeepDive(null);
    setDeepDiveError("");
  };

  const buildSelectionFromRange = useCallback((start, end, customText = "") => {
    const verses = chapterData?.verses || [];
    const safeStart = Math.min(start, end);
    const safeEnd = Math.max(start, end);
    const selectedVerses = verses.filter((verse) => verse.num >= safeStart && verse.num <= safeEnd);
    const selectedText = customText || selectedVerses.map((verse) => verse.text).join(" ");

    return {
      bookIdx: selectedBook,
      bookName: currentBook?.name || chapterData?.bookName || "",
      chapter: selectedChapter,
      verseStart: safeStart,
      verseEnd: safeEnd,
      selectedText,
    };
  }, [chapterData, currentBook, selectedBook, selectedChapter]);

  const handleVerseClick = (event, verse) => {
    const browserSelection = window.getSelection?.().toString().trim();
    const selectedText = browserSelection && verse.text.includes(browserSelection)
      ? browserSelection
      : "";

    const nextSelection = event.shiftKey && selectedPassage
      ? buildSelectionFromRange(selectedPassage.verseStart, verse.num)
      : buildSelectionFromRange(verse.num, verse.num, selectedText);

    setSelectedPassage(nextSelection);
    setEditingNoteId(null);
    setNoteDraft("");
    setNoteColor("gold");
    setDeepDive(null);
    setDeepDiveError("");
    setNoteMessage("");
  };

  const openNoteForEditing = (note) => {
    setSelectedBook(note.book_idx);
    setSelectedChapter(note.chapter);
    setSelectedPassage({
      bookIdx: note.book_idx,
      bookName: note.book_name,
      chapter: note.chapter,
      verseStart: note.verse_start,
      verseEnd: note.verse_end,
      selectedText: note.selected_text,
    });
    setEditingNoteId(note.id);
    setNoteDraft(note.note || "");
    setNoteColor(note.highlight_color || "gold");
    setDeepDive(note.ai_context || null);
    setDeepDiveError("");
    setNotesPanelOpen(true);
  };

  const saveSelectedNote = async () => {
    if (!profile || !selectedPassage) return;
    setSavingNote(true);
    setNoteMessage("");

    const payload = {
      user_id: profile.id,
      lang,
      book_idx: selectedPassage.bookIdx,
      book_name: selectedPassage.bookName,
      chapter: selectedPassage.chapter,
      verse_start: selectedPassage.verseStart,
      verse_end: selectedPassage.verseEnd,
      selected_text: selectedPassage.selectedText,
      note: noteDraft.trim(),
      highlight_color: noteColor,
      ai_context: deepDive,
    };

    try {
      const saved = editingNoteId
        ? await bibleNotes.updateNote(editingNoteId, payload)
        : await bibleNotes.createNote(payload);

      if (saved) {
        setNotes((current) => {
          const withoutExisting = current.filter((note) => note.id !== saved.id);
          return [...withoutExisting, saved].sort((a, b) => (
            (a.verse_start - b.verse_start) ||
            String(a.created_at).localeCompare(String(b.created_at))
          ));
        });
      }
      setNoteMessage(t("bible_note_saved"));
      clearPassageEditor();
      setNotesPanelOpen(true);
    } catch (err) {
      console.error("Erro ao salvar nota bíblica:", err);
      setNoteMessage(err.message || t("bible_note_error"));
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (note) => {
    try {
      await bibleNotes.deleteNote(note.id);
      setNotes((current) => current.filter((item) => item.id !== note.id));
      if (editingNoteId === note.id) clearPassageEditor();
    } catch (err) {
      console.error("Erro ao excluir nota bíblica:", err);
      setNoteMessage(err.message || t("bible_delete_error"));
    }
  };

  const deepenSelection = async (passage = selectedPassage) => {
    if (!passage) return;
    setDeepDiveLoading(true);
    setDeepDiveError("");
    setDeepDive(null);

    const contextVerses = getNearbyVerses(
      chapterData?.verses,
      passage.verseStart,
      passage.verseEnd
    );

    try {
      const data = await callApi("/api/bible/deepen", {
        lang,
        reference: `${passage.bookName} ${formatVerseRange(passage.chapter, passage.verseStart, passage.verseEnd)}`,
        selectedText: passage.selectedText,
        contextVerses,
      });
      setDeepDive(data.content);
    } catch (err) {
      console.error("Erro ao aprofundar texto bíblico:", err);
      setDeepDiveError(err.message || t("bible_deepen_error"));
    } finally {
      setDeepDiveLoading(false);
    }
  };

  const deepenNote = (note) => {
    openNoteForEditing(note);
    const passage = {
      bookIdx: note.book_idx,
      bookName: note.book_name,
      chapter: note.chapter,
      verseStart: note.verse_start,
      verseEnd: note.verse_end,
      selectedText: note.selected_text,
    };
    deepenSelection(passage);
  };

  const goToBook = (bookIdx) => {
    setSelectedBook(bookIdx);
    setSelectedChapter(1);
    setBookSelectorOpen(false);
    clearPassageEditor();
  };

  const goToChapter = (chapter) => {
    if (chapter < 1 || chapter > totalChapters) return;
    setSelectedChapter(chapter);
    clearPassageEditor();
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
    clearPassageEditor();
  };

  const copyVerse = (verse) => {
    const book = books[selectedBook];
    const text = `"${verse.text}" - ${book?.name} ${selectedChapter}:${verse.num}`;

    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedVerse(verse.num);
    setTimeout(() => setCopiedVerse(null), 2000);
  };

  if (!profile) return <BiblePageFallback />;

  const passageEditorProps = {
    deepDive,
    deepDiveError,
    deepDiveLoading,
    editingNoteId,
    noteColor,
    noteDraft,
    onClear: clearPassageEditor,
    onDeepen: () => deepenSelection(),
    onSave: saveSelectedNote,
    onUpdateColor: setNoteColor,
    onUpdateNote: setNoteDraft,
    passage: selectedPassage,
    savingNote,
    t,
  };

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

        <button
          onClick={() => setNotesPanelOpen((value) => !value)}
          className="flex cursor-pointer items-center gap-[7px] rounded-[12px] border border-brand-line bg-white px-[13px] py-[9px] text-[13px] font-bold text-brand-primary shadow-sm transition-colors hover:border-brand-primary/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          <span>{t("bible_notes_button")}</span>
          {notes.length > 0 && (
            <span className="rounded-full bg-brand-primary px-[6px] py-[1px] text-[10px] text-white">
              {notes.length}
            </span>
          )}
        </button>

        <span className="rounded-[8px] border border-brand-gold/30 bg-brand-amber-soft px-[10px] py-[5px] text-[11px] font-bold text-brand-gold">
          {t("bible_version")}
        </span>
      </div>

      {searchError && (
        <p className="mb-[12px] rounded-[10px] bg-red-50 px-[14px] py-[10px] text-[13px] font-sans text-red-500">
          {searchError}
        </p>
      )}

      {noteMessage && (
        <p className="mb-[12px] rounded-[10px] bg-brand-surface-3 px-[14px] py-[10px] text-[13px] font-sans text-brand-primary">
          {noteMessage}
        </p>
      )}

      <PassageEditor {...passageEditorProps} layout="mobile" />

      <div className={`grid gap-[14px] ${notesPanelOpen ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}>
      <div className="rounded-[16px] border border-brand-line bg-white shadow-brand md:rounded-[20px]">
        <div className="border-b border-brand-line px-[14px] py-[12px] md:px-[32px] md:py-[16px]">
          <h2 className="m-0 font-serif text-[20px] text-brand-primary md:text-[23px]">
            {currentBook?.name} {selectedChapter}
          </h2>
        </div>

        <div className="px-[12px] py-[14px] md:px-[32px] md:py-[28px]">
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
              {chapterData.verses.map((verse) => {
                const verseNotes = notes.filter((note) => noteOverlapsVerse(note, verse.num));
                const noteColorMeta = verseNotes.length > 0
                  ? getColorMeta(verseNotes[0].highlight_color)
                  : null;
                const selected = selectedPassage &&
                  selectedPassage.bookIdx === selectedBook &&
                  selectedPassage.chapter === selectedChapter &&
                  selectedPassage.verseStart <= verse.num &&
                  selectedPassage.verseEnd >= verse.num;

                return (
                  <Fragment key={verse.num}>
                    <div
                      onClick={(event) => handleVerseClick(event, verse)}
                      className={`group flex cursor-pointer items-start gap-[8px] rounded-[9px] border-l-4 px-[6px] py-[4px] transition-colors hover:bg-brand-surface-3 md:gap-[12px] md:px-[8px] md:py-[6px] ${
                        noteColorMeta ? noteColorMeta.className : "border-transparent"
                      } ${selected ? "ring-2 ring-brand-primary/35" : ""}`}
                    >
                      <span className="mt-[3px] w-[20px] shrink-0 select-none text-right font-sans text-[10px] font-bold text-brand-gold/70 md:w-[24px] md:text-[11px]">
                        {verse.num}
                      </span>
                      <p className="m-0 flex-1 font-serif text-[15px] leading-[1.62] text-brand-text md:text-[16px] md:leading-[1.68]">
                        {verse.text}
                      </p>
                      {verseNotes.length > 0 && (
                        <span className="mt-[7px] grid h-[18px] min-w-[18px] shrink-0 place-items-center rounded-full bg-white/80 px-[5px] text-[10px] font-bold text-brand-primary">
                          {verseNotes.length}
                        </span>
                      )}
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          copyVerse(verse);
                        }}
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

                    {selectedPassage?.verseEnd === verse.num && (
                      <PassageEditor
                        {...passageEditorProps}
                        editorRef={desktopEditorRef}
                        layout="desktop"
                      />
                    )}
                  </Fragment>
                );
              })}
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
                clearPassageEditor();
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
                clearPassageEditor();
              }
            }}
            disabled={selectedChapter >= totalChapters && selectedBook === 65}
            className="flex cursor-pointer items-center gap-[6px] rounded-[10px] border border-brand-line bg-slate-50 px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted transition-colors hover:border-brand-primary/30 hover:text-brand-primary disabled:cursor-default disabled:opacity-30"
          >
            {t("bible_next_chapter")}
          </button>
        </div>
      </div>

      {notesPanelOpen && (
        <NotesPanel
          notes={notes}
          onEdit={openNoteForEditing}
          onDelete={deleteNote}
          onDeepen={deepenNote}
          t={t}
        />
      )}
      </div>

      {selectedPassage && <div aria-hidden="true" className="h-[260px] md:hidden" />}

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
