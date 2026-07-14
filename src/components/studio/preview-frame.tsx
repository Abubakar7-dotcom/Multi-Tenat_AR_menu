"use client";

import { useEffect, useRef } from "react";
import type { RestaurantConfig } from "@/lib/config/schema";

const MESSAGE_TYPE = "ar-menu-draft-config-update";

interface PreviewFrameProps {
  slug: string;
  config: RestaurantConfig;
}

export function PreviewFrame({ slug, config }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const configRef = useRef(config);

  function sendConfig() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      { type: MESSAGE_TYPE, config: configRef.current },
      window.location.origin
    );
  }

  // Re-send on every config change. `onLoad` (below) covers the initial sync — the iframe's
  // own listener isn't attached yet on the very first render, so a change-triggered send before
  // load would be dropped without it. configRef is updated here (an effect), never during
  // render, so onLoad — which can fire independently of this effect — always reads the latest
  // value without a stale closure.
  useEffect(() => {
    configRef.current = config;
    sendConfig();
  }, [config]);

  return (
    <iframe
      ref={iframeRef}
      src={`/r/${slug}?mode=preview`}
      onLoad={sendConfig}
      className="h-full w-full rounded border border-gray-200 bg-white"
      title="Live preview"
    />
  );
}
