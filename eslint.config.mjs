import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // Prototype copy uses apostrophes/quotes in plain JSX text freely.
      "react/no-unescaped-entities": "off",
      // MapboxMap's init effect sets ready/error state while syncing with the
      // mapbox-gl instance (an external system) — an accepted pattern here.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Archive of the original Babel-standalone mockups — reference only, not shipped.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "content/**",
  ]),
]);

export default eslintConfig;
