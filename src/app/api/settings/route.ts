import { NextRequest } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { verifySession } from "@/lib/auth";

function publicFields(settings: Awaited<ReturnType<typeof getSettings>>) {
  return {
    store_name: settings.store_name,
    welcome_message: settings.welcome_message,
    language: settings.language,
    currency: settings.currency,
    facebook_connected: settings.facebook_connected,
    facebook_page_name: settings.facebook_page_name,
    facebook_page_id: settings.facebook_page_id,
    telegram_bot_token: settings.telegram_bot_token,
    telegram_chat_id: settings.telegram_chat_id,
    telegram_connected: settings.telegram_connected,
    onboarding_completed: settings.onboarding_completed,
    updated_at: settings.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getSettings();
  return Response.json(publicFields(settings));
}

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  await updateSettings({
    store_name: data.store_name,
    welcome_message: data.welcome_message,
    language: data.language,
    currency: data.currency,
    facebook_page_token: data.facebook_page_token,
    facebook_verify_token: data.facebook_verify_token,
    facebook_app_secret: data.facebook_app_secret,
    telegram_bot_token: data.telegram_bot_token,
    telegram_chat_id: data.telegram_chat_id,
  });

  return Response.json(publicFields(await getSettings()));
}
