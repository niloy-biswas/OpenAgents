"use client";

import { useMemo, useRef, useState } from "react";
import type { Order, Product } from "@/lib/db";
import { cn } from "@/lib/utils";

type Thread = {
  id: string;
  name: string;
  handle: string;
  channel: "messenger" | "whatsapp";
  channelIcon: "fb" | "wa";
  avatar: string;
  product: string;
  updated: string;
  unread: boolean;
  messages: { role: "customer" | "agent"; text: string; time: string }[];
};

function swatchSvg(code: string, color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="${color}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="14" font-weight="600" fill="var(--oa-text)">${code.slice(0, 2).toUpperCase()}</text></svg>`;
  const b64 =
    typeof window !== "undefined"
      ? window.btoa(svg)
      : (globalThis as any).Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

function makeThreads(orders: (Order & { product_title: string; updated: string })[], products: Product[]): Thread[] {
  const bySender: Record<string, Thread> = {};
  orders.forEach((o) => {
    const id = o.sender_id || `customer-${o.id}`;
    if (!bySender[id]) {
      const product = products.find((p) => p.id === o.product_id);
      const title = product?.title || o.product_title;
      const color = product?.swatch_color || "#e8a33d";
      const code = product?.swatch_code || "EP";
      bySender[id] = {
        id,
        name: o.customer_name || `Customer ${id.slice(0, 8)}`,
        handle: o.phone || id,
        channel: (o.channel?.toLowerCase() as any) === "whatsapp" ? "whatsapp" : "messenger",
        channelIcon: o.channel?.toLowerCase() === "whatsapp" ? "wa" : "fb",
        avatar: swatchSvg(code, color),
        product: title,
        updated: o.updated,
        unread: Math.random() > 0.7,
        messages: [],
      };
    }
  });

  // Seed representative conversations if none exist.
  if (Object.keys(bySender).length === 0) {
    return [
      { id: "c1", name: "Ayesha Rahman", handle: "+880 1711-223344", channel: "whatsapp", channelIcon: "wa", avatar: swatchSvg("EP", "#d4a373"), product: "Eid Premium Panjabi", updated: "2m ago", unread: true, messages: [
        { role: "customer", text: "Assalamu alaikum. \u0995\u09bf \u098f\u0987 \u09aa\u09be\u099e\u09cd\u099c\u09be\u09ac\u09bf \u09ae\u09c7\u09a1\u09bf\u09df\u09be\u09ae \u09b8\u09be\u0987\u099c \u0986\u099b\u09c7?", time: "10:32 AM" },
        { role: "agent", text: "\u09b5\u09be\u09b2\u09be\u0987\u0995\u09c1\u09ae \u09b8\u09cd\u09ac\u09be\u09b9\u09be\u09a8\u09c1\u09b2\u09cd\u09b2\u09be\u09b9। \u09b9\u09cd\u09af\u09be\u0981, \u09ae\u09c7\u09a1\u09bf\u09df\u09be\u09ae (40) \u09b8\u09be\u0987\u099c \u09b8\u09cd\u099f\u09bf\u09b2 \u0986\u099b\u09c7। \u09b8\u09be\u09a5\u09c7 \u0995\u09bf \u09a1\u09c7\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u09a6\u09bf\u09ac\u09c7\u09a8?", time: "10:33 AM" },
      ]},
      { id: "c2", name: "Karim Hossain", handle: "fb_id_88291", channel: "messenger", channelIcon: "fb", avatar: swatchSvg("CL", "#5b8def"), product: "Classic Linen Shirt", updated: "18m ago", unread: true, messages: [
        { role: "customer", text: "\u09a1\u09bf\u09b2\u09bf\u09ad\u09be\u09b0\u09bf \u0995\u09bf \u09a7\u09be\u0995\u09be \u09ac\u09be\u0987\u09a6\u09be\u09df \u09ac\u09bf\u0995\u09be\u09b6 \u09aa\u09be\u0993\u09df\u09be \u09af\u09be\u09ac\u09c7?", time: "9:42 AM" },
      ]},
    ];
  }

  return Object.values(bySender).map((t) => {
    t.messages = t.messages.length
      ? t.messages
      : [
          { role: "customer", text: `Hi, I'm interested in ${t.product}. Is it in stock?`, time: t.updated },
        ];
    return t;
  });
}

export default function ChatClient({
  orders: rawOrders,
  products,
}: {
  orders: (Order & { product_title: string })[];
  products: Product[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const threads = useMemo(() => {
    const enriched = rawOrders.map((o) => ({ ...o, updated: new Date(o.order_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }));
    return makeThreads(enriched, products);
  }, [rawOrders, products]);

  const [messagesByThread, setMessagesByThread] = useState<Record<string, Thread["messages"]>>(() => {
    const map: Record<string, Thread["messages"]> = {};
    threads.forEach((t) => (map[t.id] = t.messages));
    return map;
  });

  const selected = threads.find((t) => t.id === active) || threads[0];
  const messages = selected ? messagesByThread[selected.id] || [] : [];

  function send(text: string, role: "customer" | "agent" = "agent") {
    if (!text.trim() || !selected) return;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const next = [...messages, { role, text, time }];
    setMessagesByThread((map) => ({ ...map, [selected.id]: next }));
    setInput("");
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  }

  async function askAI() {
    if (!input.trim() || !selected) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: [] }),
      });
      const { reply = "Here is a suggested reply." } = await res.json();
      send(reply, "agent");
    } catch (e) {
      send("AI suggestion unavailable. Please compose manually.", "agent");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[560px] bg-oa-surface border border-oa-line-soft rounded-oa-lg overflow-hidden flex">
      {/* Thread list */}
      <div className="w-full md:w-80 border-r border-oa-line-soft flex flex-col shrink-0">
        <div className="p-4 border-b border-oa-line-soft flex items-center justify-between">
          <span className="text-sm font-semibold">Conversations</span>
          <span className="text-[11px] font-mono text-oa-gold">{threads.length} active</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.map((t) => {
            const isActive = selected?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-oa-line-soft flex gap-3 transition-colors",
                  isActive ? "bg-oa-surface-hi" : "hover:bg-oa-surface-hi"
                )}
              >
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-[10px] object-cover border border-oa-line-soft" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{t.name}</span>
                    {t.unread && !isActive && <span className="h-2 w-2 rounded-full bg-oa-primary animate-pulse-dot" />}
                  </div>
                  <div className="text-[11px] text-oa-text-faint truncate">{t.product}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {t.channelIcon === "wa" ? waIcon() : fbIcon()}
                    <span className="text-[10.5px] text-oa-text-faint font-mono">{t.handle}</span>
                  </div>
                </div>
                <span className="text-[10px] text-oa-text-faint font-mono">{t.updated}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-oa-line-soft flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{selected.name}</div>
            <div className="text-[11px] text-oa-text-faint font-mono">{selected.handle} · asking about {selected.product}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-oa-surface-raise border border-oa-line rounded-full px-2.5 py-1 text-[11px]">
              {selected.channelIcon === "wa" ? waIcon() : fbIcon()}
              {selected.channel}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "agent" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] rounded-oa-lg px-4 py-3 text-sm",
                  m.role === "agent" ? "bg-oa-primary text-white rounded-br-none" : "bg-oa-surface-raise border border-oa-line rounded-bl-none"
                )}
              >
                {m.text}
                <div className={cn("text-[10px] mt-1.5 font-mono", m.role === "agent" ? "text-white/70" : "text-oa-text-faint")}>{m.time}</div>
              </div>
            </div>
          ))}
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
                  send(input);
                }
              }}
              placeholder="Type a reply…"
              className="flex-1 bg-oa-surface border border-oa-line-soft rounded-oa-md px-4 py-3 text-sm outline-none focus:border-oa-primary resize-none h-14"
            />
            <button
              onClick={() => send(input)}
              className="bg-oa-primary text-white rounded-oa-md px-4 h-14 text-sm font-semibold hover:brightness-110 transition-all"
            >
              Send
            </button>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={askAI}
              disabled={suggesting || !input.trim()}
              className="text-[11px] flex items-center gap-1.5 text-oa-text-dim hover:text-oa-primary disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
              </svg>
              {suggesting ? "Asking AI…" : "Ask AI to draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function fbIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-oa-blue" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

function waIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-oa-green" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm5.8 14.2c-.2.6-1.3 1.2-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.6-.6-2.9-1.3-4.8-4.2-4.9-4.4-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.2.3-.3.5-.2.2-.3.3-.5.5-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
    </svg>
  );
}
