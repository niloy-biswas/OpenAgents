import { listDemandProducts } from "@/lib/db";
import DemandClient from "./client";

export const dynamic = "force-dynamic";

export default async function DemandPage() {
  const demands = await listDemandProducts();
  return <DemandClient demands={demands} />;
}
