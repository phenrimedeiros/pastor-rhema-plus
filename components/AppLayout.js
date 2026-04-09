"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage, LANGUAGES } from "@/lib/i18n";

const NAV_ITEMS = [
  { page: "dashboard",     key: "nav_dashboard",     plan: "plus" },
  { page: "series",        key: "nav_series",         plan: "plus", step: 1 },
  { page: "study",         key: "nav_study",          plan: "plus", step: 2 },
  { page: "builder",       key: "nav_builder",        plan: "plus", step: 3 },
  { page: "illustrations", key: "nav_illustrations",  plan: "plus", step: 4 },
  { page: "application",   key: "nav_application",    plan: "plus", step: 5 },
  { page: "final",         key: "nav_final",          plan: "plus" },
  { page: "sermons",       key: "nav_sermons",        plan: "plus" },
  { page: "chat",          key: "nav_chat",           plan: "simple" },
];

const NAV_EMOJI = {
  dashboard: "🏠", series: "📚", study: "🧠", builder: "🛠",
  illustrations: "💡", application: "🎯", final: "✅", sermons: "📖",
  chat: "💬",
};

const PLUS_PAGES = new Set(["dashboard", "series", "study", "builder", "illustrations", "application", "final", "sermons"]);

function UpgradeWall({ router, t }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-[480px]">
        <div className="w-[72px] h-[72px] rounded-[20px] mx-auto mb-[20px] bg-gradient-to-br from-brand-primary to-[#163d7a] grid place-items-center text-[32px]">
          🔒
        </div>
        <h2 className="m-0 mb-[10px] font-serif text-brand-primary text-[26px]">
          {t("upgrade_title")}
        </h2>
        <p className="m-0 mb-[24px] text-brand-muted font-sans leading-[1.7] text-[15px]">
          {t("upgrade_desc")}
        </p>
        <div className="flex gap-[12px] justify-center flex-wrap">
          <button
            onClick={() => router.push("/chat")}
            className="px-[24px] py-[12px] rounded-[14px] border-none bg-gradient-to-br from-brand-primary to-[#163d7a] text-white font-sans text-[14px] font-bold cursor-pointer transition-transform hover:-translate-y-[1px]"
          >
            {t("upgrade_chat_btn")}
          </button>
          <button
            onClick={() => window.open("mailto:contato@pastorrhema.com?subject=Upgrade%20para%20Plus", "_blank")}
            className="px-[24px] py-[12px] rounded-[14px] border-[1.5px] border-brand-line bg-white text-brand-primary font-sans text-[14px] font-bold cursor-pointer transition-transform hover:-translate-y-[1px]"
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
  const visibleNav = isPlus ? NAV_ITEMS : NAV_ITEMS.filter(n => n.plan === "simple");
  const needsUpgrade = !isPlus && PLUS_PAGES.has(current);
  const currentLabel = useMemo(() => {
    const currentItem = visibleNav.find((item) => item.page === current);
    return currentItem ? t(currentItem.key) : "Pastor Rhema PLUS";
  }, [current, t, visibleNav]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  // Classes para nav button padronizado
  const navBtnBase = "flex items-center gap-[12px] p-[14px] md:p-[12px_14px] rounded-[14px] border-none cursor-pointer w-full text-left font-sans text-[14px] md:text-[13px] min-h-[48px] md:min-h-[44px] transition-all duration-150";

  const navigationPanel = (
    <>
      <div className="px-[20px] pb-[20px] border-b border-white/5">
        <div className="w-[56px] h-[56px] rounded-full bg-white grid place-items-center mb-[12px] p-[8px] shadow-[0_4px_12px_rgba(0,0,0,.2)]">
          <Image src="/logo.png" alt="Pastor Rhema" width={40} height={40} className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center justify-between gap-[12px]">
          <div className="text-white/80 text-[12px] md:text-[11px] font-sans">
            {profile?.full_name || "Pastor"}
          </div>
          <div className={`inline-flex items-center px-[9px] py-[5px] rounded-full text-[11px] md:text-[10px] font-extrabold font-sans ${isPlus ? "bg-brand-gold/20 text-brand-gold" : "bg-white/10 text-white/60"}`}>
            {isPlus ? t("plan_plus") : t("plan_simple")}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-[16px_12px] flex flex-col gap-[6px] overflow-y-auto">
        {visibleNav.map(({ page, key, step }) => {
          const active = current === page;
          return (
            <button
              key={page}
              onClick={() => {
                setMenuOpen(false);
                router.push(`/${page}`);
              }}
              className={`${navBtnBase} ${active ? "bg-white/10 text-white font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,.04)]" : "bg-transparent text-white/70 font-medium hover:bg-white/5"}`}
            >
              <span className="text-[16px]">{NAV_EMOJI[page]}</span>
              <span className="flex-1">{t(key)}</span>
              {step && (
                <span className={`text-[11px] font-extrabold px-[7px] py-[4px] rounded-full ${active ? "bg-brand-gold/30 text-brand-gold" : "bg-white/10 text-white/45"}`}>
                  {step}
                </span>
              )}
            </button>
          );
        })}

        {!isPlus && (
          <div className="mt-auto p-[14px] rounded-[14px] border border-brand-gold/20 bg-brand-gold/10">
            <p className="m-0 mb-[8px] text-brand-gold text-[13px] font-bold font-sans">
              {t("nav_upgrade_title")}
            </p>
            <p className="m-0 mb-[10px] text-white/60 text-[12px] font-sans leading-[1.5]">
              {t("nav_upgrade_desc")}
            </p>
            <button
              onClick={() => window.open("mailto:contato@pastorrhema.com?subject=Upgrade%20para%20Plus", "_blank")}
              className="w-full min-h-[44px] px-[12px] py-[10px] rounded-[12px] border-none bg-gradient-to-br from-brand-gold to-[#b7862d] text-[#1f2937] font-sans text-[13px] font-extrabold cursor-pointer hover:opacity-90"
            >
              {t("nav_upgrade_btn")}
            </button>
          </div>
        )}
      </nav>

      <div className="p-[12px] border-t border-white/5">
        <div className="flex gap-[6px] mb-[10px] justify-center">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code)}
              title={l.label}
              className={`flex-1 min-h-[40px] px-[6px] py-[8px] rounded-[10px] border-none font-sans text-[12px] cursor-pointer transition-colors duration-150 ${lang === l.code ? "bg-white/15 text-white font-bold" : "bg-transparent text-white/50 font-medium hover:bg-white/5"}`}
            >
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>

        <a
          href="mailto:support@pastorrhema.com"
          className={`${navBtnBase} bg-transparent text-white/70 font-medium no-underline hover:bg-white/5`}
        >
          <span>🎧</span>
          <span>{t("nav_support")}</span>
        </a>

        <button
          onClick={() => {
            setMenuOpen(false);
            router.push("/login");
          }}
          className={`${navBtnBase} bg-transparent text-white/70 font-medium hover:bg-white/5`}
        >
          <span>🚪</span>
          <span>{t("nav_signout")}</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="flex min-h-screen">
        
        {/* Sidebar Desktop */}
        <div className="hidden md:flex w-[240px] shrink-0 bg-gradient-to-b from-[#0b2a5b] to-[#0d3268] flex-col py-[24px] sticky top-0 h-screen overflow-hidden">
          {navigationPanel}
        </div>

        {/* Couterúdo Principal */}
        <div className="flex-1 min-w-0">
          
          {/* Header Mobile */}
          <div className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-[12px] p-[12px_16px] bg-[#f4f7fb]/95 backdrop-blur-[10px] border-b border-brand-line">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              className="w-[44px] h-[44px] rounded-[12px] border border-brand-line bg-white text-[20px] text-brand-primary cursor-pointer flex items-center justify-center"
            >
              ☰
            </button>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[11px] text-brand-muted font-sans">
                Pastor Rhema PLUS
              </p>
              <p className="m-[2px_0_0] text-[15px] text-brand-primary font-sans font-extrabold whitespace-nowrap overflow-hidden text-ellipsis">
                {currentLabel}
              </p>
            </div>
            <div className="w-[44px] h-[44px] rounded-[12px] bg-gradient-to-br from-[#0b2a5b] to-[#163d7a] text-white grid place-items-center text-[14px] font-bold font-sans">
              {(profile?.full_name || "P").slice(0, 1).toUpperCase()}
            </div>
          </div>

          {/* Drawer Overlay */}
          {menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            />
          )}

          {/* Sidebar Mobile */}
          <div className={`md:hidden fixed top-0 left-0 bottom-0 w-[min(88vw,320px)] z-50 bg-gradient-to-b from-[#0b2a5b] to-[#0d3268] flex flex-col pt-[20px] pb-[12px] transition-transform duration-200 shadow-[0_18px_50px_rgba(15,23,42,.35)] ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex justify-end px-[16px] pb-[10px]">
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
                className="w-[40px] h-[40px] rounded-[12px] border border-white/10 bg-white/10 text-white cursor-pointer text-[18px] flex items-center justify-center hover:bg-white/20"
              >
                ×
              </button>
            </div>
            {navigationPanel}
          </div>

          {/* Wrapper Filhos */}
          <div className="p-[16px] md:p-[28px] overflow-y-auto">
            <div className="max-w-[1100px] mx-auto">
              {needsUpgrade ? <UpgradeWall router={router} t={t} /> : children}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
