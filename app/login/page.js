"use client";

import { useState } from "react";
import { auth } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

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
        setSuccess(
          "Verifique seu email para confirmar o cadastro. Você será redirecionado em breve..."
        );
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        await auth.signIn(email, password);
        setSuccess("Login realizado com sucesso! Redirecionando...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err) {
      if (err.message.includes("Invalid login credentials")) {
        setError("Email ou senha incorretos.");
      } else if (err.message.includes("User already registered")) {
        setError("Este email já está cadastrado. Faça login para continuar.");
      } else {
        setError(err.message || "Erro ao processar requisição.");
      }
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Pastor Rhema PLUS</h1>
          <p>Sua IA para preparar sermões impactantes</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignUp && (
            <div className={styles.formGroup}>
              <label htmlFor="fullName">Seu Nome</label>
              <input
                id="fullName"
                type="text"
                placeholder="Digite seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading
              ? "Aguardando..."
              : isSignUp
                ? "Criar Conta"
                : "Entrar"}
          </button>
        </form>

        <div className={styles.toggle}>
          <p>
            {isSignUp ? "Já tem uma conta? " : "Não tem conta ainda? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
              }}
              className={styles.toggleButton}
              disabled={loading}
            >
              {isSignUp ? "Faça login" : "Crie uma agora"}
            </button>
          </p>
        </div>

        <div className={styles.info}>
          <p>🔒 Seus dados são seguros. Usamos Supabase para autenticação.</p>
        </div>
      </div>
    </div>
  );
}
