// import antfu from "@antfu/eslint-config";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(tseslint.configs.recommended, {
  rules: {
    "no-console": ["warn"],
    "antfu/no-top-level-await": ["off"],
    "node/prefer-global/process": ["off"],
    "node/no-process-env": ["off"],
    "perfectionist/sort-imports": [
      "error",
      {
        tsconfigRootDir: ".",
      },
    ],
    "unicorn/filename-case": [
      "error",
      {
        case: "kebabCase",
        ignore: ["README.md"],
      },
    ],
  },
});
