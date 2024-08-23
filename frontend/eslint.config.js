import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  {
    languageOptions: { globals: {...globals.browser, ...globals.node}, },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    rules: {"unused-imports/no-unused-imports": "error"}
  },
  {
    ignores: ["public/bundle.js"],
  },
];
