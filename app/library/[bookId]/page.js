"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { auth, profiles } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";
import LibraryReader from "@/components/LibraryReader";

function BookPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
      <div className="font-sans text-white">Loading...</div>
    </div>
  );
}

async function fetchBookMeta(bookId) {
  const res = await fetch(`/api/library/books/${bookId}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchBookChapter(bookId, chapter) {
  const res = await fetch(`/api/library/books/${bookId}?chapter=${chapter}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchBookSection(bookId, section) {
  const res = await fetch(`/api/library/books/${bookId}?section=${section}`);
  if (!res.ok) return null;
  return res.json();
}

function BookPageClient() {
  const router = useRouter();
  const params = useParams();
  const bookId = params?.bookId;
  const { lang, t } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [bookMeta, setBookMeta] = useState(null);
  const [chapterData, setChapterData] = useState(null);
  const [sectionData, setSectionData] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedSection, setSelectedSection] = useState(1);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!profile || !bookId) return;
    let active = true;

    async function load() {
      setLoading(true);
      const meta = await fetchBookMeta(bookId);
      if (!active) return;
      if (!meta) { router.push("/library"); return; }
      setBookMeta(meta);

      if (meta.source === "bible") {
        router.push(`/bible?b=${meta.bibleIndex}&c=1`);
        return;
      }

      if (meta.chapters) {
        const data = await fetchBookChapter(bookId, selectedChapter);
        if (active) setChapterData(data);
      } else if (meta.sections) {
        const data = await fetchBookSection(bookId, selectedSection);
        if (active) setSectionData(data);
      }

      if (active) setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [profile, bookId, router]);

  useEffect(() => {
    if (!bookMeta || !profile) return;
    setLoading(true);

    if (bookMeta.chapters) {
      fetchBookChapter(bookId, selectedChapter).then(setChapterData).finally(() => setLoading(false));
    } else if (bookMeta.sections) {
      fetchBookSection(bookId, selectedSection).then(setSectionData).finally(() => setLoading(false));
    }
  }, [selectedChapter, selectedSection, bookId, bookMeta, profile]);

  const title = bookMeta?.title
    ? (typeof bookMeta.title === "string" ? bookMeta.title : (bookMeta.title?.[lang] || bookMeta.title?.en || bookId))
    : bookId;

  const sectionType = bookMeta?.chapters ? "chapter" : "section";
  const totalChapters = bookMeta?.totalChapters || bookMeta?.chapters?.length || 0;
  const totalSections = bookMeta?.totalSections || bookMeta?.sections?.length || 0;

  if (!profile) return <BookPageFallback />;

  return (
    <AppLayout profile={profile}>
      <div className="mb-[16px]">
        <button
          onClick={() => router.push("/library")}
          className="flex cursor-pointer items-center gap-[6px] rounded-[10px] border border-brand-line bg-white px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted transition-colors hover:border-brand-primary/30 hover:text-brand-primary"
        >
          &lsaquo; {t("library_back")}
        </button>
      </div>

      <LibraryReader
        loading={loading}
        title={title}
        chapterData={chapterData}
        sectionData={sectionData}
        selectedChapter={selectedChapter}
        selectedSection={selectedSection}
        onChapterChange={setSelectedChapter}
        onSectionChange={setSelectedSection}
        totalChapters={totalChapters}
        totalSections={totalSections}
        sectionType={sectionType}
        t={t}
      />
    </AppLayout>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<BookPageFallback />}>
      <BookPageClient />
    </Suspense>
  );
}
