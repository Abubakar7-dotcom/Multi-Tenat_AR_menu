# PLAN — AR Menu Multi-Tenant Platform

Status: **awaiting approval**. No application code has been written. Do not scaffold or
generate app code until this plan is explicitly approved.

---

## 1. Clarifying questions (asked and resolved)

These were asked before the rest of this plan was drafted, since each is a business/product
call rather than an engineering one:

| Question | Decision | Plan impact |
|---|---|---|
| Is restaurant subscription billing in scope for v1? | **Yes — build basic billing.** | Adds Stripe subscriptions, a `restaurant_billing` table, a webhook route, and a Billing tab in the Merchant Dashboard. Not in the original brief; scoped minimally below (§9 risk register discusses the tradeoff). |
| Merchant Dashboard auth method? | **Email + password** (Supabase Auth). | Simplest flow, no SMS provider dependency/cost. |
| Where do internal platform team accounts live? | **Separate `platform_admins` table**, not a role flag on `admin_users`. | Platform staff are never subject to tenant-scoped RLS policies at all — no per-policy special-casing to get wrong. |
| Does Studio need a built-in QR generator? | **Yes — build it into Studio.** | Adds `/studio/[restaurantId]/qr` route; `onboard-restaurant` skill already updated to reference it. |

### Remaining open items (operational, not architectural — don't block plan approval)

- Which Stripe mode/account to use and when to flip from test to live keys.
- Final production domain name (affects QR codes printed during onboarding, not the schema).
- Curated list of ~15 Google Fonts (Urdu-capable pairing included) — draft list proposed in
  §4, needs final sign-off before Studio's font picker ships.

---

## 2. Final DB schema

```
restaurants
  id                    uuid pk default gen_random_uuid()
  slug                  text unique not null            -- immutable after creation
  name                  text not null
  draft_config          jsonb not null default '{}'
  published_config      jsonb not null default '{}'
  custom_css            text
  logo_url              text
  is_active             boolean not null default false
  created_at            timestamptz not null default now()

restaurant_billing                                       -- separate table: see rationale below
  restaurant_id         uuid pk references restaurants(id) on delete cascade
  stripe_customer_id    text
  stripe_subscription_id text
  subscription_status   text not null default 'trialing' -- trialing|active|past_due|canceled
  current_period_end    timestamptz
  updated_at            timestamptz not null default now()

categories
  id                    uuid pk default gen_random_uuid()
  restaurant_id         uuid not null references restaurants(id) on delete cascade
  name                  text not null
  sort_order            int not null default 0

menu_items
  id                    uuid pk default gen_random_uuid()
  restaurant_id         uuid not null references restaurants(id) on delete cascade
  category_id           uuid not null references categories(id) on delete cascade
  name                  text not null
  description           text
  price                 numeric(10,2) not null
  image_url             text
  model_glb_url         text
  model_usdz_url        text
  badge_text            text                             -- e.g. "New", "Spicy" — card badge
  is_available          boolean not null default true
  sort_order            int not null default 0

scan_events
  id                    uuid pk default gen_random_uuid()
  restaurant_id         uuid not null references restaurants(id) on delete cascade
  item_id               uuid references menu_items(id) on delete set null  -- null for menu_viewed
  event_type            text not null                    -- menu_viewed|item_viewed|ar_opened
  created_at            timestamptz not null default now()

admin_users                                               -- restaurant staff only
  id                    uuid pk references auth.users(id)
  restaurant_id         uuid not null references restaurants(id) on delete cascade
  created_at            timestamptz not null default now()

platform_admins                                           -- our internal team only
  id                    uuid pk references auth.users(id)
  created_at            timestamptz not null default now()
```

Indexes: `restaurant_id` on `categories`, `menu_items`, `scan_events`, `admin_users`;
`category_id` on `menu_items`; `created_at` on `scan_events` (time-range analytics queries);
unique index already implied on `restaurants.slug` and `restaurant_billing.restaurant_id` (pk).

### Why `restaurant_billing` is a separate table, not columns on `restaurants`

`restaurants` gets a public RLS read policy (the public menu page reads it). Stripe customer/
subscription IDs must never be reachable through that policy, even accidentally via a future
`select *`. Splitting billing into its own table means the public-read policy structurally
cannot expose it — there's no policy on `restaurant_billing` that grants anon/public access at
all. This is a `tenant-security-reviewer`-motivated design choice, not just tidiness.

### `badge_text` on `menu_items`

Small addition beyond the brief's starting schema, motivated by the brand research (§5):
Cheezious/KFC "New" tags, OPTP flavor badges. Simple nullable string, no new table — a
sanctioned "refine in your plan" addition.

### RLS policies

**`restaurants`**
```sql
alter table restaurants enable row level security;

create policy "restaurants_platform_admin_all" on restaurants for all
  using (exists (select 1 from platform_admins where id = auth.uid()))
  with check (exists (select 1 from platform_admins where id = auth.uid()));

create policy "restaurants_own_staff_read" on restaurants for select
  using (id = (select restaurant_id from admin_users where id = auth.uid()));

create policy "restaurants_public_read" on restaurants for select
  using (is_active = true);
-- Public read is row-level only; the app must still select specific columns
-- (id, slug, name, draft/published_config, custom_css, logo_url) rather than `select *`
-- on any client-facing query, since is_active alone doesn't hide non-sensitive-but-internal
-- columns. No sensitive (billing) columns live on this table at all — see above.
```

**`restaurant_billing`**
```sql
alter table restaurant_billing enable row level security;

create policy "billing_platform_admin_all" on restaurant_billing for all
  using (exists (select 1 from platform_admins where id = auth.uid()))
  with check (exists (select 1 from platform_admins where id = auth.uid()));

create policy "billing_own_staff_read" on restaurant_billing for select
  using (restaurant_id = (select restaurant_id from admin_users where id = auth.uid()));
-- No insert/update/delete policy for admin_users — writes only via the Stripe webhook
-- handler using the service-role key (server-only, never exposed to any client bundle).
-- No public/anon policy at all.
```

**`categories` / `menu_items`** (same shape for both, `<table>` below)
```sql
alter table <table> enable row level security;

create policy "<table>_platform_admin_all" on <table> for all
  using (exists (select 1 from platform_admins where id = auth.uid()))
  with check (exists (select 1 from platform_admins where id = auth.uid()));

create policy "<table>_own_staff_all" on <table> for all
  using (restaurant_id = (select restaurant_id from admin_users where id = auth.uid()))
  with check (restaurant_id = (select restaurant_id from admin_users where id = auth.uid()));

create policy "<table>_public_read" on <table> for select
  using (
    exists (select 1 from restaurants where restaurants.id = <table>.restaurant_id
            and restaurants.is_active = true)
  );
-- menu_items additionally: the public read path in application code filters
-- is_available = true explicitly (RLS doesn't need to encode this — Merchant Dashboard's
-- own-staff policy must still see unavailable items to let staff toggle them back on).
```

**`scan_events`**
```sql
alter table scan_events enable row level security;

create policy "scan_events_platform_admin_read" on scan_events for select
  using (exists (select 1 from platform_admins where id = auth.uid()));

create policy "scan_events_own_staff_read" on scan_events for select
  using (restaurant_id = (select restaurant_id from admin_users where id = auth.uid()));
-- No insert policy for anon/authenticated roles at all. Diners are never authenticated, so
-- there is no session to derive restaurant_id from — the natural trap here is accepting
-- restaurant_id in the client POST body, which any visitor could spoof to write bogus events
-- into another tenant's analytics. Instead: all inserts happen through a server action bound
-- to the resolved /r/[slug] route (restaurant_id resolved server-side from the slug, never
-- from client input), executed with the service-role key. See Risk Register §9.
```

**`admin_users`**
```sql
alter table admin_users enable row level security;

create policy "admin_users_platform_admin_all" on admin_users for all
  using (exists (select 1 from platform_admins where id = auth.uid()))
  with check (exists (select 1 from platform_admins where id = auth.uid()));

create policy "admin_users_self_read" on admin_users for select
  using (id = auth.uid());
```

**`platform_admins`**
```sql
alter table platform_admins enable row level security;

create policy "platform_admins_self_read" on platform_admins for select
  using (id = auth.uid());
-- No insert/update policy for any authenticated role — membership is granted manually
-- (SQL/dashboard) by an existing platform admin for v1. Small trusted team, no self-serve
-- signup into this table, ever.
```

All application-facing queries additionally filter by `restaurant_id` explicitly in code
(never relying on RLS as the only line of defense) per Hard Rule #1 and the
`tenant-security-reviewer` checklist.

---

## 3. Brand coverage matrix and v1 section registry

Researched each brand's actual public site/branding (see method note below the table) and
mapped each to token values, layout shell choices, and section combinations. All colors below
are *approximate*, inferred from public branding — Studio's actual color pickers let us
fine-tune per real client, and per the IP rule (brief §5) these are new palettes in the same
family, not extracted hex values from copyrighted assets.

**Research method:** most of these brands' sites are client-rendered ordering apps that block
non-JS fetches; findings for 5 of 7 brands are triangulated from delivery-aggregator listings,
brand design-portfolio case studies, and franchise/press coverage rather than direct
server-rendered HTML (flagged secondary-source). Tehzeeb Bakers' site rendered directly
(primary-source). For brand #7, researched **OPTP (One Potato Two Potato)**, a real
Karachi-founded chain — substituted for the brief's ambiguous "OPTP" placeholder after
confirming it's a real, findable brand (not "Original Peri Peri..." as the acronym might
suggest).

| Brand | Tokens (primary / accent / bg / text) | Font pairing feel | Header / Category nav | Corner radius / Button / Shadow / Density | Sections used |
|---|---|---|---|---|---|
| **Cheezious** | Red `#E4002B` / gold `#FFC72C` / white / near-black | Bold rounded display + clean sans body | logo-plus-menu / pills | soft / pill / soft / compact | `deals_carousel`, `menu_grid` (grid, 2-col, image-top), `bundle_comparison` (party deals), `banner` (app-download) |
| **Ranchers** | Deep maroon `#7A1F1F` / mustard gold `#C9A227` / dark `#1B1310` / warm off-white | Rugged slab-serif heading ("western wanted-poster") + clean sans body | centered-logo / tabs | sharp-ish / rounded / hard / comfortable | `hero_banner` (cinematic), `category_showcase`, `menu_grid` (image-left cards), `bundle_comparison`, `store_locator`, `footer_info` |
| **Anatummy** | Medical red `#D7263D` / clinical white / white / near-black | Stamp/stencil display accent + clean sans body | centered-logo / tabs | sharp / rounded-sm / none-soft / spacious | `gallery_grid` (moody photography + captions), `menu_grid` (list, full descriptions), `item_spotlight` |
| **Broadway Pizza** | Red `#C8102E` / marquee gold `#F2B705` / white / near-black | Bold theatrical display + clean sans body | logo-plus-menu / pills | soft / pill / soft / compact | `deals_carousel`, `bundle_comparison` (7"/10"/13"/20" size selector), `menu_grid` (dense grid), `banner` (trust/awards), `footer_info` |
| **KFC Pakistan** | KFC red `#E4002B` / black / white / near-black | Bold condensed sans, flat/no-shading | sticky-bar / tabs | soft / rounded / soft / compact | `banner` (Midnight/Daily Deal promo), `hero_banner` (combo hero), `menu_grid` (price-forward dense grid), `item_spotlight` (localized fusion item), `store_locator`, `footer_info` |
| **Tehzeeb Bakers** | Warm brown `#6B3F2A` / neutral grey / white / dark grey | Modern clean sans, restrained (not playful) | logo-plus-menu / **icon-grid** *(new shell option, see below)* | soft / rounded / soft / spacious | `hero_banner` (seasonal), `category_showcase` (16-category icon grid — the defining section for this brand), `item_spotlight`, `heritage_story` ("114 Years of Legacy"), `footer_info` (multi-column + newsletter) |
| **OPTP** | Spicy orange `#E85D25` / black+white checker motif / white / near-black | Bold rounded casual display + clean sans body | centered-logo (emblem badge) / pills | rounded / pill / soft / compact | `hero_banner` or `banner` (promo, "since 1998"), `menu_grid` (with `badge_text` flavor chips), `bundle_comparison` (combo boxes), `heritage_story` (founder story), `store_locator` |

**Registry coverage verdict:** 6 of 7 brands map onto the Layer-2 shell options already listed
in the brief (`centered-logo` / `logo-plus-menu` / `sticky-bar` × `pills` / `tabs` /
`sidebar-drawer`). **Tehzeeb Bakers does not** — its defining nav pattern is a 16-item
icon+label grid, not pills/tabs/sidebar-drawer. Per brief §5 ("if a brand can't be
approximated, the registry design is incomplete"), this plan adds a 4th `categoryNavStyle`
option: **`icon-grid`**. This is the one shell-level addition beyond the brief's starting
list; everything else (tokens, sections) covers all 7 brands without modification.

### v1 section registry (11 sections)

Kept to 11 (within the brief's 8–12 target) by generalizing structurally-identical UI
patterns into one section with a `variant` setting, rather than one section per brand-specific
use case (e.g. promo banners, trust badges, and app-download callouts are all "image/icon +
heading + optional CTA" — one `banner` section, three variants).

Shared pattern used by several sections below: a **content source** — either `categoryId`
(show all items in that category) or an explicit `itemIds` array (curated picks, e.g. a
hand-picked deals carousel). All such sections receive the *full* `menuData` as a prop already
(no fetching) and just filter client-side by the configured source.

1. **`hero_banner`** — full-width image/text banner, typically first on the page.
   ```ts
   z.object({
     imageUrl: z.string().default(""),
     heading: z.string().default(""),
     subheading: z.string().default(""),
     ctaLabel: z.string().default(""),
     ctaTargetSectionId: z.string().default(""), // scrolls to another section on this page
     overlayOpacity: z.number().min(0).max(1).default(0.3),
   })
   ```

2. **`menu_grid`** — the core catalog section.
   ```ts
   z.object({
     categoryId: z.string().default(""),        // "" = all categories
     itemIds: z.array(z.string()).default([]),  // non-empty overrides categoryId
     layout: z.enum(["grid", "list"]).default("grid"),
     columns: z.number().int().min(1).max(4).default(2),
     cardImagePosition: z.enum(["top", "left"]).default("top"),
     showDescription: z.enum(["none", "short", "full"]).default("short"),
     showBadge: z.boolean().default(true),
   })
   ```

3. **`deals_carousel`** — horizontal scroll of curated item/deal cards.
   ```ts
   z.object({
     itemIds: z.array(z.string()).default([]),
     heading: z.string().default("Deals"),
     autoScroll: z.boolean().default(false),
   })
   ```

4. **`banner`** — generalized promo / trust / app-download strip.
   ```ts
   z.object({
     variant: z.enum(["promo", "trust", "app_download"]).default("promo"),
     imageUrl: z.string().default(""),
     heading: z.string().default(""),
     body: z.string().default(""),
     ctaLabel: z.string().default(""),
     ctaUrl: z.string().default(""),
     dismissible: z.boolean().default(false),
   })
   ```

5. **`category_showcase`** — icon+label tile grid linking into categories (also what powers
   Tehzeeb's `icon-grid` nav pattern when used at the top of the page).
   ```ts
   z.object({
     categoryIds: z.array(z.string()).default([]), // "" length = all categories
     columns: z.number().int().min(2).max(5).default(4),
     showIcons: z.boolean().default(true),
   })
   ```

6. **`bundle_comparison`** — side-by-side comparison table/cards (pizza sizes, combo boxes,
   flavor variants) built from real `menu_items`, not editorial-only content.
   ```ts
   z.object({
     categoryId: z.string().default(""),
     itemIds: z.array(z.string()).default([]),
     heading: z.string().default(""),
     layout: z.enum(["table", "cards"]).default("cards"),
   })
   ```

7. **`heritage_story`** — rich text + image brand-story block.
   ```ts
   z.object({
     imageUrl: z.string().default(""),
     heading: z.string().default(""),
     body: z.string().default(""),
     imagePosition: z.enum(["left", "right"]).default("right"),
   })
   ```

8. **`item_spotlight`** — single highlighted item, larger than a grid card.
   ```ts
   z.object({
     itemId: z.string().default(""),
     heading: z.string().default(""),
     ctaLabel: z.string().default("View on Table"),
   })
   ```

9. **`gallery_grid`** — photo-forward grid with optional captions, not tied 1:1 to purchasable
   items (e.g. ambience/plating shots).
   ```ts
   z.object({
     images: z.array(z.object({
       url: z.string().default(""),
       caption: z.string().default(""),
     })).default([]),
     columns: z.number().int().min(2).max(4).default(3),
   })
   ```

10. **`store_locator`** — branch list (address + phone; no map dependency for v1, keeps
    external-API surface at zero).
    ```ts
    z.object({
      heading: z.string().default("Our Locations"),
      branches: z.array(z.object({
        name: z.string().default(""),
        address: z.string().default(""),
        phone: z.string().default(""),
      })).default([]),
    })
    ```

11. **`footer_info`** — contact/social/newsletter footer.
    ```ts
    z.object({
      showNewsletter: z.boolean().default(false),
      socialLinks: z.array(z.object({
        platform: z.string().default(""),
        url: z.string().default(""),
      })).default([]),
      contactPhone: z.string().default(""),
      contactAddress: z.string().default(""),
    })
    ```

Every schema above satisfies the create-section skill's rule: every field has `.default()`,
so `schema.parse({})` always succeeds — required for old configs to keep parsing as fields are
added later.

---

## 4. Token dictionary (Layer 1 — append-only forever)

| Token (config key) | CSS variable | Type | Notes |
|---|---|---|---|
| `colorPrimary` | `--color-primary` | hex | |
| `colorPrimaryContrast` | `--color-primary-contrast` | hex | Text/icon color on top of primary-colored surfaces (buttons). **Added beyond the brief's list** — brand research showed this is unavoidable (Cheezious yellow needs dark text, KFC red needs white text); a hardcoded assumption in components would violate Hard Rule #5. |
| `colorAccent` | `--color-accent` | hex | |
| `colorAccentContrast` | `--color-accent-contrast` | hex | Same rationale as above. |
| `colorBackground` | `--color-background` | hex | |
| `colorSurface` | `--color-surface` | hex | Card/panel background, distinct from page background. |
| `colorText` | `--color-text` | hex | |
| `colorTextMuted` | `--color-text-muted` | hex | Secondary text (descriptions, timestamps). **Added** — every brand researched needed a muted tone distinct from primary text. |
| `fontHeading` | `--font-heading` | font stack | From curated ~15 Google Fonts list (§4a). |
| `fontBody` | `--font-body` | font stack | Same curated list. |
| `cornerRadius` | `--radius-card` | enum: `sharp`\|`soft`\|`rounded` | Resolved to a px value by ThemeProvider; curated enum, not a raw number, so Studio can't produce an inconsistent/broken scale. |
| `buttonShape` | `--radius-button` | enum: `square`\|`rounded`\|`pill` | Independent from `cornerRadius` — several researched brands want pill buttons with only modestly rounded cards. |
| `spacingDensity` | `--spacing-unit` | enum: `compact`\|`comfortable`\|`spacious` | Resolved to a base px unit (4/6/8) that section layouts multiply against. |
| `cardShadow` | `--shadow-card` | enum: `none`\|`soft`\|`medium`\|`hard` | Curated box-shadow presets, not arbitrary CSS — keeps `custom_css` as the only raw-CSS escape hatch (brief §3 priority order). |
| `backgroundTextureUrl` | `--bg-texture-url` | url \| "" | Optional; empty string default. |

All enum tokens are resolved server-side in `ThemeProvider` into concrete CSS variable values
(a fixed lookup table), never interpolated as raw Tailwind classes — this is what keeps Hard
Rule #2 satisfied even though Studio's UI presents them as pickers/dropdowns.

### 4a. Draft curated font list (~15, needs final sign-off)

Display/heading candidates: Anton, Bebas Neue, Fredoka, Baloo 2, Rye, Special Elite, Poppins
(bold), Oswald. Body candidates: Inter, Work Sans, Poppins (regular), Noto Sans. Urdu-capable:
**Noto Nastaliq Urdu** (heading, RTL-shaped script), Noto Sans Arabic (body fallback), Mehr
Nastaliq (if licensing/self-hosting checks out). Final list to be confirmed against Google
Fonts variable-font availability and self-hosting size budget before Studio's font picker
ships (not a blocker for M1/M2).

---

## 5. Config JSON contract — example `draft_config` (Cheezious-like preset)

```json
{
  "tokens": {
    "colorPrimary": "#E4002B",
    "colorPrimaryContrast": "#FFFFFF",
    "colorAccent": "#FFC72C",
    "colorAccentContrast": "#1A1A1A",
    "colorBackground": "#FFFFFF",
    "colorSurface": "#FFF8E1",
    "colorText": "#1A1A1A",
    "colorTextMuted": "#6B6B6B",
    "fontHeading": "Baloo 2",
    "fontBody": "Inter",
    "cornerRadius": "soft",
    "buttonShape": "pill",
    "spacingDensity": "compact",
    "cardShadow": "soft",
    "backgroundTextureUrl": ""
  },
  "layoutShell": {
    "headerStyle": "logo-plus-menu",
    "categoryNavStyle": "pills",
    "pageMaxWidth": 640,
    "sectionSpacing": "normal"
  },
  "sections": [
    {
      "id": "sec-1",
      "type": "deals_carousel",
      "settings": { "itemIds": ["item-deal-1", "item-deal-2"], "heading": "Today's Deals", "autoScroll": false }
    },
    {
      "id": "sec-2",
      "type": "category_showcase",
      "settings": { "categoryIds": [], "columns": 4, "showIcons": true }
    },
    {
      "id": "sec-3",
      "type": "menu_grid",
      "settings": { "categoryId": "", "itemIds": [], "layout": "grid", "columns": 2, "cardImagePosition": "top", "showDescription": "short", "showBadge": true }
    },
    {
      "id": "sec-4",
      "type": "bundle_comparison",
      "settings": { "categoryId": "cat-party-deals", "itemIds": [], "heading": "Party Packs", "layout": "cards" }
    },
    {
      "id": "sec-5",
      "type": "banner",
      "settings": { "variant": "app_download", "imageUrl": "", "heading": "Get the app", "body": "", "ctaLabel": "Download", "ctaUrl": "", "dismissible": true }
    }
  ]
}
```

Every `settings` object above validates against its section's schema (§3) — every field is
present because every field has a default, so this JSON would still be valid even with fields
omitted entirely.

---

## 6. Route map

| Route | App | Auth | Notes |
|---|---|---|---|
| `/r/[slug]` | Public menu | none | ISR; renders `published_config` (or `draft_config` when `?mode=preview`, only reachable from within the Studio iframe). |
| `/studio/login` | Studio | none (login form) | |
| `/studio` | Studio | `platform_admins` | Restaurant list. |
| `/studio/[restaurantId]` | Studio | `platform_admins` | Token/shell/section editor + live preview iframe pointed at `/r/[slug]?mode=preview`. |
| `/studio/[restaurantId]/qr` | Studio | `platform_admins` | QR generator/exporter. |
| `/dashboard/login` | Merchant Dashboard | none (login form) | |
| `/dashboard` | Merchant Dashboard | `admin_users` | Redirects to the staff member's restaurant. |
| `/dashboard/items` | Merchant Dashboard | `admin_users` | Item/price/availability/photo CRUD. |
| `/dashboard/categories` | Merchant Dashboard | `admin_users` | Category CRUD + reorder. |
| `/dashboard/billing` | Merchant Dashboard | `admin_users` | Read-only subscription status + Stripe Customer Portal link (Stripe-hosted, minimizes PCI/build surface). |
| `/api/webhooks/stripe` | API | Stripe signature verification | Updates `restaurant_billing` via service role; idempotent on Stripe event ID. |

Auth boundary enforcement: middleware checks session against `platform_admins` for every
`/studio/*` route and `admin_users` for every `/dashboard/*` route, in addition to RLS —
belt-and-suspenders per Hard Rule #1's "never rely on RLS alone" guidance.

---

## 7. Milestone breakdown with acceptance criteria

**M1 — One hardcoded restaurant, real data, AR on both platforms (the gate).**
- One restaurant seeded directly in Supabase (no Studio yet), real `menu_items` with R2-hosted
  `.glb`/`.usdz` pairs produced via the `asset-pipeline` skill.
- Public `/r/[slug]` page renders items with photos immediately; models lazy-load only on
  "View on Table" tap.
- **Acceptance: AR verified working on a real Android device (Scene Viewer) AND a real
  iPhone (Quick Look). Nothing in M2+ starts until this passes — matches the brief's explicit
  gate.**

**M2 — Composition engine.**
- `ThemeProvider` (tokens → CSS variables), `sectionRegistry`, renderer loop, config read from
  `restaurants.draft_config`/`published_config`, draft→publish copy + `revalidatePath`.
- Acceptance: the M1 restaurant's page is now driven entirely by DB config, byte-for-byte
  equivalent rendering to the hardcoded M1 version. `design-system-reviewer` run clean.

**M3 — Studio.**
- Section list with dnd-kit reorder, schema-generated settings forms (zod → form fields),
  iframe live preview (postMessage draft config on every change), presets seeded from the
  brand coverage matrix (§3), QR generator/exporter.
- Acceptance: a second, different-looking restaurant can be composed from presets + tweaks in
  Studio with zero code changes, previewed live, and published.

**M4 — Merchant Dashboard + billing.**
- Supabase Auth (email/password), item/price/availability CRUD, photo upload (R2), scoped by
  RLS to `admin_users.restaurant_id`. Stripe subscription created at onboarding time; webhook
  keeps `restaurant_billing.subscription_status` current; `/dashboard/billing` shows status +
  Customer Portal link.
- Acceptance: restaurant staff can edit content without seeing any design controls (Hard Rule
  #7); a second tenant's staff account cannot read/write the first tenant's data (two-tenant
  RLS test, §9); a test Stripe subscription's webhook events correctly flip
  `subscription_status`.

**M5 — Analytics.**
- `scan_events` writes (`menu_viewed`, `item_viewed`, `ar_opened`) via server action bound to
  the resolved `restaurant_id` from the route (never client-supplied), basic owner-facing
  counts in the Merchant Dashboard.
- Acceptance: events recorded for the M1/M2 restaurant under real traffic; a spoofed
  client-side `restaurant_id` in a crafted request cannot write into another tenant's events
  (explicit negative test).

At the end of every milestone: run both `tenant-security-reviewer` and `design-system-reviewer`
on the diff, show findings before proceeding.

---

## 8. Risk register — top 10

1. **iOS Safari / Quick Look AR fragmentation.** USDZ quirks vary by iOS version. *Mitigation:*
   M1 gate requires a real iPhone test before anything else proceeds; maintain a small device
   test matrix, re-verify on major iOS version bumps.
2. **RLS misconfiguration causing cross-tenant leak** — the platform's existential failure
   mode. *Mitigation:* every table's RLS ships in the same migration that creates it
   (`db-migration` skill), two-tenant isolation test after every migration, both reviewer
   subagents gate every milestone.
3. **Oversized 3D assets degrade mobile load times.** *Mitigation:* `optimize.sh` hard-fails
   (non-zero exit) above 5MB rather than warning.
4. **Runtime-constructed Tailwind classes fail silently** (no error, just wrong/missing
   styling). *Mitigation:* `design-system-reviewer` grep-checks every diff; consider an
   ESLint rule forbidding template literals in `className` as a cheap backstop.
5. **Registry/schema key drift breaks old restaurant configs.** *Mitigation:* append-only
   discipline (Hard Rule #3), `design-system-reviewer` diffs registry keys, plus a CI test
   that parses every real `published_config` in the DB against current schemas before deploy.
6. **Forgetting the pooled connection string** in some new serverless code path, exhausting
   direct connections under load. *Mitigation:* single shared DB client module, `DATABASE_URL`
   naming convention, `db-migration` skill reminder.
7. **Stripe billing scope creep / webhook reliability.** A missed webhook event could
   incorrectly lock out a paying restaurant. *Mitigation:* keep the custom-built surface
   minimal (Stripe-hosted Customer Portal, not a custom payment form — also reduces PCI
   scope), idempotent webhook handling keyed on Stripe event ID, periodic reconciliation
   query against Stripe's API as a backstop.
8. **Vercel/Supabase free-tier limits** as restaurants scale toward 20 and traffic toward 200
   concurrent. *Mitigation:* ISR keeps DB reads near-idle by design; R2 offloads
   bandwidth-heavy assets entirely off Vercel; monitor function-invocation counts monthly
   against the ≤$25/month budget ceiling.
9. **Anonymous `scan_events` writes are a spoofing target** even without a session (any
   visitor to `/r/[slug]` could, in principle, script requests). *Mitigation:* inserts only
   via a server action bound to the resolved slug (never client-supplied `restaurant_id`),
   service-role key never exposed client-side; basic rate-limiting deferred unless abuse is
   actually observed (budget-conscious, not pre-built speculatively).
10. **Urdu font rendering/perf** (Noto Nastaliq Urdu is a large, RTL-shaped font).
    *Mitigation:* subset and self-host with `font-display: swap`, load only when a
    restaurant's config actually selects it — token system must not preclude future RTL/Urdu
    UI work (brief non-goals), but shouldn't tax page weight for restaurants that don't use it.

---

## 9. Testing strategy

**Real-device AR testing:** maintain a small device matrix (at least one recent Android/Chrome
device, one recent iPhone/Safari version). Every new or changed 3D asset goes through
`onboard-restaurant` step 4 before publish; M1's gate applies the same procedure to the
platform itself before any other milestone starts.

**RLS isolation (two-tenant test):** seed Tenant A and Tenant B with distinct rows in every
tenant-scoped table. Automated test suite authenticates as each tenant's `admin_users` account
in turn and asserts: (a) each tenant only ever sees its own rows on every read path, (b) writes
attempting to target the other tenant's `restaurant_id` are rejected, (c) the public/anon path
only ever returns `is_active = true` restaurants and their data. Run after every migration
(tied into the `db-migration` skill's checklist) and in CI before merge.

**Schema-default regression test:** one automated test iterates `sectionRegistry` and asserts
`schema.parse({})` succeeds for every registered section — turns the
`design-system-reviewer`'s manual "every field has `.default()`" check into a permanent CI
guard against regressions.

**Composition engine smoke test:** render all 11 v1 sections with default settings and empty
`menuData` (`{ categories: [], items: [] }`) — no-crash assertion, catches the "must render
with empty menu data" rule from the `create-section` skill automatically.

**Studio live-preview test:** verify the postMessage round-trip from the editor to the
`/r/[slug]?mode=preview` iframe actually updates rendered output without a full page reload.

**Billing webhook test:** replay representative Stripe webhook event payloads
(`customer.subscription.updated`, `.deleted`, `invoice.payment_failed`) against
`/api/webhooks/stripe` in a test environment, assert `restaurant_billing.subscription_status`
transitions correctly and idempotently (same event replayed twice → no duplicate effect).
