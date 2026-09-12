import postgres from "postgres";

// ─── DB client (falls back to in-memory mock when DATABASE_URL is missing) ─────

const databaseUrl = process.env.DATABASE_URL;
const sql: ReturnType<typeof postgres> | null = databaseUrl ? postgres(databaseUrl, { prepare: false }) : null;

if (!sql) {
  console.warn("[db] DATABASE_URL not set — using in-memory mock store for local preview");
}

export default sql;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductVariant {
  label: string;
  stock: number;
}

export interface Product {
  id: number;
  title: string;
  author: string | null;
  price: number;
  quantity: number;
  description: string | null;
  category: string | null;
  image_url: string | null;
  max_discount: number;
  swatch_color: string | null;
  swatch_code: string | null;
  variants: ProductVariant[] | null;
  created_at: Date;
}

export type OrderStatus =
  | "pending"
  | "called"
  | "confirmed"
  | "dispatched"
  | "delivered"
  | "returned"
  | "cancelled";

export interface Order {
  id: number;
  order_code: string;
  product_id: number;
  quantity: number;
  total_price: number;
  order_at: Date;
  delivery_at: Date | null;
  status: OrderStatus;
  sender_id: string;
  customer_name: string | null;
  phone: string | null;
  channel: string | null;
  receive_score: number | null;
  address: Record<string, string> | null;
}

export interface AssistantSession {
  id: number;
  title: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AssistantMessage {
  id: number;
  session_id: number;
  role: "user" | "assistant";
  content: string;
  created_at: Date;
}

// ─── Mock store & seed ────────────────────────────────────────────────────────

const mockProducts: Product[] = [];
const mockOrders: Order[] = [];
interface ConvRow {
  id: number;
  sender_id: string;
  role: "user" | "assistant";
  content: string;
  image_url: string | null;
  created_at: Date;
}
const mockConversations: ConvRow[] = [];
const mockAssistantSessions: AssistantSession[] = [];
const mockAssistantMessages: AssistantMessage[] = [];
let nextProductId = 1;
let nextOrderId = 1;
const mockOrderCode = (id: number) => `TRX-${String(id).padStart(3, "0")}`;
let nextConvId = 1;
let nextAssistantSessionId = 1;
let nextAssistantMessageId = 1;

function seedMock() {
  if (mockProducts.length) return;

  mockProducts.push(
    {
      id: nextProductId++,
      title: "Tintin: The Blue Lotus",
      author: "Hergé",
      price: 450,
      quantity: 18,
      description: "TBL-001",
      category: "Comics",
      image_url: "https://covers.openlibrary.org/b/id/755245-L.jpg",
      max_discount: 30,
      swatch_color: null,
      swatch_code: null,
      variants: [],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      id: nextProductId++,
      title: "Tintin: Destination Moon",
      author: "Hergé",
      price: 450,
      quantity: 18,
      description: "TDM-002",
      category: "Comics",
      image_url: "https://covers.openlibrary.org/b/id/8728178-L.jpg",
      max_discount: 30,
      swatch_color: null,
      swatch_code: null,
      variants: [],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: nextProductId++,
      title: "Harry Potter and the Philosopher's Stone",
      author: "J.K. Rowling",
      price: 650,
      quantity: 30,
      description: "HP1-004",
      category: "Fantasy",
      image_url: "https://covers.openlibrary.org/b/id/15155833-L.jpg",
      max_discount: 50,
      swatch_color: null,
      swatch_code: null,
      variants: [],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      id: nextProductId++,
      title: "The Metamorphosis",
      author: "Franz Kafka",
      price: 350,
      quantity: 35,
      description: "KM-007",
      category: "Classic",
      image_url: "https://covers.openlibrary.org/b/id/12820198-L.jpg",
      max_discount: 20,
      swatch_color: null,
      swatch_code: null,
      variants: [],
      created_at: new Date(),
    }
  );

  mockOrders.push(
    {
      id: nextOrderId,
      order_code: mockOrderCode(nextOrderId++),
      product_id: 1,
      quantity: 1,
      total_price: 1650,
      order_at: new Date(Date.now() - 1000 * 60 * 45),
      delivery_at: null,
      status: "pending",
      sender_id: "fb_882910112",
      customer_name: "Ayesha Rahman",
      phone: "+880 1711-223344",
      channel: "messenger",
      receive_score: 44,
      address: null,
    },
    {
      id: nextOrderId,
      order_code: mockOrderCode(nextOrderId++),
      product_id: 2,
      quantity: 2,
      total_price: 2200,
      order_at: new Date(Date.now() - 1000 * 60 * 90),
      delivery_at: null,
      status: "pending",
      sender_id: "wa_8801911223344",
      customer_name: "Karim Hossain",
      phone: "+880 1911-223344",
      channel: "whatsapp",
      receive_score: 82,
      address: null,
    },
    {
      id: nextOrderId,
      order_code: mockOrderCode(nextOrderId++),
      product_id: 1,
      quantity: 1,
      total_price: 1650,
      order_at: new Date(Date.now() - 1000 * 60 * 60 * 3),
      delivery_at: null,
      status: "confirmed",
      sender_id: "fb_991010334",
      customer_name: "Rina Akter",
      phone: "+880 1811-445566",
      channel: "messenger",
      receive_score: 91,
      address: null,
    },
    {
      id: nextOrderId,
      order_code: mockOrderCode(nextOrderId++),
      product_id: 3,
      quantity: 1,
      total_price: 3200,
      order_at: new Date(Date.now() - 1000 * 60 * 60 * 5),
      delivery_at: new Date(),
      status: "delivered",
      sender_id: "wa_8801711556677",
      customer_name: "Fatima Begum",
      phone: "+880 1711-556677",
      channel: "whatsapp",
      receive_score: 76,
      address: null,
    }
  );
}

// ─── Product queries ──────────────────────────────────────────────────────────

export async function listProducts(): Promise<Product[]> {
  if (!sql) {
    seedMock();
    return [...mockProducts].sort((a, b) => +b.created_at - +a.created_at);
  }
  return sql<Product[]>`SELECT * FROM products ORDER BY created_at DESC`;
}

export async function getProduct(id: number): Promise<Product | null> {
  if (!sql) {
    seedMock();
    return mockProducts.find((p) => p.id === id) ?? null;
  }
  const rows = await sql<Product[]>`SELECT * FROM products WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createProduct(data: {
  title: string;
  author?: string;
  price: number;
  quantity: number;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  max_discount?: number;
  swatch_color?: string | null;
  swatch_code?: string | null;
  variants?: ProductVariant[] | null;
}): Promise<Product> {
  const product: Product = {
    id: nextProductId++,
    title: data.title,
    author: data.author ?? null,
    price: data.price,
    quantity: data.quantity,
    description: data.description ?? null,
    category: data.category ?? null,
    image_url: data.image_url ?? null,
    max_discount: data.max_discount ?? 0,
    swatch_color: data.swatch_color ?? null,
    swatch_code: data.swatch_code ?? null,
    variants: data.variants ?? null,
    created_at: new Date(),
  };
  if (!sql) {
    seedMock();
    mockProducts.unshift(product);
    return product;
  }
  const rows = await sql<Product[]>`
    INSERT INTO products (title, author, price, quantity, description, category, image_url, max_discount, swatch_color, swatch_code, variants)
    VALUES (
      ${data.title},
      ${data.author ?? null},
      ${data.price},
      ${data.quantity},
      ${data.description ?? null},
      ${data.category ?? null},
      ${data.image_url ?? null},
      ${data.max_discount ?? 0},
      ${data.swatch_color ?? null},
      ${data.swatch_code ?? null},
      ${sql.json((data.variants as any) || [])}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function updateProduct(
  id: number,
  data: Partial<Omit<Product, "id" | "created_at">>
): Promise<Product | null> {
  if (!sql) {
    seedMock();
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const current = mockProducts[idx];
    const updated: Product = {
      ...current,
      ...data,
      id,
      created_at: current.created_at,
      variants: data.variants === undefined ? current.variants : data.variants,
    };
    mockProducts[idx] = updated;
    return updated;
  }
  const rows = await sql<Product[]>`
    UPDATE products
    SET
      title         = COALESCE(${data.title ?? null}, title),
      author        = COALESCE(${data.author ?? null}, author),
      price         = COALESCE(${data.price ?? null}, price),
      quantity      = COALESCE(${data.quantity ?? null}, quantity),
      description   = COALESCE(${data.description ?? null}, description),
      category      = COALESCE(${data.category ?? null}, category),
      image_url     = COALESCE(${data.image_url ?? null}, image_url),
      max_discount  = COALESCE(${data.max_discount ?? null}, max_discount),
      swatch_color  = COALESCE(${data.swatch_color ?? null}, swatch_color),
      swatch_code   = COALESCE(${data.swatch_code ?? null}, swatch_code),
      variants      = COALESCE(${data.variants ? sql.json(data.variants as any) : null}, variants)
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ?? null;
}

export async function deleteProduct(id: number): Promise<void> {
  if (!sql) {
    seedMock();
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx !== -1) mockProducts.splice(idx, 1);
    return;
  }
  await sql`DELETE FROM products WHERE id = ${id}`;
}

export interface CatalogSummary {
  product_count: number;
  total_stock_units: number;
  total_catalog_value: number;
}

export async function getCatalogSummary(): Promise<CatalogSummary> {
  if (!sql) {
    seedMock();
    return {
      product_count: mockProducts.length,
      total_stock_units: mockProducts.reduce((sum, p) => sum + p.quantity, 0),
      total_catalog_value: mockProducts.reduce((sum, p) => sum + p.quantity * Number(p.price), 0),
    };
  }
  const rows = await sql<{ product_count: number; total_stock_units: number; total_catalog_value: number }[]>`
    SELECT
      COUNT(*)::int                          AS product_count,
      COALESCE(SUM(quantity), 0)::int        AS total_stock_units,
      COALESCE(SUM(quantity * price), 0)::float AS total_catalog_value
    FROM products
  `;
  return rows[0];
}

export async function getLowStockProducts(threshold = 5): Promise<Product[]> {
  if (!sql) {
    seedMock();
    return mockProducts
      .filter((p) => p.quantity < threshold)
      .sort((a, b) => a.quantity - b.quantity);
  }
  return sql<Product[]>`
    SELECT * FROM products WHERE quantity < ${threshold} ORDER BY quantity ASC
  `;
}

export async function searchProducts(query: string, limit = 10): Promise<Product[]> {
  if (!sql) {
    seedMock();
    const q = query.toLowerCase();
    return mockProducts
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.author?.toLowerCase().includes(q)
      )
      .slice(0, limit);
  }
  const pattern = `%${query}%`;
  return sql<Product[]>`
    SELECT * FROM products
    WHERE title ILIKE ${pattern} OR category ILIKE ${pattern} OR author ILIKE ${pattern}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
}

// ─── Order queries ────────────────────────────────────────────────────────────

export async function listOrders(): Promise<(Order & { product_title: string })[]> {
  if (!sql) {
    seedMock();
    return mockOrders
      .map((o) => ({ ...o, product_title: mockProducts.find((p) => p.id === o.product_id)?.title ?? "Unknown" }))
      .sort((a, b) => +b.order_at - +a.order_at);
  }
  return sql<(Order & { product_title: string; product_image: string | null })[]>`
    SELECT o.*, p.title AS product_title, p.image_url AS product_image
    FROM orders o
    JOIN products p ON p.id = o.product_id
    ORDER BY o.order_at DESC
  `;
}

export async function getOrder(id: number): Promise<Order | null> {
  if (!sql) {
    seedMock();
    return mockOrders.find((o) => o.id === id) ?? null;
  }
  const rows = await sql<Order[]>`SELECT * FROM orders WHERE id = ${id}`;
  return rows[0] ?? null;
}

// Accepts whatever shape a human might type for the order_code column —
// "TRX-012", "trx-12", "#TRX-12", or just "12" — normalized to the
// zero-padded form the column actually stores (see schema.sql's generated
// column: 'TRX-' || LPAD(id::text, 3, '0')).
export function normalizeOrderCode(ref: string): string | null {
  const digits = ref.match(/\d+/)?.[0];
  if (!digits) return null;
  return `TRX-${digits.padStart(3, "0")}`;
}

export async function getOrderByCode(ref: string): Promise<Order | null> {
  const code = normalizeOrderCode(ref);
  if (!code) return null;
  if (!sql) {
    seedMock();
    return mockOrders.find((o) => o.order_code === code) ?? null;
  }
  const rows = await sql<Order[]>`SELECT * FROM orders WHERE order_code = ${code}`;
  return rows[0] ?? null;
}

export async function createOrder(data: {
  product_id: number;
  quantity: number;
  sender_id: string;
  customer_name?: string | null;
  phone?: string | null;
  channel?: string | null;
  receive_score?: number | null;
  address?: Record<string, string>;
}): Promise<Order> {
  const product = await getProduct(data.product_id);
  if (!product) throw new Error(`Product ${data.product_id} not found`);
  const total = product.price * data.quantity;
  const order: Order = {
    id: nextOrderId,
    order_code: mockOrderCode(nextOrderId++),
    product_id: data.product_id,
    quantity: data.quantity,
    total_price: total,
    order_at: new Date(),
    delivery_at: null,
    status: "pending",
    sender_id: data.sender_id,
    customer_name: data.customer_name ?? null,
    phone: data.phone ?? null,
    channel: data.channel ?? "messenger",
    receive_score: data.receive_score ?? 50,
    address: data.address ?? null,
  };
  if (!sql) {
    seedMock();
    mockOrders.unshift(order);
    return order;
  }
  const rows = await sql<Order[]>`
    INSERT INTO orders (
      product_id, quantity, total_price, sender_id,
      customer_name, phone, channel, receive_score, address
    )
    VALUES (
      ${data.product_id}, ${data.quantity}, ${total}, ${data.sender_id},
      ${data.customer_name ?? null}, ${data.phone ?? null},
      ${data.channel ?? 'messenger'}, ${data.receive_score ?? 50},
      ${data.address ? sql.json(data.address) : null}
    )
    RETURNING *
  `;
  return rows[0];
}

export interface OrderStats {
  order_count: number;
  total_revenue: number;
  pending: number;
  called: number;
  confirmed: number;
  dispatched: number;
  delivered: number;
  returned: number;
  cancelled: number;
}

export async function getOrderStats(days?: number): Promise<OrderStats> {
  const stats: OrderStats = {
    order_count: 0,
    total_revenue: 0,
    pending: 0,
    called: 0,
    confirmed: 0,
    dispatched: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
  };

  if (!sql) {
    seedMock();
    const cutoff = days ? Date.now() - days * 86_400_000 : 0;
    for (const o of mockOrders) {
      if (+o.order_at < cutoff) continue;
      stats.order_count++;
      if (o.status !== "pending") stats.total_revenue += Number(o.total_price);
      if (o.status in stats) (stats as unknown as Record<string, number>)[o.status]++;
    }
    return stats;
  }

  const rows = await sql<{ status: OrderStatus; cnt: number; revenue: number }[]>`
    SELECT status, COUNT(*)::int AS cnt, COALESCE(SUM(total_price), 0)::float AS revenue
    FROM orders
    ${days ? sql`WHERE order_at >= NOW() - (${days}::int * INTERVAL '1 day')` : sql``}
    GROUP BY status
  `;
  for (const r of rows) {
    stats.order_count += r.cnt;
    if (r.status !== "pending") stats.total_revenue += r.revenue;
    if (r.status in stats) (stats as unknown as Record<string, number>)[r.status] = r.cnt;
  }
  return stats;
}

export async function searchOrders(params: {
  status?: OrderStatus;
  senderId?: string;
  limit?: number;
}): Promise<(Order & { product_title: string })[]> {
  const limit = params.limit ?? 20;
  if (!sql) {
    seedMock();
    return mockOrders
      .filter(
        (o) =>
          (!params.status || o.status === params.status) &&
          (!params.senderId || o.sender_id === params.senderId)
      )
      .map((o) => ({
        ...o,
        product_title: mockProducts.find((p) => p.id === o.product_id)?.title ?? "Unknown",
      }))
      .sort((a, b) => +b.order_at - +a.order_at)
      .slice(0, limit);
  }
  return sql<(Order & { product_title: string })[]>`
    SELECT o.*, p.title AS product_title
    FROM orders o
    JOIN products p ON p.id = o.product_id
    WHERE 1=1
      ${params.status ? sql`AND o.status = ${params.status}` : sql``}
      ${params.senderId ? sql`AND o.sender_id = ${params.senderId}` : sql``}
    ORDER BY o.order_at DESC
    LIMIT ${limit}
  `;
}

export async function updateOrderStatus(
  id: number,
  status: Order["status"]
): Promise<Order | null> {
  if (!sql) {
    seedMock();
    const idx = mockOrders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    const order = mockOrders[idx];
    order.status = status;
    if (status === "delivered") order.delivery_at = new Date();
    return order;
  }
  const rows = await sql<Order[]>`
    UPDATE orders
    SET status = ${status},
        delivery_at = CASE WHEN ${status} = 'delivered' THEN NOW() ELSE delivery_at END
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ?? null;
}

// ─── Conversation history ─────────────────────────────────────────────────────

export async function getConversationHistory(
  senderPsid: string,
  limit = 10
): Promise<{ role: string; content: string }[]> {
  if (!sql) {
    return mockConversations
      .filter((c) => c.sender_id === senderPsid)
      .slice(-limit)
      .map((c) => ({ role: c.role, content: c.content }));
  }
  return sql<{ role: string; content: string }[]>`
    SELECT role, content FROM conversations
    WHERE sender_id = ${senderPsid}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `.then((rows) => rows.reverse());
}

export async function saveMessage(data: {
  sender_id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
}): Promise<void> {
  if (!sql) {
    mockConversations.push({
      id: nextConvId++,
      sender_id: data.sender_id,
      role: data.role,
      content: data.content,
      image_url: data.image_url ?? null,
      created_at: new Date(),
    });
    return;
  }
  await sql`
    INSERT INTO conversations (sender_id, role, content, image_url)
    VALUES (${data.sender_id}, ${data.role}, ${data.content}, ${data.image_url ?? null})
  `;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface SettingsRow {
  id: number;
  store_name: string;
  welcome_message: string;
  language: string;
  currency: string;
  facebook_page_token: string | null;
  facebook_verify_token: string | null;
  facebook_app_secret: string | null;
  facebook_page_id: string | null;
  facebook_page_name: string | null;
  facebook_connected: boolean;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  telegram_connected: boolean;
  telegram_session_id: number | null;
  telegram_webhook_secret: string | null;
  onboarding_completed: boolean;
  business_name: string | null;
  product_type: string | null;
  tone_instructions: string | null;
  openai_api_key: string | null;
  updated_at: Date;
}

export async function getSettings(): Promise<SettingsRow> {
  if (!sql) {
    return {
      id: 1,
      store_name: process.env.SETTINGS_STORE_NAME || "My Store",
      welcome_message: process.env.SETTINGS_WELCOME_MESSAGE || "Welcome! How can I help you today?",
      language: process.env.SETTINGS_LANGUAGE || "bangla",
      currency: process.env.SETTINGS_CURRENCY || "৳",
      facebook_page_token: process.env.FB_PAGE_ACCESS_TOKEN || null,
      facebook_verify_token: process.env.FB_VERIFY_TOKEN || null,
      facebook_app_secret: process.env.FB_APP_SECRET || null,
      facebook_page_id: process.env.FB_PAGE_ID || null,
      facebook_page_name: process.env.FB_PAGE_NAME || null,
      facebook_connected: !!process.env.FB_PAGE_ACCESS_TOKEN,
      telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || null,
      telegram_chat_id: process.env.TELEGRAM_CHAT_ID || null,
      telegram_connected: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
      telegram_session_id: null,
      telegram_webhook_secret: process.env.TELEGRAM_WEBHOOK_SECRET || null,
      onboarding_completed: process.env.SETTINGS_ONBOARDING_COMPLETED === "true",
      business_name: process.env.SETTINGS_BUSINESS_NAME || null,
      product_type: process.env.SETTINGS_PRODUCT_TYPE || null,
      tone_instructions: process.env.SETTINGS_TONE_INSTRUCTIONS || null,
      openai_api_key: process.env.OPENAI_API_KEY || null,
      updated_at: new Date(),
    };
  }
  const rows = await sql<SettingsRow[]>`SELECT * FROM settings WHERE id = 1`;
  if (!rows.length) {
    await sql`INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
    const [row] = await sql<SettingsRow[]>`SELECT * FROM settings WHERE id = 1`;
    return row;
  }
  return rows[0];
}

export async function updateSettings(
  data: Partial<Omit<SettingsRow, "id" | "updated_at">>
): Promise<SettingsRow> {
  if (!sql) {
    return getSettings();
  }
  await sql`
    UPDATE settings
    SET
      store_name            = COALESCE(${data.store_name ?? null}, store_name),
      welcome_message       = COALESCE(${data.welcome_message ?? null}, welcome_message),
      language              = COALESCE(${data.language ?? null}, language),
      currency              = COALESCE(${data.currency ?? null}, currency),
      facebook_page_token   = COALESCE(${data.facebook_page_token ?? null}, facebook_page_token),
      facebook_verify_token = COALESCE(${data.facebook_verify_token ?? null}, facebook_verify_token),
      facebook_app_secret   = COALESCE(${data.facebook_app_secret ?? null}, facebook_app_secret),
      facebook_page_id      = COALESCE(${data.facebook_page_id ?? null}, facebook_page_id),
      facebook_page_name    = COALESCE(${data.facebook_page_name ?? null}, facebook_page_name),
      facebook_connected    = COALESCE(${data.facebook_connected ?? null}, facebook_connected),
      telegram_bot_token    = COALESCE(${data.telegram_bot_token ?? null}, telegram_bot_token),
      telegram_chat_id      = COALESCE(${data.telegram_chat_id ?? null}, telegram_chat_id),
      telegram_connected    = COALESCE(${data.telegram_connected ?? null}, telegram_connected),
      telegram_session_id   = COALESCE(${data.telegram_session_id ?? null}, telegram_session_id),
      telegram_webhook_secret = COALESCE(${data.telegram_webhook_secret ?? null}, telegram_webhook_secret),
      onboarding_completed  = COALESCE(${data.onboarding_completed ?? null}, onboarding_completed),
      business_name         = COALESCE(${data.business_name ?? null}, business_name),
      product_type          = COALESCE(${data.product_type ?? null}, product_type),
      tone_instructions     = COALESCE(${data.tone_instructions ?? null}, tone_instructions),
      openai_api_key        = COALESCE(${data.openai_api_key ?? null}, openai_api_key),
      updated_at            = NOW()
    WHERE id = 1
  `;
  return getSettings();
}

export async function markOnboardingComplete(): Promise<SettingsRow> {
  if (!sql) return getSettings();
  await sql`UPDATE settings SET onboarding_completed = TRUE, updated_at = NOW() WHERE id = 1`;
  return getSettings();
}

export async function seedAdminStoreIfEmpty(): Promise<void> {
  if (!sql) return;
  const existing = await sql<{ count: number }[]>`SELECT COUNT(*)::int as count FROM products`;
  if (existing[0].count > 0) return;

  const seedProducts = [
    { title: "Tintin: The Blue Lotus", author: "Hergé", price: 450, quantity: 18, description: "TBL-001", category: "Comics", image_url: "https://covers.openlibrary.org/b/id/755245-L.jpg", max_discount: 30 },
    { title: "Tintin: Destination Moon", author: "Hergé", price: 450, quantity: 18, description: "TDM-002", category: "Comics", image_url: "https://covers.openlibrary.org/b/id/8728178-L.jpg", max_discount: 30 },
    { title: "Tintin: The Secret of the Unicorn", author: "Hergé", price: 450, quantity: 22, description: "TSU-003", category: "Comics", image_url: "https://covers.openlibrary.org/b/id/6979825-L.jpg", max_discount: 30 },
    { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", price: 650, quantity: 30, description: "HP1-004", category: "Fantasy", image_url: "https://covers.openlibrary.org/b/id/15155833-L.jpg", max_discount: 50 },
    { title: "Harry Potter and the Chamber of Secrets", author: "J.K. Rowling", price: 650, quantity: 0, description: "HP2-005", category: "Fantasy", image_url: "https://covers.openlibrary.org/b/id/15158664-L.jpg", max_discount: 50 },
    { title: "Harry Potter and the Prisoner of Azkaban", author: "J.K. Rowling", price: 701, quantity: 4, description: "HP3-006", category: "Fantasy", image_url: "https://covers.openlibrary.org/b/id/10580435-L.jpg", max_discount: 0 },
    { title: "The Metamorphosis", author: "Franz Kafka", price: 350, quantity: 35, description: "KM-007", category: "Classic", image_url: "https://covers.openlibrary.org/b/id/12820198-L.jpg", max_discount: 20 },
    { title: "The Trial", author: "Franz Kafka", price: 500, quantity: 12, description: "KT-008", category: "Classic", image_url: "https://covers.openlibrary.org/b/id/997423-L.jpg", max_discount: 25 },
    { title: "1984", author: "George Orwell", price: 400, quantity: 28, description: "OR-009", category: "Dystopian", image_url: "https://covers.openlibrary.org/b/id/9267242-L.jpg", max_discount: 40 },
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", price: 380, quantity: 40, description: "FG-010", category: "Classic", image_url: "https://covers.openlibrary.org/b/id/10590366-L.jpg", max_discount: 30 },
  ];

  const created: Product[] = [];
  for (const p of seedProducts) {
    created.push(await createProduct(p));
  }

  const [p1, p2, p3] = created;
  await createOrder({ product_id: p1.id, quantity: 1, sender_id: "fb_882910112", customer_name: "Ayesha Rahman", phone: "+880 1711-223344", channel: "messenger", receive_score: 44 });
  await createOrder({ product_id: p2.id, quantity: 2, sender_id: "wa_8801911223344", customer_name: "Karim Hossain", phone: "+880 1911-223344", channel: "whatsapp", receive_score: 82 });
  await createOrder({ product_id: p1.id, quantity: 1, sender_id: "fb_991010334", customer_name: "Rina Akter", phone: "+880 1811-445566", channel: "messenger", receive_score: 91 });
  await createOrder({ product_id: p3.id, quantity: 1, sender_id: "wa_8801711556677", customer_name: "Fatima Begum", phone: "+880 1711-556677", channel: "whatsapp", receive_score: 76 });

  await saveMessage({ sender_id: "fb_882910112", role: "user", content: "আসসালামু আলাইকুম। Harry Potter আছে?" });
  await saveMessage({ sender_id: "fb_882910112", role: "assistant", content: "ওয়ালাইকুমুস সালাম। হ্যাঁ, J.K. Rowling-এর Harry Potter সিরিজ আছে। আপনি কোন বইটি চান?" });
  await saveMessage({ sender_id: "wa_8801911223344", role: "user", content: "Delivery kothay hobe?" });
  await saveMessage({ sender_id: "wa_8801911223344", role: "assistant", content: "Sir, we deliver books all over Bangladesh via courier. Please share your full address and phone number." });
}

export async function resetDemoStore(): Promise<SettingsRow> {
  if (!sql) return getSettings();

  // Keep Facebook tokens; reset only onboarding/profile/demo data.
  await sql`
    UPDATE settings
    SET
      store_name            = 'My Demo Store',
      welcome_message       = 'Welcome to our store! How can I help you today?',
      language              = 'bangla',
      currency              = '৳',
      facebook_page_id      = NULL,
      facebook_page_name    = NULL,
      facebook_connected    = facebook_page_token IS NOT NULL,
      telegram_bot_token    = NULL,
      telegram_chat_id      = NULL,
      telegram_connected    = FALSE,
      telegram_session_id   = NULL,
      telegram_webhook_secret = NULL,
      onboarding_completed  = FALSE,
      updated_at            = NOW()
    WHERE id = 1
  `;

  await sql`TRUNCATE TABLE products, orders, conversations RESTART IDENTITY`;

  return getSettings();
}

// ─── Inventory KPIs (computed from products + orders, no extra table) ────────

export interface InventoryKpis {
  // Strip 1 — stock position
  totalSkus: number;
  unitsOnHand: number;
  inventoryValue: number;
  retailValue: number;
  availableToSell: number;
  reserved: number;
  // Strip 2 — risk & velocity
  incoming: number;
  lowStock: number;
  critical: number;
  outOfStock: number;
  deadStock: number;
  deadStockUnits: number;
}

export async function getInventoryKpis(): Promise<InventoryKpis> {
  if (!sql) {
    return {
      totalSkus: 0, unitsOnHand: 0, inventoryValue: 0, retailValue: 0,
      availableToSell: 0, reserved: 0, incoming: 0,
      lowStock: 0, critical: 0, outOfStock: 0, deadStock: 0, deadStockUnits: 0,
    };
  }

  const [prodRow, orderRow, deadRow] = await Promise.all([
    sql<{ total_skus: string; units: string; inv_value: string; retail_value: string; low: string; crit: string; out: string }[]>`
      SELECT
        COUNT(*)::int                                     AS total_skus,
        COALESCE(SUM(quantity), 0)                        AS units,
        COALESCE(SUM(price * quantity * 0.7), 0)          AS inv_value,
        COALESCE(SUM(price * quantity), 0)                AS retail_value,
        COUNT(*) FILTER (WHERE quantity > 0 AND quantity < 5)  AS low,
        COUNT(*) FILTER (WHERE quantity > 0 AND quantity < 3)  AS crit,
        COUNT(*) FILTER (WHERE quantity = 0)                   AS out
      FROM products
    `,
    sql<{ reserved: string; incoming: string }[]>`
      SELECT
        COALESCE(SUM(quantity) FILTER (WHERE status IN ('pending','called','confirmed')), 0) AS reserved,
        COALESCE(SUM(quantity) FILTER (WHERE status = 'dispatched'), 0)                      AS incoming
      FROM orders
    `,
    sql<{ dead_count: string; dead_units: string }[]>`
      SELECT
        COUNT(DISTINCT p.id)::int                    AS dead_count,
        COALESCE(SUM(p.quantity), 0)                 AS dead_units
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM orders o
        WHERE o.product_id = p.id
          AND o.status = 'delivered'
          AND o.order_at > NOW() - INTERVAL '60 days'
      )
      AND p.quantity > 0
    `,
  ]);

  const p = prodRow[0];
  const o = orderRow[0];
  const d = deadRow[0];

  const unitsOnHand   = Number(p?.units ?? 0);
  const reserved      = Number(o?.reserved ?? 0);
  const availableToSell = Math.max(0, unitsOnHand - reserved);

  return {
    totalSkus:       Number(p?.total_skus ?? 0),
    unitsOnHand,
    inventoryValue:  Math.round(Number(p?.inv_value ?? 0)),
    retailValue:     Math.round(Number(p?.retail_value ?? 0)),
    availableToSell,
    reserved,
    incoming:        Number(o?.incoming ?? 0),
    lowStock:        Number(p?.low ?? 0),
    critical:        Number(p?.crit ?? 0),
    outOfStock:      Number(p?.out ?? 0),
    deadStock:       Number(d?.dead_count ?? 0),
    deadStockUnits:  Number(d?.dead_units ?? 0),
  };
}

// ─── Recommendations (computed from products + orders, no extra table) ────────

export interface RecoKpis {
  open: number;
  completed: number;
  urgent: number;
  impact: number;
}

export async function getRecoKpis(): Promise<RecoKpis> {
  if (!sql) return { open: 0, completed: 0, urgent: 0, impact: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [prodRows, orderRows] = await Promise.all([
    sql<{ low: string; critical: string }[]>`
      SELECT
        COUNT(*) FILTER (WHERE quantity > 0 AND quantity < 5)  AS low,
        COUNT(*) FILTER (WHERE quantity < 3)                   AS critical
      FROM products
    `,
    sql<{ pending_count: string; pending_impact: string; done_today: string }[]>`
      SELECT
        COUNT(*)          FILTER (WHERE status = 'pending')                          AS pending_count,
        COALESCE(SUM(total_price) FILTER (WHERE status = 'pending'), 0)             AS pending_impact,
        COUNT(*)          FILTER (WHERE status IN ('confirmed','delivered','dispatched')
                                    AND order_at >= ${today})                        AS done_today
      FROM orders
    `,
  ]);

  const p = prodRows[0];
  const o = orderRows[0];

  const lowStock    = Number(p?.low ?? 0);
  const critical    = Number(p?.critical ?? 0);
  const pending     = Number(o?.pending_count ?? 0);
  const impact      = Number(o?.pending_impact ?? 0);
  const doneToday   = Number(o?.done_today ?? 0);

  return {
    open:      lowStock + pending,   // low-stock products + unconfirmed orders
    completed: doneToday,            // confirmed/delivered today
    urgent:    critical,             // stock < 3 (stockout imminent)
    impact,                          // total value of pending orders
  };
}

// ─── Demand products ──────────────────────────────────────────────────────────

export interface DemandProduct {
  id: number;
  product_name: string;
  sender_id: string;
  request_count: number;
  created_at: Date;
}

export async function addDemandProduct(
  senderPsid: string,
  productName: string
): Promise<void> {
  if (!sql) return;
  const normalized = productName.trim().toLowerCase();
  await sql`
    INSERT INTO demand_products (product_name, sender_id, request_count)
    VALUES (${normalized}, ${senderPsid}, 1)
    ON CONFLICT (product_name, sender_id)
    DO UPDATE SET request_count = demand_products.request_count + 1
  `;
}

export async function listDemandProducts(): Promise<{ product_name: string; total_requests: number; unique_users: number; last_requested: Date }[]> {
  if (!sql) return [];
  return sql`
    SELECT
      product_name,
      SUM(request_count)::int  AS total_requests,
      COUNT(DISTINCT sender_id)::int AS unique_users,
      MAX(created_at)          AS last_requested
    FROM demand_products
    GROUP BY product_name
    ORDER BY total_requests DESC
  `;
}

export async function deleteDemandProduct(productName: string): Promise<void> {
  if (!sql) return;
  await sql`DELETE FROM demand_products WHERE product_name = ${productName}`;
}

// ─── Chart data ───────────────────────────────────────────────────────────────

export interface WeeklyPoint {
  day: string;      // "Mon", "Tue", …
  orders: number;
  revenue: number;
}

export async function getWeeklyChart(): Promise<WeeklyPoint[]> {
  if (!sql) return [];
  const rows = await sql<{ day: string; orders: string; revenue: string }[]>`
    SELECT
      TO_CHAR(gs.d, 'Dy')                                              AS day,
      COALESCE(COUNT(o.id), 0)                                         AS orders,
      COALESCE(SUM(o.total_price), 0)                                  AS revenue
    FROM generate_series(
      DATE_TRUNC('day', NOW()) - INTERVAL '6 days',
      DATE_TRUNC('day', NOW()),
      INTERVAL '1 day'
    ) AS gs(d)
    LEFT JOIN orders o
      ON DATE_TRUNC('day', o.order_at) = gs.d
    GROUP BY gs.d
    ORDER BY gs.d
  `;
  return rows.map((r) => ({
    day: r.day,
    orders: Number(r.orders),
    revenue: Math.round(Number(r.revenue)),
  }));
}

export interface TopProduct {
  title: string;
  units: number;
  revenue: number;
}

export async function getTopProducts(limit = 3): Promise<TopProduct[]> {
  if (!sql) return [];
  const rows = await sql<{ title: string; units: string; revenue: string }[]>`
    SELECT
      p.title,
      SUM(o.quantity)::int     AS units,
      SUM(o.total_price)       AS revenue
    FROM orders o
    JOIN products p ON p.id = o.product_id
    WHERE o.status NOT IN ('cancelled')
    GROUP BY p.id, p.title
    ORDER BY units DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    title: r.title,
    units: Number(r.units),
    revenue: Math.round(Number(r.revenue)),
  }));
}

// ─── Log queries ──────────────────────────────────────────────────────────────

export interface FbContact {
  sender_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_pic: string | null;
  fetched_at: Date;
}

export async function upsertFbContact(data: {
  sender_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_pic: string | null;
}): Promise<void> {
  if (!sql) return;
  await sql`
    INSERT INTO fb_contacts (sender_id, first_name, last_name, profile_pic, fetched_at)
    VALUES (${data.sender_id}, ${data.first_name}, ${data.last_name}, ${data.profile_pic}, NOW())
    ON CONFLICT (sender_id) DO UPDATE
      SET first_name  = EXCLUDED.first_name,
          last_name   = EXCLUDED.last_name,
          profile_pic = EXCLUDED.profile_pic,
          fetched_at  = NOW()
  `;
}

export async function getFbContact(senderId: string): Promise<FbContact | null> {
  if (!sql) return null;
  const rows = await sql<FbContact[]>`
    SELECT * FROM fb_contacts WHERE sender_id = ${senderId}
  `;
  return rows[0] ?? null;
}

export interface ConversationSummary {
  sender_id: string;
  message_count: number;
  last_message: string;
  last_at: Date;
  first_name: string | null;
  last_name: string | null;
  profile_pic: string | null;
}

export async function listConversationSenders(): Promise<ConversationSummary[]> {
  if (!sql) {
    const grouped = new Map<string, ConvRow[]>();
    for (const c of mockConversations) {
      const arr = grouped.get(c.sender_id) || [];
      arr.push(c);
      grouped.set(c.sender_id, arr);
    }
    return Array.from(grouped.entries())
      .map(([sender_id, rows]) => {
        rows.sort((a, b) => +a.created_at - +b.created_at);
        return {
          sender_id,
          message_count: rows.length,
          last_message: rows[rows.length - 1].content,
          last_at: rows[rows.length - 1].created_at,
          first_name: null,
          last_name: null,
          profile_pic: null,
        };
      })
      .sort((a, b) => +b.last_at - +a.last_at);
  }
  return sql<ConversationSummary[]>`
    SELECT
      c.sender_id,
      COUNT(*)::int                                        AS message_count,
      (ARRAY_AGG(c.content ORDER BY c.created_at DESC))[1] AS last_message,
      MAX(c.created_at)                                    AS last_at,
      f.first_name,
      f.last_name,
      f.profile_pic
    FROM conversations c
    LEFT JOIN fb_contacts f ON f.sender_id = c.sender_id
    GROUP BY c.sender_id, f.first_name, f.last_name, f.profile_pic
    ORDER BY MAX(c.created_at) DESC
  `;
}

export interface ConversationMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  image_url: string | null;
  created_at: Date;
}

export async function getThreadBySender(
  senderPsid: string
): Promise<ConversationMessage[]> {
  if (!sql) {
    return mockConversations
      .filter((c) => c.sender_id === senderPsid)
      .sort((a, b) => +a.created_at - +b.created_at)
      .map((c) => ({ id: c.id, role: c.role, content: c.content, image_url: c.image_url ?? null, created_at: c.created_at }));
  }
  return sql<ConversationMessage[]>`
    SELECT id, role, content, image_url, created_at
    FROM conversations
    WHERE sender_id = ${senderPsid}
    ORDER BY created_at ASC, id ASC
  `;
}

// ─── Assistant chat sessions ──────────────────────────────────────────────────

export async function createAssistantSession(): Promise<AssistantSession> {
  if (!sql) {
    const session: AssistantSession = {
      id: nextAssistantSessionId++,
      title: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    mockAssistantSessions.unshift(session);
    return session;
  }
  const rows = await sql<AssistantSession[]>`
    INSERT INTO assistant_sessions DEFAULT VALUES RETURNING *
  `;
  return rows[0];
}

export async function listAssistantSessions(): Promise<AssistantSession[]> {
  if (!sql) {
    return [...mockAssistantSessions].sort((a, b) => +b.updated_at - +a.updated_at);
  }
  return sql<AssistantSession[]>`
    SELECT * FROM assistant_sessions ORDER BY updated_at DESC
  `;
}

export async function deleteAssistantSession(id: number): Promise<void> {
  if (!sql) {
    const idx = mockAssistantSessions.findIndex((s) => s.id === id);
    if (idx !== -1) mockAssistantSessions.splice(idx, 1);
    for (let i = mockAssistantMessages.length - 1; i >= 0; i--) {
      if (mockAssistantMessages[i].session_id === id) mockAssistantMessages.splice(i, 1);
    }
    return;
  }
  await sql`DELETE FROM assistant_sessions WHERE id = ${id}`;
}

export async function getAssistantMessages(sessionId: number): Promise<AssistantMessage[]> {
  if (!sql) {
    return mockAssistantMessages
      .filter((m) => m.session_id === sessionId)
      .sort((a, b) => +a.created_at - +b.created_at);
  }
  return sql<AssistantMessage[]>`
    SELECT * FROM assistant_messages WHERE session_id = ${sessionId} ORDER BY created_at ASC
  `;
}

export async function saveAssistantMessage(data: {
  session_id: number;
  role: "user" | "assistant";
  content: string;
}): Promise<void> {
  // First user message in a session becomes its title (truncated) for the session list.
  const title = data.role === "user" ? data.content.slice(0, 60) : null;

  if (!sql) {
    mockAssistantMessages.push({
      id: nextAssistantMessageId++,
      session_id: data.session_id,
      role: data.role,
      content: data.content,
      created_at: new Date(),
    });
    const session = mockAssistantSessions.find((s) => s.id === data.session_id);
    if (session) {
      session.updated_at = new Date();
      if (title && !session.title) session.title = title;
    }
    return;
  }
  await sql`
    INSERT INTO assistant_messages (session_id, role, content)
    VALUES (${data.session_id}, ${data.role}, ${data.content})
  `;
  await sql`
    UPDATE assistant_sessions
    SET updated_at = NOW(),
        title = COALESCE(title, ${title})
    WHERE id = ${data.session_id}
  `;
}


