"use client";

import { useState } from "react";
import Image from "next/image";
import { auth, supabase } from "@/lib/supabase_client";
import { useRouter } from "next/navigation";
import { useLanguage, LANGUAGES } from "@/lib/i18n";

export default function LoginPage() {
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

  const inputClasses = "w-full p-[12px_14px] border-[1.5px] border-brand-line rounded-[12px] text-[14px] font-sans outline-none bg-white text-[#1f2937] box-border mt-[6px] focus:border-brand-primary";
  const labelClasses = "flex flex-col gap-[2px] text-[13px] font-bold text-brand-text";

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
            {isForgot ? t("login_forgot_title") : t("login_signin_title")}
          </h2>
          {isForgot && (
            <p className="m-0 mb-[18px] text-[13px] text-brand-muted leading-[1.6]">
              {t("login_forgot_subtitle")}
            </p>
          )}
          {!isForgot && <div className="mb-[20px]" />}

          <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
            <label className={labelClasses}>
              {t("login_email")}
              <input
                type="email"
                placeholder={t("login_email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className={inputClasses}
              />
            </label>

            {!isForgot && (
              <label className={labelClasses}>
                {t("login_password")}
                <input
                  type="password"
                  placeholder={t("login_password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className={inputClasses}
                />
              </label>
            )}

            {!isForgot && (
              <div className="text-right mt-[-6px]">
                <button
                  type="button"
                  onClick={() => { setIsForgot(true); resetState(); }}
                  className="bg-transparent border-none p-0 text-brand-primary text-[12px] font-bold cursor-pointer font-sans"
                >
                  {t("login_forgot")}
                </button>
              </div>
            )}

            {error && (
              <p className="m-0 text-[13px] text-red-700 text-center">{error}</p>
            )}
            {success && (
              <p className="m-0 text-[13px] text-green-800 text-center">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`mt-[4px] min-h-[46px] p-[13px] bg-gradient-to-br from-brand-primary to-[#163d7a] text-white border-none rounded-[12px] text-[14px] font-bold font-sans cursor-pointer transition-opacity ${loading ? "opacity-70 cursor-not-allowed" : "opacity-100 hover:opacity-90"}`}
            >
              {loading ? t("login_loading") : isForgot ? t("login_forgot_btn") : t("login_signin_btn")}
            </button>
          </form>

          <div className="mt-[18px] pt-[20px] border-t border-brand-line text-center">
            {isForgot ? (
              <button
                type="button"
                onClick={() => { setIsForgot(false); resetState(); }}
                className="bg-transparent border-none p-0 text-brand-primary font-bold text-[13px] cursor-pointer font-sans transition-opacity hover:opacity-80"
              >
                ← {t("login_back")}
              </button>
            ) : (
              <>
                <span className="text-[13px] text-brand-muted">
                  {t("login_no_access")}{" "}
                </span>
                <a
                  href={HOTMART_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary font-bold text-[13px] font-sans no-underline transition-opacity hover:opacity-80"
                >
                  {t("login_get_access")}
                </a>
              </>
            )}
          </div>

          <p className="mt-[16px] text-center text-[12px] text-brand-muted leading-[1.6]">
            {t("login_security")}
          </p>
        </div>
      </div>

      {/* Language switcher — rodapé */}
      <div className="flex gap-[4px] justify-center mt-[24px] flex-wrap">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => changeLang(l.code)}
            className={`min-h-[28px] p-[4px_8px] rounded-[6px] border-none font-sans text-[10px] cursor-pointer transition-colors ${lang === l.code ? "bg-white/15 text-white/70 font-bold" : "bg-transparent text-white/30 font-normal hover:bg-white/5"}`}
          >
            {l.flag} {l.code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
