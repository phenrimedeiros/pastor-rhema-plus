"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, supabase } from "@/lib/supabase_client";
import { Btn } from "@/components/ui";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/lib/i18n";

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex mb-[16px] ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-[32px] h-[32px] rounded-[10px] shrink-0 bg-gradient-to-br from-brand-primary to-brand-primary-2 grid place-items-center text-brand-gold text-[14px] font-black mr-[10px] self-end">
          R
        </div>
      )}
      <div className={`max-w-[88%] md:max-w-[72%] p-[13px_14px] md:p-[12px_16px] border ${isUser ? "rounded-[18px_18px_4px_18px] bg-gradient-to-br from-brand-primary to-brand-primary-2 text-white border-transparent" : "rounded-[18px_18px_18px_4px] bg-white text-brand-text border-brand-line"} text-[14.5px] md:text-[14px] leading-[1.72] font-sans whitespace-pre-wrap shadow-brand transition-all duration-150`}>
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
    <div className={`p-[10px_16px] rounded-[12px] mb-[12px] border ${isLow ? "bg-red-50 border-red-200 shadow-[0_8px_24px_rgba(185,28,28,.08)]" : "bg-brand-surface-2 border-brand-line shadow-none"}`}>
      <div className="flex justify-between items-center mb-[6px]">
        <span className={`text-[12px] font-semibold font-sans ${isLow ? "text-red-700" : "text-brand-muted"}`}>
          {remaining > 0
            ? `${remaining} de ${limit} ${t("chat_limit_bar")}`
            : t("chat_limit_zero")}
        </span>
        {remaining <= 5 && remaining > 0 && (
          <span className="text-[11px] text-red-700 font-sans">
            {t("chat_limit_low")}
          </span>
        )}
      </div>
      <div className="h-[4px] bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-400 ${isLow ? "bg-gradient-to-r from-red-500 to-red-700" : "bg-gradient-to-r from-brand-primary to-brand-primary-2"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function UpgradePrompt({ router, t }) {
  return (
    <div className="text-center p-[28px_20px] bg-red-50 rounded-[16px] border border-red-200">
      <div className="text-[32px] mb-[10px]">⏰</div>
      <h4 className="m-0 mb-[8px] font-serif text-[18px] text-brand-primary">
        {t("chat_limit_title")}
      </h4>
      <p className="m-0 mb-[18px] text-[13px] text-brand-muted font-sans leading-[1.65]">
        {t("chat_limit_desc")}
      </p>
      <div className="flex gap-[10px] justify-center flex-wrap">
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
  const [profile, setProfile] = useState(null);
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

      setProfile({ full_name: user?.user_metadata?.full_name });
      setAuthLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

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
          messages: updatedMessages.slice(-20).filter(({ content }) => content !== null).map(({ role, content }) => ({ role, content })),
        }),
      });

      const text2 = await res.text();
      let data;
      try { data = JSON.parse(text2); } catch {
        throw new Error("Resposta inválida do servidor");
      }

      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
      <div className="text-white font-sans">Loading...</div>
    </div>
  );

  return (
    <AppLayout profile={profile}>
      <div className="flex flex-col min-h-[auto] md:min-h-[calc(100vh-80px)] max-w-[800px] mx-auto">

        {/* Header */}
        <div className="flex justify-between items-stretch md:items-center flex-col md:flex-row gap-[12px] mb-[16px]">
          <div>
            <p className="m-0 mb-[4px] text-[11px] text-brand-gold font-extrabold tracking-[.08em] uppercase font-sans">
              AI Assistant
            </p>
            <h2 className="m-0 text-[22px] font-serif text-brand-primary">
              {t("chat_title")}
            </h2>
            <p className="m-0 text-[13px] text-brand-muted font-sans">
              {t("chat_subtitle")}
            </p>
          </div>
          <Btn variant="secondary" onClick={clearChat} className="text-[13px] p-[8px_14px] w-full md:w-auto">
            {t("chat_new")}
          </Btn>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-[16px] md:p-[20px] bg-brand-surface-2 rounded-[20px] border border-brand-line mb-[16px] min-h-[48vh] md:min-h-0">
          <div className="md:hidden">
            {messages.length <= 1 && !loading && (
              <div className="mb-[14px] p-[14px] rounded-[16px] bg-white border border-brand-line">
                <p className="m-0 mb-[6px] text-[12px] text-brand-primary font-extrabold font-sans">
                  Sugestao para comecar
                </p>
                <p className="m-0 text-[13px] text-brand-muted leading-[1.6] font-sans">
                  Peça um esboço, uma aplicação prática ou uma ilustração baseada no texto bíblico da semana.
                </p>
              </div>
            )}
          </div>
          {messages.map((msg, i) => (
            <Message key={i} msg={{ ...msg, content: msg.content ?? t("chat_welcome") }} />
          ))}

          {loading && (
            <div className="flex items-center gap-[10px] mb-[16px]">
              <div className="w-[32px] h-[32px] rounded-[10px] bg-gradient-to-br from-brand-primary to-brand-primary-2 grid place-items-center text-brand-gold text-[14px] font-black">
                R
              </div>
              <div className="flex gap-[4px]">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-[8px] h-[8px] rounded-full bg-brand-muted animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-[10px] items-end flex-col md:flex-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat_placeholder")}
            rows={3}
            className="flex-1 w-full p-[14px_16px] border border-brand-line rounded-[16px] text-[14px] font-sans resize-none outline-none bg-white leading-[1.5] text-brand-text box-border focus:border-brand-primary focus:shadow-[0_0_0_2px_rgba(202,161,74,.4)]"
          />
          <Btn onClick={send} disabled={loading || !input.trim()} className="w-full md:w-auto p-[14px_20px] self-stretch">
            {t("chat_send")}
          </Btn>
        </div>
      </div>
    </AppLayout>
  );
}
