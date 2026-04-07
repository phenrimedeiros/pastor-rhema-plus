import { createClient } from "@supabase/supabase-js";

function makeClient(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// GET /api/support/tickets/[id] — ticket + messages
export async function GET(request, { params }) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = makeClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .select(`*, profiles:user_id (full_name, plan)`)
    .eq("id", params.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const { data: messages, error: msgError } = await supabase
    .from("support_messages")
    .select("*")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  if (msgError) return Response.json({ error: msgError.message }, { status: 500 });

  return Response.json({ ticket, messages });
}

// PATCH /api/support/tickets/[id] — update status (admin only)
export async function PATCH(request, { params }) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = makeClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return Response.json({ error: "Sem permissão" }, { status: 403 });

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const { status } = body;
  if (!["open", "in_progress", "closed"].includes(status)) {
    return Response.json({ error: "Status inválido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ticket: data });
}
