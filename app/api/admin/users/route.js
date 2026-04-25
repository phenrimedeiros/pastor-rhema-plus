import {
  DISABLED_USER_BAN_DURATION,
  ensureProfile,
  findAuthUserByEmail,
  getProfileByUserId,
  isAdminEmail,
  mapAdminUser,
  requireAdminRequest,
} from "@/lib/server/admin";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || "").trim();
}

function normalizePlan(value) {
  return value === "plus" ? "plus" : "simple";
}

function validatePassword(password, required = false) {
  const normalized = String(password || "").trim();
  if (!normalized && !required) return "";
  if (normalized.length < 6) {
    throw new Error("A senha precisa ter pelo menos 6 caracteres.");
  }
  return normalized;
}

export async function GET(request) {
  const context = await requireAdminRequest(request);
  if (context.response) return context.response;

  try {
    const { searchParams } = new URL(request.url);
    const email = normalizeEmail(searchParams.get("email"));
    if (!email) {
      return Response.json({ error: "Informe um email para pesquisar." }, { status: 400 });
    }

    const authUser = await findAuthUserByEmail(context.serviceSupabase, email);
    if (!authUser) {
      return Response.json({ found: false, email });
    }

    let profile = await getProfileByUserId(context.serviceSupabase, authUser.id);
    if (!profile) {
      profile = await ensureProfile(context.serviceSupabase, authUser.id, {
        full_name: authUser.user_metadata?.full_name || null,
      });
    }

    return Response.json({
      found: true,
      user: mapAdminUser(authUser, profile),
    });
  } catch (error) {
    return Response.json({ error: error.message || "Falha ao buscar usuário." }, { status: 500 });
  }
}

export async function POST(request) {
  const context = await requireAdminRequest(request);
  if (context.response) return context.response;

  try {
    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const fullName = normalizeName(body?.fullName);
    const plan = normalizePlan(body?.plan);
    const password = validatePassword(body?.password, false) || "rhema123";
    const emailConfirmed = body?.emailConfirmed === true;
    const accessEnabled = body?.accessEnabled !== false;

    if (!email) {
      return Response.json({ error: "Informe um email válido." }, { status: 400 });
    }

    if (!accessEnabled && isAdminEmail(email)) {
      return Response.json({ error: "Não é possível desabilitar um administrador." }, { status: 400 });
    }

    const existing = await findAuthUserByEmail(context.serviceSupabase, email);
    if (existing) {
      return Response.json({ error: "Já existe um usuário com esse email." }, { status: 409 });
    }

    const attributes = {
      email,
      password,
      email_confirm: emailConfirmed,
    };

    if (fullName) {
      attributes.user_metadata = { full_name: fullName };
    }

    const { data, error } = await context.serviceSupabase.auth.admin.createUser(attributes);
    if (error) throw new Error(error.message);

    const authUser = data?.user;
    if (!authUser) throw new Error("Supabase não retornou o usuário criado.");

    let currentAuthUser = authUser;
    if (!accessEnabled) {
      const { data: disabledData, error: disabledError } = await context.serviceSupabase.auth.admin.updateUserById(
        authUser.id,
        { ban_duration: DISABLED_USER_BAN_DURATION }
      );
      if (disabledError) throw new Error(disabledError.message);
      currentAuthUser = disabledData?.user || authUser;
    }

    const profile = await ensureProfile(context.serviceSupabase, authUser.id, {
      full_name: fullName || authUser.user_metadata?.full_name || null,
      plan,
    });

    return Response.json({
      created: true,
      user: mapAdminUser(currentAuthUser, profile),
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message || "Falha ao criar usuário." }, { status: 500 });
  }
}
