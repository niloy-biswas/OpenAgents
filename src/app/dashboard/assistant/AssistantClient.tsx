"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/components/MessageContent";

type Message = { role: "user" | "agent"; text: string };

interface SessionSummary {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
}

const SUGGESTIONS = [
  "Which products are low stock?",
  "Summarize today's orders.",
  "Who are my most doubtful customers?",
  "Suggest a discount strategy.",
];

const GREETING: Message = {
  role: "agent",
  text: "Hi! I'm OpenPage Assistant. Ask me anything about your store, customers, or inventory.",
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AssistantClient() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/assistant/sessions");
      const list: SessionSummary[] = res.ok ? await res.json() : [];
      if (list.length === 0) {
        const created = await fetch("/api/assistant/sessions", { method: "POST" }).then((r) => r.json());
        setSessions([created]);
        setActiveSessionId(created.id);
      } else {
        setSessions(list);
        setActiveSessionId(list[0].id);
      }
      setSessionsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (activeSessionId == null) return;
    (async () => {
      setMessages([GREETING]);
      const res = await fetch(`/api/assistant/sessions/${activeSessionId}`);
      const rows: { role: "user" | "assistant"; content: string }[] = res.ok ? await res.json() : [];
      if (rows.length > 0) {
        setMessages(rows.map((r) => ({ role: r.role === "user" ? "user" : "agent", text: r.content })));
      }
    })();
  }, [activeSessionId]);

  async function newChat() {
    const created = await fetch("/api/assistant/sessions", { method: "POST" }).then((r) => r.json());
    setSessions((prev) => [created, ...prev]);
    setActiveSessionId(created.id);
  }

  async function send(text: string) {
    if (!text.trim() || loading || activeSessionId == null) return;
    const next: Message[] = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: activeSessionId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setMessages([...next, { role: "agent", text: data.reply || "No response from assistant." }]);
      setSessions((prev) =>
        prev
          .map((s) =>
            s.id === activeSessionId
              ? { ...s, title: s.title ?? text.slice(0, 60), updated_at: new Date().toISOString() }
              : s
          )
          .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
      );
    } catch (err: any) {
      setError(err.message || "Assistant is temporarily unavailable.");
      setMessages([...next, { role: "agent", text: "Sorry, I ran into an error. Make sure you're signed in and the assistant is configured." }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[560px] flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-oa-green animate-pulse-dot" />
            <h1 className="text-lg font-semibold font-head">OpenPage Assistant</h1>
          </div>
          <p className="text-xs text-oa-text-dim mt-1">
            Business analyst powered by your live catalog, orders and inventory.
          </p>
        </div>
        <button
          onClick={newChat}
          className="text-xs font-medium bg-oa-surface-raise border border-oa-line rounded-oa-sm px-3 py-2 hover:border-oa-primary hover:text-oa-primary transition-colors shrink-0"
        >
          + New chat
        </button>
      </div>

      <div className="flex-1 bg-oa-surface border border-oa-line-soft rounded-oa-lg overflow-hidden flex min-h-0">
        {/* Session list */}
        <div className="hidden md:flex w-64 border-r border-oa-line-soft flex-col shrink-0">
          <div className="px-4 py-3 border-b border-oa-line-soft text-xs text-oa-text-faint">
            {sessionsLoading ? "Loading…" : `${sessions.length} conversation${sessions.length === 1 ? "" : "s"}`}
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-oa-line-soft transition-colors",
                  s.id === activeSessionId ? "bg-oa-surface-hi" : "hover:bg-oa-surface-hi"
                )}
              >
                <div className="text-xs font-medium truncate">{s.title || "New conversation"}</div>
                <div className="text-[10px] text-oa-text-faint font-mono mt-0.5">{timeAgo(s.updated_at)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "agent" && (
                  <div className="h-8 w-8 rounded-lg bg-oa-primary text-oa-bg flex items-center justify-center mr-3 shrink-0">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
                    </svg>
                  </div>
                )}
                <div
                  className={cn(
                    "rounded-oa-lg px-4 py-3 text-sm leading-relaxed",
                    m.role === "user"
                      ? "max-w-[80%] bg-oa-surface-raise border border-oa-line rounded-br-none"
                      : "max-w-[90%] bg-oa-bg border border-oa-line-soft rounded-bl-none"
                  )}
                >
                  {m.role === "agent" ? <MessageContent text={m.text} /> : m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="h-8 w-8 rounded-lg bg-oa-primary text-oa-bg flex items-center justify-center mr-3 shrink-0">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
                  </svg>
                </div>
                <div className="bg-oa-bg border border-oa-line-soft rounded-oa-lg rounded-bl-none px-4 py-3 text-sm text-oa-text-dim">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce [animation-delay:0.1s]">.</span>
                    <span className="animate-bounce [animation-delay:0.2s]">.</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-5 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-oa-surface-raise border border-oa-line rounded-full px-3 py-1.5 hover:border-oa-primary hover:text-oa-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {error && <div className="px-5 pb-2 text-xs text-oa-red font-mono">{error}</div>}

          <div className="p-4 border-t border-oa-line-soft bg-oa-bg/50">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask anything about your store…"
                className="flex-1 bg-oa-surface border border-oa-line-soft rounded-oa-md px-4 py-3 text-sm outline-none focus:border-oa-primary resize-none h-14"
              />
              <button
                onClick={() => send(input)}
                disabled={loading || !input.trim()}
                className="bg-oa-primary text-oa-bg rounded-oa-md px-5 h-14 text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
