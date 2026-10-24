import { expect, test } from "@playwright/test";
import { apiCreateBuyerOrder } from "./_api";

/**
 * Роль-сценарии на React-фронте (MUI): продавец создаёт товар в диалоге,
 * модератор одобряет из очереди, админ меняет статус заказа (MUI Select).
 */
const productTitle = `E2E React Product ${Date.now()}`;

async function login(page: any, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL((u: URL) => !u.pathname.includes("login"), { timeout: 15_000 });
}

test("react seller: создаёт товар и отправляет на модерацию", async ({ page }) => {
  await login(page, "seller@demo.dev");
  await page.goto("/seller/products");
  await expect(page.getByRole("heading", { name: "Мои товары" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "Новый товар" }).click();
  await page.getByLabel("Название").fill(productTitle);
  await page.getByLabel("Описание").fill("Создано E2E роль-сценарием продавца (react)");
  await page.getByLabel("Цена $").fill("14.20");
  await page.getByLabel("Остаток").fill("25");
  await page.getByLabel("Категория").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Создать черновик" }).click();

  const row = page.locator("tr", { hasText: productTitle }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.getByRole("button", { name: "На модерацию" }).click();
  await expect(row).toContainText("на модерации", { timeout: 10_000 });
});

test("react moderator: одобряет товар продавца", async ({ page }) => {
  await login(page, "moderator@demo.dev");
  await page.goto("/moderator/queue");
  const row = page.locator("tr", { hasText: productTitle }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("button", { name: "Одобрить" }).click();

  await expect(page.locator("tr", { hasText: productTitle })).toHaveCount(0, { timeout: 10_000 });
  await page.goto("/");
  await page.getByLabel("Поиск по названию").fill(productTitle);
  await page.keyboard.press("Enter");
  await expect(page.locator(".MuiCard-root", { hasText: productTitle }).first()).toBeVisible({ timeout: 10_000 });
});

test("react admin: меняет статус свежего заказа new → paid", async ({ page }) => {
  const order = await apiCreateBuyerOrder();
  expect(order.status).toBe("new");

  await login(page, "admin@demo.dev");
  await page.goto("/admin/orders");
  const row = page.locator("tr", { hasText: order.id.slice(0, 8) }).first();
  await expect(row).toBeVisible({ timeout: 15_000 });

  await row.getByRole("combobox").click();
  await page.getByRole("option", { name: "оплачен" }).click();
  await expect(page.locator("tr", { hasText: order.id.slice(0, 8) }).first()).toContainText("оплачен", { timeout: 10_000 });
});
