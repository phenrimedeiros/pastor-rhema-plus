import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

// Eventos da Hotmart que indicam compra aprovada/concluída
const PURCHASE_EVENTS = ["PURCHASE_COMPLETE", "PURCHASE_APPROVED", "PURCHASE_OUT_OF_SHOPPING_CART"];

// IDs de produto na Hotmart
const PRODUCT_PLAN_MAP = {
  "7005274": "simple",
  "7535521": "plus",
};

function createServiceRoleSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function findAuthUserByEmail(supabase, email) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const users = data?.users || [];
    const found = users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;

    if (users.length < 1000) return null;
    page += 1;
  }
}

function resolvePlan(productId) {
  if (!productId) return "simple";
  return PRODUCT_PLAN_MAP[String(productId)] ?? "simple";
}

export async function POST(request) {
  const expectedToken = process.env.HOTMART_WEBHOOK_TOKEN;

  if (!expectedToken) {
    console.error("[Hotmart Webhook] HOTMART_WEBHOOK_TOKEN não configurado");
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Aceita token via query string (?token=...) ou header (x-hotmart-hottok)
  const { searchParams } = new URL(request.url);
  const tokenFromUrl = searchParams.get("token");
  const tokenFromHeader = request.headers.get("x-hotmart-hottok");
  const receivedToken = tokenFromUrl || tokenFromHeader;

  if (receivedToken !== expectedToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const event = body?.event;
  const email = String(body?.data?.buyer?.email || "").trim().toLowerCase();
  const buyerName = body?.data?.buyer?.name || "";
  const productId = body?.data?.product?.id;
  const plan = resolvePlan(productId);

  // Ignora eventos que não são de compra aprovada
  if (!PURCHASE_EVENTS.includes(event)) {
    return Response.json({ ok: true, skipped: true, event });
  }

  if (!email) {
    console.error("[Hotmart Webhook] Email do comprador não encontrado no payload:", JSON.stringify(body?.data?.buyer));
    return Response.json({ error: "Buyer email not found" }, { status: 400 });
  }

  // Client com Service Role para operações admin
  const supabase = createServiceRoleSupabase();

  // Verifica se usuário já existe — pode ser um upgrade de plano
  const existingUser = await findAuthUserByEmail(supabase, email);
  if (existingUser) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ plan })
      .eq("id", existingUser.id);

    if (updateError) {
      console.error(`[Hotmart Webhook] Erro ao atualizar plano de ${email}:`, updateError.message);
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[Hotmart Webhook] Plano atualizado para '${plan}': ${email}`);
    return Response.json({ ok: true, existing: true, plan });
  }

  const userMetadata = { hotmart_purchase: true };
  if (buyerName) userMetadata.full_name = buyerName;

  // Gera senha aleatória — usuário deve redefinir via email
  const temporaryPassword = randomBytes(16).toString("hex");

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error) {
    // Em caso de corrida, trata usuário já registrado como sucesso idempotente
    if (error.message?.includes("already") || error.message?.includes("registered")) {
      return Response.json({ ok: true, existing: true });
    }
    console.error("[Hotmart Webhook] Erro ao criar usuário:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  // O trigger handle_new_user() cria o profile com plan='simple' por padrão.
  // Atualiza para o plano correto baseado no produto comprado.
  const { error: planError } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", data.user.id);

  if (planError) {
    console.error(`[Hotmart Webhook] Usuário criado mas erro ao setar plano '${plan}' para ${email}:`, planError.message);
  }

  // Envia email de redefinição de senha para o novo usuário
  await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
  });

  console.log(`[Hotmart Webhook] Usuário criado com plano '${plan}': ${email} (id: ${data.user.id})`);
  return Response.json({
    ok: true,
    created: true,
    plan,
    userId: data.user.id,
  });
}
