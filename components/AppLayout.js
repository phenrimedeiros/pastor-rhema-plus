"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { T } from "@/lib/tokens";
import { useLanguage, LANGUAGES } from "@/lib/i18n";
import { useIsMobile } from "@/lib/useIsMobile";

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "20px", margin: "0 auto 20px",
          background: `linear-gradient(135deg, ${T.primary}, #163d7a)`,
          display: "grid", placeItems: "center", fontSize: "32px",
        }}>🔒</div>
        <h2 style={{ margin: "0 0 10px", fontFamily: T.font, color: T.primary, fontSize: "26px" }}>
          {t("upgrade_title")}
        </h2>
        <p style={{ margin: "0 0 24px", color: T.muted, fontFamily: T.fontSans, lineHeight: 1.7, fontSize: "15px" }}>
          {t("upgrade_desc")}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => router.push("/chat")}
            style={{
              padding: "12px 24px", borderRadius: "14px", border: "none",
              background: `linear-gradient(135deg, ${T.primary}, #163d7a)`,
              color: "#fff", fontFamily: T.fontSans, fontSize: "14px",
              fontWeight: 700, cursor: "pointer",
            }}
          >
            {t("upgrade_chat_btn")}
          </button>
          <button
            onClick={() => window.open("mailto:contato@pastorrhema.com?subject=Upgrade%20para%20Plus", "_blank")}
            style={{
              padding: "12px 24px", borderRadius: "14px",
              border: `1.5px solid ${T.line}`,
              background: "#fff", color: T.primary, fontFamily: T.fontSans,
              fontSize: "14px", fontWeight: 700, cursor: "pointer",
            }}
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
  const isMobile = useIsMobile();
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
    if (!isMobile || !menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, menuOpen]);

  const navButtonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: isMobile ? "14px 14px" : "12px 14px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    fontFamily: T.fontSans,
    fontSize: isMobile ? "14px" : "13px",
    minHeight: isMobile ? 48 : 44,
    transition: ".12s ease",
  };

  const navigationPanel = (
    <>
      <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#fff",
          display: "grid", placeItems: "center",
          marginBottom: "12px",
          padding: "8px", boxSizing: "border-box",
          boxShadow: "0 4px 12px rgba(0,0,0,.2)",
        }}>
          <Image src="/logo.png" alt="Pastor Rhema" width={40} height={40} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ color: "rgba(255,255,255,.78)", fontSize: isMobile ? "12px" : "11px", fontFamily: T.fontSans }}>
            {profile?.full_name || "Pastor"}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center",
            padding: "5px 9px", borderRadius: "999px",
            background: isPlus ? "rgba(202,161,74,.2)" : "rgba(255,255,255,.08)",
            color: isPlus ? T.gold : "rgba(255,255,255,.6)",
            fontSize: isMobile ? "11px" : "10px", fontWeight: 800, fontFamily: T.fontSans,
          }}>
            {isPlus ? t("plan_plus") : t("plan_simple")}
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto" }}>
        {visibleNav.map(({ page, key, step }) => {
          const active = current === page;
          return (
            <button
              key={page}
              onClick={() => {
                setMenuOpen(false);
                router.push(`/${page}`);
              }}
              style={{
                ...navButtonStyle,
                background: active ? "rgba(255,255,255,.12)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,.72)",
                fontWeight: active ? 700 : 500,
                boxShadow: active ? "inset 0 0 0 1px rgba(255,255,255,.04)" : "none",
              }}
            >
              <span style={{ fontSize: "16px" }}>{NAV_EMOJI[page]}</span>
              <span style={{ flex: 1 }}>{t(key)}</span>
              {step && (
                <span style={{
                  fontSize: "11px", fontWeight: 800, padding: "4px 7px", borderRadius: "999px",
                  background: active ? "rgba(202,161,74,.3)" : "rgba(255,255,255,.08)",
                  color: active ? T.gold : "rgba(255,255,255,.45)",
                }}>{step}</span>
              )}
            </button>
          );
        })}

        {!isPlus && (
          <div style={{
            marginTop: "auto", padding: "14px",
            borderRadius: "14px", border: "1px solid rgba(202,161,74,.25)",
            background: "rgba(202,161,74,.08)",
          }}>
            <p style={{ margin: "0 0 8px", color: T.gold, fontSize: "13px", fontWeight: 700, fontFamily: T.fontSans }}>
              {t("nav_upgrade_title")}
            </p>
            <p style={{ margin: "0 0 10px", color: "rgba(255,255,255,.62)", fontSize: "12px", fontFamily: T.fontSans, lineHeight: 1.5 }}>
              {t("nav_upgrade_desc")}
            </p>
            <button
              onClick={() => window.open("mailto:contato@pastorrhema.com?subject=Upgrade%20para%20Plus", "_blank")}
              style={{
                width: "100%", minHeight: 44, padding: "10px 12px", borderRadius: "12px", border: "none",
                background: `linear-gradient(135deg, ${T.gold}, #b7862d)`,
                color: "#1f2937", fontFamily: T.fontSans, fontSize: "13px",
                fontWeight: 800, cursor: "pointer",
              }}
            >
              {t("nav_upgrade_btn")}
            </button>
          </div>
        )}
      </nav>

      <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px", justifyContent: "center" }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code)}
              title={l.label}
              style={{
                flex: 1, minHeight: 40, padding: "8px 6px", borderRadius: "10px", border: "none",
                background: lang === l.code ? "rgba(255,255,255,.15)" : "transparent",
                color: lang === l.code ? "#fff" : "rgba(255,255,255,.5)",
                fontFamily: T.fontSans, fontSize: "12px", fontWeight: lang === l.code ? 700 : 500,
                cursor: "pointer", transition: ".12s ease",
              }}
            >
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setMenuOpen(false);
            router.push("/login");
          }}
          style={{
            ...navButtonStyle,
            background: "transparent",
            color: "rgba(255,255,255,.7)",
            fontWeight: 500,
          }}
        >
          <span>🚪</span>
          <span>{t("nav_signout")}</span>
        </button>
      </div>
    </>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg }}>
      <div style={{ display: "flex", minHeight: isMobile ? "100vh" : "100vh", background: T.bg }}>
        {!isMobile && (
          <div style={{
            width: 240, flexShrink: 0,
            background: "linear-gradient(180deg, #0b2a5b 0%, #0d3268 100%)",
            display: "flex", flexDirection: "column",
            padding: "24px 0",
            position: "sticky", top: 0, height: "100vh",
          }}>
            {navigationPanel}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {isMobile && (
            <>
              <div style={{
                position: "sticky",
                top: 0,
                zIndex: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "12px 16px",
                background: "rgba(244,247,251,.96)",
                backdropFilter: "blur(10px)",
                borderBottom: `1px solid ${T.line}`,
              }}>
                <button
                  onClick={() => setMenuOpen(true)}
                  aria-label="Abrir menu"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    border: `1px solid ${T.line}`,
                    background: "#fff",
                    fontSize: "20px",
                    color: T.primary,
                    cursor: "pointer",
                  }}
                >
                  ☰
                </button>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: "11px", color: T.muted, fontFamily: T.fontSans }}>
                    Pastor Rhema PLUS
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "15px", color: T.primary, fontFamily: T.fontSans, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {currentLabel}
                  </p>
                </div>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0b2a5b, #163d7a)",
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: T.fontSans,
                }}>
                  {(profile?.full_name || "P").slice(0, 1).toUpperCase()}
                </div>
              </div>

              {menuOpen && (
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 40,
                    background: "rgba(15,23,42,.42)",
                  }}
                />
              )}

              <div style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "min(88vw, 320px)",
                zIndex: 50,
                background: "linear-gradient(180deg, #0b2a5b 0%, #0d3268 100%)",
                display: "flex",
                flexDirection: "column",
                padding: "20px 0 12px",
                transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
                transition: "transform .22s ease",
                boxShadow: "0 18px 50px rgba(15,23,42,.35)",
              }}>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 16px 10px" }}>
                  <button
                    onClick={() => setMenuOpen(false)}
                    aria-label="Fechar menu"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,.12)",
                      background: "rgba(255,255,255,.08)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: "18px",
                    }}
                  >
                    ×
                  </button>
                </div>
                {navigationPanel}
              </div>
            </>
          )}

          <div style={{ padding: isMobile ? "16px" : "28px", overflowY: "auto" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              {needsUpgrade ? <UpgradeWall router={router} t={t} /> : children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
