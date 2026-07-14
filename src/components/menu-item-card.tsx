"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { MenuItem } from "@/sections/types";

// @google/model-viewer touches browser-only globals (`self`, customElements) at module load
// time. A plain static import would still be evaluated during SSR (a "use client" component is
// still rendered on the server for initial HTML) and crash with "self is not defined".
// ssr: false keeps this module out of the server bundle entirely.
const ArModelViewer = dynamic(
  () => import("./ar-model-viewer").then((mod) => mod.ArModelViewer),
  { ssr: false }
);

interface MenuItemCardProps {
  item: MenuItem;
  imagePosition?: "top" | "left";
  description?: "none" | "short" | "full";
  showBadge?: boolean;
  ctaLabel?: string;
}

// Shared presentational card for a single menu item, used by menu_grid, deals_carousel,
// bundle_comparison and item_spotlight. Styled EXCLUSIVELY through CSS variables (Hard Rule
// #5) — no hardcoded brand colors or fonts. The photo renders immediately; the <model-viewer>
// (and its .glb/.usdz bytes) only mounts after the diner taps "View on Table" (Hard Rule #8).
export function MenuItemCard({
  item,
  imagePosition = "top",
  description = "short",
  showBadge = true,
  ctaLabel = "View on Table",
}: MenuItemCardProps) {
  const [isArOpen, setIsArOpen] = useState(false);
  const hasModel = Boolean(item.model_glb_url && item.model_usdz_url);
  const isRow = imagePosition === "left";

  return (
    <div
      className={isRow ? "flex overflow-hidden" : "overflow-hidden"}
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className={`relative shrink-0 bg-black/5 ${isRow ? "w-28" : "aspect-square w-full"}`}
      >
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- asset host is dynamic per env.
          <img
            src={item.image_url}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : null}
        {showBadge && item.badge_text ? (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-accent-contrast)",
            }}
          >
            {item.badge_text}
          </span>
        ) : null}
      </div>

      <div
        className="flex flex-1 flex-col"
        style={{ padding: "calc(var(--spacing-unit) * 3)" }}
      >
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {item.name}
          </h3>
          <span className="whitespace-nowrap text-sm font-medium">
            Rs {item.price.toFixed(0)}
          </span>
        </div>

        {description !== "none" && item.description ? (
          <p
            className={`mt-1 text-sm ${description === "short" ? "line-clamp-2" : ""}`}
            style={{ color: "var(--color-text-muted)" }}
          >
            {item.description}
          </p>
        ) : null}

        {hasModel ? (
          <button
            type="button"
            onClick={() => setIsArOpen(true)}
            className="mt-3 w-full px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-contrast)",
              borderRadius: "var(--radius-button)",
            }}
          >
            {ctaLabel}
          </button>
        ) : null}
      </div>

      {isArOpen && item.model_glb_url && item.model_usdz_url ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <button
            type="button"
            onClick={() => setIsArOpen(false)}
            aria-label="Close AR view"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-black"
          >
            Close
          </button>
          <div className="relative flex-1">
            <ArModelViewer
              glbUrl={item.model_glb_url}
              usdzUrl={item.model_usdz_url}
              posterUrl={item.image_url ?? ""}
              alt={item.name}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
