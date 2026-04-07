"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, supabase } from "@/lib/supabase_client";
import { T } from "@/lib/tokens";
import { Btn } from "@/components/ui";
import AppLayout from "@/components/AppLayout";

const WELCOME = "Hi, I'm Pastor Rhema. What are you preparing today — a sermon, a Bible study, or help with a specific passage?";
const DAILY_LIMIT = 20;

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: "16px",
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "10px", flexShrink: 0,
          background: `linear-gradient(135deg, ${T.primary}, ${T.primary2})`,
          display: "grid", placeItems: "center",
          color: T.gold, fontSize: "14px", fontWeight: 900,
          marginRight: "10px", alignSelf: "flex-end",
        }}>R</div>
      )}
      <div style={{
        maxWidth: "72%",
        padding: "12px 16px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? `linear-gradient(135deg, ${T.primary}, ${T.primary2})`
          : "#fff",
        color: isUser ? "#fff" : T.text,
        border: isUser ? "none" : `1px solid ${T.line}`,
        fontSize: "14px",
        lineHeight: 1.65,
        fontFamily: T.fontSans,
        whiteSpace: "pre-wrap",
        boxShadow: T.shadow,
      }}>
        {msg.content}
      </div>
    </div>
  );
}

function LimitBar({ used, limit }) {
  const pct = Math.min((used / limit) * 100, 100);
  const remaining = limit - used;
  const isLow = remaining <= 5;

  return (
    <div style={{
      padding: "10px 16px",
      background: isLow ? "#fef2f2" : T.surface2,
      border: `1px solid ${isLow ? "#fecaca" : T.line}`,
      borderRadius: "12px",
      marginBottom: "12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", color: isLow ? "#b91c1c" : T.muted, fontFamily: T.fontSans, fontWeight: 600 }}>
          {remaining > 0
            ? `${remaining} de ${limit} mensagens restantes hoje`
            : "Limite diário atingido"}
        </span>
        {remaining <= 5 && remaining > 0 && (
          <span style={{ fontSize: "11px", color: "#b91c1c", fontFamily: T.fontSans }}>
            Poucas mensagens restantes
          </span>
        )}
      </div>
      <div style={{ height: 4, background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "999px",
          width: `${pct}%`,
          background: isLow
            ? "linear-gradient(90deg, #ef4444, #b91c1c)"
            : `linear-gradient(90deg, ${T.primary}, ${T.primary2})`,
          transition: "width .4s ease",
        }} />
      </div>
    </div>
  );
}

function UpgradePrompt({ router }) {
  return (
    <div style={{
      textAlign: "center", padding: "28px 20px",
      background: "#fef2f2", borderRadius: "16px",
      border: "1px solid #fecaca",
    }}>
      <div style={{ fontSize: "32px", marginBottom: "10px" }}>⏰</div>
      <h4 style={{ margin: "0 0 8px", fontFamily: T.font, fontSize: "18px", color: T.primary }}>
        Limite diário atingido
      </h4>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: T.muted, fontFamily: T.fontSans, lineHeight: 1.65 }}>
        Você usou suas 20 mensagens de hoje no plano Simple.<br />
        Volte amanhã ou faça upgrade para conversar sem limites.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        <Btn
          onClick={() => window.open("mailto:contato@pastorrhema.com?subject=Upgrade%20para%20Plus", "_blank")}
        >
          Fazer Upgrade →
        </Btn>
        <Btn variant="secondary" onClick={() => router.push("/dashboard")}>
          Voltar ao início
        </Btn>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [profile, setProfile] = useState(null);
  const [isSimple, setIsSimple] = useState(false);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messages, setMessages] = useState([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const bottomRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const session = await auth.getSession();
      if (!session) { router.push("/login"); return; }

      const user = session.user;

      // Load plan and daily usage
      const { data: profileData } = await supabase
        .from("profiles")
        .select("plan, is_admin, chat_messages_today, chat_messages_reset_date")
        .eq("id", user.id)
        .single();

      const plan = profileData?.plan || "simple";
      const simple = plan === "simple";
      setProfile({ full_name: user?.user_metadata?.full_name, plan, is_admin: profileData?.is_admin });
      setIsSimple(simple);

      if (simple) {
        const today = new Date().toISOString().split("T")[0];
        const resetDate = profileData?.chat_messages_reset_date;
        const count = resetDate === today ? (profileData?.chat_messages_today || 0) : 0;
        setMessagesUsed(count);
      }

      setAuthLoading(false);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const limitReached = isSimple && messagesUsed >= DAILY_LIMIT;

  const send = async () => {
    const text = input.trim();
    if (!text || loading || limitReached) return;

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const session = await auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.slice(-20).map(({ role, content }) => ({ role, content })),
        }),
      });

      const text2 = await res.text();
      let data;
      try { data = JSON.parse(text2); } catch {
        throw new Error("Resposta inválida do servidor");
      }

      if (res.status === 429 && data?.error === "limit_reached") {
        setMessagesUsed(DAILY_LIMIT);
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      if (isSimple && data.messagesLeft !== undefined) {
        setMessagesUsed(DAILY_LIMIT - data.messagesLeft);
      }
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: `⚠️ ${err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => setMessages([{ role: "assistant", content: WELCOME }]);

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
      <div style={{ color: "white", fontFamily: T.fontSans }}>Loading...</div>
    </div>
  );

  return (
    <AppLayout profile={profile}>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "22px", fontFamily: T.font, color: T.primary }}>
              Pastor Rhema
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: T.muted, fontFamily: T.fontSans }}>
              Your AI pastoral assistant — sermons, Bible study, series planning
            </p>
          </div>
          <Btn variant="secondary" onClick={clearChat} style={{ fontSize: "13px", padding: "8px 14px" }}>
            New Chat
          </Btn>
        </div>

        {/* Daily limit bar — Simple users only */}
        {isSimple && (
          <LimitBar used={messagesUsed} limit={DAILY_LIMIT} />
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "20px",
          background: T.surface2, borderRadius: "20px",
          border: `1px solid ${T.line}`, marginBottom: "16px",
        }}>
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{
                width: 32, height: 32, borderRadius: "10px",
                background: `linear-gradient(135deg, ${T.primary}, ${T.primary2})`,
                display: "grid", placeItems: "center",
                color: T.gold, fontSize: "14px", fontWeight: 900,
              }}>R</div>
              <div style={{ display: "flex", gap: "4px" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: T.muted,
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input or upgrade prompt */}
        {limitReached ? (
          <UpgradePrompt router={router} />
        ) : (
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a sermon, passage, or series plan... (Enter to send)"
              rows={3}
              style={{
                flex: 1, padding: "14px 16px", border: `1px solid ${T.line}`,
                borderRadius: "16px", fontSize: "14px", fontFamily: T.fontSans,
                resize: "none", outline: "none", background: "#fff",
                lineHeight: 1.5, color: T.text,
              }}
            />
            <Btn onClick={send} disabled={loading || !input.trim()} style={{ padding: "14px 20px", alignSelf: "stretch" }}>
              Send
            </Btn>
          </div>
        )}

        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-6px); opacity: 1; }
          }
        `}</style>
      </div>
    </AppLayout>
  );
}
