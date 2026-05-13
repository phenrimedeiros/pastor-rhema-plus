"use client";

import { useState } from "react";

function formatYear(year) {
  if (!year || year === 9999) return "";
  return `, AD ${Math.abs(year)}`;
}

export default function CommentaryPanel({ commentaries, loading, t }) {
  const [expanded, setExpanded] = useState(new Set());

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-[10px] p-[14px]">
        {loading && (
          <div className="flex items-center justify-center gap-[10px] py-[30px]">
            <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="text-[13px] text-brand-muted">{t("commentary_loading")}</span>
          </div>
        )}

        {!loading && commentaries.length === 0 && (
          <p className="m-0 rounded-[12px] bg-slate-50 px-[12px] py-[14px] text-[13px] leading-[1.5] text-brand-muted">
            {t("commentary_empty")}
          </p>
        )}

        {commentaries.map((c, i) => {
          const isExpanded = expanded.has(i);
          const quote = c.quote || "";
          const truncated = quote.length > 300 && !isExpanded
            ? quote.slice(0, 300) + "..."
            : quote;

          return (
            <article
              key={i}
              className="rounded-[12px] border border-brand-gold/20 bg-brand-amber-soft/40 p-[12px]"
            >
              <div className="mb-[8px] flex items-start justify-between gap-[8px]">
                <div className="min-w-0">
                  <span className="text-[12px] font-bold text-brand-primary">
                    {c.author}
                    {c.appendAuthor ? ` ${c.appendAuthor}` : ""}
                  </span>
                  {c.year && c.year !== 9999 && (
                    <span className="ml-[6px] text-[11px] text-brand-muted">
                      AD {Math.abs(c.year)}
                    </span>
                  )}
                </div>
              </div>

              <p className="m-0 mb-[8px] whitespace-pre-line font-serif text-[13px] leading-[1.55] text-brand-text">
                {truncated}
              </p>

              {quote.length > 300 && (
                <button
                  onClick={() => toggleExpand(i)}
                  className="mb-[8px] cursor-pointer rounded-[6px] border-none bg-brand-primary/5 px-[8px] py-[4px] text-[11px] font-bold text-brand-primary transition-colors hover:bg-brand-primary/10"
                >
                  {isExpanded ? t("commentary_collapse") : t("commentary_expand")}
                </button>
              )}

              {c.sourceTitle && (
                <p className="m-0 text-[11px] text-brand-muted">
                  {t("commentary_source")}: {c.sourceUrl
                    ? <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">{c.sourceTitle}</a>
                    : c.sourceTitle}
                </p>
              )}
            </article>
          );
        })}
    </div>
  );
}
