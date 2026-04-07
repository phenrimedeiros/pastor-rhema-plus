"use client";

import { useRouter } from "next/navigation";
import { Btn, Notice } from "@/components/ui";
import { T } from "@/lib/tokens";
import { SERMON_FLOW_STEPS, getSermonFlowStatus } from "@/lib/sermonFlow";
import { useIsMobile } from "@/lib/useIsMobile";

const STATUS_STYLES = {
  done: {
    bg: "rgba(22,163,74,.10)",
    border: "rgba(22,163,74,.18)",
    text: "#166534",
    icon: "✓",
  },
  current: {
    bg: "rgba(202,161,74,.14)",
    border: "rgba(202,161,74,.22)",
    text: "#8a6414",
    icon: "•",
  },
  locked: {
    bg: T.surface2,
    border: T.line,
    text: T.muted,
    icon: "·",
  },
};

export default function SermonFlowNav({ currentStepKey, week, canContinue, savedContentText = "" }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const currentIndex = SERMON_FLOW_STEPS.findIndex((step) => step.key === currentStepKey);
  const previousStep = SERMON_FLOW_STEPS[currentIndex - 1];
  const nextStep = SERMON_FLOW_STEPS[currentIndex + 1];

  return (
    <div style={{
      marginBottom: "18px",
      padding: isMobile ? "16px" : "18px",
      borderRadius: "24px",
      border: `1px solid ${T.line}`,
      background: "linear-gradient(180deg, #ffffff 0%, #f9fbfe 100%)",
      boxShadow: T.shadow,
    }}>
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "center",
        gap: "14px",
      }}>
        <div>
          <p style={{
            margin: "0 0 4px",
            color: T.gold,
            fontSize: "11px",
            letterSpacing: ".08em",
            textTransform: "uppercase",
            fontWeight: 800,
            fontFamily: T.fontSans,
          }}>
            Guided Sermon Flow
          </p>
          <h3 style={{ margin: "0 0 6px", fontSize: isMobile ? "20px" : "22px", fontFamily: T.font }}>
            {SERMON_FLOW_STEPS[currentIndex]?.fullLabel}
          </h3>
          <p style={{ margin: 0, color: T.muted, fontSize: "14px", fontFamily: T.fontSans }}>
            Move step by step without losing what was already generated for this week.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {previousStep && (
            <Btn variant="secondary" onClick={() => router.push(previousStep.page)}>
              ← {previousStep.label}
            </Btn>
          )}
          {nextStep && (
            <Btn
              onClick={() => canContinue && router.push(nextStep.page)}
              disabled={!canContinue}
            >
              {canContinue ? `Continue to ${nextStep.label} →` : `Complete ${SERMON_FLOW_STEPS[currentIndex]?.label} first`}
            </Btn>
          )}
        </div>
      </div>

      {savedContentText && (
        <div style={{ marginTop: "14px" }}>
          <Notice color="blue">{savedContentText}</Notice>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(5, minmax(0, 1fr))",
        gap: "10px",
        marginTop: "8px",
      }}>
        {SERMON_FLOW_STEPS.map((step, index) => {
          const status = getSermonFlowStatus(week, index);
          const style = STATUS_STYLES[status];
          const isCurrent = step.key === currentStepKey;
          const isClickable = status !== "locked";

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => isClickable && router.push(step.page)}
              disabled={!isClickable}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "12px 13px",
                borderRadius: "16px",
                border: `1px solid ${style.border}`,
                background: isCurrent ? "#fff" : style.bg,
                boxShadow: isCurrent ? "inset 0 0 0 1px rgba(11,42,91,.08)" : "none",
                cursor: isClickable ? "pointer" : "not-allowed",
                opacity: isClickable ? 1 : 0.75,
              }}
            >
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: "0 0 2px", fontSize: "11px", color: style.text, fontWeight: 800, fontFamily: T.fontSans }}>
                  Step {index + 1}
                </p>
                <p style={{ margin: 0, color: isCurrent ? T.primary : style.text, fontSize: "13px", fontWeight: isCurrent ? 800 : 700, fontFamily: T.fontSans }}>
                  {step.label}
                </p>
              </div>
              <span style={{ color: isCurrent ? T.primary : style.text, fontSize: "18px", fontWeight: 800 }}>
                {isCurrent ? "→" : style.icon}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
