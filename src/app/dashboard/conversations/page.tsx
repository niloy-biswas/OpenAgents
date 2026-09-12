import { listConversationSenders } from "@/lib/db";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const senders = await listConversationSenders();
  return <ChatClient senders={senders} />;
}
