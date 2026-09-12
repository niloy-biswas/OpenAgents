import { NextRequest } from "next/server";
import { getOrder, updateOrderStatus } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await getOrder(Number(id));
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();
  const order = await updateOrderStatus(Number(id), status);
  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(order);
}
