import { listOrders, listProducts } from "@/lib/db";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, products] = await Promise.all([listOrders(), listProducts()]);
  return <OrdersClient orders={orders} products={products} />;
}
