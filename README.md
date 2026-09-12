# OpenAgents

Built by **Team OpenAgents** at the AI Tinkerers "Agents, Everywhere" Global Hackathon, Dhaka — Sept 12, 2026.

A Facebook Messenger co-pilot for small business sellers. Answers customer questions grounded in the seller's product catalog, takes orders, and gives the seller AI-driven business insights — all in one dashboard.

## Features

- **Messenger bot** — auto-replies to customer messages (Bangla / English / Banglish) grounded in live product catalog
- **Order management** — customers can place orders via chat; seller manages status (pending → confirmed → delivered) in dashboard
- **AI Insight chat** — business owner asks questions about sales, inventory, trends; GPT-4o answers from real data
- **MCP server** — HTTP JSON-RPC endpoint exposing products and orders as tools for any MCP-compatible client
- **Dashboard** — product and order CRUD, login-protected

## Stack

Next.js 15 · TypeScript · PostgreSQL · LangGraph.js · OpenAI · TailwindCSS · Vercel

## How it works

1. Customer sends message in Messenger
2. Webhook receives payload, returns `200` immediately
3. LangGraph agent runs in background — fetches product catalog + conversation history, generates reply via GPT-4o-mini, sends back via Messenger API
4. Seller manages orders and gets AI business insights from the dashboard

## Architecture

```
POST /api/webhook     ← Facebook Messenger (non-blocking, LangGraph in after())
POST /api/chat        ← AI insight chat (LangGraph + GPT-4o)
/api/products/*       ← Product CRUD
/api/orders/*         ← Order CRUD + status updates
POST /api/mcp         ← MCP tools over HTTP JSON-RPC 2.0
/dashboard/*          ← UI (login required)
```

## Setup

```bash
npm install
cp .env.example .env   # fill in keys
createdb selling_copilot
npm run db:migrate
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `FB_VERIFY_TOKEN` | Token for webhook verification |
| `FB_PAGE_ACCESS_TOKEN` | Facebook Page access token |
| `OPENAI_API_KEY` | OpenAI API key |
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_USERNAME` | Dashboard login username |
| `ADMIN_PASSWORD` | Dashboard login password |
| `JWT_SECRET` | Secret for session JWT signing |

## Deploy

Push to GitHub → import to Vercel → add env vars → deploy. No separate process needed.

## Team

Niloy · Rothi · Galib · Moshiur
