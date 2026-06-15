import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// ESLint 10 + Next 16. eslint-config-next@16 ships a NATIVE flat-config array
// (its plugins are objects, not legacy string names), so we spread it directly.
// Bridging it through FlatCompat — as older Next scaffolds did — feeds a flat
// config to the legacy eslintrc validator and crashes ("Converting circular
// structure to JSON" on the react plugin object).
const eslintConfig = [
  ...nextCoreWebVitals,
  {
    // eslint-plugin-react-hooks@7 ships the new "React Compiler" rules as errors
    // via next/core-web-vitals. This codebase predates them, so they're set to
    // "warn" — still surfaced and addressable incrementally, but not blocking
    // `npm run lint`. New code should still aim to satisfy them.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/refs": "warn",
    },
  },
  { ignores: [".next/**", "node_modules/**", "public/**", "prisma/generated/**"] },
];

export default eslintConfig;
