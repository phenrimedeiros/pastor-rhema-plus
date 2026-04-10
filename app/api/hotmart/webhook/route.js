import { createClient } from "@supabase/supabase-js";

// Eventos da Hotmart que indicam compra aprovada/concluída
const PURCHASE_EVENTS = ["PURCHASE_COMPLETE", "PURCHASE_APPROVED", "PURCHASE_OUT_OF_SHOPPING_CART"];

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
  const email = body?.data?.buyer?.email?.toLowerCase().trim();
  const buyerName = body?.data?.buyer?.name || "";

  // Ignora eventos que não são de compra aprovada
  if (!PURCHASE_EVENTS.includes(event)) {
    return Response.json({ ok: true, skipped: true, event });
  }

  if (!email) {
    console.error("[Hotmart Webhook] Email do comprador não encontrado no payload:", JSON.stringify(body?.data?.buyer));
    return Response.json({ error: "Buyer email not found" }, { status: 400 });
  }

  // Client com Service Role para operações admin
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verifica se usuário já existe via tabela auth.users
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const alreadyExists = existingUsers?.users?.some((u) => u.email === email);

  if (alreadyExists) {
    console.log(`[Hotmart Webhook] Usuário já existe: ${email}`);
    return Response.json({ ok: true, existing: true });
  }

  // Cria usuário via convite — Supabase envia email para o comprador definir a senha
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    data: {
      full_name: buyerName,
      hotmart_purchase: true,
    },
  });

  if (error) {
    // Se o erro for "User already registered", trata como sucesso
    if (error.message?.includes("already") || error.message?.includes("registered")) {
      return Response.json({ ok: true, existing: true });
    }
    console.error("[Hotmart Webhook] Erro ao convidar usuário:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  console.log(`[Hotmart Webhook] Usuário criado com sucesso: ${email} (id: ${data?.user?.id})`);
  return Response.json({ ok: true, invited: true, userId: data?.user?.id });
}
