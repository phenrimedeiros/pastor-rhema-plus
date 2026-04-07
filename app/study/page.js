"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState, sermonContent } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
import { T } from "@/lib/tokens";
import { Btn, Card, Pill, Notice, Loader } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";
import { useLanguage } from "@/lib/i18n";
import SermonFlowNav from "@/components/SermonFlowNav";
import { upsertCurrentWeekStep } from "@/lib/sermonFlow";
import VersionHistoryCard from "@/components/VersionHistoryCard";

function toPlainText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(toPlainText).filter(Boolean).join(" • ");
  if (typeof value === "object") return Object.values(value).map(toPlainText).filter(Boolean).join(" • ");
  return "";
}

function toTextList(value) {
  if (Array.isArray(value)) return value.map(toPlainText).filter(Boolean);
  const single = toPlainText(value);
  return single ? [single] : [];
}

function normalizeStudyContent(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  return {
    ...raw,
    contextSummary: toPlainText(raw.contextSummary),
    theologicalInsight: toPlainText(raw.theologicalInsight),
    pastoralAngle: toPlainText(raw.pastoralAngle),
    centralTruth: toPlainText(raw.centralTruth),
    pastoralNeed: toPlainText(raw.pastoralNeed),
    preachingDirection: toPlainText(raw.preachingDirection),
    keyTerms: toTextList(raw.keyTerms),
    crossReferences: toTextList(raw.crossReferences),
  };
}

export default function StudyPage() {
  const [estado, setEstado] = useState(null);
  const [study, setStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [versions, setVersions] = useState([]);
  const [restoringVersionId, setRestoringVersionId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  const loadVersions = async (weekId) => {
    if (!weekId) return;
    const data = await sermonContent.getContentVersions(weekId, "study");
    setVersions(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }
      const novo = await loadFullState();
      if (!novo.authenticated) { router.push("/login"); return; }
      setEstado(novo);
      const activeSerie = novo.series?.find((s) => !s.is_archived);
      const currentWeek = activeSerie?.current_week ?? 1;
      const week = activeSerie?.weeks?.[currentWeek - 1];
      if (week?.study?.content) {
        setStudy(normalizeStudyContent(week.study.content));
        await loadVersions(week.id);
      }
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSerie = estado?.series?.find((s) => !s.is_archived);
  const currentWeek = activeSerie?.current_week ?? 1;
  const week = activeSerie?.weeks?.[currentWeek - 1];
  const keyTerms = study?.keyTerms || [];
  const crossReferences = study?.crossReferences || [];

  const generate = async () => {
    if (!week) return;
    setError("");
    setGenerating(true);
    try {
      const data = await callApi("/api/gerar-estudo", {
        weekId: week.id,
        passage: week.passage,
        title: week.title,
        focus: week.focus,
        seriesContext: activeSerie.series_name,
      });
      const normalizedContent = normalizeStudyContent(data.content);
      setStudy(normalizedContent);
      setEstado((prev) => upsertCurrentWeekStep(prev, "study", normalizedContent));
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const restoreVersion = async (version) => {
    if (!week) return;
    setError("");
    setRestoringVersionId(version.id);
    try {
      const restored = await sermonContent.setActiveVersion(version.id, week.id, "study");
      const normalizedContent = normalizeStudyContent(restored.content);
      setStudy(normalizedContent);
      setEstado((prev) => upsertCurrentWeekStep(prev, "study", normalizedContent));
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setRestoringVersionId("");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
      <Loader text={t("common_loading")} />
    </div>
  );

  const studyBlocks = [
    { title: t("study_context"),     content: study?.contextSummary },
    { title: t("study_theological"), content: study?.theologicalInsight },
    { title: t("study_pastoral"),    content: study?.pastoralAngle },
  ];

  const snapshotBlocks = [
    { title: t("study_central_truth"), content: study?.centralTruth },
    { title: t("study_pastoral_need"), content: study?.pastoralNeed },
    { title: t("study_direction"),     content: study?.preachingDirection },
  ];

  return (
    <AppLayout profile={estado.profile}>
      <SermonFlowNav
        currentStepKey="study"
        week={week}
        canContinue={!!study}
        savedContentText={week?.study ? t("study_use") : ""}
      />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>

        {/* Left — Main */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>{t("study_title")}</h4>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                {t("study_subtitle")}
              </p>
            </div>
            <Pill>Step 2</Pill>
          </div>

          {week
            ? <Notice color="blue">{week.passage} · {t("dash_week_of")} {currentWeek} — {week.title}</Notice>
            : <Notice color="gold">{t("study_no_series")}</Notice>
          }

          {error && <Notice color="red">{error}</Notice>}

          {!study && !generating && week && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Btn onClick={generate}>{t("study_generate")}</Btn>
            </div>
          )}

          {generating && <Loader text={t("study_generating")} />}

          {study && (
            <>
              <div style={{ display: "grid", gap: "12px" }}>
                {studyBlocks.map((block) => (
                  <div key={block.title} style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>{block.title}</h5>
                    <p style={{ margin: 0, color: T.muted, fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{block.content}</p>
                  </div>
                ))}

                {keyTerms.length > 0 && (
                  <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>{t("study_key_terms")}</h5>
                    {keyTerms.map((term, i) => (
                      <p key={i} style={{ margin: "4px 0", color: T.muted, fontSize: "13px", fontFamily: T.fontSans }}>• {term}</p>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", flexWrap: "wrap", gap: "12px" }}>
                <Btn variant="secondary" onClick={generate}>{t("study_regenerate")}</Btn>
                <Btn onClick={() => router.push("/builder")}>{t("study_use")}</Btn>
              </div>
            </>
          )}
        </Card>

        {/* Right — Snapshot */}
        <div style={{ display: "grid", gap: "22px", alignContent: "start" }}>
          <VersionHistoryCard
            title={t("study_versions")}
            versions={versions}
            activeVersionId={week?.study?.id}
            onRestore={restoreVersion}
            restoringVersionId={restoringVersionId}
          />
          <Card>
            <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>{t("study_snapshot")}</h4>
            {study ? (
              <div style={{ display: "grid", gap: "12px" }}>
                {snapshotBlocks.map((r) => (
                  <div key={r.title} style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "14px", background: T.surface2 }}>
                    <b style={{ display: "block", fontSize: "13px", marginBottom: "4px", fontFamily: T.fontSans }}>{r.title}</b>
                    <span style={{ color: T.muted, fontSize: "12.5px", lineHeight: 1.5, fontFamily: T.fontSans }}>{r.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>{t("study_no_snapshot")}</p>
            )}
          </Card>

          {crossReferences.length > 0 && (
            <Card>
              <h4 style={{ margin: "0 0 10px", fontSize: "16px", fontFamily: T.font }}>{t("study_cross_refs")}</h4>
              {crossReferences.map((r, i) => (
                <p key={i} style={{ margin: "4px 0", color: T.muted, fontSize: "13px", fontFamily: T.fontSans }}>📖 {r}</p>
              ))}
            </Card>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
