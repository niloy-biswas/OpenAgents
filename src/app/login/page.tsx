"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(data.account === "demo" ? "/onboarding" : "/dashboard");
    } else {
      setError("Invalid credentials");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-oa-bg p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-oa-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-oa-blue/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[380px] bg-oa-surface border border-oa-line-soft rounded-oa-lg p-7 shadow-2xl">
        <div className="flex flex-col items-center mb-7">
          <Logo className="h-11 w-11 shadow-lg shadow-oa-primary/10" />
          <h1 className="mt-4 text-xl font-semibold text-oa-text">OpenAgents Dashboard</h1>
          <p className="text-xs text-oa-text-faint mt-1">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-oa-text-faint mb-1.5">Username</label>
            <input
              name="username"
              placeholder="Enter username"
              required
              autoComplete="username"
              className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2.5 text-sm text-oa-text placeholder:text-oa-text-faint outline-none focus:border-oa-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] text-oa-text-faint mb-1.5">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              required
              autoComplete="current-password"
              className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2.5 text-sm text-oa-text placeholder:text-oa-text-faint outline-none focus:border-oa-primary transition-colors"
            />
          </div>

          {error && (
            <div className="text-xs text-oa-red bg-oa-red-dim border border-oa-red/20 rounded-oa-sm px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full bg-oa-primary text-white font-semibold text-sm py-2.5 rounded-oa-sm transition-all",
              "hover:brightness-110 active:scale-[0.98]",
              loading && "opacity-60 cursor-not-allowed"
            )}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-5 text-center text-[10.5px] text-oa-text-dim">
          Default: <span className="font-mono text-oa-text-faint">admin</span> / <span className="font-mono text-oa-text-faint">openagents</span>
        </div>
      </div>
    </div>
  );
}
