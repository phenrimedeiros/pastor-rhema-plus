"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, supabase } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";
import AppLayout from "@/components/AppLayout";
import { Btn, Card, Notice, Loader } from "@/components/ui";

const COUNSEL_CATEGORIES = [
  { key: "grief",     labelKey: "pastoral_cat_grief" },
  { key: "financial", labelKey: "pastoral_cat_financial" },
  { key: "marriage",  labelKey: "pastoral_cat_marriage" },
  { key: "anxiety",   labelKey: "pastoral_cat_anxiety" },
  { key: "doubt",     labelKey: "pastoral_cat_doubt" },
  { key: "illness",   labelKey: "pastoral_cat_illness" },
  { key: "other",     labelKey: "pastoral_cat_other" },
];

function ResultBlock({ label, children, accent }) {
  const colors = {
    blue:   "border-brand-primary/15 bg-brand-surface-3",
    gold:   "border-brand-gold/30 bg-brand-amber-soft",
    green:  "border-green-600/20 bg-brand-green-soft",
    purple: "border-indigo-500/20 bg-brand-violet-soft",
    default:"border-brand-line bg-white",
  };
  const labelColors = {
    blue:   "text-brand-primary",
    gold:   "text-amber-800",
    green:  "text-green-800",
    purple: "text-indigo-800",
    default:"text-brand-muted",
  };
  return (
    <div className={`border rounded-[16px] p-[16px] ${colors[accent] || colors.default}`}>
      <p className={`m-0 mb-[8px] text-[11px] font-extrabold uppercase tracking-[.08em] font-sans ${labelColors[accent] || labelColors.default}`}>
        {label}
      </p>
      {children}
    </div>
  );
}

function ComfortResult({ result, t }) {
  return (
    <div className="grid gap-[12px] mt-[4px]">
      <ResultBlock label={t("pastoral_result_empathy")} accent="blue">
        <p className="m-0 text-[14px] text-brand-text leading-[1.7] font-sans whitespace-pre-wrap">{result.empathy}</p>
      </ResultBlock>

      <ResultBlock label={t("pastoral_result_scripture")} accent="gold">
        <p className="m-0 text-[15px] text-amber-900 leading-[1.6] font-serif italic">{result.scripture}</p>
      </ResultBlock>

      <ResultBlock label={t("pastoral_result_encouragement")} accent="default">
        <p className="m-0 text-[14px] text-brand-text leading-[1.7] font-sans whitespace-pre-wrap">{result.encouragement}</p>
      </ResultBlock>

      <ResultBlock label={t("pastoral_result_prayer")} accent="green">
        <p className="m-0 text-[14px] text-green-900 leading-[1.7] font-sans italic whitespace-pre-wrap">{result.prayer}</p>
      </ResultBlock>
    </div>
  );
}

function CounselResult({ result, t }) {
  return (
    <div className="grid gap-[12px] mt-[4px]">
      <ResultBlock label={t("pastoral_result_opening")} accent="blue">
        <p className="m-0 text-[14px] text-brand-text leading-[1.7] font-sans whitespace-pre-wrap">{result.opening}</p>
      </ResultBlock>

      <ResultBlock label={t("pastoral_result_scripture")} accent="gold">
        <p className="m-0 text-[15px] text-amber-900 leading-[1.6] font-serif italic">{result.keyScripture}</p>
      </ResultBlock>

      <ResultBlock label={t("pastoral_result_biblical")} accent="default">
        <p className="m-0 text-[14px] text-brand-text leading-[1.7] font-sans whitespace-pre-wrap">{result.biblicalBasis}</p>
      </ResultBlock>

      <ResultBlock label={t("pastoral_result_suggested")} accent="purple">
        <p className="m-0 text-[14px] text-indigo-900 leading-[1.7] font-sans whitespace-pre-wrap">{result.suggestedResponse}</p>
      </ResultBlock>

      {Array.isArray(result.approachTips) && result.approachTips.length > 0 && (
        <ResultBlock label={t("pastoral_result_tips")} accent="default">
          <ul className="m-0 p-0 list-none grid gap-[8px]">
            {result.approachTips.map((tip, i) => (
              <li key={i} className="flex gap-[10px] items-start">
                <span className="text-brand-gold font-bold text-[14px] mt-[1px]">→</span>
                <span className="text-[13px] text-brand-text leading-[1.6] font-sans">{tip}</span>
              </li>
            ))}
          </ul>
        </ResultBlock>
      )}

      <ResultBlock label={t("pastoral_result_prayer")} accent="green">
        <p className="m-0 text-[14px] text-green-900 leading-[1.7] font-sans italic whitespace-pre-wrap">{result.prayer}</p>
      </ResultBlock>
    </div>
  );
}

export default function PastoralPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [mode, setMode] = useState("comfort");
  const [situation, setSituation] = useState("");
  const [category, setCategory] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await auth.getSession();
        if (!session) { router.push("/login"); return; }
        const { data: prof } = await supabase.from("profiles").select("plan, full_name").eq("id", session.user.id).single();
        setProfile(prof || {});
      } catch {
        router.push("/login");
      } finally {
        setAuthLoading(false);
      }
    };
    init();
  }, [router]);

  const handleGenerate = async () => {
    if (!situation.trim() || generating) return;
    setError("");
    setResult(null);
    setGenerating(true);

    try {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }

      const response = await fetch("/api/pastoral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ mode, situation, category: category || undefined }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || t("pastoral_error_generic"));
      setResult(data.content);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const buildCopyText = () => {
    if (!result) return "";
    if (mode === "comfort") {
      return [
        `🤍 ${t("pastoral_result_comfort_title")}`,
        "",
        result.empathy,
        "",
        `📖 ${result.scripture}`,
        "",
        result.encouragement,
        "",
        `🙏 ${t("pastoral_result_prayer")}`,
        result.prayer,
      ].join("\n");
    }
    const tips = Array.isArray(result.approachTips) && result.approachTips.length > 0
      ? result.approachTips.map((tip) => `• ${tip}`).join("\n")
      : "";
    return [
      `📋 ${t("pastoral_result_counsel_title")}`,
      "",
      result.opening,
      "",
      `📖 ${result.keyScripture}`,
      "",
      result.suggestedResponse,
      "",
      `🙏 ${t("pastoral_result_prayer")}`,
      result.prayer,
      tips ? `\n${t("pastoral_result_tips")}\n${tips}` : "",
    ].filter(Boolean).join("\n");
  };

  const handleCopy = () => {
    const text = buildCopyText();
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleReset = () => {
    setResult(null);
    setSituation("");
    setCategory("");
    setError("");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
        <Loader text={t("common_loading")} />
      </div>
    );
  }

  return (
    <AppLayout profile={profile}>
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0b2a5b]/98 to-[#12366c]/92 text-white rounded-[28px] p-[22px_18px] md:p-[28px_32px] shadow-brand-lg mb-[22px] relative overflow-hidden">
        <div className="absolute -right-[60px] -bottom-[80px] w-[280px] h-[280px] bg-[radial-gradient(circle,rgba(202,161,74,.2),transparent_65%)] pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-[8px] py-[6px] px-[12px] rounded-full bg-white/10 text-[12px] font-extrabold mb-[16px] font-sans text-white/90">
            🫂 {t("pastoral_badge")}
          </div>
          <h1 className="m-0 mb-[8px] text-[28px] md:text-[32px] font-serif leading-[1.15] tracking-[-.02em]">
            {t("pastoral_hero_title")}
          </h1>
          <p className="m-0 text-[15px] text-white/70 font-sans max-w-[520px] leading-[1.65]">
            {t("pastoral_hero_desc")}
          </p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-[8px] mb-[20px] flex-wrap">
        <button
          onClick={() => { setMode("comfort"); setResult(null); setError(""); }}
          className={`flex items-center gap-[8px] px-[18px] py-[10px] rounded-[14px] text-[14px] font-bold font-sans border transition-all cursor-pointer ${
            mode === "comfort"
              ? "bg-brand-primary text-white border-brand-primary"
              : "bg-white text-brand-muted border-brand-line hover:border-brand-primary/40"
          }`}
        >
          🤍 {t("pastoral_tab_comfort")}
        </button>
        <button
          onClick={() => { setMode("counsel"); setResult(null); setError(""); }}
          className={`flex items-center gap-[8px] px-[18px] py-[10px] rounded-[14px] text-[14px] font-bold font-sans border transition-all cursor-pointer ${
            mode === "counsel"
              ? "bg-brand-primary text-white border-brand-primary"
              : "bg-white text-brand-muted border-brand-line hover:border-brand-primary/40"
          }`}
        >
          📋 {t("pastoral_tab_counsel")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-[20px] items-start">

          {/* Input */}
          <Card>
            <h3 className="m-0 mb-[6px] text-[18px] font-serif text-brand-primary">
              {mode === "comfort" ? t("pastoral_comfort_title") : t("pastoral_counsel_title")}
            </h3>
            <p className="m-0 mb-[16px] text-[13px] text-brand-muted font-sans leading-[1.6]">
              {mode === "comfort" ? t("pastoral_comfort_desc") : t("pastoral_counsel_desc")}
            </p>

            {mode === "counsel" && (
              <div className="mb-[14px]">
                <p className="m-0 mb-[8px] text-[12px] text-brand-muted font-extrabold uppercase tracking-[.06em] font-sans">
                  {t("pastoral_category_label")}
                </p>
                <div className="flex flex-wrap gap-[6px]">
                  {COUNSEL_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setCategory(category === cat.key ? "" : cat.key)}
                      className={`px-[12px] py-[6px] rounded-full text-[12px] font-bold font-sans border cursor-pointer transition-all ${
                        category === cat.key
                          ? "bg-brand-primary text-white border-brand-primary"
                          : "bg-white text-brand-muted border-brand-line hover:border-brand-primary/40"
                      }`}
                    >
                      {t(cat.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <textarea
              value={situation}
              onChange={(e) => { setSituation(e.target.value); setResult(null); setError(""); }}
              rows={6}
              placeholder={mode === "comfort" ? t("pastoral_comfort_ph") : t("pastoral_counsel_ph")}
              className="w-full p-[14px_16px] rounded-[14px] border border-brand-line bg-white text-[14px] leading-[1.7] font-sans text-brand-text resize-y outline-none focus:border-brand-primary/50 transition-colors mb-[14px]"
            />

            {error && <Notice color="red">{error}</Notice>}

            <div className="flex gap-[10px] flex-wrap">
              <Btn
                onClick={handleGenerate}
                disabled={!situation.trim() || generating}
              >
                {generating ? t("pastoral_generating") : (mode === "comfort" ? t("pastoral_comfort_cta") : t("pastoral_counsel_cta"))}
              </Btn>
              {result && (
                <Btn variant="secondary" onClick={handleReset}>
                  {t("pastoral_new")}
                </Btn>
              )}
            </div>
          </Card>

          {/* Result */}
          <div>
            {generating && (
              <Card>
                <Loader text={t("pastoral_generating")} />
              </Card>
            )}

            {!generating && !result && (
              <Card>
                <div className="text-center py-[28px] grid gap-[10px] justify-items-center">
                  <div className="text-[40px]">{mode === "comfort" ? "🤍" : "📋"}</div>
                  <p className="m-0 text-[14px] text-brand-muted font-sans max-w-[280px] leading-[1.65]">
                    {mode === "comfort" ? t("pastoral_comfort_empty") : t("pastoral_counsel_empty")}
                  </p>
                </div>
              </Card>
            )}

            {!generating && result && (
              <Card>
                <div className="flex items-center justify-between gap-[12px] mb-[14px] flex-wrap">
                  <h4 className="m-0 text-[17px] font-serif text-brand-primary">
                    {mode === "comfort" ? t("pastoral_result_comfort_title") : t("pastoral_result_counsel_title")}
                  </h4>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-[6px] px-[14px] py-[8px] rounded-[12px] border border-brand-line bg-white text-[13px] font-bold font-sans text-brand-text cursor-pointer transition-all hover:border-brand-primary/40 hover:text-brand-primary shrink-0"
                  >
                    {copied ? "✅ " + t("pastoral_copied") : "📋 " + t("pastoral_copy")}
                  </button>
                </div>
                {mode === "comfort"
                  ? <ComfortResult result={result} t={t} />
                  : <CounselResult result={result} t={t} />
                }
              </Card>
            )}
          </div>
        </div>
    </AppLayout>
  );
}
