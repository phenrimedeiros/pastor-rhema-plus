"use client";

import { useRouter, usePathname } from "next/navigation";
import { T } from "@/lib/tokens";

const NAV = [
  { page: "dashboard",     emoji: "🏠", label: "Dashboard",        plan: "plus" },
  { page: "series",        emoji: "📚", label: "Series Plan",       plan: "plus", step: 1 },
  { page: "study",         emoji: "🧠", label: "Study & Context",   plan: "plus", step: 2 },
  { page: "builder",       emoji: "🛠",  label: "Sermon Structure",  plan: "plus", step: 3 },
  { page: "illustrations", emoji: "💡", label: "Illustrations",      plan: "plus", step: 4 },
  { page: "application",   emoji: "🎯", label: "Applications",       plan: "plus", step: 5 },
  { page: "final",         emoji: "✅", label: "Final Sermon",       plan: "plus" },
  { page: "chat",          emoji: "💬", label: "Pastor Rhema",       plan: "simple" },
];

// Pages that require the Plus plan
const PLUS_PAGES = new Set(["dashboard", "series", "study", "builder", "illustrations", "application", "final"]);

function UpgradeWall({ router }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      minHeight: "60vh",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "20px", margin: "0 auto 20px",
          background: `linear-gradient(135deg, ${T.primary}, #163d7a)`,
          display: "grid", placeItems: "center", fontSize: "32px",
        }}>🔒</div>
        <h2 style={{ margin: "0 0 10px", fontFamily: T.font, color: T.primary, fontSize: "26px" }}>
          Recurso Plus
        </h2>
        <p style={{ margin: "0 0 24px", color: T.muted, fontFamily: T.fontSans, lineHeight: 1.7, fontSize: "15px" }}>
          O fluxo completo de preparo de sermões — séries, estudo, estrutura, ilustrações e aplicações — está disponível no plano <strong>Rhema Plus</strong>.
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
            Usar Pastor Rhema Chat
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
            Fazer Upgrade →
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

  const plan = profile?.plan || "simple";
  const isPlus = plan === "plus";

  // Simple users only see the chat item
  const visibleNav = isPlus ? NAV : NAV.filter(n => n.plan === "simple");

  // Show upgrade wall if Simple user tries to access a Plus page
  const needsUpgrade = !isPlus && PLUS_PAGES.has(current);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg }}>
      {/* Sidebar */}
      <div style={{
        width: 240, flexShrink: 0,
        background: "linear-gradient(180deg, #0b2a5b 0%, #0d3268 100%)",
        display: "flex", flexDirection: "column",
        padding: "24px 0",
        position: "sticky", top: 0, height: "100vh",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 20px 20px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#fff",
            display: "grid", placeItems: "center",
            marginBottom: "10px",
            padding: "8px", boxSizing: "border-box",
            boxShadow: "0 4px 12px rgba(0,0,0,.2)",
          }}>
            <img src="/logo.png" alt="Pastor Rhema" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: "11px", fontFamily: T.fontSans }}>
              {profile?.full_name || "Pastor"}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center",
              padding: "3px 8px", borderRadius: "999px",
              background: isPlus ? "rgba(202,161,74,.2)" : "rgba(255,255,255,.08)",
              color: isPlus ? T.gold : "rgba(255,255,255,.45)",
              fontSize: "10px", fontWeight: 800, fontFamily: T.fontSans,
            }}>
              {isPlus ? "✦ PLUS" : "SIMPLE"}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {visibleNav.map(({ page, emoji, label, step }) => {
            const active = current === page;
            return (
              <button
                key={page}
                onClick={() => router.push(`/${page}`)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "12px", border: "none",
                  background: active ? "rgba(255,255,255,.12)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,.55)",
                  cursor: "pointer", width: "100%", textAlign: "left",
                  fontFamily: T.fontSans, fontSize: "13px", fontWeight: active ? 700 : 500,
                  transition: ".12s ease",
                }}
              >
                <span style={{ fontSize: "15px" }}>{emoji}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {step && (
                  <span style={{
                    fontSize: "10px", fontWeight: 800, padding: "3px 6px", borderRadius: "999px",
                    background: active ? "rgba(202,161,74,.3)" : "rgba(255,255,255,.08)",
                    color: active ? T.gold : "rgba(255,255,255,.35)",
                  }}>{step}</span>
                )}
              </button>
            );
          })}

          {/* Upgrade CTA for Simple users */}
          {!isPlus && (
            <div style={{
              marginTop: "auto", padding: "12px",
              borderRadius: "14px", border: "1px solid rgba(202,161,74,.25)",
              background: "rgba(202,161,74,.08)",
            }}>
              <p style={{
                margin: "0 0 8px", color: T.gold, fontSize: "12px",
                fontWeight: 700, fontFamily: T.fontSans,
              }}>Upgrade para Plus</p>
              <p style={{
                margin: "0 0 10px", color: "rgba(255,255,255,.5)", fontSize: "11px",
                fontFamily: T.fontSans, lineHeight: 1.5,
              }}>
                Acesse séries, estudo bíblico, estrutura de sermão e muito mais.
              </p>
              <button
                onClick={() => window.open("mailto:contato@pastorrhema.com?subject=Upgrade%20para%20Plus", "_blank")}
                style={{
                  width: "100%", padding: "8px", borderRadius: "10px", border: "none",
                  background: `linear-gradient(135deg, ${T.gold}, #b7862d)`,
                  color: "#1f2937", fontFamily: T.fontSans, fontSize: "12px",
                  fontWeight: 800, cursor: "pointer",
                }}
              >
                Ver planos →
              </button>
            </div>
          )}
        </nav>

        {/* Sign out */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <button
            onClick={() => router.push("/login")}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", borderRadius: "12px", border: "none",
              background: "transparent", color: "rgba(255,255,255,.45)",
              cursor: "pointer", width: "100%", textAlign: "left",
              fontFamily: T.fontSans, fontSize: "13px", fontWeight: 500,
            }}
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {needsUpgrade ? <UpgradeWall router={router} /> : children}
        </div>
      </div>
    </div>
  );
}
