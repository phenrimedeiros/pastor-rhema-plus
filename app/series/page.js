"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState } from "@/lib/supabase_client";
import { T, inputStyle } from "@/lib/tokens";
import { Btn, Card, Pill, Notice, Loader, Field } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";
import { useLanguage } from "@/lib/i18n";

function SeriesForm({ onSuccess, hasSeries }) {
  const isMobile = useIsMobile();
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

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
        <div>
          <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>{t("series_title")}</h4>
          <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
            {t("series_subtitle")}
          </p>
        </div>
        <Pill>Step 1</Pill>
      </div>

      {hasSeries && <Notice color="green">{t("series_has_active")}</Notice>}
      {error && <Notice color="red">{error}</Notice>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <Field label={t("series_theme")}>
            <input name="theme" value={form.theme} onChange={handleChange} required
              placeholder={t("series_theme_ph")} style={inputStyle} />
          </Field>
          <Field label={t("series_weeks")}>
            <select name="weeks" value={form.weeks} onChange={handleChange} style={inputStyle}>
              {[4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n} {t("series_weeks_unit")}</option>)}
            </select>
          </Field>
          <Field label={t("series_audience")}>
            <select name="audience" value={form.audience} onChange={handleChange} style={inputStyle}>
              {audiences.map((a) => <option key={a.val} value={a.val}>{t(a.key)}</option>)}
            </select>
          </Field>
          <Field label={t("series_tone")}>
            <select name="tone" value={form.tone} onChange={handleChange} style={inputStyle}>
              {tones.map((tn) => <option key={tn.val} value={tn.val}>{t(tn.key)}</option>)}
            </select>
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label={t("series_goal")}>
              <textarea name="goal" value={form.goal} onChange={handleChange} required rows={3}
                placeholder={t("series_goal_ph")}
                style={{ ...inputStyle, resize: "vertical" }} />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ color: T.muted, fontSize: "12.5px", fontFamily: T.fontSans }}>
            {t("series_tip")}
          </span>
          <Btn type="submit" disabled={loading || !form.theme || !form.goal} style={isMobile ? { width: "100%" } : undefined}>
            {loading ? t("series_generating") : t("series_generate")}
          </Btn>
        </div>

        {loading && <Loader text={t("series_creating")} />}
      </form>
    </Card>
  );
}

function SeriesPreview({ serie, currentWeek, onStudy }) {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  return (
    <Card>
      <h4 style={{ margin: "0 0 8px", fontSize: "20px", fontFamily: T.font }}>{serie.series_name}</h4>
      <p style={{ margin: "0 0 20px", color: T.muted, fontSize: "14px", lineHeight: 1.6, fontFamily: T.fontSans }}>
        {serie.overview}
      </p>
      <div style={{ display: "grid", gap: "12px" }}>
        {serie.weeks?.map((w) => {
          const isCurrent = w.week_number === currentWeek;
          const isDone = w.week_number < currentWeek;
          return (
            <div key={w.id} style={{
              border: `1px solid ${isCurrent ? "rgba(202,161,74,.38)" : T.line}`,
              borderRadius: "18px", padding: "16px",
              background: isCurrent
                ? "linear-gradient(180deg, rgba(202,161,74,.10), #fff)"
                : "linear-gradient(180deg, #fff, #fbfcfe)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row" }}>
                <div>
                  <b style={{ display: "block", fontSize: "15px", marginBottom: "4px", fontFamily: T.fontSans }}>
                    {t("series_week")} {w.week_number} — {w.title}
                  </b>
                  <span style={{ color: T.muted, fontSize: "13px", fontFamily: T.fontSans }}>
                    {w.passage} · {w.focus}
                  </span>
                </div>
                <Pill style={
                  isDone ? { background: T.greenSoft, color: "#166534" } :
                  isCurrent ? { background: T.amberSoft, color: "#92400e" } : {}
                }>
                  {isDone ? t("series_completed") : isCurrent ? t("series_current") : t("series_upcoming")}
                </Pill>
              </div>
              {isCurrent && (
                <div style={{ marginTop: "12px" }}>
                  <Btn onClick={onStudy} style={{ fontSize: "13px", padding: "10px 14px", width: isMobile ? "100%" : "auto" }}>
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
  const isMobile = useIsMobile();
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
      <Loader text={t("common_loading")} />
    </div>
  );

  const activeSerie = estado.series?.find((s) => !s.is_archived) ?? null;

  return (
    <AppLayout profile={estado.profile}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>
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
