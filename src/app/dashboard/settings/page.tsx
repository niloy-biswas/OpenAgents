"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "channels" | "telegram" | "profile";

type Settings = {
  store_name: string;
  welcome_message: string;
  language: string;
  currency: string;
  facebook_connected: boolean;
  facebook_page_name: string | null;
  facebook_page_id: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  telegram_connected: boolean;
};

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("channels");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // form state
  const [storeName, setStoreName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [language, setLanguage] = useState("bangla");
  const [currency, setCurrency] = useState("৳");
  const [pageToken, setPageToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [appSecret, setAppSecret] = useState("");

  // telegram
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  // connection test
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setStoreName(data.store_name);
        setWelcomeMessage(data.welcome_message);
        setLanguage(data.language);
        setCurrency(data.currency);
        setTelegramBotToken(data.telegram_bot_token || "");
        setTelegramChatId(data.telegram_chat_id || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_name: storeName,
        welcome_message: welcomeMessage,
        language,
        currency,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSettings(data);
      setMessage("Business profile saved.");
    } else {
      setMessage(data.error || "Failed to save profile.");
    }
    setSaving(false);
  }

  async function saveChannels() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        facebook_page_token: pageToken || undefined,
        facebook_verify_token: verifyToken || undefined,
        facebook_app_secret: appSecret || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSettings(data);
      setMessage("Channel settings saved.");
    } else {
      setMessage(data.error || "Failed to save channels.");
    }
    setSaving(false);
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch("/api/settings/channels/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: pageToken || undefined }),
    });
    const data = await res.json();
    setTestResult({
      ok: data.ok,
      text: data.ok
        ? `Connected to ${data.page.name}`
        : data.error || "Connection failed",
    });
    if (data.ok) {
      setSettings((s) =>
        s
          ? { ...s, facebook_connected: true, facebook_page_name: data.page.name }
          : s
      );
    }
    setTesting(false);
  }

  async function saveTelegram() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_bot_token: telegramBotToken || undefined,
        telegram_chat_id: telegramChatId || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSettings(data);
      setMessage("Telegram settings saved.");
    } else {
      setMessage(data.error || "Failed to save Telegram settings.");
    }
    setSaving(false);
  }

  async function testTelegram() {
    setTestingTelegram(true);
    setTelegramTestResult(null);
    const res = await fetch("/api/settings/telegram/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botToken: telegramBotToken || undefined }),
    });
    const data = await res.json();
    setTelegramTestResult({
      ok: data.ok,
      text: data.ok
        ? `Connected to @${data.bot.username}${data.webhookRegistered ? " — now listening for your messages" : ""}`
        : data.error || "Connection failed",
    });
    if (data.ok) {
      setSettings((s) => (s ? { ...s, telegram_connected: true } : s));
    }
    setTestingTelegram(false);
  }

  function webhookUrl() {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/api/webhook`;
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl());
    setMessage("Webhook URL copied to clipboard.");
    setTimeout(() => setMessage(null), 2000);
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-oa-text-dim text-sm">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {message && (
        <div className="bg-oa-surface border border-oa-line-soft rounded-oa-md px-4 py-2.5 text-sm text-oa-text-dim">
          {message}
        </div>
      )}

      <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg p-1.5 flex gap-1 w-fit">
        <TabButton active={tab === "channels"} onClick={() => setTab("channels")}>
          Channels
        </TabButton>
        <TabButton active={tab === "telegram"} onClick={() => setTab("telegram")}>
          Telegram
        </TabButton>
        <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
          Business profile
        </TabButton>
      </div>

      {tab === "channels" && (
        <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Facebook Page</h2>
              <p className="text-xs text-oa-text-faint mt-0.5">Connect Messenger so the agent can reply to customers.</p>
            </div>
            {settings?.facebook_connected ? (
              <span className="inline-flex items-center gap-1.5 bg-oa-green-dim text-oa-green border border-oa-green/20 rounded-full px-2.5 py-1 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-oa-green" />
                Connected{settings.facebook_page_name ? ` · ${settings.facebook_page_name}` : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-oa-surface-raise text-oa-text-dim border border-oa-line rounded-full px-2.5 py-1 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-oa-text-faint" />
                Not connected
              </span>
            )}
          </div>

          <div className="space-y-4">
            <Input label="Page Access Token" type="password" value={pageToken} onChange={setPageToken} placeholder="Paste token from Facebook Developers" />
            <Input label="Verify Token" type="password" value={verifyToken} onChange={setVerifyToken} placeholder="Must match your webhook subscription token" />
            <Input label="App Secret (optional)" type="password" value={appSecret} onChange={setAppSecret} placeholder="Used to verify webhook signatures" />
          </div>

          <div className="bg-oa-bg border border-oa-line-soft rounded-oa-md p-4 space-y-3">
            <div className="text-xs text-oa-text-faint">Webhook URL</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-oa-surface-raise border border-oa-line rounded-oa-sm px-3 py-2 text-xs font-mono text-oa-text-dim truncate">
                {webhookUrl()}
              </code>
              <button onClick={copyWebhook} className="bg-oa-surface-raise border border-oa-line hover:border-oa-primary text-oa-text-dim hover:text-oa-primary rounded-oa-sm px-3 py-2 text-xs transition-colors">
                Copy
              </button>
            </div>
            <p className="text-[11px] text-oa-text-faint">Paste this URL into your Facebook Developer App webhook settings.</p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={saveChannels} disabled={saving} className="bg-oa-primary text-white font-semibold text-sm px-4 py-2 rounded-oa-sm hover:brightness-110 disabled:opacity-50 transition-all">
              {saving ? "Saving…" : "Save channel settings"}
            </button>
            <button onClick={testConnection} disabled={testing} className="bg-oa-surface-raise border border-oa-line text-oa-text-dim hover:text-oa-text hover:border-oa-line-soft text-sm px-4 py-2 rounded-oa-sm transition-colors disabled:opacity-50">
              {testing ? "Testing…" : "Test connection"}
            </button>
          </div>

          {testResult && (
            <div className={cn("text-sm px-4 py-2.5 rounded-oa-md border", testResult.ok ? "bg-oa-green-dim text-oa-green border-oa-green/20" : "bg-oa-red-dim text-oa-red border-oa-red/20")}>
              {testResult.text}
            </div>
          )}
        </div>
      )}

      {tab === "telegram" && (
        <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Telegram notifications</h2>
              <p className="text-xs text-oa-text-faint mt-0.5">Get low-stock and order alerts in Telegram.</p>
            </div>
            {settings?.telegram_connected ? (
              <span className="inline-flex items-center gap-1.5 bg-oa-green-dim text-oa-green border border-oa-green/20 rounded-full px-2.5 py-1 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-oa-green" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-oa-surface-raise text-oa-text-dim border border-oa-line rounded-full px-2.5 py-1 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-oa-text-faint" />
                Not connected
              </span>
            )}
          </div>

          <div className="space-y-4">
            <Input label="Bot token" type="password" value={telegramBotToken} onChange={setTelegramBotToken} placeholder="123456:ABC-DEF..." />
            <Input label="Chat ID" value={telegramChatId} onChange={setTelegramChatId} placeholder="123456789 or @yourchannel" />
          </div>

          <div className="bg-oa-bg border border-oa-line-soft rounded-oa-md p-4 space-y-2 text-xs text-oa-text-faint">
            <div>How to get these values:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>Message <strong>@BotFather</strong> on Telegram and create a bot.</li>
              <li>Copy the bot token and paste it above.</li>
              <li>Start a chat with your bot, then use a tool or the bot updates to find your <code>chat_id</code>.</li>
            </ol>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={saveTelegram} disabled={saving} className="bg-oa-primary text-white font-semibold text-sm px-4 py-2 rounded-oa-sm hover:brightness-110 disabled:opacity-50 transition-all">
              {saving ? "Saving…" : "Save Telegram settings"}
            </button>
            <button onClick={testTelegram} disabled={testingTelegram || !telegramBotToken} className="bg-oa-surface-raise border border-oa-line text-oa-text-dim hover:text-oa-text hover:border-oa-line-soft text-sm px-4 py-2 rounded-oa-sm transition-colors disabled:opacity-50">
              {testingTelegram ? "Testing…" : "Test bot"}
            </button>
          </div>

          {telegramTestResult && (
            <div className={cn("text-sm px-4 py-2.5 rounded-oa-md border", telegramTestResult.ok ? "bg-oa-green-dim text-oa-green border-oa-green/20" : "bg-oa-red-dim text-oa-red border-oa-red/20")}>
              {telegramTestResult.text}
            </div>
          )}
        </div>
      )}

      {tab === "profile" && (
        <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg p-6 space-y-6">
          <div>
            <h2 className="text-base font-semibold">Business profile</h2>
            <p className="text-xs text-oa-text-faint mt-0.5">These details shape how the assistant talks to customers.</p>
          </div>

          <div className="space-y-4">
            <Input label="Store name" value={storeName} onChange={setStoreName} placeholder="e.g. Admin's Store" />
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1.5">Welcome message</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm text-oa-text outline-none focus:border-oa-primary resize-none"
                placeholder="Welcome! How can I help you today?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-oa-text-faint mb-1.5">Default language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm text-oa-text outline-none focus:border-oa-primary"
                >
                  <option value="bangla">Bangla</option>
                  <option value="english">English</option>
                  <option value="banglish">Banglish</option>
                </select>
              </div>
              <Input label="Currency symbol" value={currency} onChange={setCurrency} placeholder="৳" />
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving} className="bg-oa-primary text-white font-semibold text-sm px-4 py-2 rounded-oa-sm hover:brightness-110 disabled:opacity-50 transition-all">
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-sm px-3.5 py-1.5 rounded-oa-sm transition-colors",
        active ? "bg-oa-surface-raise text-oa-text font-medium" : "text-oa-text-dim hover:bg-oa-surface-hi hover:text-oa-text"
      )}
    >
      {children}
    </button>
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
        className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm text-oa-text placeholder:text-oa-text-faint outline-none focus:border-oa-primary"
      />
    </div>
  );
}
