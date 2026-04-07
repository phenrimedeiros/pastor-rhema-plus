"use client";

import { useMemo, useState } from "react";
import { Btn, Card } from "@/components/ui";
import { useLanguage } from "@/lib/i18n";
import { T } from "@/lib/tokens";

function formatGeneratedAt(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  return date.toLocaleString("en-US", {
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
  title = "Version History",
  versions = [],
  activeVersionId,
  onRestore,
  restoringVersionId,
  onDuplicate,
  duplicatingVersionId,
}) {
  const [compareVersionId, setCompareVersionId] = useState("");
  const { t } = useLanguage();

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
    <Card style={{ alignSelf: "start" }}>
      <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>{title}</h4>
      <div style={{ display: "grid", gap: "10px" }}>
        {versions.map((version) => {
          const isActive = version.id === activeVersionId;
          const isRestoring = restoringVersionId === version.id;
          const isDuplicating = duplicatingVersionId === version.id;
          const isComparing = compareVersionId === version.id;

          return (
            <div
              key={version.id}
              style={{
                padding: "12px",
                borderRadius: "14px",
                border: `1px solid ${isActive ? "rgba(22,163,74,.22)" : T.line}`,
                background: isActive ? T.greenSoft : T.surface2,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "13px", color: isActive ? "#166534" : T.text, fontWeight: 800, fontFamily: T.fontSans }}>
                    {t("version_label")} {version.version}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: T.muted, fontFamily: T.fontSans }}>
                    {formatGeneratedAt(version.generated_at || version.created_at)}
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: isActive ? "#166534" : T.muted, fontWeight: 700, fontFamily: T.fontSans }}>
                  {isActive ? t("version_current") : t("version_saved")}
                </span>
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                {!isActive && (
                  <Btn
                    variant="secondary"
                    onClick={() => onRestore(version)}
                    disabled={!!restoringVersionId || !!duplicatingVersionId}
                    style={{ width: "100%" }}
                  >
                    {isRestoring ? t("version_restoring") : t("version_restore")}
                  </Btn>
                )}

                <Btn
                  variant="secondary"
                  onClick={() => setCompareVersionId((prev) => (prev === version.id ? "" : version.id))}
                  disabled={!!restoringVersionId || !!duplicatingVersionId}
                  style={{ width: "100%" }}
                >
                  {isComparing ? t("version_hide_compare") : t("version_compare")}
                </Btn>

                {onDuplicate && (
                  <Btn
                    variant="secondary"
                    onClick={() => onDuplicate(version)}
                    disabled={!!restoringVersionId || !!duplicatingVersionId}
                    style={{ width: "100%" }}
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
        <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
          <div>
            <h5 style={{ margin: "0 0 6px", fontSize: "15px", fontFamily: T.font }}>{t("version_compare_title")}</h5>
            <p style={{ margin: 0, fontSize: "13px", color: T.muted, lineHeight: 1.6, fontFamily: T.fontSans }}>
              {t("version_compare_hint")}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
            {[
              { label: `${t("version_current")} · ${t("version_label")} ${activeVersion.version}`, version: activeVersion },
              { label: `${t("version_saved")} · ${t("version_label")} ${compareVersion.version}`, version: compareVersion },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  border: `1px solid ${T.line}`,
                  borderRadius: "14px",
                  background: "#fff",
                  padding: "12px",
                }}
              >
                <p style={{ margin: "0 0 8px", fontSize: "12px", color: T.primary, fontWeight: 800, fontFamily: T.fontSans }}>
                  {item.label}
                </p>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: T.muted,
                    fontSize: "12px",
                    lineHeight: 1.6,
                    fontFamily: T.fontSans,
                  }}
                >
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
