"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Order } from "@/lib/db";
import { cn } from "@/lib/utils";

type OrderWithTitle = Order & { product_title: string; product_image?: string | null };

const ALL_STATUSES = ["pending", "called", "confirmed", "dispatched", "delivered", "returned", "cancelled"] as const;
type Status = typeof ALL_STATUSES[number];

const STATUS_STYLE: Record<string, string> = {
  pending:    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  called:     "bg-blue-400/10 text-blue-400 border border-blue-400/20",
  confirmed:  "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  dispatched: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  delivered:  "bg-green-500/10 text-green-400 border border-green-500/20",
  returned:   "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  cancelled:  "bg-red-500/10 text-red-400 border border-red-500/20",
};

// Next action buttons per status
const NEXT_ACTIONS: Record<string, { label: string; next: string; style: string }[]> = {
  pending:    [{ label: "Confirm", next: "confirmed", style: "btn-primary" }, { label: "Cancel", next: "cancelled", style: "btn-danger" }],
  called:     [{ label: "Confirm", next: "confirmed", style: "btn-primary" }, { label: "Cancel", next: "cancelled", style: "btn-danger" }],
  confirmed:  [{ label: "Dispatch", next: "dispatched", style: "btn-primary" }],
  dispatched: [{ label: "Deliver", next: "delivered", style: "btn-primary" }],
  delivered:  [{ label: "Return", next: "returned", style: "btn-ghost" }],
  returned:   [],
  cancelled:  [],
};

function parseAddr(o: OrderWithTitle): Record<string, string> {
  if (!o.address) return {};
  if (typeof o.address === "string") {
    try { return JSON.parse(o.address); } catch { return {}; }
  }
  return o.address as any;
}
function customerName(o: OrderWithTitle): string {
  const a = parseAddr(o);
  return o.customer_name ?? a.name ?? "";
}
function customerPhone(o: OrderWithTitle): string {
  const a = parseAddr(o);
  return o.phone ?? a.contact ?? "";
}
function addressLine(o: OrderWithTitle): string {
  const a = parseAddr(o);
  // drop name/contact keys, join remaining values
  return Object.entries(a)
    .filter(([k]) => k !== "name" && k !== "contact")
    .map(([, v]) => v)
    .filter(Boolean)
    .join(", ");
}

export default function OrdersClient({ orders }: { orders: OrderWithTitle[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<number | null>(null);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const s of ALL_STATUSES) c[s] = orders.filter((o) => o.status === s).length;
    return c;
  }, [orders]);

  const visible = useMemo(() => {
    let list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          (o.order_code ?? "").toLowerCase().includes(q) ||
          o.product_title.toLowerCase().includes(q) ||
          customerName(o).toLowerCase().includes(q) ||
          customerPhone(o).includes(q)
      );
    }
    return list;
  }, [orders, filter, search]);

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    router.refresh();
  }

  const ALL_TABS: { key: Status | "all"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "called", label: "Called" },
    { key: "confirmed", label: "Confirmed" },
    { key: "dispatched", label: "Dispatched" },
    { key: "delivered", label: "Delivered" },
    { key: "returned", label: "Returned" },
    { key: "cancelled", label: "Cancelled" },
  ];
  const TABS = ALL_TABS.filter((t) => t.key === "all" || counts[t.key] > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">All orders</h1>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-oa-text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers, items…"
            className="pl-8 pr-4 py-2 text-sm bg-oa-surface border border-oa-line-soft rounded-oa-md outline-none focus:border-oa-gold w-72 placeholder:text-oa-text-faint"
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-oa-line-soft pb-0 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              filter === t.key
                ? "border-oa-gold text-oa-gold"
                : "border-transparent text-oa-text-faint hover:text-oa-text"
            )}
          >
            {t.label}
            <span className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded-full",
              filter === t.key ? "bg-oa-gold/15 text-oa-gold" : "bg-oa-surface-raise text-oa-text-faint"
            )}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-oa-line-soft bg-oa-surface-raise">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-oa-text-faint">Order</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-oa-text-faint">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-oa-text-faint">Address</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-oa-text-faint">Channel</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-oa-text-faint">Total</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-oa-text-faint">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-oa-text-faint">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-oa-text-faint">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-oa-line-soft">
            {visible.map((o) => {
              const name = customerName(o);
              const phone = customerPhone(o);
              const addr = addressLine(o);
              const initials = name ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?";
              const actions = NEXT_ACTIONS[o.status] ?? [];
              const isBusy = updating === o.id;

              return (
                <tr key={o.id} className="hover:bg-oa-surface-hi transition-colors">
                  {/* Order */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {o.product_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.product_image} alt="" className="h-9 w-9 rounded-[8px] object-cover border border-oa-line-soft shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-[8px] bg-oa-surface-raise border border-oa-line-soft flex items-center justify-center shrink-0 text-[10px] font-mono text-oa-primary font-semibold">
                          {o.product_title.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-mono text-oa-gold">{o.order_code ?? `#${o.id}`}</div>
                        <div className="text-sm font-medium leading-tight max-w-[140px] truncate">{o.product_title}</div>
                        <div className="text-[10.5px] text-oa-text-faint font-mono">×{o.quantity}</div>
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-oa-surface-raise border border-oa-line-soft flex items-center justify-center shrink-0 text-[10px] font-semibold text-oa-primary">
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-tight">{name || <span className="text-oa-text-faint">—</span>}</div>
                        {phone && <div className="text-[11px] font-mono text-oa-text-faint">{phone}</div>}
                      </div>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-4 py-3 text-xs text-oa-text-faint max-w-[180px]">
                    {addr ? <span className="leading-snug">{addr}</span> : <span className="text-oa-text-faint opacity-40">—</span>}
                  </td>

                  {/* Channel */}
                  <td className="px-4 py-3">
                    <ChannelBadge channel={o.channel} />
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 text-right font-mono font-semibold text-oa-gold">
                    ৳{Number(o.total_price).toLocaleString()}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-oa-text-faint font-mono whitespace-nowrap">
                    {new Date(o.order_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short",
                    })}
                    <div>{new Date(o.order_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10.5px] font-medium uppercase tracking-wide", STATUS_STYLE[o.status] ?? "bg-oa-surface-raise text-oa-text-faint border border-oa-line-soft")}>
                      {o.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {actions.length === 0 && (
                        <span className="text-xs text-oa-text-faint">—</span>
                      )}
                      {actions.map((a) => (
                        <button
                          key={a.next}
                          disabled={isBusy}
                          onClick={() => updateStatus(o.id, a.next)}
                          className={cn(
                            "text-xs font-medium px-3 py-1.5 rounded-oa-sm transition-all disabled:opacity-40",
                            a.style === "btn-primary" && "bg-oa-gold text-oa-bg hover:brightness-110",
                            a.style === "btn-danger" && "bg-oa-red/10 text-oa-red border border-oa-red/20 hover:bg-oa-red/20",
                            a.style === "btn-ghost" && "bg-oa-surface-raise border border-oa-line text-oa-text-faint hover:text-oa-text",
                          )}
                        >
                          {isBusy ? "…" : a.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-oa-text-faint">
                  {search ? "No orders match your search." : "No orders yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string | null }) {
  if (!channel) return <span className="text-oa-text-faint text-xs">—</span>;
  const isWA = channel.toLowerCase().includes("whatsapp");
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border",
      isWA
        ? "bg-green-500/10 text-green-400 border-green-500/20"
        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
    )}>
      {isWA ? (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm5.8 14.2c-.2.6-1.3 1.2-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.6-.6-2.9-1.3-4.8-4.2-4.9-4.4-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.2.3-.3.5-.2.2-.3.3-.5.5-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
        </svg>
      ) : (
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
        </svg>
      )}
      {isWA ? "WhatsApp" : "Messenger"}
    </span>
  );
}
