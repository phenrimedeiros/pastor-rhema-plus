"use client";

import { useMemo, useState } from "react";
import { Btn, Card } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";

const LOCALE_MAP = { pt: "pt-BR", en: "en-US", es: "es-ES" };

function formatGeneratedAt(value, lang) {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleString(LOCALE_MAP[lang] || "pt-BR", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function humanizeKey(key) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toPreviewText(value, depth = 0) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, 6)
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const firstValues = Object.values(item).map((inner) => toPreviewText(inner, depth + 1)).filter(Boolean);
          return firstValues.slice(0, 2).join(" • ");
        }
        return toPreviewText(item, depth + 1);
      })
      .filter(Boolean)
      .join("\n");
  }

  if (typeof value === "object") {
    const lines = Object.entries(value)
      .filter(([, entry]) => entry != null && entry !== "")
      .flatMap(([key, entry]) => {
        const preview = toPreviewText(entry, depth + 1);
        if (!preview) return [];
        if (depth > 1) return [preview];
        return [`${humanizeKey(key)}: ${preview}`];
      });

    return lines.slice(0, 14).join("\n");
  }

  return "";
}

export default function VersionHistoryCard({
  title,
  versions = [],
  activeVersionId,
  onRestore,
  restoringVersionId,
  onDuplicate,
  duplicatingVersionId,
}) {
  const [compareVersionId, setCompareVersionId] = useState("");
  const { t, lang } = useLanguage();

  const activeVersion = useMemo(
    () => versions.find((version) => version.id === activeVersionId) || null,
    [versions, activeVersionId]
  );

  const compareVersion = useMemo(
    () => versions.find((version) => version.id === compareVersionId) || null,
    [versions, compareVersionId]
  );

  if (!versions.length) return null;

  return (
    <Card className="self-start">
      <h4 className="m-0 mb-[12px] text-[18px] font-serif">{title}</h4>
      <div className="grid gap-[10px]">
        {versions.map((version) => {
          const isActive = version.id === activeVersionId;
          const isRestoring = restoringVersionId === version.id;
          const isDuplicating = duplicatingVersionId === version.id;
          const isComparing = compareVersionId === version.id;

          return (
            <div
              key={version.id}
              className={`p-[12px] rounded-[14px] border ${isActive ? "border-green-600/20 bg-brand-green-soft" : "border-brand-line bg-brand-surface-2"}`}
            >
              <div className="flex justify-between gap-[10px] items-center mb-[8px]">
                <div>
                  <p className={`m-0 mb-[2px] text-[13px] font-extrabold font-sans ${isActive ? "text-green-800" : "text-brand-text"}`}>
                    {t("version_label")} {version.version}
                  </p>
                  <p className="m-0 text-[12px] text-brand-muted font-sans">
                    {formatGeneratedAt(version.generated_at || version.created_at, lang)}
                  </p>
                </div>
                <span className={`text-[12px] font-bold font-sans ${isActive ? "text-green-800" : "text-brand-muted"}`}>
                  {isActive ? t("version_current") : t("version_saved")}
                </span>
              </div>

              <div className="grid gap-[8px]">
                {!isActive && (
                  <Btn
                    variant="secondary"
                    onClick={() => onRestore(version)}
                    disabled={!!restoringVersionId || !!duplicatingVersionId}
                    className="w-full"
                  >
                    {isRestoring ? t("version_restoring") : t("version_restore")}
                  </Btn>
                )}

                <Btn
                  variant="secondary"
                  onClick={() => setCompareVersionId((prev) => (prev === version.id ? "" : version.id))}
                  disabled={!!restoringVersionId || !!duplicatingVersionId}
                  className="w-full"
                >
                  {isComparing ? t("version_hide_compare") : t("version_compare")}
                </Btn>

                {onDuplicate && (
                  <Btn
                    variant="secondary"
                    onClick={() => onDuplicate(version)}
                    disabled={!!restoringVersionId || !!duplicatingVersionId}
                    className="w-full"
                  >
                    {isDuplicating ? t("version_duplicating") : t("version_duplicate")}
                  </Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {compareVersion && activeVersion && compareVersion.id !== activeVersion.id && (
        <div className="mt-[16px] grid gap-[12px]">
          <div>
            <h5 className="m-0 mb-[6px] text-[15px] font-serif">{t("version_compare_title")}</h5>
            <p className="m-0 text-[13px] text-brand-muted leading-[1.6] font-sans">
              {t("version_compare_hint")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-[12px]">
            {[
              { label: `${t("version_current")} · ${t("version_label")} ${activeVersion.version}`, version: activeVersion },
              { label: `${t("version_saved")} · ${t("version_label")} ${compareVersion.version}`, version: compareVersion },
            ].map((item) => (
              <div
                key={item.label}
                className="border border-brand-line rounded-[14px] bg-white p-[12px]"
              >
                <p className="m-0 mb-[8px] text-[12px] text-brand-primary font-extrabold font-sans">
                  {item.label}
                </p>
                <pre className="m-0 whitespace-pre-wrap break-words text-brand-muted text-[12px] leading-[1.6] font-sans">
                  {toPreviewText(item.version.content) || t("version_no_preview")}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
