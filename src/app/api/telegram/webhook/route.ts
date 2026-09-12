import { NextRequest } from "next/server";
import {
  getSettings,
  updateSettings,
  createAssistantSession,
  getAssistantMessages,
  saveAssistantMessage,
} from "@/lib/db";
import { runInsightChat } from "@/lib/langgraph/insight";
import { sendTelegramMessage, toTelegramText } from "@/lib/telegram";

export async function POST(request: NextRequest) {
  const settings = await getSettings();

  // Telegram echoes this back on every update for a webhook registered with
  // a secret_token — reject anything that doesn't match instead of trusting
  // the chat id in the body alone.
  if (settings.telegram_webhook_secret) {
    const secret = request.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== settings.telegram_webhook_secret) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const update = await request.json().catch(() => null);
  const message = update?.message;
  const text: string | undefined = message?.text;
  const chatId: string | undefined =
    message?.chat?.id != null ? String(message.chat.id) : undefined;

  // Always 200 — Telegram retries on non-2xx, and there's nothing useful to
  // retry for a non-text update or a chat we don't recognize.
  if (!text || !chatId) return Response.json({ ok: true });
  if (!settings.telegram_connected || !settings.telegram_bot_token) {
    return Response.json({ ok: true });
  }
  if (String(settings.telegram_chat_id) !== chatId) {
    return Response.json({ ok: true });
  }

  let sessionId = settings.telegram_session_id;
  if (!sessionId) {
    const session = await createAssistantSession();
    sessionId = session.id;
    await updateSettings({ telegram_session_id: sessionId });
  }

  const priorMessages = await getAssistantMessages(sessionId);
  const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));

  await saveAssistantMessage({ session_id: sessionId, role: "user", content: text });
  const reply = await runInsightChat(history, text, "telegram");
  await saveAssistantMessage({ session_id: sessionId, role: "assistant", content: reply });

  try {
    await sendTelegramMessage(settings.telegram_bot_token, chatId, toTelegramText(reply));
  } catch (err) {
    console.error("[telegram webhook] sendMessage failed:", err);
  }

  return Response.json({ ok: true });
}
