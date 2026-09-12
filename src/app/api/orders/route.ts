import { NextRequest } from "next/server";
import { listOrders, createOrder } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await listOrders();
  return Response.json(orders);
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const order = await createOrder(data);
  return Response.json(order, { status: 201 });
}
