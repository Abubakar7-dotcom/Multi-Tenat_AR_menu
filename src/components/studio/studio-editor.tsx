"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { tokenSchema } from "@/lib/theme/tokens";
import { layoutShellSchema, type RestaurantConfig } from "@/lib/config/schema";
import { schemaToProperties } from "@/lib/forms/json-schema";
import { presets } from "@/lib/presets";
import { palettes } from "@/lib/presets/palettes";
import { contrastWarnings } from "@/lib/theme/contrast";
import { SchemaForm } from "./schema-form";
import { SectionList } from "./section-list";
import { PreviewFrame } from "./preview-frame";
import { saveDraft } from "@/app/studio/(protected)/actions";
import { publishRestaurant } from "@/lib/config/publish";
import type { MenuData } from "@/sections/types";

const tokenProperties = schemaToProperties(tokenSchema);
const shellProperties = schemaToProperties(layoutShellSchema);

const HISTORY_CAP = 100;
// Config changes arrive per keystroke; snapshots closer together than this are treated as one
// burst so a single Ctrl+Z undoes a typed word, not one character.
const HISTORY_COALESCE_MS = 600;

interface StudioEditorProps {
  restaurant: { id: string; slug: string; name: string; is_active: boolean };
  initialConfig: RestaurantConfig;
  menuData: MenuData;
}

type Tab = "theme" | "layout" | "sections";
type Device = "phone" | "tablet" | "desktop";

const deviceWidths: Record<Device, string> = {
  phone: "390px",
  tablet: "768px",
  desktop: "100%",
};

interface Toast {
  id: number;
  kind: "success" | "error";
  message: string;
}

export function StudioEditor({ restaurant, initialConfig, menuData }: StudioEditorProps) {
  const [config, setConfig] = useState(initialConfig);
  const [tab, setTab] = useState<Tab>("theme");
  const [device, setDevice] = useState<Device>("phone");
  const [previewKey, setPreviewKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialConfig));

  // --- Undo / redo -------------------------------------------------------------------------
  // Stacks + the authoritative current config live in refs and are mutated ONLY inside event
  // handlers (never inside setState updaters, which StrictMode double-invokes, and never read
  // during render — react-hooks/refs). canUndo/canRedo mirror the stacks as plain state for
  // the toolbar buttons.
  const configRef = useRef(initialConfig);
  const undoStack = useRef<RestaurantConfig[]>([]);
  const redoStack = useRef<RestaurantConfig[]>([]);
  const lastPushAt = useRef(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  // All edits funnel through this so history stays consistent. Typing bursts are coalesced
  // into one undo entry; discrete actions (preset/palette apply) pass forceHistory so they
  // always get their own entry even mid-burst.
  const applyChange = useCallback(
    (updater: (c: RestaurantConfig) => RestaurantConfig, forceHistory = false) => {
      const current = configRef.current;
      const next = updater(current);
      const now = Date.now();
      if (forceHistory || now - lastPushAt.current > HISTORY_COALESCE_MS) {
        undoStack.current.push(current);
        if (undoStack.current.length > HISTORY_CAP) undoStack.current.shift();
        lastPushAt.current = now;
      }
      redoStack.current = [];
      configRef.current = next;
      setConfig(next);
      syncHistoryFlags();
    },
    [syncHistoryFlags]
  );

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push(configRef.current);
    // Force the next edit to start a fresh history entry.
    lastPushAt.current = 0;
    configRef.current = prev;
    setConfig(prev);
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(configRef.current);
    lastPushAt.current = 0;
    configRef.current = next;
    setConfig(next);
    syncHistoryFlags();
  }, [syncHistoryFlags]);

  // --- Dirty state -------------------------------------------------------------------------
  const isDirty = JSON.stringify(config) !== savedSnapshot;

  useEffect(() => {
    if (!isDirty) return;
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // --- Toasts ------------------------------------------------------------------------------
  const pushToast = useCallback((kind: Toast["kind"], message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  // --- Save / publish ----------------------------------------------------------------------
  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        await saveDraft(restaurant.id, config);
        setSavedSnapshot(JSON.stringify(config));
        pushToast("success", "Draft saved.");
      } catch (err) {
        pushToast("error", err instanceof Error ? err.message : "Failed to save draft.");
      }
    });
  }, [config, restaurant.id, pushToast]);

  function handlePublish() {
    startTransition(async () => {
      try {
        await saveDraft(restaurant.id, config); // publish always publishes the latest edits
        await publishRestaurant(restaurant.id);
        setSavedSnapshot(JSON.stringify(config));
        pushToast("success", "Published — live menu updated.");
      } catch (err) {
        pushToast("error", err instanceof Error ? err.message : "Failed to publish.");
      }
    });
  }

  // --- Keyboard shortcuts ------------------------------------------------------------------
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === "y") {
        e.preventDefault();
        redo();
      } else if (key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, handleSave]);

  function applyPreset(key: string) {
    const preset = presets.find((p) => p.key === key);
    if (!preset) return;
    applyChange(() => preset.config, true);
    pushToast("success", `Preset "${preset.label}" applied — Ctrl+Z to undo.`);
  }

  function applyPalette(key: string) {
    const palette = palettes.find((p) => p.key === key);
    if (!palette) return;
    applyChange((c) => ({ ...c, tokens: { ...c.tokens, ...palette.colors } }), true);
  }

  const warnings = tab === "theme" ? contrastWarnings(config.tokens) : [];

  return (
    <div className="flex flex-col lg:h-[calc(100vh-49px)] lg:flex-row">
      {/* ------------------------------- Left panel ------------------------------- */}
      <div className="flex w-full shrink-0 flex-col overflow-y-auto border-b border-gray-200 lg:w-[420px] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h1 className="flex items-center gap-2 text-sm font-bold">
              {restaurant.name}
              {isDirty ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                  Unsaved changes
                </span>
              ) : null}
            </h1>
            <span className="text-xs text-gray-500">/r/{restaurant.slug}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              ↩
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
              title="Redo (Ctrl+Shift+Z)"
              aria-label="Redo"
            >
              ↪
            </button>
            <Link href={`/studio/${restaurant.id}/qr`} className="text-xs underline">
              QR code
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-100 p-4">
          <span className="text-xs font-medium text-gray-700">Start from a preset</span>
          <div className="grid grid-cols-1 gap-2">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => applyPreset(p.key)}
                className="flex items-center justify-between rounded border border-gray-200 px-3 py-2 text-left hover:border-gray-400 hover:bg-gray-50"
              >
                <span className="text-xs font-medium">{p.label}</span>
                <span className="flex gap-1">
                  {[
                    p.config.tokens.colorPrimary,
                    p.config.tokens.colorAccent,
                    p.config.tokens.colorSurface,
                    p.config.tokens.colorText,
                  ].map((color, i) => (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
              </button>
            ))}
          </div>
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
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-gray-700">Quick palettes</span>
                <div className="grid grid-cols-2 gap-2">
                  {palettes.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPalette(p.key)}
                      className="flex flex-col gap-1.5 rounded border border-gray-200 p-2 text-left hover:border-gray-400 hover:bg-gray-50"
                      title={`Apply ${p.label} colors`}
                    >
                      <span className="flex gap-1">
                        {[
                          p.colors.colorPrimary,
                          p.colors.colorAccent,
                          p.colors.colorBackground,
                          p.colors.colorSurface,
                          p.colors.colorText,
                        ].map((color, i) => (
                          <span
                            key={i}
                            className="h-3.5 w-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </span>
                      <span className="text-[11px] font-medium text-gray-700">{p.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400">
                  Applies colors only — fonts, shapes and sections stay as they are.
                </p>
              </div>

              {warnings.length > 0 ? (
                <div className="flex flex-col gap-1 rounded border border-amber-200 bg-amber-50 p-2">
                  {warnings.map((w) => (
                    <p key={w.pair} className="text-[11px] text-amber-700">
                      ⚠ {w.pair}: contrast {w.ratio}:1 — below the 4.5:1 readability minimum.
                    </p>
                  ))}
                </div>
              ) : null}

              <SchemaForm
                properties={tokenProperties}
                value={config.tokens}
                onChange={(tokens) =>
                  applyChange((c) => ({
                    ...c,
                    tokens: tokens as RestaurantConfig["tokens"],
                  }))
                }
              />
            </div>
          ) : null}
          {tab === "layout" ? (
            <SchemaForm
              properties={shellProperties}
              value={config.layoutShell}
              onChange={(layoutShell) =>
                applyChange((c) => ({
                  ...c,
                  layoutShell: layoutShell as RestaurantConfig["layoutShell"],
                }))
              }
            />
          ) : null}
          {tab === "sections" ? (
            <SectionList
              sections={config.sections}
              onChange={(sections) => applyChange((c) => ({ ...c, sections }))}
              menuData={menuData}
            />
          ) : null}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-gray-100 bg-white p-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
            title="Ctrl+S"
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

      {/* ------------------------------- Preview pane ------------------------------- */}
      <div className="flex min-h-[70vh] flex-1 flex-col bg-gray-50 lg:min-h-0">
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-2">
          <div className="flex gap-1">
            {(["phone", "tablet", "desktop"] as Device[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                className={`rounded px-2.5 py-1 text-xs font-medium capitalize ${
                  device === d ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {d === "phone" ? "📱" : d === "tablet" ? "💻" : "🖥"} {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
              title="Reload preview"
            >
              ⟳ Refresh
            </button>
            <a
              href={`/r/${restaurant.slug}?mode=preview`}
              target="_blank"
              rel="noreferrer"
              className="rounded px-2 py-1 text-xs text-gray-500 underline hover:bg-gray-100"
            >
              Open in new tab
            </a>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div
            className="mx-auto h-full min-h-[60vh] transition-all duration-300"
            style={{ width: deviceWidths[device], maxWidth: "100%" }}
          >
            <PreviewFrame key={previewKey} slug={restaurant.slug} config={config} />
          </div>
        </div>
      </div>

      {/* ------------------------------- Toasts ------------------------------- */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded px-4 py-2 text-sm font-medium text-white shadow-lg ${
              t.kind === "success" ? "bg-gray-900" : "bg-red-600"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
