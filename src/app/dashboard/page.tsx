import { listOrders, listProducts, getRecoKpis, getInventoryKpis, getWeeklyChart, getTopProducts } from "@/lib/db";
import OverviewClient from "./OverviewClient";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [orders, products, recoKpis, invKpis, weeklyChart, topProducts] = await Promise.all([
    listOrders(),
    listProducts(),
    getRecoKpis(),
    getInventoryKpis(),
    getWeeklyChart(),
    getTopProducts(),
  ]);
  return (
    <OverviewClient
      orders={orders}
      products={products}
      recoKpis={recoKpis}
      invKpis={invKpis}
      weeklyChart={weeklyChart}
      topProducts={topProducts}
    />
  );
}
