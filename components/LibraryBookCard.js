"use client";

import { useRouter } from "next/navigation";

const TRADITION_COLORS = {
  protestant:         "#2ecc71",
  deuterocanonical:    "#9370DB",
  dss:                 "#00BFFF",
  gnostic:             "#ff4444",
  commentaries:        "#caa14a",
};

export default function LibraryBookCard({ book, lang }) {
  const router = useRouter();
  const title = typeof book.title === "string" ? book.title : (book.title?.[lang] || book.title?.en || book.id);
  const color = TRADITION_COLORS[book.tradition] || "#64748b";
  const isCommentary = book.tradition === "commentaries";

  const handleClick = () => {
    if (book.source === "bible") {
      const tab = isCommentary ? "&tab=commentary" : "";
      router.push(`/bible?b=${book.bibleIndex}&c=1${tab}`);
    } else {
      router.push(`/library/${book.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex cursor-pointer items-start gap-[12px] rounded-[14px] border border-brand-line bg-white p-[14px] text-left shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-md"
      style={{ borderLeftWidth: "4px", borderLeftColor: color }}
    >
      <div className="min-w-0 flex-1">
        <h3 className="m-0 mb-[4px] truncate font-serif text-[14px] font-bold text-brand-text">
          {title}
        </h3>
        {isCommentary ? (
          <p className="m-0 text-[11px] text-brand-muted">
            {book.commentaryCount > 0
              ? `${book.commentaryCount} coment. • ${book.authorCount} autores`
              : ""}
          </p>
        ) : (
          <p className="m-0 text-[11px] text-brand-muted">
            {book.totalChapters > 0 ? `${book.totalChapters} ${book.sectionType === "chapter" ? "cap" : "sec"}` : ""}
          </p>
        )}
      </div>
      {book.source === "bible" && (
        <span className="shrink-0 rounded-[6px] bg-brand-surface-3 px-[6px] py-[2px] text-[10px] font-bold text-brand-primary">
          {isCommentary ? "COMENT" : "BIBLIA"}
        </span>
      )}
    </button>
  );
}
