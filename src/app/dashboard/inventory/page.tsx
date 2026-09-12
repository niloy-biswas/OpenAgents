import { listProducts } from "@/lib/db";
import InventoryClient from "./InventoryClient";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await listProducts();
  return <InventoryClient products={products} />;
}
