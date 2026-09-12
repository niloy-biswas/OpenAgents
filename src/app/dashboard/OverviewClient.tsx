"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Order, Product, RecoKpis, InventoryKpis, WeeklyPoint, TopProduct } from "@/lib/db";
import { cn } from "@/lib/utils";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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

function initials(title: string) {
  const matches = title.match(/\b\w/g);
  const chars = matches ? matches.slice(0, 2).join("") : title.slice(0, 2);
  return chars.toUpperCase();
}

const TOP_COLORS = ["#e8a33d", "#3fae7a", "#e8a33d", "#5b8def", "#d1435b"];

function stockEstimate(stock: number) {
  if (stock <= 2) return "~1 day";
  if (stock <= 3) return "~2 days";
  if (stock <= 5) return "~5 days";
  if (stock <= 8) return "~6 days";
  return "~7 days";
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

  const riskValues = [invKpis.incoming, invKpis.lowStock, invKpis.critical, invKpis.outOfStock, invKpis.deadStock];
  const riskMax = Math.max(1, ...riskValues);
  const riskRows = [
    { name: "Incoming stock", value: invKpis.incoming, color: "var(--oa-blue)" },
    { name: "Low stock SKUs", value: invKpis.lowStock, color: "var(--oa-gold)" },
    { name: "Critical (< 3)", value: invKpis.critical, color: "var(--oa-red)" },
    { name: "Out of stock", value: invKpis.outOfStock, color: "var(--oa-red)" },
    { name: "Dead stock SKUs", value: `${invKpis.deadStock} · ${invKpis.deadStockUnits} units`, color: "var(--oa-text-faint)", raw: invKpis.deadStock },
  ];

  const totalMovable = invKpis.availableToSell + invKpis.reserved;
  const availablePct = totalMovable ? Math.min(100, (invKpis.availableToSell / totalMovable) * 100) : 0;
  const reservedPct = totalMovable ? Math.min(100, (invKpis.reserved / totalMovable) * 100) : 0;

  return (
    <div className="space-y-7 pb-8">
      {/* KPI hero row */}
      <div className="grid grid-cols-[1.3fr_1fr_1.3fr_1fr] gap-4 max-xl:grid-cols-2 max-md:grid-cols-1">
        <KpiBig label="Orders today" value={todayOrders.length.toString()} delta="↑ 12% vs yesterday" tone="up">
          <svg className="absolute right-3.5 bottom-3 opacity-90" width="88" height="30" viewBox="0 0 88 30">
            <polyline
              points="0,24 14,20 28,22 42,14 56,16 70,7 88,4"
              fill="none"
              stroke="var(--oa-green)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </KpiBig>
        <KpiReg label="Pending confirmation" value={pendingOrders.length.toString()} delta="Oldest: 41 min ago" tone="warn" />
        <KpiBig label="Revenue today" value={`৳${Math.round(revenueToday).toLocaleString()}`} delta="↑ ৳6,200 vs yesterday" tone="up">
          <svg className="absolute right-3.5 bottom-3 opacity-90" width="88" height="30" viewBox="0 0 88 30">
            <polyline
              points="0,22 14,23 28,17 42,19 56,10 70,12 88,3"
              fill="none"
              stroke="var(--oa-gold)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </KpiBig>
        <KpiReg label="Handled by bot" value="78%" delta="22% needed human" tone="neutral">
          <svg className="absolute right-3.5 top-3.5" width="46" height="46" viewBox="0 0 46 46">
            <circle cx="23" cy="23" r="18" fill="none" stroke="var(--oa-surface-raise)" strokeWidth="6" />
            <circle
              cx="23"
              cy="23"
              r="18"
              fill="none"
              stroke="var(--oa-gold)"
              strokeWidth="6"
              strokeDasharray="113.1"
              strokeDashoffset="24.9"
              strokeLinecap="round"
              transform="rotate(-90 23 23)"
            />
          </svg>
        </KpiReg>
      </div>

      {/* Stock position */}
      <div>
        <SectionLabel>Stock position</SectionLabel>
        <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="grid grid-cols-6 max-lg:grid-cols-3 max-md:grid-cols-2">
            <StatCell label="Total SKUs" value={invKpis.totalSkus.toString()} />
            <StatCell label="Units on hand" value={invKpis.unitsOnHand.toLocaleString()} />
            <StatCell label="Inventory value" value={`৳${invKpis.inventoryValue.toLocaleString()}`} />
            <StatCell label="Retail value" value={`৳${invKpis.retailValue.toLocaleString()}`} />
            <StatCell label="Available to sell" value={invKpis.availableToSell.toLocaleString()} tone="up" />
            <StatCell label="Reserved" value={invKpis.reserved.toLocaleString()} tone={invKpis.reserved > 0 ? "warn" : "neutral"} />
          </div>
          <div className="flex items-center gap-3.5 mt-5 pt-5 border-t border-oa-line-soft">
            <div className="flex-1 flex h-2.5 rounded-full overflow-hidden bg-oa-surface-raise">
              <div style={{ width: `${availablePct}%`, background: "var(--oa-green)" }} />
              <div style={{ width: `${reservedPct}%`, background: "var(--oa-gold)" }} />
            </div>
            <div className="flex gap-4 text-[11.5px] text-oa-text-dim shrink-0">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-[2px] bg-oa-green" />Available {availablePct.toFixed(1)}%</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-[2px] bg-oa-gold" />Reserved {reservedPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk & velocity */}
      <div>
        <SectionLabel>Risk &amp; velocity</SectionLabel>
        <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex flex-col gap-3.5">
            {riskRows.map((r) => (
              <div key={r.name} className="grid grid-cols-[140px_1fr_60px] items-center gap-3.5">
                <div className="text-xs text-oa-text-dim">{r.name}</div>
                <div className="h-2.5 bg-oa-surface-raise rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (("raw" in r ? r.raw! : r.value) / riskMax) * 100)}%`, background: r.color }}
                  />
                </div>
                <div className="font-mono text-xs text-right">{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Flip cards */}
      <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-4">
        <FlipCard
          front={{ label: "Actions recommended today", value: recoKpis.open.toString(), sub: `${recoKpis.completed} already completed` }}
          back={{
            heading: "Open Recommendations",
            body: recoKpis.open === 0 ? "No open recommendations. All caught up!" : `${recoKpis.open} actions need your attention. Visit the advisor to review and act on them.`,
          }}
        />
        <FlipCard
          urgent
          front={{ label: "Urgent (stockout / cash)", value: recoKpis.urgent.toString(), sub: "Act within 24h" }}
          back={{
            heading: "Urgent Actions",
            body: recoKpis.urgent === 0 ? "No urgent issues right now." : `${recoKpis.urgent} urgent recommendation${recoKpis.urgent > 1 ? "s" : ""} flagged — stockout risk or cash flow alert. Act today.`,
          }}
        />
        <FlipCard
          front={{ label: "Potential revenue impact", value: `৳${Math.round(recoKpis.impact).toLocaleString()}`, sub: "Across all open recommendations" }}
          back={{
            heading: "Revenue at Stake",
            body: recoKpis.impact === 0 ? "No estimated revenue impact on open items." : `৳${Math.round(recoKpis.impact).toLocaleString()} in potential revenue tied to open recommendations. Act to capture it.`,
          }}
        />
      </div>

      {/* Weekly overview + Top selling */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-8 bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ChartIcon className="h-4 w-4 text-oa-gold" />
              Weekly overview
            </div>
            <div className="text-[11px] text-oa-text-faint font-mono">Last 7 days</div>
          </div>
          <div className="h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyChart} barGap={6}>
                <CartesianGrid vertical={false} stroke="var(--oa-line-soft)" />
                <XAxis dataKey="day" tick={{ fill: "var(--oa-text-faint)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="orders" orientation="left" tick={{ fill: "var(--oa-text-faint)", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                <YAxis yAxisId="revenue" orientation="right" tick={{ fill: "var(--oa-text-faint)", fontSize: 11 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--oa-surface)", border: "1px solid var(--oa-line)", borderRadius: "8px", fontSize: 12 }}
                  labelStyle={{ color: "var(--oa-text-faint)" }}
                  formatter={(value, name) => (name === "revenue" ? [`৳${Number(value).toLocaleString()}`, "Revenue"] : [String(value), "Orders"])}
                />
                <Bar yAxisId="orders" dataKey="orders" fill="var(--oa-gold)" opacity={0.85} radius={[4, 4, 0, 0]} maxBarSize={32} name="Orders" />
                <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="var(--oa-blue)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--oa-blue)" }} activeDot={{ r: 5 }} name="Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3.5 pt-3.5 border-t border-oa-line-soft">
            <LegendDot label="Orders" color="var(--oa-gold)" />
            <LegendDot label="Revenue (৳'000)" color="var(--oa-blue)" />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <TrophyIcon className="h-4 w-4 text-oa-gold" />
              Top selling products
            </div>
            <div className="text-[11px] text-oa-text-faint font-mono">This week</div>
          </div>
          <div className="flex flex-col gap-3.5">
            {topProducts.map((p, i) => {
              const maxUnits = topProducts[0]?.units ?? 1;
              const pct = Math.round((p.units / maxUnits) * 100);
              const color = TOP_COLORS[i % TOP_COLORS.length];
              return (
                <div key={p.title} className="grid grid-cols-[22px_30px_1fr_80px] items-center gap-2.5">
                  <div className={cn("font-mono text-xs", i === 0 ? "text-oa-gold" : "text-oa-text-faint")}>{String(i + 1).padStart(2, "0")}</div>
                  <div className="h-7 w-7 rounded-[7px] flex items-center justify-center font-mono text-[10px] font-semibold text-[#14161c]" style={{ background: color }}>
                    {initials(p.title)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs truncate">{p.title}</div>
                    <div className="h-2 bg-oa-surface-raise rounded-full overflow-hidden mt-1">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--oa-gold), #c97d1e)" }} />
                    </div>
                  </div>
                  <div className="font-mono text-xs text-right">{p.units} sold</div>
                </div>
              );
            })}
            {topProducts.length === 0 && (
              <div className="text-sm text-oa-text-dim text-center py-8">No order data yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FunnelIcon className="h-4 w-4 text-oa-gold" />
              Confirmation funnel
            </div>
            <div className="text-[11px] text-oa-text-faint font-mono">Today</div>
          </div>
          <div className="flex flex-col items-center gap-0">
            <FunnelStage width="100%" tone="blue" name="New orders" value={funnel.pending} />
            <FunnelConnector from={funnel.pending} to={funnel.called} />
            <FunnelStage width="82%" tone="gold" name="Called" value={funnel.called} />
            <FunnelConnector from={funnel.called} to={funnel.confirmed} />
            <FunnelStage width="64%" tone="green" name="Confirmed" value={funnel.confirmed} />
            <FunnelConnector from={funnel.confirmed} to={funnel.delivered} />
            <FunnelStage width="48%" tone="success" name="Delivered" value={funnel.delivered} />
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="col-span-12 bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertIcon className="h-4 w-4 text-oa-gold" />
              Low stock alerts
            </div>
            <div className="text-[11px] text-oa-text-faint font-mono">{lowStock.length} items</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr className="text-left text-[11.5px] text-oa-text-faint border-b border-oa-line-soft">
                  <th className="py-2.5 px-1 font-medium">Product</th>
                  <th className="py-2.5 px-1 font-medium">SKU</th>
                  <th className="py-2.5 px-1 font-medium">Stock left</th>
                  <th className="py-2.5 px-1 font-medium">Level</th>
                  <th className="py-2.5 px-1 font-medium">Est. stockout</th>
                  <th className="py-2.5 px-1 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {lowStock.slice(0, 6).map((p) => {
                  const minVariant = p.variants && p.variants.length
                    ? p.variants.reduce((m, v) => (v.stock < m.stock ? v : m), p.variants[0])
                    : null;
                  const stock = minVariant ? minVariant.stock : p.quantity;
                  const width = Math.min(100, (stock / 15) * 100);
                  const isCritical = stock <= 2;
                  return (
                    <tr key={p.id} className="border-b border-oa-line-soft last:border-0 hover:bg-oa-surface-hi">
                      <td className="py-3 px-1 text-xs">{p.title}</td>
                      <td className="py-3 px-1 text-[11px] text-oa-text-faint font-mono">{p.description || p.swatch_code || "—"}</td>
                      <td className="py-3 px-1 text-xs font-mono">{stock}</td>
                      <td className="py-3 px-1">
                        <div className="w-[110px] h-[7px] bg-oa-surface-raise rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${width}%`, background: isCritical ? "var(--oa-red)" : "var(--oa-gold)" }} />
                        </div>
                      </td>
                      <td className="py-3 px-1 text-xs">{stockEstimate(stock)}</td>
                      <td className="py-3 px-1 text-right">
                        <button className="bg-oa-surface-raise border border-oa-line text-oa-text text-[11.5px] px-3 py-1.5 rounded-oa-sm hover:bg-oa-gold-dim hover:border-oa-gold transition-colors">
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {lowStock.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-oa-text-dim">No low stock alerts.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiBig({
  label,
  value,
  delta,
  tone,
  children,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "neutral" | "warn" | "up" | "down";
  children?: React.ReactNode;
}) {
  return (
    <div className="relative bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors overflow-hidden">
      <div className="text-xs text-oa-text-faint">{label}</div>
      <div className={cn("text-[32px] font-semibold font-mono mt-2 tracking-tight", tone === "warn" ? "text-oa-gold" : "text-oa-text")}>
        {value}
      </div>
      <div
        className={cn(
          "text-[11.5px] mt-1.5 flex items-center gap-1",
          tone === "up" ? "text-oa-green" : tone === "down" ? "text-oa-red" : tone === "warn" ? "text-oa-gold" : "text-oa-text-faint"
        )}
      >
        {delta}
      </div>
      {children}
    </div>
  );
}

function KpiReg({
  label,
  value,
  delta,
  tone,
  children,
}: {
  label: string;
  value: string;
  delta: string;
  tone: "neutral" | "warn" | "up" | "down";
  children?: React.ReactNode;
}) {
  return (
    <div className="relative bg-oa-surface border border-oa-line-soft rounded-oa-lg p-5 hover:border-oa-line transition-colors overflow-hidden">
      <div className="text-xs text-oa-text-faint">{label}</div>
      <div className={cn("text-[26px] font-semibold font-mono mt-2 tracking-tight", tone === "warn" ? "text-oa-gold" : "text-oa-text")}>
        {value}
      </div>
      <div
        className={cn(
          "text-[11.5px] mt-1.5 flex items-center gap-1",
          tone === "up" ? "text-oa-green" : tone === "down" ? "text-oa-red" : tone === "warn" ? "text-oa-gold" : "text-oa-text-faint"
        )}
      >
        {delta}
      </div>
      {children}
    </div>
  );
}

function StatCell({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "up";
}) {
  return (
    <div className="border-l border-oa-line-soft first:border-l-0 first:pl-0 pl-4 py-1">
      <div className="text-[11.5px] text-oa-text-faint">{label}</div>
      <div
        className={cn(
          "font-mono text-[21px] font-semibold mt-1.5",
          tone === "up" ? "text-oa-green" : tone === "warn" ? "text-oa-gold" : "text-oa-text"
        )}
      >
        {value}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-widest text-oa-text-faint font-medium mb-3 ml-0.5">{children}</div>;
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
    <div className="cursor-pointer h-[150px]" style={{ perspective: "1200px" }} onClick={() => setFlipped((f) => !f)}>
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-oa-lg border p-5 flex flex-col backface-hidden",
            urgent ? "border-oa-red bg-oa-surface shadow-[inset_0_0_0_1px_var(--oa-red)]" : "border-oa-line-soft bg-oa-surface hover:border-oa-line"
          )}
        >
          <div className="text-[12.5px] text-oa-text-dim font-medium">{front.label}</div>
          <div className={cn("text-[30px] font-semibold font-mono mt-1", urgent ? "text-oa-red" : "text-oa-gold")}>{front.value}</div>
          <div className="text-[11.5px] text-oa-text-faint mt-1">{front.sub}</div>
          <div className="mt-auto text-[10.5px] text-oa-text-faint flex items-center gap-1">Click to flip ↺</div>
        </div>
        <div
          className={cn(
            "absolute inset-0 rounded-oa-lg border p-5 flex flex-col justify-center gap-2 backface-hidden",
            urgent ? "border-oa-red bg-oa-surface-raise" : "border-oa-line bg-oa-surface-raise"
          )}
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className={cn("text-xs font-semibold", urgent ? "text-oa-red" : "text-oa-gold")}>{back.heading}</div>
          <p className="text-xs text-oa-text-dim leading-relaxed">{back.body}</p>
        </div>
      </div>
    </div>
  );
}

function FunnelStage({
  width,
  tone,
  name,
  value,
}: {
  width: string;
  tone: "blue" | "gold" | "green" | "success";
  name: string;
  value: number;
}) {
  const styles = {
    blue: { bg: "var(--oa-blue-dim)", border: "var(--oa-blue)", text: "var(--oa-text)" },
    gold: { bg: "var(--oa-gold-soft)", border: "var(--oa-gold)", text: "var(--oa-text)" },
    green: { bg: "var(--oa-green-dim)", border: "var(--oa-green)", text: "var(--oa-text)" },
    success: { bg: "var(--oa-green)", border: "var(--oa-green)", text: "#0e1310" },
  }[tone];

  return (
    <div
      className="rounded-xl px-5 py-3.5 flex items-center justify-between"
      style={{
        width,
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.text,
      }}
    >
      <span className="text-xs font-medium">{name}</span>
      <span className="font-mono text-lg font-semibold">{value}</span>
    </div>
  );
}

function FunnelConnector({ from, to }: { from: number; to: number }) {
  const pct = from > 0 ? Math.round((to / from) * 100) : 0;
  return (
    <div className="font-mono text-[10.5px] text-oa-text-faint py-1.5">↓ {pct}% reached</div>
  );
}

function LegendDot({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-oa-text-dim">
      <span className="w-2 h-2 rounded-[2px]" style={{ background: color }} />
      {label}
    </div>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V10" />
      <path d="M12 19V5" />
      <path d="M20 19v-7" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M17 5h3a2 2 0 0 1-2 4M7 5H4a2 2 0 0 0 2 4" />
    </svg>
  );
}

function FunnelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h18" />
      <path d="M6 3l4 8v7l4 2v-9l4-8" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      <path d="M9 21h6" />
    </svg>
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
