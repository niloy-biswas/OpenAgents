import { Annotation, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { z } from "zod";
import {
  listProducts,
  getConversationHistory,
  saveMessage,
  createOrder,
  getSettings,
  type Product,
  type SettingsRow,
} from "../db";
import { sendMessage, sendImage } from "../messenger";
import { buildSalesAgentPrompt } from "./prompts";

// ─── State ────────────────────────────────────────────────────────────────────

const AgentState = Annotation.Root({
  senderPsid: Annotation<string>(),
  userText: Annotation<string>(),
  products: Annotation<Product[]>({ value: (_, y) => y, default: () => [] }),
  history: Annotation<BaseMessage[]>({ value: (_, y) => y, default: () => [] }),
  settings: Annotation<SettingsRow>({ value: (_, y) => y, default: () => ({} as SettingsRow) }),
  reply: Annotation<string>({ value: (_, y) => y, default: () => "" }),
  imageProductId: Annotation<number | null>({ value: (_, y) => y, default: () => null }),
  orderToCreate: Annotation<{
    product_id: number;
    quantity: number;
    name: string;
    contact: string;
    address: string;
  } | null>({ value: (_, y) => y, default: () => null }),
});

const replySchema = z.object({
  reply: z.string().describe("The text reply to send the customer."),
  image_product_id: z
    .number()
    .nullable()
    .describe(
      "Set to the product's id if the customer asked to see a book cover/picture/image, otherwise null."
    ),
  create_order: z
    .object({
      product_id: z.number(),
      quantity: z.number(),
      name: z.string(),
      contact: z.string(),
      address: z.string(),
    })
    .nullable()
    .describe(
      "Set this ONLY on the turn where the customer has just explicitly confirmed placing the order (said yes/confirm after you read back name, contact, address, product, and quantity). This is what actually creates the order in the system. Otherwise leave null, including on every earlier turn while still collecting or confirming details."
    ),
});

// ─── LLM ─────────────────────────────────────────────────────────────────────

function getLLM(apiKey: string): ChatOpenAI {
  return new ChatOpenAI({
    model: "gpt-5.6-luna",
    reasoningEffort: "none" as unknown as "low",
    openAIApiKey: apiKey,
  });
}

// ─── Nodes ────────────────────────────────────────────────────────────────────

async function fetchContext(state: typeof AgentState.State) {
  const [products, rawHistory, settings] = await Promise.all([
    listProducts(),
    getConversationHistory(state.senderPsid, 10),
    getSettings(),
  ]);

  const history: BaseMessage[] = rawHistory.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
  );

  return { products, history, settings };
}

async function generateReply(state: typeof AgentState.State) {
  const catalog = state.products
    .map(
      (p) =>
        `- [id: ${p.id}] ${p.title}${p.author ? ` by ${p.author}` : ""} | Price: ${p.price} BDT | Stock: ${p.quantity} | Max discount: ${p.max_discount} BDT${p.description ? ` | ${p.description}` : ""}`
    )
    .join("\n");

  const systemPrompt = buildSalesAgentPrompt(catalog, {
    businessName: state.settings.business_name,
    productType: state.settings.product_type,
    toneInstructions: state.settings.tone_instructions,
  });

  const messages = [
    new SystemMessage(systemPrompt),
    ...state.history,
    new HumanMessage(state.userText),
  ];

  const apiKey = state.settings.openai_api_key || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const structuredLlm = getLLM(apiKey).withStructuredOutput(replySchema);
  const response = await structuredLlm.invoke(messages);
  return {
    reply: response.reply,
    imageProductId: response.image_product_id,
    orderToCreate: response.create_order,
  };
}

function logIfFailed(label: string) {
  return (result: PromiseSettledResult<unknown>) => {
    if (result.status === "rejected") {
      console.error(`[sendReply] ${label} failed:`, result.reason);
    }
  };
}

async function sendReply(state: typeof AgentState.State) {
  // Messenger delivery is best-effort and must never block saving the
  // conversation or creating the order — a send failure (expired token,
  // 24h window, invalid psid) shouldn't silently drop a confirmed order.
  const [sendResult, userSaveResult, assistantSaveResult] = await Promise.allSettled([
    sendMessage(state.senderPsid, state.reply),
    saveMessage({ sender_id: state.senderPsid, role: "user", content: state.userText }),
    saveMessage({ sender_id: state.senderPsid, role: "assistant", content: state.reply }),
  ]);
  logIfFailed("sendMessage")(sendResult);
  logIfFailed("saveMessage(user)")(userSaveResult);
  logIfFailed("saveMessage(assistant)")(assistantSaveResult);

  const product =
    state.imageProductId != null
      ? state.products.find((p) => p.id === state.imageProductId)
      : null;

  if (product?.image_url) {
    const [imgSendResult, imgSaveResult] = await Promise.allSettled([
      sendImage(state.senderPsid, product.image_url),
      saveMessage({
        sender_id: state.senderPsid,
        role: "assistant",
        content: "",
        image_url: product.image_url,
      }),
    ]);
    logIfFailed("sendImage")(imgSendResult);
    logIfFailed("saveMessage(image)")(imgSaveResult);
  }

  if (state.orderToCreate) {
    const { product_id, quantity, name, contact, address } = state.orderToCreate;
    try {
      await createOrder({
        product_id,
        quantity,
        sender_id: state.senderPsid,
        customer_name: name,
        phone: contact,
        channel: "messenger",
        address: address ? { address } : undefined,
      });
    } catch (err) {
      console.error("[sendReply] createOrder failed:", err);
    }
  }

  return {};
}

// ─── Graph ────────────────────────────────────────────────────────────────────

const graph = new StateGraph(AgentState)
  .addNode("fetchContext", fetchContext)
  .addNode("generateReply", generateReply)
  .addNode("sendReply", sendReply)
  .addEdge("__start__", "fetchContext")
  .addEdge("fetchContext", "generateReply")
  .addEdge("generateReply", "sendReply")
  .addEdge("sendReply", "__end__")
  .compile();

export async function processMessengerMessage(
  senderPsid: string,
  userText: string
): Promise<void> {
  await graph.invoke({ senderPsid, userText });
}
