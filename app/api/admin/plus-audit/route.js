import { requireAdminRequest } from "@/lib/server/admin";
import { createClient } from "@supabase/supabase-js";

function createServiceRoleSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function parseEmails(raw) {
  return [...new Set(
    String(raw || "")
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"))
  )];
}

export async function POST(request) {
  const context = await requireAdminRequest(request);
  if (context.response) return context.response;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Payload inválido." }, { status: 400 });
  }

  const emails = parseEmails(body?.emails);
  const shouldFix = body?.fix === true;

  if (emails.length === 0) {
    return Response.json({ error: "Nenhum email válido encontrado." }, { status: 400 });
  }

  if (emails.length > 500) {
    return Response.json({ error: "Limite de 500 emails por consulta." }, { status: 400 });
  }

  const supabase = createServiceRoleSupabase();

  // Carrega todos os usuários paginando
  const allUsers = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    allUsers.push(...(data?.users || []));
    if ((data?.users || []).length < 1000) break;
    page++;
  }

  const emailToUser = {};
  for (const u of allUsers) {
    if (u.email) emailToUser[u.email.toLowerCase()] = u;
  }

  // Carrega todos os profiles
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, plan, full_name");
  if (pErr) return Response.json({ error: pErr.message }, { status: 500 });

  const profileMap = {};
  for (const p of profiles) profileMap[p.id] = p;

  const results = [];
  const toFix = [];

  for (const email of emails) {
    const user = emailToUser[email];

    if (!user) {
      results.push({ email, status: "no_account", plan: null, name: null });
      continue;
    }

    const profile = profileMap[user.id];
    const plan = profile?.plan || "simple";
    const name = profile?.full_name || user.user_metadata?.full_name || null;

    if (plan === "plus") {
      results.push({ email, status: "ok", plan: "plus", name });
    } else {
      results.push({ email, status: "needs_fix", plan, name });
      toFix.push(user.id);
    }
  }

  let fixed = 0;
  let fixErrors = 0;

  if (shouldFix && toFix.length > 0) {
    for (const userId of toFix) {
      const { error } = await supabase
        .from("profiles")
        .update({ plan: "plus" })
        .eq("id", userId);

      if (error) {
        fixErrors++;
      } else {
        fixed++;
      }
    }

    if (fixed > 0) {
      for (const result of results) {
        if (result.status === "needs_fix") {
          result.status = "fixed";
          result.plan = "plus";
        }
      }
    }
  }

  const stats = {
    total: results.length,
    plus: results.filter((r) => r.status === "ok").length,
    needsFix: results.filter((r) => r.status === "needs_fix").length,
    fixed,
    fixErrors,
    noAccount: results.filter((r) => r.status === "no_account").length,
  };

  return Response.json({ results, stats });
}
