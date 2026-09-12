import { Annotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  getSettings,
  getCatalogSummary,
  getLowStockProducts,
  searchProducts,
  getOrderStats,
  searchOrders,
  getProduct,
  updateProduct,
  type OrderStatus,
} from "../db";
import { executeReadOnlyQuery, SCHEMA_DESCRIPTION } from "../readonly-db";

// ─── Tools ────────────────────────────────────────────────────────────────────
// The assistant queries live data on demand instead of a full products/orders
// dump stuffed into the prompt — keeps token cost flat as the catalog/order
// history grows.

const tools = [
  tool(
    async ({ query }: { query: string }) => {
      try {
        const rows = await executeReadOnlyQuery(query);
        return JSON.stringify(rows);
      } catch (err) {
        return JSON.stringify({ error: err instanceof Error ? err.message : "Query failed" });
      }
    },
    {
      name: "execute_query",
      description: `Run a read-only SQL SELECT against the database for questions the other tools don't cover. Connection is a restricted DB role — SELECT only, only the tables below, writes are rejected at the database level.\n\n${SCHEMA_DESCRIPTION}`,
      schema: z.object({
        query: z.string().describe("A single SELECT statement, e.g. SELECT category, SUM(quantity) FROM products GROUP BY category"),
      }),
    }
  ),
  tool(
    async () => {
      const summary = await getCatalogSummary();
      return JSON.stringify(summary);
    },
    {
      name: "get_catalog_summary",
      description:
        "Get total product count, total stock units, and total catalog value across the whole product catalog. Use for 'how many products do I have' / catalog-wide questions.",
      schema: z.object({}),
    }
  ),
  tool(
    async ({ threshold }: { threshold?: number }) => {
      const products = await getLowStockProducts(threshold ?? 5);
      return JSON.stringify(
        products.map((p) => ({ id: p.id, title: p.title, quantity: p.quantity, price: p.price }))
      );
    },
    {
      name: "list_low_stock_products",
      description:
        "List products with stock below a threshold (default 5 units). Use for restock / running-low questions.",
      schema: z.object({
        threshold: z.number().nullable().optional().describe("Stock cutoff, default 5"),
      }),
    }
  ),
  tool(
    async ({ query }: { query: string }) => {
      const products = await searchProducts(query, 10);
      return JSON.stringify(
        products.map((p) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          quantity: p.quantity,
          category: p.category,
        }))
      );
    },
    {
      name: "search_products",
      description: "Search the product catalog by title, author, or category keyword.",
      schema: z.object({ query: z.string() }),
    }
  ),
  tool(
    async ({ days }: { days?: number }) => {
      const stats = await getOrderStats(days);
      return JSON.stringify(stats);
    },
    {
      name: "get_order_stats",
      description:
        "Get order counts by status and total revenue, optionally scoped to the last N days. Use for sales/revenue/trend questions.",
      schema: z.object({
        days: z.number().nullable().optional().describe("Limit to the last N days, omit for all-time"),
      }),
    }
  ),
  tool(
    async ({ product_id, quantity }: { product_id: number; quantity: number }) => {
      if (!Number.isInteger(quantity) || quantity < 0) {
        return JSON.stringify({ error: "quantity must be a non-negative integer" });
      }
      const existing = await getProduct(product_id);
      if (!existing) {
        return JSON.stringify({ error: `No product with id ${product_id}` });
      }
      const updated = await updateProduct(product_id, { quantity });
      return JSON.stringify({
        id: updated!.id,
        title: updated!.title,
        previous_quantity: existing.quantity,
        new_quantity: updated!.quantity,
      });
    },
    {
      name: "update_product_stock",
      description:
        "Set a product's stock quantity to an absolute value. Use for restocks or corrections the seller asks for (e.g. 'set X to 20 units', 'I just restocked Y with 15 more' — look up the current quantity first with search_products so you can add the delta, then call this with the new total). Always state the product name and the old/new quantity back to the seller after calling this.",
      schema: z.object({
        product_id: z.number().describe("The product's id, from search_products or list_low_stock_products"),
        quantity: z.number().describe("The new absolute stock quantity"),
      }),
    }
  ),
  tool(
    async ({
      status,
      sender_id,
      limit,
    }: {
      status?: OrderStatus;
      sender_id?: string;
      limit?: number;
    }) => {
      const orders = await searchOrders({ status, senderId: sender_id, limit });
      return JSON.stringify(
        orders.map((o) => ({
          id: o.id,
          product: o.product_title,
          quantity: o.quantity,
          total_price: o.total_price,
          status: o.status,
          customer: o.customer_name,
          sender_id: o.sender_id,
          order_at: o.order_at,
        }))
      );
    },
    {
      name: "search_orders",
      description:
        "Look up recent orders, optionally filtered by status or customer sender_id. Defaults to the 20 most recent.",
      schema: z.object({
        status: z
          .enum(["pending", "called", "confirmed", "dispatched", "delivered", "returned", "cancelled"])
          .nullable()
          .optional(),
        sender_id: z.string().nullable().optional(),
        limit: z.number().nullable().optional(),
      }),
    }
  ),
];

// ─── State ────────────────────────────────────────────────────────────────────

const InsightState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    value: (x, y) => x.concat(y),
    default: () => [],
  }),
  contextLoaded: Annotation<boolean>({ value: (_, y) => y, default: () => false }),
  systemContext: Annotation<string>({ value: (_, y) => y, default: () => "" }),
  apiKey: Annotation<string>({ value: (_, y) => y, default: () => "" }),
});

// ─── LLM ─────────────────────────────────────────────────────────────────────

function getLLM(apiKey: string) {
  return new ChatOpenAI({
    model: "gpt-5.6-luna",
    reasoningEffort: "none" as unknown as "low",
    openAIApiKey: apiKey,
  }).bindTools(tools);
}

// ─── Nodes ────────────────────────────────────────────────────────────────────

async function loadBusinessContext(state: typeof InsightState.State) {
  if (state.contextLoaded) return {};

  const settings = await getSettings();
  const apiKey = settings.openai_api_key || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const businessLine = settings.business_name
    ? `You are an AI business analyst for ${settings.business_name}${settings.product_type ? `, which sells ${settings.product_type}` : ""}.`
    : `You are an AI business analyst for a social media shop owner.`;

  const systemContext = `${businessLine}
Answer questions about sales, inventory, trends, and restocking. Call the tools available to you to look up live product and order data instead of guessing — combine multiple calls if a question needs it (e.g. revenue trend + low stock). Give actionable, data-driven answers, and flag low-stock items proactively when relevant.

You can also update stock on the seller's behalf with update_product_stock — only when the seller explicitly asks for a stock change (a restock, a correction, "set X to N units"). Look the product up first (search_products / list_low_stock_products) to confirm you have the right id and current quantity, then call update_product_stock, then confirm back what changed. Never change stock unless the seller asked for it in this conversation.

RESPONSE FORMAT
- Always respond in Markdown.
- All monetary values are in BDT (Taka). Show as "৳" with comma separators (e.g. ৳12,500).
- Use a Markdown table when returning more than a couple of rows.
- Lead with a one-line summary, then data, then 2-4 short insights tied to the actual numbers.

CHART GENERATION
- Include a chart only when it makes a multi-row/trend/comparison result easier to read. Skip it for a single number or a short list.
- Chart block must be valid JSON inside a fenced code block using \`chart\` as the language.
- Supported types and required fields:
  | type | required fields |
  |------|------------------|
  | bar  | x_key, y_keys, data |
  | line | x_key, y_keys, data |
  | area | x_key, y_keys, data |
  | pie  | name_key, value_key, data |
- Example:
\`\`\`chart
{"type":"bar","title":"Revenue by status","x_key":"status","y_keys":["revenue"],"data":[{"status":"delivered","revenue":12000},{"status":"pending","revenue":4000}]}
\`\`\`
- y_keys is always an array, even for one series. Keep data to at most 20 rows — aggregate first if needed.
- Never include the chart block without valid JSON — skip the chart entirely if unsure.`;

  return { contextLoaded: true, systemContext, apiKey };
}

async function chat(state: typeof InsightState.State) {
  const messages = [new SystemMessage(state.systemContext), ...state.messages];
  const response = await getLLM(state.apiKey).invoke(messages);
  return { messages: [response] };
}

function shouldContinue(state: typeof InsightState.State): "tools" | "__end__" {
  const last = state.messages[state.messages.length - 1] as AIMessage;
  return last.tool_calls && last.tool_calls.length > 0 ? "tools" : "__end__";
}

// ─── Graph ────────────────────────────────────────────────────────────────────

const graph = new StateGraph(InsightState)
  .addNode("loadContext", loadBusinessContext)
  .addNode("chat", chat)
  .addNode("tools", new ToolNode(tools))
  .addEdge("__start__", "loadContext")
  .addEdge("loadContext", "chat")
  .addConditionalEdges("chat", shouldContinue, { tools: "tools", __end__: "__end__" })
  .addEdge("tools", "chat")
  .compile();

export async function runInsightChat(
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string
): Promise<string> {
  const messages: BaseMessage[] = history.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );
  messages.push(new HumanMessage(userMessage));

  const result = await graph.invoke({ messages });
  const last = result.messages[result.messages.length - 1];
  return (last?.content as string) ?? "No response.";
}
