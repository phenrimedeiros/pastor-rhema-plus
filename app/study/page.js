"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState, sermonContent } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
import { Btn, Card, Pill, Notice, Loader } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/lib/i18n";
import SermonFlowNav from "@/components/SermonFlowNav";
import { upsertCurrentWeekStep, upsertCurrentWeekStepRecord } from "@/lib/sermonFlow";
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
  const [duplicatingVersionId, setDuplicatingVersionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
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
  }, [router]);

  const activeSerie = estado?.series?.find((s) => !s.is_archived);
  const currentWeek = activeSerie?.current_week ?? 1;
  const week = activeSerie?.weeks?.[currentWeek - 1];
  const keyTerms = study?.keyTerms || [];
  const crossReferences = study?.crossReferences || [];

  const generate = async () => {
    if (!week) return;
    setError("");
    setMessage("");
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
    setMessage("");
    setRestoringVersionId(version.id);
    try {
      const restored = await sermonContent.setActiveVersion(version.id, week.id, "study");
      const normalizedContent = normalizeStudyContent(restored.content);
      setStudy(normalizedContent);
      setEstado((prev) => upsertCurrentWeekStepRecord(prev, "study", { ...restored, content: normalizedContent }));
      setMessage(`Version ${version.version} restored.`);
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setRestoringVersionId("");
    }
  };

  const duplicateVersion = async (version) => {
    if (!week) return;
    setError("");
    setMessage("");
    setDuplicatingVersionId(version.id);
    try {
      const duplicated = await sermonContent.duplicateVersion(version.id, week.id, "study");
      const normalizedContent = normalizeStudyContent(duplicated.content);
      setStudy(normalizedContent);
      setEstado((prev) => upsertCurrentWeekStepRecord(prev, "study", { ...duplicated, content: normalizedContent }));
      setMessage(`Version ${version.version} duplicated as your new active study.`);
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDuplicatingVersionId("");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
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
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_.8fr] gap-[16px] md:gap-[22px]">

        {/* Left — Main */}
        <Card>
          <div className="flex flex-col md:flex-row justify-between items-start gap-[12px] mb-[16px]">
            <div>
              <h4 className="m-0 mb-[6px] text-[20px] font-serif">{t("study_title")}</h4>
              <p className="m-0 text-[14px] text-brand-muted font-sans">
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
          {message && <Notice color="green">{message}</Notice>}

          {!study && !generating && week && (
            <div className="text-center p-[28px_0] md:p-[36px_8px] grid gap-[14px] justify-items-center">
              <div className="w-[64px] h-[64px] rounded-[20px] bg-blue-50 grid place-items-center text-[28px]">
                🧠
              </div>
              <div className="max-w-[520px]">
                <h5 className="m-0 mb-[8px] text-[18px] text-brand-primary font-serif">
                  {t("study_empty_title")}
                </h5>
                <p className="m-0 text-[14px] text-brand-muted leading-[1.7] font-sans">
                  {t("study_empty_desc")}
                </p>
              </div>
              <Btn onClick={generate}>{t("study_empty_cta")}</Btn>
            </div>
          )}

          {generating && <Loader text={t("study_generating")} />}

          {study && (
            <>
              <div className="grid gap-[12px]">
                {studyBlocks.map((block) => (
                  <div key={block.title} className="border border-brand-line rounded-[16px] p-[15px]">
                    <h5 className="m-0 mb-[8px] text-[14px] font-sans">{block.title}</h5>
                    <p className="m-0 text-[13px] text-brand-muted leading-[1.65] font-sans whitespace-pre-wrap">{block.content}</p>
                  </div>
                ))}

                {keyTerms.length > 0 && (
                  <div className="border border-brand-line rounded-[16px] p-[15px]">
                    <h5 className="m-0 mb-[8px] text-[14px] font-sans">{t("study_key_terms")}</h5>
                    {keyTerms.map((term, i) => (
                      <p key={i} className="m-[4px_0] text-[13px] text-brand-muted font-sans">• {term}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-[18px] flex-wrap gap-[12px]">
                <Btn variant="secondary" onClick={generate}>{t("study_regenerate")}</Btn>
                <Btn onClick={() => router.push("/builder")}>{t("study_use")}</Btn>
              </div>
            </>
          )}
        </Card>

        {/* Right — Snapshot */}
        <div className="grid gap-[22px] content-start">
          <VersionHistoryCard
            title={t("study_versions")}
            versions={versions}
            activeVersionId={week?.study?.id}
            onRestore={restoreVersion}
            restoringVersionId={restoringVersionId}
            onDuplicate={duplicateVersion}
            duplicatingVersionId={duplicatingVersionId}
          />
          <Card>
            <h4 className="m-0 mb-[12px] text-[18px] font-serif">{t("study_snapshot")}</h4>
            {study ? (
              <div className="grid gap-[12px]">
                {snapshotBlocks.map((r) => (
                  <div key={r.title} className="border border-brand-line rounded-[16px] p-[14px] bg-brand-surface-2">
                    <b className="block text-[13px] mb-[4px] font-sans">{r.title}</b>
                    <span className="text-[12.5px] text-brand-muted leading-[1.5] font-sans">{r.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-brand-muted font-sans">{t("study_no_snapshot")}</p>
            )}
          </Card>

          {crossReferences.length > 0 && (
            <Card>
              <h4 className="m-0 mb-[10px] text-[16px] font-serif">{t("study_cross_refs")}</h4>
              {crossReferences.map((r, i) => (
                <p key={i} className="m-[4px_0] text-[13px] text-brand-muted font-sans">📖 {r}</p>
              ))}
            </Card>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
