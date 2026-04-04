"use client";

import { useEffect, useState } from "react";
import { auth, loadFullState } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

// Placeholder para o componente principal do app
function AppDashboard({ estado, logout }) {
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Pastor Rhema PLUS</h1>
        <button onClick={logout} className={styles.logoutBtn}>
          Sair
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <h2>👋 Bem-vindo!</h2>
          <p>
            O dashboard do seu app será renderizado aqui. Integre seus
            componentes React conforme necessário.
          </p>

          {estado?.profile && (
            <div className={styles.profileInfo}>
              <h3>Suas Estatísticas</h3>
              <ul>
                <li>
                  <strong>Streak Semanal:</strong> {estado.profile.weekly_streak}{" "}
                  semanas 🔥
                </li>
                <li>
                  <strong>Sermões este mês:</strong>{" "}
                  {estado.profile.sermons_this_month || 0}
                </li>
              </ul>
            </div>
          )}

          {estado?.series && estado.series.length > 0 && (
            <div className={styles.seriesInfo}>
              <h3>Suas Séries</h3>
              <ul>
                {estado.series.map((serie) => (
                  <li key={serie.id}>
                    <strong>{serie.series_name}</strong>
                    <p>{serie.overview}</p>
                    <p>
                      Semana atual: {serie.current_week} (de{" "}
                      {serie.weeks?.length || 0})
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.nextSteps}>
            <h3>Próximos Passos</h3>
            <ol>
              <li>
                Integre seus componentes React na pasta{" "}
                <code>components/</code>
              </li>
              <li>
                Importe e renderize-os aqui no <code>AppDashboard</code>
              </li>
              <li>Conecte as chamadas da API usando as rotas em /api/</li>
              <li>Configure e teste com dados reais do Supabase</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [estado, setEstado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const verificarAutenticacao = async () => {
      try {
        const session = await auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        setSession(session);

        // Carrega estado completo (usuário, profile, séries, etc)
        const estado = await loadFullState();
        if (estado.authenticated) {
          setEstado(estado);
        } else {
          setError(
            "Não foi possível carregar seus dados. Tente fazer login novamente."
          );
          await auth.signOut();
          router.push("/login");
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
        setError(err.message);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    verificarAutenticacao();

    // Escuta mudanças de autenticação (login/logout de outras abas)
    const { data: listener } = auth.onAuthStateChange(
      (evento, novaSession) => {
        if (!novaSession) {
          router.push("/login");
        } else {
          setSession(novaSession);
        }
      }
    );

    return () => {
      if (listener?.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Erro ao fazer logout:", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>⚠️ Erro</h2>
        <p>{error}</p>
        <button onClick={() => router.push("/login")}>Voltar ao login</button>
      </div>
    );
  }

  if (!session) {
    return null; // Redirect está em andamento
  }

  return <AppDashboard estado={estado} logout={handleLogout} />;
}
