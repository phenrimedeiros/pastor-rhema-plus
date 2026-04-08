"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState } from "@/lib/supabase_client";
import { T } from "@/lib/tokens";
import { Btn, Card, Loader, Notice } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";
import { useLanguage } from "@/lib/i18n";

const STEPS = ["study", "builder", "illustrations", "application"];
const FILTERS = ["all", "preached", "planned"];

function stepsDone(week) {
  return STEPS.filter((step) => !!week[step]).length;
}

function ProgressDots({ done, total = 4 }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: index < done ? "linear-gradient(135deg, #22c55e, #16a34a)" : T.line,
          }}
        />
      ))}
      <span style={{ marginLeft: "6px", fontSize: "11px", color: T.muted, fontFamily: T.fontSans }}>
        {done}/{total}
      </span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getHistoryTitle(entry) {
  return (
    entry?.full_content?.builder?.selectedTitle ||
    entry?.full_content?.builder?.titleOptions?.[0] ||
    entry?.full_content?.title ||
    "Sermão"
  );
}

function getHistoryBigIdea(entry) {
  return (
    entry?.full_content?.builder?.approvedBigIdea ||
    entry?.full_content?.builder?.bigIdea ||
    entry?.full_content?.study?.centralTruth ||
    ""
  );
}

function getHistoryPreview(entry) {
  return (
    getHistoryBigIdea(entry) ||
    entry?.full_content?.builder?.introduction ||
    entry?.full_content?.application?.approvedWeeklyChallenge ||
    ""
  );
}

function buildHistorySearchBlob(entry, seriesName) {
  const parts = [
    seriesName,
    entry?.full_content?.title,
    entry?.full_content?.passage,
    getHistoryTitle(entry),
    getHistoryBigIdea(entry),
    entry?.full_content?.builder?.introduction,
    entry?.full_content?.builder?.conclusion,
    entry?.full_content?.application?.approvedWeeklyChallenge,
    entry?.full_content?.application?.weeklyChallenge,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function buildWeekSearchBlob(week, seriesName) {
  return [
    seriesName,
    week?.title,
    week?.passage,
    week?.focus,
    week?.big_idea,
    week?.builder?.content?.selectedTitle,
    week?.builder?.content?.approvedBigIdea,
    week?.study?.content?.centralTruth,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildHistoryCopyText(entry, seriesName) {
  const content = entry?.full_content || {};
  const builder = content.builder || {};
  const illustrations = content.illustrations || {};
  const application = content.application || {};
  const points = builder.approvedPoints || builder.points || [];
  const finalIllustrations = illustrations.approvedIllustrations
    ? illustrations.approvedIllustrations.filter((item) => item.includeInFinal !== false)
    : illustrations.illustrations || [];

  let text = "";
  text += `SERMON: ${getHistoryTitle(entry)}\n`;
  text += `Passage: ${content.passage || ""}\n`;
  if (seriesName) text += `Series: ${seriesName}\n`;
  text += "\n";

  if (builder.approvedBigIdea || builder.bigIdea) {
    text += `BIG IDEA\n${builder.approvedBigIdea || builder.bigIdea}\n\n`;
  }

  if (builder.introduction) {
    text += `INTRODUCTION\n${builder.introduction}\n\n`;
  }

  points.forEach((point, index) => {
    text += `${point.label || `Point ${index + 1}`}: ${point.statement || ""}\n`;
    if (point.explanation) text += `${point.explanation}\n`;
    if (finalIllustrations[index]?.story) text += `\nIllustration: ${finalIllustrations[index].story}\n`;
    if (application?.applications?.[index]?.action) text += `\nApplication: ${application.applications[index].action}\n`;
    if (point.transition) text += `\n${point.transition}\n`;
    text += "\n";
  });

  if (builder.conclusion) {
    text += `CONCLUSION\n${builder.conclusion}\n\n`;
  }

  if (builder.callToAction) {
    text += `CALL TO ACTION\n${builder.callToAction}\n\n`;
  }

  if (application.approvedWeeklyChallenge || application.weeklyChallenge) {
    text += `WEEKLY CHALLENGE\n${application.approvedWeeklyChallenge || application.weeklyChallenge}\n`;
  }

  return text.trim();
}

export default function SermonsPage() {
  const [estado, setEstado] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSeries, setExpandedSeries] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedHistoryId, setSelectedHistoryId] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { supabase } = await import("@/lib/supabase_client");
      const [stateResult, historyResult] = await Promise.all([
        loadFullState(),
        supabase
          .from("sermon_history")
          .select("*")
          .eq("user_id", session.user.id)
          .order("preached_at", { ascending: false }),
      ]);

      if (!stateResult.authenticated) {
        router.push("/login");
        return;
      }

      setEstado(stateResult);
      setHistory(historyResult.data || []);

      if (stateResult.series?.[0]) {
        setExpandedSeries({ [stateResult.series[0].id]: true });
      }

      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const series = useMemo(() => estado?.series || [], [estado?.series]);
  const normalizedQuery = search.trim().toLowerCase();
  const totalSermons = series.reduce((acc, serie) => acc + (serie.weeks?.length || 0), 0);
  const completedSermons = history.length;

  const historyWithMeta = useMemo(() => {
    return history.map((entry) => {
      const serie = series.find((item) => item.id === entry.series_id);
      const week = serie?.weeks?.find((item) => item.id === entry.week_id) || null;
      const seriesName = serie?.series_name || "";
      const searchBlob = buildHistorySearchBlob(entry, seriesName);
      return {
        ...entry,
        seriesName,
        week,
        title: getHistoryTitle(entry),
        preview: getHistoryPreview(entry),
        searchBlob,
      };
    });
  }, [history, series]);

  const filteredHistory = useMemo(() => {
    return historyWithMeta.filter((entry) => {
      if (!normalizedQuery) return true;
      return entry.searchBlob.includes(normalizedQuery);
    });
  }, [historyWithMeta, normalizedQuery]);

  const filteredSeries = useMemo(() => {
    return series
      .map((serie) => {
        const preachedIds = new Set(history.filter((item) => item.series_id === serie.id).map((item) => item.week_id));
        const weeks = (serie.weeks || []).filter((week) => {
          const isPreached = preachedIds.has(week.id);
          if (filter === "preached" && !isPreached) return false;
          if (filter === "planned" && isPreached) return false;
          if (!normalizedQuery) return true;
          return buildWeekSearchBlob(week, serie.series_name).includes(normalizedQuery);
        });

        return { ...serie, preachedIds, weeks };
      })
      .filter((serie) => serie.weeks.length > 0);
  }, [series, history, filter, normalizedQuery]);

  const selectedHistory = filteredHistory.find((entry) => entry.id === selectedHistoryId) || filteredHistory[0] || null;

  const copyHistory = async (entry) => {
    const text = buildHistoryCopyText(entry, entry.seriesName);
    await navigator.clipboard?.writeText(text);
    setCopiedId(entry.id);
    window.setTimeout(() => setCopiedId(""), 2000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
        <Loader text={t("common_loading")} />
      </div>
    );
  }

  return (
    <AppLayout profile={estado.profile}>
      <div style={{ marginBottom: "24px" }}>
        <p style={{ margin: "0 0 4px", fontSize: "11px", color: T.gold, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: T.fontSans }}>
          {t("sermons_title")}
        </p>
        <h2 style={{ margin: "0 0 4px", fontSize: "26px", fontFamily: T.font, color: T.primary }}>
          {t("sermons_title")}
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: T.muted, fontFamily: T.fontSans }}>
          {completedSermons} {t("sermons_subtitle_a")} · {totalSermons} {t("sermons_subtitle_b")}
        </p>
      </div>

      <Card style={{ marginBottom: "22px" }}>
        <div style={{ display: "grid", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: "14px" }}>
            <div>
              <label
                htmlFor="sermon-search"
                style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: 700, color: "#334155", fontFamily: T.fontSans }}
              >
                {t("sermons_search")}
              </label>
              <input
                id="sermon-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("sermons_search_ph")}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: `1px solid ${T.line}`,
                  background: "#fff",
                  fontSize: "14px",
                  fontFamily: T.fontSans,
                  color: T.text,
                }}
              />
            </div>
            <div>
              <p style={{ display: "block", margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "#334155", fontFamily: T.fontSans }}>
                {t("sermons_filter")}
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {FILTERS.map((item) => {
                  const active = filter === item;
                  return (
                    <Btn
                      key={item}
                      variant={active ? "primary" : "secondary"}
                      onClick={() => setFilter(item)}
                    >
                      {t(`sermons_filter_${item}`)}
                    </Btn>
                  );
                })}
              </div>
            </div>
          </div>

          <Notice color="blue">
            {filteredHistory.length} {t("sermons_matching_preached")} · {filteredSeries.reduce((acc, serie) => acc + serie.weeks.length, 0)} {t("sermons_matching_weeks")}
          </Notice>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
        {[
          { val: series.length, label: t("sermons_active"), emoji: "📚" },
          { val: completedSermons, label: t("sermons_preached"), emoji: "✅" },
          { val: totalSermons - completedSermons, label: t("sermons_planned"), emoji: "📋" },
        ].map((item, index) => (
          <div
            key={index}
            style={{
              border: `1px solid ${T.line}`,
              borderRadius: "16px",
              padding: "16px",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <span style={{ fontSize: "28px" }}>{item.emoji}</span>
            <div>
              <b style={{ display: "block", fontSize: "24px", color: T.primary, fontFamily: T.font, lineHeight: 1 }}>
                {item.val}
              </b>
              <span style={{ fontSize: "12px", color: T.muted, fontFamily: T.fontSans }}>{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      {series.length === 0 && (
        <Card style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ fontSize: "40px", marginBottom: "12px" }}>📖</p>
          <h4 style={{ margin: "0 0 8px", fontFamily: T.font, color: T.primary }}>{t("sermons_empty")}</h4>
          <p style={{ margin: "0 0 20px", color: T.muted, fontFamily: T.fontSans, fontSize: "14px" }}>
            {t("sermons_empty_desc")}
          </p>
          <Btn onClick={() => router.push("/dashboard")}>{t("sermons_plan")}</Btn>
        </Card>
      )}

      {series.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.05fr .95fr", gap: "22px", alignItems: "start" }}>
          <div style={{ display: "grid", gap: "18px" }}>
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: "18px", fontFamily: T.font }}>{t("sermons_library_title")}</h4>
                  <p style={{ margin: 0, color: T.muted, fontSize: "13px", fontFamily: T.fontSans }}>
                    {t("sermons_library_desc")}
                  </p>
                </div>
              </div>

              {!filteredHistory.length ? (
                <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                  {t("sermons_no_results")}
                </p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {filteredHistory.map((entry) => {
                    const active = selectedHistory?.id === entry.id;
                    return (
                      <div
                        key={entry.id}
                        style={{
                          border: `1px solid ${active ? "rgba(11,42,91,.18)" : T.line}`,
                          borderRadius: "16px",
                          padding: "14px",
                          background: active ? "#eef4ff" : "#fff",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
                          <div>
                            <p style={{ margin: "0 0 4px", color: T.primary, fontSize: "16px", fontWeight: 800, fontFamily: T.fontSans }}>
                              {entry.title}
                            </p>
                            <p style={{ margin: "0 0 6px", color: T.muted, fontSize: "12px", fontFamily: T.fontSans }}>
                              {entry.seriesName} · {entry.full_content?.passage || entry.week?.passage} · {formatDate(entry.preached_at)}
                            </p>
                            <p style={{ margin: 0, color: T.text, fontSize: "13px", lineHeight: 1.6, fontFamily: T.fontSans }}>
                              {entry.preview || t("sermons_no_preview")}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <Btn variant="secondary" onClick={() => setSelectedHistoryId(entry.id)}>
                              {t("sermons_view")}
                            </Btn>
                            <Btn variant="secondary" onClick={() => copyHistory(entry)}>
                              {copiedId === entry.id ? t("final_copied") : t("sermons_copy")}
                            </Btn>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {filteredSeries.map((serie) => {
              const isExpanded = expandedSeries[serie.id];

              return (
                <div key={serie.id}>
                  <div
                    onClick={() => setExpandedSeries((prev) => ({ ...prev, [serie.id]: !prev[serie.id] }))}
                    style={{
                      display: "flex",
                      alignItems: isMobile ? "flex-start" : "center",
                      justifyContent: "space-between",
                      flexDirection: isMobile ? "column" : "row",
                      padding: "16px 20px",
                      borderRadius: isExpanded ? "18px 18px 0 0" : "18px",
                      background: `linear-gradient(135deg, ${T.primary}, #163d7a)`,
                      cursor: "pointer",
                      userSelect: "none",
                      gap: "14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "12px",
                          background: "rgba(202,161,74,.25)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "18px",
                        }}
                      >
                        📚
                      </div>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "16px", fontWeight: 800, color: "#fff", fontFamily: T.fontSans }}>
                          {serie.series_name}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,.55)", fontFamily: T.fontSans }}>
                          {serie.weeks.length} {t("sermons_week")} · {serie.preachedIds.size} {t("sermons_preached_badge")}
                        </p>
                      </div>
                    </div>
                    <span style={{ color: "rgba(255,255,255,.5)", fontSize: "18px" }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div
                      style={{
                        border: `1px solid ${T.line}`,
                        borderTop: "none",
                        borderRadius: "0 0 18px 18px",
                        overflow: "hidden",
                      }}
                    >
                      {serie.weeks.map((week, weekIndex) => {
                        const isPreached = serie.preachedIds.has(week.id);
                        const isActive = weekIndex + 1 === serie.current_week;
                        const done = stepsDone(week);

                        return (
                          <div
                            key={week.id}
                            style={{
                              display: "flex",
                              alignItems: isMobile ? "flex-start" : "center",
                              justifyContent: "space-between",
                              flexDirection: isMobile ? "column" : "row",
                              padding: "14px 20px",
                              borderBottom: weekIndex < serie.weeks.length - 1 ? `1px solid ${T.line}` : "none",
                              background: isActive ? "#f0f7ff" : "#fff",
                              gap: "12px",
                              cursor: isActive ? "pointer" : "default",
                            }}
                            onClick={() => isActive && router.push("/dashboard")}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", width: "100%" }}>
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: "10px",
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: "13px",
                                  fontWeight: 800,
                                  background: isPreached ? T.greenSoft : isActive ? T.amberSoft : T.surface2,
                                  color: isPreached ? "#166534" : isActive ? "#92400e" : T.muted,
                                  fontFamily: T.fontSans,
                                  flexShrink: 0,
                                }}
                              >
                                {isPreached ? "✓" : weekIndex + 1}
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
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "999px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  fontFamily: T.fontSans,
                                  background: isPreached ? T.greenSoft : isActive ? T.amberSoft : T.surface2,
                                  color: isPreached ? "#166534" : isActive ? "#92400e" : T.muted,
                                }}
                              >
                                {isPreached ? t("sermons_preached_badge") : isActive ? t("sermons_active_badge") : t("sermons_planned_badge")}
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
          </div>

          <div style={{ display: "grid", gap: "18px", alignContent: "start" }}>
            <Card>
              <h4 style={{ margin: "0 0 10px", fontSize: "18px", fontFamily: T.font }}>{t("sermons_preview_title")}</h4>
              {!selectedHistory ? (
                <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
                  {t("sermons_preview_empty")}
                </p>
              ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div>
                    <p style={{ margin: "0 0 4px", color: T.primary, fontSize: "18px", fontWeight: 800, fontFamily: T.fontSans }}>
                      {selectedHistory.title}
                    </p>
                    <p style={{ margin: 0, color: T.muted, fontSize: "12px", fontFamily: T.fontSans }}>
                      {selectedHistory.seriesName} · {selectedHistory.full_content?.passage || selectedHistory.week?.passage} · {formatDate(selectedHistory.preached_at)}
                    </p>
                  </div>

                  {getHistoryBigIdea(selectedHistory) && (
                    <div style={{ padding: "14px", borderRadius: "14px", background: "#eef4ff", border: `1px solid rgba(11,42,91,.1)` }}>
                      <p style={{ margin: "0 0 6px", fontSize: "12px", color: T.gold, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", fontFamily: T.fontSans }}>
                        {t("final_big_idea_label")}
                      </p>
                      <p style={{ margin: 0, color: T.primary, fontSize: "14px", lineHeight: 1.7, fontFamily: T.font }}>
                        {getHistoryBigIdea(selectedHistory)}
                      </p>
                    </div>
                  )}

                  {(selectedHistory.full_content?.builder?.approvedPoints || selectedHistory.full_content?.builder?.points)?.length > 0 && (
                    <div style={{ display: "grid", gap: "10px" }}>
                      {(selectedHistory.full_content.builder.approvedPoints || selectedHistory.full_content.builder.points).map((point, index) => (
                        <div key={index} style={{ border: `1px solid ${T.line}`, borderRadius: "14px", padding: "12px", background: "#fff" }}>
                          <p style={{ margin: "0 0 6px", fontSize: "13px", color: T.primary, fontWeight: 800, fontFamily: T.fontSans }}>
                            {point.label}: {point.statement}
                          </p>
                          <p style={{ margin: 0, color: T.muted, fontSize: "12.5px", lineHeight: 1.65, fontFamily: T.fontSans }}>
                            {point.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(selectedHistory.full_content?.application?.approvedWeeklyChallenge || selectedHistory.full_content?.application?.weeklyChallenge) && (
                    <div style={{ padding: "14px", borderRadius: "14px", background: T.violetSoft, border: `1px solid rgba(99,102,241,.12)` }}>
                      <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#5b21b6", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", fontFamily: T.fontSans }}>
                        {t("final_weekly_challenge")}
                      </p>
                      <p style={{ margin: 0, color: "#4c1d95", fontSize: "13px", lineHeight: 1.65, fontFamily: T.fontSans }}>
                        {selectedHistory.full_content.application.approvedWeeklyChallenge || selectedHistory.full_content.application.weeklyChallenge}
                      </p>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Btn onClick={() => copyHistory(selectedHistory)}>
                      {copiedId === selectedHistory.id ? t("final_copied") : t("sermons_copy")}
                    </Btn>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
