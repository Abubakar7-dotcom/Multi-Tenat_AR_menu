"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// @google/model-viewer touches browser-only globals (`self`, customElements) at module load
// time. A plain static import would still get evaluated during SSR (a "use client" component
// is still rendered on the server for the initial HTML) and crash with "self is not defined".
// ssr: false keeps this module out of the server bundle entirely.
const ArModelViewer = dynamic(
  () => import("./ar-model-viewer").then((mod) => mod.ArModelViewer),
  { ssr: false }
);

interface MenuItemCardProps {
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  modelGlbUrl: string | null;
  modelUsdzUrl: string | null;
}

// The photo (imageUrl) always renders immediately below. The <model-viewer> instance is only
// mounted into the DOM after the diner taps "View on Table" — it does not exist on the page,
// let alone fetch its .glb/.usdz, until then. This is the lazy-load behavior Hard Rule #8
// requires, on top of model-viewer's own `reveal="interaction"` once mounted.
export function MenuItemCard({
  name,
  description,
  price,
  imageUrl,
  modelGlbUrl,
  modelUsdzUrl,
}: MenuItemCardProps) {
  const [isArOpen, setIsArOpen] = useState(false);
  const hasModel = Boolean(modelGlbUrl && modelUsdzUrl);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="aspect-square w-full bg-gray-100">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- R2 domain is dynamic per env; plain img keeps M1 simple.
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold">{name}</h3>
          <span className="whitespace-nowrap text-sm font-medium">
            Rs {price.toFixed(0)}
          </span>
        </div>
        {description ? (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        ) : null}
        {hasModel ? (
          <button
            type="button"
            onClick={() => setIsArOpen(true)}
            className="mt-3 w-full rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
          >
            View on Table
          </button>
        ) : null}
      </div>

      {isArOpen && modelGlbUrl && modelUsdzUrl ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <button
            type="button"
            onClick={() => setIsArOpen(false)}
            aria-label="Close AR view"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium"
          >
            Close
          </button>
          <div className="relative flex-1">
            <ArModelViewer
              glbUrl={modelGlbUrl}
              usdzUrl={modelUsdzUrl}
              posterUrl={imageUrl ?? ""}
              alt={name}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
