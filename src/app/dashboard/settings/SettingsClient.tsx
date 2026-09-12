"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Initial {
  business_name: string;
  product_type: string;
  tone_instructions: string;
  fb_verify_token: string;
  fb_page_access_token_masked: string;
  openai_api_key_masked: string;
}

export default function SettingsClient({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initial.business_name);
  const [productType, setProductType] = useState(initial.product_type);
  const [toneInstructions, setToneInstructions] = useState(initial.tone_instructions);
  const [fbVerifyToken, setFbVerifyToken] = useState(initial.fb_verify_token);
  const [fbToken, setFbToken] = useState(initial.fb_page_access_token_masked);
  const [openaiKey, setOpenaiKey] = useState(initial.openai_api_key_masked);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const body: Record<string, string> = {
      business_name: businessName,
      product_type: productType,
      tone_instructions: toneInstructions,
      fb_verify_token: fbVerifyToken,
    };
    // Only send secret fields if the admin actually changed them from the
    // masked placeholder they were pre-filled with.
    if (fbToken !== initial.fb_page_access_token_masked) body.fb_page_access_token = fbToken;
    if (openaiKey !== initial.openai_api_key_masked) body.openai_api_key = openaiKey;

    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Business profile */}
      <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg overflow-hidden">
        <div className="p-5 border-b border-oa-line-soft flex items-center gap-2 text-sm font-semibold">
          <svg className="h-4 w-4 text-oa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Business profile
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">Business name</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Reader's Nook"
                className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-gold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-oa-text-faint mb-1">Product type</label>
              <input
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                placeholder="e.g. English books"
                className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-gold"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-oa-text-faint mb-1">Tone and address style</label>
            <textarea
              value={toneInstructions}
              onChange={(e) => setToneInstructions(e.target.value)}
              rows={3}
              placeholder="e.g. Address customers respectfully as apu/bhaiya, keep replies warm and concise."
              className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm outline-none focus:border-oa-gold resize-none"
            />
            <p className="text-[11px] text-oa-text-faint mt-1">
              Shown to the agent as guidance for how to address customers and phrase replies.
            </p>
          </div>
        </div>
      </div>

      {/* Channel & API keys */}
      <div className="bg-oa-surface border border-oa-line-soft rounded-oa-lg overflow-hidden">
        <div className="p-5 border-b border-oa-line-soft flex items-center gap-2 text-sm font-semibold">
          <svg className="h-4 w-4 text-oa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z" />
            <path d="M9 10V7a3 3 0 0 1 6 0v3" />
          </svg>
          Channel &amp; API keys
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] text-oa-text-faint mb-1">Webhook verify token</label>
            <input
              value={fbVerifyToken}
              onChange={(e) => setFbVerifyToken(e.target.value)}
              placeholder="Any string you choose — paste the same value into Meta's webhook setup"
              className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm font-mono outline-none focus:border-oa-gold"
            />
            <p className="text-[11px] text-oa-text-faint mt-1">
              Falls back to the server&apos;s <span className="font-mono">FB_VERIFY_TOKEN</span> env var if left blank.
            </p>
          </div>
          <div>
            <label className="block text-[11px] text-oa-text-faint mb-1">Facebook Page access token</label>
            <input
              value={fbToken}
              onChange={(e) => setFbToken(e.target.value)}
              placeholder="Paste a new Page access token to replace it"
              className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm font-mono outline-none focus:border-oa-gold"
            />
            <p className="text-[11px] text-oa-text-faint mt-1">
              Falls back to the server&apos;s <span className="font-mono">FB_PAGE_ACCESS_TOKEN</span> env var if left as-is.
            </p>
          </div>
          <div>
            <label className="block text-[11px] text-oa-text-faint mb-1">OpenAI API key</label>
            <input
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="Paste a new key to replace it"
              className="w-full bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-sm font-mono outline-none focus:border-oa-gold"
            />
            <p className="text-[11px] text-oa-text-faint mt-1">
              Falls back to the server&apos;s <span className="font-mono">OPENAI_API_KEY</span> env var if left as-is.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-oa-gold text-oa-bg text-sm font-semibold px-4 py-2 rounded-oa-sm hover:brightness-110 transition-all disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save settings"}
        </button>
        {saved && <span className="text-[12.5px] text-oa-green">Saved.</span>}
      </div>
    </div>
  );
}
