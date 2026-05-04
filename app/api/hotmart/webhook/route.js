import { createClient } from "@supabase/supabase-js";

// Eventos da Hotmart que indicam compra aprovada/concluída
const PURCHASE_EVENTS = ["PURCHASE_COMPLETE", "PURCHASE_APPROVED"];
const PLAN_CHANGE_EVENTS = ["SWITCH_PLAN", "SUBSCRIPTION_PLAN_CHANGED", "SUBSCRIPTION_PLAN_CHANGE"];
const ACCESS_EVENTS = [...PURCHASE_EVENTS, ...PLAN_CHANGE_EVENTS];
const PLAN_PRIORITY = { simple: 1, plus: 2 };

// IDs de produto na Hotmart
const PRODUCT_PLAN_MAP = {
  "7005274": "simple",
  "7535521": "plus",
};

const NESTED_PLAN_CONTAINER_KEY =
  /(product|products|prod|offer|offers|plan|plans|subscription|bump|order_bump|orderbump|upsell|upsells|item|items|line_items|lineitems|addon|add_on|additional|checkout|funnel)/i;
const DIRECT_PLAN_VALUE_KEY =
  /^(prod|off|product_id|productId|product_name|productName|offer_id|offerId|offer_code|offerCode|offer_name|offerName|plan_id|planId|plan_code|planCode|plan_name|planName)$/i;

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

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function resolvePlanFromText(value) {
  const text = normalizeText(value);
  if (!text) return null;

  if (text.includes("plus")) return "plus";
  if (text.includes("simple") || text.includes("simples")) return "simple";

  return null;
}

function hasCandidateValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function uniqueCandidates(values) {
  const seen = new Set();
  const result = [];

  for (const value of values) {
    if (!hasCandidateValue(value)) continue;

    const key = `${typeof value}:${String(value)}`;
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(value);
  }

  return result;
}

function collectNestedPlanCandidates(value, { depth = 0, parentRelevant = false } = {}, output = []) {
  if (!value || depth > 8) return output;

  if (Array.isArray(value)) {
    for (const item of value) {
      collectNestedPlanCandidates(item, { depth: depth + 1, parentRelevant }, output);
    }
    return output;
  }

  if (typeof value !== "object") return output;

  for (const [key, child] of Object.entries(value)) {
    if (!hasCandidateValue(child)) continue;

    const isRelevantContainer = NESTED_PLAN_CONTAINER_KEY.test(key);
    const isRelevantValue = parentRelevant || DIRECT_PLAN_VALUE_KEY.test(key);

    if (typeof child === "object") {
      collectNestedPlanCandidates(child, {
        depth: depth + 1,
        parentRelevant: parentRelevant || isRelevantContainer,
      }, output);
    } else if (isRelevantValue) {
      output.push(child);
    }
  }

  return output;
}

function selectHighestPriorityPlan(plans) {
  let selectedPlan = null;
  let selectedPriority = 0;

  for (const plan of plans) {
    const priority = PLAN_PRIORITY[plan] || 0;
    if (priority > selectedPriority) {
      selectedPlan = plan;
      selectedPriority = priority;
    }
  }

  return selectedPlan;
}

function resolvePlanFromCandidates(candidates, { useHighestPriority = false } = {}) {
  const mappedPlans = candidates
    .map((candidate) => PRODUCT_PLAN_MAP[String(candidate)])
    .filter(Boolean);

  if (mappedPlans.length > 0) {
    return useHighestPriority ? selectHighestPriorityPlan(mappedPlans) : mappedPlans[0];
  }

  const textPlans = candidates
    .map((candidate) => resolvePlanFromText(candidate))
    .filter(Boolean);

  if (textPlans.length > 0) {
    return useHighestPriority ? selectHighestPriorityPlan(textPlans) : textPlans[0];
  }

  return null;
}

function collectPlanCandidates(body, event) {
  const data = body?.data || {};
  const purchase = data.purchase || {};
  const subscription = data.subscription || {};
  const product = data.product || subscription.product || {};
  const offer = purchase.offer || data.offer || {};
  const plan = subscription.plan || data.plan || {};
  const newPlan = data.new_plan || data.newPlan || subscription.new_plan || subscription.newPlan || {};
  const currentSwitchPlan = Array.isArray(data.plans)
    ? data.plans.find((item) => item?.current === true) || {}
    : {};

  const planCandidates = [
    currentSwitchPlan.id,
    currentSwitchPlan.code,
    currentSwitchPlan.name,
    currentSwitchPlan.offer?.key,
    currentSwitchPlan.offer?.code,
    plan.id,
    plan.code,
    plan.name,
    plan.offer?.key,
    plan.offer?.code,
    newPlan.id,
    newPlan.code,
    newPlan.name,
    newPlan.offer?.key,
    newPlan.offer?.code,
  ];

  if (PLAN_CHANGE_EVENTS.includes(event)) {
    return uniqueCandidates(planCandidates);
  }

  return uniqueCandidates([
    ...planCandidates,
    product.id,
    product.ucode,
    product.name,
    offer.code,
    offer.id,
    offer.key,
    offer.name,
    body?.prod,
    body?.Prod,
    body?.off,
    body?.Off,
    body?.product_id,
    body?.product_name,
    body?.offer_code,
    body?.offer_name,
    ...collectNestedPlanCandidates(body),
  ]);
}

function resolvePlan(body, event) {
  const candidates = collectPlanCandidates(body, event);

  return resolvePlanFromCandidates(candidates, {
    useHighestPriority: !PLAN_CHANGE_EVENTS.includes(event),
  });
}

function resolveBuyerEmail(body) {
  return String(
    body?.data?.buyer?.email ||
    body?.data?.subscriber?.email ||
    body?.data?.subscription?.user?.email ||
    body?.email ||
    body?.Email ||
    ""
  ).trim().toLowerCase();
}

function resolveBuyerName(body) {
  return (
    body?.data?.buyer?.name ||
    body?.data?.subscriber?.name ||
    body?.name ||
    body?.Name ||
    ""
  );
}

function shouldApplyPlan(currentPlan, nextPlan, event) {
  if (!currentPlan || currentPlan === nextPlan) return true;
  if (PLAN_CHANGE_EVENTS.includes(event)) return true;

  return (PLAN_PRIORITY[nextPlan] || 0) >= (PLAN_PRIORITY[currentPlan] || 0);
}

async function setProfilePlan(supabase, authUser, { buyerName, plan, event }) {
  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, plan")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) throw profileError;

  if (!existingProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .insert([{
        id: authUser.id,
        full_name: buyerName || authUser.user_metadata?.full_name || null,
        plan,
      }])
      .select("id, full_name, plan")
      .single();

    if (error) throw error;
    return { profile: data, applied: true, createdProfile: true };
  }

  const updates = {};
  const applyPlan = shouldApplyPlan(existingProfile.plan, plan, event);

  if (applyPlan) {
    updates.plan = plan;
  }

  if (buyerName && !existingProfile.full_name) {
    updates.full_name = buyerName;
  }

  if (Object.keys(updates).length === 0) {
    return {
      profile: existingProfile,
      applied: false,
      skippedDowngrade: existingProfile.plan === "plus" && plan === "simple",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", authUser.id)
    .select("id, full_name, plan")
    .single();

  if (error) throw error;
  return {
    profile: data,
    applied: Boolean(updates.plan),
    skippedDowngrade: !applyPlan,
  };
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
  const email = resolveBuyerEmail(body);
  const buyerName = resolveBuyerName(body);
  const plan = resolvePlan(body, event);

  // Ignora eventos que não liberam ou alteram acesso
  if (!ACCESS_EVENTS.includes(event)) {
    return Response.json({ ok: true, skipped: true, event });
  }

  if (!email) {
    console.error("[Hotmart Webhook] Email do comprador não encontrado no payload:", JSON.stringify(body?.data?.buyer));
    return Response.json({ error: "Buyer email not found" }, { status: 400 });
  }

  if (!plan) {
    console.error("[Hotmart Webhook] Plano não reconhecido no payload:", JSON.stringify({
      event,
      product: body?.data?.product,
      offer: body?.data?.purchase?.offer || body?.data?.offer,
      subscription: body?.data?.subscription,
    }));
    return Response.json({ ok: true, skipped: true, reason: "unknown_plan", event });
  }

  // Client com Service Role para operações admin
  const supabase = createServiceRoleSupabase();

  // Verifica se usuário já existe — pode ser um upgrade de plano
  const existingUser = await findAuthUserByEmail(supabase, email);
  if (existingUser) {
    try {
      const result = await setProfilePlan(supabase, existingUser, { buyerName, plan, event });
      console.log(`[Hotmart Webhook] Plano '${result.profile.plan}' processado para ${email}`, {
        event,
        incomingPlan: plan,
        applied: result.applied,
        skippedDowngrade: result.skippedDowngrade || false,
      });
      return Response.json({
        ok: true,
        existing: true,
        plan: result.profile.plan,
        incomingPlan: plan,
        applied: result.applied,
        skippedDowngrade: result.skippedDowngrade || false,
      });
    } catch (updateError) {
      console.error(`[Hotmart Webhook] Erro ao atualizar plano de ${email}:`, updateError.message);
      return Response.json({ error: updateError.message }, { status: 500 });
    }
  }

  // Usuário não existe ainda. Pode ser order bump onde o webhook do Plus chegou antes
  // do webhook do Rhema base. Criamos com a senha padrão e o plano correto.
  // Se o webhook do Rhema chegar depois, ele não fará downgrade (shouldApplyPlan protege).
  if (plan === "plus") {
    console.log(`[Hotmart Webhook] Compra Plus sem usuário base para ${email} — possível order bump, criando com plano plus`);
  }

  const userMetadata = { hotmart_purchase: true };
  if (buyerName) userMetadata.full_name = buyerName;

  // Senha padrão informada no e-mail de boas-vindas da Hotmart
  const temporaryPassword = "rhema123";

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: userMetadata,
  });

  if (error) {
    // Em caso de corrida, trata usuário já registrado como sucesso idempotente
    if (error.message?.includes("already") || error.message?.includes("registered")) {
      const raceUser = await findAuthUserByEmail(supabase, email);
      if (!raceUser) {
        return Response.json({ ok: true, existing: true, pendingProfileSync: true, plan });
      }

      const result = await setProfilePlan(supabase, raceUser, { buyerName, plan, event });
      return Response.json({
        ok: true,
        existing: true,
        raceHandled: true,
        plan: result.profile.plan,
        incomingPlan: plan,
        applied: result.applied,
      });
    }
    console.error("[Hotmart Webhook] Erro ao criar usuário:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  // O trigger handle_new_user() cria o profile com plan='simple' por padrão.
  // Atualiza para o plano correto baseado no produto comprado.
  try {
    await setProfilePlan(supabase, data.user, { buyerName, plan, event });
  } catch (planError) {
    console.error(`[Hotmart Webhook] Usuário criado mas erro ao setar plano '${plan}' para ${email}:`, planError.message);
  }

  console.log(`[Hotmart Webhook] Usuário criado com plano '${plan}': ${email} (id: ${data.user.id})`);
  return Response.json({
    ok: true,
    created: true,
    plan,
    userId: data.user.id,
  });
}
