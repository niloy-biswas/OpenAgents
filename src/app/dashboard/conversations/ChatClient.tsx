"use client";

import { useEffect, useRef, useState } from "react";
import type { ConversationSummary, ConversationMessage } from "@/lib/db";
import { cn } from "@/lib/utils";

export default function ChatClient({ senders }: { senders: ConversationSummary[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    senders[0]?.sender_id ?? null
  );
  const [thread, setThread] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // silent refetch thread every 5s
  useEffect(() => {
    if (!selectedId) return;
    const id = setInterval(() => {
      fetch(`/api/logs?sender=${encodeURIComponent(selectedId)}`)
        .then((r) => r.json())
        .then((data) => setThread(data))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [selectedId]);

  const selected = senders.find((s) => s.sender_id === selectedId) ?? senders[0] ?? null;

  async function sendReply() {
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    await fetch("/api/conversations/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender_id: selected.sender_id, text }),
    });
    // optimistically append to thread
    setThread((prev) => [
      ...prev,
      { id: Date.now(), role: "assistant", content: text, image_url: null, created_at: new Date() } as any,
    ]);
    setSending(false);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/api/logs?sender=${encodeURIComponent(selectedId)}`)
      .then((r) => r.json())
      .then((data) => {
        setThread(data);
        setLoading(false);
        setTimeout(
          () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }),
          50
        );
      });
  }, [selectedId]);

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[560px] bg-oa-surface border border-oa-line-soft rounded-oa-lg overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-oa-line-soft flex flex-col shrink-0">
        <div className="p-4 border-b border-oa-line-soft flex items-center justify-between">
          <span className="text-sm font-semibold">Conversations</span>
          <span className="text-[11px] font-mono text-oa-gold">{senders.length} users</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {senders.length === 0 && (
            <p className="px-4 py-8 text-sm text-oa-text-faint text-center">No conversations yet.</p>
          )}
          {senders.map((s) => {
            const isActive = selected?.sender_id === s.sender_id;
            return (
              <button
                key={s.sender_id}
                onClick={() => setSelectedId(s.sender_id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-oa-line-soft flex gap-3 transition-colors",
                  isActive ? "bg-oa-surface-hi" : "hover:bg-oa-surface-hi"
                )}
              >
                {s.profile_pic ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.profile_pic} alt="" className="h-10 w-10 rounded-[10px] object-cover border border-oa-line-soft shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-[10px] bg-oa-surface-raise border border-oa-line-soft flex items-center justify-center shrink-0">
                    <span className="text-xs font-mono text-oa-gold font-semibold">
                      {(s.first_name ?? s.sender_id).slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      {s.first_name || s.last_name
                        ? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim()
                        : s.sender_id.slice(0, 14)}
                    </span>
                    <span className="text-[10px] text-oa-text-faint font-mono shrink-0 ml-1">
                      {new Date(s.last_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[11px] text-oa-text-faint truncate mt-0.5">{s.last_message}</div>
                  <div className="text-[10px] text-oa-text-faint mt-0.5">{s.message_count} messages</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-oa-text-faint text-sm">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-oa-line-soft flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">
                  {selected.first_name || selected.last_name
                    ? `${selected.first_name ?? ""} ${selected.last_name ?? ""}`.trim()
                    : "Customer"}
                </div>
                <div className="text-[11px] text-oa-text-faint font-mono">{selected.sender_id}</div>
              </div>
              <span className="text-[11px] font-mono text-oa-gold">{selected.message_count} messages</span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4" ref={scrollRef}>
              {loading && (
                <p className="text-center text-sm text-oa-text-faint">Loading…</p>
              )}
              {!loading && thread.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "assistant" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-oa-lg px-4 py-3 text-sm whitespace-pre-wrap",
                      m.role === "assistant"
                        ? "bg-oa-gold text-oa-bg rounded-br-none"
                        : "bg-oa-surface-raise border border-oa-line rounded-bl-none"
                    )}
                  >
                    {m.content}
                    <div className={cn(
                      "text-[10px] mt-1.5 font-mono",
                      m.role === "assistant" ? "text-oa-bg/70" : "text-oa-text-faint"
                    )}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              {!loading && thread.length === 0 && (
                <p className="text-center text-sm text-oa-text-faint">No messages yet.</p>
              )}
            </div>

            {/* Composer */}
            <div className="p-4 border-t border-oa-line-soft bg-oa-bg/50">
              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  placeholder="Type a reply to send via Messenger…"
                  rows={2}
                  className="flex-1 bg-oa-surface border border-oa-line-soft rounded-oa-md px-4 py-3 text-sm outline-none focus:border-oa-gold resize-none"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !input.trim()}
                  className="bg-oa-gold text-oa-bg rounded-oa-md px-4 h-[72px] text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
