import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

await sql.unsafe('SET search_path TO public');
await sql`
  UPDATE settings
  SET business_name = 'OpenPage Bookstore',
      product_type = 'books',
      store_name = 'OpenPage Bookstore',
      welcome_message = 'Welcome! Ask about any book in our catalog.',
      updated_at = NOW()
  WHERE id = 1
`;
const rows = await sql`SELECT id, business_name, product_type, store_name FROM settings WHERE id = 1`;
console.log(rows[0]);
await sql.end();
