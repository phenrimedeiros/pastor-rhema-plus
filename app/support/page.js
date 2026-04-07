"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/supabase_client";
import { T } from "@/lib/tokens";
import { Btn, Card, Notice } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useIsMobile } from "@/lib/useIsMobile";

const STATUS_LABEL = { open: "Aberto", in_progress: "Em andamento", closed: "Resolvido" };
const STATUS_COLOR = {
  open: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  in_progress: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  closed: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLOR[status] || STATUS_COLOR.open;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontFamily: T.fontSans,
    }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function NewTicketForm({ onSuccess, onCancel, token }) {
  const isMobile = useIsMobile();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(data.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: ".04em", fontFamily: T.fontSans }}>
          Assunto
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex: Não consigo acessar o Sermon Builder"
          required
          style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${T.line}`, borderRadius: "12px", fontSize: "14px", fontFamily: T.fontSans, outline: "none", boxSizing: "border-box" }}
        />
      </div>
      <div>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 700, color: T.text, textTransform: "uppercase", letterSpacing: ".04em", fontFamily: T.fontSans }}>
          Mensagem
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Descreva sua dúvida ou problema com detalhes..."
          rows={5}
          required
          style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${T.line}`, borderRadius: "12px", fontSize: "14px", fontFamily: T.fontSans, outline: "none", resize: "vertical", boxSizing: "border-box" }}
        />
      </div>
      {error && <Notice color="red">{error}</Notice>}
      <div style={{ display: "flex", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
        <Btn type="submit" disabled={loading || !subject.trim() || !message.trim()} style={isMobile ? { width: "100%" } : undefined}>
          {loading ? "Enviando..." : "Abrir Ticket"}
        </Btn>
        <Btn variant="secondary" type="button" onClick={onCancel} style={isMobile ? { width: "100%" } : undefined}>Cancelar</Btn>
      </div>
    </form>
  );
}

function TicketThread({ ticket, token }) {
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    setLoading(true);
    fetch(`/api/support/tickets/${ticket.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .finally(() => setLoading(false));
  }, [ticket, token]);

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketId: ticket.id, content: reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((prev) => [...prev, data.message]);
      setReply("");
    } finally {
      setSending(false);
    }
  };

  if (!ticket) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.muted, fontFamily: T.fontSans, fontSize: "14px" }}>
      Selecione um ticket para ver a conversa
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ marginBottom: "16px", paddingBottom: "14px", borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
          <h4 style={{ margin: "0 0 6px", fontFamily: T.font, fontSize: "17px", color: T.primary }}>{ticket.subject}</h4>
          <StatusBadge status={ticket.status} />
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: T.muted, fontFamily: T.fontSans }}>
          Aberto em {new Date(ticket.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        {loading ? (
          <p style={{ color: T.muted, fontFamily: T.fontSans, fontSize: "14px" }}>Carregando...</p>
        ) : messages.map((msg) => {
          const isAdmin = msg.sender_type === "admin";
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isAdmin ? "flex-start" : "flex-end" }}>
              <div style={{
                maxWidth: isMobile ? "90%" : "80%", padding: isMobile ? "13px 14px" : "12px 16px",
                borderRadius: isAdmin ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                background: isAdmin ? "#fff" : `linear-gradient(135deg, ${T.primary}, #163d7a)`,
                color: isAdmin ? T.text : "#fff",
                border: isAdmin ? `1px solid ${T.line}` : "none",
                fontSize: "14px", lineHeight: 1.65, fontFamily: T.fontSans,
                boxShadow: T.shadow,
              }}>
                {isAdmin && (
                  <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: T.gold }}>Suporte Rhema</p>
                )}
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                <p style={{ margin: "6px 0 0", fontSize: "11px", opacity: 0.6 }}>
                  {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {ticket.status !== "closed" && (
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexDirection: isMobile ? "column" : "row" }}>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Escreva sua resposta..."
            rows={3}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            style={{ flex: 1, width: "100%", padding: "12px 14px", border: `1.5px solid ${T.line}`, borderRadius: "14px", fontSize: "14px", fontFamily: T.fontSans, resize: "none", outline: "none", boxSizing: "border-box" }}
          />
          <Btn onClick={sendReply} disabled={sending || !reply.trim()} style={isMobile ? { width: "100%" } : { alignSelf: "stretch", padding: "12px 18px" }}>
            {sending ? "..." : "Enviar"}
          </Btn>
        </div>
      )}
      {ticket.status === "closed" && (
        <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#166534", fontFamily: T.fontSans }}>Este ticket foi resolvido e encerrado.</p>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const [profile, setProfile] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }
      setToken(session.access_token);
      setProfile({ full_name: session.user?.user_metadata?.full_name, plan: session.user?.app_metadata?.plan });

      const res = await fetch("/api/support/tickets", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setTickets(data.tickets || []);
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewTicket = (ticket) => {
    setTickets((prev) => [{ ...ticket, support_messages: [] }, ...prev]);
    setSelectedTicket(ticket);
    setShowNewForm(false);
  };

  return (
    <AppLayout profile={profile}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "340px 1fr", gap: isMobile ? "16px" : "22px", minHeight: isMobile ? "auto" : "calc(100vh - 80px)" }}>

        {/* Left — ticket list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: "11px", color: T.gold, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: T.fontSans }}>
                Atendimento
              </p>
              <h2 style={{ margin: "0 0 2px", fontSize: "20px", fontFamily: T.font, color: T.primary }}>Suporte</h2>
              <p style={{ margin: 0, fontSize: "13px", color: T.muted, fontFamily: T.fontSans }}>Seus tickets de atendimento</p>
            </div>
            <Btn onClick={() => { setShowNewForm(true); setSelectedTicket(null); }} style={{ fontSize: "13px", padding: "8px 14px", width: isMobile ? "100%" : "auto" }}>
              + Novo
            </Btn>
          </div>

          <div style={{ flex: 1, overflowY: isMobile ? "visible" : "auto", display: "flex", flexDirection: "column", gap: "8px", maxHeight: isMobile ? "none" : "100%" }}>
            {!loading && tickets.length > 0 && isMobile && (
              <div style={{
                padding: "12px 14px",
                borderRadius: "16px",
                background: "#fff",
                border: `1px solid ${T.line}`,
              }}>
                <p style={{ margin: "0 0 3px", fontSize: "12px", color: T.muted, fontFamily: T.fontSans }}>
                  Tickets ativos
                </p>
                <p style={{ margin: 0, fontSize: "16px", color: T.primary, fontWeight: 800, fontFamily: T.fontSans }}>
                  {tickets.filter((t) => t.status !== "closed").length} em aberto ou andamento
                </p>
              </div>
            )}
            {loading ? (
              <p style={{ color: T.muted, fontFamily: T.fontSans, fontSize: "14px" }}>Carregando...</p>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontFamily: T.fontSans, fontSize: "14px" }}>
                <p style={{ fontSize: "32px", marginBottom: "10px" }}>🎧</p>
                <p>Nenhum ticket aberto ainda.</p>
              </div>
            ) : tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => { setSelectedTicket(t); setShowNewForm(false); }}
                style={{
                  padding: "14px 16px", borderRadius: "16px", cursor: "pointer",
                  border: `1.5px solid ${selectedTicket?.id === t.id ? T.primary : T.line}`,
                  background: selectedTicket?.id === t.id ? "#eff6ff" : "#fff",
                  transition: ".12s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: T.text, fontFamily: T.fontSans, flex: 1, paddingRight: "8px" }}>{t.subject}</p>
                  <StatusBadge status={t.status} />
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: T.muted, fontFamily: T.fontSans }}>
                  {new Date(t.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — thread or new form */}
        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: isMobile ? "60vh" : "auto" }}>
          {showNewForm ? (
            <div>
              <h4 style={{ margin: "0 0 20px", fontFamily: T.font, fontSize: "18px", color: T.primary }}>Abrir Novo Ticket</h4>
              <NewTicketForm token={token} onSuccess={handleNewTicket} onCancel={() => setShowNewForm(false)} />
            </div>
          ) : (
            <TicketThread ticket={selectedTicket} token={token} />
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
