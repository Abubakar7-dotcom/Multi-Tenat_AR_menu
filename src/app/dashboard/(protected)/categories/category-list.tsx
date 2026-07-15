"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { renameCategory, deleteCategory, reorderCategories } from "./actions";
import type { MenuCategory } from "@/sections/types";

interface CategoryListProps {
  categories: MenuCategory[];
}

export function CategoryList({ categories: initial }: CategoryListProps) {
  const [categories, setCategories] = useState(initial);
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(categories, oldIndex, newIndex);
    setCategories(next);
    startTransition(() => {
      reorderCategories(next.map((c) => c.id));
    });
  }

  function handleRename(id: string, name: string) {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
    startTransition(() => {
      renameCategory(id, name);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this category? Items in it are NOT deleted, but will need reassigning.")) {
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
    startTransition(() => {
      deleteCategory(id);
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <SortableCategoryRow
              key={category.id}
              category={category}
              onRename={(name) => handleRename(category.id, name)}
              onDelete={() => handleDelete(category.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCategoryRow({
  category,
  onRename,
  onDelete,
}: {
  category: MenuCategory;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab px-1 text-gray-400"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <input
        defaultValue={category.name}
        onBlur={(e) => {
          if (e.target.value.trim() && e.target.value !== category.name) {
            onRename(e.target.value.trim());
          }
        }}
        className="flex-1 rounded border border-transparent px-2 py-1 text-sm focus:border-gray-300"
      />
      <button type="button" onClick={onDelete} className="text-xs text-red-600 underline">
        Delete
      </button>
    </div>
  );
}
