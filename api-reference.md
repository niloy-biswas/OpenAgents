# API Reference Cheat Sheet

Quick reference for the three integrations, so build day starts with wiring, not documentation-hunting. Verify these shapes against current docs if anything looks off — API details drift.

## Facebook Messenger Platform

**Webhook verification (GET, one-time handshake when you subscribe the webhook):**
Facebook sends `GET /webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`. Your endpoint must check `hub.verify_token` matches `FB_VERIFY_TOKEN` and echo back `hub.challenge` as plain text, HTTP 200.

**Incoming message event (POST):**
```json
{
  "object": "page",
  "entry": [{
    "id": "<page-id>",
    "time": 1234567890,
    "messaging": [{
      "sender": {"id": "<psid>"},
      "recipient": {"id": "<page-id>"},
      "timestamp": 1234567890,
      "message": {"mid": "...", "text": "এটা কি স্টকে আছে?"}
    }]
  }]
}
```
Verify the `X-Hub-Signature-256` header against `FB_APP_SECRET` (HMAC-SHA256 of the raw body) before trusting the payload.

**Sending a reply (Send API):**
```
POST https://graph.facebook.com/v21.0/me/messages?access_token=<FB_PAGE_ACCESS_TOKEN>
Content-Type: application/json

{
  "recipient": {"id": "<psid>"},
  "message": {"text": "হ্যাঁ, স্টকে আছে।"}
}
```

**Comment-reply API (stretch, not primary path):**
```
POST https://graph.facebook.com/v21.0/{comment-id}/comments?access_token=<FB_PAGE_ACCESS_TOKEN>
{"message": "reply text"}
```

**Local testing without a real customer:** `curl -X POST localhost:8000/webhook -H "Content-Type: application/json" -d @sample_data/fake_webhook_payload.json` — fake the payload shape above, skip signature verification in a local-only dev flag if needed (never in anything demoed live).

## Google Sheets API (read-only, service account)

1. Create a service account in Google Cloud Console, enable Sheets API, download the JSON key.
2. Share the demo Sheet with the service account's `client_email` (Viewer access is enough).
3. Python (`google-api-python-client` + `google-auth`):
```python
from google.oauth2 import service_account
from googleapiclient.discovery import build

creds = service_account.Credentials.from_service_account_file(
    "service_account.json",
    scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"],
)
service = build("sheets", "v4", credentials=creds)
result = service.spreadsheets().values().get(
    spreadsheetId=GOOGLE_SHEET_ID, range="Sheet1!A2:C100"
).execute()
rows = result.get("values", [])  # [[product, quantity, price], ...]
```
Cache this on a short interval (e.g. every 30-60s) — don't call it per-message.

## OpenRouter (Anthropic-compatible endpoint)

Simplest path if using an Anthropic-shaped SDK/client:
```
ANTHROPIC_BASE_URL=https://openrouter.ai/api
ANTHROPIC_AUTH_TOKEN=<OPENROUTER_API_KEY>
```
(Base URL ends at `/api`, not `/api/v1`.)

Or direct HTTP (OpenAI-compatible chat completions shape):
```
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer <OPENROUTER_API_KEY>
Content-Type: application/json

{
  "model": "<provider/model-name>",
  "messages": [{"role": "user", "content": "..."}]
}
```
Pick a model with solid Bangla/Banglish handling — test tonight, not mid-build.

## Slack Incoming Webhook (stretch goal only)

```
POST <SLACK_WEBHOOK_URL>
Content-Type: application/json

{"text": "Product X down to 2 units — restock?"}
```
No OAuth, no app install. Create the webhook URL from Slack's "Incoming Webhooks" app config for your workspace.
