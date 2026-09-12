import { NextRequest } from "next/server";
import { parse } from "csv-parse/sync";
import { verifySession } from "@/lib/auth";
import { createProduct, type ProductVariant } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return Response.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, string>[] = [];
  try {
    rows = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err: any) {
    return Response.json({ error: `CSV parse error: ${err.message}` }, { status: 400 });
  }

  const imported: { id: number; title: string }[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const title = row.title || row.name || row.product;
    if (!title) {
      errors.push({ row: i + 2, error: "Missing product title" });
      continue;
    }

    let variants: ProductVariant[] | null = null;
    if (row.variants) {
      try {
        variants = JSON.parse(row.variants);
      } catch {
        // ignore invalid JSON
      }
    }

    try {
      const product = await createProduct({
        title,
        author: row.author || undefined,
        price: Number(row.price) || 0,
        quantity: Number(row.quantity ?? row.stock) || 0,
        description: row.sku || row.description || null,
        category: row.category || null,
        max_discount: Number(row.max_discount ?? row.discount) || 0,
        image_url: row.image_url || row.image || null,
        swatch_color: row.swatch_color || row.color || null,
        swatch_code: row.swatch_code || row.code || null,
        variants,
      });
      imported.push(product);
    } catch (err: any) {
      errors.push({ row: i + 2, error: err.message || "Insert failed" });
    }
  }

  return Response.json({ imported: imported.length, products: imported, errors });
}
