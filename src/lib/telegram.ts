const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<void> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!res.ok) {
    throw new Error(`Telegram sendMessage failed: ${await res.text()}`);
  }
}

export async function setTelegramWebhook(
  botToken: string,
  url: string,
  secretToken: string
): Promise<void> {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, secret_token: secretToken }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || "Telegram setWebhook failed");
  }
}

// The assistant's replies use Markdown tables and ```chart fenced blocks for
// the dashboard's chart renderer — neither means anything in a Telegram
// message, so strip chart blocks and flatten tables into readable lines.
export function toTelegramText(markdown: string): string {
  const withoutCharts = markdown.replace(/```chart[\s\S]*?```/g, "").trim();
  const lines = withoutCharts.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\|?\s*-+\s*(\|\s*-+\s*)*\|?$/.test(trimmed)) continue; // table separator row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      out.push(
        trimmed
          .slice(1, -1)
          .split("|")
          .map((cell) => cell.trim())
          .join(" — ")
      );
      continue;
    }
    out.push(line);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
