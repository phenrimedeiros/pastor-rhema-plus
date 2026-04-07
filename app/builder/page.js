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
import { upsertCurrentWeekStep } from "@/lib/sermonFlow";
import VersionHistoryCard from "@/components/VersionHistoryCard";

export default function BuilderPage() {
  const [estado, setEstado] = useState(null);
  const [builder, setBuilder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingChoices, setSavingChoices] = useState(false);
  const [versions, setVersions] = useState([]);
  const [restoringVersionId, setRestoringVersionId] = useState("");
  const [error, setError] = useState("");
  const [choiceMessage, setChoiceMessage] = useState("");
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useLanguage();

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
      const activeSerie = novo.series?.[0];
      const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
      if (week?.builder?.content) {
        setBuilder(week.builder.content);
        await loadVersions(week.id);
      }
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSerie = estado?.series?.[0];
  const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
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
        weekNumber: activeSerie.current_week,
      });
      setBuilder(data.content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "builder", data.content));
      setChoiceMessage("");
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveBuilderChoices = async () => {
    if (!week || !builder) return;
    setError("");
    setChoiceMessage("");
    setSavingChoices(true);
    try {
      const content = {
        ...builder,
        selectedTitle,
        approvedBigIdea,
        approvedPoints,
      };
      await sermonContent.updateActiveContent(week.id, "builder", content);
      setBuilder(content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "builder", content));
      setChoiceMessage("Your preferred title, big idea, and sermon points are now saved for this week.");
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
      const restored = await sermonContent.setActiveVersion(version.id, week.id, "builder");
      setBuilder(restored.content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "builder", restored.content));
      setChoiceMessage(`Version ${version.version} is now your active sermon structure.`);
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

  return (
    <AppLayout profile={estado.profile}>
      <SermonFlowNav
        currentStepKey="builder"
        week={week}
        canContinue={!!builder}
        savedContentText={week?.builder ? "Your saved sermon structure is ready. Review it, refine it, or move on to illustrations." : ""}
      />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>

        {/* Left — Main */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>{t("builder_title")}</h4>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                {t("builder_subtitle")}
              </p>
            </div>
            <Pill>Step 3</Pill>
          </div>

          {!week && <Notice color="gold">{t("builder_no_series")}</Notice>}
          {error && <Notice color="red">{error}</Notice>}
          {choiceMessage && <Notice color="green">{choiceMessage}</Notice>}

          {!builder && !generating && week && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Btn onClick={generate}>{t("builder_generate")}</Btn>
            </div>
          )}

          {generating && <Loader text={t("builder_generating")} />}

          {builder && (
            <>
              <div style={{ display: "grid", gap: "14px", marginBottom: "16px" }}>
                <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px", background: T.surface2 }}>
                  <h5 style={{ margin: "0 0 10px", fontSize: "14px", fontFamily: T.fontSans }}>{t("builder_approve_dir")}</h5>
                  <Field label={t("builder_pref_title")}>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {builder.titleOptions?.map((title) => {
                        const active = selectedTitle === title;
                        return (
                          <button
                            key={title}
                            type="button"
                            onClick={() => setBuilder((prev) => ({ ...prev, selectedTitle: title }))}
                            style={{
                              textAlign: "left",
                              padding: "12px 14px",
                              borderRadius: "14px",
                              border: `1px solid ${active ? "rgba(11,42,91,.22)" : T.line}`,
                              background: active ? "#eef4ff" : "#fff",
                              color: active ? T.primary : T.text,
                              fontWeight: active ? 800 : 600,
                              fontSize: "14px",
                              fontFamily: T.fontSans,
                              cursor: "pointer",
                            }}
                          >
                            {title}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <div style={{ marginTop: "12px" }}>
                    <Field label={t("builder_approved_idea")}>
                      <textarea
                        value={approvedBigIdea}
                        onChange={(e) => setBuilder((prev) => ({ ...prev, approvedBigIdea: e.target.value }))}
                        rows={4}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: "14px",
                          border: `1px solid ${T.line}`,
                          background: "#fff",
                          color: T.text,
                          resize: "vertical",
                          fontSize: "14px",
                          lineHeight: 1.6,
                          fontFamily: T.fontSans,
                        }}
                      />
                    </Field>
                  </div>
                  {!!approvedPoints.length && (
                    <div style={{ marginTop: "12px", display: "grid", gap: "12px" }}>
                      <Field label={t("builder_approved_pts")}>
                        <div style={{ display: "grid", gap: "12px" }}>
                          {approvedPoints.map((point, index) => (
                            <div key={`${point.label}-${index}`} style={{ padding: "12px", borderRadius: "14px", border: `1px solid ${T.line}`, background: "#fff" }}>
                              <p style={{ margin: "0 0 10px", fontSize: "12px", color: T.primary, fontWeight: 800, fontFamily: T.fontSans }}>
                                {point.label}
                              </p>
                              <div style={{ display: "grid", gap: "10px" }}>
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
                                    style={{
                                      width: "100%",
                                      padding: "12px 14px",
                                      borderRadius: "14px",
                                      border: `1px solid ${T.line}`,
                                      background: "#fff",
                                      color: T.text,
                                      resize: "vertical",
                                      fontSize: "14px",
                                      lineHeight: 1.6,
                                      fontFamily: T.fontSans,
                                    }}
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
                                    style={{
                                      width: "100%",
                                      padding: "12px 14px",
                                      borderRadius: "14px",
                                      border: `1px solid ${T.line}`,
                                      background: "#fff",
                                      color: T.text,
                                      resize: "vertical",
                                      fontSize: "14px",
                                      lineHeight: 1.6,
                                      fontFamily: T.fontSans,
                                    }}
                                  />
                                </Field>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Field>
                    </div>
                  )}
                  <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                    <Btn variant="secondary" onClick={saveBuilderChoices} disabled={savingChoices}>
                      {savingChoices ? t("builder_saving") : t("builder_save_dir")}
                    </Btn>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>{t("builder_title_opts")}</h5>
                  {builder.titleOptions?.map((t, i) => (
                    <p key={i} style={{ margin: "4px 0", color: T.text, fontSize: "14px", fontWeight: i === 0 ? 700 : 400, fontFamily: T.fontSans }}>• {t}</p>
                  ))}
                </div>

                <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>{t("builder_big_idea")}</h5>
                  <p style={{ margin: 0, color: T.primary, fontSize: "15px", fontWeight: 700, lineHeight: 1.6, fontFamily: T.font }}>{approvedBigIdea}</p>
                </div>

                <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>{t("builder_intro")}</h5>
                  <p style={{ margin: 0, color: T.muted, fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{builder.introduction}</p>
                </div>

                {approvedPoints.map((p, i) => (
                  <div key={i} style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                    <h5 style={{ margin: "0 0 6px", fontSize: "14px", color: T.primary, fontFamily: T.fontSans }}>{p.label}: {p.statement}</h5>
                    <p style={{ margin: "0 0 6px", color: T.muted, fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{p.explanation}</p>
                    <p style={{ margin: 0, color: T.gold, fontSize: "12px", fontWeight: 600, fontStyle: "italic", fontFamily: T.fontSans }}>→ {p.transition}</p>
                  </div>
                ))}

                <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>{t("builder_conclusion")}</h5>
                  <p style={{ margin: 0, color: T.muted, fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{builder.conclusion}</p>
                </div>

                {builder.callToAction && (
                  <div style={{ border: `1px solid rgba(22,163,74,.18)`, borderRadius: "16px", padding: "15px", background: T.greenSoft }}>
                    <h5 style={{ margin: "0 0 6px", fontSize: "14px", color: "#166534", fontFamily: T.fontSans }}>{t("builder_cta")}</h5>
                    <p style={{ margin: 0, color: "#166534", fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{builder.callToAction}</p>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", flexWrap: "wrap", gap: "12px" }}>
                <Btn variant="secondary" onClick={generate}>{t("builder_regenerate")}</Btn>
                <Btn onClick={() => router.push("/illustrations")}>{t("builder_next")}</Btn>
              </div>
            </>
          )}
        </Card>

        {/* Right — Health */}
        <div style={{ display: "grid", gap: "22px", alignContent: "start" }}>
          <VersionHistoryCard
            title={t("builder_versions")}
            versions={versions}
            activeVersionId={week?.builder?.id}
            onRestore={restoreVersion}
            restoringVersionId={restoringVersionId}
          />
          <Card style={{ alignSelf: "start" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>{t("builder_health")}</h4>
            {builder ? (
              <div style={{ display: "grid", gap: "10px" }}>
                {[
                  t("builder_health_clarity"),
                  t("builder_health_biblical"),
                  t("builder_health_pastoral"),
                ].map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "14px", background: T.surface2, border: `1px solid ${T.line}` }}>
                    <span style={{ color: T.green, fontSize: "16px" }}>✓</span>
                    <span style={{ fontSize: "13px", color: T.muted, fontFamily: T.fontSans }}>{c}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                {t("builder_no_health")}
              </p>
            )}
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
