"use client";

import { useEffect, useState } from "react";
import { auth, loadFullState, supabase } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import { T } from "@/lib/tokens";
import { Btn, Card, Loader, Notice } from "@/components/ui";
import SeriesForm from "@/components/SeriesForm";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";
import { useLanguage } from "@/lib/i18n";
import { getCompletedSermonFlowCount, getNextSermonFlowStep, getSermonFlowStatus } from "@/lib/sermonFlow";

const SERMON_STEP_KEYS = [
  { key: "study",         labelKey: "dash_step_study",         page: "study",         emoji: "🧠" },
  { key: "builder",       labelKey: "dash_step_builder",       page: "builder",       emoji: "🛠" },
  { key: "illustrations", labelKey: "dash_step_illustrations", page: "illustrations", emoji: "💡" },
  { key: "application",   labelKey: "dash_step_application",   page: "application",   emoji: "🎯" },
  { key: "final",         labelKey: "dash_step_final",         page: "final",         emoji: "✅" },
];

function nextSunday() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 7 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatPreachedAt(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getWeekReviewSummary(week) {
  const builder = week?.builder?.content;
  const application = week?.application?.content;

  return {
    approvedTitle: builder?.selectedTitle || builder?.titleOptions?.[0] || week?.title || "",
    approvedBigIdea: builder?.approvedBigIdea || builder?.bigIdea || week?.big_idea || "",
    approvedChallenge: application?.approvedWeeklyChallenge || application?.weeklyChallenge || "",
    approvedPoints: builder?.approvedPoints || builder?.points || [],
  };
}

function getLastPreachedSummary(entry) {
  const builder = entry?.full_content?.builder || {};
  const application = entry?.full_content?.application || {};

  return {
    title: builder.selectedTitle || builder.titleOptions?.[0] || entry?.full_content?.title || "",
    bigIdea: builder.approvedBigIdea || builder.bigIdea || "",
    challenge: application.approvedWeeklyChallenge || application.weeklyChallenge || "",
    passage: entry?.full_content?.passage || "",
  };
}

// ── This Week View ──────────────────────────────────────────────────
function ThisWeek({ profile, activeSerie, latestPreached, onNewSerie, onWeekComplete }) {
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const SERMON_STEPS = SERMON_STEP_KEYS.map((s) => ({ ...s, label: t(s.labelKey) }));
  const currentWeek = activeSerie?.current_week ?? 1;
  const week = activeSerie?.weeks?.[currentWeek - 1];
  const done = getCompletedSermonFlowCount(week);
  const next = getNextSermonFlowStep(week);
  const mappedNext = next ? SERMON_STEPS.find((step) => step.key === next.key) : null;
  const total = SERMON_STEPS.length;
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;
  const review = getWeekReviewSummary(week);
  const lastPreached = getLastPreachedSummary(latestPreached);
  const weekStatusLabel = !week
    ? t("dash_status_not_started")
    : allDone
      ? t("dash_status_ready")
      : done === 0
        ? t("dash_status_not_started")
        : t("dash_status_in_progress");

  return (
    <AppLayout profile={profile}>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(11,42,91,.98), rgba(18,54,108,.92))",
        color: "white", borderRadius: "28px", padding: isMobile ? "22px 18px" : "28px 32px",
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
              📅 {t("dash_this_week")} · {nextSunday()}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: isMobile ? "18px" : "24px", alignItems: "start" }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: isMobile ? "25px" : "30px", fontFamily: T.font, lineHeight: 1.1, letterSpacing: "-.02em" }}>
                  {week?.title || activeSerie.series_name}
                </h2>
                <p style={{ margin: "0 0 4px", fontSize: "15px", color: "rgba(255,255,255,.75)", fontFamily: T.fontSans }}>
                  {week?.passage}
                </p>
                <p style={{ margin: "0 0 20px", fontSize: "13px", color: T.gold, fontWeight: 700, fontFamily: T.fontSans }}>
                  {activeSerie.series_name} · {t("dash_week_of")} {activeSerie.current_week} {t("dash_of")} {activeSerie.weeks?.length}
                </p>

                {isMobile && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    marginBottom: "18px",
                  }}>
                  {[
                    { label: t("dash_next_focus"), value: mappedNext ? `${mappedNext.emoji} ${mappedNext.label}` : t("dash_step_complete") },
                    { label: t("dash_week_status"), value: weekStatusLabel },
                  ].map((item) => (
                      <div key={item.label} style={{
                        padding: "12px 13px",
                        borderRadius: "16px",
                        background: "rgba(255,255,255,.08)",
                        border: "1px solid rgba(255,255,255,.08)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
                      }}>
                        <p style={{ margin: "0 0 4px", fontSize: "11px", color: "rgba(255,255,255,.55)", fontFamily: T.fontSans }}>
                          {item.label}
                        </p>
                        <p style={{ margin: 0, fontSize: "13px", color: "#fff", fontWeight: 700, fontFamily: T.fontSans }}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,.6)", fontFamily: T.fontSans }}>
                      {t("dash_sermon_progress")}
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
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
                  {allDone ? (
                    <button
                      onClick={onWeekComplete}
                      style={{
                        width: isMobile ? "100%" : "auto", minHeight: 46, padding: "13px 24px", borderRadius: "14px", border: "none",
                        background: "linear-gradient(135deg, #22c55e, #16a34a)",
                        color: "#fff", fontFamily: T.fontSans, fontSize: "15px",
                        fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      {t("dash_mark_complete")}
                    </button>
                  ) : mappedNext ? (
                    <button
                      onClick={() => router.push(`/${mappedNext.page}`)}
                      style={{
                        width: isMobile ? "100%" : "auto", minHeight: 46, padding: "13px 24px", borderRadius: "14px", border: "none",
                        background: `linear-gradient(135deg, ${T.gold}, #b7862d)`,
                        color: "#0b2a5b", fontFamily: T.fontSans, fontSize: "15px",
                        fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      {done === 0 ? t("dash_start_week") : t("dash_resume_week")}
                    </button>
                  ) : null}
                  <button
                    onClick={() => router.push("/sermons")}
                    style={{
                      width: isMobile ? "100%" : "auto", minHeight: 46, padding: "13px 20px", borderRadius: "14px",
                      border: "1px solid rgba(255,255,255,.2)",
                      background: "transparent", color: "rgba(255,255,255,.8)",
                      fontFamily: T.fontSans, fontSize: "14px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {t("dash_my_sermons")}
                  </button>
                </div>
              </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: "10px",
                  marginBottom: "18px",
                }}>
                  {[
                    { label: t("dash_next_focus"), value: mappedNext ? `${mappedNext.emoji} ${mappedNext.label}` : t("dash_step_complete") },
                    { label: t("dash_week_status"), value: weekStatusLabel },
                  ].map((item) => (
                    <div key={item.label} style={{
                      padding: "12px 13px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,.08)",
                      border: "1px solid rgba(255,255,255,.08)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,.05)",
                    }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "rgba(255,255,255,.55)", fontFamily: T.fontSans }}>
                        {item.label}
                      </p>
                      <p style={{ margin: 0, fontSize: "13px", color: "#fff", fontWeight: 700, fontFamily: T.fontSans }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Step checklist */}
                <div style={{
                  background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: "20px", padding: "16px", minWidth: isMobile ? 0 : 220,
              }}>
                <p style={{ margin: "0 0 12px", fontSize: "11px", fontWeight: 800, color: "rgba(255,255,255,.5)", fontFamily: T.fontSans, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  {t("dash_prep_steps")}
                </p>
                {SERMON_STEPS.map((step, i) => {
                  const status = getSermonFlowStatus(week, i);
                  return (
                    <div
                      key={step.key}
                      onClick={() => status !== "locked" && router.push(`/${step.page}`)}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "11px 10px", borderRadius: "10px", marginBottom: "4px",
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
              {t("dash_hero_title")}
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: "15px", color: "rgba(255,255,255,.7)", fontFamily: T.fontSans, maxWidth: 480 }}>
              {t("dash_hero_desc")}
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                minHeight: 46, padding: "13px 28px", borderRadius: "14px", border: "none",
                background: `linear-gradient(135deg, ${T.gold}, #b7862d)`,
                color: "#0b2a5b", fontFamily: T.fontSans, fontSize: "15px",
                fontWeight: 800, cursor: "pointer",
              }}
            >
              {t("dash_plan_first")}
            </button>
          </div>
        )}
      </div>

      {/* ── New Series Form ── */}
      {showForm && (
        <Card style={{ marginBottom: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: "12px", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontFamily: T.font, fontSize: "20px", color: T.primary }}>{t("dash_plan_new")}</h3>
            <Btn variant="secondary" onClick={() => setShowForm(false)} style={{ padding: "8px 12px", fontSize: "13px" }}>{t("dash_cancel")}</Btn>
          </div>
          <SeriesForm onSuccess={() => { setShowForm(false); onNewSerie(); }} />
        </Card>
      )}

      {/* ── Bottom grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: "16px" }}>

        {/* Stats */}
        {[
          { val: profile?.sermons_this_month ?? 0, label: t("dash_sermons_month"), emoji: "📖" },
          { val: `${profile?.weekly_streak ?? 0}w`, label: t("dash_streak"), emoji: "🔥" },
          { val: activeSerie ? `${activeSerie.current_week}/${activeSerie.weeks?.length ?? "?"}` : "—", label: t("dash_series_progress"), emoji: "📊" },
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
          const status = getSermonFlowStatus(week, i);
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
                {status === "done" ? t("dash_step_complete") : status === "current" ? t("dash_step_ready") : t("dash_step_locked")}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.15fr .85fr", gap: "16px", marginTop: "16px" }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexDirection: isMobile ? "column" : "row", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: "20px", color: T.primary, fontFamily: T.font }}>
                {t("dash_review_title")}
              </h3>
              <p style={{ margin: 0, color: T.muted, fontSize: "14px", lineHeight: 1.65, fontFamily: T.fontSans }}>
                {t("dash_review_desc")}
              </p>
            </div>
            {week && (
              <span style={{
                padding: "7px 10px",
                borderRadius: "999px",
                background: done > 0 ? T.blueSoft : T.surface2,
                color: done > 0 ? T.primary : T.muted,
                fontSize: "12px",
                fontWeight: 800,
                fontFamily: T.fontSans,
              }}>
                {mappedNext ? `${t("dash_resume_exact")} ${mappedNext.label}` : t("dash_step_complete")}
              </span>
            )}
          </div>

          {!week ? (
            <Notice color="gold">{t("dash_review_empty")}</Notice>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ padding: "14px 16px", borderRadius: "16px", background: "#eef4ff", border: `1px solid rgba(11,42,91,.08)` }}>
                <p style={{ margin: "0 0 5px", fontSize: "12px", color: T.gold, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", fontFamily: T.fontSans }}>
                  {t("dash_review_title_label")}
                </p>
                <p style={{ margin: 0, color: T.primary, fontSize: "18px", lineHeight: 1.45, fontFamily: T.font }}>
                  {review.approvedTitle || week.title}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "14px 16px", borderRadius: "16px", border: `1px solid ${T.line}`, background: "#fff" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "12px", color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: T.fontSans }}>
                    {t("dash_review_bigidea")}
                  </p>
                  <p style={{ margin: 0, color: T.text, fontSize: "14px", lineHeight: 1.65, fontFamily: T.fontSans }}>
                    {review.approvedBigIdea || t("dash_review_missing")}
                  </p>
                </div>
                <div style={{ padding: "14px 16px", borderRadius: "16px", border: `1px solid ${T.line}`, background: "#fff" }}>
                  <p style={{ margin: "0 0 6px", fontSize: "12px", color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: T.fontSans }}>
                    {t("dash_review_challenge")}
                  </p>
                  <p style={{ margin: 0, color: T.text, fontSize: "14px", lineHeight: 1.65, fontFamily: T.fontSans }}>
                    {review.approvedChallenge || t("dash_review_missing")}
                  </p>
                </div>
              </div>

              <div style={{ padding: "14px 16px", borderRadius: "16px", border: `1px solid ${T.line}`, background: "#fff" }}>
                <p style={{ margin: "0 0 8px", fontSize: "12px", color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: T.fontSans }}>
                  {t("dash_review_points")}
                </p>
                {review.approvedPoints.length ? (
                  <div style={{ display: "grid", gap: "8px" }}>
                    {review.approvedPoints.slice(0, 3).map((point, index) => (
                      <div key={`${point.label}-${index}`} style={{ padding: "10px 12px", borderRadius: "12px", background: T.surface2 }}>
                        <p style={{ margin: "0 0 4px", color: T.primary, fontSize: "13px", fontWeight: 800, fontFamily: T.fontSans }}>
                          {point.label}
                        </p>
                        <p style={{ margin: 0, color: T.text, fontSize: "13px", lineHeight: 1.55, fontFamily: T.fontSans }}>
                          {point.statement}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                    {t("dash_review_points_empty")}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Btn onClick={() => router.push(mappedNext ? `/${mappedNext.page}` : "/final")}>
                  {mappedNext ? t("dash_resume_week") : t("dash_review_final")}
                </Btn>
                <Btn variant="secondary" onClick={() => router.push("/final")}>
                  {t("dash_review_open_final")}
                </Btn>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 style={{ margin: "0 0 6px", fontSize: "20px", color: T.primary, fontFamily: T.font }}>
            {t("dash_last_preached")}
          </h3>
          <p style={{ margin: "0 0 14px", color: T.muted, fontSize: "14px", lineHeight: 1.65, fontFamily: T.fontSans }}>
            {t("dash_last_preached_desc")}
          </p>

          {!latestPreached ? (
            <Notice color="blue">{t("dash_last_preached_empty")}</Notice>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ padding: "14px 16px", borderRadius: "16px", background: T.surface2, border: `1px solid ${T.line}` }}>
                <p style={{ margin: "0 0 4px", color: T.primary, fontSize: "17px", lineHeight: 1.4, fontFamily: T.font }}>
                  {lastPreached.title || latestPreached.full_content?.title}
                </p>
                <p style={{ margin: 0, color: T.muted, fontSize: "12px", fontFamily: T.fontSans }}>
                  {latestPreached.full_content?.passage || lastPreached.passage} · {formatPreachedAt(latestPreached.preached_at)}
                </p>
              </div>

              {lastPreached.bigIdea && (
                <div style={{ padding: "14px 16px", borderRadius: "16px", background: "#eef4ff", border: `1px solid rgba(11,42,91,.08)` }}>
                  <p style={{ margin: "0 0 6px", fontSize: "12px", color: T.muted, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: T.fontSans }}>
                    {t("dash_review_bigidea")}
                  </p>
                  <p style={{ margin: 0, color: T.primary, fontSize: "14px", lineHeight: 1.65, fontFamily: T.fontSans }}>
                    {lastPreached.bigIdea}
                  </p>
                </div>
              )}

              {lastPreached.challenge && (
                <div style={{ padding: "14px 16px", borderRadius: "16px", background: T.violetSoft, border: `1px solid rgba(99,102,241,.12)` }}>
                  <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#5b21b6", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".06em", fontFamily: T.fontSans }}>
                    {t("dash_review_challenge")}
                  </p>
                  <p style={{ margin: 0, color: "#4c1d95", fontSize: "13px", lineHeight: 1.6, fontFamily: T.fontSans }}>
                    {lastPreached.challenge}
                  </p>
                </div>
              )}

              <Btn variant="secondary" onClick={() => router.push("/sermons")}>
                {t("dash_my_sermons")}
              </Btn>
            </div>
          )}
        </Card>
      </div>

    </AppLayout>
  );
}

// ── Page ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [estado, setEstado] = useState(null);
  const [latestPreached, setLatestPreached] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  async function recarregar() {
    const novo = await loadFullState();
    if (novo.authenticated) {
      const session = await auth.getSession();
      const { data: lastHistory } = await supabase
        .from("sermon_history")
        .select("*")
        .eq("user_id", session.user.id)
        .order("preached_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setEstado(novo);
      setLatestPreached(lastHistory || null);
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
    const activeSerie = estado?.series?.find((s) => !s.is_archived) ?? null;
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

      // Advance to next week or archive if last week
      const nextWeek = activeSerie.current_week + 1;
      if (nextWeek <= (activeSerie.weeks?.length ?? 1)) {
        await supabase.from("series").update({ current_week: nextWeek }).eq("id", activeSerie.id);
      } else {
        await supabase.from("series").update({ is_archived: true }).eq("id", activeSerie.id);
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
      <Loader text={completing ? t("dash_completing") : t("common_loading")} />
    </div>
  );

  if (!estado) return null;

  return (
    <ThisWeek
      profile={estado.profile}
      activeSerie={estado.series?.find((s) => !s.is_archived) ?? null}
      latestPreached={latestPreached}
      onNewSerie={recarregar}
      onWeekComplete={handleWeekComplete}
    />
  );
}
