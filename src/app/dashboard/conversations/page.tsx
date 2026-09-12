import { listOrders, listProducts } from "@/lib/db";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const [orders, products] = await Promise.all([listOrders(), listProducts()]);
  return <ChatClient orders={orders} products={products} />;
}
