"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState, sermonContent } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
import { Btn, Card, Pill, Notice, Loader, Field } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/lib/i18n";
import SermonFlowNav from "@/components/SermonFlowNav";
import { upsertCurrentWeekStep, upsertCurrentWeekStepRecord } from "@/lib/sermonFlow";
import VersionHistoryCard from "@/components/VersionHistoryCard";

export default function IllustrationsPage() {
  const [estado, setEstado] = useState(null);
  const [illustrations, setIllustrations] = useState(null);
  const [builderPoints, setBuilderPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingChoices, setSavingChoices] = useState(false);
  const [versions, setVersions] = useState([]);
  const [restoringVersionId, setRestoringVersionId] = useState("");
  const [duplicatingVersionId, setDuplicatingVersionId] = useState("");
  const [error, setError] = useState("");
  const [choiceMessage, setChoiceMessage] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  const loadVersions = async (weekId) => {
    if (!weekId) return;
    const data = await sermonContent.getContentVersions(weekId, "illustrations");
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
      if (week?.builder) setBuilderPoints(week.builder.content?.approvedPoints || week.builder.content?.points);
      if (week?.illustrations?.content) {
        setIllustrations(week.illustrations.content);
        await loadVersions(week.id);
      }

      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSerie = estado?.series?.find((s) => !s.is_archived);
  const currentWeek = activeSerie?.current_week ?? 1;
  const week = activeSerie?.weeks?.[currentWeek - 1];

  const generate = async () => {
    if (!week || !builderPoints) return;
    setError("");
    setGenerating(true);
    try {
      const data = await callApi("/api/gerar-ilustracoes", {
        weekId: week.id,
        passage: week.passage,
        points: builderPoints,
      });
      const content = {
        ...data.content,
        approvedIllustrations: (data.content.illustrations || []).map((item) => ({
          ...item,
          includeInFinal: true,
        })),
      };
      setIllustrations(content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "illustrations", content));
      setChoiceMessage("");
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const approvedIllustrations = illustrations?.approvedIllustrations || illustrations?.illustrations?.map((item) => ({
    ...item,
    includeInFinal: true,
  })) || [];

  const saveIllustrationChoices = async () => {
    if (!week || !illustrations) return;
    setError("");
    setChoiceMessage("");
    setSavingChoices(true);
    try {
      const content = { ...illustrations, approvedIllustrations };
      await sermonContent.updateActiveContent(week.id, "illustrations", content);
      setIllustrations(content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "illustrations", content));
      setChoiceMessage(t("illus_save"));
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingChoices(false);
    }
  };

  const restoreVersion = async (version) => {
    if (!week) return;
    setError("");
    setChoiceMessage("");
    setRestoringVersionId(version.id);
    try {
      const restored = await sermonContent.setActiveVersion(version.id, week.id, "illustrations");
      setIllustrations(restored.content);
      setEstado((prev) => upsertCurrentWeekStepRecord(prev, "illustrations", restored));
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
      const duplicated = await sermonContent.duplicateVersion(version.id, week.id, "illustrations");
      setIllustrations(duplicated.content);
      setEstado((prev) => upsertCurrentWeekStepRecord(prev, "illustrations", duplicated));
      setChoiceMessage(`Version ${version.version} duplicated as your new active illustrations.`);
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

  const needsBuilder = !builderPoints;

  return (
    <AppLayout profile={estado.profile}>
      <SermonFlowNav
        currentStepKey="illustrations"
        week={week}
        canContinue={!!illustrations}
        savedContentText={week?.illustrations ? t("illus_save") : ""}
      />
      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_.8fr] gap-[16px] md:gap-[22px]">

        {/* Left */}
        <Card>
          <div className="flex flex-col md:flex-row justify-between items-start gap-[12px] mb-[16px]">
            <div>
              <h4 className="m-0 mb-[6px] text-[20px] font-serif">{t("illus_title")}</h4>
              <p className="m-0 text-[14px] text-brand-muted font-sans">
                {t("illus_subtitle")}
              </p>
            </div>
            <Pill>Step 4</Pill>
          </div>

          {needsBuilder && <Notice color="gold">{t("illus_no_builder")}</Notice>}
          {error && <Notice color="red">{error}</Notice>}
          {choiceMessage && <Notice color="green">{choiceMessage}</Notice>}

          {needsBuilder && (
            <div className="text-center p-[26px_0] md:p-[34px_8px] grid gap-[14px] justify-items-center">
              <div className="w-[64px] h-[64px] rounded-[20px] bg-brand-amber-soft grid place-items-center text-[28px]">
                💡
              </div>
              <div className="max-w-[520px]">
                <h5 className="m-0 mb-[8px] text-[18px] text-brand-primary font-serif">
                  {t("illus_empty_title")}
                </h5>
                <p className="m-0 text-[14px] text-brand-muted leading-[1.7] font-sans">
                  {t("illus_empty_desc")}
                </p>
              </div>
              <Btn onClick={() => router.push("/builder")}>{t("illus_go_builder")}</Btn>
            </div>
          )}

          {!illustrations && !generating && !needsBuilder && (
            <div className="text-center p-[32px_0] grid gap-[12px] justify-items-center">
              <p className="m-0 text-[14px] text-brand-muted font-sans max-w-[520px]">
                {t("illus_empty_desc")}
              </p>
              <Btn onClick={generate}>{t("illus_generate")}</Btn>
            </div>
          )}

          {generating && <Loader text={t("illus_generating")} />}

          {approvedIllustrations.map((il, i) => (
            <div key={i} className="border border-brand-line rounded-[18px] p-[18px] mb-[14px] bg-gradient-to-b from-white to-[#fbfcfe]">
              <div className="flex flex-wrap justify-between gap-[12px] items-center mb-[12px]">
                <Pill className="bg-brand-amber-soft text-amber-800">
                  {il.forPoint}
                </Pill>
                <Btn
                  variant={il.includeInFinal === false ? "secondary" : "hero"}
                  onClick={() => setIllustrations((prev) => ({
                    ...prev,
                    approvedIllustrations: approvedIllustrations.map((item, itemIndex) => (
                      itemIndex === i ? { ...item, includeInFinal: item.includeInFinal === false } : item
                    )),
                  }))}
                  className="w-full md:w-auto min-w-[0]"
                >
                  {il.includeInFinal === false ? t("illus_include") : t("illus_include")}
                </Btn>
              </div>
              <div className="grid gap-[10px]">
                <Field label={t("illus_story")}>
                  <textarea
                    value={il.story || ""}
                    onChange={(e) => setIllustrations((prev) => ({
                      ...prev,
                      approvedIllustrations: approvedIllustrations.map((item, itemIndex) => (
                        itemIndex === i ? { ...item, story: e.target.value } : item
                      )),
                    }))}
                    rows={4}
                    className="w-full p-[12px_14px] rounded-[14px] border border-brand-line bg-white text-brand-text resize-y text-[14px] leading-[1.7] font-sans"
                  />
                </Field>
                <Field label={t("illus_connection")}>
                  <textarea
                    value={il.connection || ""}
                    onChange={(e) => setIllustrations((prev) => ({
                      ...prev,
                      approvedIllustrations: approvedIllustrations.map((item, itemIndex) => (
                        itemIndex === i ? { ...item, connection: e.target.value } : item
                      )),
                    }))}
                    rows={2}
                    className="w-full p-[12px_14px] rounded-[14px] border border-brand-line bg-white text-brand-text resize-y text-[14px] leading-[1.6] font-sans"
                  />
                </Field>
              </div>
            </div>
          ))}

          {illustrations && (
            <div className="flex justify-between mt-[18px] flex-wrap gap-[12px]">
              <Btn variant="secondary" onClick={generate}>{t("illus_regenerate")}</Btn>
              <Btn variant="secondary" onClick={saveIllustrationChoices} disabled={savingChoices}>
                {savingChoices ? t("illus_saving") : t("illus_save")}
              </Btn>
              <Btn onClick={() => router.push("/application")}>{t("illus_next")}</Btn>
            </div>
          )}
        </Card>

        {/* Right — Sermon Points */}
        <div className="grid gap-[22px] content-start">
          <VersionHistoryCard
            title={t("illus_versions")}
            versions={versions}
            activeVersionId={week?.illustrations?.id}
            onRestore={restoreVersion}
            restoringVersionId={restoringVersionId}
            onDuplicate={duplicateVersion}
            duplicatingVersionId={duplicatingVersionId}
          />
          <Card className="self-start">
            <h4 className="m-0 mb-[12px] text-[18px] font-serif">{t("illus_your_points")}</h4>
            {builderPoints ? (
              builderPoints.map((p, i) => (
                <div key={i} className="p-[12px] rounded-[14px] bg-brand-surface-2 border border-brand-line mb-[10px]">
                  <b className="text-[13px] text-brand-primary font-sans">{p.label}</b>
                  <p className="m-[4px_0_0] text-[12.5px] text-brand-muted font-sans">{p.statement}</p>
                </div>
              ))
            ) : (
              <p className="text-[14px] text-brand-muted font-sans">{t("illus_no_points")}</p>
            )}
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
