"use client";

import { auth } from "@/lib/supabase_client";

async function parseResponse(res) {
  const text = await res.text();

  if (!text) {
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return null;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Erro ${res.status}: resposta inválida do servidor.`);
  }

  if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
  return data;
}

async function adminRequest(path, options = {}) {
  const session = await auth.getSession();
  if (!session) throw new Error("Sessão expirada. Faça login novamente.");

  const res = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  return parseResponse(res);
}

export const adminApi = {
  getMe() {
    return adminRequest("/api/admin/me", { method: "GET" });
  },

  listUsers({ page = 1, perPage = 12, q = "" } = {}) {
    const searchParams = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
    });

    if (String(q || "").trim()) {
      searchParams.set("q", String(q).trim());
    }

    return adminRequest(`/api/admin/users/list?${searchParams.toString()}`, {
      method: "GET",
    });
  },

  findUserByEmail(email) {
    return adminRequest(`/api/admin/users?email=${encodeURIComponent(email)}`, { method: "GET" });
  },

  createUser(payload) {
    return adminRequest("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateUser(userId, payload) {
    return adminRequest(`/api/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
