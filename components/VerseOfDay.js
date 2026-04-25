"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

const DISMISS_KEY_PREFIX = "rhema_votd_dismissed_";
const SHARE_FILE_PREFIX = {
  pt: "versiculo-do-dia",
  en: "verse-of-the-day",
  es: "versiculo-del-dia",
};

function todayKey() {
  return DISMISS_KEY_PREFIX + new Date().toISOString().split("T")[0];
}

function buildShareFileName(lang, date) {
  const prefix = SHARE_FILE_PREFIX[lang] || SHARE_FILE_PREFIX.pt;
  const safeDate = date || new Date().toISOString().split("T")[0];
  return `${prefix}-${safeDate}.png`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function VerseOfDay() {
  const { lang, t } = useLanguage();
  const [verse, setVerse] = useState(null);
  const [visible, setVisible] = useState(false);
  const [shareState, setShareState] = useState("idle");

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

  useEffect(() => {
    setShareState("idle");
  }, [lang, verse?.ref]);

  useEffect(() => {
    if (shareState === "idle" || shareState === "loading") return undefined;

    const timeoutId = window.setTimeout(() => {
      setShareState("idle");
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [shareState]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(todayKey(), "1");
    } catch {}
  };

  const handleShare = async () => {
    if (!verse || shareState === "loading") return;

    setShareState("loading");

    try {
      const response = await fetch("/api/verse-of-day/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ verse, lang }),
      });

      if (!response.ok) {
        throw new Error("share-image-request-failed");
      }

      const blob = await response.blob();
      const fileName = buildShareFileName(lang, verse.date);
      const file = typeof File === "function"
        ? new File([blob], fileName, { type: "image/png" })
        : null;
      const shareText = `"${verse.text}" — ${verse.ref}`;
      const canShareFile = Boolean(
        file &&
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (typeof navigator.canShare !== "function" || navigator.canShare({ files: [file] }))
      );

      if (canShareFile) {
        await navigator.share({
          files: [file],
          title: verse.ref,
          text: shareText,
        });
        setShareState("success");
        return;
      }

      downloadBlob(blob, fileName);
      setShareState("downloaded");
    } catch (error) {
      if (error?.name === "AbortError") {
        setShareState("idle");
        return;
      }

      setShareState("error");
    }
  };

  if (!visible || !verse) return null;

  const isSharing = shareState === "loading";
  const shareFeedback = {
    success: {
      text: t("votd_share_success"),
      className: "text-green-700",
    },
    downloaded: {
      text: t("votd_share_downloaded"),
      className: "text-[#8a651e]",
    },
    error: {
      text: t("votd_share_error"),
      className: "text-red-700",
    },
  }[shareState];

  return (
    <div className="relative mb-[14px] overflow-hidden rounded-[16px] border border-brand-gold/30 bg-gradient-to-br from-[#fffbf0] to-[#fff8e6] shadow-[0_4px_20px_rgba(202,161,74,.12)] md:mb-[20px] md:rounded-[20px]">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-[40px] -top-[40px] h-[160px] w-[160px] rounded-full bg-[radial-gradient(circle,rgba(202,161,74,.15),transparent_65%)]" />

      <div className="relative z-10 p-[12px_14px] md:p-[18px_24px]">
        <div className="flex items-start justify-between gap-[10px]">
          <div className="mb-[8px] flex items-center gap-[8px] md:mb-[10px] md:gap-[10px]">
            <span className="text-[15px] md:text-[16px]">✨</span>
            <span className="font-sans text-[10px] font-extrabold uppercase text-brand-gold md:text-[11px]">
              {t("votd_label")}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            aria-label={t("votd_dismiss")}
            className="mt-[1px] grid h-[22px] w-[22px] shrink-0 cursor-pointer place-items-center rounded-full border-none bg-brand-gold/10 text-[13px] font-bold text-brand-gold transition-colors hover:bg-brand-gold/20 md:mt-[2px] md:h-[24px] md:w-[24px] md:text-[13px]"
          >
            ×
          </button>
        </div>

        <p className="m-0 mb-[8px] font-serif text-[14px] italic leading-[1.5] text-brand-primary md:mb-[10px] md:text-[15px] md:leading-[1.55]">
          &ldquo;{verse.text}&rdquo;
        </p>

        <div className="mt-[10px] flex flex-col gap-[10px] sm:flex-row sm:items-end sm:justify-between md:mt-[14px] md:gap-[12px]">
          <p className="m-0 font-sans text-[12px] font-bold text-brand-gold md:text-[12px]">
            — {verse.ref}
          </p>

          <button
            onClick={handleShare}
            disabled={isSharing}
            className="inline-flex min-h-[36px] items-center justify-center gap-[7px] rounded-full border-none bg-brand-primary px-[12px] py-[8px] font-sans text-[12px] font-extrabold text-white shadow-[0_10px_24px_rgba(11,42,91,.18)] transition-all hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70 md:min-h-[38px] md:gap-[8px] md:px-[14px] md:py-[9px] md:text-[12px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="m8.59 13.51 6.83 3.98" />
              <path d="m15.41 6.51-6.82 3.98" />
            </svg>
            <span>{isSharing ? t("votd_share_loading") : t("votd_share")}</span>
          </button>
        </div>

        {shareFeedback ? (
          <p
            aria-live="polite"
            className={`m-0 mt-[10px] font-sans text-[11px] font-semibold leading-[1.45] md:mt-[12px] md:text-[12px] md:leading-[1.55] ${shareFeedback.className}`}
          >
            {shareFeedback.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
