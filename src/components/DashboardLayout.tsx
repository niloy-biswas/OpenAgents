"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { cn } from "../lib/utils";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { href: "/dashboard", label: "Overview", icon: OverviewIcon },
  { href: "/dashboard/conversations", label: "Conversations", icon: ConversationsIcon },
  { href: "/dashboard/orders", label: "Orders", icon: OrdersIcon },
  { href: "/dashboard/inventory", label: "Inventory", icon: InventoryIcon },
  { href: "/dashboard/demand", label: "Demand", icon: DemandIcon },
  { href: "/dashboard/assistant", label: "Assistant", icon: AssistantIcon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export default function DashboardLayout({
  children,
  account,
}: {
  children: React.ReactNode;
  account?: "admin" | "demo";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("oa_sidebar_collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggleSidebar() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("oa_sidebar_collapsed", next ? "1" : "0");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const activeItem =
    nav.find((n) =>
      n.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(n.href)
    ) || nav[0];
  const pageTitle = activeItem.label;
  const pageSubtitle = {
    Overview: "Orders · Inventory · AI insights",
    Conversations: "Facebook + WhatsApp conversations",
    Orders: "Manage and confirm orders",
    Inventory: "Products, stock levels, variants",
    Assistant: "Ask anything about your business",
    Settings: "Connect channels, profile and Telegram",
  }[pageTitle];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-oa-bg text-oa-text">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col shrink-0 bg-oa-sidebar border-r border-oa-line-soft transition-all duration-300",
          collapsed ? "w-16 px-2" : "w-[236px] px-3.5"
        )}
      >
        {/* Brand */}
        <Link
          href="/"
          className={cn(
            "flex items-center py-5",
            collapsed ? "justify-center px-0" : "gap-2.5 px-2"
          )}
        >
          <Logo className="h-[30px] w-[30px] shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-semibold text-[16.5px] leading-tight">OpenAgents</div>
              <div className="text-[10.5px] text-oa-text-faint">Dashboard</div>
            </div>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5">
          {nav.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center rounded-oa-sm text-[13.6px] transition-colors",
                  collapsed ? "justify-center px-0 py-2.5" : "gap-2.5 px-2.5 py-2",
                  active
                    ? "bg-oa-surface-hi text-oa-text"
                    : "text-oa-text-dim hover:bg-oa-surface hover:text-oa-text"
                )}
              >
                <span className="shrink-0 opacity-85"><item.icon /></span>
                {!collapsed && (
                  <span
                    className={cn(
                      "truncate",
                      item.href === "/dashboard/assistant" &&
                        "bg-gradient-to-r from-oa-blue via-[#b06dd8] to-[#ec7b9a] bg-clip-text text-transparent"
                    )}
                  >
                    {item.label}
                  </span>
                )}
                {active && (
                  <span
                    className={cn(
                      "absolute top-2 bottom-2 w-[3px] rounded-full bg-oa-primary",
                      collapsed ? "left-0" : "-left-3.5"
                    )}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="mt-auto flex flex-col gap-2.5 pt-4">
          {!collapsed && (
            <div className="bg-oa-surface border border-oa-line-soft rounded-oa-md p-3">
              <div className="text-[11px] text-oa-text-faint mb-2">Connected channels</div>
              <div className="flex flex-col gap-1.5 text-[12.5px] text-oa-text-dim">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-oa-green shadow-[0_0_0_3px_var(--oa-green-dim)]" />
                  Facebook — Admin&apos;s Store
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-oa-green shadow-[0_0_0_3px_var(--oa-green-dim)]" />
                  WhatsApp Business
                </div>
              </div>
            </div>
          )}
          <div
            className={cn(
              "bg-oa-surface border border-oa-line-soft rounded-oa-md flex items-center",
              collapsed ? "justify-center p-2" : "justify-between px-3 py-2.5"
            )}
          >
            {!collapsed && (
              <div className="flex items-center gap-2 text-[12.5px]">
                <span className="h-[7px] w-[7px] rounded-full bg-oa-green animate-pulse-dot" />
                Bot is live
              </div>
            )}
            <button className="relative h-[19px] w-[34px] rounded-full bg-oa-green-dim border border-oa-green shrink-0 cursor-pointer">
              <span className="absolute top-[2px] right-[2px] h-[13px] w-[13px] rounded-full bg-oa-green" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Topbar */}
        <header className="h-16 shrink-0 border-b border-oa-line-soft flex items-center justify-between px-6">
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 rounded-oa-sm flex items-center justify-center bg-oa-surface border border-oa-line-soft text-oa-text-dim hover:bg-oa-surface-hi hover:text-oa-text transition-colors shrink-0"
            >
              {menuIcon()}
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">{pageTitle}</h1>
              <p className="text-xs text-oa-text-faint truncate">{pageSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-oa-surface border border-oa-line-soft rounded-oa-sm px-3 py-2 w-[220px]">
              <svg className="h-3.5 w-3.5 text-oa-text-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search orders, products, numbers"
                className="bg-transparent outline-none text-sm w-full placeholder:text-oa-text-faint"
              />
            </div>
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="h-8 rounded-full bg-oa-surface-raise border border-oa-line-soft flex items-center gap-2 px-2 pr-3 font-mono text-xs text-oa-text-dim hover:border-oa-line transition-colors"
              >
                <span className="h-5 w-5 rounded-full bg-oa-surface-hi flex items-center justify-center text-[10px]">
                  {account === "demo" ? "D" : "A"}
                </span>
                <span>{account === "demo" ? "Demo" : "Admin"}</span>
              </button>
              {profileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-10 z-50 w-44 bg-oa-surface border border-oa-line-soft rounded-oa-md shadow-xl py-1">
                    <div className="px-3 py-2 border-b border-oa-line-soft">
                      <div className="text-xs font-medium text-oa-text">{account === "demo" ? "Demo account" : "Admin account"}</div>
                      <div className="text-[10px] text-oa-text-faint mt-0.5">{account === "demo" ? "Resets on login" : "Working store"}</div>
                    </div>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-oa-text-dim hover:bg-oa-surface-hi hover:text-oa-text transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

// Icons
function OverviewIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7l1.5-3h13L20 7" />
      <path d="M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" />
      <path d="M9 11a3 3 0 0 0 6 0" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function ConversationsIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="11" rx="3" />
      <path d="M8 21l4-4 4 4" />
      <circle cx="9" cy="10.5" r=".6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10.5" r=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DemandIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 8v4l3 3" />
      <path d="M18 2v4h4" />
      <path d="M22 2l-4 4" />
    </svg>
  );
}

function AssistantIcon() {
  const id = useId().replace(/:/g, "");
  const gradId = `assistant-grad-${id}`;
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" strokeWidth="0">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5b8def" />
          <stop offset="50%" stopColor="#b06dd8" />
          <stop offset="100%" stopColor="#ec7b9a" />
        </linearGradient>
      </defs>
      <path
        d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"
        fill={`url(#${gradId})`}
        stroke={`url(#${gradId})`}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V12a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function menuIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
