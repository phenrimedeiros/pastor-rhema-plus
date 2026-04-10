"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { auth, profiles } from "@/lib/supabase_client";
import { useLanguage } from "@/lib/i18n";

const CHAT_HISTORY_STORAGE_PREFIX = "rhema_chat_history";
const LOCALE_BY_LANG = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
};

function getChatHistoryKey(userId) {
  return `${CHAT_HISTORY_STORAGE_PREFIX}:${userId}`;
}

function readChatHistory(userId) {
  if (!userId || typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getChatHistoryKey(userId));
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (thread) =>
          thread &&
          typeof thread.id === "string" &&
          Array.isArray(thread.messages) &&
          typeof thread.updatedAt === "string"
      )
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (error) {
    console.error("Erro ao ler histórico local do chat:", error);
    return [];
  }
}

function writeChatHistory(userId, threads) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getChatHistoryKey(userId), JSON.stringify(threads));
  } catch (error) {
    console.error("Erro ao salvar histórico local do chat:", error);
  }
}

function buildThreadId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `thread-${Date.now()}`;
}

function buildThreadTitle(messages, fallback) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const content = (firstUserMessage?.content || fallback || "").replace(/\s+/g, " ").trim();
  if (!content) return fallback;
  return content.length > 58 ? `${content.slice(0, 58).trim()}...` : content;
}

function formatThreadDate(dateValue, lang) {
  if (!dateValue) return "";

  try {
    return new Intl.DateTimeFormat(LOCALE_BY_LANG[lang] || LOCALE_BY_LANG.en, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(dateValue));
  } catch {
    return "";
  }
}

function Message({ msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`mb-[24px] flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mr-[14px] grid h-[36px] w-[36px] shrink-0 place-items-center rounded-full bg-[#0b2a5b]">
          <Image src="/logo.png" alt="PR" width={20} height={20} className="object-contain" />
        </div>
      )}
      <div
        className={`max-w-[85%] whitespace-pre-wrap font-sans text-[15px] leading-[1.6] md:max-w-[70%] ${
          isUser
            ? "rounded-[24px_24px_4px_24px] bg-[#f1f5f9] p-[14px_20px] text-[#0f172a]"
            : "p-[4px_0] text-[#334155]"
        }`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const bottomRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [historyThreads, setHistoryThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const session = await auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const user = await auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const currentProfile = await profiles.getProfile(user.id);
        if (!active) return;

        const storedThreads = readChatHistory(user.id);

        setUserId(user.id);
        setProfile(currentProfile);
        setHistoryThreads(storedThreads);

        if (storedThreads.length > 0) {
          setActiveThreadId(storedThreads[0].id);
          setMessages(storedThreads[0].messages || []);
        }
      } catch (error) {
        console.error("Erro ao carregar chat:", error);
        if (active) router.push("/login");
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const persistConversation = (nextMessages, preferredThreadId = activeThreadId) => {
    if (!userId || nextMessages.length === 0) return preferredThreadId;

    const storedThreads = readChatHistory(userId);
    const nextThreadId = preferredThreadId || buildThreadId();
    const existingThread = storedThreads.find((thread) => thread.id === nextThreadId);
    const now = new Date().toISOString();

    const nextThread = {
      id: nextThreadId,
      title: buildThreadTitle(nextMessages, t("chat_history_untitled")),
      createdAt: existingThread?.createdAt || now,
      updatedAt: now,
      messages: nextMessages,
    };

    const nextThreads = [nextThread, ...storedThreads.filter((thread) => thread.id !== nextThreadId)];

    writeChatHistory(userId, nextThreads);
    setHistoryThreads(nextThreads);
    setActiveThreadId(nextThreadId);

    return nextThreadId;
  };

  const openThread = (threadId) => {
    const selectedThread = historyThreads.find((thread) => thread.id === threadId);
    if (!selectedThread) return;

    setActiveThreadId(selectedThread.id);
    setMessages(selectedThread.messages || []);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const threadId = persistConversation(updatedMessages);

    try {
      const session = await auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.slice(-20).map(({ role, content }) => ({ role, content })),
        }),
      });

      const raw = await response.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(t("chat_invalid_response"));
      }

      if (!response.ok) throw new Error(data?.error || t("chat_request_failed"));

      const nextMessages = [...updatedMessages, { role: "assistant", content: data.reply }];
      setMessages(nextMessages);
      persistConversation(nextMessages, threadId);
    } catch (error) {
      const nextMessages = [
        ...updatedMessages,
        {
          role: "assistant",
          content: `⚠️ ${error.message}`,
        },
      ];
      setMessages(nextMessages);
      persistConversation(nextMessages, threadId);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setActiveThreadId(null);
    setInput("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b2a5b] to-[#163d7a]">
        <div className="font-sans text-white">{t("common_loading")}</div>
      </div>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <AppLayout profile={profile}>
      <div className="flex h-[calc(100vh-60px)] w-full overflow-hidden rounded-none bg-white md:h-[calc(100vh-72px)] md:rounded-tl-[24px]">
        <div className="relative flex h-full flex-1 flex-col">
          <div className="relative flex flex-1 flex-col overflow-y-auto px-[20px] pb-[100px] pt-[40px] md:px-[60px] md:pb-[140px]">
            {isEmpty ? (
              <div className="m-auto flex max-w-[500px] flex-col items-center justify-center text-center">
                <div className="mb-[24px] grid h-[64px] w-[64px] place-items-center rounded-[18px] bg-[#0b2a5b] p-[10px] shadow-[0_8px_24px_rgba(11,42,91,.25)]">
                  <Image src="/logo.png" alt="Logo" width={34} height={34} className="h-full w-full object-contain" />
                </div>
                <h1 className="mb-[12px] text-[26px] font-bold text-[#0f172a]">
                  {t("chat_title")}
                </h1>
                <p className="text-[15px] leading-[1.6] text-[#64748b]">
                  {t("chat_subtitle")}
                </p>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-[760px]">
                {messages.map((msg, index) => (
                  <Message key={index} msg={msg} />
                ))}

                {loading && (
                  <div className="mb-[24px] flex items-center gap-[14px]">
                    <div className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-full bg-[#0b2a5b] p-[8px]">
                      <Image src="/logo.png" alt="PR" width={20} height={20} className="h-full w-full object-contain" />
                    </div>
                    <div className="flex gap-[6px]">
                      {[0, 1, 2].map((dot) => (
                        <div
                          key={dot}
                          className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#94a3b8]"
                          style={{ animationDelay: `${dot * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={bottomRef} className="h-[20px]" />
              </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent px-[16px] pb-[16px] pt-[40px] md:px-[60px] md:pb-[32px]">
            <div className="relative mx-auto max-w-[760px]">
              <div className="flex items-center rounded-[32px] border border-[#e2e8f0] bg-white p-[6px] shadow-[0_4px_24px_rgba(0,0,0,.04)] transition-colors focus-within:border-[#2563eb] focus-within:shadow-[0_4px_24px_rgba(37,99,235,.1)]">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("chat_placeholder")}
                  rows={1}
                  className="max-h-[120px] w-[60%] flex-1 resize-none overflow-y-auto border-none bg-transparent px-[20px] py-[12px] text-[15px] text-[#0f172a] outline-none placeholder-[#94a3b8]"
                  style={{ minHeight: "44px" }}
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="h-[44px] shrink-0 cursor-pointer rounded-[24px] border-none bg-[#53b2be] px-[24px] text-[14px] font-bold text-white transition-colors hover:bg-[#3d98a3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t("chat_send")}
                </button>
              </div>
              <p className="mb-0 mt-[12px] hidden text-center text-[12px] text-[#94a3b8] md:block">
                {t("chat_input_hint")}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden h-full w-[280px] shrink-0 flex-col border-l border-[#e2e8f0] bg-[#f8fafc] lg:flex lg:w-[320px]">
          <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white p-[20px]">
            <h3 className="m-0 text-[12px] font-extrabold uppercase tracking-wider text-[#64748b]">
              {t("chat_history_title")}
            </h3>
            <button
              onClick={clearChat}
              className="cursor-pointer border-none bg-transparent p-0 text-[12px] font-bold text-[#2563eb] hover:underline"
            >
              {t("chat_new")}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-[16px]">
            {historyThreads.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-[#cbd5e1] bg-white p-[18px] text-center shadow-sm">
                <p className="m-0 text-[13px] leading-[1.6] text-[#64748b]">
                  {t("chat_history_empty")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[10px]">
                {historyThreads.map((thread) => {
                  const active = thread.id === activeThreadId;

                  return (
                    <button
                      key={thread.id}
                      onClick={() => openThread(thread.id)}
                      className={`w-full rounded-[16px] border p-[14px] text-left transition-colors ${
                        active
                          ? "border-[#2563eb]/30 bg-[#eff6ff] shadow-sm"
                          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-slate-50"
                      }`}
                    >
                      <p className="m-0 max-h-[40px] overflow-hidden text-[13px] font-bold leading-[1.5] text-[#0f172a]">
                        {thread.title || t("chat_history_untitled")}
                      </p>
                      <p className="mb-0 mt-[8px] text-[11px] font-medium text-[#64748b]">
                        {formatThreadDate(thread.updatedAt, lang)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-[#e2e8f0] bg-white p-[20px]">
            <button
              onClick={clearChat}
              className="w-full cursor-pointer rounded-[10px] border border-[#cbd5e1] bg-white py-[12px] text-[13px] font-bold tracking-wide text-[#334155] transition-colors hover:bg-slate-50"
            >
              {t("chat_new")}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
