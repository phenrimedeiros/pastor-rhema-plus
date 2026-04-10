"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState } from "@/lib/supabase_client";
import { Btn, Card, Pill, Notice, Loader, Field } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/lib/i18n";

function SeriesForm({ onSuccess, hasSeries }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    theme: "", weeks: "6",
    audience: "General Sunday congregation",
    tone: "Pastoral", goal: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await auth.getSession();
      if (!session) throw new Error("Not authenticated.");
      const res = await fetch("/api/gerar-serie", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...form, weeks: Number(form.weeks) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown error");
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const audiences = [
    { key: "series_aud_general",   val: "General Sunday congregation" },
    { key: "series_aud_new",       val: "New believers" },
    { key: "series_aud_families",  val: "Families" },
    { key: "series_aud_youth",     val: "Youth" },
    { key: "series_aud_leadership",val: "Leadership" },
  ];

  const tones = [
    { key: "series_tone_pastoral",   val: "Pastoral" },
    { key: "series_tone_teaching",   val: "Teaching" },
    { key: "series_tone_evang",      val: "Evangelistic" },
    { key: "series_tone_expository", val: "Expository" },
    { key: "series_tone_devotional", val: "Devotional" },
  ];

  const inputClasses = "w-full min-h-[46px] px-[14px] py-[10px] rounded-[14px] border border-brand-line bg-brand-surface text-[15px] font-sans text-brand-text mb-[6px] outline-none transition-shadow duration-150 focus:shadow-[0_0_0_2px_rgba(202,161,74,.4)] focus:border-brand-gold";

  return (
    <Card>
      <div className="flex flex-col md:flex-row justify-between items-start gap-[12px] mb-[16px]">
        <div>
          <h4 className="m-0 mb-[6px] text-[20px] font-serif">{t("series_title")}</h4>
          <p className="m-0 text-brand-muted text-[14px] font-sans">
            {t("series_subtitle")}
          </p>
        </div>
        <Pill>Step 1</Pill>
      </div>

      {hasSeries && <Notice color="green">{t("series_has_active")}</Notice>}
      {error && <Notice color="red">{error}</Notice>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px] mb-[14px]">
          <Field label={t("series_theme")}>
            <input name="theme" value={form.theme} onChange={handleChange} required
              placeholder={t("series_theme_ph")} className={inputClasses} />
          </Field>
          <Field label={t("series_weeks")}>
            <select name="weeks" value={form.weeks} onChange={handleChange} className={inputClasses}>
              {[4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n} {t("series_weeks_unit")}</option>)}
            </select>
          </Field>
          <Field label={t("series_audience")}>
            <select name="audience" value={form.audience} onChange={handleChange} className={inputClasses}>
              {audiences.map((a) => <option key={a.val} value={a.val}>{t(a.key)}</option>)}
            </select>
          </Field>
          <Field label={t("series_tone")}>
            <select name="tone" value={form.tone} onChange={handleChange} className={inputClasses}>
              {tones.map((tn) => <option key={tn.val} value={tn.val}>{t(tn.key)}</option>)}
            </select>
          </Field>
          <div className="col-span-1 md:col-span-2">
            <Field label={t("series_goal")}>
              <textarea name="goal" value={form.goal} onChange={handleChange} required rows={3}
                placeholder={t("series_goal_ph")}
                className={`${inputClasses} resize-y h-auto`} />
            </Field>
          </div>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-[12px]">
          <span className="text-brand-muted text-[12.5px] font-sans">
            {t("series_tip")}
          </span>
          <Btn type="submit" disabled={loading || !form.theme || !form.goal} className="w-full md:w-auto">
            {loading ? t("series_generating") : t("series_generate")}
          </Btn>
        </div>

        {loading && <Loader text={t("series_creating")} />}
      </form>
    </Card>
  );
}

function SeriesPreview({ serie, currentWeek, onStudy }) {
  const { t } = useLanguage();
  return (
    <Card>
      <h4 className="m-0 mb-[8px] text-[20px] font-serif">{serie.series_name}</h4>
      <p className="m-0 mb-[20px] text-brand-muted text-[14px] leading-[1.6] font-sans">
        {serie.overview}
      </p>
      <div className="grid gap-[12px]">
        {serie.weeks?.map((w) => {
          const isCurrent = w.week_number === currentWeek;
          const isDone = w.week_number < currentWeek;
          return (
            <div key={w.id} className={`border rounded-[18px] p-[16px] ${isCurrent ? "border-brand-gold/40 bg-gradient-to-b from-brand-gold/10 to-white" : "border-brand-line bg-gradient-to-b from-white to-[#fbfcfe]"}`}>
              <div className="flex flex-col md:flex-row justify-between items-start gap-[12px]">
                <div>
                  <b className="block text-[15px] mb-[4px] font-sans">
                    {t("series_week")} {w.week_number} — {w.title}
                  </b>
                  <span className="text-brand-muted text-[13px] font-sans">
                    {w.passage} · {w.focus}
                  </span>
                </div>
                <Pill className={isDone ? "bg-brand-green-soft text-green-800" : isCurrent ? "bg-brand-amber-soft text-amber-800" : ""}>
                  {isDone ? t("series_completed") : isCurrent ? t("series_current") : t("series_upcoming")}
                </Pill>
              </div>
              {isCurrent && (
                <div className="mt-[12px]">
                  <Btn onClick={onStudy} className="text-[13px] p-[10px_14px] w-full md:w-auto">
                    {t("series_start_week")}
                  </Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function SeriesPage() {
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { t } = useLanguage();

  const carregar = async () => {
    const session = await auth.getSession();
    if (!session) { router.push("/login"); return; }
    const novo = await loadFullState();
    if (!novo.authenticated) { router.push("/login"); return; }
    setEstado(novo);
    setLoading(false);
  };

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void carregar();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
      <Loader text={t("common_loading")} />
    </div>
  );

  const activeSerie = estado.series?.find((s) => !s.is_archived) ?? null;

  return (
    <AppLayout profile={estado.profile}>
      <div className="grid md:grid-cols-[1.2fr_.8fr] grid-cols-1 gap-[16px] md:gap-[22px]">
        <SeriesForm hasSeries={!!activeSerie} onSuccess={carregar} />
        <SeriesPreview
          serie={activeSerie ?? { series_name: t("series_preview"), overview: t("series_no_preview"), weeks: [] }}
          currentWeek={activeSerie?.current_week ?? 1}
          onStudy={() => router.push("/study")}
        />
      </div>
    </AppLayout>
  );
}
