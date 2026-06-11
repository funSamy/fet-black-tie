import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "node_modules/**", "src/generated/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  eslintConfigPrettier,
  {
    rules: {
      // Ported JSX copy uses raw apostrophes/quotes throughout.
      "react/no-unescaped-entities": "off",
      // The ported components (and stock shadcn/ui ones) intentionally sync
      // state in effects (countdown, polling, media queries) — keep the
      // original behavior instead of rewriting for the React Compiler rules.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
  {
    // Error boundaries deliberately use <a href="/"> so "Go home" performs a
    // full reload out of the broken state.
    files: ["src/app/error.tsx", "src/app/global-error.tsx"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default eslintConfig;
