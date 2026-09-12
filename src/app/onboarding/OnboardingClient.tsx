"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type OnboardingState = {
  store_name: string;
  welcome_message: string;
  language: string;
  currency: string;
  facebook_page_token: string;
  facebook_verify_token: string;
  facebook_app_secret: string;
  facebook_page_id: string | null;
  facebook_page_name: string | null;
  facebook_connected: boolean;
  telegram_bot_token: string;
  telegram_chat_id: string;
  telegram_connected: boolean;
  onboarding_completed: boolean;
};

const STEPS = ["Welcome", "Profile", "Channels", "Catalog", "Telegram", "Done"];

export default function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<OnboardingState>({
    store_name: "",
    welcome_message: "",
    language: "bangla",
    currency: "৳",
    facebook_page_token: "",
    facebook_verify_token: "",
    facebook_app_secret: "",
    facebook_page_id: null,
    facebook_page_name: null,
    facebook_connected: false,
    telegram_bot_token: "",
    telegram_chat_id: "",
    telegram_connected: false,
    onboarding_completed: false,
  });

  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [telegramTestResult, setTelegramTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; errors: { row: number; error: string }[] } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/onboarding/state")
      .then((r) => r.json())
      .then((data) => {
        setState((s) => ({ ...s, ...data }));
      })
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof OnboardingState>(field: K, value: OnboardingState[K]) {
    setState((s) => ({ ...s, [field]: value }));
  }

  async function saveProfile() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_name: state.store_name,
        welcome_message: state.welcome_message,
        language: state.language,
        currency: state.currency,
      }),
    });
    setSaving(false);
  }

  async function saveChannels() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facebook_page_token: state.facebook_page_token || undefined,
        facebook_verify_token: state.facebook_verify_token || undefined,
        facebook_app_secret: state.facebook_app_secret || undefined,
      }),
    });
    setSaving(false);
  }

  async function testConnection() {
    setTestResult(null);
    const res = await fetch("/api/settings/channels/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: state.facebook_page_token || undefined }),
    });
    const data = await res.json();
    setTestResult({
      ok: data.ok,
      text: data.ok ? `Connected to ${data.page.name}` : data.error || "Connection failed",
    });
    if (data.ok) {
      update("facebook_connected", true);
      update("facebook_page_name", data.page.name);
    }
  }

  async function saveTelegram() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_bot_token: state.telegram_bot_token || undefined,
        telegram_chat_id: state.telegram_chat_id || undefined,
      }),
    });
    setSaving(false);
  }

  async function testTelegram() {
    setTelegramTestResult(null);
    const res = await fetch("/api/settings/telegram/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: state.telegram_bot_token || undefined }),
    });
    const data = await res.json();
    setTelegramTestResult({
      ok: data.ok,
      text: data.ok ? `Connected to @${data.bot.username}` : data.error || "Connection failed",
    });
    if (data.ok) {
      update("telegram_connected", true);
    }
  }

  async function uploadCatalog() {
    if (!file) return;
    setSaving(true);
    setImportResult(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/settings/catalog/import", { method: "POST", body: form });
    const data = await res.json();
    setImportResult(
      res.ok
        ? { imported: data.imported, errors: data.errors }
        : { imported: 0, errors: [{ row: 0, error: data.error || "Upload failed" }] }
    );
    setSaving(false);
  }

  async function finish() {
    setSaving(true);
    await fetch("/api/onboarding/complete", { method: "POST" });
    setSaving(false);
    router.push("/dashboard");
  }

  function webhookUrl() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/webhook`;
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl());
    setMessage("Webhook URL copied");
    setTimeout(() => setMessage(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-oa-bg text-oa-text-dim text-sm">
        Preparing your store…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-oa-bg text-oa-text flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-oa-text-faint mb-2">
            {STEPS.map((label, i) => (
              <span key={label} className={cn(i === step ? "text-oa-gold font-medium" : i < step ? "text-oa-text-dim" : "")}>
                {label}
              </span>
            ))}
          </div>
          <div className="h-1.5 bg-oa-surface-raise rounded-full overflow-hidden">
            <div
              className="h-full bg-oa-gold transition-all"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {message && (
          <div className="mb-4 bg-oa-surface border border-oa-line-soft rounded-oa-md px-4 py-2.5 text-sm text-oa-text-dim">
            {message}
          </div>
        )}

        <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg p-8">
          {step === 0 && (
            <div className="text-center space-y-5">
              <div className="h-14 w-14 rounded-oa-md bg-gradient-to-br from-oa-gold to-[#c97d1e] flex items-center justify-center mx-auto text-oa-bg font-mono font-bold text-2xl">
                ৳
              </div>
              <h1 className="text-2xl font-semibold font-head">Build your AI store</h1>
              <p className="text-sm text-oa-text-dim max-w-md mx-auto">
                Connect your Facebook Page, import your catalog, and let OpenPage reply to customers, track stock, and surface insights automatically.
              </p>
              <div className="grid grid-cols-3 gap-3 text-xs text-oa-text-dim pt-2">
                <FeatureCard icon="🤖" text="Auto-reply on Messenger" />
                <FeatureCard icon="📦" text="Live catalog & stock" />
                <FeatureCard icon="💡" text="Daily insights" />
              </div>
              <button
                onClick={() => setStep(1)}
                className="bg-oa-gold text-oa-bg font-semibold text-sm px-6 py-2.5 rounded-oa-sm hover:brightness-110 transition-all"
              >
                Get started
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Business profile</h2>
              <p className="text-xs text-oa-text-faint">This shapes how the assistant speaks to your customers.</p>
              <Input label="Store name" value={state.store_name} onChange={(v) => update("store_name", v)} placeholder="e.g. Admin's Store" />
              <div>
                <label className="block text-[11px] text-oa-text-faint mb-1.5">Welcome message</label>
                <textarea
                  value={state.welcome_message}
                  onChange={(e) => update("welcome_message", e.target.value)}
                  rows={3}
                  className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm text-oa-text outline-none focus:border-oa-gold resize-none"
                  placeholder="Welcome! How can I help you today?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-oa-text-faint mb-1.5">Default language</label>
                  <select
                    value={state.language}
                    onChange={(e) => update("language", e.target.value)}
                    className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm text-oa-text outline-none focus:border-oa-gold"
                  >
                    <option value="bangla">Bangla</option>
                    <option value="english">English</option>
                    <option value="banglish">Banglish</option>
                  </select>
                </div>
                <Input label="Currency symbol" value={state.currency} onChange={(v) => update("currency", v)} placeholder="৳" />
              </div>
              <StepNav
                onBack={() => setStep(0)}
                onNext={async () => {
                  await saveProfile();
                  setStep(2);
                }}
                saving={saving}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Connect Facebook Page</h2>
              <p className="text-xs text-oa-text-faint">Messenger messages will flow into the dashboard and get AI replies.</p>

              {state.facebook_page_token && (
                <div className="bg-oa-green-dim text-oa-green border border-oa-green/20 rounded-oa-md px-3 py-2 text-xs">
                  Demo token already filled. You can test the connection or replace it.
                </div>
              )}

              <Input label="Page Access Token" type="password" value={state.facebook_page_token} onChange={(v) => update("facebook_page_token", v)} placeholder="Paste token" />
              <Input label="Verify Token" type="password" value={state.facebook_verify_token} onChange={(v) => update("facebook_verify_token", v)} placeholder="Webhook verify token" />
              <Input label="App Secret (optional)" type="password" value={state.facebook_app_secret} onChange={(v) => update("facebook_app_secret", v)} placeholder="For webhook signature verification" />

              <div className="bg-oa-bg border border-oa-line-soft rounded-oa-md p-4 space-y-3">
                <div className="text-xs text-oa-text-faint">Webhook URL</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-oa-surface-raise border border-oa-line rounded-oa-sm px-3 py-2 text-xs font-mono text-oa-text-dim truncate">
                    {webhookUrl()}
                  </code>
                  <button onClick={copyWebhook} className="bg-oa-surface-raise border border-oa-line hover:border-oa-gold text-oa-text-dim hover:text-oa-gold rounded-oa-sm px-3 py-2 text-xs transition-colors">
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={testConnection}
                  disabled={saving || !state.facebook_page_token}
                  className="bg-oa-surface-raise border border-oa-line text-oa-text-dim hover:text-oa-text hover:border-oa-line-soft text-sm px-4 py-2 rounded-oa-sm transition-colors disabled:opacity-50"
                >
                  {saving ? "Testing…" : "Test connection"}
                </button>
                {state.facebook_connected && (
                  <span className="text-xs text-oa-green">Connected{state.facebook_page_name ? ` · ${state.facebook_page_name}` : ""}</span>
                )}
              </div>

              {testResult && (
                <div className={cn("text-sm px-4 py-2.5 rounded-oa-md border", testResult.ok ? "bg-oa-green-dim text-oa-green border-oa-green/20" : "bg-oa-red-dim text-oa-red border-oa-red/20")}>
                  {testResult.text}
                </div>
              )}

              <StepNav
                onBack={() => setStep(1)}
                onNext={async () => {
                  await saveChannels();
                  setStep(3);
                }}
                saving={saving}
                nextLabel="Next: Import catalog"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Import your catalog</h2>
              <p className="text-xs text-oa-text-faint">
                Download the template, fill your products, then upload the CSV.
              </p>

              <div className="flex items-center gap-3">
                <a
                  href="/api/onboarding/template"
                  download
                  className="inline-flex items-center gap-2 bg-oa-surface-raise border border-oa-line text-oa-text-dim hover:text-oa-text hover:border-oa-gold rounded-oa-sm px-4 py-2 text-sm transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                  Download template
                </a>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-oa-text-dim file:mr-3 file:py-2 file:px-3 file:rounded-oa-sm file:border-0 file:bg-oa-surface-raise file:text-oa-text hover:file:bg-oa-surface-hi file:transition-colors"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={uploadCatalog}
                  disabled={!file || saving}
                  className="bg-oa-gold text-oa-bg font-semibold text-sm px-4 py-2 rounded-oa-sm hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {saving ? "Importing…" : "Import products"}
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="text-xs text-oa-text-faint hover:text-oa-text"
                >
                  Skip for now
                </button>
              </div>

              {importResult && (
                <div className="bg-oa-bg border border-oa-line-soft rounded-oa-md p-4 text-sm space-y-2">
                  <div className={importResult.imported > 0 ? "text-oa-green" : "text-oa-text-dim"}>
                    Imported {importResult.imported} product{importResult.imported === 1 ? "" : "s"}.
                  </div>
                  {importResult.errors.length > 0 && (
                    <ul className="text-[11px] text-oa-red space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.map((e, i) => (
                        <li key={i}>Row {e.row}: {e.error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <StepNav
                onBack={() => setStep(2)}
                onNext={() => setStep(4)}
                saving={saving}
                nextLabel={importResult && importResult.imported > 0 ? "Next" : "Skip import"}
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 text-left">
              <h2 className="text-lg font-semibold">Telegram notifications (optional)</h2>
              <p className="text-xs text-oa-text-faint">
                Get low-stock alerts and order updates in Telegram.
              </p>

              <div className="space-y-4">
                <Input label="Bot token" type="password" value={state.telegram_bot_token} onChange={(v) => update("telegram_bot_token", v)} placeholder="Paste from @BotFather" />
                <Input label="Chat ID" value={state.telegram_chat_id} onChange={(v) => update("telegram_chat_id", v)} placeholder="123456789 or @channel" />
              </div>

              <div className="bg-oa-bg border border-oa-line-soft rounded-oa-md p-4 text-xs text-oa-text-faint space-y-2">
                <div>How to set it up later:</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Message <strong>@BotFather</strong> to create a bot.</li>
                  <li>Paste the bot token above.</li>
                  <li>Find your chat ID and paste it above.</li>
                </ol>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={testTelegram}
                  disabled={!state.telegram_bot_token}
                  className="bg-oa-surface-raise border border-oa-line text-oa-text-dim hover:text-oa-text hover:border-oa-line-soft text-sm px-4 py-2 rounded-oa-sm transition-colors disabled:opacity-50"
                >
                  Test bot
                </button>
                {state.telegram_connected && (
                  <span className="text-xs text-oa-green">Bot connected</span>
                )}
              </div>

              {telegramTestResult && (
                <div className={cn("text-sm px-4 py-2.5 rounded-oa-md border", telegramTestResult.ok ? "bg-oa-green-dim text-oa-green border-oa-green/20" : "bg-oa-red-dim text-oa-red border-oa-red/20")}>
                  {telegramTestResult.text}
                </div>
              )}

              <StepNav
                onBack={() => setStep(3)}
                onNext={async () => {
                  await saveTelegram();
                  setStep(5);
                }}
                saving={saving}
                nextLabel="Next"
              />
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-5">
              <div className="h-14 w-14 rounded-full bg-oa-green-dim border border-oa-green/20 flex items-center justify-center mx-auto">
                <svg className="h-7 w-7 text-oa-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">Your store is ready</h2>
              <p className="text-sm text-oa-text-dim">
                {state.store_name || "Your store"} is set up. Customers can message your Facebook Page and OpenPage will reply automatically.
              </p>
              <button
                onClick={finish}
                disabled={saving}
                className="bg-oa-gold text-oa-bg font-semibold text-sm px-6 py-2.5 rounded-oa-sm hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {saving ? "Finishing…" : "Go to dashboard"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-oa-surface-raise border border-oa-line rounded-oa-md p-3 text-center">
      <div className="text-lg mb-1">{icon}</div>
      <div>{text}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] text-oa-text-faint mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm text-oa-text placeholder:text-oa-text-faint outline-none focus:border-oa-gold"
      />
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  saving,
  nextLabel = "Next",
}: {
  onBack: () => void;
  onNext: () => void;
  saving: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between pt-4">
      <button onClick={onBack} className="text-sm text-oa-text-dim hover:text-oa-text transition-colors">
        Back
      </button>
      <button
        onClick={onNext}
        disabled={saving}
        className="bg-oa-gold text-oa-bg font-semibold text-sm px-5 py-2 rounded-oa-sm hover:brightness-110 disabled:opacity-50 transition-all"
      >
        {saving ? "Saving…" : nextLabel}
      </button>
    </div>
  );
}
