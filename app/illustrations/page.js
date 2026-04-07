"use client";

import { useEffect, useState } from "react";
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
  const isMobile = useIsMobile();
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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
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
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>

        {/* Left */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>{t("illus_title")}</h4>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                {t("illus_subtitle")}
              </p>
            </div>
            <Pill>Step 4</Pill>
          </div>

          {needsBuilder && <Notice color="gold">{t("illus_no_builder")}</Notice>}
          {error && <Notice color="red">{error}</Notice>}
          {choiceMessage && <Notice color="green">{choiceMessage}</Notice>}

          {needsBuilder && (
            <div style={{
              textAlign: "center",
              padding: isMobile ? "26px 0" : "34px 8px",
              display: "grid",
              gap: "14px",
              justifyItems: "center",
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: "20px",
                background: T.amberSoft,
                display: "grid",
                placeItems: "center",
                fontSize: "28px",
              }}>
                💡
              </div>
              <div style={{ maxWidth: 520 }}>
                <h5 style={{ margin: "0 0 8px", fontSize: "18px", color: T.primary, fontFamily: T.font }}>
                  {t("illus_empty_title")}
                </h5>
                <p style={{ margin: 0, color: T.muted, fontSize: "14px", lineHeight: 1.7, fontFamily: T.fontSans }}>
                  {t("illus_empty_desc")}
                </p>
              </div>
              <Btn onClick={() => router.push("/builder")}>{t("illus_go_builder")}</Btn>
            </div>
          )}

          {!illustrations && !generating && !needsBuilder && (
            <div style={{ textAlign: "center", padding: "32px 0", display: "grid", gap: "12px", justifyItems: "center" }}>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans, maxWidth: 520 }}>
                {t("illus_empty_desc")}
              </p>
              <Btn onClick={generate}>{t("illus_generate")}</Btn>
            </div>
          )}

          {generating && <Loader text={t("illus_generating")} />}

          {approvedIllustrations.map((il, i) => (
            <div key={i} style={{
              border: `1px solid ${T.line}`, borderRadius: "18px", padding: "18px",
              marginBottom: "14px", background: "linear-gradient(180deg, #fff, #fbfcfe)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                <Pill style={{ background: T.amberSoft, color: "#92400e" }}>
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
                  style={{ minWidth: isMobile ? "100%" : 0 }}
                >
                  {il.includeInFinal === false ? t("illus_include") : t("illus_include")}
                </Btn>
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
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
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: "14px",
                      border: `1px solid ${T.line}`, background: "#fff", color: T.text,
                      resize: "vertical", fontSize: "14px", lineHeight: 1.7, fontFamily: T.fontSans,
                    }}
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
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: "14px",
                      border: `1px solid ${T.line}`, background: "#fff", color: T.text,
                      resize: "vertical", fontSize: "14px", lineHeight: 1.6, fontFamily: T.fontSans,
                    }}
                  />
                </Field>
              </div>
            </div>
          ))}

          {illustrations && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", flexWrap: "wrap", gap: "12px" }}>
              <Btn variant="secondary" onClick={generate}>{t("illus_regenerate")}</Btn>
              <Btn variant="secondary" onClick={saveIllustrationChoices} disabled={savingChoices}>
                {savingChoices ? t("illus_saving") : t("illus_save")}
              </Btn>
              <Btn onClick={() => router.push("/application")}>{t("illus_next")}</Btn>
            </div>
          )}
        </Card>

        {/* Right — Sermon Points */}
        <div style={{ display: "grid", gap: "22px", alignContent: "start" }}>
          <VersionHistoryCard
            title={t("illus_versions")}
            versions={versions}
            activeVersionId={week?.illustrations?.id}
            onRestore={restoreVersion}
            restoringVersionId={restoringVersionId}
            onDuplicate={duplicateVersion}
            duplicatingVersionId={duplicatingVersionId}
          />
          <Card style={{ alignSelf: "start" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>{t("illus_your_points")}</h4>
            {builderPoints ? (
              builderPoints.map((p, i) => (
                <div key={i} style={{
                  padding: "12px", borderRadius: "14px", background: T.surface2,
                  border: `1px solid ${T.line}`, marginBottom: "10px",
                }}>
                  <b style={{ fontSize: "13px", color: T.primary, fontFamily: T.fontSans }}>{p.label}</b>
                  <p style={{ margin: "4px 0 0", color: T.muted, fontSize: "12.5px", fontFamily: T.fontSans }}>{p.statement}</p>
                </div>
              ))
            ) : (
              <p style={{ color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>{t("illus_no_points")}</p>
            )}
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
