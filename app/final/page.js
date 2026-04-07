"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState } from "@/lib/supabase_client";
import { T } from "@/lib/tokens";
import { Btn, Card, Pill } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";
import SermonFlowNav from "@/components/SermonFlowNav";

function buildFullText({ serie, week, builder, illustrations, application }) {
  if (!builder) return "";
  const finalPoints = builder.approvedPoints || builder.points || [];
  const finalIllustrations = illustrations?.approvedIllustrations?.filter((item) => item.includeInFinal !== false) || illustrations?.illustrations || [];
  let text = "";
  text += `SERMON: ${builder.selectedTitle || builder.titleOptions?.[0] || week?.title}\n`;
  text += `Passage: ${week?.passage}\n`;
  text += `Series: ${serie?.series_name}\n\n`;
  text += `BIG IDEA\n${builder.approvedBigIdea || builder.bigIdea}\n\n`;
  text += `INTRODUCTION\n${builder.introduction}\n\n`;

  finalPoints.forEach((p, i) => {
    text += `${p.label}: ${p.statement}\n${p.explanation}\n`;
    if (finalIllustrations[i]) {
      text += `\nIllustration: ${finalIllustrations[i].story}\n`;
    }
    if (application?.applications?.[i]) {
      text += `\nApplication: ${application.applications[i].action}\n`;
    }
    text += `\n${p.transition}\n\n`;
  });

  text += `CONCLUSION\n${builder.conclusion}\n\n`;
  if (builder.callToAction) text += `CALL TO ACTION\n${builder.callToAction}\n\n`;
  if (application?.approvedWeeklyChallenge || application?.weeklyChallenge) {
    text += `WEEKLY CHALLENGE\n${application.approvedWeeklyChallenge || application.weeklyChallenge}\n`;
  }
  return text;
}

export default function FinalPage() {
  const [estado, setEstado] = useState(null);
  const [weekContent, setWeekContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }
      const novo = await loadFullState();
      if (!novo.authenticated) { router.push("/login"); return; }
      setEstado(novo);

      const activeSerie = novo.series?.[0];
      const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
      if (week) {
        setWeekContent({
          builder: week.builder?.content,
          illustrations: week.illustrations?.content,
          application: week.application?.content,
        });
      }
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSerie = estado?.series?.[0];
  const week = activeSerie?.weeks?.[activeSerie?.current_week - 1];
  const { builder, illustrations, application } = weekContent;
  const finalPoints = builder?.approvedPoints || builder?.points || [];
  const finalIllustrations = illustrations?.approvedIllustrations?.filter((item) => item.includeInFinal !== false) || illustrations?.illustrations || [];

  const copySermon = () => {
    const text = buildFullText({ serie: activeSerie, week, builder, illustrations, application });
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
      <div style={{ color: "white", fontFamily: T.fontSans }}>Loading...</div>
    </div>
  );

  if (!builder) return (
    <AppLayout profile={estado.profile}>
      <Card>
        <h4 style={{ fontFamily: T.font, marginTop: 0 }}>No sermon built yet</h4>
        <p style={{ color: T.muted, fontFamily: T.fontSans }}>
          Complete at least the sermon structure (Step 3) to see the final output here.
        </p>
        <Btn onClick={() => router.push("/builder")} style={{ marginTop: "16px" }}>
          Go to Sermon Builder
        </Btn>
      </Card>
    </AppLayout>
  );

  return (
    <AppLayout profile={estado.profile}>
      <SermonFlowNav
        currentStepKey="final"
        week={week}
        canContinue={false}
        savedContentText="Everything saved for this week is assembled here so you can review, export, and preach with confidence."
      />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>

        {/* Left — Full Sermon */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: T.gold, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: T.fontSans }}>
                Final Output
              </p>
              <h4 style={{ margin: "0 0 4px", fontSize: "22px", fontFamily: T.font }}>
                {builder.selectedTitle || builder.titleOptions?.[0] || week?.title}
              </h4>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                {week?.passage} · {activeSerie?.series_name}
              </p>
            </div>
            <Pill style={{ background: T.greenSoft, color: "#166534" }}>Complete</Pill>
          </div>

          {/* Big Idea */}
          <div style={{
            padding: isMobile ? "18px" : "16px", borderRadius: "16px",
            background: "#eef4ff", border: `1px solid rgba(11,42,91,.10)`, marginBottom: "16px",
          }}>
            <p style={{ margin: 0, color: T.primary, fontSize: isMobile ? "18px" : "16px", fontWeight: 700, lineHeight: 1.7, fontFamily: T.font }}>
              {builder.approvedBigIdea || builder.bigIdea}
            </p>
          </div>

          {/* Introduction */}
          <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px", marginBottom: "12px" }}>
            <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans, color: T.muted }}>Introduction</h5>
            <p style={{ margin: 0, color: T.text, fontSize: "14px", lineHeight: 1.7, fontFamily: T.fontSans }}>
              {builder.introduction}
            </p>
          </div>

          {/* Points */}
          {finalPoints.map((p, i) => (
            <div key={i} style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: isMobile ? "16px" : "18px", marginBottom: "12px" }}>
              <h5 style={{ margin: "0 0 8px", fontSize: "16px", color: T.primary, fontFamily: T.font }}>
                {p.label}: {p.statement}
              </h5>
              <p style={{ margin: "0 0 12px", color: T.text, fontSize: "14px", lineHeight: 1.7, fontFamily: T.fontSans }}>
                {p.explanation}
              </p>
              {finalIllustrations[i] && (
                <div style={{ padding: "12px", borderRadius: "12px", background: T.amberSoft, marginBottom: "10px" }}>
                  <b style={{ fontSize: "12px", color: "#92400e", fontFamily: T.fontSans }}>ILLUSTRATION</b>
                  <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#78350f", lineHeight: 1.6, fontFamily: T.fontSans }}>
                    {finalIllustrations[i].story}
                  </p>
                </div>
              )}
              {application?.applications?.[i] && (
                <div style={{ padding: "12px", borderRadius: "12px", background: T.greenSoft }}>
                  <b style={{ fontSize: "12px", color: "#166534", fontFamily: T.fontSans }}>APPLICATION</b>
                  <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#14532d", lineHeight: 1.6, fontFamily: T.fontSans }}>
                    {application.applications[i].action}
                  </p>
                </div>
              )}
              {p.transition && (
                <p style={{ margin: "10px 0 0", color: T.gold, fontSize: "12px", fontWeight: 600, fontStyle: "italic", fontFamily: T.fontSans }}>
                  → {p.transition}
                </p>
              )}
            </div>
          ))}

          {/* Conclusion */}
          <div style={{ border: `1px solid ${T.line}`, borderRadius: "16px", padding: "15px", marginBottom: "12px" }}>
            <h5 style={{ margin: "0 0 8px", fontSize: "14px", fontFamily: T.fontSans, color: T.muted }}>Conclusion</h5>
            <p style={{ margin: 0, color: T.text, fontSize: "14px", lineHeight: 1.7, fontFamily: T.fontSans }}>
              {builder.conclusion}
            </p>
          </div>

          {/* Call to Action */}
          {builder.callToAction && (
            <div style={{ border: `1px solid rgba(22,163,74,.18)`, borderRadius: "16px", padding: "15px", background: T.greenSoft, marginBottom: "12px" }}>
              <h5 style={{ margin: "0 0 6px", fontSize: "14px", color: "#166534", fontFamily: T.fontSans }}>Call to Action</h5>
              <p style={{ margin: 0, color: "#166534", fontSize: "14px", lineHeight: 1.65, fontFamily: T.fontSans }}>
                {builder.callToAction}
              </p>
            </div>
          )}

          {/* Weekly Challenge */}
          {(application?.approvedWeeklyChallenge || application?.weeklyChallenge) && (
            <div style={{ border: `1px solid rgba(99,102,241,.18)`, borderRadius: "16px", padding: "15px", background: T.violetSoft }}>
              <h5 style={{ margin: "0 0 6px", fontSize: "14px", color: "#5b21b6", fontFamily: T.fontSans }}>Weekly Challenge</h5>
              <p style={{ margin: 0, color: "#4c1d95", fontSize: "14px", lineHeight: 1.65, fontFamily: T.fontSans }}>
                {application.approvedWeeklyChallenge || application.weeklyChallenge}
              </p>
            </div>
          )}
        </Card>

        {/* Right — Actions */}
        <div style={{ display: "grid", gap: "22px", alignContent: "start" }}>
          <Card>
            <h4 style={{ margin: "0 0 16px", fontSize: "18px", fontFamily: T.font }}>Export Sermon</h4>
            <div style={{ display: "grid", gap: "10px" }}>
              <Btn onClick={copySermon} style={{ width: "100%", justifyContent: "center" }}>
                {copied ? "✓ Copied!" : "Copy to Clipboard"}
              </Btn>
              <Btn variant="secondary" onClick={() => router.push("/dashboard")} style={{ width: "100%", justifyContent: "center" }}>
                Back to Dashboard
              </Btn>
            </div>
          </Card>

          <Card>
            <h4 style={{ margin: "0 0 12px", fontSize: "16px", fontFamily: T.font }}>Sermon Checklist</h4>
            {[
              { label: "Big Idea defined", done: !!builder?.bigIdea },
              { label: "3 Points structured", done: builder?.points?.length === 3 },
              { label: "Illustrations added", done: !!illustrations },
              { label: "Applications ready", done: !!application },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px", borderRadius: "12px", marginBottom: "8px",
                background: item.done ? T.greenSoft : T.surface2,
                border: `1px solid ${item.done ? "rgba(22,163,74,.2)" : T.line}`,
              }}>
                <span style={{ fontSize: "16px" }}>{item.done ? "✅" : "⬜"}</span>
                <span style={{ fontSize: "13px", color: item.done ? "#166534" : T.muted, fontFamily: T.fontSans }}>
                  {item.label}
                </span>
              </div>
            ))}
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
