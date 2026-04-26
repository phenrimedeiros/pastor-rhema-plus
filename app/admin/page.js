"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppLayout from "@/components/AppLayout";
import { Btn, Card, Field, Loader, Notice } from "@/components/ui";
import { adminApi } from "@/lib/adminApi";
import { useLanguage } from "@/lib/i18n";
import { loadFullState } from "@/lib/supabase_client";

const EMPTY_AUDIT = { emailsText: "", results: null, stats: null, checking: false, fixing: false, error: "" };

const EMPTY_EDITOR = {
  email: "",
  fullName: "",
  plan: "simple",
  password: "",
  confirmEmail: true,
  accessEnabled: true,
};

const USERS_PER_PAGE = 12;
const EMPTY_STATS = {
  totalUsers: 0,
  activeToday: 0,
  activeThisWeek: 0,
  neverLoggedIn: 0,
  disabledUsers: 0,
};
const EMPTY_PAGINATION = {
  page: 1,
  perPage: USERS_PER_PAGE,
  total: 0,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

function formatTimestamp(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActivityState(lastSignInAt) {
  if (!lastSignInAt) return "never";

  const timestamp = Date.parse(lastSignInAt);
  if (Number.isNaN(timestamp)) return "inactive";

  const diff = Date.now() - timestamp;
  if (diff <= 24 * 60 * 60 * 1000) return "today";
  if (diff <= 7 * 24 * 60 * 60 * 1000) return "week";
  return "inactive";
}

function getActivityBadgeClass(activityState) {
  switch (activityState) {
    case "today":
      return "bg-emerald-100 text-emerald-700";
    case "week":
      return "bg-blue-100 text-blue-700";
    case "never":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function AdminPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("idle");
  const [record, setRecord] = useState(null);
  const [editor, setEditor] = useState(EMPTY_EDITOR);
  const [message, setMessage] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersStats, setUsersStats] = useState(EMPTY_STATS);
  const [usersPagination, setUsersPagination] = useState(EMPTY_PAGINATION);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersRefreshing, setUsersRefreshing] = useState(false);
  const [usersQuery, setUsersQuery] = useState("");
  const [usersQueryDraft, setUsersQueryDraft] = useState("");
  const [usersError, setUsersError] = useState("");
  const [audit, setAudit] = useState(EMPTY_AUDIT);

  function applyUsersResponse(result) {
    setUsers(result?.users || []);
    setUsersStats(result?.stats || EMPTY_STATS);
    setUsersPagination(result?.pagination || EMPTY_PAGINATION);
  }

  function openUserRecord(user) {
    setMode("edit");
    setRecord(user);
    applyRecordToEditor(user);
    setSearchEmail(user.email || "");
  }

  async function refreshUsers(page = 1, query = usersQuery, options = {}) {
    const useBackgroundRefresh = options.background === true;

    if (useBackgroundRefresh) {
      setUsersRefreshing(true);
    } else {
      setUsersLoading(true);
    }

    setUsersError("");

    try {
      const result = await adminApi.listUsers({
        page,
        perPage: USERS_PER_PAGE,
        q: query,
      });
      applyUsersResponse(result);
    } catch (error) {
      setUsersError(error.message || t("admin_error_generic"));
    } finally {
      if (useBackgroundRefresh) {
        setUsersRefreshing(false);
      } else {
        setUsersLoading(false);
      }
    }
  }

  useEffect(() => {
    let active = true;

    async function loadAdminPage() {
      try {
        const [state, me] = await Promise.all([
          loadFullState(true),
          adminApi.getMe(),
        ]);

        if (!active) return;

        if (!state?.authenticated) {
          router.push("/login");
          return;
        }

        if (!me?.authorized) {
          router.push("/dashboard");
          return;
        }

        setProfile(state.profile);
        setAdminEmail(me.email || "");

        try {
          const initialUsers = await adminApi.listUsers({
            page: 1,
            perPage: USERS_PER_PAGE,
          });

          if (!active) return;

          setUsersQuery(initialUsers?.query || "");
          setUsersQueryDraft(initialUsers?.query || "");
          applyUsersResponse(initialUsers);
        } catch (error) {
          if (active) {
            setUsersError(error.message || t("admin_error_generic"));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar área admin:", error);
        if (active) router.push("/dashboard");
      } finally {
        if (active) {
          setLoading(false);
          setUsersLoading(false);
        }
      }
    }

    loadAdminPage();

    return () => {
      active = false;
    };
  }, [router, t]);

  function applyRecordToEditor(user) {
    setEditor({
      email: user.email || "",
      fullName: user.fullName || "",
      plan: user.plan || "simple",
      password: "",
      confirmEmail: !user.emailConfirmed,
      accessEnabled: user.accessEnabled !== false,
    });
  }

  async function handleSearch(event) {
    event.preventDefault();
    const normalizedEmail = searchEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage({ type: "error", text: t("admin_error_email_required") });
      return;
    }

    setSearching(true);
    setMessage(null);

    try {
      const result = await adminApi.findUserByEmail(normalizedEmail);

      if (result.found && result.user) {
        openUserRecord(result.user);
        setMessage({ type: "success", text: t("admin_search_found") });
        return;
      }

      setMode("create");
      setRecord(null);
      setEditor({
        ...EMPTY_EDITOR,
        email: normalizedEmail,
      });
      setMessage({ type: "info", text: t("admin_search_missing") });
    } catch (error) {
      setMessage({ type: "error", text: error.message || t("admin_error_generic") });
    } finally {
      setSearching(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        fullName: editor.fullName.trim(),
        plan: editor.plan,
        accessEnabled: editor.accessEnabled === true,
      };

      if (editor.password.trim()) {
        payload.password = editor.password.trim();
      }

      if (editor.confirmEmail) {
        payload.emailConfirmed = true;
      }

      if (mode === "create") {
        if (!editor.email.trim()) {
          throw new Error(t("admin_error_email_required"));
        }
        if (!payload.password) {
          throw new Error(t("admin_error_password_required"));
        }

        const result = await adminApi.createUser({
          email: editor.email.trim().toLowerCase(),
          fullName: payload.fullName,
          plan: payload.plan,
          password: payload.password,
          emailConfirmed: payload.emailConfirmed === true,
          accessEnabled: payload.accessEnabled,
        });

        openUserRecord(result.user);
        setMessage({ type: "success", text: t("admin_create_success") });
        await refreshUsers(1, usersQuery, { background: true });
        return;
      }

      if (!record?.id) {
        throw new Error(t("admin_error_no_user"));
      }

      const result = await adminApi.updateUser(record.id, payload);
      setRecord(result.user);
      applyRecordToEditor(result.user);
      setMessage({ type: "success", text: t("admin_update_success") });
      await refreshUsers(usersPagination.page || 1, usersQuery, { background: true });
    } catch (error) {
      setMessage({ type: "error", text: error.message || t("admin_error_generic") });
    } finally {
      setSaving(false);
    }
  }

  async function handleAuditCheck(fix = false) {
    const emails = audit.emailsText.trim().split(/[\n,;]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
    if (emails.length === 0) {
      setAudit((a) => ({ ...a, error: "Cole pelo menos um email válido." }));
      return;
    }
    setAudit((a) => ({ ...a, error: "", checking: !fix, fixing: fix }));
    try {
      const result = await adminApi.plusAudit(emails, fix);
      setAudit((a) => ({ ...a, results: result.results, stats: result.stats, checking: false, fixing: false }));
    } catch (err) {
      setAudit((a) => ({ ...a, error: err.message || "Erro ao verificar.", checking: false, fixing: false }));
    }
  }

  async function handleUsersSearch(event) {
    event.preventDefault();

    const nextQuery = usersQueryDraft.trim();
    setUsersQuery(nextQuery);
    await refreshUsers(1, nextQuery);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
        <Loader text={t("common_loading")} />
      </div>
    );
  }

  const inputClass = "w-full rounded-[16px] border border-slate-200 bg-white px-[14px] py-[13px] text-[14px] text-slate-800 outline-none transition-colors focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10";
  const readOnlyInputClass = `${inputClass} cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500`;
  const selectClass = `${inputClass} appearance-none`;

  return (
    <AppLayout profile={profile}>
      <div className="grid gap-[18px]">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0b2a5b] via-[#12366c] to-[#194987] p-[22px_18px] text-white shadow-[0_24px_64px_rgba(15,23,42,.12)] md:p-[30px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(202,161,74,.18),transparent_30%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-[8px] rounded-full border border-white/10 bg-white/10 px-[12px] py-[6px] text-[11px] font-extrabold uppercase tracking-[.08em]">
              {t("admin_badge")}
            </div>
            <h1 className="m-[16px_0_8px] font-serif text-[30px] leading-[1.05] tracking-[-.03em] md:text-[38px]">
              {t("admin_title")}
            </h1>
            <p className="m-0 max-w-[760px] text-[14px] leading-[1.7] text-white/72 md:text-[15px]">
              {t("admin_subtitle")}
            </p>

            <div className="mt-[18px] grid gap-[12px] md:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-white/10 p-[14px] backdrop-blur-md">
                <p className="m-0 mb-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] text-white/52">
                  {t("admin_signed_in_as")}
                </p>
                <p className="m-0 text-[15px] font-semibold text-white">
                  {adminEmail || "-"}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/10 p-[14px] backdrop-blur-md">
                <p className="m-0 mb-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] text-white/52">
                  {t("admin_local_mode")}
                </p>
                <p className="m-0 text-[15px] font-semibold text-white">
                  {t("admin_local_mode_desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <Notice color={message.type === "error" ? "red" : message.type === "success" ? "green" : "blue"}>
            {message.text}
          </Notice>
        ) : null}

        <Card className="border-white/70 bg-white/90 shadow-[0_24px_64px_rgba(15,23,42,.08)] backdrop-blur-xl">
          <div className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-[14px] lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="m-0 mb-[8px] text-[11px] font-extrabold uppercase tracking-[.08em] text-[#0b2a5b]/56">
                  {t("admin_view_badge")}
                </p>
                <h2 className="m-0 font-serif text-[24px] text-brand-primary">
                  {t("admin_view_title")}
                </h2>
                <p className="m-[8px_0_0] max-w-[760px] text-[14px] leading-[1.7] text-brand-muted">
                  {t("admin_view_desc")}
                </p>
              </div>

              <Btn
                variant="secondary"
                onClick={() => refreshUsers(usersPagination.page || 1, usersQuery, { background: true })}
                disabled={usersLoading || usersRefreshing}
              >
                {usersRefreshing ? t("admin_list_refreshing") : t("admin_list_refresh_btn")}
              </Btn>
            </div>

            <div className="grid gap-[12px] sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-[14px]">
                <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                  {t("admin_stat_total_users")}
                </p>
                <p className="m-0 text-[24px] font-black text-slate-900">
                  {usersStats.totalUsers}
                </p>
              </div>

              <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-[14px]">
                <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-emerald-700/70">
                  {t("admin_stat_active_today")}
                </p>
                <p className="m-0 text-[24px] font-black text-emerald-800">
                  {usersStats.activeToday}
                </p>
              </div>

              <div className="rounded-[18px] border border-blue-100 bg-blue-50 p-[14px]">
                <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-blue-700/70">
                  {t("admin_stat_active_week")}
                </p>
                <p className="m-0 text-[24px] font-black text-blue-800">
                  {usersStats.activeThisWeek}
                </p>
              </div>

              <div className="rounded-[18px] border border-red-100 bg-red-50 p-[14px]">
                <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-red-700/70">
                  {t("admin_stat_disabled_users")}
                </p>
                <p className="m-0 text-[24px] font-black text-red-800">
                  {usersStats.disabledUsers}
                </p>
              </div>

              <div className="rounded-[18px] border border-amber-100 bg-amber-50 p-[14px]">
                <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-amber-700/70">
                  {t("admin_stat_never_logged")}
                </p>
                <p className="m-0 text-[24px] font-black text-amber-800">
                  {usersStats.neverLoggedIn}
                </p>
              </div>
            </div>

            <Notice color="blue" className="mb-0">
              {t("admin_view_notice")}
            </Notice>

            <form onSubmit={handleUsersSearch} className="grid gap-[14px] md:grid-cols-[1fr_auto] md:items-end">
              <Field label={t("admin_list_search_label")}>
                <input
                  type="text"
                  value={usersQueryDraft}
                  onChange={(event) => setUsersQueryDraft(event.target.value)}
                  className={inputClass}
                  placeholder={t("admin_list_search_placeholder")}
                  disabled={usersLoading || usersRefreshing}
                />
              </Field>

              <Btn type="submit" variant="secondary" className="md:min-w-[180px]" disabled={usersLoading || usersRefreshing}>
                {t("admin_list_search_btn")}
              </Btn>
            </form>

            {usersError ? (
              <Notice color="red" className="mb-0">
                {usersError}
              </Notice>
            ) : null}

            {usersLoading ? (
              <Loader text={t("common_loading")} className="py-[40px]" />
            ) : users.length > 0 ? (
              <div className="grid gap-[12px]">
                {users.map((user) => {
                  const activityState = getActivityState(user.lastSignInAt);

                  return (
                    <div
                      key={user.id}
                      className="rounded-[20px] border border-slate-200 bg-white p-[16px] shadow-[0_10px_30px_rgba(15,23,42,.04)]"
                    >
                      <div className="flex flex-col gap-[14px] lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-[8px]">
                            <p className="m-0 text-[16px] font-bold text-slate-900">
                              {user.fullName || user.email}
                            </p>

                            {user.isAdmin ? (
                              <span className="inline-flex items-center rounded-full bg-[#0b2a5b]/10 px-[10px] py-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] text-[#0b2a5b]">
                                {t("admin_status_admin")}
                              </span>
                            ) : null}

                            <span className={`inline-flex items-center rounded-full px-[10px] py-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] ${user.plan === "plus" ? "bg-[#caa14a]/16 text-[#7c5a14]" : "bg-slate-100 text-slate-600"}`}>
                              {user.plan === "plus" ? t("plan_plus") : t("plan_simple")}
                            </span>

                            <span className={`inline-flex items-center rounded-full px-[10px] py-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] ${user.accessEnabled ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                              {user.accessEnabled ? t("admin_access_enabled") : t("admin_access_disabled")}
                            </span>

                            <span className={`inline-flex items-center rounded-full px-[10px] py-[6px] text-[11px] font-extrabold uppercase tracking-[.08em] ${getActivityBadgeClass(activityState)}`}>
                              {t(`admin_status_activity_${activityState}`)}
                            </span>
                          </div>

                          <p className="m-[8px_0_0] break-all text-[14px] text-slate-600">
                            {user.email}
                          </p>
                        </div>

                        <Btn
                          variant="secondary"
                          onClick={() => openUserRecord(user)}
                          disabled={saving}
                        >
                          {t("admin_list_open_btn")}
                        </Btn>
                      </div>

                      <div className="mt-[14px] grid gap-[10px] md:grid-cols-4">
                        <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-[12px]">
                          <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                            {t("admin_last_signin")}
                          </p>
                          <p className="m-0 text-[14px] font-semibold text-slate-800">
                            {formatTimestamp(user.lastSignInAt)}
                          </p>
                        </div>

                        <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-[12px]">
                          <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                            {t("admin_created_at")}
                          </p>
                          <p className="m-0 text-[14px] font-semibold text-slate-800">
                            {formatTimestamp(user.createdAt)}
                          </p>
                        </div>

                        <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-[12px]">
                          <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                            {t("admin_email_status")}
                          </p>
                          <p className="m-0 text-[14px] font-semibold text-slate-800">
                            {user.emailConfirmed ? t("admin_email_confirmed") : t("admin_email_unconfirmed")}
                          </p>
                        </div>

                        <div className="rounded-[16px] border border-slate-200 bg-slate-50 p-[12px]">
                          <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                            {t("admin_access_status")}
                          </p>
                          <p className={`m-0 text-[14px] font-semibold ${user.accessEnabled ? "text-emerald-700" : "text-red-700"}`}>
                            {user.accessEnabled ? t("admin_access_enabled") : t("admin_access_disabled")}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Notice color="blue" className="mb-0">
                {t("admin_list_empty")}
              </Notice>
            )}

            <div className="flex flex-col gap-[12px] border-t border-slate-200 pt-[18px] md:flex-row md:items-center md:justify-between">
              <div className="text-[13px] font-semibold text-slate-500">
                {t("admin_list_results")} {usersPagination.total}
                <span className="mx-[8px] text-slate-300">•</span>
                {t("admin_list_page")} {usersPagination.page}/{usersPagination.totalPages}
              </div>

              <div className="flex flex-wrap gap-[10px]">
                <Btn
                  variant="secondary"
                  onClick={() => refreshUsers(usersPagination.page - 1, usersQuery)}
                  disabled={usersLoading || usersRefreshing || !usersPagination.hasPreviousPage}
                >
                  {t("admin_list_prev")}
                </Btn>

                <Btn
                  variant="secondary"
                  onClick={() => refreshUsers(usersPagination.page + 1, usersQuery)}
                  disabled={usersLoading || usersRefreshing || !usersPagination.hasNextPage}
                >
                  {t("admin_list_next")}
                </Btn>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-white/70 bg-white/90 shadow-[0_24px_64px_rgba(15,23,42,.08)] backdrop-blur-xl">
          <p className="m-0 mb-[8px] text-[11px] font-extrabold uppercase tracking-[.08em] text-[#0b2a5b]/56">
            {t("admin_search_badge")}
          </p>
          <h2 className="m-0 font-serif text-[24px] text-brand-primary">
            {t("admin_search_title")}
          </h2>
          <p className="m-[8px_0_0] text-[14px] leading-[1.7] text-brand-muted">
            {t("admin_search_desc")}
          </p>

          <form onSubmit={handleSearch} className="mt-[20px] grid gap-[14px] md:grid-cols-[1fr_auto] md:items-end">
            <Field label={t("admin_email_label")}>
              <input
                type="email"
                value={searchEmail}
                onChange={(event) => setSearchEmail(event.target.value)}
                className={inputClass}
                placeholder="usuario@dominio.com"
                disabled={searching || saving}
              />
            </Field>

            <Btn type="submit" className="md:min-w-[180px]" disabled={searching || saving}>
              {searching ? t("admin_searching") : t("admin_search_btn")}
            </Btn>
          </form>
        </Card>

        {mode !== "idle" ? (
          <div className="grid gap-[18px] xl:grid-cols-[1.15fr_.85fr]">
            <Card className="border-white/70 bg-white/90 shadow-[0_24px_64px_rgba(15,23,42,.08)] backdrop-blur-xl">
              <p className="m-0 mb-[8px] text-[11px] font-extrabold uppercase tracking-[.08em] text-[#0b2a5b]/56">
                {mode === "create" ? t("admin_create_badge") : t("admin_edit_badge")}
              </p>
              <h2 className="m-0 font-serif text-[24px] text-brand-primary">
                {mode === "create" ? t("admin_create_title") : t("admin_edit_title")}
              </h2>
              <p className="m-[8px_0_0] text-[14px] leading-[1.7] text-brand-muted">
                {mode === "create" ? t("admin_create_desc") : t("admin_edit_desc")}
              </p>

              <form onSubmit={handleSave} className="mt-[22px] grid gap-[16px]">
                <Field label={t("admin_email_label")}>
                  <input
                    type="email"
                    value={editor.email}
                    readOnly
                    aria-readonly="true"
                    className={readOnlyInputClass}
                  />
                </Field>

                <Field label={t("admin_name_label")}>
                  <input
                    type="text"
                    value={editor.fullName}
                    onChange={(event) => setEditor((current) => ({ ...current, fullName: event.target.value }))}
                    className={inputClass}
                    placeholder={t("admin_name_placeholder")}
                    disabled={saving}
                  />
                </Field>

                <Field label={t("admin_plan_label")}>
                  <select
                    value={editor.plan}
                    onChange={(event) => setEditor((current) => ({ ...current, plan: event.target.value }))}
                    className={selectClass}
                    disabled={saving}
                  >
                    <option value="simple">{t("plan_simple")}</option>
                    <option value="plus">{t("plan_plus")}</option>
                  </select>
                </Field>

                <Field label={t("admin_access_label")}>
                  <label className="flex items-start gap-[10px] rounded-[16px] border border-slate-200 bg-slate-50 px-[14px] py-[12px] text-[13px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={editor.accessEnabled}
                      onChange={(event) => setEditor((current) => ({ ...current, accessEnabled: event.target.checked }))}
                      disabled={saving || (mode === "edit" && record?.isAdmin && editor.accessEnabled)}
                      className="mt-[2px]"
                    />
                    <span>{t("admin_access_enabled_toggle")}</span>
                  </label>
                </Field>

                <Field label={t("admin_password_label")}>
                  <input
                    type="text"
                    value={editor.password}
                    onChange={(event) => setEditor((current) => ({ ...current, password: event.target.value }))}
                    className={inputClass}
                    placeholder={mode === "create" ? t("admin_password_placeholder_create") : t("admin_password_placeholder_update")}
                    disabled={saving}
                  />
                </Field>

                <label className="flex items-start gap-[10px] rounded-[16px] border border-slate-200 bg-slate-50 px-[14px] py-[12px] text-[13px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={editor.confirmEmail}
                    onChange={(event) => setEditor((current) => ({ ...current, confirmEmail: event.target.checked }))}
                    disabled={saving}
                    className="mt-[2px]"
                  />
                  <span>{t("admin_confirm_email_toggle")}</span>
                </label>

                <div className="flex flex-wrap gap-[12px]">
                  <Btn type="submit" disabled={saving}>
                    {saving
                      ? mode === "create" ? t("admin_creating") : t("admin_saving")
                      : mode === "create" ? t("admin_create_btn") : t("admin_save_btn")}
                  </Btn>

                  <Btn
                    variant="secondary"
                    onClick={() => {
                      setMode("idle");
                      setRecord(null);
                      setEditor(EMPTY_EDITOR);
                      setMessage(null);
                    }}
                    disabled={saving}
                  >
                    {t("admin_clear_btn")}
                  </Btn>
                </div>
              </form>
            </Card>

            <Card className="border-white/70 bg-white/90 shadow-[0_24px_64px_rgba(15,23,42,.08)] backdrop-blur-xl">
              <p className="m-0 mb-[8px] text-[11px] font-extrabold uppercase tracking-[.08em] text-[#0b2a5b]/56">
                {t("admin_summary_badge")}
              </p>
              <h2 className="m-0 font-serif text-[24px] text-brand-primary">
                {t("admin_summary_title")}
              </h2>
              <p className="m-[8px_0_18px] text-[14px] leading-[1.7] text-brand-muted">
                {mode === "create" ? t("admin_summary_create") : t("admin_summary_edit")}
              </p>

              <div className="grid gap-[12px]">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-[14px]">
                  <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                    {t("admin_email_label")}
                  </p>
                  <p className="m-0 text-[15px] font-semibold text-slate-800">
                    {editor.email || "-"}
                  </p>
                </div>

                <div className="grid gap-[12px] md:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-[14px]">
                    <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                      {t("admin_plan_label")}
                    </p>
                    <p className="m-0 text-[15px] font-semibold text-slate-800">
                      {editor.plan === "plus" ? t("plan_plus") : t("plan_simple")}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-[14px]">
                    <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                      {t("admin_access_status")}
                    </p>
                    <p className={`m-0 text-[15px] font-semibold ${editor.accessEnabled ? "text-emerald-700" : "text-red-700"}`}>
                      {editor.accessEnabled ? t("admin_access_enabled") : t("admin_access_disabled")}
                    </p>
                  </div>

                  <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-[14px]">
                    <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                      {t("admin_email_status")}
                    </p>
                    <p className="m-0 text-[15px] font-semibold text-slate-800">
                      {mode === "create"
                        ? (editor.confirmEmail ? t("admin_email_confirmed") : t("admin_email_unconfirmed"))
                        : (record?.emailConfirmed ? t("admin_email_confirmed") : t("admin_email_unconfirmed"))}
                    </p>
                  </div>
                </div>

                {record ? (
                  <>
                    <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-[14px]">
                      <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                        ID
                      </p>
                      <p className="m-0 break-all text-[14px] font-semibold text-slate-800">
                        {record.id}
                      </p>
                    </div>

                    <div className="grid gap-[12px] md:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-[14px]">
                        <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                          {t("admin_created_at")}
                        </p>
                        <p className="m-0 text-[14px] font-semibold text-slate-800">
                          {formatTimestamp(record.createdAt)}
                        </p>
                      </div>

                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-[14px]">
                        <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                          {t("admin_last_signin")}
                        </p>
                        <p className="m-0 text-[14px] font-semibold text-slate-800">
                          {formatTimestamp(record.lastSignInAt)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}

                <Notice color="blue" className="mb-0">
                  {t("admin_local_notice")}
                </Notice>
              </div>
            </Card>
          </div>
        ) : null}
        <Card className="border-white/70 bg-white/90 shadow-[0_24px_64px_rgba(15,23,42,.08)] backdrop-blur-xl">
          <p className="m-0 mb-[8px] text-[11px] font-extrabold uppercase tracking-[.08em] text-[#0b2a5b]/56">
            {t("admin_plus_audit_badge")}
          </p>
          <h2 className="m-0 font-serif text-[24px] text-brand-primary">
            {t("admin_plus_audit_title")}
          </h2>
          <p className="m-[8px_0_0] text-[14px] leading-[1.7] text-brand-muted">
            {t("admin_plus_audit_desc")}
          </p>

          <div className="mt-[20px] grid gap-[14px]">
            <div>
              <label className="mb-[8px] block text-[13px] font-semibold text-slate-700">
                {t("admin_plus_audit_label")}
              </label>
              <textarea
                value={audit.emailsText}
                onChange={(e) => setAudit((a) => ({ ...a, emailsText: e.target.value, results: null, stats: null, error: "" }))}
                rows={6}
                className="w-full rounded-[16px] border border-slate-200 bg-white px-[14px] py-[13px] text-[13px] text-slate-800 outline-none transition-colors focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10 font-mono"
                placeholder={t("admin_plus_audit_placeholder")}
                disabled={audit.checking || audit.fixing}
              />
            </div>

            {audit.error ? (
              <Notice color="red" className="mb-0">{audit.error}</Notice>
            ) : null}

            <div className="flex flex-wrap gap-[12px]">
              <Btn onClick={() => handleAuditCheck(false)} disabled={audit.checking || audit.fixing || !audit.emailsText.trim()}>
                {audit.checking ? t("admin_plus_audit_checking") : t("admin_plus_audit_check_btn")}
              </Btn>

              {audit.stats?.needsFix > 0 ? (
                <Btn variant="secondary" onClick={() => handleAuditCheck(true)} disabled={audit.checking || audit.fixing}>
                  {audit.fixing ? t("admin_plus_audit_fixing") : `${t("admin_plus_audit_fix_btn")} (${audit.stats.needsFix})`}
                </Btn>
              ) : null}
            </div>

            {audit.stats ? (
              <div className="grid gap-[12px] sm:grid-cols-3">
                <div className="rounded-[18px] border border-emerald-100 bg-emerald-50 p-[14px]">
                  <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-emerald-700/70">
                    {t("admin_plus_audit_stat_plus")}
                  </p>
                  <p className="m-0 text-[28px] font-black text-emerald-800">
                    {audit.stats.plus + (audit.stats.fixed || 0)}
                  </p>
                </div>

                <div className={`rounded-[18px] border p-[14px] ${audit.stats.needsFix > 0 ? "border-amber-100 bg-amber-50" : "border-slate-100 bg-slate-50"}`}>
                  <p className={`m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] ${audit.stats.needsFix > 0 ? "text-amber-700/70" : "text-slate-500"}`}>
                    {t("admin_plus_audit_stat_fix")}
                  </p>
                  <p className={`m-0 text-[28px] font-black ${audit.stats.needsFix > 0 ? "text-amber-800" : "text-slate-400"}`}>
                    {audit.stats.needsFix}
                  </p>
                </div>

                <div className="rounded-[18px] border border-slate-100 bg-slate-50 p-[14px]">
                  <p className="m-0 mb-[4px] text-[11px] font-extrabold uppercase tracking-[.08em] text-slate-500">
                    {t("admin_plus_audit_stat_none")}
                  </p>
                  <p className="m-0 text-[28px] font-black text-slate-400">
                    {audit.stats.noAccount}
                  </p>
                </div>
              </div>
            ) : null}

            {audit.stats?.fixed > 0 ? (
              <Notice color="green" className="mb-0">
                {audit.stats.fixed} {t("admin_plus_audit_fix_success")}
              </Notice>
            ) : null}

            {audit.results?.length > 0 ? (
              <div className="grid gap-[8px]">
                {audit.results.map((row) => {
                  const isOk = row.status === "ok";
                  const isFixed = row.status === "fixed";
                  const needsFix = row.status === "needs_fix";

                  return (
                    <div
                      key={row.email}
                      className={`flex flex-col gap-[4px] rounded-[16px] border px-[16px] py-[12px] sm:flex-row sm:items-center sm:justify-between ${
                        isOk ? "border-emerald-100 bg-emerald-50" :
                        isFixed ? "border-blue-100 bg-blue-50" :
                        needsFix ? "border-amber-100 bg-amber-50" :
                        "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="m-0 truncate text-[13px] font-semibold text-slate-800">{row.email}</p>
                        {row.name ? <p className="m-0 text-[12px] text-slate-500">{row.name}</p> : null}
                      </div>
                      <span className={`shrink-0 rounded-full px-[10px] py-[5px] text-[11px] font-extrabold uppercase tracking-[.06em] ${
                        isOk ? "bg-emerald-100 text-emerald-700" :
                        isFixed ? "bg-blue-100 text-blue-700" :
                        needsFix ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {isOk ? t("admin_plus_audit_status_ok") :
                         isFixed ? t("admin_plus_audit_status_fixed") :
                         needsFix ? t("admin_plus_audit_status_fix") :
                         t("admin_plus_audit_status_none")}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : audit.results !== null ? (
              <Notice color="blue" className="mb-0">{t("admin_plus_audit_empty")}</Notice>
            ) : null}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
