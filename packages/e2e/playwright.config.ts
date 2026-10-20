import { defineConfig } from "@playwright/test";

// Пары задаётся переменными: E2E_FRONT_URL (фронт), E2E_TAGS — сценарии.
// Пример: E2E_FRONT_URL=http://127.0.0.1:9000 pnpm test
export default defineConfig({
  testDir: "./specs",
  timeout: 60_000,
  retries: 1,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_FRONT_URL ?? "http://127.0.0.1:9000",
    // На машинах с ограниченной сетью (cdn.playwright.dev блокирован) используем системный Chrome
    channel: process.env.E2E_CHANNEL ?? "chrome",
    trace: "retain-on-failure",
  },
});
