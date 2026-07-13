"use client";

import "@google/model-viewer";

interface ArModelViewerProps {
  glbUrl: string;
  usdzUrl: string;
  posterUrl: string;
  alt: string;
}

// Photos render immediately elsewhere on the page (see MenuItemCard); this component is only
// mounted once the diner taps "View on Table". `reveal="interaction"` still means the actual
// .glb/.usdz bytes aren't fetched until the user interacts with the poster inside model-viewer
// itself, so nothing here preloads a model (Hard Rule #8).
export function ArModelViewer({ glbUrl, usdzUrl, posterUrl, alt }: ArModelViewerProps) {
  return (
    <model-viewer
      src={glbUrl}
      ios-src={usdzUrl}
      poster={posterUrl}
      alt={alt}
      ar
      ar-modes="scene-viewer quick-look"
      camera-controls
      reveal="interaction"
      style={{ width: "100%", height: "100%", backgroundColor: "#f2f2f2" }}
    >
      <button
        slot="ar-button"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white shadow-lg"
      >
        View on Table
      </button>
    </model-viewer>
  );
}
