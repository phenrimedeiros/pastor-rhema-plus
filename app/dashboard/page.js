"use client";

import { useEffect, useState } from "react";
import { auth, loadFullState, supabase } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import { Btn, Card, Loader, Notice } from "@/components/ui";
import SeriesForm from "@/components/SeriesForm";
import AppLayout from "@/components/AppLayout";
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
      <div className="bg-gradient-to-br from-[#0b2a5b]/98 to-[#12366c]/92 text-white rounded-[28px] p-[22px_18px] md:p-[28px_32px] shadow-brand-lg mb-[22px] relative overflow-hidden">
        <div className="absolute -right-[60px] -bottom-[80px] w-[280px] h-[280px] bg-[radial-gradient(circle,rgba(202,161,74,.2),transparent_65%)] pointer-events-none" />

        {activeSerie ? (
          <div className="relative z-10">
            {/* Label */}
            <div className="inline-flex items-center gap-[8px] py-[6px] px-[12px] rounded-full bg-white/10 text-[12px] font-extrabold mb-[16px] font-sans text-white/90">
              📅 {t("dash_this_week")} · {nextSunday()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-[18px] md:gap-[24px] items-start">
              <div>
                <h2 className="m-0 mb-[6px] text-[25px] md:text-[30px] font-serif leading-[1.1] tracking-[-.02em]">
                  {week?.title || activeSerie.series_name}
                </h2>
                <p className="m-0 mb-[4px] text-[15px] text-white/75 font-sans">
                  {week?.passage}
                </p>
                <p className="m-0 mb-[20px] text-[13px] text-brand-gold font-bold font-sans">
                  {activeSerie.series_name} · {t("dash_week_of")} {activeSerie.current_week} {t("dash_of")} {activeSerie.weeks?.length}
                </p>

                <div className="grid md:hidden grid-cols-2 gap-[10px] mb-[18px]">
                  {[
                    { label: t("dash_next_focus"), value: mappedNext ? `${mappedNext.emoji} ${mappedNext.label}` : t("dash_step_complete") },
                    { label: t("dash_week_status"), value: weekStatusLabel },
                  ].map((item) => (
                      <div key={item.label} className="p-[12px_13px] rounded-[16px] bg-white/10 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
                        <p className="m-0 mb-[4px] text-[11px] text-white/55 font-sans">
                          {item.label}
                        </p>
                        <p className="m-0 text-[13px] text-white font-bold font-sans">
                          {item.value}
                        </p>
                      </div>
                    ))}
                </div>

                {/* Progress bar */}
                <div className="mb-[20px]">
                  <div className="flex justify-between mb-[6px]">
                    <span className="text-[12px] text-white/60 font-sans">
                      {t("dash_sermon_progress")}
                    </span>
                    <span className={`text-[12px] font-extrabold font-sans ${allDone ? 'text-green-300' : 'text-brand-gold'}`}>
                      {pct}% · {done}/{total} steps
                    </span>
                  </div>
                  <div className="h-[6px] bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ease-in-out ${allDone ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-brand-gold to-[#b7862d]'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* CTA */}
                <div className="flex gap-[12px] flex-col md:flex-row flex-wrap">
                  {allDone ? (
                    <button
                      onClick={onWeekComplete}
                      className="w-full md:w-auto min-h-[46px] px-[24px] py-[13px] rounded-[14px] border-none bg-gradient-to-br from-green-500 to-green-600 text-white font-sans text-[15px] font-extrabold cursor-pointer hover:-translate-y-[1px] transition-transform"
                    >
                      {t("dash_mark_complete")}
                    </button>
                  ) : mappedNext ? (
                    <button
                      onClick={() => router.push(`/${mappedNext.page}`)}
                      className="w-full md:w-auto min-h-[46px] px-[24px] py-[13px] rounded-[14px] border-none bg-gradient-to-br from-brand-gold to-[#b7862d] text-brand-primary font-sans text-[15px] font-extrabold cursor-pointer hover:-translate-y-[1px] transition-transform"
                    >
                      {done === 0 ? t("dash_start_week") : t("dash_resume_week")}
                    </button>
                  ) : null}
                  <button
                    onClick={() => router.push("/sermons")}
                    className="w-full md:w-auto min-h-[46px] px-[20px] py-[13px] rounded-[14px] border border-white/20 bg-transparent text-white/80 font-sans text-[14px] font-semibold cursor-pointer hover:-translate-y-[1px] transition-transform"
                  >
                    {t("dash_my_sermons")}
                  </button>
                </div>
              </div>

                <div className="hidden md:grid grid-cols-2 gap-[10px] mb-[18px]">
                  {[
                    { label: t("dash_next_focus"), value: mappedNext ? `${mappedNext.emoji} ${mappedNext.label}` : t("dash_step_complete") },
                    { label: t("dash_week_status"), value: weekStatusLabel },
                  ].map((item) => (
                    <div key={item.label} className="p-[12px_13px] rounded-[16px] bg-white/10 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]">
                      <p className="m-0 mb-[4px] text-[11px] text-white/55 font-sans">
                        {item.label}
                      </p>
                      <p className="m-0 text-[13px] text-white font-bold font-sans">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Step checklist */}
                <div className="bg-white/5 border border-white/10 rounded-[20px] p-[16px] min-w-0 md:min-w-[220px]">
                <p className="m-0 mb-[12px] text-[11px] font-extrabold text-white/50 font-sans uppercase tracking-[.06em]">
                  {t("dash_prep_steps")}
                </p>
                {SERMON_STEPS.map((step, i) => {
                  const status = getSermonFlowStatus(week, i);
                  return (
                    <div
                      key={step.key}
                      onClick={() => status !== "locked" && router.push(`/${step.page}`)}
                      className={`flex items-center gap-[10px] p-[11px_10px] rounded-[10px] mb-[4px] transition-all duration-150 ${status === "current" ? "bg-[#caa14a]/20" : "bg-transparent"} ${status === "locked" ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <span className="text-[14px]">
                        {status === "done" ? "✅" : status === "current" ? "⏳" : "🔒"}
                      </span>
                      <span className={`text-[13px] font-sans ${status === "done" ? "text-green-300" : status === "current" ? "text-brand-gold font-bold" : "text-white/30 font-medium"} no-underline`}>
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
          <div className="relative z-10">
            <div className="inline-flex items-center gap-[8px] py-[6px] px-[12px] rounded-full bg-white/10 text-[12px] font-extrabold mb-[16px] font-sans text-white">
              🚀 Ready to start
            </div>
            <h2 className="m-0 mb-[10px] text-[30px] font-serif leading-[1.1] text-white">
              {t("dash_hero_title")}
            </h2>
            <p className="m-0 mb-[20px] text-[15px] text-white/70 font-sans max-w-[480px]">
              {t("dash_hero_desc")}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="min-h-[46px] px-[28px] py-[13px] rounded-[14px] border-none bg-gradient-to-br from-brand-gold to-[#b7862d] text-brand-primary font-sans text-[15px] font-extrabold cursor-pointer hover:-translate-y-[1px] transition-transform"
            >
              {t("dash_plan_first")}
            </button>
          </div>
        )}
      </div>

      {/* ── New Series Form ── */}
      {showForm && (
        <Card className="mb-[22px]">
          <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-[12px] mb-[16px]">
            <h3 className="m-0 font-serif text-[20px] text-brand-primary">{t("dash_plan_new")}</h3>
            <Btn variant="secondary" onClick={() => setShowForm(false)} className="px-[12px] py-[8px] text-[13px]">{t("dash_cancel")}</Btn>
          </div>
          <SeriesForm onSuccess={() => { setShowForm(false); onNewSerie(); }} />
        </Card>
      )}

      {/* ── Bottom grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">

        {/* Stats */}
        {[
          { val: profile?.sermons_this_month ?? 0, label: t("dash_sermons_month"), emoji: "📖" },
          { val: `${profile?.weekly_streak ?? 0}w`, label: t("dash_streak"), emoji: "🔥" },
          { val: activeSerie ? `${activeSerie.current_week}/${activeSerie.weeks?.length ?? "?"}` : "—", label: t("dash_series_progress"), emoji: "📊" },
        ].map((s, i) => (
          <div key={i} className="border border-brand-line rounded-[18px] p-[18px] bg-gradient-to-b from-white to-[#fbfcff]">
            <span className="text-[24px]">{s.emoji}</span>
            <b className="block text-[28px] leading-[1.1] my-[8px] mb-[4px] text-brand-primary font-serif">
              {s.val}
            </b>
            <span className="text-[12.5px] text-brand-muted font-sans">{s.label}</span>
          </div>
        ))}

        {/* Quick access */}
        {activeSerie && SERMON_STEPS.slice(0, 3).map((step, i) => {
          const status = getSermonFlowStatus(week, i);
          const bgConfig = status === "done" ? "bg-brand-green-soft" : status === "current" ? "bg-brand-amber-soft" : "bg-white";
          const borderConfig = status === "current" ? "border-brand-gold" : status === "done" ? "border-green-600/30" : "border-brand-line";
          
          return (
            <div
              key={step.key}
              onClick={() => status !== "locked" && router.push(`/${step.page}`)}
              className={`border-[1.5px] ${borderConfig} rounded-[18px] p-[18px] ${bgConfig} ${status === "locked" ? "cursor-default opacity-50" : "cursor-pointer transition-transform hover:-translate-y-[2px]"}`}
            >
              <div className="text-[24px] mb-[8px]">
                {status === "done" ? "✅" : status === "current" ? step.emoji : "🔒"}
              </div>
              <b className="block text-[14px] mb-[4px] font-sans text-brand-text">
                {step.label}
              </b>
              <span className={`text-[11px] font-bold font-sans ${status === "done" ? "text-green-800" : status === "current" ? "text-amber-800" : "text-brand-muted"}`}>
                {status === "done" ? t("dash_step_complete") : status === "current" ? t("dash_step_ready") : t("dash_step_locked")}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.15fr_.85fr] gap-[16px] mt-[16px]">
        <Card>
          <div className="flex justify-between gap-[12px] items-start flex-col md:flex-row mb-[14px]">
            <div>
              <h3 className="m-0 mb-[6px] text-[20px] text-brand-primary font-serif">
                {t("dash_review_title")}
              </h3>
              <p className="m-0 text-brand-muted text-[14px] leading-[1.65] font-sans">
                {t("dash_review_desc")}
              </p>
            </div>
            {week && (
              <span className={`px-[10px] py-[7px] rounded-full text-[12px] font-extrabold font-sans ${done > 0 ? "bg-brand-blue-soft text-brand-primary" : "bg-brand-surface-2 text-brand-muted"}`}>
                {mappedNext ? `${t("dash_resume_exact")} ${mappedNext.label}` : t("dash_step_complete")}
              </span>
            )}
          </div>

          {!week ? (
            <Notice color="gold">{t("dash_review_empty")}</Notice>
          ) : (
            <div className="grid gap-[12px]">
              <div className="p-[14px_16px] rounded-[16px] bg-brand-surface-3 border border-brand-primary/10">
                <p className="m-0 mb-[5px] text-[12px] text-brand-gold font-extrabold uppercase tracking-[.08em] font-sans">
                  {t("dash_review_title_label")}
                </p>
                <p className="m-0 text-brand-primary text-[18px] leading-[1.45] font-serif">
                  {review.approvedTitle || week.title}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
                <div className="p-[14px_16px] rounded-[16px] border border-brand-line bg-white">
                  <p className="m-0 mb-[6px] text-[12px] text-brand-muted font-extrabold uppercase tracking-[.06em] font-sans">
                    {t("dash_review_bigidea")}
                  </p>
                  <p className="m-0 text-brand-text text-[14px] leading-[1.65] font-sans">
                    {review.approvedBigIdea || t("dash_review_missing")}
                  </p>
                </div>
                <div className="p-[14px_16px] rounded-[16px] border border-brand-line bg-white">
                  <p className="m-0 mb-[6px] text-[12px] text-brand-muted font-extrabold uppercase tracking-[.06em] font-sans">
                    {t("dash_review_challenge")}
                  </p>
                  <p className="m-0 text-brand-text text-[14px] leading-[1.65] font-sans">
                    {review.approvedChallenge || t("dash_review_missing")}
                  </p>
                </div>
              </div>

              <div className="p-[14px_16px] rounded-[16px] border border-brand-line bg-white">
                <p className="m-0 mb-[8px] text-[12px] text-brand-muted font-extrabold uppercase tracking-[.06em] font-sans">
                  {t("dash_review_points")}
                </p>
                {review.approvedPoints.length ? (
                  <div className="grid gap-[8px]">
                    {review.approvedPoints.slice(0, 3).map((point, index) => (
                      <div key={`${point.label}-${index}`} className="p-[10px_12px] rounded-[12px] bg-brand-surface-2">
                        <p className="m-0 mb-[4px] text-brand-primary text-[13px] font-extrabold font-sans">
                          {point.label}
                        </p>
                        <p className="m-0 text-brand-text text-[13px] leading-[1.55] font-sans">
                          {point.statement}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="m-0 text-brand-muted text-[14px] font-sans">
                    {t("dash_review_points_empty")}
                  </p>
                )}
              </div>

              <div className="flex gap-[10px] flex-wrap">
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
          <h3 className="m-0 mb-[6px] text-[20px] text-brand-primary font-serif">
            {t("dash_last_preached")}
          </h3>
          <p className="m-0 mb-[14px] text-brand-muted text-[14px] leading-[1.65] font-sans">
            {t("dash_last_preached_desc")}
          </p>

          {!latestPreached ? (
            <Notice color="blue">{t("dash_last_preached_empty")}</Notice>
          ) : (
            <div className="grid gap-[12px]">
              <div className="p-[14px_16px] rounded-[16px] bg-brand-surface-2 border border-brand-line">
                <p className="m-0 mb-[4px] text-brand-primary text-[17px] leading-[1.4] font-serif">
                  {lastPreached.title || latestPreached.full_content?.title}
                </p>
                <p className="m-0 text-brand-muted text-[12px] font-sans">
                  {latestPreached.full_content?.passage || lastPreached.passage} · {formatPreachedAt(latestPreached.preached_at)}
                </p>
              </div>

              {lastPreached.bigIdea && (
                <div className="p-[14px_16px] rounded-[16px] bg-brand-surface-3 border border-brand-primary/10">
                  <p className="m-0 mb-[6px] text-[12px] text-brand-muted font-extrabold uppercase tracking-[.06em] font-sans">
                    {t("dash_review_bigidea")}
                  </p>
                  <p className="m-0 text-brand-primary text-[14px] leading-[1.65] font-sans">
                    {lastPreached.bigIdea}
                  </p>
                </div>
              )}

              {lastPreached.challenge && (
                <div className="p-[14px_16px] rounded-[16px] bg-brand-violet-soft border border-indigo-500/10">
                  <p className="m-0 mb-[6px] text-[12px] text-indigo-800 font-extrabold uppercase tracking-[.06em] font-sans">
                    {t("dash_review_challenge")}
                  </p>
                  <p className="m-0 text-indigo-900 text-[13px] leading-[1.6] font-sans">
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
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
