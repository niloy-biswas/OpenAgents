import { NextRequest } from "next/server";
import {
  listProducts,
  getProduct,
  createOrder,
  getOrder,
  listOrders,
} from "@/lib/db";

const TOOLS = [
  {
    name: "list_products",
    description: "List all products with price and stock",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_product",
    description: "Get single product by ID",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "create_order",
    description: "Create an order for a product",
    inputSchema: {
      type: "object",
      properties: {
        product_id: { type: "number" },
        quantity: { type: "number" },
        sender_id: { type: "string" },
      },
      required: ["product_id", "quantity", "sender_id"],
    },
  },
  {
    name: "get_order",
    description: "Get order status by ID",
    inputSchema: {
      type: "object",
      properties: { id: { type: "number" } },
      required: ["id"],
    },
  },
  {
    name: "list_orders",
    description: "List all orders, optionally filtered by status",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "confirmed", "delivered"] },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, any>) {
  switch (name) {
    case "list_products": return await listProducts();
    case "get_product":   return await getProduct(args.id);
    case "create_order":  return await createOrder(args as { product_id: number; quantity: number; sender_id: string });
    case "get_order":     return await getOrder(args.id);
    case "list_orders":   return await listOrders();
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

// Stateless JSON-RPC 2.0 MCP endpoint (works on Vercel serverless)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { jsonrpc, method, params, id } = body;

  function ok(result: unknown) {
    return Response.json({ jsonrpc: "2.0", id, result });
  }
  function err(code: number, message: string) {
    return Response.json({ jsonrpc: "2.0", id, error: { code, message } });
  }

  try {
    if (method === "tools/list") {
      return ok({ tools: TOOLS });
    }

    if (method === "tools/call") {
      const { name, arguments: toolArgs = {} } = params;
      const result = await callTool(name, toolArgs);
      return ok({
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    }

    if (method === "initialize") {
      return ok({
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "selling-copilot", version: "1.0.0" },
      });
    }

    return err(-32601, `Method not found: ${method}`);
  } catch (e) {
    return err(-32000, (e as Error).message);
  }
}
