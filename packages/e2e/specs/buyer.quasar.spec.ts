import { expect, test } from "@playwright/test";

/**
 * Покупательский путь (фича 14, сценарий «гость + покупатель»):
 * каталог → гость кладёт в корзину → логин (мердж гостевой корзины) →
 * checkout с промокодом и доставкой → заказ появляется в «Мои заказы».
 */
test("покупатель: корзина гостя → логин → мердж → checkout → заказ", async ({ page }) => {
  // 1. Каталог загружается с товарами
  await page.goto("/");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 15_000 });

  // 2. Гость кладёт в корзину товар с запасом ≥ 10 (устойчиво к перезапускам сида)
  const cards = page.locator(".q-card", { has: page.getByText(/в наличии: \d{2,}/) });
  await cards.first().getByRole("button", { name: "В корзину" }).click();
  await expect(page.locator("header .q-badge", { hasText: /^1$/ })).toBeVisible({ timeout: 10_000 });

  // 3. Логин демо-покупателя — гостевая корзина мерджится в аккаунтную
  await page.goto("/login");
  await page.getByLabel("Email").fill("buyer@demo.dev");
  await page.getByLabel("Пароль").fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByText("Добро пожаловать")).toBeVisible({ timeout: 10_000 });

  // 4. Корзина по-прежнему содержит товар (мердж сохранил позицию)
  await page.goto("/cart");
  await expect(page.getByText("Итого: $")).toBeVisible();

  // 5. Checkout: промокод + доставка + адрес
  await page.goto("/checkout");
  await page.getByLabel("Промокод (например WELCOME10)").fill("WELCOME10");
  await page.getByRole("button", { name: "Проверить" }).click();
  await expect(page.getByText(/скидка/).first()).toBeVisible({ timeout: 10_000 });
  await page.getByText("Standard delivery").click();
  await page.getByLabel("Улица, дом").fill("E2E Street 1");
  await page.getByLabel("Город").fill("Testville");
  await page.getByLabel("Индекс").fill("12345");

  // 6. Подтверждаем заказ
  await page.getByRole("button", { name: "Подтвердить заказ" }).click();
  await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 });
  await expect(page.getByText(/Заказ #[0-9a-f]+/).first()).toBeVisible({ timeout: 15_000 });
});

test("гость: каталог → карточка товара открывается", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 15_000 });
  // открываем первый товар кликом по карточке
  await page.locator(".q-card").filter({ hasText: "$" }).first().click();
  await expect(page.getByRole("button", { name: "Добавить в корзину" })).toBeVisible({ timeout: 10_000 });
});
