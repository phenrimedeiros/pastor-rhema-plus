"use client";

import { T } from "@/lib/tokens";

export function Btn({ children, variant = "primary", onClick, style, disabled, type = "button" }) {
  const base = {
    border: "none",
    borderRadius: T.radiusSm,
    padding: "13px 18px",
    fontWeight: 800,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: T.fontSans,
    fontSize: "14px",
    transition: ".15s ease",
    opacity: disabled ? 0.5 : 1,
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  };
  const variants = {
    primary: {
      background: `linear-gradient(180deg, ${T.green} 0%, ${T.greenDark} 100%)`,
      color: "#fff",
      boxShadow: T.shadow,
    },
    secondary: {
      background: T.surface,
      color: T.primary,
      border: `1px solid ${T.line}`,
      boxShadow: "none",
    },
    hero: {
      background: `linear-gradient(180deg, ${T.gold} 0%, #b7862d 100%)`,
      color: "#1f2937",
      fontWeight: 900,
      boxShadow: T.shadow,
    },
    ghost: {
      background: "rgba(255,255,255,.10)",
      color: "#fff",
      border: "1px solid rgba(255,255,255,.18)",
      boxShadow: "none",
    },
  };
  return (
    <button
      type={type}
      style={{ ...base, ...variants[variant], ...style }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.line}`,
        borderRadius: "24px",
        boxShadow: T.shadow,
        padding: "22px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Notice({ children, color = "blue" }) {
  const colors = {
    blue: { bg: T.blueSoft, color: T.primary },
    green: { bg: T.greenSoft, color: "#166534" },
    gold: { bg: "rgba(202,161,74,.16)", color: "#6b4e13" },
    red: { bg: T.redSoft, color: "#991b1b" },
  };
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: T.radiusSm,
        fontSize: "13px",
        lineHeight: 1.55,
        fontWeight: 600,
        marginBottom: "14px",
        background: colors[color].bg,
        color: colors[color].color,
        fontFamily: T.fontSans,
      }}
    >
      {children}
    </div>
  );
}

export function Pill({ children, style }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 10px",
        borderRadius: "999px",
        background: T.blueSoft,
        color: T.primary,
        fontSize: "12px",
        fontWeight: 800,
        whiteSpace: "nowrap",
        fontFamily: T.fontSans,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Loader({ text = "Generating..." }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: `3px solid ${T.line}`,
          borderTopColor: T.gold,
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <span style={{ color: T.muted, fontSize: "14px", fontWeight: 600, fontFamily: T.fontSans }}>
        {text}
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: "8px" }}>
      <label
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "#334155",
          fontFamily: T.fontSans,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
