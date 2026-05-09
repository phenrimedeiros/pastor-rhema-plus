"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const check = async () => {
      try {
        const user = await auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        if (user.last_sign_in_at) {
          router.push("/dashboard");
          return;
        }
      } catch {
        router.push("/login");
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError(t("set_password_err_short"));
      return;
    }
    if (password !== confirm) {
      setError(t("set_password_err_match"));
      return;
    }

    setLoading(true);
    try {
      await auth.updatePassword(password);
      await auth.updateUserMetadata({ password_is_temporary: false });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err) {
      setError(err.message || "Erro ao salvar senha.");
    }
    setLoading(false);
  };

  if (checking) return null;

  const inputClass = "w-full p-[12px_14px] border-[1.5px] border-brand-line rounded-[12px] text-[14px] font-sans outline-none bg-white text-[#1f2937] box-border mt-[6px] focus:border-brand-primary";
  const labelClass = "flex flex-col gap-[2px] text-[13px] font-bold text-brand-text";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#0d3268] font-sans p-[16px] md:p-[20px]">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="text-center mb-[36px]">
          <div className="w-[96px] h-[96px] md:w-[120px] md:h-[120px] rounded-full bg-white grid place-items-center mx-auto mb-[16px] shadow-[0_8px_32px_rgba(0,0,0,.2)] p-[14px] overflow-hidden">
            <Image src="/logo.png" alt="Pastor Rhema" width={96} height={96} className="w-full h-full object-contain" />
          </div>
          <p className="m-0 text-[13px] text-white/45">
            {t("login_signin_subtitle")}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[20px] p-[22px_18px] md:p-[28px] shadow-[0_24px_64px_rgba(0,0,0,.25)]">
          <h2 className="m-0 mb-[6px] font-serif text-[20px] font-extrabold text-brand-primary">
            {t("set_password_title")}
          </h2>
          <p className="m-0 mb-[20px] text-[13px] text-brand-muted leading-[1.6]">
            {t("set_password_subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
            <label htmlFor="password" className={labelClass}>
              {t("set_password_new")}
              <input
                type="password" id="password"
                placeholder={t("set_password_new")}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className={inputClass}
              />
            </label>

            <label htmlFor="confirm" className={labelClass}>
              {t("set_password_confirm")}
              <input
                type="password" id="confirm"
                placeholder={t("set_password_confirm")}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
                required
                className={inputClass}
              />
            </label>

            {error && (
              <p className="m-0 text-[13px] text-red-700 text-center" aria-live="assertive">{error}</p>
            )}
            {success && (
              <p className="m-0 text-[13px] text-green-800 text-center" aria-live="assertive">{t("set_password_success")}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`mt-[4px] min-h-[46px] p-[13px] bg-gradient-to-br from-brand-primary to-[#163d7a] text-white border-none rounded-[12px] text-[14px] font-bold font-sans cursor-pointer transition-opacity ${loading ? "opacity-70 cursor-not-allowed" : "opacity-100 hover:opacity-90"}`}
            >
              {loading ? t("set_password_loading") : t("set_password_btn")}
            </button>
          </form>

          <p className="mt-[16px] text-center text-[12px] text-brand-muted leading-[1.6]">
            {t("set_password_hint")}
          </p>
        </div>
      </div>
    </div>
  );
}
