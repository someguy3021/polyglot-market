import { expect, test } from "@playwright/test";

/**
 * Роль-сценарии маркетплейса (фича 14): продавец → модератор → админ.
 * Цепочка: продавец создаёт товар и отправляет на модерацию; модератор
 * одобряет; админ меняет статус свежего заказа. Общие селекторы Quasar.
 */

const productTitle = `E2E Product ${Date.now()}`;

async function login(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Пароль").fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.locator("header")).toContainText(/покупатель|продавец|модератор|админ/, { timeout: 15_000 });
}

test("seller: создаёт товар и отправляет на модерацию", async ({ page }) => {
  await login(page, "seller@demo.dev", "password");

  await page.goto("/seller/products");
  await page.getByRole("button", { name: "Новый товар" }).click();
  await page.getByLabel("Название").fill(productTitle);
  await page.getByLabel("Описание").fill("Создано E2E роль-сценарием продавца");
  await page.getByLabel("Цена $").fill("13.50");
  await page.getByLabel("Остаток").fill("25");
  await page.locator(".q-dialog select").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Создать черновик" }).click();

  // черновик появился в таблице — отправляем на модерацию
  const row = page.locator("tr", { hasText: productTitle });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.getByRole("button", { name: "На модерацию" }).click();
  await expect(row).toContainText("на модерации", { timeout: 10_000 });
});

test("moderator: одобряет товар продавца", async ({ page }) => {
  await login(page, "moderator@demo.dev", "password");

  await page.goto("/moderator/queue");
  const row = page.locator("tr", { hasText: productTitle });
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.getByRole("button", { name: "Одобрить" }).click();

  // одобренный товар исчез из очереди и появился в каталоге
  await expect(page.locator("tr", { hasText: productTitle })).toHaveCount(0, { timeout: 10_000 });
  await page.goto("/");
  await page.getByLabel("Поиск по названию").fill(productTitle);
  await expect(page.locator(".q-card", { hasText: productTitle }).first()).toBeVisible({ timeout: 10_000 });
});

test("admin: меняет статус свежего заказа new → paid", async ({ page }) => {
  // подготовка: свежий заказ через API (покупатель + товар из каталога)
  const api = process.env.E2E_API_URL ?? "http://127.0.0.1:8010";
  const loginRes = await fetch(`${api}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "buyer@demo.dev", password: "password" }),
  });
  const { token } = (await loginRes.json()) as { token: string };

  const cat = await (await fetch(`${api}/categories`)).json();
  const prodRes = await fetch(`${api}/products?perPage=5`, { headers: { Authorization: `Bearer ${token}` } });
  const products = ((await prodRes.json()) as any).data as Array<{ id: string; stock: number }>;
  const product = products.find((p) => p.stock >= 5) ?? products[0]!;
  await fetch(`${api}/cart/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });

  const idem = crypto.randomUUID();
  const orderRes = await fetch(`${api}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": idem,
    },
    body: JSON.stringify({
      shippingMethodCode: "standard",
      shippingAddress: { line1: "Role St 1", city: "Testville", zip: "00000", country: "US" },
    }),
  });
  const order = (await orderRes.json()) as { id: string; status: string };
  expect(orderRes.status).toBe(201);
  expect(order.status).toBe("new");

  // UI админа: находим строку заказа и переводим new → paid
  await login(page, "admin@demo.dev", "password");
  await page.goto("/admin/orders");
  await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 15_000 });
  const row = page.locator("tr", { hasText: order.id.slice(0, 8) }).first();
  await expect(row).toBeVisible({ timeout: 10_000 });
  await row.locator("select").selectOption("paid", { force: true });

  // статус подтвердился на сервере (select перерисовался с опциями paid → …)
  await expect(row.locator("select")).toHaveValue(/paid/, { timeout: 10_000 });
});
