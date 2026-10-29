// @ts-check
import eslint from "@eslint/js";

export default [
  eslint.configs.recommended,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/vendor/**",
      ".cache/**", // артефакты матричного теста фабрики (extract-matrix) — не исходники
      "packages/api-client/**",
      "backend/**",
      "frontend/**",
      "panel/**",
      "docs/**",
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        URL: "readonly",
        Buffer: "readonly",
      setTimeout: "readonly",
      clearTimeout: "readonly",
      AbortController: "readonly",
      AbortSignal: "readonly", // Node 17+ глобал (fetch-таймауты в скриптах)
      structuredClone: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-constant-condition": "warn",
    },
  },
];
