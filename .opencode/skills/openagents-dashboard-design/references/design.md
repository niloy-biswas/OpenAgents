# OpenAgents Dashboard — Design System

Source of truth for the visual language used in `dokan-dashboard.html`
(order / inventory / AI-agent console for FB + WhatsApp f-commerce sellers).
Use this doc to keep any new page, widget, or component visually consistent
with what already exists — don't invent new colors, fonts, or card styles
without a reason grounded in this brief.

## 1. Concept

An **operations console**, not a generic SaaS dashboard. The seller (often
running the business from a phone, juggling FB Messenger + WhatsApp DMs) is
the audience. Every design choice should read as: calm, fast to scan, and
built around real money/inventory/customers — not decoration.

Naming device: **"Dokan"** (দোকান = shop) is the internal product concept;
the shipped brand name is **OpenAgents Dashboard**. The ৳ mark doubles as
the brand mark.

## 2. Color tokens

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#14161c` | App background (charcoal, not pure black) |
| `--surface` | `#1d2027` | Card background |
| `--surface-hi` | `#262a33` | Hover / nav-active background |
| `--surface-raise` | `#2c313c` | Raised elements: buttons, chips, tracks |
| `--line` | `#333844` | Visible borders |
| `--line-soft` | `#262a33` | Hairline dividers between rows/sections |
| `--text` | `#ece8de` | Primary text (warm off-white, receipt-paper tone) |
| `--text-dim` | `#9195a3` | Secondary text |
| `--text-faint` | `#666b78` | Meta / timestamps / labels |
| `--gold` | `#e8a33d` | **Only** brand / primary-action color |
| `--gold-dim` bg | `#6b551f` / `#3d3320` | Gold hover fill / "called" status tint |
| `--green` | `#3fae7a` | Signal: confirmed, delivered, healthy |
| `--green-dim` | `#1f3d31` | Green tinted background |
| `--red` | `#d1435b` | Signal: risk, low stock, returned |
| `--red-dim` | `#402029` | Red tinted background |
| `--blue` | `#5b8def` | Signal: informational / "new" state |
| `--blue-dim` | `#202b42` | Blue tinted background |

**Rule:** gold is the *only* brand/CTA color. Green / red / blue are never
decorative — they exist purely to signal status (good / bad / neutral-new).
If a new widget needs a fourth signal color, don't add one casually — first
check whether an existing status genuinely applies.

## 3. Typography

Two families, strict role split:

- **Space Grotesk** — all UI text: nav, headings, body, buttons, labels.
- **IBM Plex Mono** — *every* numeric or ID value: order counts, ৳ amounts,
  percentages, order IDs (`#DK-2291`), timestamps, KPI numbers. This is what
  gives the "ledger / terminal" feel and keeps numbers tabular and scannable
  in a data-dense grid.

Loaded via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

Type scale in use: 26px KPI numbers (mono) · 20px page title · 14–16.5px
headings/brand · 12–13px body/table · 10.5–11.5px meta/labels. No all-caps
labels, no tracked-out eyebrows, no arrow-suffixed link text.

## 4. Layout

- Fixed sidebar: **236px**, sticky, full height, own dark tone (`#101217`)
  one shade darker than `--bg` for separation.
- Main column: topbar (20px/32px padding) + content (26px/32px/60px padding).
- Content grid: **12-column CSS grid, 18px gap**. Standard spans used:
  `span-12` (full-width panel), `span-8` + `span-4` (primary + side), `span-7`
  + `span-5`, `span-4` × 3 (three equal widgets).
- Card radius hierarchy (not uniform!): `--radius-lg` 18px for cards/panels,
  `--radius-md` 12px for nested elements (chips, toggles), `--radius-sm` 8px
  for buttons/inputs. Primary action panels can carry a slightly stronger
  border on hover; compact metric cards stay flat. Don't give every box the
  same shadow/radius — vary by hierarchy.

## 5. Core components (already built — reuse, don't recreate)

| Component | CSS class(es) | Notes |
|---|---|---|
| KPI stat card | `.kpi`, `.kpi-value`, `.kpi-delta` | Staggered fade-up on load only, nowhere else |
| Status badge | `.status-badge` + `.status-{new,called,confirmed,dispatched,delivered,returned}` | Dim-tint bg + solid text color, except `delivered` (solid fill = final state) |
| Trust / receive-rate chip | `.trust-chip` + `.high/.mid/.low` | Green / gold / red thresholds |
| Product thumbnail | `.swatch` (`.sm` variant for tables) | 2-letter initials on flat color |
| Channel icon | `.channel-icon.fb` / `.wa` | Inline SVG, brand-colored |
| Funnel (sequential stages) | `.funnel`, `.funnel-stage` | Numbered stages are only used because the content is genuinely sequential — don't reuse the "01/02/03" pattern for non-sequential lists |
| Ring/donut stat | inline SVG `<circle>` pair, `stroke-dasharray` | For single split-metric visuals (bot vs human, etc.) |
| Filter tabs | `.order-tabs`, `.tab` | Pill tabs, gold-tinted count in active state |
| Data table | `table.otable` | Horizontal scroll wrapper (`.table-scroll`) below 820px |
| Toast | `.toast` | Bottom-right, slide + fade, auto-dismiss ~2.5–3s |
| Live status dot | `.live-dot` | Pulsing green ring — the *only* looping animation on the page |
| Switch/toggle | `.switch` | Used for "bot is live" only |

## 6. Motion rules

- One orchestrated load-in: KPI cards fade+rise, staggered ~60ms apart. Never
  repeat this pattern on every section — it's used exactly once per view.
- Hover states: border-color / background transitions only, 0.15s ease.
- The only continuous animation is the live-status pulse dot — it earns its
  motion because it represents a genuinely live/real-time state.
- No entrance animation on scroll, no bounce, no per-card stagger outside the
  KPI strip.

## 7. Content voice

- Sentence case everywhere, no ALL-CAPS labels.
- Buttons say the action and its result stays consistent: `Call` → becomes
  `Confirmed` (not "Done" or "Submit").
- Numbers carry real units: `৳1,290`, `92%`, not bare numbers.
- Empty/disabled states (`Track`, `View` on finished orders) are muted, not
  hidden — the row stays legible, just de-emphasized.

## 8. Extending this design

When adding a new page or widget:
1. Reuse an existing component class before inventing a new one.
2. New status/signal colors must map to green (good) / gold (attention,
   brand) / red (bad) / blue (neutral-new) — don't add a 5th signal hue.
2. Numbers → IBM Plex Mono. Everything else → Space Grotesk.
3. Keep the sidebar/topbar shell identical; only `.content` / view sections
   change between pages (see the `showView()` pattern in the existing JS for
   how Overview/Orders are toggled without a page reload).
4. Ground any new copy or sample data in the real subject matter (Bangladeshi
   f-commerce: ৳, FB/WhatsApp, Pathao/Steadfast/RedX, Bangla product names) —
   never fall back to generic "Product A / Customer 1" placeholders.
