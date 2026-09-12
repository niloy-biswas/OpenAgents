import { NextRequest } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { setTelegramWebhook } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const settings = await getSettings();
  const botToken = body.botToken || settings.telegram_bot_token;

  if (!botToken) {
    return Response.json(
      { ok: false, error: "Telegram bot token is required." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();

    if (!data.ok) {
      return Response.json(
        { ok: false, error: data.description || "Telegram API error" },
        { status: 400 }
      );
    }

    await updateSettings({
      telegram_bot_token: botToken,
      telegram_connected: true,
    });

    // Register the webhook so the owner can text the bot and get the same
    // assistant that answers in the dashboard. Telegram requires https, so
    // this is a no-op (not a failure) against a local http:// origin.
    let webhookRegistered = false;
    const origin = new URL(request.url).origin;
    if (origin.startsWith("https://")) {
      try {
        const webhookSecret = settings.telegram_webhook_secret || crypto.randomUUID();
        await setTelegramWebhook(botToken, `${origin}/api/telegram/webhook`, webhookSecret);
        await updateSettings({ telegram_webhook_secret: webhookSecret });
        webhookRegistered = true;
      } catch (err) {
        console.error("[telegram test] setWebhook failed:", err);
      }
    }

    return Response.json({
      ok: true,
      bot: { id: data.result.id, name: data.result.first_name, username: data.result.username },
      webhookRegistered,
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err.message || "Connection test failed" },
      { status: 500 }
    );
  }
}
