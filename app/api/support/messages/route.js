import { createClient } from "@supabase/supabase-js";

function makeClient(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

// POST /api/support/messages — send message to ticket
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

  const { ticketId, content } = body;
  if (!ticketId || !content?.trim()) {
    return Response.json({ error: "ticketId e content são obrigatórios" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles").select("is_admin").eq("id", user.id).single();

  const senderType = profile?.is_admin ? "admin" : "user";

  const { data: message, error } = await supabase
    .from("support_messages")
    .insert({ ticket_id: ticketId, sender_type: senderType, content: content.trim() })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Update ticket updated_at so it bubbles to top of list
  await supabase
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  return Response.json({ message });
}
