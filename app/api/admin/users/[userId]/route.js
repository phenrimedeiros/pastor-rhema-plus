import {
  ensureProfile,
  getAuthUserById,
  mapAdminUser,
  requireAdminRequest,
} from "@/lib/server/admin";

function normalizeName(value) {
  return typeof value === "string" ? value.trim() : undefined;
}

function normalizePlan(value) {
  if (value == null) return undefined;
  return value === "plus" ? "plus" : "simple";
}

function normalizePassword(value) {
  if (typeof value !== "string") return undefined;
  const password = value.trim();
  if (!password) return undefined;
  if (password.length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }
  return password;
}

export async function PATCH(request, { params }) {
  const context = await requireAdminRequest(request);
  if (context.response) return context.response;

  try {
    const { userId } = await params;
    if (!userId) {
      return Response.json({ error: "Usuário inválido." }, { status: 400 });
    }

    const body = await request.json();
    const fullName = normalizeName(body?.fullName);
    const plan = normalizePlan(body?.plan);
    const password = normalizePassword(body?.password);
    const confirmEmail = body?.emailConfirmed === true;

    const adminUpdates = {};
    if (fullName !== undefined) {
      adminUpdates.user_metadata = { full_name: fullName };
    }
    if (password) {
      adminUpdates.password = password;
    }
    if (confirmEmail) {
      adminUpdates.email_confirm = true;
    }

    if (Object.keys(adminUpdates).length > 0) {
      const { error } = await context.serviceSupabase.auth.admin.updateUserById(userId, adminUpdates);
      if (error) throw new Error(error.message);
    }

    const profile = await ensureProfile(context.serviceSupabase, userId, {
      ...(fullName !== undefined ? { full_name: fullName } : {}),
      ...(plan !== undefined ? { plan } : {}),
    });

    const authUser = await getAuthUserById(context.serviceSupabase, userId);
    if (!authUser) {
      return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    return Response.json({
      updated: true,
      user: mapAdminUser(authUser, profile),
    });
  } catch (error) {
    return Response.json({ error: error.message || "Falha ao atualizar usuário." }, { status: 500 });
  }
}
