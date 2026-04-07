"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState, sermonContent } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
import { T } from "@/lib/tokens";
import { Btn, Card, Pill, Notice, Loader, Field } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";
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
  const isMobile = useIsMobile();
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [application, week]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>

        {/* Left */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>{t("app_title")}</h4>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                {t("app_subtitle")}
              </p>
            </div>
            <Pill>Step 5</Pill>
          </div>

          {needsBuilder && <Notice color="gold">{t("app_no_builder")}</Notice>}
          {error && <Notice color="red">{error}</Notice>}
          {choiceMessage && <Notice color="green">{choiceMessage}</Notice>}

          {!application && !generating && !needsBuilder && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Btn onClick={generate}>{t("app_generate")}</Btn>
            </div>
          )}

          {generating && <Loader text={t("app_generating")} />}

          {application?.applications?.map((a, i) => (
            <div key={i} style={{
              border: `1px solid ${T.line}`, borderRadius: "18px", padding: "18px",
              marginBottom: "14px", background: "linear-gradient(180deg, #fff, #fbfcfe)",
            }}>
              <Pill style={{ marginBottom: "12px", background: T.violetSoft, color: "#5b21b6" }}>
                {a.forPoint}
              </Pill>
              <p style={{ margin: "0 0 8px", color: T.text, fontSize: isMobile ? "15px" : "14px", fontWeight: 700, lineHeight: 1.55, fontFamily: T.fontSans }}>
                {a.action}
              </p>
              <p style={{ margin: "0 0 6px", color: T.muted, fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>
                {t("app_when")} {a.context}
              </p>
              <p style={{ margin: 0, color: T.green, fontSize: "13px", fontWeight: 600, fontStyle: "italic", fontFamily: T.fontSans }}>
                &quot;{a.encouragement}&quot;
              </p>
            </div>
          ))}

          {application?.weeklyChallenge && (
            <div style={{
              border: `1px solid rgba(22,163,74,.18)`, borderRadius: "18px", padding: "18px",
              background: T.greenSoft, marginBottom: "14px",
            }}>
              <h5 style={{ margin: "0 0 12px", fontSize: "15px", color: "#166534", fontFamily: T.fontSans }}>
                {t("app_weekly_challenge")}
              </h5>
              <Field label={t("app_final_challenge")}>
                <textarea
                  value={approvedWeeklyChallenge}
                  onChange={(e) => setApplication((prev) => ({ ...prev, approvedWeeklyChallenge: e.target.value }))}
                  rows={4}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: "14px",
                    border: "1px solid rgba(22,163,74,.18)", background: "#fff", color: T.text,
                    resize: "vertical", fontSize: "14px", lineHeight: 1.6, fontFamily: T.fontSans,
                  }}
                />
              </Field>
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "12px", color: saveState === "error" ? "#b91c1c" : T.muted, fontFamily: T.fontSans }}>
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
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", flexWrap: "wrap", gap: "12px" }}>
              <Btn variant="secondary" onClick={generate}>{t("app_regenerate")}</Btn>
              <Btn onClick={() => router.push("/final")}>{t("app_next")}</Btn>
            </div>
          )}
        </Card>

        {/* Right — Reflection Questions */}
        <div style={{ display: "grid", gap: "22px", alignContent: "start" }}>
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
            <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>{t("app_reflection")}</h4>
            {application?.reflectionQuestions ? (
              application.reflectionQuestions.map((q, i) => (
                <div key={i} style={{
                  padding: "12px", borderRadius: "14px", background: T.surface2,
                  border: `1px solid ${T.line}`, marginBottom: "10px",
                }}>
                  <p style={{ margin: 0, color: T.text, fontSize: "13px", fontFamily: T.fontSans }}>
                    {i + 1}. {q}
                  </p>
                </div>
              ))
            ) : (
              <p style={{ color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                {t("app_no_reflection")}
              </p>
            )}
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
