#!/usr/bin/env bash
# Optimize a source .glb for AR delivery: Draco geometry compression + KTX2 texture
# compression (1024px max), then enforce the 5MB size budget. Fails loudly (non-zero exit)
# if the optimized file still exceeds the budget — this pipeline never ships an oversized
# asset silently.
#
# Usage: optimize.sh <input.glb> <output.glb>
#
# Requires: gltf-transform CLI (npm i -g @gltf-transform/cli), which in turn requires
# KTX-Software's toktx binary on PATH for KTX2 texture encoding.
#
# This script covers optimization only (steps 2-3 of asset-pipeline/SKILL.md). USDZ
# conversion, R2 upload, and the DB URL update are separate manual/scripted steps documented
# in SKILL.md — wire in your team's pinned USDZ converter and R2 upload command as later
# stages once those tools are chosen.

set -euo pipefail

MAX_BYTES=$((5 * 1024 * 1024)) # 5MB budget (Hard Rule: 3D formats, section 2 of the brief)

if [ $# -ne 2 ]; then
  echo "Usage: $0 <input.glb> <output.glb>" >&2
  exit 1
fi

INPUT="$1"
OUTPUT="$2"

if [ ! -f "$INPUT" ]; then
  echo "ERROR: input file not found: $INPUT" >&2
  exit 1
fi

if ! command -v gltf-transform >/dev/null 2>&1; then
  echo "ERROR: gltf-transform CLI not found. Install with: npm i -g @gltf-transform/cli" >&2
  exit 1
fi

TMP_DRACO="$(mktemp --suffix=.glb)"
trap 'rm -f "$TMP_DRACO"' EXIT

echo "==> Draco-compressing geometry..."
gltf-transform draco "$INPUT" "$TMP_DRACO"

echo "==> KTX2-compressing textures (resized to 1024px max)..."
gltf-transform resize "$TMP_DRACO" "$TMP_DRACO" --width 1024 --height 1024
gltf-transform uastc "$TMP_DRACO" "$OUTPUT" --zstd 18

SIZE_BYTES=$(stat -c%s "$OUTPUT" 2>/dev/null || stat -f%z "$OUTPUT")

echo "==> Optimized file: $OUTPUT ($SIZE_BYTES bytes)"

if [ "$SIZE_BYTES" -gt "$MAX_BYTES" ]; then
  echo "FAIL: $OUTPUT is ${SIZE_BYTES} bytes, exceeds the 5MB (${MAX_BYTES} byte) budget." >&2
  echo "Re-run with more aggressive texture/geometry reduction before uploading. Do not" >&2
  echo "ship this file over budget — asset size is the UX quality bar for mobile AR." >&2
  exit 1
fi

echo "PASS: within 5MB budget."
echo
echo "Next steps (not automated by this script yet — see SKILL.md):"
echo "  1. Convert $OUTPUT to .usdz with your team's pinned USDZ converter."
echo "  2. Re-check the .usdz output against the same 5MB budget."
echo "  3. Upload both files to R2 with a versioned filename, e.g."
echo "     <restaurant_slug>/<item_id>/<item_slug>-v<N>.glb / .usdz"
echo "     with Cache-Control: public, max-age=31536000, immutable"
echo "  4. Update menu_items.model_glb_url / model_usdz_url via the pooled DB connection."
echo "  5. Verify on a real Android (Scene Viewer) and real iPhone (Quick Look)."
