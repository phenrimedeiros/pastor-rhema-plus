"use client";

import { useRouter } from "next/navigation";
import { Btn, Notice } from "@/components/ui";
import { SERMON_FLOW_STEPS, getSermonFlowStatus } from "@/lib/sermonFlow";

const STATUS_STYLES = {
  done: {
    bg: "bg-green-600/10",
    border: "border-green-600/20",
    text: "text-green-800",
    icon: "✓",
  },
  current: {
    bg: "bg-brand-gold/15",
    border: "border-brand-gold/20",
    text: "text-amber-800",
    icon: "•",
  },
  locked: {
    bg: "bg-brand-surface-2",
    border: "border-brand-line",
    text: "text-brand-muted",
    icon: "·",
  },
};

export default function SermonFlowNav({ currentStepKey, week, canContinue, savedContentText = "" }) {
  const router = useRouter();
  const currentIndex = SERMON_FLOW_STEPS.findIndex((step) => step.key === currentStepKey);
  const previousStep = SERMON_FLOW_STEPS[currentIndex - 1];
  const nextStep = SERMON_FLOW_STEPS[currentIndex + 1];

  return (
    <div className="mb-[18px] p-[16px] md:p-[18px] rounded-[24px] border border-brand-line bg-gradient-to-b from-white to-[#f9fbfe] shadow-brand">
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-[14px]">
        <div>
          <p className="m-0 mb-[4px] text-brand-gold text-[11px] tracking-[.08em] uppercase font-extrabold font-sans">
            Guided Sermon Flow
          </p>
          <h3 className="m-0 mb-[6px] text-[20px] md:text-[22px] font-serif">
            {SERMON_FLOW_STEPS[currentIndex]?.fullLabel}
          </h3>
          <p className="m-0 text-brand-muted text-[14px] font-sans">
            Move step by step without losing what was already generated for this week.
          </p>
        </div>

        <div className="flex gap-[10px] flex-wrap">
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
        <div className="mt-[14px]">
          <Notice color="blue">{savedContentText}</Notice>
        </div>
      )}

      <div className="mt-[8px] flex gap-[10px] overflow-x-auto px-[2px] pb-[4px] snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0">
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
              className={`flex min-w-[168px] shrink-0 snap-start items-center justify-between gap-[10px] p-[12px_13px] rounded-[16px] border md:min-w-0 ${style.border} ${isCurrent ? "bg-white shadow-[inset_0_0_0_1px_rgba(11,42,91,.08)]" : style.bg} ${isClickable ? "cursor-pointer opacity-100 transition-opacity hover:opacity-90" : "cursor-not-allowed opacity-75"} text-left`}
            >
              <div>
                <p className={`m-0 mb-[2px] text-[11px] font-extrabold font-sans ${style.text}`}>
                  Step {index + 1}
                </p>
                <p className={`m-0 text-[13px] font-sans ${isCurrent ? "text-brand-primary font-extrabold" : `${style.text} font-bold`}`}>
                  {step.label}
                </p>
              </div>
              <span className={`text-[18px] font-extrabold ${isCurrent ? "text-brand-primary" : style.text}`}>
                {isCurrent ? "→" : style.icon}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
