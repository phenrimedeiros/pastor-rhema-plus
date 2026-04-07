"use client";

import { Btn, Card } from "@/components/ui";
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

export default function VersionHistoryCard({
  title = "Version History",
  versions = [],
  activeVersionId,
  onRestore,
  restoringVersionId,
}) {
  if (!versions.length) return null;

  return (
    <Card style={{ alignSelf: "start" }}>
      <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>{title}</h4>
      <div style={{ display: "grid", gap: "10px" }}>
        {versions.map((version) => {
          const isActive = version.id === activeVersionId;
          const isRestoring = restoringVersionId === version.id;
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
                    Version {version.version}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: T.muted, fontFamily: T.fontSans }}>
                    {formatGeneratedAt(version.generated_at || version.created_at)}
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: isActive ? "#166534" : T.muted, fontWeight: 700, fontFamily: T.fontSans }}>
                  {isActive ? "Current" : "Saved"}
                </span>
              </div>
              {!isActive && (
                <Btn
                  variant="secondary"
                  onClick={() => onRestore(version)}
                  disabled={!!restoringVersionId}
                  style={{ width: "100%" }}
                >
                  {isRestoring ? "Restoring..." : "Restore This Version"}
                </Btn>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
