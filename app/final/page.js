"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, loadFullState, sermonContent } from "@/lib/supabase_client";
import { Btn, Card, Field, Notice, Pill } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/lib/i18n";
import SermonFlowNav from "@/components/SermonFlowNav";

function asText(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join("\n");
  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  }
  return "";
}

function prepareFinalBuilderContent(builder, week) {
  if (!builder) return null;

  const sourcePoints = builder.approvedPoints || builder.points || [];

  return {
    ...builder,
    selectedTitle: asText(builder.selectedTitle || builder.titleOptions?.[0] || week?.title),
    approvedBigIdea: asText(builder.approvedBigIdea || builder.bigIdea || week?.big_idea),
    introduction: asText(builder.introduction),
    conclusion: asText(builder.conclusion),
    callToAction: asText(builder.callToAction),
    approvedPoints: sourcePoints.map((point, index) => ({
      ...point,
      label: asText(point?.label || `Point ${index + 1}`),
      statement: asText(point?.statement),
      explanation: asText(point?.explanation),
      transition: asText(point?.transition),
    })),
  };
}

function prepareFinalApplicationContent(application) {
  if (!application) return null;

  return {
    ...application,
    approvedWeeklyChallenge: asText(application.approvedWeeklyChallenge || application.weeklyChallenge),
    applications: (application.applications || []).map((item) => ({
      ...item,
      action: asText(item?.action),
    })),
  };
}

function buildFullText({ serie, week, builder, illustrations, application }) {
  if (!builder) return "";
  const finalPoints = builder.approvedPoints || builder.points || [];
  const finalIllustrations = illustrations?.approvedIllustrations
    ? illustrations.approvedIllustrations.filter((item) => item.includeInFinal !== false)
    : illustrations?.illustrations || [];
  let text = "";
  text += `SERMON: ${builder.selectedTitle || builder.titleOptions?.[0] || week?.title}\n`;
  text += `Passage: ${week?.passage}\n`;
  text += `Series: ${serie?.series_name}\n\n`;
  text += `BIG IDEA\n${builder.approvedBigIdea || builder.bigIdea}\n\n`;
  text += `INTRODUCTION\n${builder.introduction}\n\n`;

  finalPoints.forEach((p, i) => {
    text += `${p.label}: ${p.statement}\n${p.explanation}\n`;
    if (finalIllustrations[i]) text += `\nIllustration: ${finalIllustrations[i].story}\n`;
    if (application?.applications?.[i]) text += `\nApplication: ${application.applications[i].action}\n`;
    text += `\n${p.transition}\n\n`;
  });

  text += `CONCLUSION\n${builder.conclusion}\n\n`;
  if (builder.callToAction) text += `CALL TO ACTION\n${builder.callToAction}\n\n`;
  if (application?.approvedWeeklyChallenge || application?.weeklyChallenge) {
    text += `WEEKLY CHALLENGE\n${application.approvedWeeklyChallenge || application.weeklyChallenge}\n`;
  }
  return text;
}

function escapeHtml(value) {
  return asText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("\n", "<br />");
}

function toSlug(value) {
  return asText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "sermon";
}

function buildExportDocument({ serie, week, builder, illustrations, application, labels }) {
  const finalPoints = builder?.approvedPoints || builder?.points || [];
  const finalIllustrations = illustrations?.approvedIllustrations
    ? illustrations.approvedIllustrations.filter((item) => item.includeInFinal !== false)
    : illustrations?.illustrations || [];

  const pointsMarkup = finalPoints
    .map((point, index) => {
      const illustration = finalIllustrations[index];
      const pointApplication = application?.applications?.[index];

      return `
        <section class="point">
          <h3>${escapeHtml(point.label)}: ${escapeHtml(point.statement)}</h3>
          <p>${escapeHtml(point.explanation)}</p>
          ${illustration?.story ? `
            <div class="support support-illustration">
              <div class="support-label">${escapeHtml(labels.illustration)}</div>
              <p>${escapeHtml(illustration.story)}</p>
            </div>
          ` : ""}
          ${pointApplication?.action ? `
            <div class="support support-application">
              <div class="support-label">${escapeHtml(labels.application)}</div>
              <p>${escapeHtml(pointApplication.action)}</p>
            </div>
          ` : ""}
          ${point.transition ? `<p class="transition">${escapeHtml(point.transition)}</p>` : ""}
        </section>
      `;
    })
    .join("");

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(builder.selectedTitle || builder.titleOptions?.[0] || week?.title)}</title>
      <style>
        body {
          margin: 0;
          padding: 40px 28px 56px;
          background: #f5f7fb;
          color: #172033;
          font-family: Georgia, "Times New Roman", serif;
        }
        .page {
          max-width: 860px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #d9e1ee;
          border-radius: 24px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
          padding: 40px;
        }
        .eyebrow {
          margin: 0 0 8px;
          font: 700 11px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #b7862d;
        }
        h1 {
          margin: 0 0 8px;
          font-size: 34px;
          line-height: 1.2;
          color: #0b2a5b;
        }
        .meta {
          margin: 0 0 28px;
          color: #64748b;
          font: 500 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .big-idea {
          margin: 0 0 24px;
          padding: 18px 20px;
          border-radius: 18px;
          background: #eef4ff;
          border: 1px solid rgba(11, 42, 91, 0.08);
          color: #0b2a5b;
          font-size: 19px;
          line-height: 1.7;
          font-weight: 700;
        }
        .section {
          margin-bottom: 18px;
          padding: 18px 20px;
          border-radius: 18px;
          border: 1px solid #d9e1ee;
          background: #ffffff;
        }
        .section-title {
          margin: 0 0 10px;
          color: #64748b;
          font: 700 13px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .section p,
        .point p {
          margin: 0;
          font-size: 15px;
          line-height: 1.8;
        }
        .point {
          margin-bottom: 16px;
          padding: 20px;
          border-radius: 18px;
          border: 1px solid #d9e1ee;
          background: #ffffff;
        }
        .point h3 {
          margin: 0 0 10px;
          color: #0b2a5b;
          font-size: 21px;
          line-height: 1.35;
        }
        .support {
          margin-top: 14px;
          padding: 14px 16px;
          border-radius: 14px;
        }
        .support-illustration {
          background: rgba(202, 161, 74, 0.14);
          color: #6b4e13;
        }
        .support-application {
          background: rgba(22, 163, 74, 0.12);
          color: #166534;
        }
        .support-label {
          margin-bottom: 6px;
          font: 800 11px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .transition {
          margin-top: 12px !important;
          color: #b7862d;
          font-style: italic;
        }
        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }
          .page {
            max-width: none;
            border: none;
            border-radius: 0;
            box-shadow: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <main class="page">
        <p class="eyebrow">${escapeHtml(labels.title)}</p>
        <h1>${escapeHtml(builder.selectedTitle || builder.titleOptions?.[0] || week?.title)}</h1>
        <p class="meta">${escapeHtml(week?.passage)} · ${escapeHtml(serie?.series_name)}</p>
        <div class="big-idea">${escapeHtml(builder.approvedBigIdea || builder.bigIdea)}</div>
        <section class="section">
          <p class="section-title">${escapeHtml(labels.intro)}</p>
          <p>${escapeHtml(builder.introduction)}</p>
        </section>
        ${pointsMarkup}
        <section class="section">
          <p class="section-title">${escapeHtml(labels.conclusion)}</p>
          <p>${escapeHtml(builder.conclusion)}</p>
        </section>
        ${builder.callToAction ? `
          <section class="section" style="background: rgba(22, 163, 74, 0.12); border-color: rgba(22, 163, 74, 0.18);">
            <p class="section-title" style="color: #166534;">${escapeHtml(labels.cta)}</p>
            <p style="color: #166534;">${escapeHtml(builder.callToAction)}</p>
          </section>
        ` : ""}
        ${application?.approvedWeeklyChallenge || application?.weeklyChallenge ? `
          <section class="section" style="background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.18);">
            <p class="section-title" style="color: #5b21b6;">${escapeHtml(labels.weeklyChallenge)}</p>
            <p style="color: #4c1d95;">${escapeHtml(application.approvedWeeklyChallenge || application.weeklyChallenge)}</p>
          </section>
        ` : ""}
      </main>
    </body>
  </html>`;
}

export default function FinalPage() {
  const [estado, setEstado] = useState(null);
  const [weekContent, setWeekContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const novo = await loadFullState();
      if (!novo.authenticated) {
        router.push("/login");
        return;
      }
      setEstado(novo);

      const activeSerie = novo.series?.find((s) => !s.is_archived);
      const currentWeek = activeSerie?.current_week ?? 1;
      const week = activeSerie?.weeks?.[currentWeek - 1];
      if (week) {
        setWeekContent({
          builder: prepareFinalBuilderContent(week.builder?.content, week),
          illustrations: week.illustrations?.content,
          application: prepareFinalApplicationContent(week.application?.content),
        });
      }
      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!saveMessage) return undefined;
    const timeoutId = window.setTimeout(() => setSaveMessage(""), 2800);
    return () => window.clearTimeout(timeoutId);
  }, [saveMessage]);

  const activeSerie = estado?.series?.find((s) => !s.is_archived);
  const currentWeek = activeSerie?.current_week ?? 1;
  const week = activeSerie?.weeks?.[currentWeek - 1];
  const { builder, illustrations, application } = weekContent;
  const finalPoints = builder?.approvedPoints || builder?.points || [];
  const finalIllustrations = illustrations?.approvedIllustrations
    ? illustrations.approvedIllustrations.filter((item) => item.includeInFinal !== false)
    : illustrations?.illustrations || [];

  const updateBuilder = (updates) => {
    setWeekContent((prev) => ({
      ...prev,
      builder: {
        ...prev.builder,
        ...updates,
      },
    }));
    setError("");
  };

  const updateBuilderPoint = (index, updates) => {
    setWeekContent((prev) => {
      const nextPoints = [...(prev.builder?.approvedPoints || [])];
      nextPoints[index] = {
        ...nextPoints[index],
        ...updates,
      };
      return {
        ...prev,
        builder: {
          ...prev.builder,
          approvedPoints: nextPoints,
        },
      };
    });
    setError("");
  };

  const updateApplication = (updates) => {
    setWeekContent((prev) => ({
      ...prev,
      application: prev.application
        ? {
            ...prev.application,
            ...updates,
          }
        : prev.application,
    }));
    setError("");
  };

  const copySermon = () => {
    const text = buildFullText({ serie: activeSerie, week, builder, illustrations, application });
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportLabels = {
    title: t("final_title"),
    intro: t("final_intro"),
    conclusion: t("final_conclusion"),
    cta: t("final_cta"),
    weeklyChallenge: t("final_weekly_challenge"),
    illustration: t("final_illustration"),
    application: t("final_application"),
  };

  const printSermon = () => {
    try {
      const documentHtml = buildExportDocument({
        serie: activeSerie,
        week,
        builder,
        illustrations,
        application,
        labels: exportLabels,
      });

      const blob = new Blob([documentHtml], {
        type: "text/html;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank", "width=960,height=900");

      if (!printWindow) {
        URL.revokeObjectURL(url);
        setError(t("final_print_error"));
        return;
      }

      const cleanup = () => {
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      };

      printWindow.onload = () => {
        printWindow.focus();
        window.setTimeout(() => {
          try {
            printWindow.print();
          } finally {
            cleanup();
          }
        }, 350);
      };

      printWindow.onafterprint = cleanup;
      printWindow.onbeforeunload = cleanup;
    } catch {
      setError(t("final_print_error"));
    }
  };

  const downloadWordDocument = () => {
    try {
      const documentHtml = buildExportDocument({
        serie: activeSerie,
        week,
        builder,
        illustrations,
        application,
        labels: exportLabels,
      });

      const blob = new Blob([`\ufeff${documentHtml}`], {
        type: "application/msword;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${toSlug(builder.selectedTitle || builder.titleOptions?.[0] || week?.title)}.doc`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("final_word_error"));
    }
  };

  const saveFinalEdits = async () => {
    if (!week?.id || !builder) return;

    try {
      setSaving(true);
      setError("");

      await sermonContent.updateActiveContent(week.id, "builder", builder);

      if (application) {
        await sermonContent.updateActiveContent(week.id, "application", application);
      }

      setSaveMessage(t("final_saved"));
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Could not save final edits.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
        <div className="text-white font-sans">{t("common_loading")}</div>
      </div>
    );
  }

  if (!builder) {
    return (
      <AppLayout profile={estado.profile}>
        <Card>
          <h4 className="m-0 mt-0 font-serif">{t("final_no_sermon")}</h4>
          <p className="text-brand-muted font-sans">{t("final_no_sermon_desc")}</p>
          <Btn onClick={() => router.push("/builder")} className="mt-[16px]">
            {t("final_go_builder")}
          </Btn>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout profile={estado.profile}>
      <SermonFlowNav
        currentStepKey="final"
        week={week}
        canContinue={false}
        savedContentText={t("final_subtitle")}
      />

      <Card className="mb-[18px]">
        <div className="flex flex-col md:flex-row justify-between gap-[14px] items-stretch md:items-center">
          <div>
            <p className="m-0 mb-[4px] text-[11px] text-brand-gold font-extrabold tracking-[0.08em] uppercase font-sans">
              {t("final_title")}
            </p>
            <h4 className="m-0 mb-[6px] text-[22px] md:text-[24px] font-serif">
              {builder.selectedTitle || builder.titleOptions?.[0] || week?.title}
            </h4>
            <p className="m-0 text-[14px] text-brand-muted leading-[1.6] font-sans">
              {t("final_edit_hint")}
            </p>
          </div>

          <div className="flex flex-wrap gap-[10px] justify-stretch md:justify-end">
            <Btn variant={readingMode ? "secondary" : "primary"} onClick={() => setReadingMode(false)}>
              {t("final_mode_review")}
            </Btn>
            <Btn variant={readingMode ? "primary" : "secondary"} onClick={() => setReadingMode(true)}>
              {t("final_mode_read")}
            </Btn>
            <Btn variant="secondary" onClick={() => setIsEditing((prev) => !prev)}>
              {isEditing ? t("final_done_editing") : t("final_edit")}
            </Btn>
            <Btn variant="secondary" onClick={copySermon}>
              {copied ? t("final_copied") : t("final_copy")}
            </Btn>
            {isEditing && (
              <Btn onClick={saveFinalEdits} disabled={saving}>
                {saving ? t("final_saving") : t("final_save")}
              </Btn>
            )}
          </div>
        </div>

        {saveMessage && <Notice color="green">{saveMessage}</Notice>}
        {error && <Notice color="red">{error}</Notice>}
      </Card>

      <div className={`grid gap-[16px] md:gap-[22px] ${readingMode ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[1.2fr_.8fr]"}`}>
        <Card className={readingMode ? "md:p-[28px]" : ""}>
          <div className="flex flex-col md:flex-row justify-between items-start gap-[12px] mb-[16px]">
            <div className="w-full">
              <p className="m-0 mb-[4px] text-[11px] text-brand-gold font-extrabold tracking-[0.08em] uppercase font-sans">
                {t("final_title")}
              </p>

              {isEditing ? (
                <Field label={t("final_title_label")}>
                  <input
                    value={builder.selectedTitle || ""}
                    onChange={(e) => updateBuilder({ selectedTitle: e.target.value })}
                    className="w-full p-[14px_16px] rounded-[14px] border border-brand-line bg-white text-[18px] font-serif text-brand-text outline-none"
                  />
                </Field>
              ) : (
                <h4 className="m-0 mb-[4px] text-[22px] font-serif">
                  {builder.selectedTitle || builder.titleOptions?.[0] || week?.title}
                </h4>
              )}

              <p className="m-[8px_0_0] text-[14px] text-brand-muted font-sans">
                {week?.passage} · {activeSerie?.series_name}
              </p>
            </div>
            <Pill className="bg-brand-green-soft text-brand-green">Complete</Pill>
          </div>

          <div className="p-[18px] md:p-[16px] rounded-[16px] bg-[#eef4ff] border border-[#0b2a5b1a] mb-[16px]">
            {isEditing ? (
              <Field label={t("final_big_idea_label")}>
                <textarea
                  value={builder.approvedBigIdea || ""}
                  onChange={(e) => updateBuilder({ approvedBigIdea: e.target.value })}
                  rows={3}
                  className="w-full p-[14px_16px] rounded-[14px] border border-brand-line bg-white text-[15px] leading-[1.7] font-sans text-brand-text resize-y outline-none"
                />
              </Field>
            ) : (
              <p className="m-0 text-brand-primary text-[18px] md:text-[16px] font-bold leading-[1.7] font-serif">
                {builder.approvedBigIdea || builder.bigIdea}
              </p>
            )}
          </div>

          <div className="border border-brand-line rounded-[16px] p-[15px] mb-[12px]">
            <h5 className="m-0 mb-[8px] text-[14px] font-sans text-brand-muted">{t("final_intro")}</h5>
            {isEditing ? (
              <textarea
                value={builder.introduction || ""}
                onChange={(e) => updateBuilder({ introduction: e.target.value })}
                rows={5}
                className="w-full p-[14px_16px] rounded-[14px] border border-brand-line bg-white text-[14px] leading-[1.7] font-sans text-brand-text resize-y outline-none"
              />
            ) : (
              <p className="m-0 text-[14px] text-brand-text leading-[1.7] font-sans whitespace-pre-wrap">
                {builder.introduction}
              </p>
            )}
          </div>

          {finalPoints.map((point, index) => (
            <div key={index} className="border border-brand-line rounded-[16px] p-[16px] md:p-[18px] mb-[12px]">
              {isEditing ? (
                <div className="grid gap-[12px]">
                  <Field label={`${point.label} ${t("builder_point_stmt") || "Statement"}`}>
                    <textarea
                      value={point.statement || ""}
                      onChange={(e) => updateBuilderPoint(index, { statement: e.target.value })}
                      rows={2}
                      className="w-full p-[14px_16px] rounded-[14px] border border-brand-line bg-white text-[15px] leading-[1.6] font-serif text-brand-text resize-y outline-none"
                    />
                  </Field>
                  <Field label={t("builder_point_exp") || "Explanation"}>
                    <textarea
                      value={point.explanation || ""}
                      onChange={(e) => updateBuilderPoint(index, { explanation: e.target.value })}
                      rows={4}
                      className="w-full p-[14px_16px] rounded-[14px] border border-brand-line bg-white text-[14px] leading-[1.7] font-sans text-brand-text resize-y outline-none"
                    />
                  </Field>
                </div>
              ) : (
                <>
                  <h5 className="m-0 mb-[8px] text-[16px] text-brand-primary font-serif">
                    {point.label}: {point.statement}
                  </h5>
                  <p className="m-0 mb-[12px] text-[14px] text-brand-text leading-[1.7] font-sans whitespace-pre-wrap">
                    {point.explanation}
                  </p>
                </>
              )}

              {finalIllustrations[index] && (
                <div className={`p-[12px] rounded-[12px] bg-brand-amber-soft mb-[10px] ${isEditing ? "mt-[12px]" : "mt-0"}`}>
                  <b className="text-[12px] text-amber-800 font-sans">{t("final_illustration")}</b>
                  <p className="m-[6px_0_0] text-[13px] text-amber-900 leading-[1.6] font-sans whitespace-pre-wrap">
                    {asText(finalIllustrations[index].story)}
                  </p>
                </div>
              )}

              {application?.applications?.[index] && (
                <div className="p-[12px] rounded-[12px] bg-brand-green-soft">
                  <b className="text-[12px] text-green-800 font-sans">{t("final_application")}</b>
                  <p className="m-[6px_0_0] text-[13px] text-green-900 leading-[1.6] font-sans">
                    {application.applications[index].action}
                  </p>
                </div>
              )}

              {isEditing ? (
                <div className="mt-[12px]">
                  <Field label={t("final_transition")}>
                    <textarea
                      value={point.transition || ""}
                      onChange={(e) => updateBuilderPoint(index, { transition: e.target.value })}
                      rows={2}
                      className="w-full p-[14px_16px] rounded-[14px] border border-brand-line bg-white text-[14px] leading-[1.6] font-sans text-brand-text resize-y outline-none"
                    />
                  </Field>
                </div>
              ) : (
                point.transition && (
                  <p className="m-[10px_0_0] text-[12px] text-brand-gold font-semibold italic font-sans">
                    → {point.transition}
                  </p>
                )
              )}
            </div>
          ))}

          <div className="border border-brand-line rounded-[16px] p-[15px] mb-[12px]">
            <h5 className="m-0 mb-[8px] text-[14px] font-sans text-brand-muted">{t("final_conclusion")}</h5>
            {isEditing ? (
              <textarea
                value={builder.conclusion || ""}
                onChange={(e) => updateBuilder({ conclusion: e.target.value })}
                rows={4}
                className="w-full p-[14px_16px] rounded-[14px] border border-brand-line bg-white text-[14px] leading-[1.7] font-sans text-brand-text resize-y outline-none"
              />
            ) : (
              <p className="m-0 text-[14px] text-brand-text leading-[1.7] font-sans whitespace-pre-wrap">
                {builder.conclusion}
              </p>
            )}
          </div>

          {(builder.callToAction || isEditing) && (
            <div className="border border-green-600/18 rounded-[16px] p-[15px] bg-brand-green-soft mb-[12px]">
              <h5 className="m-0 mb-[6px] text-[14px] text-green-800 font-sans">{t("final_cta")}</h5>
              {isEditing ? (
                <textarea
                  value={builder.callToAction || ""}
                  onChange={(e) => updateBuilder({ callToAction: e.target.value })}
                  rows={3}
                  className="w-full p-[14px_16px] rounded-[14px] border border-green-600/18 bg-white text-[14px] leading-[1.7] font-sans text-brand-text resize-y outline-none"
                />
              ) : (
                <p className="m-0 text-[14px] text-green-800 leading-[1.65] font-sans">
                  {builder.callToAction}
                </p>
              )}
            </div>
          )}

          {application && (application.approvedWeeklyChallenge || application.weeklyChallenge || isEditing) && (
            <div className="border border-indigo-600/18 rounded-[16px] p-[15px] bg-brand-violet-soft">
              <h5 className="m-0 mb-[6px] text-[14px] text-violet-800 font-sans">{t("final_weekly_challenge")}</h5>
              {isEditing ? (
                <textarea
                  value={application?.approvedWeeklyChallenge || ""}
                  onChange={(e) => updateApplication({ approvedWeeklyChallenge: e.target.value })}
                  rows={3}
                  className="w-full p-[14px_16px] rounded-[14px] border border-indigo-600/18 bg-white text-[14px] leading-[1.7] font-sans text-brand-text resize-y outline-none"
                />
              ) : (
                <p className="m-0 text-[14px] text-violet-900 leading-[1.65] font-sans">
                  {application?.approvedWeeklyChallenge || application?.weeklyChallenge}
                </p>
              )}
            </div>
          )}
        </Card>

        {!readingMode && (
          <div className="grid gap-[22px] content-start">
            {!illustrations && (
              <Card>
                <h4 className="m-0 mb-[10px] text-[16px] font-serif">{t("dash_step_illustrations")}</h4>
                <p className="m-0 text-[14px] text-brand-muted leading-[1.65] font-sans">
                  {t("final_missing_illus")}
                </p>
                <div className="mt-[14px]">
                  <Btn variant="secondary" onClick={() => router.push("/illustrations")} className="w-full justify-center">
                    {t("builder_next")}
                  </Btn>
                </div>
              </Card>
            )}

            {!application && (
              <Card>
                <h4 className="m-0 mb-[10px] text-[16px] font-serif">{t("dash_step_application")}</h4>
                <p className="m-0 text-[14px] text-brand-muted leading-[1.65] font-sans">
                  {t("final_missing_app")}
                </p>
                <div className="mt-[14px]">
                  <Btn variant="secondary" onClick={() => router.push("/application")} className="w-full justify-center">
                    {t("illus_next")}
                  </Btn>
                </div>
              </Card>
            )}

            <Card>
              <h4 className="m-0 mb-[16px] text-[18px] font-serif">{t("final_export")}</h4>
              <div className="grid gap-[10px]">
                <Btn onClick={copySermon} className="w-full justify-center">
                  {copied ? t("final_copied") : t("final_copy")}
                </Btn>
                <Btn variant="secondary" onClick={printSermon} className="w-full justify-center">
                  {t("final_print")}
                </Btn>
                <Btn variant="secondary" onClick={downloadWordDocument} className="w-full justify-center">
                  {t("final_download_word")}
                </Btn>
                <Btn variant="secondary" onClick={() => router.push("/dashboard")} className="w-full justify-center">
                  {t("final_back")}
                </Btn>
              </div>
              <p className="m-[12px_0_0] text-[12px] text-brand-muted leading-[1.6] font-sans">
                {t("final_export_hint")}
              </p>
            </Card>

            <Card>
              <h4 className="m-0 mb-[12px] text-[16px] font-serif">{t("final_checklist")}</h4>
              {[
                { label: t("final_check_idea"), done: !!builder?.approvedBigIdea },
                { label: t("final_check_points"), done: finalPoints.length === 3 },
                { label: t("final_check_illus"), done: !!illustrations },
                { label: t("final_check_app"), done: !!application },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-[10px] p-[10px] rounded-[12px] mb-[8px] border ${item.done ? "bg-brand-green-soft border-green-600/20" : "bg-brand-surface-2 border-brand-line"}`}
                >
                  <span className="text-[16px]">{item.done ? "✅" : "⬜"}</span>
                  <span className={`text-[13px] font-sans ${item.done ? "text-green-800" : "text-brand-muted"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
