import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const ignores = {
  ignores: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/.vercel/**",
    "**/.output/**",
    "**/public/**",
    "**/scripts/**",
    "**/src/__tests__/**",
    "**/jest.setup.js",
    "**/tailwindcss.config.js"
    // "src/pages/api/articles/[slug].ts",
  ],
};

const eslintConfig = [
  ignores,
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
];

export default eslintConfig;
