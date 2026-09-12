import { NextRequest } from "next/server";
import { getOrder, getProduct, updateOrderStatus, saveMessage } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { sendMessage } from "@/lib/messenger";

const STATUS_NOTIFICATIONS: Partial<Record<string, (productTitle: string) => string>> = {
  confirmed: (productTitle) =>
    `Good news! Your order for "${productTitle}" has been confirmed. We'll let you know as soon as it's dispatched.`,
  dispatched: (productTitle) =>
    `Your order for "${productTitle}" has been dispatched and is on its way to you!`,
};

async function notifyStatusChange(order: Awaited<ReturnType<typeof getOrder>>) {
  if (!order || order.channel !== "messenger") return;
  const buildMessage = STATUS_NOTIFICATIONS[order.status];
  if (!buildMessage) return;

  const product = await getProduct(order.product_id);
  const text = buildMessage(product?.title ?? "your order");

  try {
    await sendMessage(order.sender_id, text);
  } catch (err) {
    console.error(`[orders] Messenger notification failed for order ${order.id}:`, err);
  }

  try {
    await saveMessage({ sender_id: order.sender_id, role: "assistant", content: text });
  } catch (err) {
    console.error(`[orders] Saving notification message failed for order ${order.id}:`, err);
  }
}

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

  // Failure is logged, not thrown — a Messenger delivery failure shouldn't fail the status update itself.
  await notifyStatusChange(order);

  return Response.json(order);
}
