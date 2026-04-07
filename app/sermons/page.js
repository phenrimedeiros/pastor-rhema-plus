"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState } from "@/lib/supabase_client";
import { T } from "@/lib/tokens";
import { Card, Loader } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";

const STEPS = ["study", "builder", "illustrations", "application"];

function stepsDone(week) {
  return STEPS.filter((s) => !!week[s]).length;
}

function ProgressDots({ done, total = 4 }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: i < done
            ? "linear-gradient(135deg, #22c55e, #16a34a)"
            : T.line,
        }} />
      ))}
      <span style={{ marginLeft: "6px", fontSize: "11px", color: T.muted, fontFamily: T.fontSans }}>
        {done}/{total}
      </span>
    </div>
  );
}

export default function SermonsPage() {
  const [estado, setEstado] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { supabase } = await import("@/lib/supabase_client");
      const [stateResult, historyResult] = await Promise.all([
        loadFullState(),
        supabase
          .from("sermon_history")
          .select("*")
          .eq("user_id", session.user.id)
          .order("preached_at", { ascending: false }),
      ]);

      if (!stateResult.authenticated) { router.push("/login"); return; }
      setEstado(stateResult);
      setHistory(historyResult.data || []);
      // Expand first series by default
      if (stateResult.series?.[0]) {
        setExpanded({ [stateResult.series[0].id]: true });
      }
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
      <Loader text="Loading..." />
    </div>
  );

  const series = estado?.series || [];
  const totalSermons = series.reduce((acc, s) => acc + (s.weeks?.length || 0), 0);
  const completedSermons = history.length;

  return (
    <AppLayout profile={estado.profile}>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <p style={{ margin: "0 0 4px", fontSize: "11px", color: T.gold, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: T.fontSans }}>
          Biblioteca
        </p>
        <h2 style={{ margin: "0 0 4px", fontSize: "26px", fontFamily: T.font, color: T.primary }}>
          My Sermons
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: T.muted, fontFamily: T.fontSans }}>
          Your pastoral journey — {completedSermons} preached · {totalSermons} total planned
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {[
          { val: series.length, label: "Active series", emoji: "📚" },
          { val: completedSermons, label: "Sermons preached", emoji: "✅" },
          { val: totalSermons - completedSermons, label: "Sermons planned", emoji: "📋" },
        ].map((s, i) => (
          <div key={i} style={{
            border: `1px solid ${T.line}`, borderRadius: "16px", padding: "16px",
            background: "#fff", display: "flex", alignItems: "center", gap: "14px",
          }}>
            <span style={{ fontSize: "28px" }}>{s.emoji}</span>
            <div>
              <b style={{ display: "block", fontSize: "24px", color: T.primary, fontFamily: T.font, lineHeight: 1 }}>
                {s.val}
              </b>
              <span style={{ fontSize: "12px", color: T.muted, fontFamily: T.fontSans }}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* No series state */}
      {series.length === 0 && (
        <Card style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ fontSize: "40px", marginBottom: "12px" }}>📖</p>
          <h4 style={{ margin: "0 0 8px", fontFamily: T.font, color: T.primary }}>No sermons yet</h4>
          <p style={{ margin: "0 0 20px", color: T.muted, fontFamily: T.fontSans, fontSize: "14px" }}>
            Create your first sermon series to start your journey.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "12px 24px", borderRadius: "14px", border: "none",
              background: `linear-gradient(135deg, ${T.primary}, #163d7a)`,
              color: "#fff", fontFamily: T.fontSans, fontSize: "14px",
              fontWeight: 700, cursor: "pointer",
            }}
          >
            Plan a Series →
          </button>
        </Card>
      )}

      {/* Series list */}
      {series.map((serie) => {
        const isExpanded = expanded[serie.id];
        const preachedIds = new Set(history.filter(h => h.series_id === serie.id).map(h => h.week_id));

        return (
          <div key={serie.id} style={{ marginBottom: "18px" }}>
            {/* Series header */}
            <div
              onClick={() => setExpanded(e => ({ ...e, [serie.id]: !e[serie.id] }))}
              style={{
                display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between",
                flexDirection: isMobile ? "column" : "row",
                padding: "16px 20px", borderRadius: isExpanded ? "18px 18px 0 0" : "18px",
                background: `linear-gradient(135deg, ${T.primary}, #163d7a)`,
                cursor: "pointer", userSelect: "none",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "12px",
                  background: "rgba(202,161,74,.25)",
                  display: "grid", placeItems: "center", fontSize: "18px",
                }}>📚</div>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 800, color: "#fff", fontFamily: T.fontSans }}>
                    {serie.series_name}
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,.55)", fontFamily: T.fontSans }}>
                    {serie.weeks?.length} weeks · Week {serie.current_week} active ·{" "}
                    {preachedIds.size} preached
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: isMobile ? "space-between" : "flex-start", gap: "12px", width: isMobile ? "100%" : "auto" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 2px", fontSize: "20px", fontWeight: 800, color: T.gold, fontFamily: T.font }}>
                    {Math.round((preachedIds.size / (serie.weeks?.length || 1)) * 100)}%
                  </p>
                  <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,.45)", fontFamily: T.fontSans }}>
                    complete
                  </p>
                </div>
                <span style={{ color: "rgba(255,255,255,.5)", fontSize: "18px" }}>
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {/* Week list */}
            {isExpanded && (
              <div style={{
                border: `1px solid ${T.line}`, borderTop: "none",
                borderRadius: "0 0 18px 18px", overflow: "hidden",
              }}>
                {(serie.weeks || []).map((week, wi) => {
                  const isPreached = preachedIds.has(week.id);
                  const isActive = wi + 1 === serie.current_week;
                  const done = stepsDone(week);

                  return (
                    <div
                      key={week.id}
                      style={{
                        display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between",
                        flexDirection: isMobile ? "column" : "row",
                        padding: "14px 20px",
                        borderBottom: wi < serie.weeks.length - 1 ? `1px solid ${T.line}` : "none",
                        background: isActive ? "#f0f7ff" : "#fff",
                        cursor: isActive ? "pointer" : "default",
                        gap: "12px",
                      }}
                      onClick={() => isActive && router.push("/dashboard")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%" }}>
                        {/* Week number */}
                        <div style={{
                          width: 36, height: 36, borderRadius: "10px",
                          display: "grid", placeItems: "center", fontSize: "13px", fontWeight: 800,
                          background: isPreached ? T.greenSoft : isActive ? T.amberSoft : T.surface2,
                          color: isPreached ? "#166534" : isActive ? "#92400e" : T.muted,
                          fontFamily: T.fontSans, flexShrink: 0,
                        }}>
                          {isPreached ? "✓" : wi + 1}
                        </div>
                        <div>
                          <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 700, color: T.text, fontFamily: T.fontSans }}>
                            {week.title}
                          </p>
                          <p style={{ margin: 0, fontSize: "12px", color: T.muted, fontFamily: T.fontSans }}>
                            {week.passage}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", width: isMobile ? "100%" : "auto" }}>
                        {!isPreached && <ProgressDots done={done} />}
                        <span style={{
                          padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                          fontFamily: T.fontSans,
                          background: isPreached ? T.greenSoft : isActive ? T.amberSoft : T.surface2,
                          color: isPreached ? "#166534" : isActive ? "#92400e" : T.muted,
                        }}>
                          {isPreached ? "Preached" : isActive ? "Active" : "Planned"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

    </AppLayout>
  );
}
