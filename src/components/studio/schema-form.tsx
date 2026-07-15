"use client";

import type { JsonSchemaProperty } from "@/lib/forms/json-schema";
import type { MenuData } from "@/sections/types";
import { curatedFonts, curatedFontFamilies } from "@/lib/theme/fonts";
import { fieldLabel } from "./field-label";

interface SchemaFormProps {
  properties: Record<string, JsonSchemaProperty>;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  menuData?: MenuData;
}

// The generic settings-form renderer: given ANY of our zod object schemas (converted to JSON
// Schema via schemaToProperties) plus a current value, renders editable fields and reports
// changes back as a merged object. This one component is what makes "schema-generated settings
// forms" work for all 11 sections plus tokens/layoutShell — no per-section form code.
export function SchemaForm({ properties, value, onChange, menuData }: SchemaFormProps) {
  function setField(key: string, fieldValue: unknown) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <div className="flex flex-col gap-4">
      {Object.entries(properties).map(([key, prop]) => (
        <FieldEditor
          key={key}
          fieldKey={key}
          schema={prop}
          value={value[key]}
          onChange={(v) => setField(key, v)}
          menuData={menuData}
        />
      ))}
    </div>
  );
}

interface FieldEditorProps {
  fieldKey: string;
  schema: JsonSchemaProperty;
  value: unknown;
  onChange: (next: unknown) => void;
  menuData?: MenuData;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "rounded border border-gray-300 px-3 py-1.5 text-sm";

function FieldEditor({ fieldKey, schema, value, onChange, menuData }: FieldEditorProps) {
  const label = fieldLabel(fieldKey);

  // --- Special-cased content-source pickers (PLAN.md §3's shared content-source pattern) ---
  if (fieldKey === "categoryId" || fieldKey === "itemId") {
    const options =
      fieldKey === "categoryId" ? menuData?.categories ?? [] : menuData?.items ?? [];
    return (
      <Field label={label}>
        <select
          className={inputClass}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— none —</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (fieldKey === "categoryIds" || fieldKey === "itemIds") {
    const options =
      fieldKey === "categoryIds" ? menuData?.categories ?? [] : menuData?.items ?? [];
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <Field label={label}>
        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded border border-gray-300 p-2">
          {options.length === 0 ? (
            <span className="text-xs text-gray-400">Nothing to pick from yet.</span>
          ) : null}
          {options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={(e) => {
                  onChange(
                    e.target.checked
                      ? [...selected, o.id]
                      : selected.filter((id) => id !== o.id)
                  );
                }}
              />
              {o.name}
            </label>
          ))}
        </div>
      </Field>
    );
  }

  // --- Generic type-driven rendering ---
  if (schema.enum) {
    return (
      <Field label={label}>
        <select
          className={inputClass}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {schema.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (schema.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  }

  if (schema.type === "number" || schema.type === "integer") {
    return (
      <Field label={label}>
        <input
          type="number"
          className={inputClass}
          value={typeof value === "number" ? value : ""}
          min={schema.minimum}
          max={schema.maximum}
          step={schema.type === "integer" ? 1 : "any"}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      </Field>
    );
  }

  if (schema.type === "string") {
    const isColor = fieldKey.toLowerCase().startsWith("color");
    const isFont = fieldKey === "fontHeading" || fieldKey === "fontBody";
    const isLongText =
      /body|description/i.test(fieldKey) && !isColor && !isFont;
    const strValue = typeof value === "string" ? value : "";

    if (isFont) {
      // Curated picker (PLAN.md §4a) with a live preview line rendered in the chosen family —
      // the Studio layout loads the curated-fonts stylesheet so the preview is real. A config
      // whose stored family isn't in the curated list still shows and keeps its value (the
      // token is a free string in the schema; the list is Studio convenience, not a constraint).
      const isCustom = strValue !== "" && !curatedFontFamilies.includes(strValue);
      return (
        <Field label={label}>
          <select
            className={inputClass}
            value={isCustom ? "__custom__" : strValue}
            onChange={(e) => {
              if (e.target.value !== "__custom__") onChange(e.target.value);
            }}
          >
            {isCustom ? (
              <option value="__custom__">{strValue} (custom)</option>
            ) : null}
            {curatedFonts.map((f) => (
              <option key={f.family} value={f.family}>
                {f.family} — {f.vibe}
              </option>
            ))}
          </select>
          <span
            aria-hidden
            className="rounded border border-gray-100 bg-gray-50 px-3 py-2 text-base text-gray-800"
            style={{ fontFamily: `'${strValue}', sans-serif` }}
          >
            Chicken Karahi — Rs 1,250
          </span>
        </Field>
      );
    }

    if (isColor) {
      return (
        <Field label={label}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(strValue) ? strValue : "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-10 shrink-0"
            />
            <input
              type="text"
              className={`${inputClass} flex-1`}
              value={strValue}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </Field>
      );
    }

    if (isLongText) {
      return (
        <Field label={label}>
          <textarea
            className={inputClass}
            rows={3}
            value={strValue}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );
    }

    return (
      <Field label={label}>
        <input
          type="text"
          className={inputClass}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    );
  }

  if (schema.type === "array" && schema.items?.type === "object") {
    const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    const rowProperties = schema.items.properties ?? {};

    function updateRow(index: number, nextRow: Record<string, unknown>) {
      const next = [...rows];
      next[index] = nextRow;
      onChange(next);
    }

    function addRow() {
      const blank: Record<string, unknown> = {};
      for (const [k, prop] of Object.entries(rowProperties)) {
        blank[k] = prop.default ?? "";
      }
      onChange([...rows, blank]);
    }

    function removeRow(index: number) {
      onChange(rows.filter((_, i) => i !== index));
    }

    return (
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <div
              key={i}
              className="rounded border border-gray-200 bg-gray-50 p-3"
            >
              <SchemaForm
                properties={rowProperties}
                value={row}
                onChange={(next) => updateRow(i, next)}
                menuData={menuData}
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="mt-2 text-xs text-red-600 underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRow}
          className="self-start rounded border border-gray-300 px-3 py-1 text-xs font-medium"
        >
          + Add {label.replace(/s$/, "")}
        </button>
      </div>
    );
  }

  // Unhandled shape — every field across the 11 current section schemas + tokens/layoutShell
  // is covered above, so reaching here means a newly-added schema field doesn't fit any known
  // pattern. Render a visible notice rather than silently dropping the field from the editor
  // (a future create-section addition should be loud here, not invisible).
  return (
    <p className="text-xs text-amber-600">
      &quot;{label}&quot; ({schema.type ?? "unknown"}) has no editor for this field type yet.
    </p>
  );
}
