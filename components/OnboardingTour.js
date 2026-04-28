"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

const DISMISSED_KEY = "rhema_onboarding_dismissed";

export function isOnboardingDismissed(userId) {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(`${DISMISSED_KEY}_${userId}`) === "1";
}

export function dismissOnboarding(userId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${DISMISSED_KEY}_${userId}`, "1");
}

const STEPS = [
  {
    emoji: "🚀",
    titleKey: "onboarding_step1_title",
    descKey: "onboarding_step1_desc",
    actionKey: "onboarding_step1_action",
    route: "/series",
    color: "from-[#0b2a5b] to-[#163d7a]",
  },
  {
    emoji: "🧠",
    titleKey: "onboarding_step2_title",
    descKey: "onboarding_step2_desc",
    actionKey: "onboarding_step2_action",
    route: "/study",
    color: "from-[#1a3a6b] to-[#0b2a5b]",
  },
  {
    emoji: "💬",
    titleKey: "onboarding_step3_title",
    descKey: "onboarding_step3_desc",
    actionKey: "onboarding_step3_action",
    route: "/chat",
    color: "from-[#0d3268] to-[#1a4a8a]",
  },
  {
    emoji: "📖",
    titleKey: "onboarding_step4_title",
    descKey: "onboarding_step4_desc",
    actionKey: "onboarding_step4_action",
    route: "/bible",
    color: "from-[#0b2a5b] to-[#0d3268]",
  },
];

export default function OnboardingTour({ userId }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      dismissOnboarding(userId);
      setVisible(false);
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    dismissOnboarding(userId);
    setVisible(false);
  };

  const handleAction = () => {
    dismissOnboarding(userId);
    router.push(current.route);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[16px]">
      <div className={`relative w-full max-w-[400px] rounded-[24px] bg-gradient-to-br ${current.color} p-[28px_24px] shadow-[0_24px_64px_rgba(0,0,0,.4)]`}>
        <button
          onClick={handleSkip}
          aria-label={t("onboarding_skip")}
          className="absolute top-[14px] right-[14px] h-[28px] w-[28px] cursor-pointer rounded-full border-none bg-white/10 text-[14px] text-white/60 transition-colors hover:bg-white/20 hover:text-white"
        >
          ×
        </button>

        <div className="mb-[18px] text-[42px]">{current.emoji}</div>

        <h2 className="m-0 mb-[10px] text-[22px] font-bold leading-[1.25] text-white font-serif">
          {t(current.titleKey)}
        </h2>

        <p className="m-0 mb-[24px] text-[14px] leading-[1.65] text-white/75 font-sans">
          {t(current.descKey)}
        </p>

        <div className="flex gap-[10px]">
          <button
            onClick={handleAction}
            className="min-h-[44px] flex-1 cursor-pointer rounded-[14px] border-none bg-gradient-to-br from-brand-gold to-[#b7862d] px-[18px] py-[12px] text-[14px] font-bold text-brand-primary transition-transform hover:-translate-y-[1px] font-sans"
          >
            {t(current.actionKey)}
          </button>
          <button
            onClick={handleNext}
            className="min-h-[44px] cursor-pointer rounded-[14px] border border-white/20 bg-transparent px-[18px] py-[12px] text-[14px] font-semibold text-white/80 transition-colors hover:bg-white/10 font-sans"
          >
            {isLast ? t("onboarding_finish") : t("onboarding_next")}
          </button>
        </div>

        <div className="mt-[20px] flex items-center justify-center gap-[8px]">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-[6px] rounded-full transition-all duration-300 ${
                i === step ? "w-[20px] bg-brand-gold" : i < step ? "w-[6px] bg-white/50" : "w-[6px] bg-white/20"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
