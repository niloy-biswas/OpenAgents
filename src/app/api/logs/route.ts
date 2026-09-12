import { NextRequest } from "next/server";
import { listConversationSenders, getThreadBySender } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sender = request.nextUrl.searchParams.get("sender");
  if (sender) {
    const thread = await getThreadBySender(sender);
    return Response.json(thread);
  }

  const senders = await listConversationSenders();
  return Response.json(senders);
}
