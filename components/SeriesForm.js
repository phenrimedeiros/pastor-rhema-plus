"use client";

import { useState } from "react";
import { Btn, Field, Notice } from "@/components/ui";
import { callApi } from "@/lib/api";

const TONS = ["Pastoral", "Teaching", "Evangelistic", "Expository", "Devotional"];
const PUBLICOS = [
  "General Sunday congregation",
  "New believers",
  "Families",
  "Youth",
  "Leadership",
];

export default function SeriesForm({ onSuccess }) {
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

  const inputClasses = "w-full min-h-[46px] px-[14px] py-[10px] rounded-[14px] border border-brand-line bg-brand-surface text-[15px] font-sans text-brand-text mb-[6px] outline-none transition-shadow duration-150 focus:shadow-[0_0_0_2px_rgba(202,161,74,.4)] focus:border-brand-gold";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
      {error && <Notice color="red">{error}</Notice>}

      <Field label="Theme or Book *">
        <input
          name="theme"
          value={form.theme}
          onChange={handleChange}
          required
          placeholder="e.g. Philippians, Faith, Psalms..."
          className={inputClasses}
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
          className={`${inputClasses} resize-y h-auto`}
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
        <Field label="Number of Weeks">
          <select name="weeks" value={form.weeks} onChange={handleChange} className={inputClasses}>
            {[4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n} weeks</option>
            ))}
          </select>
        </Field>

        <Field label="Tone">
          <select name="tone" value={form.tone} onChange={handleChange} className={inputClasses}>
            {TONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Church Profile">
        <select name="audience" value={form.audience} onChange={handleChange} className={inputClasses}>
          {PUBLICOS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </Field>

      <div className="flex justify-end">
        <Btn type="submit" disabled={loading || !form.theme || !form.goal} className="w-full md:w-auto">
          {loading ? "Generating series..." : "Generate Series"}
        </Btn>
      </div>
    </form>
  );
}
