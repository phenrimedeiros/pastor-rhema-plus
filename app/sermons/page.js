"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState } from "@/lib/supabase_client";
import { Btn, Card, Loader, Notice } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/lib/i18n";

const STEPS = ["study", "builder", "illustrations", "application"];
const FILTERS = ["all", "preached", "planned"];

function stepsDone(week) {
  return STEPS.filter((step) => !!week[step]).length;
}

function ProgressDots({ done, total = 4 }) {
  return (
    <div className="flex gap-[4px] items-center">
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className="w-[8px] h-[8px] rounded-full"
          style={{
            background: index < done ? "linear-gradient(135deg, #22c55e, #16a34a)" : "var(--color-brand-line, #e2e8f0)",
          }}
        />
      ))}
      <span className="ml-[6px] text-[11px] text-brand-muted font-sans tracking-tight">
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
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
        <Loader text={t("common_loading")} />
      </div>
    );
  }

  return (
    <AppLayout profile={estado.profile}>
      <div className="mb-[24px]">
        <p className="m-0 mb-[4px] text-[11px] text-brand-gold font-extrabold tracking-[0.08em] uppercase font-sans">
          {t("sermons_title")}
        </p>
        <h2 className="m-0 mb-[4px] text-[26px] font-serif text-brand-primary">
          {t("sermons_title")}
        </h2>
        <p className="m-0 text-[14px] text-brand-muted font-sans">
          {completedSermons} {t("sermons_subtitle_a")} · {totalSermons} {t("sermons_subtitle_b")}
        </p>
      </div>

      <Card className="mb-[22px]">
        <div className="grid gap-[14px]">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_.8fr] gap-[14px]">
            <div>
              <label
                htmlFor="sermon-search"
                className="block mb-[8px] text-[13px] font-bold text-slate-700 font-sans"
              >
                {t("sermons_search")}
              </label>
              <input
                id="sermon-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("sermons_search_ph")}
                className="w-full p-[14px_16px] rounded-[14px] border border-brand-line bg-white text-[14px] font-sans text-brand-text outline-none"
              />
            </div>
            <div>
              <p className="block m-0 mb-[8px] text-[13px] font-bold text-slate-700 font-sans">
                {t("sermons_filter")}
              </p>
              <div className="flex gap-[10px] flex-wrap">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[28px]">
        {[
          { val: series.length, label: t("sermons_active"), emoji: "📚" },
          { val: completedSermons, label: t("sermons_preached"), emoji: "✅" },
          { val: totalSermons - completedSermons, label: t("sermons_planned"), emoji: "📋" },
        ].map((item, index) => (
          <div
            key={index}
            className="border border-brand-line rounded-[16px] p-[16px] bg-white flex items-center gap-[14px]"
          >
            <span className="text-[28px]">{item.emoji}</span>
            <div>
              <b className="block text-[24px] text-brand-primary font-serif leading-[1]">
                {item.val}
              </b>
              <span className="text-[12px] text-brand-muted font-sans">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      {series.length === 0 && (
        <Card className="text-center p-[48px_24px]">
          <p className="text-[40px] mb-[12px]">📖</p>
          <h4 className="m-0 mb-[8px] font-serif text-brand-primary">{t("sermons_empty")}</h4>
          <p className="m-0 mb-[20px] text-brand-muted font-sans text-[14px]">
            {t("sermons_empty_desc")}
          </p>
          <Btn onClick={() => router.push("/dashboard")}>{t("sermons_plan")}</Btn>
        </Card>
      )}

      {series.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-[1.05fr_.95fr] gap-[22px] items-start">
          <div className="grid gap-[18px]">
            <Card>
              <div className="flex justify-between items-center gap-[12px] mb-[16px] flex-wrap">
                <div>
                  <h4 className="m-0 mb-[4px] text-[18px] font-serif">{t("sermons_library_title")}</h4>
                  <p className="m-0 text-brand-muted text-[13px] font-sans">
                    {t("sermons_library_desc")}
                  </p>
                </div>
              </div>

              {!filteredHistory.length ? (
                <p className="m-0 text-brand-muted text-[14px] font-sans">
                  {t("sermons_no_results")}
                </p>
              ) : (
                <div className="grid gap-[12px]">
                  {filteredHistory.map((entry) => {
                    const active = selectedHistory?.id === entry.id;
                    return (
                      <div
                        key={entry.id}
                        className={`border rounded-[16px] p-[14px] ${active ? "border-[#0b2a5b2e] bg-[#eef4ff]" : "border-brand-line bg-white"}`}
                      >
                        <div className="flex justify-between gap-[12px] items-start flex-col md:flex-row">
                          <div>
                            <p className="m-0 mb-[4px] text-brand-primary text-[16px] font-extrabold font-sans">
                              {entry.title}
                            </p>
                            <p className="m-0 mb-[6px] text-brand-muted text-[12px] font-sans">
                              {entry.seriesName} · {entry.full_content?.passage || entry.week?.passage} · {formatDate(entry.preached_at)}
                            </p>
                            <p className="m-0 text-brand-text text-[13px] leading-[1.6] font-sans">
                              {entry.preview || t("sermons_no_preview")}
                            </p>
                          </div>
                          <div className="flex gap-[8px] flex-wrap">
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
                    className={`flex items-start md:items-center justify-between flex-col md:flex-row p-[16px_20px] bg-gradient-to-br from-[#0b2a5b] to-[#163d7a] cursor-pointer select-none gap-[14px] ${isExpanded ? "rounded-t-[18px]" : "rounded-[18px]"}`}
                  >
                    <div className="flex items-center gap-[14px]">
                      <div
                        className="w-[40px] h-[40px] rounded-[12px] bg-[#caa14a40] grid place-items-center text-[18px]"
                      >
                        📚
                      </div>
                      <div>
                        <p className="m-0 mb-[2px] text-[16px] font-extrabold text-white font-sans">
                          {serie.series_name}
                        </p>
                        <p className="m-0 text-[12px] text-white/55 font-sans">
                          {serie.weeks.length} {t("sermons_week")} · {serie.preachedIds.size} {t("sermons_preached_badge")}
                        </p>
                      </div>
                    </div>
                    <span className="text-white/50 text-[18px]">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>

                  {isExpanded && (
                    <div
                      className="border border-brand-line border-t-0 rounded-b-[18px] overflow-hidden"
                    >
                      {serie.weeks.map((week, weekIndex) => {
                        const isPreached = serie.preachedIds.has(week.id);
                        const isActive = weekIndex + 1 === serie.current_week;
                        const done = stepsDone(week);

                        return (
                          <div
                            key={week.id}
                            className={`flex items-start md:items-center justify-between flex-col md:flex-row p-[14px_20px] ${weekIndex < serie.weeks.length - 1 ? "border-b border-brand-line" : ""} ${isActive ? "bg-[#f0f7ff] cursor-pointer" : "bg-white cursor-default"} gap-[12px]`}
                            onClick={() => isActive && router.push("/dashboard")}
                          >
                            <div className="flex items-center gap-[14px] w-full">
                              <div
                                className={`w-[36px] h-[36px] rounded-[10px] grid place-items-center text-[13px] font-extrabold font-sans shrink-0 ${isPreached ? "bg-brand-green-soft text-brand-green" : isActive ? "bg-brand-amber-soft text-amber-800" : "bg-brand-surface-2 text-brand-muted"}`}
                              >
                                {isPreached ? "✓" : weekIndex + 1}
                              </div>
                              <div>
                                <p className="m-0 mb-[2px] text-[14px] font-bold text-brand-text font-sans">
                                  {week.title}
                                </p>
                                <p className="m-0 text-[12px] text-brand-muted font-sans">
                                  {week.passage}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-[16px] w-full md:w-auto">
                              {!isPreached && <ProgressDots done={done} />}
                              <span
                                className={`px-[10px] py-[4px] rounded-full text-[11px] font-bold font-sans ${isPreached ? "bg-brand-green-soft text-brand-green" : isActive ? "bg-brand-amber-soft text-amber-800" : "bg-brand-surface-2 text-brand-muted"}`}
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

          <div className="grid gap-[18px] content-start">
            <Card>
              <h4 className="m-0 mb-[10px] text-[18px] font-serif">{t("sermons_preview_title")}</h4>
              {!selectedHistory ? (
                <p className="m-0 text-brand-muted text-[14px] font-sans">
                  {t("sermons_preview_empty")}
                </p>
              ) : (
                <div className="grid gap-[14px]">
                  <div>
                    <p className="m-0 mb-[4px] text-brand-primary text-[18px] font-extrabold font-sans">
                      {selectedHistory.title}
                    </p>
                    <p className="m-0 text-brand-muted text-[12px] font-sans">
                      {selectedHistory.seriesName} · {selectedHistory.full_content?.passage || selectedHistory.week?.passage} · {formatDate(selectedHistory.preached_at)}
                    </p>
                  </div>

                  {getHistoryBigIdea(selectedHistory) && (
                    <div className="p-[14px] rounded-[14px] bg-[#eef4ff] border border-[rgba(11,42,91,.1)]">
                      <p className="m-0 mb-[6px] text-[12px] text-brand-gold font-extrabold uppercase tracking-[0.08em] font-sans">
                        {t("final_big_idea_label")}
                      </p>
                      <p className="m-0 text-brand-primary text-[14px] leading-[1.7] font-serif">
                        {getHistoryBigIdea(selectedHistory)}
                      </p>
                    </div>
                  )}

                  {(selectedHistory.full_content?.builder?.approvedPoints || selectedHistory.full_content?.builder?.points)?.length > 0 && (
                    <div className="grid gap-[10px]">
                      {(selectedHistory.full_content.builder.approvedPoints || selectedHistory.full_content.builder.points).map((point, index) => (
                        <div key={index} className="border border-brand-line rounded-[14px] p-[12px] bg-white">
                          <p className="m-0 mb-[6px] text-[13px] text-brand-primary font-extrabold font-sans">
                            {point.label}: {point.statement}
                          </p>
                          <p className="m-0 text-brand-muted text-[12.5px] leading-[1.65] font-sans">
                            {point.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {(selectedHistory.full_content?.application?.approvedWeeklyChallenge || selectedHistory.full_content?.application?.weeklyChallenge) && (
                    <div className="p-[14px] rounded-[14px] bg-brand-violet-soft border border-indigo-600/12">
                      <p className="m-0 mb-[6px] text-[12px] text-violet-800 font-extrabold uppercase tracking-[0.08em] font-sans">
                        {t("final_weekly_challenge")}
                      </p>
                      <p className="m-0 text-violet-900 text-[13px] leading-[1.65] font-sans">
                        {selectedHistory.full_content.application.approvedWeeklyChallenge || selectedHistory.full_content.application.weeklyChallenge}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-[10px] flex-wrap">
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
