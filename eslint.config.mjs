import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// ESLint 10 + Next 16 require flat config; bridge the legacy
// "next/core-web-vitals" shareable config via FlatCompat.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  { ignores: [".next/**", "node_modules/**", "public/**", "prisma/generated/**"] },
];

export default eslintConfig;
