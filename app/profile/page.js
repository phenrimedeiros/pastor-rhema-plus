"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { Btn, Card, Loader, Notice } from "@/components/ui";
import { auth, profiles } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";

function formatProfileError(error, t) {
  const message = error?.message || "";
  if (
    message.includes("Auth session missing") ||
    message.includes("JWT") ||
    message.toLowerCase().includes("session")
  ) {
    return t("profile_err_session");
  }
  return message || t("profile_err_session");
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwdMsg, setPwdMsg] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadProfilePage() {
      try {
        const session = await auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const currentUser = await auth.getUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }

        const currentProfile = await profiles.getProfile(currentUser.id);
        if (!active) return;

        setUser(currentUser);
        setProfile(currentProfile);
        setFullName(currentProfile?.full_name || currentUser?.user_metadata?.full_name || "");
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        if (active) router.push("/login");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfilePage();

    return () => {
      active = false;
    };
  }, [router]);

  const handleUpdateProfile = async (event) => {
    event.preventDefault();
    setProfileMsg(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setProfileMsg({ text: t("profile_err_name"), type: "error" });
      return;
    }

    setSavingName(true);
    try {
      const updatedProfile = await profiles.updateProfile(user.id, { full_name: trimmedName });
      setProfile(updatedProfile);

      try {
        await auth.updateUserMetadata({ full_name: trimmedName });
      } catch (metadataError) {
        console.error("Erro ao sincronizar metadata do usuário:", metadataError);
      }

      setProfileMsg({ text: t("profile_name_success"), type: "success" });
    } catch (error) {
      setProfileMsg({ text: formatProfileError(error, t), type: "error" });
    } finally {
      setSavingName(false);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    setPwdMsg(null);

    if (password.length < 6) {
      setPwdMsg({ text: t("reset_err_short"), type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setPwdMsg({ text: t("reset_err_match"), type: "error" });
      return;
    }

    setSavingPassword(true);
    try {
      await auth.updatePassword(password);
      setPwdMsg({ text: t("profile_password_success"), type: "success" });
      setPassword("");
      setConfirmPassword("");

      setTimeout(async () => {
        try {
          await auth.signOut();
        } catch {
          // logout failure is non-critical; redirect to login anyway
        }
        router.push("/login");
      }, 1500);
    } catch (error) {
      setPwdMsg({ text: formatProfileError(error, t), type: "error" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
        <Loader text={t("common_loading")} />
      </div>
    );
  }

  const email = user?.email || profile?.email || "";
  const planLabel = profile?.plan === "plus" ? t("plan_plus") : t("plan_simple");
  const inputClass = "w-full rounded-[16px] border border-slate-200 bg-white px-[14px] py-[13px] text-[14px] text-slate-800 outline-none transition-colors focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
  const readOnlyInputClass = `${inputClass} cursor-not-allowed border-slate-200 bg-slate-100 pr-[48px] text-slate-500`;

  return (
    <AppLayout profile={profile}>
      <div className="grid gap-[18px]">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0b2a5b] via-[#12366c] to-[#194987] p-[22px_18px] text-white shadow-[0_24px_64px_rgba(15,23,42,.12)] md:p-[30px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(202,161,74,.18),transparent_30%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-[8px] rounded-full border border-white/10 bg-white/10 px-[12px] py-[6px] text-[11px] font-extrabold uppercase tracking-[.08em]">
              {t("profile_badge")}
            </div>
            <h1 className="m-[16px_0_8px] font-serif text-[30px] leading-[1.05] tracking-[-.03em] md:text-[38px]">
              {t("profile_title")}
            </h1>
            <p className="m-0 max-w-[720px] text-[14px] leading-[1.7] text-white/72 md:text-[15px]">
              {t("profile_subtitle")}
            </p>

            <div className="mt-[18px] grid gap-[12px] md:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-white/10 p-[14px] backdrop-blur-md">
                <p className="m-0 mb-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] text-white/52">
                  {t("profile_email_label")}
                </p>
                <p className="m-0 text-[15px] font-semibold text-white">
                  {email || "-"}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/10 p-[14px] backdrop-blur-md">
                <p className="m-0 mb-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] text-white/52">
                  {t("profile_plan_label")}
                </p>
                <p className="m-0 text-[15px] font-semibold text-white">
                  {planLabel}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-[18px] xl:grid-cols-[1.05fr_.95fr]">
          <Card className="relative overflow-hidden border-white/70 bg-white/85 shadow-[0_24px_64px_rgba(15,23,42,.08)] backdrop-blur-xl">
            <div className="pointer-events-none absolute right-[-32px] top-[-42px] h-[120px] w-[120px] rounded-full bg-[radial-gradient(circle,rgba(11,42,91,.08),transparent_68%)]" />
            <div className="relative z-10">
              <p className="m-0 mb-[8px] text-[11px] font-extrabold uppercase tracking-[.08em] text-[#0b2a5b]/56">
                {t("profile_badge")}
              </p>
              <h2 className="m-0 font-serif text-[24px] text-brand-primary">
                {t("profile_account_title")}
              </h2>
              <p className="m-[8px_0_0] text-[14px] leading-[1.7] text-brand-muted">
                {t("profile_account_desc")}
              </p>

              <form onSubmit={handleUpdateProfile} className="mt-[22px] grid gap-[16px]">
                <div>
                  <label className="mb-[7px] block text-[13px] font-bold text-slate-700">
                    {t("profile_name_label")}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={inputClass}
                    placeholder={t("profile_name_placeholder")}
                    disabled={savingName}
                  />
                </div>

                <div>
                  <div className="mb-[7px] flex items-center justify-between gap-[12px]">
                    <label className="block text-[13px] font-bold text-slate-700">
                      {t("profile_email_label")}
                    </label>
                    <span className="inline-flex items-center gap-[6px] rounded-full border border-slate-200 bg-slate-100 px-[10px] py-[5px] text-[11px] font-extrabold uppercase tracking-[.06em] text-slate-500">
                      {t("profile_email_locked")}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      readOnly
                      aria-readonly="true"
                      className={readOnlyInputClass}
                    />
                    <span className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
                      {"\uD83D\uDD12"}
                    </span>
                  </div>
                  <p className="m-[8px_0_0] text-[12px] leading-[1.6] text-brand-muted">
                    {t("profile_email_hint")}
                  </p>
                </div>

                {profileMsg && (
                  <Notice color={profileMsg.type === "success" ? "green" : "red"} className="mb-0">
                    {profileMsg.text}
                  </Notice>
                )}

                <Btn
                  type="submit"
                  disabled={savingName}
                  className="w-full md:w-auto md:justify-self-start bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]"
                >
                  {savingName ? t("reset_loading") : t("profile_update_name_btn")}
                </Btn>
              </form>
            </div>
          </Card>

          <Card className="relative overflow-hidden border border-[#caa14a]/20 bg-[linear-gradient(180deg,rgba(255,255,255,.92),rgba(251,247,236,.88))] shadow-[0_24px_64px_rgba(15,23,42,.08)] backdrop-blur-xl">
            <div className="pointer-events-none absolute bottom-[-44px] right-[-22px] h-[140px] w-[140px] rounded-full bg-[radial-gradient(circle,rgba(202,161,74,.18),transparent_66%)]" />
            <div className="relative z-10">
              <p className="m-0 mb-[8px] text-[11px] font-extrabold uppercase tracking-[.08em] text-[#6b4e13]/60">
                {t("profile_badge")}
              </p>
              <h2 className="m-0 font-serif text-[24px] text-brand-primary">
                {t("profile_security_title")}
              </h2>
              <p className="m-[8px_0_0] text-[14px] leading-[1.7] text-brand-muted">
                {t("profile_security_desc")}
              </p>

              <form onSubmit={handleUpdatePassword} className="mt-[22px] grid gap-[16px]">
                <div>
                  <label className="mb-[7px] block text-[13px] font-bold text-slate-700">
                    {t("profile_password_label")}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    disabled={savingPassword}
                  />
                </div>

                <div>
                  <label className="mb-[7px] block text-[13px] font-bold text-slate-700">
                    {t("profile_password_confirm")}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    disabled={savingPassword}
                  />
                  <p className="m-[8px_0_0] text-[12px] leading-[1.6] text-brand-muted">
                    {t("profile_password_hint")}
                  </p>
                </div>

                {pwdMsg && (
                  <Notice color={pwdMsg.type === "success" ? "green" : "red"} className="mb-0">
                    {pwdMsg.text}
                  </Notice>
                )}

                <Btn
                  type="submit"
                  disabled={savingPassword}
                  className="w-full md:w-auto md:justify-self-start bg-gradient-to-br from-[#caa14a] to-[#b7862d] text-[#1f2937]"
                >
                  {savingPassword ? t("reset_loading") : t("profile_update_password_btn")}
                </Btn>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
