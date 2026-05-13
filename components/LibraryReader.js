"use client";

import { Fragment } from "react";

export default function LibraryReader({
  loading,
  title,
  chapterData,
  sectionData,
  selectedChapter,
  selectedSection,
  onChapterChange,
  onSectionChange,
  totalChapters,
  totalSections,
  sectionType,
  t,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-[10px] py-[40px] text-[14px] font-sans text-brand-muted">
        <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        {t("library_loading")}
      </div>
    );
  }

  if (sectionType === "chapter" && chapterData?.verses) {
    return (
      <div className="rounded-[16px] border border-brand-line bg-white shadow-brand md:rounded-[20px]">
        <div className="border-b border-brand-line px-[14px] py-[12px] md:px-[32px] md:py-[16px]">
          <h2 className="m-0 font-serif text-[20px] text-brand-primary md:text-[23px]">
            {title} {selectedChapter}
          </h2>
        </div>

        <div className="px-[12px] py-[14px] md:px-[32px] md:py-[28px]">
          <div className="flex flex-col gap-[2px]">
            {chapterData.verses.map((verse) => (
              <div
                key={verse.num}
                className="group flex items-start gap-[8px] rounded-[9px] border-l-4 border-transparent px-[6px] py-[4px] md:gap-[12px] md:px-[8px] md:py-[6px]"
              >
                <span className="mt-[3px] w-[20px] shrink-0 select-none text-right font-sans text-[10px] font-bold text-brand-gold/70 md:w-[24px] md:text-[11px]">
                  {verse.num}
                </span>
                <p className="m-0 flex-1 font-serif text-[15px] leading-[1.62] text-brand-text md:text-[16px] md:leading-[1.68]">
                  {verse.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-brand-line px-[20px] py-[14px] md:px-[32px]">
          <button
            onClick={() => onChapterChange(selectedChapter - 1)}
            disabled={selectedChapter <= 1}
            className="flex cursor-pointer items-center gap-[6px] rounded-[10px] border border-brand-line bg-slate-50 px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted transition-colors hover:border-brand-primary/30 hover:text-brand-primary disabled:cursor-default disabled:opacity-30"
          >
            &lsaquo; {t("library_prev")}
          </button>

          <select
            value={selectedChapter}
            onChange={(e) => onChapterChange(Number(e.target.value))}
            className="cursor-pointer rounded-[10px] border border-brand-line bg-white px-[12px] py-[8px] text-[13px] font-bold text-brand-primary outline-none md:hidden"
          >
            {Array.from({ length: totalChapters }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {t("library_chapter")} {i + 1}
              </option>
            ))}
          </select>

          <button
            onClick={() => onChapterChange(selectedChapter + 1)}
            disabled={selectedChapter >= totalChapters}
            className="flex cursor-pointer items-center gap-[6px] rounded-[10px] border border-brand-line bg-slate-50 px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted transition-colors hover:border-brand-primary/30 hover:text-brand-primary disabled:cursor-default disabled:opacity-30"
          >
            {t("library_next")} &rsaquo;
          </button>
        </div>
      </div>
    );
  }

  if (sectionType === "section" && sectionData?.paragraphs) {
    return (
      <div className="rounded-[16px] border border-brand-line bg-white shadow-brand md:rounded-[20px]">
        <div className="border-b border-brand-line px-[14px] py-[12px] md:px-[32px] md:py-[16px]">
          <h2 className="m-0 font-serif text-[20px] text-brand-primary md:text-[23px]">
            {title}
          </h2>
          {sectionData.heading && (
            <p className="m-0 mt-[6px] text-[14px] font-medium text-brand-muted">
              {sectionData.heading}
            </p>
          )}
        </div>

        <div className="px-[12px] py-[14px] md:px-[32px] md:py-[28px]">
          <div className="flex flex-col gap-[12px]">
            {sectionData.paragraphs.map((para, i) => (
              <div key={i} className="flex items-start gap-[8px] md:gap-[12px]">
                {para.number !== null && (
                  <span className="mt-[3px] w-[20px] shrink-0 select-none text-right font-sans text-[10px] font-bold text-brand-gold/70 md:w-[24px] md:text-[11px]">
                    {para.number}
                  </span>
                )}
                <p className="m-0 flex-1 font-serif text-[15px] leading-[1.62] text-brand-text md:text-[16px] md:leading-[1.68]">
                  {para.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-brand-line px-[20px] py-[14px] md:px-[32px]">
          <button
            onClick={() => onSectionChange(selectedSection - 1)}
            disabled={selectedSection <= 1}
            className="flex cursor-pointer items-center gap-[6px] rounded-[10px] border border-brand-line bg-slate-50 px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted transition-colors hover:border-brand-primary/30 hover:text-brand-primary disabled:cursor-default disabled:opacity-30"
          >
            &lsaquo; {t("library_prev")}
          </button>

          {totalSections > 1 && (
            <select
              value={selectedSection}
              onChange={(e) => onSectionChange(Number(e.target.value))}
              className="cursor-pointer rounded-[10px] border border-brand-line bg-white px-[12px] py-[8px] text-[13px] font-bold text-brand-primary outline-none"
            >
              {Array.from({ length: totalSections }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {t("library_section")} {i + 1}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={() => onSectionChange(selectedSection + 1)}
            disabled={selectedSection >= totalSections}
            className="flex cursor-pointer items-center gap-[6px] rounded-[10px] border border-brand-line bg-slate-50 px-[14px] py-[8px] text-[13px] font-semibold text-brand-muted transition-colors hover:border-brand-primary/30 hover:text-brand-primary disabled:cursor-default disabled:opacity-30"
          >
            {t("library_next")} &rsaquo;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-brand-line bg-white p-[32px] shadow-brand">
      <p className="m-0 text-center text-[14px] text-brand-muted">
        {t("library_no_content")}
      </p>
    </div>
  );
}
