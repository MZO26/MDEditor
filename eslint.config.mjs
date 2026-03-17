import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs", "**/*.cjs", "**/*.js"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: [
      "dist/",
      "node_modules/",
      "cypress/",
      "cypress.config.ts",
      "tests/",
    ],
  },
);
