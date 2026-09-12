# OpenPage — Project Context

Read [`fb-copilot-build-plan.md`](fb-copilot-build-plan.md) first — it has the full plan: what we're building, why, judging-criteria mapping, timeline, roles, and prep checklist. This file is just the fast-orientation summary plus hard rules to not violate.

## One-liner

Agent on a small business's Facebook Page that answers customer questions (Bangla/English/Banglish) grounded in the seller's catalog + live Google Sheet stock, and turns repeated comment patterns (questions, complaints, low stock) into advisory suggestions for the seller. Built for the AI Tinkerers "Agents, Everywhere" hackathon, Sept 12, 2026.

## Hard Rules — Do Not Violate

1. **Eligibility:** core agent functionality must be built during the event window (11:15 AM–3:30 PM, Sept 12). Anything in this repo before that time should be infra/boilerplate only (webhook skeleton, stubs, config) — never the actual grounded-answer or pattern-detection logic. If you're reading this before event day: keep contributing scaffolding, not features.
2. **Control point, non-negotiable:** proactive suggestions (question patterns, sentiment flags, restock alerts) are drafts a human seller approves. Never auto-post publicly or auto-act without approval — this is a scored rubric requirement (Usefulness criterion), not a nice-to-have.
3. **Scope discipline:** three pillars only — Messenger reply, Sheet-grounded stock, comment-pattern insight. Slack delivery and the MCP tool-wrapper layer are stretch goals, sequenced *after* the direct-call core works. Don't let either block the demo.
4. **Skip real RAG.** Catalog is small — stuff it directly into the model context window. Don't build a vector DB. If user doesn't mention specifically.

## Reference Files

- [`fb-copilot-build-plan.md`](fb-copilot-build-plan.md) — full plan, timeline, roles, competitors
- [`api-reference.md`](api-reference.md) — Messenger Platform, Google Sheets API, OpenRouter cheat sheet with request/response shapes
- `.env.example` — required environment variables
- `sample_data/` — example catalog + synthetic seed comments for insight-layer testing (safe to use, this is prep data not agent logic)

## Stack

Python. Suggested layout in `src/` — see build plan's "Getting Started" section for the full shape. Stub files are already in place with TODOs marking where Saturday's build fills in logic.

## Team

Niloy (integration + insight-layer owner), Rothi (MCP/tools owner), Galib (PM — scope/submission owner), Person D (designer — suggestion UI + demo polish). Full role breakdown in the build plan.
