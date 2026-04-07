"use client";

import { useState } from "react";
import { auth } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import { T } from "@/lib/tokens";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError("Por favor, insira seu nome.");
          setLoading(false);
          return;
        }
        await auth.signUp(email, password, fullName);
        setSuccess("Verifique seu email para confirmar o cadastro.");
      } else {
        await auth.signIn(email, password);
        setSuccess("Login realizado! Redirecionando...");
        setTimeout(() => router.push("/dashboard"), 1200);
      }
    } catch (err) {
      if (err.message.includes("Invalid login credentials")) {
        setError("Email ou senha incorretos.");
      } else if (err.message.includes("User already registered")) {
        setError("Este email já está cadastrado. Faça login.");
      } else {
        setError(err.message || "Erro ao processar requisição.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      fontFamily: T.fontSans,
    }}>

      {/* ── Left panel — Branding ── */}
      <div style={{
        background: "linear-gradient(160deg, #0b2a5b 0%, #0d3268 60%, #112e6e 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 56px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative glow */}
        <div style={{
          position: "absolute", bottom: -80, right: -80,
          width: 360, height: 360,
          background: "radial-gradient(circle, rgba(202,161,74,.18), transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: -60, left: -60,
          width: 240, height: 240,
          background: "radial-gradient(circle, rgba(202,161,74,.08), transparent 65%)",
          pointerEvents: "none",
        }} />

        {/* Logo mark */}
        <div style={{ position: "relative", zIndex: 1, marginBottom: "40px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "20px",
            background: `linear-gradient(135deg, ${T.gold}, #b7862d)`,
            display: "grid", placeItems: "center",
            marginBottom: "20px",
            boxShadow: "0 8px 32px rgba(202,161,74,.35)",
          }}>
            <span style={{
              fontFamily: T.font,
              fontSize: "36px", fontWeight: 900,
              color: "#0b2a5b", lineHeight: 1,
            }}>R</span>
          </div>

          <h1 style={{
            margin: "0 0 6px",
            fontFamily: T.font,
            fontSize: "32px", fontWeight: 800,
            color: "#fff", letterSpacing: "-.02em", lineHeight: 1.1,
          }}>
            Pastor Rhema
          </h1>
          <p style={{
            margin: "0 0 4px",
            fontSize: "13px", fontWeight: 700,
            color: T.gold, letterSpacing: ".08em", textTransform: "uppercase",
          }}>
            PLUS
          </p>
          <p style={{
            margin: "16px 0 0",
            fontSize: "16px", color: "rgba(255,255,255,.72)",
            lineHeight: 1.7, maxWidth: 340,
          }}>
            Seu assistente de IA para preparar sermões impactantes com profundidade bíblica e estrutura pastoral.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ position: "relative", zIndex: 1, display: "grid", gap: "16px" }}>
          {[
            { icon: "💬", title: "Pastor Rhema Chat", desc: "Converse sobre qualquer passagem ou tema bíblico" },
            { icon: "📚", title: "Série de Sermões", desc: "Planeje séries completas com IA em minutos" },
            { icon: "🛠", title: "Estrutura de Sermão", desc: "Do texto ao esboço pronto para pregar" },
            { icon: "🎯", title: "Aplicações Práticas", desc: "Ajude sua congregação a viver a Palavra" },
          ].map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: "14px",
              padding: "14px 16px", borderRadius: "16px",
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.08)",
            }}>
              <span style={{ fontSize: "20px", lineHeight: 1, marginTop: "1px" }}>{f.icon}</span>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 700, color: "#fff" }}>{f.title}</p>
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,.5)", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — Form ── */}
      <div style={{
        background: T.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Form header */}
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{
              margin: "0 0 6px",
              fontFamily: T.font,
              fontSize: "26px", fontWeight: 800,
              color: T.primary,
            }}>
              {isSignUp ? "Criar sua conta" : "Entrar na sua conta"}
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: T.muted }}>
              {isSignUp
                ? "Comece a preparar sermões melhores hoje."
                : "Bem-vindo de volta, pastor."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {isSignUp && (
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: ".04em" }}>
                  Seu nome
                </label>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: ".04em" }}>
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: ".04em" }}>
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                padding: "12px 14px", borderRadius: "12px",
                background: "#fef2f2", border: "1px solid #fecaca",
                color: "#b91c1c", fontSize: "13px",
              }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{
                padding: "12px 14px", borderRadius: "12px",
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                color: "#166534", fontSize: "13px",
              }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "4px",
                padding: "14px",
                background: loading
                  ? "rgba(11,42,91,.5)"
                  : `linear-gradient(135deg, ${T.primary}, #163d7a)`,
                color: "#fff", border: "none",
                borderRadius: "14px", fontSize: "15px",
                fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: T.fontSans,
                transition: "opacity .15s",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Aguardando..." : isSignUp ? "Criar Conta" : "Entrar"}
            </button>
          </form>

          {/* Toggle sign in / sign up */}
          <div style={{
            marginTop: "24px", paddingTop: "20px",
            borderTop: `1px solid ${T.line}`,
            textAlign: "center",
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: T.muted }}>
              {isSignUp ? "Já tem uma conta? " : "Não tem conta ainda? "}
              <button
                type="button"
                disabled={loading}
                onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccess(""); }}
                style={{
                  background: "none", border: "none",
                  color: T.primary, fontWeight: 700,
                  fontSize: "13px", cursor: "pointer",
                  fontFamily: T.fontSans,
                }}
              >
                {isSignUp ? "Faça login" : "Crie uma agora"}
              </button>
            </p>
          </div>

          <p style={{
            marginTop: "20px", textAlign: "center",
            fontSize: "12px", color: T.muted, lineHeight: 1.6,
          }}>
            🔒 Seus dados são protegidos com criptografia Supabase.
          </p>
        </div>
      </div>

      {/* Mobile: stack columns */}
      <style>{`
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 14px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "12px", fontSize: "14px",
  fontFamily: "DM Sans, sans-serif",
  outline: "none", background: "#fff",
  color: "#1f2937", boxSizing: "border-box",
  transition: "border-color .15s",
};
