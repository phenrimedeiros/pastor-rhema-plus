"use client";

import { useState } from "react";
import Image from "next/image";
import { auth, supabase } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import { T } from "@/lib/tokens";
import { useLanguage, LANGUAGES } from "@/lib/i18n";
import { useIsMobile } from "@/lib/useIsMobile";

export default function LoginPage() {
  const isMobile = useIsMobile();
  const HOTMART_URL = "https://pay.hotmart.com/W103907822M?checkoutMode=10";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { lang, changeLang, t } = useLanguage();

  const resetState = () => { setError(""); setSuccess(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetState();

    try {
      if (isForgot) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://app.pastorrhema.com";
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl}/reset-password`,
        });
        setSuccess(t("login_forgot_sent"));
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
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(160deg, #0b2a5b 0%, #0d3268 100%)",
      fontFamily: T.fontSans,
      padding: isMobile ? "16px" : "20px",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{
            width: isMobile ? 96 : 120, height: isMobile ? 96 : 120, borderRadius: "50%",
            background: "#fff",
            display: "grid", placeItems: "center",
            margin: "0 auto 16px",
            boxShadow: "0 8px 32px rgba(0,0,0,.2)",
            padding: "14px",
            boxSizing: "border-box",
            overflow: "hidden",
          }}>
            <Image src="/logo.png" alt="Pastor Rhema" width={96} height={96} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,.45)" }}>
            {t("login_signin_subtitle")}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "#fff",
          borderRadius: "20px",
          padding: isMobile ? "22px 18px" : "28px",
          boxShadow: "0 24px 64px rgba(0,0,0,.25)",
        }}>
          <h2 style={{ margin: "0 0 6px", fontFamily: T.font, fontSize: "20px", fontWeight: 800, color: T.primary }}>
            {isForgot ? t("login_forgot_title") : t("login_signin_title")}
          </h2>
          {isForgot && (
            <p style={{ margin: "0 0 18px", fontSize: "13px", color: T.muted, lineHeight: 1.6 }}>
              {t("login_forgot_subtitle")}
            </p>
          )}
          {!isForgot && <div style={{ marginBottom: "20px" }} />}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <label style={labelStyle}>
              {t("login_email")}
              <input
                type="email"
                placeholder={t("login_email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                style={inputStyle}
              />
            </label>

            {!isForgot && (
              <label style={labelStyle}>
                {t("login_password")}
                <input
                  type="password"
                  placeholder={t("login_password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  style={inputStyle}
                />
              </label>
            )}

            {!isForgot && (
              <div style={{ textAlign: "right", marginTop: "-6px" }}>
                <button
                  type="button"
                  onClick={() => { setIsForgot(true); resetState(); }}
                  style={{ background: "none", border: "none", padding: 0, color: T.primary, fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: T.fontSans }}
                >
                  {t("login_forgot")}
                </button>
              </div>
            )}

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
                marginTop: "4px", minHeight: 46, padding: "13px",
                background: `linear-gradient(135deg, ${T.primary}, #163d7a)`,
                color: "#fff", border: "none", borderRadius: "12px",
                fontSize: "14px", fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: T.fontSans, opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? t("login_loading") : isForgot ? t("login_forgot_btn") : t("login_signin_btn")}
            </button>
          </form>

          <div style={{ marginTop: "18px", paddingTop: "20px", borderTop: `1px solid ${T.line}`, textAlign: "center" }}>
            {isForgot ? (
              <button
                type="button"
                onClick={() => { setIsForgot(false); resetState(); }}
                style={{ background: "none", border: "none", padding: 0, color: T.primary, fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: T.fontSans }}
              >
                ← {t("login_back")}
              </button>
            ) : (
              <>
                <span style={{ fontSize: "13px", color: T.muted }}>
                  {t("login_no_access")}
                </span>
                <a
                  href={HOTMART_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: T.primary, fontWeight: 700, fontSize: "13px", fontFamily: T.fontSans, textDecoration: "none" }}
                >
                  {t("login_get_access")}
                </a>
              </>
            )}
          </div>

          <p style={{ marginTop: "16px", textAlign: "center", fontSize: "12px", color: T.muted, lineHeight: 1.6 }}>
            {t("login_security")}
          </p>
        </div>
      </div>

      {/* Language switcher — rodapé */}
      <div style={{ display: "flex", gap: "4px", justifyContent: "center", marginTop: "24px", flexWrap: "wrap" }}>
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => changeLang(l.code)}
            style={{
              minHeight: 28, padding: "4px 8px", borderRadius: "6px", border: "none",
              background: lang === l.code ? "rgba(255,255,255,.15)" : "transparent",
              color: lang === l.code ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.3)",
              fontFamily: T.fontSans, fontSize: "10px", fontWeight: lang === l.code ? 700 : 400,
              cursor: "pointer",
            }}
          >
            {l.flag} {l.code.toUpperCase()}
          </button>
        ))}
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
  marginTop: "6px",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  fontSize: "13px",
  fontWeight: 700,
  color: T.text,
};
