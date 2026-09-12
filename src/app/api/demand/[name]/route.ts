import { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";
import { deleteDemandProduct } from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  await deleteDemandProduct(decodeURIComponent(name));
  return new Response(null, { status: 204 });
}
