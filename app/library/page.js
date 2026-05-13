"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { auth, profiles } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";
import LibraryBookCard from "@/components/LibraryBookCard";

const TRADITION_COLORS = {
  protestant:         "#2ecc71",
  deuterocanonical:    "#9370DB",
  dss:                 "#00BFFF",
  gnostic:             "#ff4444",
};

function LibraryFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
      <div className="font-sans text-white">Loading...</div>
    </div>
  );
}

async function fetchLibraryIndex(tradition) {
  const url = tradition && tradition !== "all"
    ? `/api/library?tradition=${tradition}`
    : "/api/library";
  const res = await fetch(url);
  if (!res.ok) return { traditions: {}, books: [] };
  return res.json();
}

function LibraryPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang, t } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [books, setBooks] = useState([]);
  const [traditions, setTraditions] = useState({});
  const [activeTradition, setActiveTradition] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    const tradition = searchParams.get("t") || "all";
    setActiveTradition(tradition);
  }, [searchParams]);

  const loadBooks = useCallback(async (tradition) => {
    setLoading(true);
    const data = await fetchLibraryIndex(tradition);
    setBooks(data.books || []);
    setTraditions(data.traditions || {});
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!profile) return;
    loadBooks(activeTradition);
  }, [profile, activeTradition, loadBooks]);

  const handleTraditionChange = (tradition) => {
    setActiveTradition(tradition);
    const url = tradition === "all" ? "/library" : `/library?t=${tradition}`;
    router.push(url, { scroll: false });
  };

  const filteredBooks = books.filter((book) => {
    if (!searchQuery.trim()) return true;
    const title = typeof book.title === "string"
      ? book.title
      : (book.title?.[lang] || book.title?.en || "");
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const traditionList = [
    { id: "all", label: t("library_all"), color: "#64748b" },
    ...Object.entries(traditions).map(([key, meta]) => ({
      id: key,
      label: meta.label?.[lang] || meta.label?.en || key,
      color: meta.color || TRADITION_COLORS[key] || "#64748b",
      count: meta.count,
    })),
  ];

  if (!profile) return <LibraryFallback />;

  return (
    <AppLayout profile={profile}>
      <div className="mb-[20px]">
        <h1 className="m-0 font-serif text-[26px] text-brand-primary md:text-[32px]">
          {t("library_title")}
        </h1>
        <p className="m-0 mt-[6px] text-[14px] text-brand-muted">
          {t("library_subtitle")}
        </p>
      </div>

      <div className="mb-[16px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("library_search")}
          className="w-full rounded-[14px] border border-brand-line bg-white px-[16px] py-[12px] text-[14px] font-sans shadow-sm outline-none transition-colors focus:border-brand-primary md:max-w-[480px]"
        />
      </div>

      <div className="mb-[20px] flex flex-wrap gap-[8px]">
        {traditionList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTraditionChange(tab.id)}
            className="cursor-pointer rounded-[10px] border-none px-[14px] py-[8px] text-[12px] font-bold transition-colors"
            style={{
              backgroundColor: activeTradition === tab.id ? tab.color : "#f1f5f9",
              color: activeTradition === tab.id ? "#fff" : "#64748b",
            }}
          >
            {tab.label}
            {tab.count ? ` (${tab.count})` : ""}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-[10px] py-[60px] text-[14px] font-sans text-brand-muted">
          <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {t("library_loading")}
        </div>
      )}

      {!loading && filteredBooks.length === 0 && (
        <div className="rounded-[16px] border border-brand-line bg-white p-[40px] text-center shadow-brand">
          <p className="m-0 text-[14px] text-brand-muted">
            {t("library_no_results")}
          </p>
        </div>
      )}

      {!loading && filteredBooks.length > 0 && (
        <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.map((book) => (
            <LibraryBookCard key={book.id} book={book} lang={lang} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<LibraryFallback />}>
      <LibraryPageClient />
    </Suspense>
  );
}
