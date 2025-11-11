import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "dist-ssr/**",
      "*.local",
      ".next/**",
      "out/**",
      "build/**",
    ],
  },
];

export default eslintConfig;
