"use client";

import { useState } from "react";
import { inputStyle } from "@/lib/tokens";
import { Btn, Field, Notice } from "@/components/ui";
import { callApi } from "@/lib/api";
import { useIsMobile } from "@/lib/useIsMobile";

const TONS = ["Pastoral", "Teaching", "Evangelistic", "Expository", "Devotional"];
const PUBLICOS = [
  "General Sunday congregation",
  "New believers",
  "Families",
  "Youth",
  "Leadership",
];

export default function SeriesForm({ onSuccess }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({
    theme: "",
    weeks: "6",
    audience: "General Sunday congregation",
    tone: "Pastoral",
    goal: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await callApi("/api/gerar-serie", { ...form, weeks: Number(form.weeks) });
      onSuccess(data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && <Notice color="red">{error}</Notice>}

      <Field label="Theme or Book *">
        <input
          name="theme"
          value={form.theme}
          onChange={handleChange}
          required
          placeholder="e.g. Philippians, Faith, Psalms..."
          style={inputStyle}
        />
      </Field>

      <Field label="Primary Goal *">
        <textarea
          name="goal"
          value={form.goal}
          onChange={handleChange}
          required
          rows={3}
          placeholder="What transformation do you want this series to produce in your church?"
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px" }}>
        <Field label="Number of Weeks">
          <select name="weeks" value={form.weeks} onChange={handleChange} style={inputStyle}>
            {[4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n} weeks</option>
            ))}
          </select>
        </Field>

        <Field label="Tone">
          <select name="tone" value={form.tone} onChange={handleChange} style={inputStyle}>
            {TONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Church Profile">
        <select name="audience" value={form.audience} onChange={handleChange} style={inputStyle}>
          {PUBLICOS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Btn type="submit" disabled={loading || !form.theme || !form.goal} style={isMobile ? { width: "100%" } : undefined}>
          {loading ? "Generating series..." : "Generate Series"}
        </Btn>
      </div>
    </form>
  );
}
