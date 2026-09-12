import { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  return Response.json({
    store_name: settings.store_name,
    welcome_message: settings.welcome_message,
    language: settings.language,
    currency: settings.currency,
    facebook_page_token: settings.facebook_page_token,
    facebook_verify_token: settings.facebook_verify_token,
    facebook_app_secret: settings.facebook_app_secret,
    facebook_page_id: settings.facebook_page_id,
    facebook_page_name: settings.facebook_page_name,
    facebook_connected: settings.facebook_connected,
    telegram_bot_token: settings.telegram_bot_token,
    telegram_chat_id: settings.telegram_chat_id,
    telegram_connected: settings.telegram_connected,
    onboarding_completed: settings.onboarding_completed,
    updated_at: settings.updated_at,
  });
}
