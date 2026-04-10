"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

const DISMISS_KEY_PREFIX = "rhema_votd_dismissed_";

function todayKey() {
  return DISMISS_KEY_PREFIX + new Date().toISOString().split("T")[0];
}

export default function VerseOfDay() {
  const { lang, t } = useLanguage();
  const [verse, setVerse] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(todayKey())) return;

    fetch(`/api/verse-of-day?lang=${lang}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.text) {
          setVerse(data);
          setVisible(true);
        }
      })
      .catch(() => {});
  }, [lang]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(todayKey(), "1");
    } catch {}
  };

  if (!visible || !verse) return null;

  return (
    <div className="relative mb-[20px] rounded-[20px] overflow-hidden border border-brand-gold/30 bg-gradient-to-br from-[#fffbf0] to-[#fff8e6] shadow-[0_4px_20px_rgba(202,161,74,.12)]">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-[40px] -top-[40px] h-[160px] w-[160px] rounded-full bg-[radial-gradient(circle,rgba(202,161,74,.15),transparent_65%)]" />

      <div className="relative z-10 p-[16px_18px] md:p-[18px_24px]">
        <div className="flex items-start justify-between gap-[12px]">
          <div className="flex items-center gap-[10px] mb-[10px]">
            <span className="text-[18px]">✨</span>
            <span className="text-[11px] font-extrabold uppercase tracking-[.1em] text-brand-gold font-sans">
              {t("votd_label")}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            aria-label={t("votd_dismiss")}
            className="shrink-0 mt-[2px] grid h-[24px] w-[24px] place-items-center rounded-full border-none bg-brand-gold/10 text-brand-gold text-[14px] font-bold cursor-pointer hover:bg-brand-gold/20 transition-colors"
          >
            ×
          </button>
        </div>

        <p className="m-0 mb-[10px] text-[16px] md:text-[17px] text-brand-primary leading-[1.65] font-serif italic">
          &ldquo;{verse.text}&rdquo;
        </p>

        <p className="m-0 text-[13px] font-bold text-brand-gold font-sans">
          — {verse.ref}
        </p>
      </div>
    </div>
  );
}
