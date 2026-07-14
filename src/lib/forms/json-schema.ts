import { z, type ZodType } from "zod";

// Minimal subset of JSON Schema we consume for form generation — not the full spec, just what
// zod's toJSONSchema() emits for the shapes our section/token/shell schemas use.
export interface JsonSchemaProperty {
  type?: "string" | "number" | "integer" | "boolean" | "array" | "object";
  enum?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
}

// Converts any of our zod object schemas (section settings, tokens, layout shell) into the
// property map SchemaForm renders from. This is the "schema-generated settings forms"
// mechanism: one generic form renderer + zod's own official introspection API, instead of
// hand-writing a form per section.
export function schemaToProperties(
  schema: ZodType
): Record<string, JsonSchemaProperty> {
  const json = z.toJSONSchema(schema) as { properties?: Record<string, JsonSchemaProperty> };
  return json.properties ?? {};
}
