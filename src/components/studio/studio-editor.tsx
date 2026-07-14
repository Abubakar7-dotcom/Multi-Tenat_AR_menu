"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { tokenSchema } from "@/lib/theme/tokens";
import { layoutShellSchema, type RestaurantConfig } from "@/lib/config/schema";
import { schemaToProperties } from "@/lib/forms/json-schema";
import { presets } from "@/lib/presets";
import { SchemaForm } from "./schema-form";
import { SectionList } from "./section-list";
import { PreviewFrame } from "./preview-frame";
import { saveDraft } from "@/app/studio/(protected)/actions";
import { publishRestaurant } from "@/lib/config/publish";
import type { MenuData } from "@/sections/types";

const tokenProperties = schemaToProperties(tokenSchema);
const shellProperties = schemaToProperties(layoutShellSchema);

interface StudioEditorProps {
  restaurant: { id: string; slug: string; name: string; is_active: boolean };
  initialConfig: RestaurantConfig;
  menuData: MenuData;
}

type Tab = "theme" | "layout" | "sections";

export function StudioEditor({ restaurant, initialConfig, menuData }: StudioEditorProps) {
  const [config, setConfig] = useState(initialConfig);
  const [tab, setTab] = useState<Tab>("theme");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function handleSave() {
    setStatus(null);
    startTransition(async () => {
      try {
        await saveDraft(restaurant.id, config);
        setStatus("Draft saved.");
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Failed to save draft.");
      }
    });
  }

  function handlePublish() {
    setStatus(null);
    startTransition(async () => {
      try {
        await saveDraft(restaurant.id, config); // publish always publishes the latest edits
        await publishRestaurant(restaurant.id);
        setStatus("Published.");
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Failed to publish.");
      }
    });
  }

  function applyPreset(key: string) {
    const preset = presets.find((p) => p.key === key);
    if (preset) setConfig(preset.config);
  }

  return (
    <div className="flex h-[calc(100vh-49px)]">
      <div className="flex w-[420px] shrink-0 flex-col overflow-y-auto border-r border-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h1 className="text-sm font-bold">{restaurant.name}</h1>
            <span className="text-xs text-gray-500">/r/{restaurant.slug}</span>
          </div>
          <Link
            href={`/studio/${restaurant.id}/qr`}
            className="text-xs underline"
          >
            QR code
          </Link>
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-100 p-4">
          <label className="text-xs font-medium text-gray-700">Start from a preset</label>
          <select
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            onChange={(e) => e.target.value && applyPreset(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Choose a preset…
            </option>
            {presets.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex border-b border-gray-100">
          {(["theme", "layout", "sections"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium capitalize ${
                tab === t ? "border-b-2 border-black" : "text-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 p-4">
          {tab === "theme" ? (
            <SchemaForm
              properties={tokenProperties}
              value={config.tokens}
              onChange={(tokens) =>
                setConfig((c) => ({ ...c, tokens: tokens as RestaurantConfig["tokens"] }))
              }
            />
          ) : null}
          {tab === "layout" ? (
            <SchemaForm
              properties={shellProperties}
              value={config.layoutShell}
              onChange={(layoutShell) =>
                setConfig((c) => ({
                  ...c,
                  layoutShell: layoutShell as RestaurantConfig["layoutShell"],
                }))
              }
            />
          ) : null}
          {tab === "sections" ? (
            <SectionList
              sections={config.sections}
              onChange={(sections) => setConfig((c) => ({ ...c, sections }))}
              menuData={menuData}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 p-4">
          {status ? <p className="text-xs text-gray-600">{status}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending}
              className="flex-1 rounded bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-4">
        <PreviewFrame slug={restaurant.slug} config={config} />
      </div>
    </div>
  );
}
