---
name: openagents-dashboard-design
description: Design tokens, typography, layout, and component patterns for the OpenAgents Dashboard — the order/inventory/CRM console for the Facebook + WhatsApp AI order-agent hackathon project (formerly "Dokan"). Use this skill whenever building, extending, or restyling any page or widget for this dashboard, or whenever asked to keep new UI "consistent with the OpenAgents dashboard" — even if the request doesn't say "design system" explicitly (e.g. "add an inventory page", "make a settings screen", "build the chat-agent view").
---

# OpenAgents Dashboard Design

This skill keeps every new screen of the OpenAgents Dashboard visually and
structurally consistent with the original build (`dokan-dashboard.html`).

## When to use this

Any task that adds to, edits, or reskins the OpenAgents Dashboard: new nav
sections (Inventory, Chat agent, Delivery, Analytics, Settings), new widgets
on Overview, changes to the Orders table, or a fresh page that should feel
like it belongs to the same product.

## What to do

1. **Read `references/design.md` first.** It has the full color palette
   (with hex values and *what each color is allowed to mean*), the two-font
   type system, the 12-column grid + card-radius hierarchy, and a table of
   every existing component class — reuse those classes before writing new
   CSS.
2. **Open the existing HTML file** the user is working from (usually
   `dokan-dashboard.html` / `openagents-dashboard.html`) and match its
   structure: sidebar + topbar shell stays constant; new pages are added as
   a `<section id="view-...">` toggled by the existing `showView()` pattern,
   not a full page reload.
3. **Don't introduce new signal colors, fonts, card-shadow styles, or motion
   patterns** without checking `design.md`'s rules section first — the whole
   point of this skill is to stop drift across pages.
4. When genuinely new UI is needed (a component with no existing analog),
   design it in the same idiom: dark charcoal surface, gold as the only
   brand/CTA accent, green/red/blue reserved strictly for status, numbers in
   IBM Plex Mono, everything else in Space Grotesk.
5. Ground all sample data in the real subject matter (Bangladeshi f-commerce:
   ৳ currency, FB/WhatsApp channels, Pathao/Steadfast/RedX delivery, real
   product categories like Panjabi/Saree/Frock) — never generic placeholder
   copy.

## Reference

- `references/design.md` — full design system (colors, type, layout,
  components, motion rules, content voice, extension checklist).
