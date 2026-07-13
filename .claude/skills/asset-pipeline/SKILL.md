---
name: asset-pipeline
description: Use when taking a source .glb 3D model (from the photogrammetry pipeline) and producing the optimized, versioned .glb + .usdz pair that gets uploaded to R2 and linked from a menu_items row. Covers optimization, size budget enforcement, USDZ conversion, upload, and DB update.
---

# Asset Pipeline

3D model generation itself is out of scope (RealityScan output arrives as a source .glb).
This skill takes that source file to a production-ready, CDN-served asset pair.

## Required CLI dependencies (install once, verify before running)

- [`gltf-transform`](https://gltf-transform.dev/cli) CLI (`npm i -g @gltf-transform/cli`) —
  Draco geometry compression + KTX2 texture compression.
- `ktx` / `toktx` (KTX-Software) — required by gltf-transform for KTX2 texture encoding.
- USDZ conversion tool — Apple's `usdzconvert` (via USD Python tools) or
  `gltf2usd`/Reality Converter equivalent. Pin whichever one the team has actually installed;
  document the exact tool + version here once chosen so results are reproducible.
- `rclone` or the `aws` CLI configured with R2 credentials (R2 is S3-compatible) for upload.
- `psql` or the Supabase CLI for the DB URL update step.

## Procedure

1. **Input**: an optimized-ready source `.glb` for one `menu_items` row, plus the target
   `restaurant_id` and `item_id`.

2. **Optimize** (`optimize.sh`, bundled in this folder):
   - Draco-compress geometry.
   - KTX2-compress textures, resized to **1024px max dimension**.
   - Output a candidate `.glb`.

3. **Enforce the size budget — fail loudly, do not silently ship an oversized asset.**
   Target is **≤5MB** per file (both `.glb` and `.usdz`). If either exceeds it, the script
   must exit non-zero with a clear message naming the file and its size; re-run with more
   aggressive texture/geometry reduction, don't upload an oversized file. Size budget is the
   UX quality bar for mobile AR — this is not a soft warning.

4. **Convert to `.usdz`** from the optimized `.glb` using the pinned conversion tool. Re-check
   the ≤5MB budget on the `.usdz` output independently (USDZ compression characteristics
   differ from glTF).

5. **Upload to R2 with a versioned filename.** Never overwrite a file at the same URL (Hard
   Rule #4). Convention: `<restaurant_slug>/<item_id>/<item_slug>-v<N>.glb` and
   `...-v<N>.usdz`, where `N` increments each time this item's model is replaced. Set
   `Cache-Control: public, max-age=31536000, immutable` on upload (assets are versioned, so
   this is always safe).

6. **Update the DB.** Set `menu_items.model_glb_url` and `menu_items.model_usdz_url` to the
   new versioned URLs, through the pooled connection. This does not require a page rebuild
   itself, but if the item is on a published menu, trigger the same `revalidatePath` used for
   content edits so the CDN-fronted page picks up the new URLs.

7. **Verify on real devices** before considering the asset done: `<model-viewer>`'s
   `poster` should show immediately; tapping "View on Table" should load the model lazily
   (never preload) and place correctly in scale on both a real Android (Scene Viewer, .glb)
   and a real iPhone (Quick Look, .usdz).

## Bundled script

`optimize.sh` in this folder runs steps 2–3 (optimize + size assertion) given a source `.glb`
path. Extend it with your team's chosen USDZ converter and R2 upload command once those tools
are pinned — the script currently stops after producing the size-checked `.glb` and prints the
next manual steps.
