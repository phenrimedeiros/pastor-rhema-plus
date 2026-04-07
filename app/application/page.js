"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState, sermonContent } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
import { T } from "@/lib/tokens";
import { Btn, Card, Pill, Notice, Loader, Field } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";
import SermonFlowNav from "@/components/SermonFlowNav";
import { upsertCurrentWeekStep } from "@/lib/sermonFlow";
import VersionHistoryCard from "@/components/VersionHistoryCard";

export default function ApplicationPage() {
  const [estado, setEstado] = useState(null);
  const [application, setApplication] = useState(null);
  const [builderData, setBuilderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingChoices, setSavingChoices] = useState(false);
  const [versions, setVersions] = useState([]);
  const [restoringVersionId, setRestoringVersionId] = useState("");
  const [error, setError] = useState("");
  const [choiceMessage, setChoiceMessage] = useState("");
  const router = useRouter();
  const isMobile = useIsMobile();

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

      const activeSerie = novo.series?.[0];
      const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
      if (week?.builder) setBuilderData(week.builder.content);
      if (week?.application?.content) {
        setApplication(week.application.content);
        await loadVersions(week.id);
      }

      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSerie = estado?.series?.[0];
  const week = activeSerie?.weeks?.[activeSerie?.current_week - 1];
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
      setApplication(data.content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "application", data.content));
      setChoiceMessage("");
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveApplicationChoices = async () => {
    if (!week || !application) return;
    setError("");
    setChoiceMessage("");
    setSavingChoices(true);
    try {
      const content = {
        ...application,
        approvedWeeklyChallenge,
      };
      await sermonContent.updateActiveContent(week.id, "application", content);
      setApplication(content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "application", content));
      setChoiceMessage("Your weekly challenge is saved and will be used in the final sermon.");
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
      const restored = await sermonContent.setActiveVersion(version.id, week.id, "application");
      setApplication(restored.content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "application", restored.content));
      setChoiceMessage(`Version ${version.version} is now your active application set.`);
      await loadVersions(week.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setRestoringVersionId("");
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
      <Loader text="Loading..." />
    </div>
  );

  const needsBuilder = !builderData;

  return (
    <AppLayout profile={estado.profile}>
      <SermonFlowNav
        currentStepKey="application"
        week={week}
        canContinue={!!application}
        savedContentText={week?.application ? "Your saved applications are here. Review them or continue straight to the final sermon." : ""}
      />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>

        {/* Left */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: T.gold, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: T.fontSans }}>
                Sermon Flow
              </p>
              <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>Make It Practical</h4>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                Help people know what faithfulness looks like this week.
              </p>
            </div>
            <Pill>Step 5</Pill>
          </div>

          {needsBuilder && (
            <Notice color="gold">Build your sermon structure first (Step 3).</Notice>
          )}
          {error && <Notice color="red">{error}</Notice>}
          {choiceMessage && <Notice color="green">{choiceMessage}</Notice>}

          {!application && !generating && !needsBuilder && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Btn onClick={generate}>Generate Applications</Btn>
            </div>
          )}

          {generating && <Loader text="Creating practical applications..." />}

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
                When: {a.context}
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
                Approve the Weekly Challenge
              </h5>
              <Field label="Final Weekly Challenge">
                <textarea
                  value={approvedWeeklyChallenge}
                  onChange={(e) => setApplication((prev) => ({ ...prev, approvedWeeklyChallenge: e.target.value }))}
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    border: "1px solid rgba(22,163,74,.18)",
                    background: "#fff",
                    color: T.text,
                    resize: "vertical",
                    fontSize: "14px",
                    lineHeight: 1.6,
                    fontFamily: T.fontSans,
                  }}
                />
              </Field>
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                <Btn variant="secondary" onClick={saveApplicationChoices} disabled={savingChoices}>
                  {savingChoices ? "Saving..." : "Save Weekly Challenge"}
                </Btn>
              </div>
            </div>
          )}

          {application && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", flexWrap: "wrap", gap: "12px" }}>
              <Btn variant="secondary" onClick={generate}>Regenerate</Btn>
              <Btn onClick={() => router.push("/final")}>View Complete Sermon →</Btn>
            </div>
          )}
        </Card>

        {/* Right — Reflection Questions */}
        <div style={{ display: "grid", gap: "22px", alignContent: "start" }}>
          <VersionHistoryCard
            title="Application Versions"
            versions={versions}
            activeVersionId={week?.application?.id}
            onRestore={restoreVersion}
            restoringVersionId={restoringVersionId}
          />
          {application?.reflectionQuestions ? (
            <Card>
              <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>Reflection Questions</h4>
              {application.reflectionQuestions.map((q, i) => (
                <div key={i} style={{
                  padding: "12px", borderRadius: "14px", background: T.surface2,
                  border: `1px solid ${T.line}`, marginBottom: "10px",
                }}>
                  <p style={{ margin: 0, color: T.text, fontSize: "13px", fontFamily: T.fontSans }}>
                    {i + 1}. {q}
                  </p>
                </div>
              ))}
            </Card>
          ) : (
            <Card>
              <h4 style={{ margin: "0 0 10px", fontSize: "18px", fontFamily: T.font }}>Reflection Questions</h4>
              <p style={{ color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                Generate applications to see reflection questions here.
              </p>
            </Card>
          )}
        </div>

      </div>
    </AppLayout>
  );
}
