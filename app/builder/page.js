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

function prepareBuilderContent(raw) {
  if (!raw) return null;
  return {
    ...raw,
    selectedTitle: raw.selectedTitle || raw.titleOptions?.[0] || "",
    approvedBigIdea: raw.approvedBigIdea || raw.bigIdea || "",
    approvedPoints: raw.approvedPoints || raw.points || [],
  };
}

function getBuilderChoiceSignature(builder) {
  if (!builder) return "";
  return JSON.stringify({
    selectedTitle: builder.selectedTitle || "",
    approvedBigIdea: builder.approvedBigIdea || "",
    approvedPoints: builder.approvedPoints || [],
  });
}

export default function BuilderPage() {
  const [estado, setEstado] = useState(null);
  const [builder, setBuilder] = useState(null);
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
    const data = await sermonContent.getContentVersions(weekId, "builder");
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
      if (week?.builder?.content) {
        const preparedContent = prepareBuilderContent(week.builder.content);
        setBuilder(preparedContent);
        lastSavedSignatureRef.current = getBuilderChoiceSignature(preparedContent);
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
  const selectedTitle = builder?.selectedTitle || builder?.titleOptions?.[0] || "";
  const approvedBigIdea = builder?.approvedBigIdea || builder?.bigIdea || "";
  const approvedPoints = builder?.approvedPoints || builder?.points || [];

  const generate = async () => {
    if (!week) return;
    setError("");
    setGenerating(true);
    try {
      const data = await callApi("/api/gerar-sermao", {
        weekId: week.id,
        passage: week.passage,
        title: week.title,
        focus: week.focus,
        bigIdea: week.big_idea,
        seriesId: activeSerie.id,
        weekNumber: currentWeek,
      });
      const preparedContent = prepareBuilderContent(data.content);
      setBuilder(preparedContent);
      setEstado((prev) => upsertCurrentWeekStep(prev, "builder", preparedContent));
      lastSavedSignatureRef.current = getBuilderChoiceSignature(preparedContent);
      setSaveState("saved");
      setChoiceMessage("");
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveBuilderChoices = async ({ silent = false } = {}) => {
    if (!week || !builder) return;
    if (!silent) {
      setError("");
      setChoiceMessage("");
      setSavingChoices(true);
    } else {
      setSaveState("saving");
    }
    try {
      const content = prepareBuilderContent(builder);
      await sermonContent.updateActiveContent(week.id, "builder", content);
      setBuilder(content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "builder", content));
      lastSavedSignatureRef.current = getBuilderChoiceSignature(content);
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
      const restored = await sermonContent.setActiveVersion(version.id, week.id, "builder");
      const preparedContent = prepareBuilderContent(restored.content);
      setBuilder(preparedContent);
      setEstado((prev) => upsertCurrentWeekStepRecord(prev, "builder", { ...restored, content: preparedContent }));
      lastSavedSignatureRef.current = getBuilderChoiceSignature(preparedContent);
      setSaveState("saved");
      setChoiceMessage(`Version ${version.version} is now your active sermon structure.`);
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
      const duplicated = await sermonContent.duplicateVersion(version.id, week.id, "builder");
      const preparedContent = prepareBuilderContent(duplicated.content);
      setBuilder(preparedContent);
      setEstado((prev) => upsertCurrentWeekStepRecord(prev, "builder", { ...duplicated, content: preparedContent }));
      lastSavedSignatureRef.current = getBuilderChoiceSignature(preparedContent);
      setSaveState("saved");
      setChoiceMessage(`Version ${version.version} duplicated as a new active sermon structure.`);
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setDuplicatingVersionId("");
    }
  };

  useEffect(() => {
    if (!builder || !week) return undefined;
    const signature = getBuilderChoiceSignature(builder);
    if (!signature || signature === lastSavedSignatureRef.current) return undefined;

    setSaveState("pending");
    const timeoutId = window.setTimeout(() => {
      saveBuilderChoices({ silent: true });
    }, 900);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [builder, week]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
      <Loader text={t("common_loading")} />
    </div>
  );

  return (
    <AppLayout profile={estado.profile}>
      <SermonFlowNav
        currentStepKey="builder"
        week={week}
        canContinue={!!builder}
        savedContentText={week?.builder ? "Your saved sermon structure is ready. Review it, refine it, or move on to illustrations." : ""}
      />
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_.8fr] gap-[16px] md:gap-[22px]">

        {/* Left — Main */}
        <Card>
          <div className="flex flex-col md:flex-row justify-between items-start gap-[12px] mb-[16px]">
            <div>
              <h4 className="m-0 mb-[6px] text-[20px] font-serif">{t("builder_title")}</h4>
              <p className="m-0 text-[14px] text-brand-muted font-sans">
                {t("builder_subtitle")}
              </p>
            </div>
            <Pill>Step 3</Pill>
          </div>

          {!week && <Notice color="gold">{t("builder_no_series")}</Notice>}
          {error && <Notice color="red">{error}</Notice>}
          {choiceMessage && <Notice color="green">{choiceMessage}</Notice>}

          {!builder && !generating && week && (
            <div className="text-center p-[32px_0]">
              <Btn onClick={generate}>{t("builder_generate")}</Btn>
            </div>
          )}

          {generating && <Loader text={t("builder_generating")} />}

          {builder && (
            <>
              <div className="grid gap-[14px] mb-[16px]">
                <div className="border border-brand-line rounded-[16px] p-[15px] bg-brand-surface-2">
                  <h5 className="m-0 mb-[10px] text-[14px] font-sans">{t("builder_approve_dir")}</h5>
                  <Field label={t("builder_pref_title")}>
                    <div className="grid gap-[8px]">
                      {builder.titleOptions?.map((title) => {
                        const active = selectedTitle === title;
                        return (
                          <button
                            key={title}
                            type="button"
                            onClick={() => setBuilder((prev) => ({ ...prev, selectedTitle: title }))}
                            className={`text-left p-[12px_14px] rounded-[14px] border border-solid font-sans text-[14px] cursor-pointer transition-colors ${active ? "border-brand-primary/22 bg-[#eef4ff] text-brand-primary font-extrabold" : "border-brand-line bg-white text-brand-text font-semibold hover:border-brand-primary/40"}`}
                          >
                            {title}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <div className="mt-[12px]">
                    <Field label={t("builder_approved_idea")}>
                      <textarea
                        value={approvedBigIdea}
                        onChange={(e) => setBuilder((prev) => ({ ...prev, approvedBigIdea: e.target.value }))}
                        rows={4}
                        className="w-full p-[12px_14px] rounded-[14px] border border-brand-line bg-white text-brand-text resize-y text-[14px] leading-[1.6] font-sans focus:border-brand-primary outline-none"
                      />
                    </Field>
                  </div>
                  {!!approvedPoints.length && (
                    <div className="mt-[12px] grid gap-[12px]">
                      <Field label={t("builder_approved_pts")}>
                        <div className="grid gap-[12px]">
                          {approvedPoints.map((point, index) => (
                            <div key={`${point.label}-${index}`} className="p-[12px] rounded-[14px] border border-brand-line bg-white">
                              <p className="m-0 mb-[10px] text-[12px] text-brand-primary font-extrabold font-sans">
                                {point.label}
                              </p>
                              <div className="grid gap-[10px]">
                                <Field label={t("builder_point_stmt")}>
                                  <textarea
                                    value={point.statement || ""}
                                    onChange={(e) => setBuilder((prev) => ({
                                      ...prev,
                                      approvedPoints: approvedPoints.map((item, pointIndex) => (
                                        pointIndex === index ? { ...item, statement: e.target.value } : item
                                      )),
                                    }))}
                                    rows={2}
                                    className="w-full p-[12px_14px] rounded-[14px] border border-brand-line bg-white text-brand-text resize-y text-[14px] leading-[1.6] font-sans focus:border-brand-primary outline-none"
                                  />
                                </Field>
                                <Field label={t("builder_point_exp")}>
                                  <textarea
                                    value={point.explanation || ""}
                                    onChange={(e) => setBuilder((prev) => ({
                                      ...prev,
                                      approvedPoints: approvedPoints.map((item, pointIndex) => (
                                        pointIndex === index ? { ...item, explanation: e.target.value } : item
                                      )),
                                    }))}
                                    rows={3}
                                    className="w-full p-[12px_14px] rounded-[14px] border border-brand-line bg-white text-brand-text resize-y text-[14px] leading-[1.6] font-sans focus:border-brand-primary outline-none"
                                  />
                                </Field>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Field>
                    </div>
                  )}
                  <div className="mt-[12px] flex justify-end">
                    <div className="flex items-center gap-[12px] flex-wrap justify-end">
                      <span className={`text-[12px] font-sans ${saveState === "error" ? "text-red-700" : "text-brand-muted"}`}>
                        {saveState === "pending"
                          ? t("common_unsaved")
                          : saveState === "saving"
                            ? t("builder_saving")
                            : saveState === "saved"
                              ? t("common_saved")
                              : ""}
                      </span>
                    <Btn variant="secondary" onClick={() => saveBuilderChoices()} disabled={savingChoices}>
                      {savingChoices ? t("builder_saving") : t("builder_save_dir")}
                    </Btn>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-[12px]">
                <div className="border border-brand-line rounded-[16px] p-[15px]">
                  <h5 className="m-0 mb-[8px] text-[14px] font-sans">{t("builder_title_opts")}</h5>
                  {builder.titleOptions?.map((tItem, i) => (
                    <p key={i} className={`m-[4px_0] text-brand-text text-[14px] font-sans ${i === 0 ? "font-bold" : "font-normal"}`}>• {tItem}</p>
                  ))}
                </div>

                <div className="border border-brand-line rounded-[16px] p-[15px]">
                  <h5 className="m-0 mb-[8px] text-[14px] font-sans">{t("builder_big_idea")}</h5>
                  <p className="m-0 text-brand-primary text-[15px] font-bold leading-[1.6] font-serif">{approvedBigIdea}</p>
                </div>

                <div className="border border-brand-line rounded-[16px] p-[15px]">
                  <h5 className="m-0 mb-[8px] text-[14px] font-sans">{t("builder_intro")}</h5>
                  <p className="m-0 text-brand-muted text-[13px] leading-[1.65] font-sans whitespace-pre-wrap">{builder.introduction}</p>
                </div>

                {approvedPoints.map((p, i) => (
                  <div key={i} className="border border-brand-line rounded-[16px] p-[15px]">
                    <h5 className="m-0 mb-[6px] text-[14px] text-brand-primary font-sans">{p.label}: {p.statement}</h5>
                    <p className="m-0 mb-[6px] text-[13px] text-brand-muted leading-[1.65] font-sans whitespace-pre-wrap">{p.explanation}</p>
                    <p className="m-0 text-[12px] text-brand-gold font-semibold italic font-sans">→ {p.transition}</p>
                  </div>
                ))}

                <div className="border border-brand-line rounded-[16px] p-[15px]">
                  <h5 className="m-0 mb-[8px] text-[14px] font-sans">{t("builder_conclusion")}</h5>
                  <p className="m-0 text-brand-muted text-[13px] leading-[1.65] font-sans whitespace-pre-wrap">{builder.conclusion}</p>
                </div>

                {builder.callToAction && (
                  <div className="border border-green-600/18 rounded-[16px] p-[15px] bg-brand-green-soft">
                    <h5 className="m-0 mb-[6px] text-[14px] text-green-800 font-sans">{t("builder_cta")}</h5>
                    <p className="m-0 text-[13px] text-green-800 leading-[1.65] font-sans">{builder.callToAction}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-[18px] flex-wrap gap-[12px]">
                <Btn variant="secondary" onClick={generate}>{t("builder_regenerate")}</Btn>
                <Btn onClick={() => router.push("/illustrations")}>{t("builder_next")}</Btn>
              </div>
            </>
          )}
        </Card>

        {/* Right — Health */}
        <div className="grid gap-[22px] content-start">
          <VersionHistoryCard
            title={t("builder_versions")}
            versions={versions}
            activeVersionId={week?.builder?.id}
            onRestore={restoreVersion}
            restoringVersionId={restoringVersionId}
            onDuplicate={duplicateVersion}
            duplicatingVersionId={duplicatingVersionId}
          />
          <Card className="self-start">
            <h4 className="m-0 mb-[12px] text-[18px] font-serif">{t("builder_health")}</h4>
            {builder ? (
              <div className="grid gap-[10px]">
                {[
                  t("builder_health_clarity"),
                  t("builder_health_biblical"),
                  t("builder_health_pastoral"),
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-[10px] p-[12px] rounded-[14px] bg-brand-surface-2 border border-brand-line">
                    <span className="text-brand-green text-[16px]">✓</span>
                    <span className="text-[13px] text-brand-muted font-sans">{c}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[14px] text-brand-muted font-sans">
                {t("builder_no_health")}
              </p>
            )}
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
