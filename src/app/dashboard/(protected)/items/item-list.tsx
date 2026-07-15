"use client";

import { useState, useTransition } from "react";
import { updateItem, toggleAvailability, deleteItem } from "./actions";
import type { MenuCategory, MenuItem } from "@/sections/types";

interface ItemListProps {
  items: MenuItem[];
  categories: MenuCategory[];
}

export function ItemList({ items, categories }: ItemListProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <ItemRow key={item.id} item={item} categories={categories} />
      ))}
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">No items yet — add one below.</p>
      ) : null}
    </div>
  );
}

function ItemRow({ item, categories }: { item: MenuItem; categories: MenuCategory[] }) {
  const [isPending, startTransition] = useTransition();
  const [isAvailable, setIsAvailable] = useState(item.is_available !== false);
  const [status, setStatus] = useState<string | null>(null);
  const hasModel = Boolean(item.model_glb_url && item.model_usdz_url);

  function handleAvailabilityToggle() {
    const next = !isAvailable;
    setIsAvailable(next);
    startTransition(() => {
      toggleAvailability(item.id, next);
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${item.name}"? This can't be undone.`)) return;
    startTransition(() => {
      deleteItem(item.id);
    });
  }

  async function handleSubmit(formData: FormData) {
    setStatus(null);
    try {
      await updateItem(item.id, formData);
      setStatus("Saved.");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <div className="rounded border border-gray-200 bg-white p-4">
      <form action={handleSubmit} className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- asset host is dynamic per env.
              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <input
              name="name"
              defaultValue={item.name}
              required
              className="rounded border border-gray-300 px-2 py-1 text-sm font-medium"
            />
            <div className="flex gap-2">
              <select
                name="category_id"
                defaultValue={item.category_id}
                className="rounded border border-gray-300 px-2 py-1 text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                name="price"
                type="number"
                min={0}
                step="0.01"
                defaultValue={item.price}
                required
                className="w-24 rounded border border-gray-300 px-2 py-1 text-xs"
              />
              {hasModel ? (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  3D model
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <textarea
          name="description"
          defaultValue={item.description ?? ""}
          rows={2}
          placeholder="Description"
          className="rounded border border-gray-300 px-2 py-1 text-xs"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <span>Photo</span>
              <input name="photo" type="file" accept="image/*" className="text-xs" />
            </label>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={handleAvailabilityToggle}
              />
              Available
            </label>
          </div>
          <div className="flex items-center gap-3">
            {status ? <span className="text-xs text-gray-500">{status}</span> : null}
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs text-red-600 underline"
            >
              Delete
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
