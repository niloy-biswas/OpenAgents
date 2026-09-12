import { NextRequest } from "next/server";
import { createAssistantSession, listAssistantSessions } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await listAssistantSessions();
  return Response.json(sessions);
}

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const created = await createAssistantSession();
  return Response.json(created);
}
