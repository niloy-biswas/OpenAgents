import { listProducts } from "@/lib/db";
import ProductsClient from "./client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await listProducts();
  return <ProductsClient products={products} />;
}
