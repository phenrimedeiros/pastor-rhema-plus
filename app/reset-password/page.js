"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase_client";
import { T } from "@/lib/tokens";
import { useLanguage } from "@/lib/i18n";
import { useIsMobile } from "@/lib/useIsMobile";
import Image from "next/image";

export default function ResetPasswordPage() {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ready, setReady] = useState(false);

  // Supabase puts the session in the URL hash after the user clicks the reset link.
  // onAuthStateChange picks it up automatically.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    // If the session is already set (e.g. page reload), check immediately
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setReady(true);
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError(t("reset_err_short")); return; }
    if (password !== confirm) { setError(t("reset_err_match")); return; }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      setSuccess(t("reset_success"));
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
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
          }}>
            <Image src="/logo.png" alt="Pastor Rhema" width={96} height={96} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        </div>

        <div style={{
          background: "#fff",
          borderRadius: "20px",
          padding: isMobile ? "22px 18px" : "28px",
          boxShadow: "0 24px 64px rgba(0,0,0,.25)",
        }}>
          <h2 style={{ margin: "0 0 6px", fontFamily: T.font, fontSize: "20px", fontWeight: 800, color: T.primary }}>
            {t("reset_title")}
          </h2>
          <p style={{ margin: "0 0 20px", fontSize: "13px", color: T.muted, lineHeight: 1.6 }}>
            {t("reset_subtitle")}
          </p>

          {!ready ? (
            <p style={{ textAlign: "center", color: T.muted, fontSize: "14px" }}>
              Validando link...
            </p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <label style={labelStyle}>
                {t("reset_new_pass")}
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                {t("reset_confirm_pass")}
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading}
                  required
                  style={inputStyle}
                />
              </label>

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
                {loading ? t("reset_loading") : t("reset_btn")}
              </button>
            </form>
          )}
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
