"use client";

import { useEffect, useState } from "react";
import { MenuRenderer } from "./menu-renderer";
import { configSchema, type RestaurantConfig } from "@/lib/config/schema";
import type { MenuData } from "@/sections/types";

interface LivePreviewRootProps {
  initialConfig: RestaurantConfig;
  restaurant: { name: string; logo_url: string | null };
  menuData: MenuData;
}

const MESSAGE_TYPE = "ar-menu-draft-config-update";

// Only mounted for /r/[slug]?mode=preview (already gated to platform_admins server-side).
// Holds the config in client state and re-renders on every postMessage from the parent Studio
// window — this is what makes editing feel instant (PLAN.md §3: "postMessage the draft config
// on every change. One renderer, zero preview drift") instead of a full page reload per edit.
export function LivePreviewRoot({
  initialConfig,
  restaurant,
  menuData,
}: LivePreviewRootProps) {
  const [config, setConfig] = useState(initialConfig);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Same-origin only — Studio and the public page are served from the same Next app, so
      // there is never a legitimate cross-origin sender.
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== MESSAGE_TYPE) return;

      const parsed = configSchema.safeParse(event.data.config);
      if (parsed.success) setConfig(parsed.data);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <MenuRenderer config={config} restaurant={restaurant} menuData={menuData} />
  );
}
