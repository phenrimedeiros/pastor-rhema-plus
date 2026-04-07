"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/supabase_client";
import { T } from "@/lib/tokens";
import { Btn, Card } from "@/components/ui";
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
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontFamily: T.fontSans,
    }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function AdminPage() {
  const [profile, setProfile] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [token, setToken] = useState(null);
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }

      const t = session.access_token;
      setToken(t);

      // Verify admin
      const { supabase } = await import("@/lib/supabase_client");
      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("id", session.user.id).single();

      if (!profileData?.is_admin) { router.push("/dashboard"); return; }
      setProfile(profileData);

      await loadTickets(t);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTickets = async (t) => {
    setLoading(true);
    const res = await fetch("/api/support/tickets", {
      headers: { Authorization: `Bearer ${t || token}` },
    });
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  };

  const loadThread = async (ticket) => {
    setSelected(ticket);
    setMessages([]);
    const res = await fetch(`/api/support/tickets/${ticket.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMessages(data.messages || []);
  };

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ticketId: selected.id, content: reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((prev) => [...prev, data.message]);
      setReply("");
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status) => {
    const res = await fetch(`/api/support/tickets/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok) {
      setSelected(data.ticket);
      setTickets((prev) => prev.map((t) => t.id === data.ticket.id ? { ...t, status: data.ticket.status } : t));
    }
  };

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    closed: tickets.filter((t) => t.status === "closed").length,
  };

  return (
    <AppLayout profile={profile}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 2px", fontSize: "22px", fontFamily: T.font, color: T.primary }}>Painel Admin</h2>
          <p style={{ margin: 0, fontSize: "13px", color: T.muted, fontFamily: T.fontSans }}>Gerencie os tickets de suporte</p>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}>
          {[
            { key: "all", label: `Todos (${counts.all})` },
            { key: "open", label: `Abertos (${counts.open})` },
            { key: "in_progress", label: `Andamento (${counts.in_progress})` },
            { key: "closed", label: `Resolvidos (${counts.closed})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                minHeight: 40, padding: "7px 14px", borderRadius: "10px", border: `1.5px solid ${filter === f.key ? T.primary : T.line}`,
                background: filter === f.key ? T.primary : "#fff",
                color: filter === f.key ? "#fff" : T.muted,
                fontFamily: T.fontSans, fontSize: "12px", fontWeight: 700, cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "360px 1fr", gap: isMobile ? "16px" : "22px", minHeight: isMobile ? "auto" : "calc(100vh - 160px)" }}>

        {/* Left — ticket list */}
        <div style={{ overflowY: isMobile ? "visible" : "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {loading ? (
            <p style={{ color: T.muted, fontFamily: T.fontSans, fontSize: "14px" }}>Carregando...</p>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontFamily: T.fontSans }}>
              <p style={{ fontSize: "28px" }}>✅</p>
              <p style={{ fontSize: "14px" }}>Nenhum ticket nesta categoria.</p>
            </div>
          ) : filtered.map((t) => (
            <div
              key={t.id}
              onClick={() => loadThread(t)}
              style={{
                padding: "14px 16px", borderRadius: "16px", cursor: "pointer",
                border: `1.5px solid ${selected?.id === t.id ? T.primary : T.line}`,
                background: selected?.id === t.id ? "#eff6ff" : "#fff",
                transition: ".12s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: T.text, fontFamily: T.fontSans, flex: 1, paddingRight: "8px" }}>{t.subject}</p>
                <StatusBadge status={t.status} />
              </div>
              <p style={{ margin: "0 0 4px", fontSize: "12px", color: T.primary, fontFamily: T.fontSans, fontWeight: 600 }}>
                {t.profiles?.full_name || "Usuário"}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: T.muted, fontFamily: T.fontSans }}>
                {new Date(t.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))}
        </div>

        {/* Right — thread */}
        <Card style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: isMobile ? "60vh" : "auto" }}>
          {!selected ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.muted, fontFamily: T.fontSans, fontSize: "14px" }}>
              Selecione um ticket para responder
            </div>
          ) : (
            <>
              {/* Ticket header */}
              <div style={{ marginBottom: "16px", paddingBottom: "14px", borderBottom: `1px solid ${T.line}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontFamily: T.font, fontSize: "17px", color: T.primary }}>{selected.subject}</h4>
                    <p style={{ margin: 0, fontSize: "12px", color: T.muted, fontFamily: T.fontSans }}>
                      {selected.profiles?.full_name} · Aberto em {new Date(selected.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    <StatusBadge status={selected.status} />
                    {selected.status !== "in_progress" && (
                      <button onClick={() => changeStatus("in_progress")} style={{ padding: "5px 12px", borderRadius: "10px", border: `1px solid #fde68a`, background: "#fffbeb", color: "#92400e", fontFamily: T.fontSans, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                        Em andamento
                      </button>
                    )}
                    {selected.status !== "closed" && (
                      <button onClick={() => changeStatus("closed")} style={{ padding: "5px 12px", borderRadius: "10px", border: `1px solid #bbf7d0`, background: "#f0fdf4", color: "#166534", fontFamily: T.fontSans, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                        Resolver
                      </button>
                    )}
                    {selected.status === "closed" && (
                      <button onClick={() => changeStatus("open")} style={{ padding: "5px 12px", borderRadius: "10px", border: `1px solid #bfdbfe`, background: "#eff6ff", color: "#1d4ed8", fontFamily: T.fontSans, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                {messages.map((msg) => {
                  const isAdmin = msg.sender_type === "admin";
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "80%", padding: "12px 16px",
                        borderRadius: isAdmin ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isAdmin ? `linear-gradient(135deg, ${T.primary}, #163d7a)` : "#fff",
                        color: isAdmin ? "#fff" : T.text,
                        border: isAdmin ? "none" : `1px solid ${T.line}`,
                        fontSize: "14px", lineHeight: 1.65, fontFamily: T.fontSans, boxShadow: T.shadow,
                      }}>
                        {!isAdmin && (
                          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: T.primary }}>{selected.profiles?.full_name}</p>
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

              {/* Reply */}
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexDirection: isMobile ? "column" : "row" }}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Escreva sua resposta como suporte..."
                  rows={3}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  style={{ flex: 1, width: "100%", padding: "12px 14px", border: `1.5px solid ${T.line}`, borderRadius: "14px", fontSize: "14px", fontFamily: T.fontSans, resize: "none", outline: "none", boxSizing: "border-box" }}
                />
                <Btn onClick={sendReply} disabled={sending || !reply.trim()} style={isMobile ? { width: "100%" } : { alignSelf: "stretch", padding: "12px 18px" }}>
                  {sending ? "..." : "Responder"}
                </Btn>
              </div>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
