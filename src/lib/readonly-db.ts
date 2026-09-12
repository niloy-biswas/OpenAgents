import postgres from "postgres";

// Separate connection, authenticated as a Postgres role that only has SELECT
// on products/orders (no settings, no conversations) and
// default_transaction_read_only=on at the role level — enforced by Postgres
// itself, not just app-level checks. See schema.sql for the role setup.
const readonlyUrl = process.env.READONLY_DATABASE_URL;
const roSql: ReturnType<typeof postgres> | null = readonlyUrl ? postgres(readonlyUrl) : null;

const ALLOWED_TABLES = ["products", "orders"];

export const SCHEMA_DESCRIPTION = `
Tables available to execute_query (read-only):

products
  id INT, title TEXT, author TEXT, price NUMERIC, quantity INT, description TEXT,
  category TEXT, image_url TEXT, max_discount NUMERIC, created_at TIMESTAMPTZ

orders
  id INT, product_id INT (FK -> products.id), quantity INT, total_price NUMERIC,
  order_at TIMESTAMPTZ, delivery_at TIMESTAMPTZ,
  status TEXT (one of: pending, called, confirmed, dispatched, delivered, returned, cancelled),
  sender_id TEXT, customer_name TEXT, phone TEXT, channel TEXT
`.trim();

export class QueryRejected extends Error {}

function assertSafeSelect(query: string) {
  const trimmed = query.trim().replace(/;\s*$/, "");
  if (!/^select\b/i.test(trimmed)) {
    throw new QueryRejected("Only SELECT queries are allowed.");
  }
  if (trimmed.includes(";")) {
    throw new QueryRejected("Only a single statement is allowed.");
  }
  const referenced = trimmed.match(/\b(?:from|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi) ?? [];
  for (const clause of referenced) {
    const table = clause.split(/\s+/)[1].toLowerCase();
    if (!ALLOWED_TABLES.includes(table)) {
      throw new QueryRejected(`Table "${table}" is not queryable. Allowed: ${ALLOWED_TABLES.join(", ")}.`);
    }
  }
  return trimmed;
}

export async function executeReadOnlyQuery(query: string): Promise<Record<string, unknown>[]> {
  if (!roSql) {
    throw new Error("READONLY_DATABASE_URL is not configured");
  }
  const safe = assertSafeSelect(query);
  return roSql.unsafe(safe);
}
