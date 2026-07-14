"use client";

import { useState } from "react";
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
import { sectionRegistry, isSectionType, type SectionType } from "@/sections/registry";
import { schemaToProperties } from "@/lib/forms/json-schema";
import { SchemaForm } from "./schema-form";
import type { MenuData } from "@/sections/types";
import type { SectionInstance } from "@/lib/config/schema";

const sectionTypeOptions = Object.keys(sectionRegistry) as SectionType[];

interface SectionListProps {
  sections: SectionInstance[];
  onChange: (next: SectionInstance[]) => void;
  menuData: MenuData;
}

// Layer 3 editor: drag-to-reorder section instances (dnd-kit), add/remove, and expand any
// instance to edit its Layer 4 settings via the generic SchemaForm — driven entirely by that
// section's registry schema, never a hand-written per-section form.
export function SectionList({ sections, onChange, menuData }: SectionListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [addType, setAddType] = useState<SectionType>(sectionTypeOptions[0]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(sections, oldIndex, newIndex));
  }

  function addSection() {
    const entry = sectionRegistry[addType];
    const defaults = entry.schema.parse({});
    const id = `sec-${addType}-${Date.now()}`;
    onChange([...sections, { id, type: addType, settings: defaults as Record<string, unknown> }]);
  }

  function updateSection(id: string, settings: Record<string, unknown>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, settings } : s)));
  }

  function removeSection(id: string) {
    onChange(sections.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((instance) => (
            <SortableSectionRow
              key={instance.id}
              instance={instance}
              menuData={menuData}
              onChangeSettings={(settings) => updateSection(instance.id, settings)}
              onRemove={() => removeSection(instance.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {sections.length === 0 ? (
        <p className="text-sm text-gray-400">No sections yet — add one below.</p>
      ) : null}

      <div className="flex gap-2 border-t pt-3">
        <select
          className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          value={addType}
          onChange={(e) => setAddType(e.target.value as SectionType)}
        >
          {sectionTypeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addSection}
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white"
        >
          + Add section
        </button>
      </div>
    </div>
  );
}

interface SortableSectionRowProps {
  instance: SectionInstance;
  menuData: MenuData;
  onChangeSettings: (settings: Record<string, unknown>) => void;
  onRemove: () => void;
}

function SortableSectionRow({
  instance,
  menuData,
  onChangeSettings,
  onRemove,
}: SortableSectionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: instance.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const properties = isSectionType(instance.type)
    ? schemaToProperties(sectionRegistry[instance.type].schema)
    : {};

  return (
    <div ref={setNodeRef} style={style} className="rounded border border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab px-1 text-gray-400"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex-1 text-left text-sm font-medium"
        >
          {instance.type}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-600 underline"
        >
          Remove
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-gray-100 p-3">
          {isSectionType(instance.type) ? (
            <SchemaForm
              properties={properties}
              value={instance.settings}
              onChange={onChangeSettings}
              menuData={menuData}
            />
          ) : (
            <p className="text-xs text-red-600">
              Unknown section type &quot;{instance.type}&quot; — this instance is skipped when
              rendering.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
