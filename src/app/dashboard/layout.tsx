import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import DashboardLayout from "@/components/DashboardLayout";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  if (!session) redirect("/login");

  // Demo users must finish onboarding before accessing the dashboard.
  if (session.account === "demo") {
    const settings = await getSettings();
    if (!settings.onboarding_completed) redirect("/onboarding");
  }

  return <DashboardLayout account={session.account}>{children}</DashboardLayout>;
}
