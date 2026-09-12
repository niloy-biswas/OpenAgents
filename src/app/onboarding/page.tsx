import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import OnboardingClient from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await verifySession();
  if (!session) redirect("/login");
  if (session.account === "admin") redirect("/dashboard");
  return <OnboardingClient />;
}
