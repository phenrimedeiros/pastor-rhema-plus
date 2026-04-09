"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";
import Image from "next/image";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

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

  const inputClasses = "w-full p-[12px_14px] border-[1.5px] border-brand-line rounded-[12px] text-[14px] font-sans outline-none bg-white text-[#1f2937] box-border mt-[6px] focus:border-brand-primary";
  const labelClasses = "flex flex-col gap-[2px] text-[13px] font-bold text-brand-text";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#0d3268] font-sans p-[16px] md:p-[20px]">
      <div className="w-full max-w-[380px]">

        {/* Logo */}
        <div className="text-center mb-[36px]">
          <div className="w-[96px] h-[96px] md:w-[120px] md:h-[120px] rounded-full bg-white grid place-items-center mx-auto mb-[16px] shadow-[0_8px_32px_rgba(0,0,0,.2)] p-[14px] box-border">
            <Image src="/logo.png" alt="Pastor Rhema" width={96} height={96} className="w-full h-full object-contain" />
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-[22px_18px] md:p-[28px] shadow-[0_24px_64px_rgba(0,0,0,.25)]">
          <h2 className="m-0 mb-[6px] font-serif text-[20px] font-extrabold text-brand-primary">
            {t("reset_title")}
          </h2>
          <p className="m-0 mb-[20px] text-[13px] text-brand-muted leading-[1.6]">
            {t("reset_subtitle")}
          </p>

          {!ready ? (
            <p className="text-center text-brand-muted text-[14px]">
              Validando link...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]">
              <label className={labelClasses}>
                {t("reset_new_pass")}
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className={inputClasses}
                />
              </label>

              <label className={labelClasses}>
                {t("reset_confirm_pass")}
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={loading}
                  required
                  className={inputClasses}
                />
              </label>

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
                {loading ? t("reset_loading") : t("reset_btn")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
