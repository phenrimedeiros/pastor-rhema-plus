import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getMissingServerEnv } from "@/lib/serverEnv";

const REQUIRED_ADMIN_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function jsonError(message, status) {
  return Response.json({ error: message }, { status });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function chunkItems(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function getAdminAllowlist() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
}

export function isAdminEmail(email) {
  if (!email) return false;
  return getAdminAllowlist().includes(normalizeEmail(email));
}

function getBearerToken(request) {
  const header = request.headers.get("Authorization") || request.headers.get("authorization");
  if (!header) return "";
  return header.replace(/^Bearer\s+/i, "").trim();
}

export function createUserScopedSupabase(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export function createServiceRoleSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function requireAdminRequest(request) {
  const missingEnv = getMissingServerEnv(REQUIRED_ADMIN_ENV);
  if (missingEnv.length > 0) {
    return {
      response: jsonError(`Variáveis ausentes no servidor: ${missingEnv.join(", ")}`, 500),
    };
  }

  const adminEmails = getAdminAllowlist();
  if (adminEmails.length === 0) {
    return {
      response: jsonError("ADMIN_EMAILS não configurado para a área administrativa.", 500),
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return { response: jsonError("Não autorizado", 401) };
  }

  const userSupabase = createUserScopedSupabase(token);
  const { data: { user }, error: authError } = await userSupabase.auth.getUser();
  if (authError || !user) {
    return { response: jsonError("Sessão inválida", 401) };
  }

  if (!isAdminEmail(user.email)) {
    return { response: jsonError("Acesso restrito a administradores.", 403) };
  }

  return {
    adminUser: user,
    userSupabase,
    serviceSupabase: createServiceRoleSupabase(),
  };
}

export async function findAuthUserByEmail(serviceSupabase, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  let page = 1;
  while (true) {
    const { data, error } = await serviceSupabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);

    const users = data?.users || [];
    const found = users.find((user) => normalizeEmail(user.email) === normalizedEmail);
    if (found) return found;

    if (users.length < 1000) return null;
    page += 1;
  }
}

export async function getAuthUserById(serviceSupabase, userId) {
  const { data, error } = await serviceSupabase.auth.admin.getUserById(userId);
  if (error) throw new Error(error.message);
  return data?.user || null;
}

export async function getProfileByUserId(serviceSupabase, userId) {
  const { data, error } = await serviceSupabase
    .from("profiles")
    .select("id, full_name, plan, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data || null;
}

export async function getProfilesByUserIds(serviceSupabase, userIds) {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];
  if (uniqueUserIds.length === 0) {
    return new Map();
  }

  const profiles = [];
  const chunks = chunkItems(uniqueUserIds, 500);

  for (const chunk of chunks) {
    const { data, error } = await serviceSupabase
      .from("profiles")
      .select("id, full_name, plan, created_at, updated_at")
      .in("id", chunk);

    if (error) throw new Error(error.message);
    profiles.push(...(data || []));
  }

  return new Map(profiles.map((profile) => [profile.id, profile]));
}

export async function listAllAuthUsers(serviceSupabase) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await serviceSupabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(error.message);

    const currentUsers = data?.users || [];
    users.push(...currentUsers);

    if (currentUsers.length < 1000) {
      break;
    }

    page += 1;
  }

  return users;
}

export async function ensureProfile(serviceSupabase, userId, updates = {}) {
  const safeUpdates = {};

  if (typeof updates.full_name === "string") {
    safeUpdates.full_name = updates.full_name;
  }

  if (typeof updates.plan === "string") {
    safeUpdates.plan = updates.plan;
  }

  const existing = await getProfileByUserId(serviceSupabase, userId);
  if (existing) {
    if (Object.keys(safeUpdates).length === 0) return existing;

    const { data, error } = await serviceSupabase
      .from("profiles")
      .update(safeUpdates)
      .eq("id", userId)
      .select("id, full_name, plan, created_at, updated_at")
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  const payload = {
    id: userId,
    full_name: safeUpdates.full_name || null,
    plan: safeUpdates.plan || "simple",
  };

  const { data, error } = await serviceSupabase
    .from("profiles")
    .insert([payload])
    .select("id, full_name, plan, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function mapAdminUser(authUser, profile) {
  return {
    id: authUser.id,
    email: authUser.email || "",
    fullName: profile?.full_name || authUser.user_metadata?.full_name || "",
    plan: profile?.plan || "simple",
    isAdmin: isAdminEmail(authUser.email),
    emailConfirmed: Boolean(authUser.email_confirmed_at),
    createdAt: authUser.created_at || profile?.created_at || null,
    profileUpdatedAt: profile?.updated_at || null,
    lastSignInAt: authUser.last_sign_in_at || null,
    hasProfile: Boolean(profile),
  };
}
