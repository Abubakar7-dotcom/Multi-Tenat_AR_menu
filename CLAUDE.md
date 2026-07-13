# AR Menu Multi-Tenant Platform

Multi-tenant SaaS for AR restaurant menus (Pakistan). One Next.js codebase renders every
restaurant from DB-stored config ("4-layer composition engine": tokens → layout shell →
section list → section settings). See `PLAN.md` for full architecture, schema, and milestones.

## Stack

- Next.js (App Router, TypeScript 6.0.x — **pinned below 6.1**, not latest 7.x; see note), hosted on Vercel
- Supabase (Postgres, Auth, RLS, Storage) — **pooled** connection string (port 6543) only
- Cloudflare R2 + CDN for 3D assets (.glb/.usdz) and images
- `<model-viewer>` for AR (never custom WebXR/Three.js)
- zod (schemas/validation) + react-hook-form
- dnd-kit for section reordering
- Tailwind for structure/spacing only; CSS variables + inline styles for token-driven values

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run typecheck` — TypeScript check
- `npm run lint` — lint
- `.claude/skills/asset-pipeline/optimize.sh <input.glb>` — optimize + convert + upload a 3D asset

## Folder map

- `src/app/r/[slug]/` — public menu page (AR entry point)
- `src/app/studio/` — internal admin: design composition
- `src/app/dashboard/` — restaurant admin: content editing
- `src/sections/registry.ts` — section type → component map (append-only keys)
- `src/sections/*/` — one folder per section type (component + zod schema)
- `src/lib/supabase/` — Supabase client, generated types, queries (all filtered by `restaurant_id`)
- `.claude/skills/` — create-section, asset-pipeline, db-migration, onboard-restaurant
- `.claude/agents/` — tenant-security-reviewer, design-system-reviewer

## Hard Rules (violating any of these is a critical bug)

1. Every table has `restaurant_id`; every query filters by it; RLS policies are mandatory
   on every table BEFORE feature code touches it. Restaurant A must never see Restaurant B's
   data — this is the existential failure mode of the business.
2. No runtime-constructed Tailwind class names, ever. Token-driven styling = CSS variables +
   inline styles.
3. Registry keys and settings keys are append-only. Schema changes = new keys with zod
   defaults; old configs in the DB must always parse.
4. All R2 asset URLs are versioned; a file is never overwritten at the same URL.
5. Sections style exclusively via CSS variables — a hardcoded hex color or font-family inside
   a section component is a bug.
6. AR features require HTTPS; local device testing uses tunnels or Vercel preview URLs.
7. Restaurant dashboard exposes content editing only; all design controls live in Studio.
8. Public menu page: photos render immediately; 3D models lazy-load only on AR-button
   interaction (`model-viewer` with `poster` + `reveal="interaction"`). Never preload all
   models.

Note: TypeScript is pinned to `6.0.3` (not npm's `latest`, currently `7.x`) — the new
Go-ported TS7 compiler breaks `@typescript-eslint`/`eslint-config-next` as of this writing.
Revisit the pin once that ecosystem catches up.
