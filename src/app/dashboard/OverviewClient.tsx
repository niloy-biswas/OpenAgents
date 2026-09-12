"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, Product, RecoKpis, InventoryKpis, WeeklyPoint, TopProduct } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

export default function OverviewClient({
  orders,
  products,
  recoKpis,
  invKpis,
  weeklyChart,
  topProducts,
}: {
  orders: OrderWithProduct[];
  products: Product[];
  recoKpis: RecoKpis;
  invKpis: InventoryKpis;
  weeklyChart: WeeklyPoint[];
  topProducts: TopProduct[];
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

      {/* Inventory — Strip 1: Stock position */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-oa-text-faint font-medium mb-2.5 ml-0.5">
          Stock position
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <InvKpi label="Total SKUs" value={invKpis.totalSkus.toString()} />
          <InvKpi label="Units on hand" value={invKpis.unitsOnHand.toLocaleString()} />
          <InvKpi label="Inventory value" value={`৳${invKpis.inventoryValue.toLocaleString()}`} />
          <InvKpi label="Retail value" value={`৳${invKpis.retailValue.toLocaleString()}`} />
          <InvKpi label="Available to sell" value={invKpis.availableToSell.toLocaleString()} tone="up" />
          <InvKpi label="Reserved" value={invKpis.reserved.toLocaleString()} tone={invKpis.reserved > 0 ? "warn" : "neutral"} />
        </div>
      </div>

      {/* Inventory — Strip 2: Risk & velocity */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-oa-text-faint font-medium mb-2.5 ml-0.5">
          Risk &amp; velocity
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <InvKpi label="Incoming" value={invKpis.incoming.toLocaleString()} tone={invKpis.incoming > 0 ? "up" : "neutral"} />
          <InvKpi label="Low stock SKUs" value={invKpis.lowStock.toString()} tone={invKpis.lowStock > 0 ? "warn" : "neutral"} />
          <InvKpi label="Critical (< 3)" value={invKpis.critical.toString()} tone={invKpis.critical > 0 ? "down" : "neutral"} />
          <InvKpi label="Out of stock" value={invKpis.outOfStock.toString()} tone={invKpis.outOfStock > 0 ? "down" : "neutral"} />
          <InvKpi label="Dead stock SKUs" value={`${invKpis.deadStock} · ${invKpis.deadStockUnits} units`} tone={invKpis.deadStock > 0 ? "warn" : "neutral"} />
        </div>
      </div>

      {/* Advisor flip cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <FlipCard
          front={{
            label: "Actions recommended today",
            value: recoKpis.open.toString(),
            sub: `${recoKpis.completed} already completed`,
          }}
          back={{
            heading: "Open Recommendations",
            body: recoKpis.open === 0
              ? "No open recommendations. All caught up!"
              : `${recoKpis.open} actions need your attention. Visit the advisor to review and act on them.`,
          }}
        />
        <FlipCard
          urgent
          front={{
            label: "Urgent (stockout / cash)",
            value: recoKpis.urgent.toString(),
            sub: "Act within 24h",
          }}
          back={{
            heading: "Urgent Actions",
            body: recoKpis.urgent === 0
              ? "No urgent issues right now."
              : `${recoKpis.urgent} urgent recommendation${recoKpis.urgent > 1 ? "s" : ""} flagged — stockout risk or cash flow alert. Act today.`,
          }}
        />
        <FlipCard
          front={{
            label: "Potential revenue impact",
            value: `৳${Math.round(recoKpis.impact).toLocaleString()}`,
            sub: "Across all open recommendations",
          }}
          back={{
            heading: "Revenue at Stake",
            body: recoKpis.impact === 0
              ? "No estimated revenue impact on open items."
              : `৳${Math.round(recoKpis.impact).toLocaleString()} in potential revenue tied to open recommendations. Act to capture it.`,
          }}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-5">
        {/* Weekly orders vs revenue bar chart */}
        <div className="col-span-12 xl:col-span-8 bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              <svg className="h-4 w-4 text-oa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 17V11M12 17V9M16 17v-4" />
              </svg>
              Weekly overview
            </div>
            <div className="text-xs text-oa-text-faint font-mono">Last 7 days</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyChart} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="orders" orientation="left" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <YAxis yAxisId="revenue" orientation="right" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1a1d21", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: 12 }}
                labelStyle={{ color: "#9ca3af" }}
                formatter={(value, name) =>
                  name === "revenue" ? [`৳${Number(value).toLocaleString()}`, "Revenue"] : [value, "Orders"]
                }
              />
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280", paddingTop: 8 }} />
              <Bar yAxisId="orders" dataKey="orders" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={32} name="Orders" />
              <Bar yAxisId="revenue" dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={32} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 3 products */}
        <div className="col-span-12 xl:col-span-4 bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex items-center gap-2.5 text-sm font-semibold mb-5">
            <svg className="h-4 w-4 text-oa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
            Top selling products
          </div>
          <div className="space-y-4">
            {topProducts.map((p, i) => {
              const maxUnits = topProducts[0]?.units ?? 1;
              const pct = Math.round((p.units / maxUnits) * 100);
              return (
                <div key={p.title}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono text-oa-text-faint w-4 shrink-0">#{i + 1}</span>
                      <span className="text-sm truncate">{p.title}</span>
                    </div>
                    <div className="text-xs font-mono text-oa-gold ml-2 shrink-0">{p.units} sold</div>
                  </div>
                  <div className="h-1.5 bg-oa-surface-raise rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: i === 0 ? "#f59e0b" : i === 1 ? "#3b82f6" : "#6b7280" }}
                    />
                  </div>
                  <div className="text-[10.5px] text-oa-text-faint font-mono mt-0.5">৳{p.revenue.toLocaleString()} revenue</div>
                </div>
              );
            })}
            {topProducts.length === 0 && (
              <div className="text-sm text-oa-text-dim text-center py-8">No order data yet.</div>
            )}
          </div>
        </div>
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

function FlipCard({
  front,
  back,
  urgent = false,
}: {
  front: { label: string; value: string; sub: string };
  back: { heading: string; body: string };
  urgent?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div
      className="cursor-pointer"
      style={{ perspective: "800px" }}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        style={{
          transition: "transform 0.45s",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
          minHeight: "110px",
        }}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 bg-oa-surface border rounded-oa-md p-4 hover:border-oa-line transition-colors",
            urgent ? "border-oa-red/40" : "border-oa-line-soft"
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-xs text-oa-text-faint">{front.label}</div>
          <div className={cn("text-[28px] font-semibold font-mono mt-2 tracking-tight", urgent ? "text-oa-red" : "text-oa-gold")}>
            {front.value}
          </div>
          <div className="text-[11px] text-oa-text-faint mt-1.5">{front.sub}</div>
          <div className="text-[10px] text-oa-text-faint mt-2 opacity-50">Click to flip ↩</div>
        </div>
        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 bg-oa-surface-raise border rounded-oa-md p-4",
            urgent ? "border-oa-red/40" : "border-oa-line"
          )}
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className={cn("text-xs font-semibold mb-2", urgent ? "text-oa-red" : "text-oa-gold")}>
            {back.heading}
          </div>
          <p className="text-[12px] text-oa-text-dim leading-relaxed">{back.body}</p>
          <div className="text-[10px] text-oa-text-faint mt-3 opacity-50">Click to flip back ↩</div>
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

function InvKpi({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "up" | "down";
}) {
  return (
    <div className="bg-oa-surface border border-oa-line-soft rounded-oa-md px-3.5 py-3 hover:border-oa-line transition-colors">
      <div className="text-[10.5px] text-oa-text-faint leading-tight">{label}</div>
      <div
        className={cn(
          "text-[20px] font-semibold font-mono mt-1.5 tracking-tight leading-none",
          tone === "up" ? "text-oa-green" :
          tone === "down" ? "text-oa-red" :
          tone === "warn" ? "text-oa-gold" :
          "text-oa-text"
        )}
      >
        {value}
      </div>
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
