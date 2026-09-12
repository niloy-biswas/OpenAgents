import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

async function fixTable(table) {
  console.log(`\nFixing ${table}...`);

  await sql`
    WITH numbered AS (
      SELECT ctid, row_number() OVER (ORDER BY ctid) AS rn
      FROM ${sql.unsafe(table)}
      WHERE id IS NULL
    )
    UPDATE ${sql.unsafe(table)} t
    SET id = n.rn
    FROM numbered n
    WHERE t.ctid = n.ctid
  `;

  const seqName = `${table}_id_seq`;
  await sql.unsafe(`CREATE SEQUENCE IF NOT EXISTS "${seqName}"`);
  await sql.unsafe(`SELECT setval('"${seqName}"', COALESCE((SELECT MAX(id) FROM "${table}"), 1))`);
  await sql.unsafe(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT nextval('"${seqName}"')`);
  await sql.unsafe(`ALTER TABLE "${table}" ALTER COLUMN id SET NOT NULL`);

  const pk = await sql`
    SELECT conname FROM pg_constraint
    WHERE conrelid = ${sql.unsafe(table)}::regclass AND contype = 'p'
  `;
  if (!pk.length) {
    await sql.unsafe(`ALTER TABLE "${table}" ADD PRIMARY KEY (id)`);
  }

  await sql.unsafe(`ALTER SEQUENCE "${seqName}" OWNED BY "${table}".id`);
  await sql.unsafe(`ALTER TABLE "${table}" ALTER COLUMN created_at SET DEFAULT NOW()`);
  await sql.unsafe(`UPDATE "${table}" SET created_at = NOW() WHERE created_at IS NULL`);

  console.log(`${table} fixed`);
}

async function main() {
  try {
    await fixTable("products");
    await fixTable("orders");
    await fixTable("conversations");
    await fixTable("assistant_sessions");

    // assistant_messages already has ids; just enforce schema
    const pkAm = await sql`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'assistant_messages'::regclass AND contype = 'p'
    `;
    if (!pkAm.length) {
      await sql.unsafe(`ALTER TABLE "assistant_messages" ADD PRIMARY KEY (id)`);
    }
    await sql.unsafe(`ALTER TABLE "assistant_messages" ALTER COLUMN created_at SET DEFAULT NOW()`);
    await sql.unsafe(`UPDATE "assistant_messages" SET created_at = NOW() WHERE created_at IS NULL`);

    await sql.unsafe(`ALTER TABLE "orders" ALTER COLUMN product_id SET NOT NULL`);
    await sql.unsafe(`ALTER TABLE "assistant_messages" ALTER COLUMN session_id SET NOT NULL`);

    console.log("\nAll done.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
