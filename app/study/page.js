"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState, sermonContent } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
import { T } from "@/lib/tokens";
import { Btn, Card, Pill, Notice, Loader } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";
import SermonFlowNav from "@/components/SermonFlowNav";
import { upsertCurrentWeekStep } from "@/lib/sermonFlow";
import VersionHistoryCard from "@/components/VersionHistoryCard";

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
      const activeSerie = novo.series?.[0];
      const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
      if (week?.study?.content) {
        setStudy(week.study.content);
        await loadVersions(week.id);
      }
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSerie = estado?.series?.[0];
  const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
  const keyTerms = Array.isArray(study?.keyTerms) ? study.keyTerms : [];
  const crossReferences = Array.isArray(study?.crossReferences) ? study.crossReferences : [];

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
      setStudy(data.content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "study", data.content));
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
      setStudy(restored.content);
      setEstado((prev) => upsertCurrentWeekStep(prev, "study", restored.content));
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

  return (
    <AppLayout profile={estado.profile}>
      <SermonFlowNav
        currentStepKey="study"
        week={week}
        canContinue={!!study}
        savedContentText={week?.study ? "Loaded your saved biblical study. You can keep building from here or regenerate it." : ""}
      />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>

        {/* Left — Main */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>Understand the Passage</h4>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                Deepen your understanding before structuring.
              </p>
            </div>
            <Pill>Step 2</Pill>
          </div>

          {week
            ? <Notice color="blue">{week.passage} · Week {activeSerie.current_week} — {week.title}</Notice>
            : <Notice color="gold">Generate a series first to begin studying.</Notice>
          }

          {error && <Notice color="red">{error}</Notice>}

          {!study && !generating && week && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Btn onClick={generate}>Generate Biblical Study</Btn>
            </div>
          )}

          {generating && <Loader text="Studying the passage..." />}

          {study && (
            <>
              <div style={{ display: "grid", gap: "12px" }}>
                {[
                  { title: "Context Summary", content: study.contextSummary },
                  { title: "Theological Insight", content: study.theologicalInsight },
                  { title: "Pastoral Angle", content: study.pastoralAngle },
                ].map((block) => (
                  <div key={block.title} style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>{block.title}</h5>
                    <p style={{ margin: 0, color: T.muted, fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{block.content}</p>
                  </div>
                ))}

                {keyTerms.length > 0 && (
                  <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                    <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>Key Terms</h5>
                    {keyTerms.map((t, i) => (
                      <p key={i} style={{ margin: "4px 0", color: T.muted, fontSize: "13px", fontFamily: T.fontSans }}>• {t}</p>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", flexWrap: "wrap", gap: "12px" }}>
                <Btn variant="secondary" onClick={generate}>Regenerate</Btn>
                <Btn onClick={() => router.push("/builder")}>Use This In My Sermon →</Btn>
              </div>
            </>
          )}
        </Card>

        {/* Right — Snapshot */}
        <div style={{ display: "grid", gap: "22px", alignContent: "start" }}>
          <VersionHistoryCard
            title="Study Versions"
            versions={versions}
            activeVersionId={week?.study?.id}
            onRestore={restoreVersion}
            restoringVersionId={restoringVersionId}
          />
          <Card>
            <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>Study Snapshot</h4>
            {study ? (
              <div style={{ display: "grid", gap: "12px" }}>
                {[
                  { title: "Central Truth", content: study.centralTruth },
                  { title: "Pastoral Need", content: study.pastoralNeed },
                  { title: "Preaching Direction", content: study.preachingDirection },
                ].map((r) => (
                  <div key={r.title} style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "14px", background: T.surface2 }}>
                    <b style={{ display: "block", fontSize: "13px", marginBottom: "4px", fontFamily: T.fontSans }}>{r.title}</b>
                    <span style={{ color: T.muted, fontSize: "12.5px", lineHeight: 1.5, fontFamily: T.fontSans }}>{r.content}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>Generate a study to see the snapshot here.</p>
            )}
          </Card>

          {crossReferences.length > 0 && (
            <Card>
              <h4 style={{ margin: "0 0 10px", fontSize: "16px", fontFamily: T.font }}>Cross References</h4>
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
