import { after } from "next/server";
import { getSettings } from "@/lib/db";
import { processMessengerMessage } from "@/lib/langgraph/agent";

// ─── Verification (GET) ───────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const settings = await getSettings();
  const validToken = settings.facebook_verify_token || process.env.FB_VERIFY_TOKEN || "";

  if (mode === "subscribe" && token && token === validToken) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ─── Receive messages (POST) ──────────────────────────────────────────────────

export async function POST(request: Request) {
  const body = await request.json();

  if (body.object !== "page") {
    return Response.json({ status: "ignored" }, { status: 200 });
  }

  // collect all text messages from payload
  const tasks: { senderPsid: string; text: string }[] = [];

  for (const entry of body.entry ?? []) {
    for (const event of entry.messaging ?? []) {
      const senderPsid = event.sender?.id as string;
      const text = event.message?.text as string | undefined;
      if (senderPsid && text) {
        tasks.push({ senderPsid, text });
      }
    }
  }

  // return 200 immediately; process in background
  after(async () => {
    for (const { senderPsid, text } of tasks) {
      try {
        await processMessengerMessage(senderPsid, text);
      } catch (err) {
        console.error("[webhook] processing error:", err);
      }
    }
  });

  return Response.json({ status: "ok" }, { status: 200 });
}
