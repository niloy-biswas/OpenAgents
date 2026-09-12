import { listOrders, listProducts } from "@/lib/db";
import OverviewClient from "./OverviewClient";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [orders, products] = await Promise.all([listOrders(), listProducts()]);
  return <OverviewClient orders={orders} products={products} />;
}
