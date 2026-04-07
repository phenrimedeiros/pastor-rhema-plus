"use client";

import { useRouter, usePathname } from "next/navigation";
import { T } from "@/lib/tokens";

const NAV = [
  { page: "dashboard", emoji: "🏠", label: "Dashboard" },
  { page: "series",    emoji: "📚", label: "Series Plan",      step: 1 },
  { page: "study",     emoji: "🧠", label: "Study & Context",  step: 2 },
  { page: "builder",   emoji: "🛠",  label: "Sermon Structure", step: 3 },
  { page: "illustrations", emoji: "💡", label: "Illustrations", step: 4 },
  { page: "application",  emoji: "🎯", label: "Applications",  step: 5 },
  { page: "final",     emoji: "✅", label: "Final Sermon" },
];

export default function AppLayout({ children, profile }) {
  const router = useRouter();
  const pathname = usePathname();
  const current = pathname.replace("/", "") || "dashboard";

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
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "10px",
              background: `linear-gradient(135deg, ${T.gold}, #b7862d)`,
              display: "grid", placeItems: "center",
              color: "#1f2937", fontSize: "16px", fontWeight: 900,
            }}>R</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "14px", fontFamily: T.fontSans }}>
                Rhema PLUS
              </div>
              <div style={{ color: "rgba(255,255,255,.5)", fontSize: "11px", fontFamily: T.fontSans }}>
                {profile?.full_name || "Pastor"}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {NAV.map(({ page, emoji, label, step }) => {
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
          {children}
        </div>
      </div>
    </div>
  );
}
