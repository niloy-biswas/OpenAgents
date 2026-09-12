import { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";
import { sendMessage } from "@/lib/messenger";
import { saveMessage } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { sender_id, text } = await request.json();
  if (!sender_id || !text) {
    return Response.json({ error: "sender_id and text required" }, { status: 400 });
  }

  await sendMessage(sender_id, text);
  await saveMessage({ sender_id, role: "assistant", content: text });

  return Response.json({ ok: true });
}
