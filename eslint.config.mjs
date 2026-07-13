// eslint-config-next ships native flat-config arrays (not legacy shareable configs), so we
// spread them directly rather than going through @eslint/eslintrc's FlatCompat -- routing an
// already-flat config through FlatCompat's legacy schema validator crashes with "Converting
// circular structure to JSON" because it tries to validate flat-config plugin objects (which
// self-reference via `.configs`) against the old-style config schema.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
