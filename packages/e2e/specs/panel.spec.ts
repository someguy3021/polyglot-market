import { expect, test, beforeAll, afterAll } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * E2E самой панели (фича 06/этап 5.1): менеджер поднимается на отдельном порту,
 * проверяются кнопки карточек (запуск/остановка vue2), просмотр логов и скачивание
 * полного лога файлом; кнопка Run setup скрыта при настроенной среде.
 */
const PANEL_PORT = 5577;
const PANEL = `http://127.0.0.1:${PANEL_PORT}`;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

let manager: ChildProcess;

beforeAll(async () => {
  manager = spawn("pnpm", ["exec", "tsx", "scripts/panel/manager.ts"], {
    cwd: ROOT,
    shell: process.platform === "win32",
    stdio: "ignore",
    env: { ...process.env, PANEL_PORT: String(PANEL_PORT) },
  });
  const deadline = Date.now() + 30_000;
  for (;;) {
    try {
      const res = await fetch(`${PANEL}/api/status`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) break;
    } catch { /* ещё поднимается */ }
    if (Date.now() > deadline) throw new Error("панель не поднялась за 30с");
    await new Promise((r) => setTimeout(r, 500));
  }
}, 60_000);

afterAll(() => {
  manager?.kill();
});

test("панель: карточки приложений и таблица портов рендерятся", async ({ page }) => {
  await page.goto(PANEL);
  await expect(page.getByRole("heading", { name: "Polyglot Market" })).toBeVisible();
  await expect(page.locator("#backend-cards .card")).toHaveCount(2); // laravel + nestjs
  await expect(page.locator("#frontend-cards .card")).toHaveCount(7); // 7 фронтов
  await expect(page.locator("#port-table tbody tr")).toHaveCount(9);
});

test("панель: запуск и остановка vue2 через кнопки карточки", async ({ page }) => {
  await page.goto(PANEL);
  const vue2card = page.locator("#frontend-cards .card", { hasText: "Vue 2 + Vite" });

  await vue2card.getByRole("button", { name: "Запустить" }).click();
  await expect(vue2card).toContainText("работает", { timeout: 60_000 });

  // логи пишутся: открываем просмотр логов
  await vue2card.getByRole("button", { name: "Логи" }).click();
  await expect(page.locator("#logs-group")).toBeVisible();
  await expect(page.locator("#log-view")).toContainText(/.+\n/, { timeout: 30_000 });

  // полный лог скачивается файлом и не пуст
  const res = await fetch(`${PANEL}/api/logs/vue2?download=1`);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-disposition")).toContain("attachment");
  expect((await res.text()).length).toBeGreaterThan(0);

  await vue2card.getByRole("button", { name: "Остановить" }).click();
  await expect(vue2card).toContainText("остановлено", { timeout: 30_000 });
});

test("панель: Run setup скрыт при настроенной среде", async ({ page }) => {
  await page.goto(PANEL);
  // на этой машине .env существует (pnpm setup выполнялся) — кнопка не нужна
  await expect(page.locator("#run-setup")).toBeHidden();
});
