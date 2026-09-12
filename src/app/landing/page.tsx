import { verifySession } from "@/lib/auth";
import LandingPage from "@/components/LandingPage";

export default async function LandingRoute() {
  const session = await verifySession();
  return <LandingPage isLoggedIn={Boolean(session)} />;
}
