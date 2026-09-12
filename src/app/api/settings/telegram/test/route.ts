import { NextRequest } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { verifySession } from "@/lib/auth";

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

    return Response.json({
      ok: true,
      bot: { id: data.result.id, name: data.result.first_name, username: data.result.username },
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err.message || "Connection test failed" },
      { status: 500 }
    );
  }
}
