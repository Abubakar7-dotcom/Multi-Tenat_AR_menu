import type { SectionComponentProps } from "../types";
import type { FooterInfoSettings } from "./schema";

// Contact / social / newsletter footer (PLAN.md §3 #11). The newsletter block is presentational
// for M2 (no submission backend yet); the setting exists so configs are forward-compatible.
export function FooterInfoSection({
  settings,
}: SectionComponentProps<FooterInfoSettings>) {
  const { showNewsletter, socialLinks, contactPhone, contactAddress } = settings;
  const links = socialLinks.filter((l) => l.url && l.platform);

  const hasContent =
    showNewsletter || links.length > 0 || contactPhone || contactAddress;
  if (!hasContent) return null;

  return (
    <footer
      className="flex flex-col text-sm"
      style={{
        gap: "calc(var(--spacing-unit) * 3)",
        padding: "calc(var(--spacing-unit) * 4)",
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-card)",
        color: "var(--color-text-muted)",
      }}
    >
      {showNewsletter ? (
        <div className="flex flex-col gap-2">
          <p className="font-semibold" style={{ color: "var(--color-text)" }}>
            Stay in the loop
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Your email"
              className="min-w-0 flex-1 px-3 py-2 text-sm"
              style={{
                backgroundColor: "var(--color-background)",
                color: "var(--color-text)",
                borderRadius: "var(--radius-button)",
              }}
            />
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-primary-contrast)",
                borderRadius: "var(--radius-button)",
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      ) : null}

      {contactAddress ? <p>{contactAddress}</p> : null}
      {contactPhone ? (
        <a href={`tel:${contactPhone}`} style={{ color: "var(--color-primary)" }}>
          {contactPhone}
        </a>
      ) : null}

      {links.length > 0 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {links.map((link, i) => (
            <li key={`${link.platform}-${i}`}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-primary)" }}
              >
                {link.platform}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </footer>
  );
}
