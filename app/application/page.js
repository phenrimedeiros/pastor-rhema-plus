"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState, sermonContent } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
import { Btn, Card, Pill, Notice, Loader, Field } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/lib/i18n";
import SermonFlowNav from "@/components/SermonFlowNav";
import { upsertCurrentWeekStep, upsertCurrentWeekStepRecord } from "@/lib/sermonFlow";
import VersionHistoryCard from "@/components/VersionHistoryCard";

function prepareApplicationContent(raw) {
  if (!raw) return null;
  return {
    ...raw,
    approvedWeeklyChallenge: raw.approvedWeeklyChallenge || raw.weeklyChallenge || "",
  };
}

function getApplicationChoiceSignature(application) {
  if (!application) return "";
  return JSON.stringify({
    approvedWeeklyChallenge: application.approvedWeeklyChallenge || "",
  });
}

export default function ApplicationPage() {
  const [estado, setEstado] = useState(null);
  const [application, setApplication] = useState(null);
  const [builderData, setBuilderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingChoices, setSavingChoices] = useState(false);
  const [versions, setVersions] = useState([]);
  const [restoringVersionId, setRestoringVersionId] = useState("");
  const [duplicatingVersionId, setDuplicatingVersionId] = useState("");
  const [error, setError] = useState("");
  const [choiceMessage, setChoiceMessage] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const router = useRouter();
  const { t } = useLanguage();
  const lastSavedSignatureRef = useRef("");

  const loadVersions = async (weekId) => {
    if (!weekId) return;
    const data = await sermonContent.getContentVersions(weekId, "application");
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
      if (week?.builder) setBuilderData(week.builder.content);
      if (week?.application?.content) {
        const preparedContent = prepareApplicationContent(week.application.content);
        setApplication(preparedContent);
        lastSavedSignatureRef.current = getApplicationChoiceSignature(preparedContent);
        setSaveState("saved");
        await loadVersions(week.id);
      }

      setLoading(false);
    };
    init();
  }, [router]);

  const activeSerie = estado?.series?.find((s) => !s.is_archived);
  const currentWeek = activeSerie?.current_week ?? 1;
  const week = activeSerie?.weeks?.[currentWeek - 1];
  const approvedWeeklyChallenge = application?.approvedWeeklyChallenge || application?.weeklyChallenge || "";

  const generate = async () => {
    if (!week || !builderData) return;
    setError("");
    setGenerating(true);
    try {
      const data = await callApi("/api/gerar-aplicacao", {
        weekId: week.id,
        passage: week.passage,
        bigIdea: builderData.approvedBigIdea || builderData.bigIdea,
        points: builderData.approvedPoints || builderData.points,
      });
      const preparedContent = prepareApplicationContent(data.content);
      setApplication(preparedContent);
      setEstado((prev) => upsertCurrentWeekStep(prev, "application", preparedContent));
      lastSavedSignatureRef.current = getApplicationChoiceSignature(preparedContent);
      setSaveState("saved");
      setChoiceMessage("");
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveApplicationChoices = async ({ silent = false } = {}) => {
    if (!week || !application) return;
    if (!silent) {
      setError("");
      setChoiceMessage("");
      setSavingChoices(true);
    } else {
      setSaveState("saving");
    }
    try {
      const content = prepareApplicationContent(application);
      await sermonContent.updateActiveContent(week.id, "application", content);
      setApplication(content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "application", content));
      lastSavedSignatureRef.current = getApplicationChoiceSignature(content);
      setSaveState("saved");
      if (!silent) setChoiceMessage(t("common_saved"));
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
      setSaveState("error");
    } finally {
      if (!silent) setSavingChoices(false);
    }
  };

  const restoreVersion = async (version) => {
    if (!week) return;
    setError("");
    setChoiceMessage("");
    setRestoringVersionId(version.id);
    try {
      const restored = await sermonContent.setActiveVersion(version.id, week.id, "application");
      const preparedContent = prepareApplicationContent(restored.content);
      setApplication(preparedContent);
      setEstado((prev) => upsertCurrentWeekStepRecord(prev, "application", { ...restored, content: preparedContent }));
      lastSavedSignatureRef.current = getApplicationChoiceSignature(preparedContent);
      setSaveState("saved");
      setChoiceMessage(`Version ${version.version} restored.`);
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
    setChoiceMessage("");
    setDuplicatingVersionId(version.id);
    try {
      const duplicated = await sermonContent.duplicateVersion(version.id, week.id, "application");
      const preparedContent = prepareApplicationContent(duplicated.content);
      setApplication(preparedContent);
      setEstado((prev) => upsertCurrentWeekStepRecord(prev, "application", { ...duplicated, content: preparedContent }));
      lastSavedSignatureRef.current = getApplicationChoiceSignature(preparedContent);
      setSaveState("saved");
      setChoiceMessage(`Version ${version.version} duplicated as your new active application set.`);
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDuplicatingVersionId("");
    }
  };

  useEffect(() => {
    if (!application || !week) return undefined;
    const signature = getApplicationChoiceSignature(application);
    if (!signature || signature === lastSavedSignatureRef.current) return undefined;

    setSaveState("pending");
    const timeoutId = window.setTimeout(() => {
      saveApplicationChoices({ silent: true });
    }, 900);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application, week]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
      <Loader text={t("common_loading")} />
    </div>
  );

  const needsBuilder = !builderData;

  return (
    <AppLayout profile={estado.profile}>
      <SermonFlowNav
        currentStepKey="application"
        week={week}
        canContinue={!!application}
        savedContentText={week?.application ? t("app_save") : ""}
      />
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_.8fr] gap-[16px] md:gap-[22px]">

        {/* Left */}
        <Card>
          <div className="flex flex-col md:flex-row justify-between items-start gap-[12px] mb-[16px]">
            <div>
              <h4 className="m-0 mb-[6px] text-[20px] font-serif">{t("app_title")}</h4>
              <p className="m-0 text-[14px] text-brand-muted font-sans">
                {t("app_subtitle")}
              </p>
            </div>
            <Pill>Step 5</Pill>
          </div>

          {needsBuilder && <Notice color="gold">{t("app_no_builder")}</Notice>}
          {error && <Notice color="red">{error}</Notice>}
          {choiceMessage && <Notice color="green">{choiceMessage}</Notice>}

          {!application && !generating && !needsBuilder && (
            <div className="text-center p-[32px_0]">
              <Btn onClick={generate}>{t("app_generate")}</Btn>
            </div>
          )}

          {generating && <Loader text={t("app_generating")} />}

          {application?.applications?.map((a, i) => (
             <div key={i} className="border border-brand-line rounded-[18px] p-[18px] mb-[14px] bg-gradient-to-b from-white to-[#fbfcfe]">
              <Pill className="mb-[12px] bg-brand-violet-soft text-violet-800">
                {a.forPoint}
              </Pill>
              <p className="m-0 mb-[8px] text-brand-text text-[14px] md:text-[15px] font-bold leading-[1.55] font-sans">
                {a.action}
              </p>
              <p className="m-0 mb-[6px] text-brand-muted text-[13px] leading-[1.65] font-sans">
                {t("app_when")} {a.context}
              </p>
              <p className="m-0 text-brand-green text-[13px] font-semibold italic font-sans">
                &quot;{a.encouragement}&quot;
              </p>
            </div>
          ))}

          {application?.weeklyChallenge && (
            <div className="border border-green-600/18 rounded-[18px] p-[18px] bg-brand-green-soft mb-[14px]">
              <h5 className="m-0 mb-[12px] text-[15px] text-green-800 font-sans">
                {t("app_weekly_challenge")}
              </h5>
              <Field label={t("app_final_challenge")}>
                <textarea
                  value={approvedWeeklyChallenge}
                  onChange={(e) => setApplication((prev) => ({ ...prev, approvedWeeklyChallenge: e.target.value }))}
                  rows={4}
                  className="w-full p-[12px_14px] rounded-[14px] border border-green-600/18 bg-white text-brand-text resize-y text-[14px] leading-[1.6] font-sans"
                />
              </Field>
              <div className="mt-[12px] flex justify-end">
                <div className="flex items-center gap-[12px] flex-wrap justify-end">
                  <span className={`text-[12px] font-sans ${saveState === "error" ? "text-red-700" : "text-brand-muted"}`}>
                    {saveState === "pending"
                      ? t("common_unsaved")
                      : saveState === "saving"
                        ? t("app_saving")
                        : saveState === "saved"
                          ? t("common_saved")
                          : ""}
                  </span>
                <Btn variant="secondary" onClick={() => saveApplicationChoices()} disabled={savingChoices}>
                  {savingChoices ? t("app_saving") : t("app_save")}
                </Btn>
                </div>
              </div>
            </div>
          )}

          {application && (
            <div className="flex justify-between mt-[18px] flex-wrap gap-[12px]">
              <Btn variant="secondary" onClick={generate}>{t("app_regenerate")}</Btn>
              <Btn onClick={() => router.push("/final")}>{t("app_next")}</Btn>
            </div>
          )}
        </Card>

        {/* Right — Reflection Questions */}
        <div className="grid gap-[22px] content-start">
          <VersionHistoryCard
            title={t("app_versions")}
            versions={versions}
            activeVersionId={week?.application?.id}
            onRestore={restoreVersion}
            restoringVersionId={restoringVersionId}
            onDuplicate={duplicateVersion}
            duplicatingVersionId={duplicatingVersionId}
          />
          <Card>
            <h4 className="m-0 mb-[12px] text-[18px] font-serif">{t("app_reflection")}</h4>
            {application?.reflectionQuestions ? (
              application.reflectionQuestions.map((q, i) => (
                <div key={i} className="p-[12px] rounded-[14px] bg-brand-surface-2 border border-brand-line mb-[10px]">
                  <p className="m-0 text-brand-text text-[13px] font-sans">
                    {i + 1}. {q}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-brand-muted text-[14px] font-sans">
                {t("app_no_reflection")}
              </p>
            )}
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
