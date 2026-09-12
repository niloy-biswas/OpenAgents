import Link from "next/link";
import type { ReactNode } from "react";

type LandingPageProps = { isLoggedIn: boolean };

const features = [
  [MessageIcon, "Grounded replies", "Answers customer questions from your catalog and current stock — not from guesswork."],
  [OrderIcon, "Orders from chat", "Collects the product, quantity, name, phone, and address before an order is confirmed."],
  [InventoryIcon, "Inventory that stays visible", "See low stock, variants, product value, and the items that need attention today."],
  [AssistantIcon, "A business assistant", "Ask questions about orders, sales, customers, and inventory in plain language."],
] as const;

export default function LandingPage({ isLoggedIn }: LandingPageProps) {
  const dashboardHref = isLoggedIn ? "/dashboard" : "/login";

  return (
    <main className="min-h-screen overflow-hidden bg-oa-bg text-oa-text">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/landing" className="flex items-center gap-2.5" aria-label="OpenAgents home">
          <BrandMark />
          <div>
            <div className="text-[16.5px] font-semibold leading-tight">OpenAgents</div>
            <div className="text-[10.5px] text-oa-text-faint">Seller co-pilot</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] text-oa-text-dim md:flex">
          <a href="#product" className="transition-colors hover:text-oa-text">Product</a>
          <a href="#how-it-works" className="transition-colors hover:text-oa-text">How it works</a>
          <a href="#control" className="transition-colors hover:text-oa-text">Why co-pilot</a>
        </nav>
        <div className="flex items-center gap-3">
          {!isLoggedIn && <Link href="/login" className="hidden text-[13px] text-oa-text-dim transition-colors hover:text-oa-text sm:inline-flex">Sign in</Link>}
          <Link href={dashboardHref} className="rounded-oa-sm bg-oa-gold px-3.5 py-2 text-[12px] font-semibold text-oa-bg transition-all hover:brightness-110">
            {isLoggedIn ? "Go to dashboard" : "See the product"}
          </Link>
        </div>
      </header>

      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:px-10 lg:pb-28 lg:pt-28">
        <div className="pointer-events-none absolute -left-32 top-0 h-80 w-80 rounded-full bg-oa-gold/5 blur-[120px]" />
        <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-oa-blue/5 blur-[130px]" />
        <div className="relative grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-oa-line bg-oa-surface px-3 py-1.5 text-[11px] text-oa-text-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-oa-green animate-pulse-dot" />
              Built for Bangladesh&apos;s social sellers
            </div>
            <h1 className="text-4xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-6xl lg:text-[70px]">
              See what customers are asking.
              <span className="text-oa-gold"> Act before the sale slips away.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-oa-text-dim sm:text-lg">
              OpenAgents is the seller co-pilot for Facebook shops. It answers from your real catalog, captures orders, and keeps stock and business questions in one place.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={dashboardHref} className="inline-flex items-center gap-2 rounded-oa-sm bg-oa-gold px-4 py-3 text-sm font-semibold text-oa-bg transition-all hover:brightness-110">
                {isLoggedIn ? "Go to dashboard" : "Open the dashboard"}<ArrowIcon />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center rounded-oa-sm border border-oa-line bg-oa-surface-raise px-4 py-3 text-sm text-oa-text-dim transition-colors hover:border-oa-gold hover:text-oa-text">How it works</a>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-oa-text-faint">
              <span className="flex items-center gap-1.5"><CheckIcon />Bangla, English, Banglish</span>
              <span className="flex items-center gap-1.5"><CheckIcon />BDT-ready catalog</span>
              <span className="flex items-center gap-1.5"><CheckIcon />Seller stays in control</span>
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section id="product" className="border-y border-oa-line-soft bg-[#101217]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-oa-line-soft sm:grid-cols-4">
          <Signal label="Customer conversations" value="24/7" />
          <Signal label="Languages" value="৩" />
          <Signal label="Order statuses" value="08" />
          <Signal label="Seller control" value="100%" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="max-w-2xl">
          <div className="mb-4 text-[11px] text-oa-gold">One workspace for the work behind every sale</div>
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">Your page is already busy. Your workflow does not have to be.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-oa-text-dim">From the first “is this available?” to the final delivery update, OpenAgents gives you a clearer view of what is happening across your shop.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([Icon, title, copy]) => <FeatureCard key={title} icon={Icon} title={title} copy={copy} />)}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-oa-line-soft bg-oa-surface/40">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <div><div className="mb-4 text-[11px] text-oa-gold">How it works</div><h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">From customer message to next best action.</h2><p className="mt-5 text-base leading-7 text-oa-text-dim">A simple loop that respects the way social commerce actually happens: in conversations, with real stock, and with a seller making the final call.</p></div>
            <div className="divide-y divide-oa-line-soft rounded-oa-lg border border-oa-line-soft bg-oa-surface">
              <Step number="01" title="Connect your page" copy="Bring your Facebook Page and product catalog into one calm workspace." />
              <Step number="02" title="Let every question count" copy="OpenAgents responds in Bangla, English, or Banglish using the information you actually sell." />
              <Step number="03" title="Stay in control" copy="Orders, stock, and business signals come back to you so you can make the next decision." />
            </div>
          </div>
        </div>
      </section>

      <section id="control" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24">
          <div className="rounded-oa-lg border border-oa-line-soft bg-oa-surface p-5 sm:p-7">
            <div className="mb-5 flex items-center justify-between border-b border-oa-line-soft pb-4"><div><div className="text-sm font-semibold">OpenPage Assistant</div><div className="mt-1 text-[11px] text-oa-text-faint">Business analyst · live store data</div></div><span className="flex items-center gap-1.5 text-[11px] text-oa-green"><span className="h-1.5 w-1.5 rounded-full bg-oa-green" />Ready</span></div>
            <div className="space-y-4"><div className="ml-auto max-w-[82%] rounded-oa-lg rounded-br-none border border-oa-line bg-oa-surface-raise px-4 py-3 text-sm">Which products are low stock?</div><div className="flex max-w-[92%] gap-3 rounded-oa-lg rounded-bl-none border border-oa-line-soft bg-oa-bg px-4 py-3 text-sm leading-6 text-oa-text-dim"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-oa-gold text-oa-bg"><AssistantIcon /></span><span><span className="font-medium text-oa-text">2 products need attention.</span> Eid Premium Panjabi has 2 units left and Classic Linen Shirt has 4.</span></div></div>
            <div className="mt-6 grid grid-cols-2 gap-3"><Metric label="Inventory value" value="৳48,200" /><Metric label="Needs attention" value="02 items" gold /></div>
          </div>
          <div><div className="mb-4 text-[11px] text-oa-gold">A co-pilot, not autopilot</div><h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">Useful enough to move quickly. Clear enough to trust.</h2><p className="mt-5 text-base leading-7 text-oa-text-dim">OpenAgents handles the repetitive work, but your business stays yours. You can review the order details and decide what happens next.</p><div className="mt-8 space-y-4"><TrustRow title="Uses your catalog" copy="Product names, prices, variants, and stock stay grounded in your data." /><TrustRow title="Keeps the seller visible" copy="Orders and conversations remain easy to review from one dashboard." /><TrustRow title="Speaks like your customers" copy="Reply naturally across Bangla, English, and Banglish conversations." /></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8 lg:px-10 lg:pb-32"><div className="relative overflow-hidden rounded-oa-lg border border-oa-line bg-oa-surface px-6 py-12 sm:px-12 sm:py-16"><div className="relative max-w-2xl"><div className="mb-4 text-[11px] text-oa-gold">Ready when your page is</div><h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">Give your shop a clearer second pair of eyes.</h2><p className="mt-5 max-w-xl text-base leading-7 text-oa-text-dim">Connect your catalog, bring your conversations together, and spend more time on the decisions that grow the business.</p><Link href={dashboardHref} className="mt-8 inline-flex items-center gap-2 rounded-oa-sm bg-oa-gold px-4 py-3 text-sm font-semibold text-oa-bg transition-all hover:brightness-110">{isLoggedIn ? "Go to dashboard" : "Open the dashboard"}<ArrowIcon /></Link></div></div></section>

      <footer className="border-t border-oa-line-soft"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-[11px] text-oa-text-faint sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><div className="flex items-center gap-2"><BrandMark small /><span>OpenAgents · Seller co-pilot</span></div><div>Built for the work behind every social sale.</div></div></footer>
    </main>
  );
}

function BrandMark({ small = false }: { small?: boolean }) { return <div className={`${small ? "h-5 w-5 rounded-[6px] text-[10px]" : "h-[30px] w-[30px] rounded-[9px] text-[15px]"} flex shrink-0 items-center justify-center bg-gradient-to-br from-oa-gold to-[#c97d1e] font-mono font-semibold text-oa-bg`}>৳</div>; }
function Signal({ label, value }: { label: string; value: string }) { return <div className="px-4 py-5 sm:px-7 sm:py-6"><div className="font-mono text-xl text-oa-text sm:text-2xl">{value}</div><div className="mt-1 text-[10.5px] text-oa-text-faint sm:text-xs">{label}</div></div>; }
function Step({ number, title, copy }: { number: string; title: string; copy: string }) { return <div className="grid gap-4 p-6 sm:grid-cols-[72px_1fr] sm:gap-6 sm:p-8"><div className="font-mono text-2xl text-oa-gold">{number}</div><div><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-oa-text-dim">{copy}</p></div></div>; }
function FeatureCard({ icon: Icon, title, copy }: { icon: () => ReactNode; title: string; copy: string }) { return <div className="rounded-oa-lg border border-oa-line-soft bg-oa-surface p-5 transition-colors hover:border-oa-line"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-oa-sm bg-oa-gold text-oa-bg"><Icon /></div><h3 className="text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-oa-text-dim">{copy}</p></div>; }
function Metric({ label, value, gold = false }: { label: string; value: string; gold?: boolean }) { return <div className="rounded-oa-md border border-oa-line-soft bg-oa-bg p-3"><div className="text-[10px] text-oa-text-faint">{label}</div><div className={`mt-1 font-mono text-lg ${gold ? "text-oa-gold" : ""}`}>{value}</div></div>; }
function TrustRow({ title, copy }: { title: string; copy: string }) { return <div className="flex gap-3"><div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-oa-green-dim text-oa-green"><CheckIcon /></div><div><div className="text-sm font-medium">{title}</div><div className="mt-1 text-sm leading-6 text-oa-text-dim">{copy}</div></div></div>; }

function DashboardPreview() { return <div className="relative mx-auto w-full max-w-[650px]"><div className="absolute -inset-5 rounded-[26px] border border-oa-gold/10 bg-oa-gold/[0.02]" /><div className="relative overflow-hidden rounded-oa-lg border border-oa-line bg-oa-surface shadow-2xl shadow-black/20"><div className="flex items-center justify-between border-b border-oa-line-soft bg-[#101217] px-4 py-3 sm:px-5"><div className="flex items-center gap-2"><BrandMark small /><span className="text-xs font-semibold">OpenAgents <span className="text-oa-text-faint">/ Overview</span></span></div><span className="flex items-center gap-2 text-[10px] text-oa-text-faint"><span className="h-1.5 w-1.5 rounded-full bg-oa-green animate-pulse-dot" />Bot is live</span></div><div className="p-4 sm:p-6"><div className="mb-4 flex items-end justify-between"><div><div className="text-lg font-semibold">Overview</div><div className="mt-1 text-[10px] text-oa-text-faint">Orders · Inventory · AI insights</div></div><div className="hidden rounded-[6px] border border-oa-line-soft bg-oa-bg px-2.5 py-1.5 text-[10px] text-oa-text-faint sm:block">Search orders, products</div></div><div className="grid grid-cols-3 gap-2 sm:gap-3"><MiniKpi label="Today&apos;s orders" value="12" delta="+18%" /><MiniKpi label="Revenue" value="৳8,450" delta="+12%" /><MiniKpi label="Low stock" value="02" delta="Needs attention" gold /></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><OrderPanel /><StockPanel /></div></div></div></div>; }
function MiniKpi({ label, value, delta, gold = false }: { label: string; value: string; delta: string; gold?: boolean }) { return <div className="rounded-[8px] border border-oa-line-soft bg-oa-bg p-2.5 sm:p-3"><div className="truncate text-[9px] text-oa-text-faint">{label}</div><div className="mt-1 font-mono text-sm sm:text-base">{value}</div><div className={`mt-1 truncate text-[8px] ${gold ? "text-oa-gold" : "text-oa-green"}`}>{delta}</div></div>; }
function OrderPanel() { return <div className="rounded-oa-md border border-oa-line-soft bg-oa-bg p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-semibold">Recent orders</span><span className="font-mono text-[9px] text-oa-text-faint">Today</span></div><div className="space-y-3"><OrderLine name="Ayesha Rahman" item="Eid Premium Panjabi" amount="৳1,650" status="Pending" /><OrderLine name="Karim Hossain" item="Classic Linen Shirt" amount="৳2,200" status="Confirmed" /><OrderLine name="Rina Akter" item="Handloom Saree" amount="৳3,200" status="Delivered" /></div></div>; }
function StockPanel() { return <div className="rounded-oa-md border border-oa-line-soft bg-oa-bg p-3 sm:p-4"><div className="mb-3 text-[10px] font-semibold">Low stock</div><div className="space-y-3"><StockLine name="Eid Premium Panjabi" qty="2 units" red /><StockLine name="Classic Linen Shirt" qty="4 units" /><div className="rounded-[6px] border border-oa-blue/20 bg-oa-blue-dim px-2.5 py-2 text-[9px] leading-4 text-oa-blue">Ask Assistant about restocking</div></div></div>; }
function OrderLine({ name, item, amount, status }: { name: string; item: string; amount: string; status: string }) { const color = status === "Delivered" ? "text-oa-green" : status === "Confirmed" ? "text-oa-blue" : "text-oa-gold"; return <div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="truncate text-[9px] font-medium sm:text-[10px]">{name}</div><div className="truncate text-[8px] text-oa-text-faint">{item}</div></div><div className="shrink-0 text-right"><div className="font-mono text-[9px]">{amount}</div><div className={`mt-0.5 text-[7px] ${color}`}>{status}</div></div></div>; }
function StockLine({ name, qty, red = false }: { name: string; qty: string; red?: boolean }) { return <div className="flex items-center justify-between gap-2"><span className="truncate text-[9px] text-oa-text-dim">{name}</span><span className={`shrink-0 font-mono text-[9px] ${red ? "text-oa-red" : "text-oa-gold"}`}>{qty}</span></div>; }
function ArrowIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>; }
function CheckIcon() { return <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>; }
function MessageIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="11" rx="3" /><path d="M8 21l4-4 4 4" /><circle cx="9" cy="10.5" r=".6" fill="currentColor" stroke="none" /><circle cx="15" cy="10.5" r=".6" fill="currentColor" stroke="none" /></svg>; }
function OrderIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7l1.5-3h13L20 7" /><path d="M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7Z" /><path d="M9 11a3 3 0 0 0 6 0" /></svg>; }
function InventoryIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>; }
function AssistantIcon() { return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" /></svg>; }
