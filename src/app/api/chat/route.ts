import { NextRequest } from "next/server";
import { runInsightChat } from "@/lib/langgraph/insight";
import { verifySession } from "@/lib/auth";
import { getAssistantMessages, saveAssistantMessage } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { message, session_id } = await request.json();
  if (!message) return Response.json({ error: "message required" }, { status: 400 });
  if (!session_id) return Response.json({ error: "session_id required" }, { status: 400 });

  const priorMessages = await getAssistantMessages(session_id);
  const history = priorMessages.map((m) => ({ role: m.role, content: m.content }));

  await saveAssistantMessage({ session_id, role: "user", content: message });
  const reply = await runInsightChat(history, message);
  await saveAssistantMessage({ session_id, role: "assistant", content: reply });

  return Response.json({ reply });
}
