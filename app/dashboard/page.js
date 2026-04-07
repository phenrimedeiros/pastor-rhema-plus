"use client";

import { useEffect, useState } from "react";
import { auth, loadFullState } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import { T } from "@/lib/tokens";
import { Btn, Card, Pill, Loader } from "@/components/ui";
import SeriesForm from "@/components/SeriesForm";
import AppLayout from "@/components/AppLayout";

// ─── PROGRESS STEPS ──────────────────────────────────────────────
const STEPS = [
  "Series Defined",
  "Study & Context",
  "Sermon Structure",
  "Illustrations",
  "Applications",
];

// ─── DASHBOARD ───────────────────────────────────────────────────
function Dashboard({ profile, activeSerie, onNewSerie }) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const week = activeSerie?.weeks?.[activeSerie.current_week - 1];
  const completedSteps = 1; // series defined; future: calc from week content

  // Only navigate to pages that are implemented
  const READY_PAGES = new Set(["series", "study", "builder", "illustrations", "application", "final", "chat"]);
  const goTo = (page) => {
    if (READY_PAGES.has(page)) {
      router.push(`/${page}`);
    } else {
      alert(`"${page}" page coming soon!`);
    }
  };

  return (
    <AppLayout profile={profile}>

        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg, rgba(11,42,91,.98), rgba(18,54,108,.92))",
          color: "white", borderRadius: "28px", padding: "28px",
          boxShadow: T.shadowLg,
          display: "grid", gridTemplateColumns: activeSerie ? "1.2fr 1fr" : "1fr",
          gap: "22px", marginBottom: "22px", position: "relative", overflow: "hidden",
        }}>
          {/* Gold glow */}
          <div style={{
            position: "absolute", right: -60, bottom: -80,
            width: 240, height: 240,
            background: "radial-gradient(circle, rgba(202,161,74,.25), transparent 65%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "8px 12px", borderRadius: "999px",
              background: "rgba(255,255,255,.10)", color: "rgba(255,255,255,.92)",
              fontSize: "12px", fontWeight: 800, marginBottom: "12px", fontFamily: T.fontSans,
            }}>
              {activeSerie ? "✅ Active Series" : "🚀 Ready to start"}
            </div>
            <h2 style={{
              margin: 0, fontSize: "34px", lineHeight: 1.05,
              letterSpacing: "-.03em", fontFamily: T.font,
            }}>
              {activeSerie
                ? `Your "${week?.title || activeSerie.series_name}" is ready.`
                : "Start your first sermon series."}
            </h2>
            <p style={{
              margin: "14px 0 0", color: "rgba(255,255,255,.82)",
              lineHeight: 1.75, fontSize: "15px", maxWidth: 620, fontFamily: T.fontSans,
            }}>
              {activeSerie
                ? "Rhema remembers your active series, keeps your momentum visible, and guides you into the next step."
                : "Plan a complete multi-week series and let Rhema guide your preparation every day."}
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "20px" }}>
              {activeSerie ? (
                <>
                  <Btn variant="hero" onClick={() => goTo("study")}>Start This Week</Btn>
                  <Btn variant="ghost" onClick={() => goTo("series")}>Review Series Plan</Btn>
                </>
              ) : (
                <Btn variant="hero" onClick={() => setShowForm(true)}>Plan a Sermon Series</Btn>
              )}
            </div>
          </div>

          {/* Progress Panel */}
          {activeSerie && (
            <div style={{
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: "22px", padding: "18px", alignSelf: "stretch",
            }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "15px", color: "rgba(255,255,255,.95)", fontFamily: T.fontSans }}>
                Your Weekly Sermon Progress
              </h4>
              <div style={{ display: "grid", gap: "10px" }}>
                {STEPS.map((step, i) => {
                  const done = i < completedSteps;
                  const current = i === completedSteps;
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: "10px", padding: "10px 12px", borderRadius: "14px",
                      background: "rgba(255,255,255,.08)",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "10px",
                          display: "grid", placeItems: "center", fontSize: "14px",
                          background: done ? "rgba(22,163,74,.18)" : current ? "rgba(202,161,74,.18)" : "rgba(255,255,255,.10)",
                          color: "#fff", fontWeight: 700,
                        }}>
                          {done ? "✓" : i + 1}
                        </div>
                        <span style={{ fontSize: "13px", color: "#fff", fontWeight: 600, fontFamily: T.fontSans }}>
                          {step}
                        </span>
                      </div>
                      <span style={{
                        fontSize: "11px", fontWeight: 800, padding: "5px 8px", borderRadius: "999px",
                        background: done ? "rgba(22,163,74,.18)" : current ? "rgba(202,161,74,.18)" : "rgba(255,255,255,.08)",
                        color: done ? "#bbf7d0" : current ? "#fde7b0" : "rgba(255,255,255,.6)",
                      }}>
                        {done ? "Done" : current ? "Current" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Series Form Modal */}
        {showForm && (
          <Card style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontFamily: T.font, fontSize: "20px", color: T.primary }}>
                Plan a Sermon Series
              </h3>
              <Btn variant="secondary" onClick={() => setShowForm(false)} style={{ padding: "8px 12px", fontSize: "13px" }}>
                Cancel
              </Btn>
            </div>
            <SeriesForm onSuccess={() => { setShowForm(false); onNewSerie(); }} />
          </Card>
        )}

        {/* Stats */}
        {activeSerie && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "22px" }}>
            {[
              { val: profile?.sermons_this_month ?? 0, label: "Sermons prepared this month" },
              { val: `${profile?.weekly_streak ?? 0} weeks`, label: "Current weekly streak" },
              { val: `${activeSerie.current_week}/${activeSerie.weeks?.length ?? "?"}`, label: "Series progress" },
              { val: "Saved", label: "Progress remembered" },
            ].map((s, i) => (
              <div key={i} style={{
                border: `1px solid ${T.line}`, borderRadius: "18px", padding: "16px",
                background: "linear-gradient(180deg, #fff, #fbfcff)",
              }}>
                <b style={{ display: "block", fontSize: "26px", lineHeight: 1, marginBottom: "6px", color: T.primary, fontFamily: T.font }}>
                  {s.val}
                </b>
                <span style={{ display: "block", color: T.muted, fontSize: "12.5px", lineHeight: 1.45, fontFamily: T.fontSans }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: "22px" }}>
          <Card>
            <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>
              {activeSerie ? "Choose how to continue" : "Your Series"}
            </h4>
            <p style={{ margin: "0 0 18px", color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
              {activeSerie
                ? "Different pastors return with different needs."
                : "No active series yet. Create your first one to get started."}
            </p>

            {activeSerie ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                {[
                  { emoji: "🧭", title: "Continue Guided Flow", desc: "Resume from where you left off.", action: () => goTo("study") },
                  { emoji: "⚡", title: "Quick Start", desc: "Jump straight into building this week's sermon.", action: () => goTo("builder") },
                  { emoji: "📖", title: "Review Active Series", desc: "See the full series plan.", action: () => goTo("series") },
                  { emoji: "✅", title: "Mark Week Complete", desc: "Advance to the next week.", action: () => {} },
                ].map((c, i) => (
                  <div key={i} onClick={c.action} style={{
                    border: `1px solid ${T.line}`, borderRadius: "18px", padding: "18px",
                    background: "linear-gradient(180deg, #fff, #fbfcff)", cursor: "pointer",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "14px", display: "grid", placeItems: "center",
                      marginBottom: "12px", background: T.amberSoft, fontSize: "20px",
                    }}>{c.emoji}</div>
                    <b style={{ display: "block", marginBottom: "6px", fontSize: "15px", fontFamily: T.fontSans }}>{c.title}</b>
                    <p style={{ margin: 0, color: T.muted, lineHeight: 1.55, fontSize: "13px", fontFamily: T.fontSans }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <Btn variant="hero" onClick={() => setShowForm(true)}>
                  Plan a Sermon Series
                </Btn>
              </div>
            )}
          </Card>

          <div style={{ display: "grid", gap: "22px" }}>
            <Card>
              <h4 style={{ margin: "0 0 12px", fontSize: "18px", fontFamily: T.font }}>Quick Access</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { emoji: "🧠", title: "Understand the Passage", page: "study" },
                  { emoji: "🛠", title: "Build My Sermon", page: "builder" },
                  { emoji: "💡", title: "Make It Clear", page: "illustrations" },
                  { emoji: "🎯", title: "Make It Practical", page: "application" },
                ].map((t, i) => (
                  <div key={i} onClick={() => goTo(t.page)} style={{
                    border: `1px solid ${T.line}`, borderRadius: "16px", padding: "14px",
                    background: "linear-gradient(180deg, #fff, #fbfcff)", cursor: "pointer",
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: "12px", display: "grid", placeItems: "center",
                      marginBottom: "10px", background: T.blueSoft, fontSize: "18px",
                    }}>{t.emoji}</div>
                    <b style={{ display: "block", fontSize: "13px", fontFamily: T.fontSans }}>{t.title}</b>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{
              background: `linear-gradient(180deg, rgba(22,163,74,.08), #fff)`,
              border: `1px solid rgba(22,163,74,.18)`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h4 style={{ margin: 0, fontSize: "16px", fontFamily: T.font }}>Pastors Community</h4>
                <Pill style={{ background: T.greenSoft, color: "#166534" }}>Live</Pill>
              </div>
              <p style={{ margin: 0, color: T.muted, fontSize: "13px", lineHeight: 1.6, fontFamily: T.fontSans }}>
                Connect with pastors worldwide. Share sermon ideas and stay encouraged.
              </p>
            </Card>
          </div>
        </div>
    </AppLayout>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function recarregar() {
    const novo = await loadFullState();
    if (novo.authenticated) {
      setEstado(novo);
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
        setSession(session);
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
      else setSession(s);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0b2a5b, #163d7a)",
      }}>
        <Loader text="Loading..." />
      </div>
    );
  }

  if (!session || !estado) return null;

  const activeSerie = estado.series?.[0] ?? null;

  return (
    <Dashboard
      profile={estado.profile}
      activeSerie={activeSerie}
      onNewSerie={recarregar}
    />
  );
}
