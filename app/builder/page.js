"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
import { T } from "@/lib/tokens";
import { Btn, Card, Pill, Notice, Loader } from "@/components/ui";
import AppLayout from "@/components/AppLayout";

export default function BuilderPage() {
  const [estado, setEstado] = useState(null);
  const [builder, setBuilder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }
      const novo = await loadFullState();
      if (!novo.authenticated) { router.push("/login"); return; }
      setEstado(novo);
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSerie = estado?.series?.[0];
  const week = activeSerie?.weeks?.[activeSerie.current_week - 1];

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
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
      <Loader text="Loading..." />
    </div>
  );

  return (
    <AppLayout profile={estado.profile}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "22px" }}>

        {/* Left — Main */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>Build My Sermon</h4>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                Turn passage clarity into a preachable structure.
              </p>
            </div>
            <Pill>Step 3</Pill>
          </div>

          {!week && <Notice color="gold">Generate a series first to build a sermon.</Notice>}
          {error && <Notice color="red">{error}</Notice>}

          {!builder && !generating && week && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Btn onClick={generate}>Generate Sermon Structure</Btn>
            </div>
          )}

          {generating && <Loader text="Building your sermon structure..." />}

          {builder && (
            <>
              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>Title Options</h5>
                  {builder.titleOptions?.map((t, i) => (
                    <p key={i} style={{ margin: "4px 0", color: T.text, fontSize: "14px", fontWeight: i === 0 ? 700 : 400, fontFamily: T.fontSans }}>• {t}</p>
                  ))}
                </div>

                <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>Big Idea</h5>
                  <p style={{ margin: 0, color: T.primary, fontSize: "15px", fontWeight: 700, lineHeight: 1.6, fontFamily: T.font }}>{builder.bigIdea}</p>
                </div>

                <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>Introduction</h5>
                  <p style={{ margin: 0, color: T.muted, fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{builder.introduction}</p>
                </div>

                {builder.points?.map((p, i) => (
                  <div key={i} style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                    <h5 style={{ margin: "0 0 6px", fontSize: "14px", color: T.primary, fontFamily: T.fontSans }}>{p.label}: {p.statement}</h5>
                    <p style={{ margin: "0 0 6px", color: T.muted, fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{p.explanation}</p>
                    <p style={{ margin: 0, color: T.gold, fontSize: "12px", fontWeight: 600, fontStyle: "italic", fontFamily: T.fontSans }}>→ {p.transition}</p>
                  </div>
                ))}

                <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px" }}>
                  <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans }}>Conclusion</h5>
                  <p style={{ margin: 0, color: T.muted, fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{builder.conclusion}</p>
                </div>

                {builder.callToAction && (
                  <div style={{ border: `1px solid rgba(22,163,74,.18)`, borderRadius: "16px", padding: "15px", background: T.greenSoft }}>
                    <h5 style={{ margin: "0 0 6px", fontSize: "14px", color: "#166534", fontFamily: T.fontSans }}>Call to Action</h5>
                    <p style={{ margin: 0, color: "#166534", fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>{builder.callToAction}</p>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", flexWrap: "wrap", gap: "12px" }}>
                <Btn variant="secondary" onClick={generate}>Regenerate</Btn>
                <Btn onClick={() => router.push("/illustrations")}>Add Illustrations →</Btn>
              </div>
            </>
          )}
        </Card>

        {/* Right — Health */}
        <Card style={{ alignSelf: "start" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>Outline Health</h4>
          {builder ? (
            <div style={{ display: "grid", gap: "10px" }}>
              {[
                "Clarity — The message is easy to follow",
                "Biblical Flow — Points grow from the text",
                "Pastoral Relevance — Meets real needs",
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", borderRadius: "14px", background: T.surface2, border: `1px solid ${T.line}` }}>
                  <span style={{ color: T.green, fontSize: "16px" }}>✓</span>
                  <span style={{ fontSize: "13px", color: T.muted, fontFamily: T.fontSans }}>{c}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
              Generate a structure to see the health check.
            </p>
          )}
        </Card>

      </div>
    </AppLayout>
  );
}
