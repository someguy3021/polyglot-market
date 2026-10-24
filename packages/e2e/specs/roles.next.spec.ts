import { expect, test } from "@playwright/test";
import { apiCreateBuyerOrder, apiCreateDraftProduct, apiLogin } from "./_api";

/**
 * Роль-сценарии на Next-фронте (App Router). Шапка статична — кабинет открываем
 * прямым URL; черновик — через контракт (формы создания нет), UI — модерация и админ.
 */
const productTitle = `E2E Next Product ${Date.now()}`;

// dev-режим next компилирует каждый маршрут при первом заходе — 60с по умолчанию мало
test.setTimeout(180_000);

async function login(page: any, email: string) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Пароль").fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((u: URL) => !u.pathname.includes("login"), { timeout: 15_000 });
}

test("next seller: черновик из контракта отправляется на модерацию", async ({ page }) => {
  const token = await apiLogin("seller@demo.dev");
  await apiCreateDraftProduct(token, productTitle);

  await login(page, "seller@demo.dev");
  await page.goto("/seller/products");
  const row = page.locator("tr", { hasText: productTitle }).first();
  await expect(row).toBeVisible({ timeout: 45_000 });
  await row.getByRole("button", { name: "На модерацию" }).click();
  await expect(row).toContainText("на модерации", { timeout: 10_000 });
});

test("next moderator: одобряет товар продавца", async ({ page }) => {
  await login(page, "moderator@demo.dev");
  await page.goto("/moderator/queue");
  const row = page.locator("tr", { hasText: productTitle }).first();
  await expect(row).toBeVisible({ timeout: 45_000 });
  await row.getByRole("button", { name: "Одобрить" }).click();

  await expect(page.locator("tr", { hasText: productTitle })).toHaveCount(0, { timeout: 10_000 });
  await page.goto("/");
  await page.getByPlaceholder("Поиск по названию").fill(productTitle);
  await page.getByRole("button", { name: "Применить" }).click();
  await expect(page.locator(".card", { hasText: productTitle }).first()).toBeVisible({ timeout: 45_000 });
});

test("next admin: меняет статус свежего заказа new → paid", async ({ page }) => {
  const order = await apiCreateBuyerOrder();
  expect(order.status).toBe("new");

  await login(page, "admin@demo.dev");
  await page.goto("/admin/orders");
  const row = page.locator("tr", { hasText: order.id.slice(0, 8) }).first();
  await expect(row).toBeVisible({ timeout: 45_000 });
  await row.locator("select").selectOption("paid");
  await expect(page.locator("tr", { hasText: order.id.slice(0, 8) }).first()).toContainText("оплачен", { timeout: 10_000 });
});
