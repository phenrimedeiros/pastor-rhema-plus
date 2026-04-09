"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Registra service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Detecta iOS (Safari não dispara beforeinstallprompt)
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !("standalone" in navigator && navigator.standalone);
    setIsIOS(ios);

    // Já instalado como PWA — não mostra
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Já dispensado nesta sessão
    if (sessionStorage.getItem("pwa-dismissed")) return;

    if (ios) {
      // iOS: mostra instruções manuais após 3s
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Desktop: captura o evento nativo
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem("pwa-dismissed", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 32px)", maxWidth: 400,
      background: "#fff", borderRadius: 16,
      boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
      padding: "16px 18px",
      display: "flex", alignItems: "center", gap: 14,
      zIndex: 9999,
      fontFamily: "DM Sans, sans-serif",
    }}>
      <Image src="/logo.png" alt="Pastor Rhema" width={44} height={44}
        style={{ borderRadius: 10, flexShrink: 0, objectFit: "contain", background: "#f0f4ff" }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#0b2a5b" }}>
          Adicionar à tela inicial
        </p>
        {isIOS ? (
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
            Toque em <strong>⎋ Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong>
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
            Acesse o Pastor Rhema como um app, sem precisar do navegador.
          </p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        {!isIOS && (
          <button onClick={handleInstall} style={{
            background: "#0b2a5b", color: "#fff", border: "none",
            borderRadius: 8, padding: "7px 14px", fontSize: 12,
            fontWeight: 700, cursor: "pointer", fontFamily: "DM Sans, sans-serif",
          }}>
            Instalar
          </button>
        )}
        <button onClick={handleDismiss} style={{
          background: "none", color: "#9ca3af", border: "none",
          borderRadius: 8, padding: "7px 14px", fontSize: 12,
          cursor: "pointer", fontFamily: "DM Sans, sans-serif",
        }}>
          Agora não
        </button>
      </div>
    </div>
  );
}
