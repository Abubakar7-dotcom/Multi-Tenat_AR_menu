import type { DetailedHTMLProps, HTMLAttributes } from "react";

// <model-viewer> is a custom element (@google/model-viewer), not a React component.
// This declares its allowed JSX attributes so TSX can render it directly.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          src?: string;
          "ios-src"?: string;
          poster?: string;
          alt?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "camera-controls"?: boolean;
          reveal?: "auto" | "interaction" | "manual";
          loading?: "auto" | "lazy" | "eager";
        },
        HTMLElement
      >;
    }
  }
}

export {};
