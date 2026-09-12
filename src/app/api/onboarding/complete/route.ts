import { NextRequest } from "next/server";
import { markOnboardingComplete } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await markOnboardingComplete();
  return Response.json({
    ok: true,
    onboarding_completed: settings.onboarding_completed,
  });
}
