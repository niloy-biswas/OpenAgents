"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, Product } from "@/lib/db";
import { cn } from "@/lib/utils";

type OrderWithProduct = Order & { product_title: string };

type RiskLevel = "high" | "mid" | "low";

function riskFromScore(score: number | null): { level: RiskLevel; label: string } {
  const s = score ?? 50;
  if (s >= 80) return { level: "high", label: `${s}% receive` };
  if (s >= 50) return { level: "mid", label: `${s}% receive` };
  return { level: "low", label: `${s}% receive` };
}

function formatDate(d: Date) {
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function orderCode(id: number) {
  return `#DK-${2200 + id}`;
}

export default function OverviewClient({
  orders,
  products,
}: {
  orders: OrderWithProduct[];
  products: Product[];
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<number | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const todayOrders = orders.filter((o) => new Date(o.order_at).toISOString().startsWith(today));
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const revenueToday = todayOrders.reduce((sum, o) => sum + Number(o.total_price), 0);

  const funnel = {
    pending: orders.filter((o) => o.status === "pending").length,
    called: orders.filter((o) => o.status === "called").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const lowStock = products.filter((p) => {
    if (p.variants && p.variants.length > 0) {
      return Math.min(...p.variants.map((v) => v.stock)) <= 5;
    }
    return p.quantity < 5;
  });

  async function confirmOrder(id: number) {
    setConfirming(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
    setConfirming(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Orders today" value={todayOrders.length.toString()} delta="Today" tone="neutral" />
        <KpiCard label="Pending confirmation" value={pendingOrders.length.toString()} delta="Need action" tone="warn" />
        <KpiCard label="Revenue today" value={`৳${Math.round(revenueToday).toLocaleString()}`} delta="Across channels" tone="neutral" />
        <KpiCard label="Handled by bot" value="78%" delta="22% needed human" tone="neutral" />
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Confirmation funnel */}
        <div className="col-span-12 bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <svg className="h-4 w-4 text-oa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h18" />
                <path d="M6 3l4 8v7l4 2v-9l4-8" />
              </svg>
              Confirmation funnel
            </div>
            <div className="text-xs text-oa-text-faint font-mono">Today</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FunnelStage stage={1} name="New orders" value={funnel.pending} />
            <FunnelStage stage={2} name="Called" value={funnel.called} />
            <FunnelStage stage={3} name="Confirmed" value={funnel.confirmed} />
            <FunnelStage stage={4} name="Delivered" value={funnel.delivered} />
          </div>
        </div>

        {/* Pending confirmation queue */}
        <div className="col-span-12 xl:col-span-8 bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <svg className="h-4 w-4 text-oa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.9.7 2.7a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.8 2z" />
              </svg>
              Call to confirm
            </div>
            <div className="text-xs text-oa-text-faint font-mono">{pendingOrders.length} waiting</div>
          </div>

          <div className="overflow-x-auto">
            {pendingOrders.length === 0 ? (
              <div className="text-sm text-oa-text-dim py-8 text-center">No pending confirmations.</div>
            ) : (
              <table className="w-full min-w-[700px] text-sm">
                <tbody>
                  {pendingOrders
                    .sort((a, b) => (a.receive_score ?? 50) - (b.receive_score ?? 50))
                    .map((o) => {
                      const product = products.find((p) => p.id === o.product_id);
                      const swatchColor = product?.swatch_color ?? "#5b8def";
                      const code = product?.swatch_code ?? "??";
                      const risk = riskFromScore(o.receive_score);
                      const channel = o.channel?.toLowerCase() || "messenger";
                      return (
                        <tr key={o.id} className="border-b border-oa-line-soft last:border-0">
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="h-8 w-8 rounded-md flex items-center justify-center font-mono text-[10px] font-semibold text-oa-bg"
                                style={{ background: swatchColor }}
                              >
                                {code}
                              </div>
                              <div>
                                <div className="font-medium">{o.product_title}</div>
                                <div className="text-[10.5px] text-oa-text-faint font-mono">
                                  {orderCode(o.id)} · {formatDate(o.order_at)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-2 text-oa-text-dim font-mono text-xs">
                              {channel === "whatsapp" ? <WhatsappIcon /> : <FacebookIcon />}
                              {o.sender_id}
                            </div>
                          </td>
                          <td className="py-3 pr-3 font-mono text-oa-text">৳{Number(o.total_price).toLocaleString()}</td>
                          <td className="py-3 pr-3">
                            <span
                              className={cn(
                                "inline-block rounded-full px-2 py-0.5 text-[10.5px] font-mono",
                                risk.level === "high" && "bg-oa-green-dim text-oa-green",
                                risk.level === "mid" && "bg-oa-gold-soft text-oa-gold",
                                risk.level === "low" && "bg-oa-red-dim text-oa-red"
                              )}
                            >
                              {risk.label}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => confirmOrder(o.id)}
                              disabled={confirming === o.id}
                              className="inline-flex items-center gap-1.5 bg-oa-surface-raise hover:bg-oa-primary-dim hover:border-oa-primary border border-oa-line rounded-oa-sm px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
                            >
                              {confirming === o.id ? "Confirming…" : "Confirm"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="col-span-12 xl:col-span-4 bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <svg className="h-4 w-4 text-oa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                <path d="M12 3v1M4.2 4.2l.7.7M21 12h-1M20.2 4.2l-.7.7M12 21v-1M4.2 19.8l.7-.7M6 12a6 6 0 0 1 12 0c0 2.5-1.5 4.7-3 6" />
                <path d="M15 18H9" />
              </svg>
              Low stock alerts
            </div>
            <div className="text-xs text-oa-text-faint font-mono">{lowStock.length} items</div>
          </div>
          <div className="space-y-3">
            {lowStock.slice(0, 6).map((p) => {
              const minVariant = p.variants && p.variants.length
                ? p.variants.reduce((m, v) => (v.stock < m.stock ? v : m), p.variants[0])
                : null;
              return (
                <div key={p.id} className="flex items-center justify-between pb-3 border-b border-oa-line-soft last:border-0 last:pb-0">
                  <div>
                    <div className="text-sm">{p.title}</div>
                    <div className="text-[10.5px] text-oa-text-faint font-mono">
                      {minVariant ? `Lowest: ${minVariant.label} · ${minVariant.stock} left` : `${p.quantity} left`}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10.5px] font-mono",
                      (minVariant ? minVariant.stock : p.quantity) <= 2
                        ? "bg-oa-red-dim text-oa-red"
                        : "bg-oa-gold-soft text-oa-gold"
                    )}
                  >
                    {(minVariant ? minVariant.stock : p.quantity) <= 2 ? "Critical" : "Low"}
                  </span>
                </div>
              );
            })}
            {lowStock.length === 0 && (
              <div className="text-sm text-oa-text-dim text-center py-4">No low stock alerts.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "neutral" | "warn" | "up" | "down";
}) {
  return (
    <div className="bg-oa-surface border border-oa-line-soft rounded-oa-md p-4 hover:border-oa-line transition-colors">
      <div className="text-xs text-oa-text-faint">{label}</div>
      <div
        className={cn(
          "text-[26px] font-semibold font-mono mt-2 tracking-tight",
          tone === "warn" ? "text-oa-gold" : "text-oa-text"
        )}
      >
        {value}
      </div>
      <div
        className={cn(
          "text-[11.5px] mt-1.5 flex items-center gap-1",
          tone === "up" ? "text-oa-green" : tone === "down" ? "text-oa-red" : "text-oa-text-faint"
        )}
      >
        {delta}
      </div>
    </div>
  );
}

function FunnelStage({
  stage,
  name,
  value,
}: {
  stage: number;
  name: string;
  value: number;
}) {
  return (
    <div className="relative border-r border-oa-line last:border-0 pr-4">
      <div className="text-[11px] text-oa-text-faint font-mono mb-1">Stage {stage}</div>
      <div className="text-2xl font-semibold font-mono mb-1">{value}</div>
      <div className="text-xs text-oa-text-dim">{name}</div>
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-oa-blue" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-oa-green" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm5.8 14.2c-.2.6-1.3 1.2-1.9 1.3-.5.1-1.1.1-1.8-.1-.4-.1-1-.3-1.6-.6-2.9-1.3-4.8-4.2-4.9-4.4-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.2.3-.3.5-.2.2-.3.3-.5.5-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.5.2.5.3.1.2.1.7-.1 1.3z" />
    </svg>
  );
}
