"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState } from "@/lib/supabase_client";
import { T, inputStyle } from "@/lib/tokens";
import { Btn, Card, Pill, Notice, Loader, Field } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";

function SeriesForm({ onSuccess, hasSeries }) {
  const isMobile = useIsMobile();
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

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexDirection: isMobile ? "column" : "row", marginBottom: "16px" }}>
        <div>
          <h4 style={{ margin: "0 0 6px", fontSize: "20px", fontFamily: T.font }}>Plan a Sermon Series</h4>
          <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
            Define the theme once. The system organizes the next several weeks.
          </p>
        </div>
        <Pill>Step 1</Pill>
      </div>

      {hasSeries && <Notice color="green">You have an active series. Fill in the form to create a new one.</Notice>}
      {error && <Notice color="red">{error}</Notice>}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
          <Field label="Theme or Book">
            <input name="theme" value={form.theme} onChange={handleChange} required
              placeholder="e.g. Philippians, Faith, Psalms..." style={inputStyle} />
          </Field>
          <Field label="Number of Weeks">
            <select name="weeks" value={form.weeks} onChange={handleChange} style={inputStyle}>
              {[4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n} weeks</option>)}
            </select>
          </Field>
          <Field label="Church Profile">
            <select name="audience" value={form.audience} onChange={handleChange} style={inputStyle}>
              {["General Sunday congregation", "New believers", "Families", "Youth", "Leadership"]
                .map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Tone">
            <select name="tone" value={form.tone} onChange={handleChange} style={inputStyle}>
              {["Pastoral", "Teaching", "Evangelistic", "Expository", "Devotional"]
                .map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Primary Goal">
              <textarea name="goal" value={form.goal} onChange={handleChange} required rows={3}
                placeholder="What transformation do you want this series to produce in your church?"
                style={{ ...inputStyle, resize: "vertical" }} />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{ color: T.muted, fontSize: "12.5px", fontFamily: T.fontSans }}>
            Think transformation, not just information.
          </span>
          <Btn type="submit" disabled={loading || !form.theme || !form.goal} style={isMobile ? { width: "100%" } : undefined}>
            {loading ? "Generating..." : "Generate Series"}
          </Btn>
        </div>

        {loading && <Loader text="Creating your sermon series..." />}
      </form>
    </Card>
  );
}

function SeriesPreview({ serie, currentWeek, onStudy }) {
  const isMobile = useIsMobile();
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
                    Week {w.week_number} — {w.title}
                  </b>
                  <span style={{ color: T.muted, fontSize: "13px", fontFamily: T.fontSans }}>
                    {w.passage} · {w.focus}
                  </span>
                </div>
                <Pill style={
                  isDone ? { background: T.greenSoft, color: "#166534" } :
                  isCurrent ? { background: T.amberSoft, color: "#92400e" } : {}
                }>
                  {isDone ? "Completed" : isCurrent ? "Current" : "Upcoming"}
                </Pill>
              </div>
              {isCurrent && (
                <div style={{ marginTop: "12px" }}>
                  <Btn onClick={onStudy} style={{ fontSize: "13px", padding: "10px 14px", width: isMobile ? "100%" : "auto" }}>
                    Start This Week →
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
      <Loader text="Loading..." />
    </div>
  );

  const activeSerie = estado.series?.[0] ?? null;

  return (
    <AppLayout profile={estado.profile}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr .8fr", gap: isMobile ? "16px" : "22px" }}>
        <SeriesForm hasSeries={!!activeSerie} onSuccess={carregar} />
        <SeriesPreview
          serie={activeSerie ?? { series_name: "Generated Series Preview", overview: "Fill in the form and generate to see your series plan here.", weeks: [] }}
          currentWeek={activeSerie?.current_week ?? 1}
          onStudy={() => router.push("/study")}
        />
      </div>
    </AppLayout>
  );
}
