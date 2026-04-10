"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS] = useState(() => {
    if (typeof navigator === "undefined") return false;
    // Detecta iOS (Safari não dispara beforeinstallprompt)
    return (
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !("standalone" in navigator && navigator.standalone)
    );
  });

  useEffect(() => {
    // Registra service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Já instalado como PWA — não mostra
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Já dispensado nesta sessão
    if (sessionStorage.getItem("pwa-dismissed")) return;

    if (isIOS) {
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
  }, [isIOS]);

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
    <div className="fixed left-1/2 z-[70] w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 install-prompt-offset">
      <div className="flex items-center gap-[14px] rounded-[20px] border border-brand-line bg-white/95 px-[16px] py-[15px] shadow-[0_18px_40px_rgba(15,23,42,.18)] backdrop-blur-xl">
        <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[14px] bg-brand-surface-3 p-[8px]">
          <Image
            src="/logo.png"
            alt="Pastor Rhema"
            width={44}
            height={44}
            className="h-full w-full rounded-[10px] object-contain"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="m-0 mb-[2px] text-[14px] font-bold text-brand-primary font-sans">
            Adicionar a tela inicial
          </p>
          {isIOS ? (
            <p className="m-0 text-[12px] leading-[1.5] text-brand-muted font-sans">
              Toque em <strong>Compartilhar</strong> e depois em{" "}
              <strong>Adicionar a Tela de Inicio</strong>.
            </p>
          ) : (
            <p className="m-0 text-[12px] leading-[1.5] text-brand-muted font-sans">
              Abra o Pastor Rhema como app e volte mais rapido ao seu fluxo.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-[6px]">
          {!isIOS && (
            <button
              type="button"
              onClick={handleInstall}
              className="min-h-[36px] rounded-[10px] border-none bg-brand-primary px-[14px] py-[8px] text-[12px] font-extrabold text-white font-sans transition-opacity hover:opacity-90"
            >
              Instalar
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="min-h-[36px] rounded-[10px] border-none bg-transparent px-[10px] py-[8px] text-[12px] text-brand-muted font-sans transition-colors hover:text-brand-primary"
          >
            Agora nao
          </button>
        </div>
      </div>
    </div>
  );
}
