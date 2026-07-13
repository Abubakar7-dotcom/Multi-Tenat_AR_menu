# PROJECT KICKOFF PROMPT — AR Menu Multi-Tenant Platform

Copy everything below this line into Claude Code as your first message. Run it in **Plan Mode** (Shift+Tab) so planning is enforced by the tool as well as the prompt.

---

You are the lead engineer for a new production project. Read this entire brief before doing anything. This document is the source of truth — every architectural decision here has already been made deliberately and is NOT open for re-litigation unless you find a concrete technical blocker, in which case raise it explicitly with reasoning.

# 1. WHAT WE ARE BUILDING

A **multi-tenant SaaS platform for AR restaurant menus** operating in Pakistan. Think "Shopify, but for AR restaurant menus."

The customer journey: a diner sits at a restaurant table, scans a QR code printed on the table/menu, and a branded digital menu opens in their phone browser (no app install). Each dish shows a photo, name, description, and price, plus a **"View on Table"** button. Tapping it opens the phone's native AR viewer and places a photorealistic 3D model of the dish on the actual table through the camera.

Business model:
- We (the platform owners) sign up restaurants as clients.
- **Our internal admin panel** ("Studio"): we compose each restaurant's menu design from reusable building blocks — layout, sections, fonts, colors, parameters. Restaurants never touch design.
- **Restaurant admin panel** ("Merchant Dashboard"): restaurant staff log in and edit ONLY menu content — items, prices, descriptions, availability, photos. Nothing about design.
- 3D models are produced by us via photogrammetry (RealityScan). Model generation is OUT OF SCOPE — assume optimized-ready .glb source files arrive as input to our pipeline.

Scale target for v1: 20 restaurants, ~200 concurrent users. Architecture must scale beyond that without redesign.

# 2. LOCKED TECHNICAL DECISIONS (do not re-debate)

| Concern | Decision | Non-negotiable reason |
|---|---|---|
| Framework | Next.js (latest stable, App Router, TypeScript) | SSR/ISR for instant mobile loads; team expertise |
| Hosting | Vercel | Serverless auto-scaling = load balancing handled by platform |
| Database | Supabase (PostgreSQL) | Free tier fits budget; Auth + RLS + storage API included |
| DB connections | Supabase **pooled** connection string (pgBouncer, port 6543) ONLY | Serverless functions exhaust direct connections |
| 3D/image storage | Cloudflare R2 behind Cloudflare CDN | Zero egress fees; 3D assets are the bandwidth bottleneck, not compute |
| AR rendering | Google `<model-viewer>` web component | iOS Safari has NO WebXR. model-viewer delegates to Scene Viewer (Android, .glb) and Quick Look (iOS, .usdz). Never build custom WebXR/Three.js AR |
| 3D formats | Every dish needs BOTH .glb AND .usdz, target ≤5MB each | iOS requires USDZ; size budget is the UX quality bar |
| Asset optimization | gltf-transform CLI (Draco/meshopt + KTX2 textures) | Deterministic, scriptable pipeline |
| Page caching | ISR + `revalidatePath('/r/[slug]')` on menu edits | Menus change ~daily; DB should be near-idle under read traffic |
| Asset caching | `Cache-Control: public, max-age=31536000, immutable` + versioned filenames (`burger-v2.glb`) | Files never overwritten in place |
| Validation | zod everywhere (settings schemas, API inputs) | Schemas double as admin form generators |
| Forms | react-hook-form | Pairs with zod |
| Reordering UI | dnd-kit (sortable list, NOT freeform canvas) | We are building a section list editor, not Webflow |
| Styling | Tailwind for structure/spacing ONLY; CSS variables + inline styles for ALL token-driven values | Tailwind cannot generate runtime class names (`bg-[${x}]` silently fails) |

Budget constraint: everything must run on free tiers + ≤$25/month.

# 3. THE CORE ARCHITECTURE: 4-LAYER COMPOSITION ENGINE

This is the heart of the product. One codebase renders every restaurant. A restaurant's entire look is DATA, not code.

**Layer 1 — Design tokens (global skin):** colors (primary, accent, background, surface, text), font pairing (heading + body, curated list of ~15 Google Fonts including Urdu-capable e.g. Noto Nastaliq), corner radius, spacing density, button shape, card shadow style, optional background texture URL. Stored as JSON → injected as CSS variables by a ThemeProvider.

**Layer 2 — Layout shell:** header style (centered-logo / logo-plus-menu / sticky-bar), category navigation (pills / tabs / sidebar-drawer), page max-width, section vertical spacing.

**Layer 3 — Section list:** page = ordered array of section instances. Each has a `type` (registry key) and `settings`.

**Layer 4 — Section settings:** per-instance parameters validated by that section's zod schema. Every field MUST have `.default()`.

**Component registry:** a single map `{ "menu_grid": MenuGrid, ... }` in `src/sections/registry.ts`. The renderer is a dumb loop: look up type → render with settings + menu data + tokens. Registry string keys and settings keys are PERMANENT (they live in customer DB configs forever) — never rename or remove, only add.

**Menu data is separate from presentation.** Items/categories live in normal tables; sections receive data as props and never fetch internally.

**Config columns on `restaurants` table:** `draft_config` and `published_config` (JSONB). Studio edits draft; Publish copies draft → published and triggers ISR revalidation.

**Live preview in Studio:** embed the REAL menu page in an iframe; postMessage the draft config on every change. One renderer, zero preview drift.

**Escape hatches (in priority order):** (1) per-restaurant `custom_css` text field for premium overrides written by us; (2) rare one-off section coded and added to the registry, becoming reusable.

## Database schema (starting point — refine in your plan)

```
restaurants: id, slug (immutable), name, draft_config JSONB, published_config JSONB,
             custom_css, logo_url, is_active, created_at
categories:  id, restaurant_id, name, sort_order
menu_items:  id, restaurant_id, category_id, name, description, price,
             image_url, model_glb_url, model_usdz_url, is_available, sort_order
scan_events: id, restaurant_id, item_id, event_type
             (menu_viewed | item_viewed | ar_opened), created_at
admin_users: managed via Supabase Auth; restaurant staff scoped to their restaurant_id
```

Routing: public menu at `/r/[slug]`. QR codes encode this URL and are PERMANENT — slugs are immutable after creation.

# 4. HARD RULES (violating any of these is a critical bug)

1. Every table has `restaurant_id`; every query filters by it; RLS policies are mandatory on every table BEFORE feature code touches it. Restaurant A must never see Restaurant B's data — this is the existential failure mode of the business.
2. No runtime-constructed Tailwind class names, ever. Token-driven styling = CSS variables + inline styles.
3. Registry keys and settings keys are append-only. Schema changes = new keys with zod defaults; old configs in the DB must always parse.
4. All R2 asset URLs are versioned; a file is never overwritten at the same URL.
5. Sections style exclusively via CSS variables — a hardcoded hex color or font-family inside a section component is a bug.
6. AR features require HTTPS; local device testing uses tunnels or Vercel preview URLs.
7. Restaurant dashboard exposes content editing only; all design controls live in Studio.
8. Public menu page: photos render immediately; 3D models lazy-load only on AR-button interaction (`model-viewer` with `poster` + `reveal="interaction"`). Never preload all models.

# 5. DESIGN REFERENCE BRANDS — THE FLEXIBILITY BAR

The composition engine must be able to convincingly approximate the look-and-feel of AT LEAST these 7 Pakistani/international restaurant brand websites. During planning, study each one's public website and decompose it into (a) design tokens, (b) layout shell choices, (c) required section types:

1. **Cheezious** — loud yellow/red fast-food energy, bold cards, deals carousels
2. **Ranchers** — dark western/steakhouse theme, display typography, cinematic imagery
3. **Anatummy** — desi/traditional warmth
4. **Broadway Pizza** — vibrant grid-heavy pizza chain aesthetic
5. **KFC (Pakistan)** — tight red/white brand system, dense product grid, promo banners
6. **Tehzeeb Bakers** — bakery/traditional hybrid, category-rich catalog feel
7. One more of your choosing from Pakistani F&B (e.g., OPTP, Howdy) to stress-test variety

Deliverable from this study (goes in the plan): a **coverage matrix** — for each brand, which tokens + shell options + sections (with settings) reproduce its vibe, and a consolidated list of the v1 section registry (~8–12 sections) with full zod schemas. If a brand can't be approximated, the registry design is incomplete.

IP rule: we imitate STRUCTURE and MOOD (layout patterns, color families, typography feel) with our own generic implementations. Never copy logos, images, copy text, or proprietary assets from these brands.

# 6. YOUR FIRST TASKS — IN THIS EXACT ORDER

## Phase 0-A: Workspace setup (before any planning output)

Create these files and show them to me for review:

1. **CLAUDE.md** — ≤60 lines: stack, commands, folder map, and the Hard Rules from section 4 verbatim.
2. **Four skills** in `.claude/skills/`:
   - `create-section/SKILL.md` — the full procedure for adding a section: CSS-variables-only styling, zod schema with defaults, registry registration, must render with empty menu data, no internal fetching. Include a reference example component file in the skill folder.
   - `asset-pipeline/SKILL.md` — with a bundled `optimize.sh` script: gltf-transform optimization (Draco + KTX2, 1024px textures), size assertion ≤5MB (fail loudly), USDZ conversion step, R2 upload with versioned filename, DB URL update. Document required CLI dependencies.
   - `db-migration/SKILL.md` — migration naming, the RLS policy template for new tables, restaurant_id requirement, pooled-connection reminder, TypeScript type regeneration step.
   - `onboard-restaurant/SKILL.md` — checklist: create tenant row → apply preset config → generate QR (immutable slug) → verify on real Android AND real iPhone → publish.
3. **Two subagents** in `.claude/agents/`:
   - `tenant-security-reviewer.md` — read-only tools (Read, Grep, Glob). Checks diffs for: queries missing restaurant_id/RLS reliance, new tables without RLS, API routes trusting client-supplied restaurant_id without session verification, non-pooled connection strings. Output: file, line, severity, one-line fix.
   - `design-system-reviewer.md` — read-only tools. Checks for: hardcoded colors/fonts in sections, runtime Tailwind class construction, zod fields missing defaults, renamed/removed registry or settings keys, sections fetching data internally.

## Phase 0-B: THE PLAN (mandatory — no application code before approval)

You must NOT write, scaffold, or generate any application code until I explicitly approve the plan. Produce **PLAN.md** containing:

1. **Clarifying questions** — anything genuinely ambiguous, asked FIRST, before the rest of the plan.
2. **Final DB schema** — every table, column, index, and the exact RLS policy per table.
3. **The brand coverage matrix** from section 5 and the resulting v1 section registry: every section with its complete zod settings schema.
4. **Token dictionary** — the exact list of design tokens and their CSS variable names (this list is append-only forever, so design it carefully).
5. **Config JSON contract** — a full example `draft_config` for one complete restaurant (a Cheezious-like preset), validating against the schemas.
6. **Route map** — public menu, Studio, Merchant Dashboard, API routes, auth boundaries.
7. **Milestone breakdown** with acceptance criteria:
   - M1: One hardcoded restaurant menu page, real Supabase data, working AR on real Android + real iPhone, assets from R2. (AR working on BOTH platforms is the gate — nothing else proceeds without it.)
   - M2: Composition engine — tokens/ThemeProvider, registry, renderer loop, config from DB, draft/publish, ISR.
   - M3: Studio — section list with dnd-kit reorder, schema-generated settings forms, iframe live preview, presets, QR generator.
   - M4: Merchant Dashboard — Supabase Auth, item/price/availability CRUD, photo upload, scoped by RLS.
   - M5: Analytics events (menu_viewed, item_viewed, ar_opened) + basic owner-facing stats.
8. **Risk register** — top 10 technical risks with mitigations (start from the Hard Rules traps).
9. **Testing strategy** — including the real-device AR test procedure and how RLS isolation will be verified with two test tenants.

After I approve PLAN.md, work milestone by milestone. At the end of every milestone, run BOTH reviewer subagents on the diff and show me their findings before moving on.

## Explicit NON-GOALS for v1 (do not build, do not scaffold "for later")

Ordering/cart/checkout/payments; customer accounts; freeform drag-and-drop canvas builder; native mobile apps; custom Three.js/WebXR AR; 3D model generation; custom domain mapping (v2 premium feature); multi-language UI (design tokens should not preclude RTL/Urdu later, but don't build i18n now).

Begin now with Phase 0-A. Then Phase 0-B. Remember: clarifying questions first, plan second, my approval third, code last.
