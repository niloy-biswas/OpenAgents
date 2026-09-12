# OpenPage — Build Plan (Agents, Everywhere Hackathon, Sept 12)

**Team:** OpenAgents · **Project:** OpenPage
**This doc is self-contained** — everything needed to start building lives here, including the event logistics pulled from `hackathon-brief.md` (which stays in the `open-agents` planning folder and doesn't need to travel with this repo).

## Event Info

- **Event:** Agents, Everywhere: Bots, Channels, & More — AI Tinkerers Global Hackathon (Dhaka)
- **Date/time:** Saturday, September 12, 2026, 10:00 AM – 5:00 PM
- **Venue:** Medona Tower, 28 Bir Uttam AK Khandakar Rd, Dhaka 1212
- **Event page:** https://dhaka.aitinkerers.org/hackathons/h_hsJ1OwfO5Rs/
- **Handbook:** https://dhaka.aitinkerers.org/hackathons/h_hsJ1OwfO5Rs/handbook
- **Judging page:** https://dhaka.aitinkerers.org/hackathons/h_hsJ1OwfO5Rs/judging?goto=criteria
- **Format:** local build day, one shared global submission pool — no local judging, only global review after submissions close

**Build eligibility (important):** project must be net-new, core functionality built during the official hackathon period (11:15 AM–3:30 PM). Templates/libraries/starter code are fine to use; the submitted project itself cannot be a pre-existing build extended and resubmitted. **This repo's commit history should start at the event** — that alone satisfies the rule, no need to over-explain it in the submission, just don't backdate or pre-load feature commits.

**Sponsors / stack available:** OpenAI (marquee), CopilotKit (in-app agent UI, MCP/AG-UI/A2A support), OpenRouter (model gateway), Exa (search/retrieval), Trigger.dev (background jobs), Auth0 (identity), Mozilla.ai, Ambiguous AI (workspace apps). Use what fits — see Technical Integration Notes below for what we're actually using.

## What We're Building

**One-liner:** An agent that lives on a small business's Facebook Page — answers customer questions in Bangla/English/Banglish using the seller's own product catalog and live stock data, and turns repeated customer signals (questions, complaints, low stock) into concrete suggestions for the seller. Reply-automation is the plumbing; the **insight layer is the star**.

**Why "co-pilot," not "autopilot":** existing Bangladesh tools (see Competitors below) already sell full auto-reply automation. We don't compete there. We lead with what they don't do — surfacing patterns across customer questions and comments ("12 people asked if this comes in blue this week," "3 people dropped off after asking delivery cost," "Product X is down to 2 units") as **advisory suggestions the seller approves**, not silent autonomous action.

**Three real integrations, not one — this is the Technical Execution story:**
1. **Facebook Messenger** — customer-facing conversation
2. **Google Sheet** — the seller's own product/quantity list, read-only, the ground truth for stock
3. **Same FB comment/message stream, analyzed twice** — once for reply content, once for pattern/sentiment detection (no new data source, just a second pass over data already flowing through)

**Core loop:**
1. Customer comments/messages under a product post
2. Agent answers using the catalog doc **and current Sheet quantity** — grounded, in-thread, and honest about stock ("sorry, that's out of stock right now" instead of hallucinating availability)
3. In parallel, agent tracks two signal types across the conversation stream: (a) repeated question/topic patterns, (b) sentiment/complaints in comments
4. Agent also watches Sheet quantity against a threshold
5. When a pattern crosses a threshold — a question repeats, sentiment turns negative, or stock runs low — agent proactively drafts a suggestion for the seller ("consider posting a size chart," "3 complaints about delivery time this week," "Product X down to 2 units, restock?") — seller approves before anything public changes

## Why This Satisfies the Challenge (handbook language, directly)

> "Build a working agent that belongs somewhere new... the environment must be essential to the experience, not just a delivery wrapper."

- Reply only makes sense attached to the exact product post the customer is already viewing — can't be reproduced in a standalone chatbox without losing the point.
- The insight layer needs the real, live comment stream to detect patterns — it structurally cannot exist without the channel.
- Advisory framing (draft-and-approve, not autonomous) directly satisfies the "clear and controllable" language in the Usefulness criterion.

## Judging Criteria — What We Build to Hit Each Mark

| Criterion | Target | What we specifically do |
|---|---|---|
| **Core Requirements & Functionality** | 4-5 | Full round trip working live at demo time: Messenger message in → catalog-grounded answer out. Test repeatedly before demo, not just once. At least one proactive insight message delivered live. |
| **Innovation & Theme Alignment** | 4, stretch 5 | Lead the pitch with "co-pilot not autopilot." State explicitly in the written description why this differs from generic FB auto-reply tools — insight-to-action loop is the differentiator, not the reply automation itself. |
| **Technical Execution & Integration** | 4-5 | Three real integrations working together: Messenger Platform, Google Sheets (read-only stock), and pattern/sentiment detection over the comment stream — keyword/embedding similarity clustering, not just a prompt pretending to notice patterns. Handle realistic failures gracefully (catalog/stock miss → honest fallback, not a hallucinated answer). |
| **Usefulness & Agentic Experience** | 4-5 | Draft-before-send framing for every proactive suggestion. Reply feels native — appears right in the Messenger thread under the real product context, not in a separate dashboard. |

## Timeline (mapped to the actual event schedule)

| Time | Block | Task |
|---|---|---|
| 10:00–10:30 AM | Check-in | Confirm FB test page + API keys still working (set up night before, sanity-check only) |
| 10:30–11:00 AM | Opening | Starter-kit walkthrough — note anything useful, don't get distracted building yet |
| 11:00–11:15 AM | Team formation | Lock task split (see Roles below) |
| 11:15–12:15 PM | Build block 1 | Core reactive loop: Messenger webhook receives message → catalog context retrieved → OpenRouter generates grounded answer → reply sent. Hardcode a test message first, get skeleton working end-to-end before polishing. |
| 12:15–1:15 PM | Build block 2 | Catalog ingestion (doc → context) + **Google Sheet read integration** (product/quantity), cross-reference into replies for stock-aware answers, Bangla/Banglish handling, graceful fallback for out-of-catalog/out-of-stock questions |
| 1:15–2:15 PM | Build block 3 | Insight layer: seed a synthetic sample comment set (prepared ahead of time — see Prep), run pattern/frequency detection for (a) repeated questions, (b) sentiment/complaints, (c) low-stock threshold from the Sheet. Generate seller-facing draft suggestions for each, surface them (seller thread or visible panel) |
| 2:15–2:45 PM | Polish | Demo flow rehearsal, fix obvious rough edges, don't start new features |
| 2:45–3:30 PM | Buffer | Bug fixes only. If ahead of schedule: Slack incoming webhook stretch goal (see Technical Notes) — never new insight-layer features this late |
| 3:30–4:30 PM | Local show-and-tell | Present to the room — also use this as your demo video dry run while the app is fresh in memory |
| 4:30–5:00 PM | Submit | Record final 2-min video, write description, make repo public, post social tagging sponsors, submit before deadline |

**Team & Roles:**

| Person | Background | Role |
|---|---|---|
| **Niloy** | Data Analyst & AI/LLM Engineer | **Integration + insight-layer owner** — Messenger Platform webhook, FB test page/token setup, Google Sheets API read access, backend plumbing connecting webhook → agent → reply, plus pattern/sentiment detection and catalog + Sheet-grounded answer quality, OpenRouter prompt work. Direct fit: the analyst-pattern-recognition skillset is the whole differentiator against Pagewala/Insaf. |
| **Rothi** | Backend & AI/LLM Engineer | **MCP/tools owner** — builds the MCP server exposing the agent's tools (Messenger send, Sheet read, pattern-detection call) as callable tools, so the agent orchestrates through MCP rather than direct function calls. Ties into the CopilotKit/MCP sponsor stack — a real Technical Execution differentiator if it lands. |
| **Galib** | Product Manager | **Scope + submission owner** — enforces the timeline below (kills scope creep before it starts), owns written description + judging-criteria alignment, drives the demo narrative |
| **Person D** | Designer | **Seller-facing suggestion surface + demo polish** — designs how proactive suggestions get shown to the seller (approve/reject UI, even if minimal), leads video editing and any visual assets for the social post |

**Sequencing risk, be deliberate about this:** build the direct-function-call version of the core loop first (webhook → function → reply, working end-to-end), *then* Rothi wraps those functions as MCP tools. If MCP wiring runs long, the demo still works without it — don't let the whole build depend on the protocol layer landing. Niloy now owns a wide slice (integration + insight layer) — if block 1 (core reactive loop) is behind schedule by 12:15 PM, Rothi should drop the MCP work temporarily and pair on the integration before returning to it.

## Tonight's Prep Checklist (not build-day work — do this before Saturday)

- [ ] Create Facebook Developer App, add your own Page as a test asset (Development Mode — no App Review needed for pages you administer)
- [ ] Generate Page access token, subscribe webhook for Messenger events
- [ ] OpenRouter API key ready, test a call works
- [ ] Repo skeleton: boilerplate/auth only, no feature logic (eligibility rule — core functionality must be built during the event)
- [ ] Prepare one sample product catalog doc (small enough to stuff directly into prompt context — skip building a real RAG/vector pipeline)
- [ ] Create the demo Google Sheet (columns: Product, Quantity, Price), create a service account, share the Sheet with the service account email, test a read call works
- [ ] Prepare a synthetic sample comment dataset with 2-3 obvious repeated question patterns AND 1-2 negative-sentiment/complaint examples baked in (for the insight-layer demo — this is data prep, not pre-built agent logic, so it's fine under eligibility rules)
- [ ] Set Sheet quantities so at least one product is already near/below your low-stock threshold — makes the restock-alert demo reliable instead of scripted-looking
- [ ] Draft submission templates in advance: title options, description skeleton, social post text (fill in specifics Saturday)

## Technical Integration Notes

- **Primary path: Messenger Send API**, not the public comments-feed API — simpler, more reliable, fewer threading/formatting edge cases. Comment-reply can be a stretch goal if time allows.
- **Catalog grounding:** paste catalog content directly into the model's context window. Skip vector DB/real RAG — catalog is small enough, and it saves hours you don't have.
- **Stock grounding:** Google Sheets API, read-only, service account auth (no OAuth consent screen needed — just share the Sheet with the service account's email). Poll or cache on a short interval, don't hit the API on every message.
- **Model:** OpenRouter, pick a model with good Bangla/Banglish handling — test this tonight, don't discover a bad fit mid-build.
- **Pattern detection:** simple approach is fine — keyword frequency or basic embedding similarity across incoming messages within the event window, extended to a sentiment/complaint category using the same pass. Don't over-engineer; a working simple version beats an ambitious broken one.
- **Low-stock trigger:** simple threshold check against the Sheet's Quantity column (e.g. below 5) — no forecasting, no trend analysis, just a threshold.
- **Control point:** proactive suggestions (question patterns, sentiment flags, restock alerts) go to a seller-facing thread/panel as drafts. Nothing posts publicly or changes automatically without approval — this is both a safety practice and a scored rubric point.
- **Slack (stretch only, after everything else works):** Slack Incoming Webhook — a single HTTP POST to a webhook URL, no OAuth app install required. Mirror the seller-facing suggestions there if time allows; don't make it the primary delivery path.
- **MCP tool layer:** Rothi wraps the core functions (Messenger send, Sheet read, pattern-detection call) as MCP tools once the direct-call version works. Build order matters — direct calls first, MCP wrapper second, never the reverse. If it lands, it's a genuine Technical Execution talking point and ties into the CopilotKit/MCP sponsor stack; if it runs out of time, the direct-call version still demos fine on its own.

## Getting Started (for whoever opens this repo first)

**Environment variables needed** (put in `.env`, never commit it):
- `FB_PAGE_ACCESS_TOKEN` — from the Facebook Developer App / test page setup
- `FB_APP_SECRET` — webhook signature verification
- `FB_VERIFY_TOKEN` — arbitrary string you set, used during webhook subscription handshake
- `OPENROUTER_API_KEY`
- `GOOGLE_SERVICE_ACCOUNT_JSON` — path or inline JSON for the Sheets read-only service account
- `GOOGLE_SHEET_ID` — the demo stock sheet's ID
- `SLACK_WEBHOOK_URL` — only if the Slack stretch goal happens

**Suggested repo shape** (adjust as needed, don't over-plan this before code exists):
```
/src (or /app)
  webhook.*        — Messenger webhook receiver
  agent/           — prompt construction, OpenRouter calls, grounding logic
  integrations/
    facebook.*     — Messenger send/receive
    sheets.*       — stock read
  insight/         — pattern + sentiment detection, suggestion drafting
  mcp/             — Rothi's MCP tool server (block 2+ onward)
sample_data/
  catalog.md       — sample product catalog for prompt context
  comments.json    — synthetic seed comments for insight-layer testing
.env.example
README.md          — public-facing, written for judges (see below)
```

**Two different docs, don't conflate them:** this file is the internal build plan (team-facing, working notes). The repo's own `README.md` is what judges will actually read — write it separately, lead with the one-liner and the co-pilot/insight differentiator, keep it short. Pull from the "What We're Building" and "Why This Satisfies the Challenge" sections above when drafting it, but don't just paste this whole doc in — README should be judge-facing polish, this file is working scaffolding.

**Name candidates considered:** OpenPage (current pick — ties directly to "Facebook Page," the whole environment argument, and pairs naturally with the OpenAgents team name), OpenShelf, OpenCounter, OpenInbox, OpenStorefront. Bangla-word options (OpenDokan, OpenDokandar) were considered and set aside per team preference for an English name.

## Submission Checklist (due 5:00 PM)

1. **Title:** OpenPage
2. **Written description** — lead with the co-pilot/insight differentiator, name why the environment is essential, note advisory-not-autopilot design explicitly
3. **Public GitHub repo** — fresh repo, commit history starts at the event, be ready to explain which parts were built during the hackathon
4. **2-minute demo video** — script the flow in advance: (1) customer question → stock-aware grounded reply in Messenger, (2) a repeated question or complaint pattern → seller gets an advisory suggestion, (3) low-stock threshold hit → seller gets a restock alert, approves it. Record during the 3:30–4:30 show-and-tell block while the app is stable
5. **Social post** tagging event partners (OpenAI, CopilotKit, OpenRouter, Exa, Auth0, Trigger.dev, Mozilla.ai, Ambiguous AI — tag whichever you actually used)

## Competitors — Check Before Finalizing the Pitch

Existing tools doing adjacent or overlapping things. Know these cold so the demo/description explicitly differentiates instead of accidentally re-pitching them.

**Global generic chatbot-builder tools** (upload docs/website, connect to a FB Page):
- [Chatbase](https://www.chatbase.co/)
- Chat Data — markets specifically around FB Page connection + training on business content + automated replies for Page messages/ad conversations
- Chatfuel, ManyChat, Landbot, Intercom Fin

Built for global/English-first audiences — not tuned for Bangla, Banglish, or Bangladeshi F-commerce norms (cash-on-delivery, bKash/Nagad, comment-to-DM flows). Weak differentiation risk here is lower — easier to argue local specificity beats them.

**Bangladesh-specific — real overlap risk, verified live:**

- **[Pagewala](https://pagewala.com)** — AI Sales Agent for FB Page sellers. Confirmed features: auto-replies in Bangla/English/Banglish, product ID from catalog or **photos**, order detail collection, **WhatsApp order alerts**, catalog via Excel/FB-post-sync/manual entry, manual override for sellers. Scale: 500+ active pages, 2M+ messages handled, 94% AI coverage claimed, ৳1,499–3,999/month pricing.
- **[Insaf AI](https://ai.insafboost.com)** — FB/WhatsApp/Instagram AI chatbot for Bangladesh. Confirmed features: catalog with photo/pricing upload, automated order-taking, courier tracking integration, scheduled follow-ups, **unified dashboard analytics**, human handover. Multi-model backend (Claude, Gemini, others). Scale: 100K+ messages, 1000+ active users.

**Overlap with our original MVP scope: near-total on the reply-automation half.** Both already do Bangla auto-reply + catalog grounding + order capture — this is why the pivot to co-pilot/insight-layer as the headline (not reply automation) matters. Neither offers proactive restock alerts tied to a live stock source, or sentiment/complaint surfacing from comments — that's the gap the Sheet integration and widened insight layer fill. Their pitch is full autopilot ("94% AI coverage," "fully automatic 24/7"); ours is a seller decision-support layer they don't offer. Say this difference explicitly in the written description — don't make a judge infer it.
