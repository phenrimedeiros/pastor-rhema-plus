"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState } from "@/lib/supabase_client";
import { callApi } from "@/lib/api";
import { T } from "@/lib/tokens";
import { Btn, Card, Pill, Notice, Loader } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";

export default function IllustrationsPage() {
  const [estado, setEstado] = useState(null);
  const [illustrations, setIllustrations] = useState(null);
  const [builderPoints, setBuilderPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }
      const novo = await loadFullState();
      if (!novo.authenticated) { router.push("/login"); return; }
      setEstado(novo);

      // Carrega conteúdo do builder salvo no Supabase
      const activeSerie = novo.series?.[0];
      const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
      if (week?.builder) setBuilderPoints(week.builder.content?.points);

      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSerie = estado?.series?.[0];
  const week = activeSerie?.weeks?.[activeSerie?.current_week - 1];

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
      setIllustrations(data.content);
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

  const needsBuilder = !builderPoints;

  return (
    <AppLayout profile={estado.profile}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>

        {/* Left */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: T.gold, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: T.fontSans }}>
                Sermon Flow
              </p>
              <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>Make It Clear</h4>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                Add vivid illustrations that clarify, not compete.
              </p>
            </div>
            <Pill>Step 4</Pill>
          </div>

          {needsBuilder && (
            <Notice color="gold">
              Build your sermon structure first (Step 3) — illustrations are generated per sermon point.
            </Notice>
          )}
          {error && <Notice color="red">{error}</Notice>}

          {!illustrations && !generating && !needsBuilder && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Btn onClick={generate}>Generate Illustrations</Btn>
            </div>
          )}

          {generating && <Loader text="Finding powerful illustrations..." />}

          {illustrations?.illustrations?.map((il, i) => (
            <div key={i} style={{
              border: `1px solid ${T.line}`, borderRadius: "18px", padding: "18px",
              marginBottom: "14px", background: "linear-gradient(180deg, #fff, #fbfcfe)",
            }}>
              <Pill style={{ marginBottom: "12px", background: T.amberSoft, color: "#92400e" }}>
                {il.forPoint}
              </Pill>
              <p style={{ margin: "0 0 12px", color: T.text, fontSize: isMobile ? "15px" : "14px", lineHeight: 1.75, fontFamily: T.fontSans }}>
                {il.story}
              </p>
              <p style={{ margin: "0 0 6px", color: T.primary, fontSize: "13px", fontWeight: 700, fontFamily: T.fontSans }}>
                Connection: {il.connection}
              </p>
              <p style={{ margin: 0, color: T.green, fontSize: "13px", fontWeight: 600, fontFamily: T.fontSans }}>
                → {il.application}
              </p>
            </div>
          ))}

          {illustrations && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px", flexWrap: "wrap", gap: "12px" }}>
              <Btn variant="secondary" onClick={generate}>Regenerate All</Btn>
              <Btn onClick={() => router.push("/application")}>Add Applications →</Btn>
            </div>
          )}
        </Card>

        {/* Right — Sermon Points */}
        <Card style={{ alignSelf: "start" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>Your Sermon Points</h4>
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
            <p style={{ color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
              Build your sermon structure first.
            </p>
          )}
        </Card>

      </div>
    </AppLayout>
  );
}
