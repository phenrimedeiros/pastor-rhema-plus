"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, supabase } from "@/lib/supabase_client";
import { T } from "@/lib/tokens";
import { Btn } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/lib/i18n";
import { useIsMobile } from "@/lib/useIsMobile";

const DAILY_LIMIT = 20;

function Message({ msg }) {
  const isMobile = useIsMobile();
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
        maxWidth: isMobile ? "88%" : "72%",
        padding: isMobile ? "13px 14px" : "12px 16px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser
          ? `linear-gradient(135deg, ${T.primary}, ${T.primary2})`
          : "#fff",
        color: isUser ? "#fff" : T.text,
        border: isUser ? "none" : `1px solid ${T.line}`,
        fontSize: isMobile ? "14.5px" : "14px",
        lineHeight: 1.72,
        fontFamily: T.fontSans,
        whiteSpace: "pre-wrap",
        boxShadow: T.shadow,
        transition: "transform .18s ease, box-shadow .18s ease",
      }}>
        {msg.content}
      </div>
    </div>
  );
}

function LimitBar({ used, limit, t }) {
  const pct = Math.min((used / limit) * 100, 100);
  const remaining = limit - used;
  const isLow = remaining <= 5;

  return (
    <div style={{
      padding: "10px 16px",
      background: isLow ? "#fef2f2" : T.surface2,
      border: `1px solid ${isLow ? "#fecaca" : T.line}`,
      borderRadius: "12px", marginBottom: "12px",
      boxShadow: isLow ? "0 8px 24px rgba(185,28,28,.08)" : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "12px", color: isLow ? "#b91c1c" : T.muted, fontFamily: T.fontSans, fontWeight: 600 }}>
          {remaining > 0
            ? `${remaining} de ${limit} ${t("chat_limit_bar")}`
            : t("chat_limit_zero")}
        </span>
        {remaining <= 5 && remaining > 0 && (
          <span style={{ fontSize: "11px", color: "#b91c1c", fontFamily: T.fontSans }}>
            {t("chat_limit_low")}
          </span>
        )}
      </div>
      <div style={{ height: 4, background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "999px", width: `${pct}%`,
          background: isLow
            ? "linear-gradient(90deg, #ef4444, #b91c1c)"
            : `linear-gradient(90deg, ${T.primary}, ${T.primary2})`,
          transition: "width .4s ease",
        }} />
      </div>
    </div>
  );
}

function UpgradePrompt({ router, t }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 20px", background: "#fef2f2", borderRadius: "16px", border: "1px solid #fecaca" }}>
      <div style={{ fontSize: "32px", marginBottom: "10px" }}>⏰</div>
      <h4 style={{ margin: "0 0 8px", fontFamily: T.font, fontSize: "18px", color: T.primary }}>
        {t("chat_limit_title")}
      </h4>
      <p style={{ margin: "0 0 18px", fontSize: "13px", color: T.muted, fontFamily: T.fontSans, lineHeight: 1.65 }}>
        {t("chat_limit_desc")}
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        <Btn onClick={() => window.open("mailto:contato@pastorrhema.com?subject=Upgrade%20para%20Plus", "_blank")}>
          {t("chat_upgrade_btn")}
        </Btn>
        <Btn variant="secondary" onClick={() => router.push("/dashboard")}>
          {t("chat_home_btn")}
        </Btn>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState(null);
  const [isSimple, setIsSimple] = useState(false);
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [messages, setMessages] = useState([
    { role: "assistant", content: null },
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
        .select("plan, chat_messages_today, chat_messages_reset_date")
        .eq("id", user.id)
        .single();

      const plan = profileData?.plan || "simple";
      const simple = plan === "simple";
      setProfile({ full_name: user?.user_metadata?.full_name, plan });
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

  const clearChat = () => setMessages([{ role: "assistant", content: null }]);

  if (authLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0b2a5b, #163d7a)" }}>
      <div style={{ color: "white", fontFamily: T.fontSans }}>Loading...</div>
    </div>
  );

  return (
    <AppLayout profile={profile}>
      <div style={{ display: "flex", flexDirection: "column", minHeight: isMobile ? "auto" : "calc(100vh - 80px)", maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", gap: "12px", marginBottom: "16px" }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: "11px", color: T.gold, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: T.fontSans }}>
              AI Assistant
            </p>
            <h2 style={{ margin: 0, fontSize: "22px", fontFamily: T.font, color: T.primary }}>
              {t("chat_title")}
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: T.muted, fontFamily: T.fontSans }}>
              {t("chat_subtitle")}
            </p>
          </div>
          <Btn variant="secondary" onClick={clearChat} style={{ fontSize: "13px", padding: "8px 14px", width: isMobile ? "100%" : "auto" }}>
            {t("chat_new")}
          </Btn>
        </div>

        {/* Daily limit bar — Simple users only */}
        {isSimple && (
          <LimitBar used={messagesUsed} limit={DAILY_LIMIT} t={t} />
        )}

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: isMobile ? "16px" : "20px",
          background: T.surface2, borderRadius: "20px",
          border: `1px solid ${T.line}`, marginBottom: "16px", minHeight: isMobile ? "48vh" : 0,
        }}>
          {isMobile && messages.length <= 1 && !loading && (
            <div style={{
              marginBottom: "14px",
              padding: "14px",
              borderRadius: "16px",
              background: "#fff",
              border: `1px solid ${T.line}`,
            }}>
              <p style={{ margin: "0 0 6px", fontSize: "12px", color: T.primary, fontWeight: 800, fontFamily: T.fontSans }}>
                Sugestao para comecar
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: T.muted, lineHeight: 1.6, fontFamily: T.fontSans }}>
                Peça um esboço, uma aplicação prática ou uma ilustração baseada no texto bíblico da semana.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <Message key={i} msg={{ ...msg, content: msg.content ?? t("chat_welcome") }} />
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
          <UpgradePrompt router={router} t={t} />
        ) : (
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexDirection: isMobile ? "column" : "row" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chat_placeholder")}
              rows={3}
              style={{
                flex: 1, width: "100%", padding: "14px 16px", border: `1px solid ${T.line}`,
                borderRadius: "16px", fontSize: "14px", fontFamily: T.fontSans,
                resize: "none", outline: "none", background: "#fff",
                lineHeight: 1.5, color: T.text, boxSizing: "border-box",
              }}
            />
            <Btn onClick={send} disabled={loading || !input.trim()} style={isMobile ? { width: "100%" } : { padding: "14px 20px", alignSelf: "stretch" }}>
              {t("chat_send")}
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
