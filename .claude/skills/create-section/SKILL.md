---
name: create-section
description: Use when adding a new section type to the composition engine registry (src/sections/registry.ts) — e.g. a new menu layout block, banner, or content section. Enforces CSS-variable-only styling, zod schema with defaults, and no internal data fetching.
---

# Create Section

Sections are the Layer-3/4 building blocks of the composition engine. Every restaurant's
page is an ordered array of section instances; the renderer looks up `type` in the registry
and renders that component with `{ settings, menuData, tokens }`. Getting a section wrong
breaks the append-only contract for every restaurant config already stored in the DB — follow
this procedure exactly.

## Procedure

1. **Choose a permanent registry key.** Snake_case, e.g. `menu_grid`, `promo_banner`. This
   key is written into `restaurants.draft_config` / `published_config` JSONB forever. Never
   rename or remove a key later — only add new ones.

2. **Create the folder** `src/sections/<key>/`:
   - `schema.ts` — zod schema for this section's settings. **Every field must have
     `.default(...)`.** This is what makes old configs in the DB always parse after future
     schema changes (append fields, never remove/rename/change-required).
   - `<Key>Section.tsx` — the component. See `example.tsx` in this skill folder for the
     required shape.
   - `index.ts` — re-exports the component and schema.

3. **Styling rules (non-negotiable, see Hard Rules #2 and #5 in CLAUDE.md):**
   - No hardcoded hex colors, font-family names, or pixel values that should be
     token-driven. Read design tokens exclusively via CSS variables (e.g.
     `var(--color-primary)`, `var(--font-heading)`), never via JS objects or Tailwind
     arbitrary values.
   - Never construct a Tailwind class name at runtime (e.g. `` `bg-[${color}]` `` silently
     fails — Tailwind only picks up class names that exist as static strings at build time).
   - Tailwind utility classes are fine for structure/spacing/flex/grid only.
   - Section-specific settings (e.g. "number of columns", "show price") drive inline
     `style={{ ... }}` or conditional class names, not new CSS variables.

4. **No internal data fetching.** The section receives `menuData` (items/categories) and
   `settings` as props. It must never call Supabase, fetch, or any data-layer function
   itself. This keeps Studio's live preview (iframe + postMessage) and the real page in sync
   with zero drift — one renderer, one data path.

5. **Must render with empty/minimal menu data.** Since `settings` always has defaults and
   `menuData` can legitimately be empty (new restaurant, category with no items yet), the
   component must render a sane empty state, not crash or blank out. Test this explicitly.

6. **Register it** in `src/sections/registry.ts`:
   ```ts
   import { MenuGridSection, menuGridSchema } from "./menu_grid";
   export const sectionRegistry = {
     menu_grid: { component: MenuGridSection, schema: menuGridSchema },
     // ...
   } as const;
   ```

7. **Verify:**
   - `npm run typecheck` passes.
   - Component renders with `settings = schema.parse({})` (i.e., all-defaults) and
     `menuData = { categories: [], items: [] }` without error.
   - Run the `design-system-reviewer` subagent on the diff before merging.

## Reference

See `example.tsx` for a minimal compliant section (a text/banner block) demonstrating token
usage, defaults-only schema, and no data fetching.
