"use client";

import { useEffect, useState } from "react";
import { auth, loadFullState, supabase } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import { T } from "@/lib/tokens";
import { Btn, Card, Loader } from "@/components/ui";
import SeriesForm from "@/components/SeriesForm";
import AppLayout from "@/components/AppLayout";

const SERMON_STEPS = [
  { key: "study",         label: "Study & Context",   page: "study",         emoji: "🧠" },
  { key: "builder",       label: "Sermon Structure",  page: "builder",       emoji: "🛠" },
  { key: "illustrations", label: "Illustrations",     page: "illustrations", emoji: "💡" },
  { key: "application",   label: "Applications",      page: "application",   emoji: "🎯" },
  { key: "final",         label: "Final Sermon",      page: "final",         emoji: "✅" },
];

function getStepStatus(week, index) {
  if (!week) return "locked";
  const key = SERMON_STEPS[index].key;
  const done = key === "final"
    ? !!week.application
    : !!week[key];
  if (done) return "done";
  // accessible if previous step is done (or it's the first step)
  const prevDone = index === 0 || !!(index === 4 ? week.application : week[SERMON_STEPS[index - 1].key]);
  return prevDone ? "current" : "locked";
}

function nextStep(week) {
  for (let i = 0; i < SERMON_STEPS.length; i++) {
    const status = getStepStatus(week, i);
    if (status === "current") return SERMON_STEPS[i];
  }
  return null; // all done
}

function completedCount(week) {
  if (!week) return 0;
  return SERMON_STEPS.filter((_, i) => getStepStatus(week, i) === "done").length;
}

function nextSunday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 7 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// ── This Week View ──────────────────────────────────────────────────
function ThisWeek({ profile, activeSerie, onNewSerie, onWeekComplete }) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
  const done = completedCount(week);
  const total = SERMON_STEPS.length;
  const pct = Math.round((done / total) * 100);
  const next = nextStep(week);
  const allDone = done === total;

  return (
    <AppLayout profile={profile}>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(11,42,91,.98), rgba(18,54,108,.92))",
        color: "white", borderRadius: "28px", padding: "28px 32px",
        boxShadow: T.shadowLg, marginBottom: "22px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -60, bottom: -80,
          width: 280, height: 280,
          background: "radial-gradient(circle, rgba(202,161,74,.2), transparent 65%)",
          pointerEvents: "none",
        }} />

        {activeSerie ? (
          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Label */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 12px", borderRadius: "999px",
              background: "rgba(255,255,255,.10)",
              fontSize: "12px", fontWeight: 800, marginBottom: "16px", fontFamily: T.fontSans,
              color: "rgba(255,255,255,.9)",
            }}>
              📅 This Week · {nextSunday()}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "24px", alignItems: "start" }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: "30px", fontFamily: T.font, lineHeight: 1.1, letterSpacing: "-.02em" }}>
                  {week?.title || activeSerie.series_name}
                </h2>
                <p style={{ margin: "0 0 4px", fontSize: "15px", color: "rgba(255,255,255,.75)", fontFamily: T.fontSans }}>
                  {week?.passage}
                </p>
                <p style={{ margin: "0 0 20px", fontSize: "13px", color: T.gold, fontWeight: 700, fontFamily: T.fontSans }}>
                  {activeSerie.series_name} · Week {activeSerie.current_week} of {activeSerie.weeks?.length}
                </p>

                {/* Progress bar */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,.6)", fontFamily: T.fontSans }}>
                      Sermon Progress
                    </span>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: allDone ? "#86efac" : T.gold, fontFamily: T.fontSans }}>
                      {pct}% · {done}/{total} steps
                    </span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,.12)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: "999px",
                      width: `${pct}%`,
                      background: allDone
                        ? "linear-gradient(90deg, #22c55e, #16a34a)"
                        : `linear-gradient(90deg, ${T.gold}, #b7862d)`,
                      transition: "width .5s ease",
                    }} />
                  </div>
                </div>

                {/* CTA */}
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {allDone ? (
                    <button
                      onClick={onWeekComplete}
                      style={{
                        padding: "13px 24px", borderRadius: "14px", border: "none",
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "#fff", fontFamily: T.fontSans, fontSize: "15px",
                        fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      ✅ Mark Week Complete →
                    </button>
                  ) : next ? (
                    <button
                      onClick={() => router.push(`/${next.page}`)}
                      style={{
                        padding: "13px 24px", borderRadius: "14px", border: "none",
                        background: `linear-gradient(135deg, ${T.gold}, #b7862d)`,
                        color: "#0b2a5b", fontFamily: T.fontSans, fontSize: "15px",
                        fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      {done === 0 ? "Start This Week's Sermon →" : `Continue: ${next.emoji} ${next.label} →`}
                    </button>
                  ) : null}
                  <button
                    onClick={() => router.push("/sermons")}
                    style={{
                      padding: "13px 20px", borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,.2)",
                      background: "transparent", color: "rgba(255,255,255,.8)",
                      fontFamily: T.fontSans, fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    My Sermons
                  </button>
                </div>
              </div>

              {/* Step checklist */}
              <div style={{
                background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: "20px", padding: "16px", minWidth: 220,
              }}>
                <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,.5)", fontFamily: T.fontSans, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  Preparation Steps
                </p>
                {SERMON_STEPS.map((step, i) => {
                  const status = getStepStatus(week, i);
                  return (
                    <div
                      key={step.key}
                      onClick={() => status !== "locked" && router.push(`/${step.page}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "8px 10px", borderRadius: "10px", marginBottom: "4px",
                        background: status === "current" ? "rgba(202,161,74,.2)" : "transparent",
                        cursor: status === "locked" ? "default" : "pointer",
                        transition: ".12s ease",
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>
                        {status === "done" ? "✅" : status === "current" ? "⏳" : "🔒"}
                      </span>
                      <span style={{
                        fontSize: "13px", fontFamily: T.fontSans,
                        color: status === "done" ? "#86efac" : status === "current" ? T.gold : "rgba(255,255,255,.3)",
                        fontWeight: status === "current" ? 700 : 500,
                        textDecoration: status !== "locked" ? "none" : "none",
                      }}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // No series — never start from zero
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 12px", borderRadius: "999px",
              background: "rgba(255,255,255,.10)",
              fontSize: "12px", fontWeight: 800, marginBottom: "16px", fontFamily: T.fontSans,
            }}>
              🚀 Ready to start
            </div>
            <h2 style={{ margin: "0 0 10px", fontSize: "30px", fontFamily: T.font, lineHeight: 1.1 }}>
              Your pastoral journey starts here.
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: "15px", color: "rgba(255,255,255,.7)", fontFamily: T.fontSans, maxWidth: 480 }}>
              Plan a complete sermon series and let Pastor Rhema guide your preparation every week — never start from zero again.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: "13px 28px", borderRadius: "14px", border: "none",
                background: `linear-gradient(135deg, ${T.gold}, #b7862d)`,
                color: "#0b2a5b", fontFamily: T.fontSans, fontSize: "15px",
                fontWeight: 800, cursor: "pointer",
              }}
            >
              Plan My First Series →
            </button>
          </div>
        )}
      </div>

      {/* ── New Series Form ── */}
      {showForm && (
        <Card style={{ marginBottom: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontFamily: T.font, fontSize: "20px", color: T.primary }}>Plan a Sermon Series</h3>
            <Btn variant="secondary" onClick={() => setShowForm(false)} style={{ padding: "8px 12px", fontSize: "13px" }}>Cancel</Btn>
          </div>
          <SeriesForm onSuccess={() => { setShowForm(false); onNewSerie(); }} />
        </Card>
      )}

      {/* ── Bottom grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

        {/* Stats */}
        {[
          { val: profile?.sermons_this_month ?? 0, label: "Sermons this month", emoji: "📖" },
          { val: `${profile?.weekly_streak ?? 0}w`, label: "Current streak", emoji: "🔥" },
          { val: activeSerie ? `${activeSerie.current_week}/${activeSerie.weeks?.length ?? "?"}` : "—", label: "Series progress", emoji: "📊" },
        ].map((s, i) => (
          <div key={i} style={{
            border: `1px solid ${T.line}`, borderRadius: "18px", padding: "18px",
            background: "linear-gradient(180deg, #fff, #fbfcff)",
          }}>
            <span style={{ fontSize: "24px" }}>{s.emoji}</span>
            <b style={{ display: "block", fontSize: "28px", lineHeight: 1.1, margin: "8px 0 4px", color: T.primary, fontFamily: T.font }}>
              {s.val}
            </b>
            <span style={{ fontSize: "12.5px", color: T.muted, fontFamily: T.fontSans }}>{s.label}</span>
          </div>
        ))}

        {/* Quick access */}
        {activeSerie && SERMON_STEPS.slice(0, 3).map((step, i) => {
          const status = getStepStatus(week, i);
          return (
            <div
              key={step.key}
              onClick={() => status !== "locked" && router.push(`/${step.page}`)}
              style={{
                border: `1.5px solid ${status === "current" ? T.gold : status === "done" ? "rgba(22,163,74,.3)" : T.line}`,
                borderRadius: "18px", padding: "18px",
                background: status === "done" ? T.greenSoft : status === "current" ? T.amberSoft : "#fff",
                cursor: status === "locked" ? "default" : "pointer",
                opacity: status === "locked" ? 0.5 : 1,
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                {status === "done" ? "✅" : status === "current" ? step.emoji : "🔒"}
              </div>
              <b style={{ display: "block", fontSize: "14px", marginBottom: "4px", fontFamily: T.fontSans, color: T.text }}>
                {step.label}
              </b>
              <span style={{ fontSize: "11px", fontWeight: 700, color: status === "done" ? "#166534" : status === "current" ? "#92400e" : T.muted, fontFamily: T.fontSans }}>
                {status === "done" ? "Complete" : status === "current" ? "Ready to start" : "Locked"}
              </span>
            </div>
          );
        })}
      </div>

    </AppLayout>
  );
}

// ── Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const router = useRouter();

  async function recarregar() {
    const novo = await loadFullState();
    if (novo.authenticated) {
      setEstado(novo);
      if ((novo.profile?.plan || "simple") !== "plus") {
        router.push("/chat");
      }
    } else {
      await auth.signOut();
      router.push("/login");
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const session = await auth.getSession();
        if (!session) { router.push("/login"); return; }
        await recarregar();
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    init();

    const { data: listener } = auth.onAuthStateChange((_e, s) => {
      if (!s) router.push("/login");
    });
    return () => listener?.subscription?.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWeekComplete = async () => {
    const activeSerie = estado?.series?.[0];
    const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
    if (!activeSerie || !week) return;

    setCompleting(true);
    try {
      // Archive sermon to history
      const session = await auth.getSession();
      const weekContent = {
        title: week.title,
        passage: week.passage,
        study: week.study?.content,
        builder: week.builder?.content,
        illustrations: week.illustrations?.content,
        application: week.application?.content,
      };
      await supabase.from("sermon_history").insert({
        user_id: session.user.id,
        series_id: activeSerie.id,
        week_id: week.id,
        full_content: weekContent,
        preached_at: new Date().toISOString(),
      });

      // Advance to next week
      const nextWeek = activeSerie.current_week + 1;
      if (nextWeek <= (activeSerie.weeks?.length ?? 1)) {
        await supabase.from("series").update({ current_week: nextWeek }).eq("id", activeSerie.id);
      }

      // Update sermons_this_month counter
      await supabase.from("profiles").update({
        sermons_this_month: (estado.profile?.sermons_this_month ?? 0) + 1,
      }).eq("id", session.user.id);

      await recarregar();
    } finally {
      setCompleting(false);
    }
  };

  if (loading || completing) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
      <Loader text={completing ? "Completing week..." : "Loading..."} />
    </div>
  );

  if (!estado) return null;

  return (
    <ThisWeek
      profile={estado.profile}
      activeSerie={estado.series?.[0] ?? null}
      onNewSerie={recarregar}
      onWeekComplete={handleWeekComplete}
    />
  );
}
