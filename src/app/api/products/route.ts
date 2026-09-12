import { NextRequest } from "next/server";
import { listProducts, createProduct } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const products = await listProducts();
  return Response.json(products);
}

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = await request.json();
  const product = await createProduct(data);
  return Response.json(product, { status: 201 });
}
