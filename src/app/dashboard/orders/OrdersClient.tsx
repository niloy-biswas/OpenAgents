"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, Product } from "@/lib/db";
import { cn } from "@/lib/utils";

type OrderRow = Order & { product_title: string; product?: Product };
type FilterState = "all" | Order["status"];

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function channelIcon(channel: string | null) {
  const c = channel?.toLowerCase() || "messenger";
  return c === "whatsapp" ? "WhatsApp" : "Messenger";
}

function statusBadge(status: Order["status"]) {
  switch (status) {
    case "pending":
      return "bg-oa-gold-soft text-oa-gold";
    case "called":
      return "bg-oa-blue-dim text-oa-blue";
    case "confirmed":
      return "bg-oa-surface-raise text-oa-text";
    case "dispatched":
      return "bg-oa-blue-dim text-oa-blue";
    case "delivered":
      return "bg-oa-green-dim text-oa-green";
    case "returned":
      return "bg-oa-red-dim text-oa-red";
    case "cancelled":
      return "bg-oa-surface-raise text-oa-text-faint";
    default:
      return "bg-oa-surface-raise text-oa-text-dim";
  }
}

export default function OrdersClient({
  orders,
  products,
}: {
  orders: OrderRow[];
  products: Product[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterState>("all");
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<number | null>(null);

  const rows = orders.map((o) => ({ ...o, product: products.find((p) => p.id === o.product_id) }));

  const filtered = rows.filter((o) => {
    const matchesStatus = filter === "all" || o.status === filter;
    const q = search.toLowerCase();
    const text = `${o.product_title} ${o.sender_id} ${o.customer_name || ""} ${o.phone || ""}`.toLowerCase();
    return matchesStatus && text.includes(q);
  });

  const totals = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
      revenue: orders
        .filter((o) => o.status === "confirmed" || o.status === "delivered")
        .reduce((s, o) => s + Number(o.total_price), 0),
    };
  }, [orders]);

  async function setStatus(id: number, status: Order["status"]) {
    setProcessing(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setProcessing(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat title="Total orders" value={totals.all.toString()} />
        <Stat title="Pending" value={totals.pending.toString()} warn />
        <Stat title="Confirmed" value={totals.confirmed.toString()} />
        <Stat title="Delivered" value={totals.delivered.toString()} />
        <Stat className="col-span-2 lg:col-span-1" title="Confirmed revenue" value={`৳${Math.round(totals.revenue).toLocaleString()}`} />
      </div>

      <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg overflow-hidden">
        <div className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <svg className="h-4 w-4 text-oa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            All orders
          </div>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders, customers, items"
              className="bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-xs outline-none focus:border-oa-primary w-48"
            />
          </div>
        </div>

        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {(["all", "pending", "called", "confirmed", "dispatched", "delivered", "returned", "cancelled"] as FilterState[]).map((f) => {
            const counts: Record<FilterState, number> = {
              all: orders.length,
              pending: orders.filter((o) => o.status === "pending").length,
              called: orders.filter((o) => o.status === "called").length,
              confirmed: orders.filter((o) => o.status === "confirmed").length,
              dispatched: orders.filter((o) => o.status === "dispatched").length,
              delivered: orders.filter((o) => o.status === "delivered").length,
              returned: orders.filter((o) => o.status === "returned").length,
              cancelled: orders.filter((o) => o.status === "cancelled").length,
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors",
                  filter === f
                    ? "bg-oa-surface-raise border-oa-line text-oa-text"
                    : "bg-transparent border-transparent text-oa-text-faint hover:bg-oa-surface-hi"
                )}
              >
                {f[0].toUpperCase() + f.slice(1)} <span className="font-mono text-oa-gold">{counts[f]}</span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-oa-line-soft text-xs text-oa-text-faint">
              <tr>
                <th className="text-left px-5 py-3 font-medium">Order</th>
                <th className="text-left px-5 py-3 font-medium">Customer</th>
                <th className="text-left px-5 py-3 font-medium">Channel</th>
                <th className="text-left px-5 py-3 font-medium">Total</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-oa-line-soft">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-oa-surface-hi transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-md flex items-center justify-center text-[10px] font-semibold text-oa-bg"
                        style={{ background: o.product?.swatch_color || "#e8a33d" }}
                      >
                        {o.product?.swatch_code?.substring(0, 2).toUpperCase() || "DK"}
                      </div>
                      <div>
                        <div className="font-medium">#{o.order_code}</div>
                        <div className="text-[10.5px] text-oa-text-faint">{o.product_title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div>{o.customer_name || "Unknown buyer"}</div>
                    <div className="text-[10.5px] text-oa-text-faint font-mono">{o.phone || o.sender_id}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 bg-oa-surface-raise border border-oa-line rounded-full px-2.5 py-0.5 text-[11px]">
                      <svg className="h-3 w-3 text-oa-blue" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.5 2 2 6 2 11c0 2.5 1.2 4.8 3 6.3V22l3.8-2.1c.9.3 1.9.4 2.9.4 5.5 0 10-4 10-9s-4.5-9-10-9z" />
                      </svg>
                      {channelIcon(o.channel)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono">৳{Number(o.total_price).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-oa-text-dim text-xs">{formatDate(o.order_at)}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn("inline-block rounded-full px-2.5 py-1 text-[10.5px] font-mono uppercase", statusBadge(o.status))}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {o.status === "pending" && (
                        <>
                          <button
                            onClick={() => setStatus(o.id, "called")}
                            disabled={processing === o.id}
                            className="text-xs bg-oa-surface-raise border border-oa-line rounded-oa-sm px-2.5 py-1 hover:bg-oa-blue-dim hover:border-oa-blue transition-colors disabled:opacity-50"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => setStatus(o.id, "confirmed")}
                            disabled={processing === o.id}
                            className="text-xs bg-oa-surface-raise border border-oa-line rounded-oa-sm px-2.5 py-1 hover:bg-oa-green-dim hover:border-oa-green transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setStatus(o.id, "cancelled")}
                            disabled={processing === o.id}
                            className="text-xs bg-oa-surface-raise border border-oa-line rounded-oa-sm px-2.5 py-1 hover:bg-oa-red-dim hover:border-oa-red transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {o.status === "called" && (
                        <>
                          <button
                            onClick={() => setStatus(o.id, "confirmed")}
                            disabled={processing === o.id}
                            className="text-xs bg-oa-surface-raise border border-oa-line rounded-oa-sm px-2.5 py-1 hover:bg-oa-green-dim hover:border-oa-green transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setStatus(o.id, "cancelled")}
                            disabled={processing === o.id}
                            className="text-xs bg-oa-surface-raise border border-oa-line rounded-oa-sm px-2.5 py-1 hover:bg-oa-red-dim hover:border-oa-red transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {o.status === "confirmed" && (
                        <button
                          onClick={() => setStatus(o.id, "dispatched")}
                          disabled={processing === o.id}
                          className="text-xs bg-oa-surface-raise border border-oa-line rounded-oa-sm px-2.5 py-1 hover:bg-oa-blue-dim hover:border-oa-blue transition-colors disabled:opacity-50"
                        >
                          Dispatch
                        </button>
                      )}
                      {o.status === "dispatched" && (
                        <button
                          onClick={() => setStatus(o.id, "delivered")}
                          disabled={processing === o.id}
                          className="text-xs bg-oa-surface-raise border border-oa-line rounded-oa-sm px-2.5 py-1 hover:bg-oa-green-dim hover:border-oa-green transition-colors disabled:opacity-50"
                        >
                          Deliver
                        </button>
                      )}
                      {o.status === "delivered" && (
                        <button
                          onClick={() => setStatus(o.id, "returned")}
                          disabled={processing === o.id}
                          className="text-xs bg-oa-surface-raise border border-oa-line rounded-oa-sm px-2.5 py-1 hover:bg-oa-red-dim hover:border-oa-red transition-colors disabled:opacity-50"
                        >
                          Return
                        </button>
                      )}
                      {(o.status === "returned" || o.status === "cancelled") && <span className="text-xs text-oa-text-faint">Closed</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-oa-text-dim text-sm">
                    No orders match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, warn, className }: { title: string; value: string; warn?: boolean; className?: string }) {
  return (
    <div className={cn("bg-oa-surface border border-oa-line-soft rounded-oa-md p-4", className)}>
      <div className="text-xs text-oa-text-faint">{title}</div>
      <div className={cn("text-[22px] font-semibold font-mono mt-2", warn ? "text-oa-gold" : "text-oa-text")}>{value}</div>
    </div>
  );
}
