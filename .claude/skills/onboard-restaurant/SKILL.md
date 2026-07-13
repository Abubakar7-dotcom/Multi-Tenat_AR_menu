---
name: onboard-restaurant
description: Use when bringing a new restaurant client onto the platform end-to-end — creating the tenant row, applying a Studio design preset, generating the QR code, and publishing. Follow in order; the AR verification step on real Android AND real iPhone is a hard gate before publish.
---

# Onboard Restaurant

Checklist for taking a new restaurant client from signed contract to live, scannable menu.
Follow in order — later steps assume earlier ones are done.

## Checklist

1. **Create the tenant row.**
   - Insert into `restaurants`: `slug`, `name`, `logo_url`, `is_active = false` (stays
     inactive until publish at the end).
   - **`slug` is immutable once created** — it's baked into the printed QR code
     (`/r/[slug]`). Confirm the slug with the client before creating the row (final spelling,
     no typos, matches their brand). Changing it later means reprinting every QR code in the
     restaurant.

2. **Apply a preset config.**
   - Pick the closest-matching brand preset from the coverage matrix in PLAN.md (or a
     previously-built custom config) as the starting `draft_config`.
   - In Studio, adjust Layer 1 tokens (colors, fonts) and Layer 2 layout shell to match the
     client's actual branding — never copy a reference brand's logo, photography, or copy
     text (IP rule, section 5 of the brief), only structural/mood patterns.
   - Add categories and menu items (content, not design) — this can be done by us during
     onboarding or handed to the restaurant's own staff via the Merchant Dashboard once their
     `admin_users` account exists.

3. **Generate the QR code via Studio's built-in generator** (`/studio/[restaurantId]/qr`).
   - Encodes the full public URL `https://<domain>/r/<slug>` — the same immutable slug from
     step 1.
   - Exports at print resolution (PNG/PDF) appropriate for table placement — test scan
     distance/angle on a physical printout before finalizing.

4. **Verify AR on real devices — hard gate, do not skip or substitute a simulator.**
   - Real Android device: scan the QR (or hit the preview URL), open a dish with a 3D model,
     tap "View on Table," confirm Scene Viewer opens the `.glb` and the model places at
     correct real-world scale.
   - Real iPhone: same flow, confirm Quick Look opens the `.usdz`.
   - Confirm photos render immediately and the 3D model only loads on interaction (never
     preloaded) — Hard Rule #8.
   - If either platform fails, this is a release blocker for this restaurant. Do not proceed
     to publish.

5. **Publish.**
   - Copy `draft_config` → `published_config`.
   - Trigger `revalidatePath('/r/[slug]')` so ISR picks up the new config.
   - Set `restaurants.is_active = true`.
   - Re-verify the live (non-preview) URL loads correctly on both platforms one more time
     post-publish before handing off printed QR codes to the client.

6. **Hand off.**
   - Give restaurant staff their Merchant Dashboard login (Supabase Auth, scoped to this
     `restaurant_id` via RLS) for ongoing content edits (items, prices, availability, photos).
   - Confirm they understand the dashboard is content-only — design changes go through us via
     Studio (Hard Rule #7).
