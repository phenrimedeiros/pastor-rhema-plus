import { createClient } from "@supabase/supabase-js";

function makeClient(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// GET /api/support/tickets — list tickets (own for users, all for admins)
export async function GET(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = makeClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  let query = supabase
    .from("support_tickets")
    .select(`
      id, subject, status, created_at, updated_at, user_id,
      profiles:user_id (full_name),
      support_messages (id)
    `)
    .order("updated_at", { ascending: false });

  if (!profile?.is_admin) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ tickets: data });
}

// POST /api/support/tickets — create ticket + first message
export async function POST(request) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const supabase = makeClient(token);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: "Sessão inválida" }, { status: 401 });

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Body inválido" }, { status: 400 });
  }

  const { subject, message } = body;
  if (!subject?.trim() || !message?.trim()) {
    return Response.json({ error: "Assunto e mensagem são obrigatórios" }, { status: 400 });
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({ user_id: user.id, subject: subject.trim() })
    .select()
    .single();

  if (ticketError) return Response.json({ error: ticketError.message }, { status: 500 });

  const { error: msgError } = await supabase
    .from("support_messages")
    .insert({ ticket_id: ticket.id, sender_type: "user", content: message.trim() });

  if (msgError) return Response.json({ error: msgError.message }, { status: 500 });

  return Response.json({ ticket });
}
