"use client";

import { useEffect, useState } from "react";

const CURRENT_VERSION = "2026.05-v3";
const STORAGE_KEY = "rhema_changelog_seen";

export function useNotification() {
  const [hasNotification, setHasNotification] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    setHasNotification(seen !== CURRENT_VERSION);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setHasNotification(false);
  };

  return { hasNotification, dismiss };
}

export default function NotificationBell({ t }) {
  const [open, setOpen] = useState(false);
  const { hasNotification, dismiss } = useNotification();

  const handleBellClick = () => {
    setOpen(true);
  };

  const handleDismiss = () => {
    dismiss();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={handleBellClick}
        title={t("notification_title")}
        className="relative grid h-[36px] w-[36px] cursor-pointer place-items-center rounded-full border-none bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {hasNotification && (
          <span className="absolute -right-[2px] -top-[2px] grid h-[16px] min-w-[16px] place-items-center rounded-full bg-red-500 px-[3px] text-[9px] font-bold text-white">
            {t("notification_new")}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm"
          />
          <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-[460px] -translate-x-1/2 rounded-[20px] border border-brand-line bg-white shadow-brand-lg">
            <div className="flex items-center justify-between border-b border-brand-line px-[22px] py-[16px]">
              <h3 className="m-0 font-serif text-[19px] text-brand-primary">
                {t("notification_title")}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-full border-none bg-slate-100 text-[16px] font-bold text-slate-500 transition-colors hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-[22px] py-[18px] space-y-[20px]">
              <div className="rounded-[14px] border border-brand-green-soft bg-brand-green-soft/40 p-[16px]">
                <div className="flex items-center gap-[8px] mb-[8px]">
                  <span className="rounded-[6px] bg-brand-green px-[6px] py-[2px] text-[10px] font-bold text-white">NOVO</span>
                  <h4 className="m-0 font-serif text-[15px] text-brand-primary">{t("notif_library")}</h4>
                </div>
                <p className="m-0 text-[13px] leading-[1.6] text-brand-text">{t("notif_library_desc")}</p>
              </div>

              <div className="rounded-[14px] border border-brand-gold/20 bg-brand-amber-soft/40 p-[16px]">
                <div className="flex items-center gap-[8px] mb-[8px]">
                  <span className="rounded-[6px] bg-brand-gold px-[6px] py-[2px] text-[10px] font-bold text-white">NOVO</span>
                  <h4 className="m-0 font-serif text-[15px] text-brand-primary">{t("notif_commentary")}</h4>
                </div>
                <p className="m-0 text-[13px] leading-[1.6] text-brand-text">{t("notif_commentary_desc")}</p>
              </div>

              <div className="rounded-[14px] border border-brand-blue-soft bg-brand-blue-soft/40 p-[16px]">
                <div className="flex items-center gap-[8px] mb-[8px]">
                  <span className="rounded-[6px] bg-brand-primary px-[6px] py-[2px] text-[10px] font-bold text-white">NOVO</span>
                  <h4 className="m-0 font-serif text-[15px] text-brand-primary">{t("notif_commentary_tab")}</h4>
                </div>
                <p className="m-0 text-[13px] leading-[1.6] text-brand-text">{t("notif_commentary_tab_desc")}</p>
              </div>
            </div>

            <div className="border-t border-brand-line px-[22px] py-[14px]">
              <button
                onClick={handleDismiss}
                className="w-full cursor-pointer rounded-[12px] border-none bg-brand-primary py-[12px] text-[13px] font-bold text-white transition-colors hover:bg-brand-primary-2"
              >
                {t("notification_got_it")}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
