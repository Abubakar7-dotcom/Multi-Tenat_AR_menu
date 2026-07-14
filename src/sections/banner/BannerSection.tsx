"use client";

import { useState } from "react";
import type { SectionComponentProps } from "../types";
import type { BannerSettings } from "./schema";

// Generalized promo / trust / app-download strip (PLAN.md §3 #4). Client component only so
// `dismissible` can hide it; it takes serializable settings and never fetches data. Each
// variant's colors come from token CSS variables via a fixed map — never hardcoded, never a
// runtime Tailwind class (Hard Rules #2, #5).
const variantColors: Record<
  BannerSettings["variant"],
  { backgroundColor: string; color: string }
> = {
  promo: {
    backgroundColor: "var(--color-accent)",
    color: "var(--color-accent-contrast)",
  },
  app_download: {
    backgroundColor: "var(--color-primary)",
    color: "var(--color-primary-contrast)",
  },
  trust: {
    backgroundColor: "var(--color-surface)",
    color: "var(--color-text)",
  },
};

export function BannerSection({
  settings,
}: SectionComponentProps<BannerSettings>) {
  const [dismissed, setDismissed] = useState(false);
  const { variant, imageUrl, heading, body, ctaLabel, ctaUrl, dismissible } =
    settings;

  if (dismissed) return null;
  if (!imageUrl && !heading && !body && !ctaLabel) return null;

  return (
    <div
      className="relative flex items-center gap-3"
      style={{
        ...variantColors[variant],
        padding: "calc(var(--spacing-unit) * 3)",
        borderRadius: "var(--radius-card)",
      }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- asset host is dynamic per env.
        <img
          src={imageUrl}
          alt=""
          className="h-14 w-14 shrink-0 rounded object-cover"
        />
      ) : null}

      <div className="flex-1">
        {heading ? (
          <p
            className="font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {heading}
          </p>
        ) : null}
        {body ? <p className="text-sm opacity-90">{body}</p> : null}
      </div>

      {ctaLabel && ctaUrl ? (
        <a
          href={ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: "var(--color-background)",
            color: "var(--color-text)",
            borderRadius: "var(--radius-button)",
          }}
        >
          {ctaLabel}
        </a>
      ) : null}

      {dismissible ? (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute right-1 top-1 px-2 text-lg leading-none opacity-70"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
