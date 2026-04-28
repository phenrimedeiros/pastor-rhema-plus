"use client";

import { useEffect, useMemo, useState } from "react";
import { Btn, Card, Notice } from "@/components/ui";
import { satisfactionSurvey } from "@/lib/supabase_client";
import {
  dismissSurveyForSession,
  isSurveyDismissedForSession,
  markSurveyCompleted,
} from "@/lib/satisfactionSurveyState";
import { useLanguage } from "@/lib/i18n";

const ROLE_OPTIONS = [
  { value: "lead_pastor", labelKey: "survey_role_lead_pastor" },
  { value: "assistant_pastor", labelKey: "survey_role_assistant_pastor" },
  { value: "ministry_leader", labelKey: "survey_role_ministry_leader" },
  { value: "bible_teacher", labelKey: "survey_role_bible_teacher" },
  { value: "bible_student", labelKey: "survey_role_bible_student" },
  { value: "other", labelKey: "survey_role_other" },
];

const TOOL_OPTIONS = [
  { value: "chat", labelKey: "survey_tool_chat" },
  { value: "bible", labelKey: "survey_tool_bible" },
  { value: "pastoral", labelKey: "survey_tool_pastoral" },
  { value: "series", labelKey: "survey_tool_series" },
  { value: "study", labelKey: "survey_tool_study" },
  { value: "builder", labelKey: "survey_tool_builder" },
  { value: "illustrations", labelKey: "survey_tool_illustrations" },
  { value: "application", labelKey: "survey_tool_application" },
  { value: "final", labelKey: "survey_tool_final" },
  { value: "sermons", labelKey: "survey_tool_sermons" },
  { value: "not_used_enough", labelKey: "survey_tool_not_used" },
];

const RATING_OPTIONS = [
  { value: "strongly_disagree", labelKey: "survey_scale_strongly_disagree" },
  { value: "disagree", labelKey: "survey_scale_disagree" },
  { value: "neutral", labelKey: "survey_scale_neutral" },
  { value: "agree", labelKey: "survey_scale_agree" },
  { value: "strongly_agree", labelKey: "survey_scale_strongly_agree" },
];

const QUALITY_OPTIONS = [
  { value: "very_low", labelKey: "survey_quality_very_low" },
  { value: "low", labelKey: "survey_quality_low" },
  { value: "reasonable", labelKey: "survey_quality_reasonable" },
  { value: "high", labelKey: "survey_quality_high" },
  { value: "excellent", labelKey: "survey_quality_excellent" },
];

const EASE_OPTIONS = [
  { value: "very_confusing", labelKey: "survey_ease_very_confusing" },
  { value: "confusing", labelKey: "survey_ease_confusing" },
  { value: "reasonable", labelKey: "survey_ease_reasonable" },
  { value: "easy", labelKey: "survey_ease_easy" },
  { value: "very_easy", labelKey: "survey_ease_very_easy" },
  { value: "not_used", labelKey: "survey_ease_not_used" },
];

const PERSONALIZATION_OPTIONS = [
  { value: "not_at_all", labelKey: "survey_personalization_not_at_all" },
  { value: "a_little", labelKey: "survey_personalization_a_little" },
  { value: "reasonably", labelKey: "survey_personalization_reasonably" },
  { value: "well", labelKey: "survey_personalization_well" },
  { value: "fully", labelKey: "survey_personalization_fully" },
];

const DIFFICULTY_OPTIONS = [
  { value: "login", labelKey: "survey_difficulty_login" },
  { value: "finding_tools", labelKey: "survey_difficulty_finding_tools" },
  { value: "creating_series", labelKey: "survey_difficulty_creating_series" },
  { value: "generating_content", labelKey: "survey_difficulty_generating_content" },
  { value: "editing_content", labelKey: "survey_difficulty_editing_content" },
  { value: "exporting", labelKey: "survey_difficulty_exporting" },
  { value: "bible_notes", labelKey: "survey_difficulty_bible_notes" },
  { value: "chat", labelKey: "survey_difficulty_chat" },
  { value: "upgrade", labelKey: "survey_difficulty_upgrade" },
  { value: "none", labelKey: "survey_difficulty_none" },
];

const DRIVER_OPTIONS = [
  { value: "better_mobile", labelKey: "survey_driver_better_mobile" },
  { value: "more_sermon_models", labelKey: "survey_driver_more_sermon_models" },
  { value: "better_export", labelKey: "survey_driver_better_export" },
  { value: "deeper_bible", labelKey: "survey_driver_deeper_bible" },
  { value: "more_counseling", labelKey: "survey_driver_more_counseling" },
  { value: "better_history", labelKey: "survey_driver_better_history" },
  { value: "faster_support", labelKey: "survey_driver_faster_support" },
  { value: "clearer_plan", labelKey: "survey_driver_clearer_plan" },
  { value: "other", labelKey: "survey_driver_other" },
];

function ChoiceGrid({ label, options, value, onChange, columns = "md:grid-cols-2" }) {
  const { t } = useLanguage();

  return (
    <fieldset className="grid gap-[8px]">
      <legend className="text-[13px] font-bold text-[#334155] font-sans">{label}</legend>
      <div className={`grid grid-cols-1 gap-[8px] ${columns}`}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`min-h-[42px] rounded-[12px] border px-[12px] py-[9px] text-left text-[13px] font-bold transition-colors ${
                active
                  ? "border-brand-primary bg-[#eef4ff] text-brand-primary"
                  : "border-brand-line bg-white text-brand-muted hover:border-brand-primary/40 hover:text-brand-primary"
              }`}
            >
              {t(option.labelKey)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label className="grid gap-[8px] text-[13px] font-bold text-[#334155] font-sans">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-[14px] border border-brand-line bg-white px-[14px] py-[12px] text-[14px] font-normal leading-[1.6] text-brand-text outline-none transition-colors focus:border-brand-primary/50"
      />
    </label>
  );
}

export default function SatisfactionSurvey({ profile, sourcePage = "app" }) {
  const { t } = useLanguage();
  const userId = profile?.id;
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    role: "",
    npsScore: null,
    primaryTool: "",
    timeSaved: "",
    aiQuality: "",
    flowClarity: "",
    personalization: "",
    difficulty: "",
    frequencyDriver: "",
    likedMost: "",
    improveFirst: "",
  });

  const canSubmit = form.npsScore !== null && form.role && form.primaryTool;

  const pageLabel = useMemo(() => {
    if (!sourcePage || sourcePage === "app") return "app";
    return sourcePage;
  }, [sourcePage]);

  useEffect(() => {
    let active = true;

    async function loadSurveyState() {
      if (!userId || sourcePage === "admin") {
        if (active) setLoadingStatus(false);
        return;
      }

      try {
        if (isSurveyDismissedForSession(userId)) {
          if (active) {
            setVisible(false);
            setLoadingStatus(false);
          }
          return;
        }

        const result = await satisfactionSurvey.getMyResponse(userId);
        if (!active) return;

        if (!result.schemaReady || result.response) {
          if (result.response) markSurveyCompleted(userId);
          setVisible(false);
          return;
        }

        setVisible(true);
      } catch (err) {
        console.error("Erro ao verificar pesquisa de satisfacao:", err);
        if (active) setVisible(false);
      } finally {
        if (active) setLoadingStatus(false);
      }
    }

    loadSurveyState();

    return () => {
      active = false;
    };
  }, [sourcePage, userId]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setMessage("");
  };

  const dismiss = () => {
    dismissSurveyForSession(userId);
    setVisible(false);
    setOpen(false);
  };

  const closeAfterSubmit = () => {
    setOpen(false);
    setVisible(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canSubmit || submitting || !userId) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await satisfactionSurvey.upsertResponse(userId, {
        plan: profile?.plan || "simple",
        role: form.role,
        nps_score: form.npsScore,
        primary_tool: form.primaryTool,
        time_saved: form.timeSaved || null,
        ai_quality: form.aiQuality || null,
        flow_clarity: form.flowClarity || null,
        personalization: form.personalization || null,
        difficulty: form.difficulty || null,
        frequency_driver: form.frequencyDriver || null,
        liked_most: form.likedMost.trim() || null,
        improve_first: form.improveFirst.trim() || null,
        source_page: pageLabel,
      });

      markSurveyCompleted(userId);
      setSubmitted(true);
      setMessage(t("survey_success"));
    } catch (err) {
      setError(err.message || t("survey_error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingStatus || !visible) return null;

  return (
    <>
      <Card className="mb-[14px] border-brand-primary/10 bg-gradient-to-br from-white to-[#f4f8ff] md:mb-[20px]">
        <div className="flex flex-col gap-[14px] md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="m-0 mb-[5px] text-[11px] font-extrabold uppercase tracking-[.08em] text-brand-gold">
              {t("survey_badge")}
            </p>
            <h3 className="m-0 mb-[5px] font-serif text-[20px] leading-[1.25] text-brand-primary">
              {t("survey_title")}
            </h3>
            <p className="m-0 max-w-[760px] text-[13px] leading-[1.65] text-brand-muted">
              {t("survey_desc")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-[8px] sm:flex-row">
            <Btn onClick={() => setOpen(true)} className="w-full sm:w-auto">
              {t("survey_start")}
            </Btn>
            <Btn variant="secondary" onClick={dismiss} className="w-full sm:w-auto">
              {t("survey_later")}
            </Btn>
          </div>
        </div>
      </Card>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 px-[12px] py-[16px] backdrop-blur-sm md:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="satisfaction-survey-title"
            className="max-h-[92dvh] w-full max-w-[860px] overflow-hidden rounded-t-[24px] bg-white shadow-[0_24px_72px_rgba(15,23,42,.25)] md:rounded-[24px]"
          >
            <div className="flex items-start justify-between gap-[14px] border-b border-brand-line px-[18px] py-[16px] md:px-[24px] md:py-[18px]">
              <div>
                <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-brand-gold">
                  {t("survey_badge")}
                </p>
                <h3 id="satisfaction-survey-title" className="m-0 font-serif text-[22px] text-brand-primary">
                  {t("survey_modal_title")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("mobile_dock_close")}
                className="grid h-[34px] w-[34px] shrink-0 cursor-pointer place-items-center rounded-full border-none bg-slate-100 text-[18px] font-bold text-slate-500 transition-colors hover:bg-slate-200"
              >
                x
              </button>
            </div>

            {submitted ? (
              <div className="grid max-h-[calc(92dvh-86px)] justify-items-center overflow-y-auto px-[18px] py-[34px] text-center md:px-[24px] md:py-[44px]">
                <div className="mb-[16px] grid h-[64px] w-[64px] place-items-center rounded-[18px] bg-brand-green-soft text-[28px] text-green-700">
                  ✓
                </div>
                <h4 className="m-0 mb-[8px] font-serif text-[24px] leading-[1.2] text-brand-primary">
                  {t("survey_thanks_title")}
                </h4>
                <p className="m-0 max-w-[520px] text-[15px] leading-[1.7] text-brand-muted">
                  {t("survey_thanks_desc")}
                </p>
                <Btn onClick={closeAfterSubmit} className="mt-[24px]">
                  {t("survey_thanks_close")}
                </Btn>
              </div>
            ) : (
            <form onSubmit={submit} className="max-h-[calc(92dvh-86px)] overflow-y-auto px-[18px] py-[16px] md:px-[24px] md:py-[20px]">
              {error && <Notice color="red">{error}</Notice>}
              {message && <Notice color="green">{message}</Notice>}

              <div className="grid gap-[18px]">
                <fieldset className="grid gap-[10px]">
                  <legend className="text-[13px] font-bold text-[#334155] font-sans">
                    {t("survey_q_nps")}
                  </legend>
                  <div className="grid grid-cols-6 gap-[6px] sm:grid-cols-11">
                    {Array.from({ length: 11 }, (_, score) => {
                      const active = form.npsScore === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => updateField("npsScore", score)}
                          className={`grid h-[38px] place-items-center rounded-[10px] border text-[13px] font-extrabold transition-colors ${
                            active
                              ? "border-brand-primary bg-brand-primary text-white"
                              : "border-brand-line bg-white text-brand-muted hover:border-brand-primary/40 hover:text-brand-primary"
                          }`}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <ChoiceGrid
                  label={t("survey_q_role")}
                  options={ROLE_OPTIONS}
                  value={form.role}
                  onChange={(value) => updateField("role", value)}
                />

                <ChoiceGrid
                  label={t("survey_q_tool")}
                  options={TOOL_OPTIONS}
                  value={form.primaryTool}
                  onChange={(value) => updateField("primaryTool", value)}
                />

                <ChoiceGrid
                  label={t("survey_q_time_saved")}
                  options={RATING_OPTIONS}
                  value={form.timeSaved}
                  onChange={(value) => updateField("timeSaved", value)}
                />

                <ChoiceGrid
                  label={t("survey_q_ai_quality")}
                  options={QUALITY_OPTIONS}
                  value={form.aiQuality}
                  onChange={(value) => updateField("aiQuality", value)}
                />

                <ChoiceGrid
                  label={t("survey_q_flow")}
                  options={EASE_OPTIONS}
                  value={form.flowClarity}
                  onChange={(value) => updateField("flowClarity", value)}
                />

                <ChoiceGrid
                  label={t("survey_q_personalization")}
                  options={PERSONALIZATION_OPTIONS}
                  value={form.personalization}
                  onChange={(value) => updateField("personalization", value)}
                />

                <ChoiceGrid
                  label={t("survey_q_difficulty")}
                  options={DIFFICULTY_OPTIONS}
                  value={form.difficulty}
                  onChange={(value) => updateField("difficulty", value)}
                />

                <ChoiceGrid
                  label={t("survey_q_driver")}
                  options={DRIVER_OPTIONS}
                  value={form.frequencyDriver}
                  onChange={(value) => updateField("frequencyDriver", value)}
                />

                <TextAreaField
                  label={t("survey_q_liked")}
                  value={form.likedMost}
                  onChange={(value) => updateField("likedMost", value)}
                  placeholder={t("survey_open_placeholder")}
                />

                <TextAreaField
                  label={t("survey_q_improve")}
                  value={form.improveFirst}
                  onChange={(value) => updateField("improveFirst", value)}
                  placeholder={t("survey_open_placeholder")}
                />
              </div>

              <div className="sticky bottom-0 mt-[20px] flex flex-col gap-[10px] border-t border-brand-line bg-white py-[14px] sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-[12px] leading-[1.5] text-brand-muted">
                  {t("survey_required_hint")}
                </p>
                <div className="flex flex-col gap-[8px] sm:flex-row">
                  <Btn variant="secondary" onClick={() => setOpen(false)} className="w-full sm:w-auto">
                    {t("survey_close")}
                  </Btn>
                  <Btn type="submit" disabled={!canSubmit || submitting} className="w-full sm:w-auto">
                    {submitting ? t("survey_sending") : t("survey_submit")}
                  </Btn>
                </div>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
