"use client";

import { useState } from "react";
import { auth } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import { T } from "@/lib/tokens";
import { useLanguage, LANGUAGES } from "@/lib/i18n";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { lang, changeLang, t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        if (!fullName.trim()) { setError(t("login_err_name")); setLoading(false); return; }
        await auth.signUp(email, password, fullName);
        setSuccess(t("login_check_email"));
      } else {
        await auth.signIn(email, password);
        setSuccess(t("login_redirecting"));
        setTimeout(() => router.push("/dashboard"), 1200);
      }
    } catch (err) {
      if (err.message.includes("Invalid login credentials")) setError(t("login_err_credentials"));
      else if (err.message.includes("User already registered")) setError(t("login_err_registered"));
      else setError(err.message || "Erro ao processar.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(160deg, #0b2a5b 0%, #0d3268 100%)",
      fontFamily: T.fontSans,
      padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Language switcher */}
        <div style={{ display: "flex", gap: "6px", justifyContent: "center", marginBottom: "20px" }}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => changeLang(l.code)}
              style={{
                padding: "5px 12px", borderRadius: "8px", border: "none",
                background: lang === l.code ? "rgba(255,255,255,.2)" : "transparent",
                color: lang === l.code ? "#fff" : "rgba(255,255,255,.4)",
                fontFamily: T.fontSans, fontSize: "12px", fontWeight: lang === l.code ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {l.flag} {l.code.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            background: "#fff",
            display: "grid", placeItems: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,.2)",
            padding: "14px",
            boxSizing: "border-box",
          }}>
            <img src="/logo.png" alt="Pastor Rhema" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,.45)" }}>
            {isSignUp ? t("login_signup_subtitle") : t("login_signin_subtitle")}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 24px 64px rgba(0,0,0,.25)",
        }}>
          <h2 style={{ margin: "0 0 20px", fontFamily: T.font, fontSize: "20px", fontWeight: 800, color: T.primary }}>
            {isSignUp ? t("login_signup_title") : t("login_signin_title")}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {isSignUp && (
              <input
                type="text"
                placeholder={t("login_name_ph")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                style={inputStyle}
              />
            )}

            <input
              type="email"
              placeholder={t("login_email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={inputStyle}
            />

            <input
              type="password"
              placeholder={t("login_password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={inputStyle}
            />

            {error && (
              <p style={{ margin: 0, fontSize: "13px", color: "#b91c1c", textAlign: "center" }}>{error}</p>
            )}
            {success && (
              <p style={{ margin: 0, fontSize: "13px", color: "#166534", textAlign: "center" }}>{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "4px", padding: "13px",
                background: `linear-gradient(135deg, ${T.primary}, #163d7a)`,
                color: "#fff", border: "none", borderRadius: "12px",
                fontSize: "14px", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: T.fontSans, opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? t("login_loading") : isSignUp ? t("login_signup_btn") : t("login_signin_btn")}
            </button>
          </form>

          <div style={{ marginTop: "18px", paddingTop: "20px", borderTop: `1px solid ${T.line}`, textAlign: "center" }}>
            <span style={{ fontSize: "13px", color: T.muted }}>
              {isSignUp ? t("login_have_account") : t("login_no_account")}
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); }}
              style={{
                background: "none", border: "none", padding: 0,
                color: T.primary, fontWeight: 700, fontSize: "13px",
                cursor: "pointer", fontFamily: T.fontSans,
              }}
            >
              {isSignUp ? t("login_goto_signin") : t("login_goto_signup")}
            </button>
          </div>

          <p style={{ marginTop: "16px", textAlign: "center", fontSize: "12px", color: T.muted, lineHeight: 1.6 }}>
            {t("login_security")}
          </p>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 14px",
  border: "1.5px solid #e5e7eb", borderRadius: "12px",
  fontSize: "14px", fontFamily: "DM Sans, sans-serif",
  outline: "none", background: "#fff", color: "#1f2937",
  boxSizing: "border-box",
};
