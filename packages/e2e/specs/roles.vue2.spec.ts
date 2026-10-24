import { expect, test } from "@playwright/test";
import { apiCreateBuyerOrder } from "./_api";

/**
 * Роль-сценарии на Vue 2.7-фронте (Vuetify 2): у кабинета продавца есть форма
 * создания (v-dialog + v-select с выскакивающим меню), админ меняет статус
 * через v-select в строке заказа.
 */
const productTitle = `E2E Vue2 Product ${Date.now()}`;

async function login(page: any, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((u: URL) => !u.pathname.includes("login"), { timeout: 15_000 });
}

test("vue2 seller: создаёт товар (v-dialog) и отправляет на модерацию", async ({ page }) => {
  await login(page, "seller@demo.dev");
  await page.goto("/seller/products");
  await expect(page.getByText("Мои товары").first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Новый товар" }).click();
  const dialog = page.locator(".v-dialog--active");
  await dialog.getByLabel("Название").fill(productTitle);
  await dialog.getByLabel("Описание").fill("Создано E2E роль-сценарием продавца (vue2)");
  await dialog.getByLabel("Цена $").fill("15.30");
  await dialog.getByLabel("Остаток").fill("25");
  await dialog.locator(".v-select").click();
  await page.locator(".v-menu__content .v-list-item:visible").nth(1).click();
  await dialog.getByRole("button", { name: "Создать черновик" }).click();

  const row = page.locator("tr", { hasText: productTitle });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.getByRole("button", { name: "На модерацию" }).click();
  await expect(row).toContainText("на модерации", { timeout: 10_000 });
});

test("vue2 moderator: одобряет товар продавца", async ({ page }) => {
  await login(page, "moderator@demo.dev");
  await page.goto("/moderator/queue");
  const row = page.locator("tr", { hasText: productTitle });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Одобрить" }).click();

  await expect(page.locator("tr", { hasText: productTitle })).toHaveCount(0, { timeout: 10_000 });
  await page.goto("/");
  await page.getByLabel("Поиск по названию").fill(productTitle);
  await page.waitForTimeout(600); // дебаунс поиска
  await expect(page.locator(".v-card", { hasText: productTitle }).first()).toBeVisible({ timeout: 10_000 });
});

test("vue2 admin: меняет статус свежего заказа new → paid", async ({ page }) => {
  const order = await apiCreateBuyerOrder();
  expect(order.status).toBe("new");

  await login(page, "admin@demo.dev");
  await page.goto("/admin/orders");
  const row = page.locator("tr", { hasText: order.id.slice(0, 8) }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });

  await row.locator(".v-select").click();
  await page.locator(".v-menu__content .v-list-item:visible", { hasText: "оплачен" }).click();
  await expect(page.locator("tr", { hasText: order.id.slice(0, 8) }).first()).toContainText("оплачен", { timeout: 10_000 });
});
