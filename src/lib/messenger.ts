import { getSettings } from "./db";

const GRAPH_API = "https://graph.facebook.com/v21.0/me/messages";

async function getPageToken(): Promise<string | null> {
  const settings = await getSettings();
  return settings.facebook_page_token || process.env.FB_PAGE_ACCESS_TOKEN || null;
}

async function post(body: unknown): Promise<void> {
  const token = await getPageToken();
  if (!token) {
    throw new Error("Facebook page access token is not configured");
  }

  const res = await fetch(
    `${GRAPH_API}?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Messenger API error: ${errBody}`);
  }
}

export async function sendMessage(
  recipientPsid: string,
  text: string
): Promise<void> {
  await post({ recipient: { id: recipientPsid }, message: { text } });
}

export interface FbProfile {
  first_name: string | null;
  last_name: string | null;
  profile_pic: string | null;
}

export async function fetchFbProfile(psid: string): Promise<FbProfile | null> {
  const token = await getPageToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `https://graph.facebook.com/${psid}?fields=first_name,last_name,profile_pic&access_token=${token}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      profile_pic: data.profile_pic ?? null,
    };
  } catch {
    return null;
  }
}

export async function sendImage(
  recipientPsid: string,
  imageUrl: string
): Promise<void> {
  await post({
    recipient: { id: recipientPsid },
    message: {
      attachment: { type: "image", payload: { url: imageUrl, is_reusable: true } },
    },
  });
}
