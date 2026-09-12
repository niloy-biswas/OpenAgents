import { NextRequest } from "next/server";
import { deleteAssistantSession, getAssistantMessages } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const messages = await getAssistantMessages(Number(id));
  return Response.json(messages);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteAssistantSession(Number(id));
  return Response.json({ ok: true });
}
