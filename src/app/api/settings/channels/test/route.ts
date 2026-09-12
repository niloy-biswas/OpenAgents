import { NextRequest } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await verifySession(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const settings = await getSettings();
  const pageToken =
    body.token || settings.facebook_page_token || process.env.FB_PAGE_ACCESS_TOKEN;

  if (!pageToken) {
    return Response.json(
      { ok: false, error: "No Facebook page access token configured." },
      { status: 400 }
    );
  }

  try {
    // /me fails without pages_read_engagement; debug_token works with the token itself.
    const url = `https://graph.facebook.com/v21.0/debug_token?input_token=${pageToken}&access_token=${pageToken}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.data?.is_valid) {
      return Response.json(
        { ok: false, error: data.error?.message || "Invalid Facebook token." },
        { status: 400 }
      );
    }

    const pageId = data.data.profile_id ? String(data.data.profile_id) : null;
    const pageName = pageId ? `Page ${pageId}` : "Connected Page";

    await updateSettings({
      facebook_page_token: pageToken,
      facebook_page_id: pageId,
      facebook_page_name: pageName,
      facebook_connected: true,
    });

    return Response.json({
      ok: true,
      page: { id: pageId, name: pageName, scopes: data.data.scopes || [] },
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err.message || "Connection test failed" },
      { status: 500 }
    );
  }
}
