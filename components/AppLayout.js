"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage, LANGUAGES } from "@/lib/i18n";
import { auth } from "@/lib/supabase_client";

const ICONS = {
  dashboard: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  series: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  study: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-3.46-2.74 2.5 2.5 0 0 1-3-2.93A2 2 0 0 1 2 9.5 2.5 2.5 0 0 1 4.5 7h5z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 3.46-2.74 2.5 2.5 0 0 0 3-2.93 2 2 0 0 0 3.12-2.19 2.5 2.5 0 0 0-2.5-2.5h-5z" />
    </svg>
  ),
  builder: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  illustrations: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  ),
  application: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  final: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  ),
  sermons: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  chat: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  ),
  profile: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  ),
  pastoral: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
  support: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { page: "dashboard", key: "nav_dashboard", plan: "plus", icon: "dashboard" },
  { page: "series", key: "nav_series", plan: "plus", icon: "series", step: 1 },
  { page: "study", key: "nav_study", plan: "plus", icon: "study", step: 2 },
  { page: "builder", key: "nav_builder", plan: "plus", icon: "builder", step: 3 },
  { page: "illustrations", key: "nav_illustrations", plan: "plus", icon: "illustrations", step: 4 },
  { page: "application", key: "nav_application", plan: "plus", icon: "application", step: 5 },
  { page: "final", key: "nav_final", plan: "plus", icon: "final" },
  { page: "sermons", key: "nav_sermons", plan: "plus", icon: "sermons" },
  { page: "chat", key: "nav_chat", plan: "simple", icon: "chat" },
  { page: "pastoral", key: "nav_pastoral", plan: "simple", icon: "pastoral" },
];

const PLUS_PAGES = new Set([
  "dashboard",
  "series",
  "study",
  "builder",
  "illustrations",
  "application",
  "final",
  "sermons",
]);

function UpgradeWall({ router, t }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="max-w-[480px] text-center">
        <div className="mx-auto mb-[20px] grid h-[72px] w-[72px] place-items-center rounded-[20px] bg-gradient-to-br from-[#1d4ed8] to-[#1e3a8a] text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="m-0 mb-[10px] font-serif text-[26px] text-[#0b2a5b]">
          {t("upgrade_title")}
        </h2>
        <p className="m-0 mb-[24px] text-[15px] leading-[1.7] text-slate-500">
          {t("upgrade_desc")}
        </p>
        <div className="flex flex-wrap justify-center gap-[12px]">
          <button
            onClick={() => router.push("/chat")}
            className="cursor-pointer rounded-[14px] border-none bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] px-[24px] py-[12px] text-[14px] font-bold text-white transition-transform hover:-translate-y-[1px]"
          >
            {t("upgrade_chat_btn")}
          </button>
          <button
            onClick={() => window.open("mailto:contato@pastorrhema.com?subject=Upgrade%20para%20Plus", "_blank")}
            className="cursor-pointer rounded-[14px] border border-[#e2e8f0] bg-white px-[24px] py-[12px] text-[14px] font-bold text-[#2563eb] transition-transform hover:-translate-y-[1px]"
          >
            {t("upgrade_plan_btn")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children, profile }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = pathname.replace("/", "") || "dashboard";
  const { lang, changeLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  const plan = profile?.plan || "simple";
  const isPlus = plan === "plus";
  const visibleNav = isPlus ? NAV_ITEMS : NAV_ITEMS.filter((item) => item.plan === "simple");
  const needsUpgrade = !isPlus && PLUS_PAGES.has(current);

  const currentLabel = useMemo(() => {
    if (current === "profile") return t("nav_profile");
    const currentItem = NAV_ITEMS.find((item) => item.page === current);
    return currentItem ? t(currentItem.key) : "Pastor Rhema";
  }, [current, t]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      router.push("/login");
    }
  };

  const navBtnBase = "flex w-full items-center gap-[12px] rounded-[10px] border-none p-[10px_14px] text-left font-sans text-[14px] font-medium transition-all duration-150 cursor-pointer outline-none";
  const navBtnInactive = "bg-transparent text-white/70 hover:bg-white/10 hover:text-white";
  const navBtnActive = "bg-[#2563eb] text-white shadow-[0_4px_12px_rgba(37,99,235,.25)] font-bold";

  const desktopNav = visibleNav.map(({ page, key, step, icon }) => {
    const active = current === page;
    return (
      <button
        key={page}
        onClick={() => router.push(`/${page}`)}
        className={`${navBtnBase} ${active ? navBtnActive : navBtnInactive}`}
      >
        <div className="grid h-[20px] w-[20px] place-items-center opacity-90">{ICONS[icon]}</div>
        <span className="flex-1 text-[14px]">{t(key)}</span>
        {step && (
          <span className={`rounded-full px-[6px] py-[2px] text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-white/5 text-white/40"}`}>
            E{step}
          </span>
        )}
      </button>
    );
  });

  const mobileFlowNav = visibleNav.map(({ page, key, step, icon }) => {
    const active = current === page;
    return (
      <button
        key={page}
        onClick={() => {
          setMenuOpen(false);
          router.push(`/${page}`);
        }}
        className={`flex w-full items-center gap-[12px] rounded-[10px] border-none p-[12px] text-left transition-colors ${active ? "bg-[#2563eb]/10 text-[#2563eb]" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
      >
        <div className="grid h-[20px] w-[20px] place-items-center">{ICONS[icon]}</div>
        <span className="flex-1 text-[14px] font-medium">{t(key)}</span>
        {step && (
          <span className={`rounded-full px-[6px] py-[2px] text-[10px] font-bold ${active ? "bg-[#2563eb] text-white" : "bg-[#2563eb]/10 text-[#2563eb]"}`}>
            E{step}
          </span>
        )}
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-[#f7f9fa] md:flex">
      <div className="hidden h-screen w-[260px] shrink-0 flex-col overflow-y-auto bg-[#0b2a5b] text-white md:flex">
        <div className="p-[24px]">
          <div className="flex items-center gap-[12px]">
            <div className="grid h-[36px] w-[36px] place-items-center rounded-[10px] bg-white p-[6px] shadow-[0_2px_8px_rgba(0,0,0,.2)]">
              <Image src="/logo.png" alt="Pastor Rhema" width={24} height={24} className="h-full w-full object-contain" />
            </div>
            <span className="text-[18px] font-extrabold tracking-tight">Pastor Rhema</span>
          </div>
        </div>

        <nav className="flex-1 px-[16px] py-[8px]">
          <div className="flex flex-col gap-[6px]">{desktopNav}</div>

          {!isPlus && (
            <div className="mt-[18px] rounded-[14px] border border-[#3b82f6]/20 bg-white/5 p-[14px]">
              <p className="m-0 mb-[8px] text-[13px] font-bold text-[#93c5fd]">
                {t("nav_upgrade_title")}
              </p>
              <p className="m-0 mb-[12px] text-[12px] leading-[1.55] text-white/60">
                {t("nav_upgrade_desc")}
              </p>
              <button
                onClick={() => window.open("mailto:contato@pastorrhema.com?subject=Upgrade%20para%20Plus", "_blank")}
                className="min-h-[42px] w-full cursor-pointer rounded-[10px] border-none bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] px-[12px] py-[10px] text-[13px] font-bold text-white"
              >
                {t("nav_upgrade_btn")}
              </button>
            </div>
          )}
        </nav>

        <div className="mt-auto px-[16px] pb-[20px]">
          <div className="mb-[12px] flex items-center gap-[12px] rounded-[12px] border border-white/10 bg-white/5 p-[12px]">
            <div className="grid h-[40px] w-[40px] place-items-center rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#1d4ed8] text-[14px] font-bold uppercase text-white">
              {(profile?.full_name || "P").slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate text-[14px] font-bold text-white">
                {profile?.full_name || "Pastor"}
              </p>
              <span className={`mt-[2px] inline-block rounded-[4px] px-[6px] py-[2px] text-[9px] font-bold tracking-wider ${isPlus ? "bg-[#3b82f6]/20 text-[#60a5fa]" : "bg-white/10 text-white/50"}`}>
                {isPlus ? t("plan_plus").toUpperCase() : t("plan_simple").toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-[6px]">
            <button
              onClick={() => router.push("/profile")}
              className={`flex h-[42px] w-full items-center justify-center gap-[8px] rounded-[10px] border border-white/5 text-[13px] font-bold transition-colors ${current === "profile" ? "bg-[#2563eb]/20 text-[#60a5fa] border-[#2563eb]/30" : "bg-white/5 text-white/90 hover:bg-white/10"}`}
            >
              {ICONS.profile}
              {t("nav_profile")}
            </button>
            <a
              href="mailto:support@pastorrhema.com"
              className="flex h-[42px] w-full items-center justify-center gap-[8px] rounded-[10px] border border-white/5 bg-white/5 text-[13px] font-bold text-white/90 no-underline transition-colors hover:bg-white/10"
            >
              {ICONS.support}
              {t("nav_support")}
            </a>
            <button
              onClick={handleSignOut}
              className="flex h-[42px] w-full items-center justify-center gap-[8px] rounded-[10px] border border-red-500/10 bg-red-500/10 text-[13px] font-bold text-red-400 transition-colors hover:bg-red-500/20"
            >
              {ICONS.logout}
              {t("nav_signout")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="hidden h-[72px] items-center justify-between border-b border-[#e2e8f0] bg-white px-[32px] md:flex">
          <span className="text-[13px] font-medium tracking-wide text-[#64748b]">
            App / <span className="font-bold text-[#0f172a]">{currentLabel}</span>
          </span>
          <div className="flex items-center gap-[16px]">
            <div className="flex gap-[4px] rounded-[8px] bg-slate-100 p-[4px]">
              {LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => changeLang(language.code)}
                  title={language.label}
                  className={`h-[28px] w-[28px] cursor-pointer rounded-[6px] border-none text-[12px] transition-all ${lang === language.code ? "bg-white text-slate-800 shadow-sm font-bold" : "bg-transparent text-slate-500 hover:text-slate-700"}`}
                >
                  {language.code.toUpperCase()}
                </button>
              ))}
            </div>
            <a
              href="mailto:support@pastorrhema.com"
              className="grid h-[36px] w-[36px] place-items-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            >
              {ICONS.support}
            </a>
          </div>
        </div>

        <div className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-[#e2e8f0] bg-white px-[16px] shadow-sm md:hidden">
          <div className="flex items-center gap-[12px]">
            <div className="grid h-[32px] w-[32px] place-items-center rounded-[8px] bg-white p-[4px] shadow-[0_2px_8px_rgba(0,0,0,.1)]">
              <Image src="/logo.png" alt="Pastor Rhema" width={24} height={24} className="h-full w-full object-contain" />
            </div>
            <p className="m-0 truncate text-[15px] font-bold text-[#0f172a]">
              {currentLabel}
            </p>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-gradient-to-tr from-[#3b82f6] to-[#1d4ed8] text-[14px] font-bold text-white"
          >
            {(profile?.full_name || "P").slice(0, 1).toUpperCase()}
          </button>
        </div>

        {menuOpen && (
          <div
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          />
        )}

        <div className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-[28px] bg-white shadow-[0_-18px_50px_rgba(15,23,42,.15)] transition-transform duration-200 md:hidden ${menuOpen ? "translate-y-0" : "translate-y-full"}`}>
          <div className="mx-auto mb-[8px] mt-[12px] h-[5px] w-[50px] rounded-full bg-slate-200" />
          <div className="max-h-[calc(85vh-32px)] overflow-y-auto px-[20px] py-[16px]">
            <h3 className="m-0 mb-[16px] text-[13px] font-extrabold uppercase tracking-wide text-slate-400">
              {t("mobile_dock_more")}
            </h3>
            <div className="flex flex-col gap-[6px]">
              {mobileFlowNav}
            </div>

            <h3 className="mb-[16px] mt-[24px] text-[13px] font-extrabold uppercase tracking-wide text-slate-400">
              {t("mobile_dock_account")}
            </h3>
            <div className="flex flex-col gap-[6px]">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/profile");
                }}
                className={`flex w-full items-center gap-[12px] rounded-[10px] border-none p-[12px] text-left transition-colors ${current === "profile" ? "bg-[#2563eb]/10 text-[#2563eb]" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
              >
                {ICONS.profile}
                <span className="text-[14px] font-medium">{t("nav_profile")}</span>
              </button>
              <a
                href="mailto:support@pastorrhema.com"
                className="flex items-center gap-[12px] rounded-[10px] bg-slate-50 p-[12px] text-[14px] font-medium text-slate-700 no-underline hover:bg-slate-100"
              >
                {ICONS.support}
                <span>{t("nav_support")}</span>
              </a>
            </div>

            <h3 className="mb-[16px] mt-[24px] text-[13px] font-extrabold uppercase tracking-wide text-slate-400">
              {t("mobile_dock_preferences")}
            </h3>
            <div className="mb-[16px] flex gap-[8px]">
              {LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => {
                    changeLang(language.code);
                    setMenuOpen(false);
                  }}
                  className={`min-h-[40px] flex-1 rounded-[8px] border-none text-[12px] font-bold transition-colors ${lang === language.code ? "bg-[#2563eb] text-white" : "bg-slate-100 text-slate-600"}`}
                >
                  {language.code.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleSignOut}
              className="flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[10px] border border-red-100 bg-red-50 text-[14px] font-bold text-red-500"
            >
              {ICONS.logout}
              {t("nav_signout")}
            </button>
          </div>
        </div>

        <div className="app-content mb-[92px] p-[16px] md:mb-0 md:p-[32px]">
          <div className="mx-auto max-w-[1200px]">
            {needsUpgrade ? <UpgradeWall router={router} t={t} /> : children}
          </div>
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-[12px] z-50 flex justify-center px-[12px] md:hidden">
          <nav className="pointer-events-auto flex w-full max-w-[400px] items-center justify-between rounded-[24px] border border-[#e2e8f0] bg-white px-[12px] py-[8px] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            {isPlus ? (
              <>
                <button
                  onClick={() => router.push("/dashboard")}
                  className={`flex w-[20%] flex-col items-center justify-center gap-[4px] border-none bg-transparent p-[6px] transition-colors ${current === "dashboard" ? "text-[#2563eb]" : "text-slate-400"}`}
                >
                  {ICONS.dashboard}
                  <span className="text-[10px] font-bold">{t("mobile_dock_home")}</span>
                </button>
                <button
                  onClick={() => router.push("/series")}
                  className={`flex w-[20%] flex-col items-center justify-center gap-[4px] border-none bg-transparent p-[6px] transition-colors ${current === "series" ? "text-[#2563eb]" : "text-slate-400"}`}
                >
                  {ICONS.series}
                  <span className="text-[10px] font-bold">{t("mobile_dock_plans")}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/chat")}
                className={`flex w-[30%] flex-col items-center justify-center gap-[4px] border-none bg-transparent p-[6px] transition-colors ${current === "chat" ? "text-[#2563eb]" : "text-slate-400"}`}
              >
                {ICONS.chat}
                <span className="text-[10px] font-bold">{t("mobile_dock_chat")}</span>
              </button>
            )}

            <div className={`relative flex flex-col items-center justify-center ${isPlus ? "w-[20%]" : "w-[30%]"} -mt-[32px]`}>
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-[56px] w-[56px] cursor-pointer items-center justify-center rounded-[18px] border-[4px] border-[#f7f9fa] bg-white p-[10px] shadow-[0_4px_14px_rgba(0,0,0,.15)] transition-transform hover:scale-105 active:scale-95"
              >
                <Image src="/logo.png" alt="Pastor Rhema" width={32} height={32} className="h-full w-full object-contain" />
              </button>
            </div>

            {isPlus ? (
              <>
                <button
                  onClick={() => router.push("/sermons")}
                  className={`flex w-[20%] flex-col items-center justify-center gap-[4px] border-none bg-transparent p-[6px] transition-colors ${current === "sermons" ? "text-[#2563eb]" : "text-slate-400"}`}
                >
                  {ICONS.sermons}
                  <span className="text-[10px] font-bold">{t("mobile_dock_library")}</span>
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className={`flex w-[20%] flex-col items-center justify-center gap-[4px] border-none bg-transparent p-[6px] transition-colors ${current === "profile" ? "text-[#2563eb]" : "text-slate-400"}`}
                >
                  {ICONS.profile}
                  <span className="text-[10px] font-bold">{t("mobile_dock_profile")}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/profile")}
                className={`flex w-[30%] flex-col items-center justify-center gap-[4px] border-none bg-transparent p-[6px] transition-colors ${current === "profile" ? "text-[#2563eb]" : "text-slate-400"}`}
              >
                {ICONS.profile}
                <span className="text-[10px] font-bold">{t("mobile_dock_profile")}</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
