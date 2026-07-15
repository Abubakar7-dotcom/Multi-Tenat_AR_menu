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
import { sectionMeta, sectionLabel } from "./section-meta";
import type { MenuData } from "@/sections/types";
import type { SectionInstance } from "@/lib/config/schema";

const sectionTypeOptions = Object.keys(sectionRegistry) as SectionType[];

// Module scope: instance ids only need uniqueness within one restaurant's config; timestamp +
// counter keeps them readable in the JSON (which admins do occasionally eyeball in the DB).
let idCounter = 0;
function newSectionId(type: string): string {
  idCounter += 1;
  return `sec-${type}-${Date.now().toString(36)}${idCounter}`;
}

interface SectionListProps {
  sections: SectionInstance[];
  onChange: (next: SectionInstance[]) => void;
  menuData: MenuData;
}

// Layer 3 editor: drag-to-reorder section instances (dnd-kit), add via a visual library of
// section cards (Shopify-editor pattern), duplicate, hide/show without losing settings, and
// expand any instance to edit its Layer 4 settings via the generic SchemaForm.
export function SectionList({ sections, onChange, menuData }: SectionListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [libraryOpen, setLibraryOpen] = useState(false);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(sections, oldIndex, newIndex));
  }

  function addSection(type: SectionType) {
    const entry = sectionRegistry[type];
    const defaults = entry.schema.parse({});
    const id = newSectionId(type);
    onChange([
      ...sections,
      { id, type, settings: defaults as Record<string, unknown>, hidden: false },
    ]);
    setLibraryOpen(false);
  }

  function updateSection(id: string, patch: Partial<SectionInstance>) {
    onChange(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function duplicateSection(id: string) {
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) return;
    const source = sections[index];
    const copy: SectionInstance = {
      ...source,
      id: newSectionId(source.type),
      settings: JSON.parse(JSON.stringify(source.settings)),
    };
    const next = [...sections];
    next.splice(index + 1, 0, copy);
    onChange(next);
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
              onChangeSettings={(settings) => updateSection(instance.id, { settings })}
              onToggleHidden={() =>
                updateSection(instance.id, { hidden: !instance.hidden })
              }
              onDuplicate={() => duplicateSection(instance.id)}
              onRemove={() => removeSection(instance.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {sections.length === 0 ? (
        <p className="text-sm text-gray-400">No sections yet — add one from the library below.</p>
      ) : null}

      <div className="border-t pt-3">
        <button
          type="button"
          onClick={() => setLibraryOpen((o) => !o)}
          className="w-full rounded bg-black px-3 py-2 text-sm font-medium text-white"
        >
          {libraryOpen ? "Close library" : "+ Add section"}
        </button>

        {libraryOpen ? (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {sectionTypeOptions.map((type) => {
              const meta = sectionMeta[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addSection(type)}
                  className="flex items-start gap-3 rounded border border-gray-200 p-3 text-left hover:border-gray-400 hover:bg-gray-50"
                >
                  <span className="text-xl leading-none">{meta.icon}</span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{meta.label}</span>
                    <span className="text-xs text-gray-500">{meta.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface SortableSectionRowProps {
  instance: SectionInstance;
  menuData: MenuData;
  onChangeSettings: (settings: Record<string, unknown>) => void;
  onToggleHidden: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function SortableSectionRow({
  instance,
  menuData,
  onChangeSettings,
  onToggleHidden,
  onDuplicate,
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

  const known = isSectionType(instance.type);
  const properties = known
    ? schemaToProperties(sectionRegistry[instance.type as SectionType].schema)
    : {};
  const icon = known ? sectionMeta[instance.type as SectionType].icon : "❓";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded border bg-white ${
        instance.hidden ? "border-dashed border-gray-300" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-1.5 px-2 py-2">
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
          className={`flex flex-1 items-center gap-2 text-left text-sm font-medium ${
            instance.hidden ? "text-gray-400" : ""
          }`}
        >
          <span aria-hidden>{icon}</span>
          {sectionLabel(instance.type)}
          {instance.hidden ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              hidden
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={onToggleHidden}
          className="rounded px-1.5 py-1 text-sm text-gray-500 hover:bg-gray-100"
          aria-label={instance.hidden ? "Show section" : "Hide section"}
          title={instance.hidden ? "Show section" : "Hide section"}
        >
          {instance.hidden ? "🙈" : "👁"}
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="rounded px-1.5 py-1 text-sm text-gray-500 hover:bg-gray-100"
          aria-label="Duplicate section"
          title="Duplicate section"
        >
          ⧉
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-1.5 py-1 text-sm text-red-500 hover:bg-red-50"
          aria-label="Remove section"
          title="Remove section"
        >
          ✕
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-gray-100 p-3">
          {known ? (
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
