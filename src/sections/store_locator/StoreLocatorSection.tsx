import type { SectionComponentProps } from "../types";
import type { StoreLocatorSettings } from "./schema";

// Branch list — address + phone, no map dependency (PLAN.md §3 #10 keeps external-API surface
// at zero). Phone numbers become tel: links.
export function StoreLocatorSection({
  settings,
}: SectionComponentProps<StoreLocatorSettings>) {
  const branches = settings.branches.filter(
    (b) => b.name || b.address || b.phone
  );
  if (branches.length === 0) return null;

  return (
    <div>
      {settings.heading ? (
        <h2
          className="mb-3 text-lg font-semibold"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {settings.heading}
        </h2>
      ) : null}
      <ul className="flex flex-col" style={{ gap: "calc(var(--spacing-unit) * 2)" }}>
        {branches.map((branch, i) => (
          <li
            key={`${branch.name}-${i}`}
            style={{
              padding: "calc(var(--spacing-unit) * 3)",
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-card)",
            }}
          >
            {branch.name ? (
              <p className="font-semibold">{branch.name}</p>
            ) : null}
            {branch.address ? (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {branch.address}
              </p>
            ) : null}
            {branch.phone ? (
              <a
                href={`tel:${branch.phone}`}
                className="text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                {branch.phone}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
