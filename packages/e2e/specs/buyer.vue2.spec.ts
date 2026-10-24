import { expect, test } from "@playwright/test";

/**
 * Покупательский путь на Vue 2.7-фронте (Vuex + Vuetify 2): поля — v-text-field с label
 * (getByLabel работает), радио — v-radio с текстом метки, бейдж — v-badge в app bar.
 */
test("vue2: покупатель — корзина гостя → логин → мердж → checkout → заказ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 45_000 });

  // карточки — v-card; берём с запасом ≥ 10
  const cards = page.locator(".v-card", { has: page.getByText(/в наличии: \d{2,}/) });
  await cards.first().getByRole("button", { name: "В корзину" }).click();
  await expect(page.locator(".v-badge__badge")).toHaveText(/^1$/, { timeout: 10_000 });

  await page.goto("/login");
  await page.getByLabel("Email").fill("buyer@demo.dev");
  await page.getByLabel("Пароль").fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.locator(".v-chip", { hasText: /покупатель/ })).toBeVisible({ timeout: 15_000 });

  await page.goto("/cart");
  await expect(page.getByText("Итого: $")).toBeVisible();

  await page.goto("/checkout");
  await page.getByLabel("Промокод (например WELCOME10)").fill("WELCOME10");
  await page.getByRole("button", { name: "Проверить" }).click();
  await expect(page.locator(".v-chip", { hasText: "скидка" })).toBeVisible({ timeout: 10_000 });
  await page.getByText("Standard delivery").click();
  await page.getByLabel("Улица, дом").fill("E2E Street 5");
  await page.getByLabel("Город").fill("Vueville");
  await page.getByLabel("Индекс").fill("55555");

  await page.getByRole("button", { name: "Подтвердить заказ" }).click();
  await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 });
  await expect(page.getByText(/Заказ #[0-9a-f]+/).first()).toBeVisible({ timeout: 15_000 });
});

test("vue2: гость — каталог → карточка товара открывается", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 45_000 });
  await page.locator(".v-card").filter({ hasText: "$" }).first().click();
  await expect(page.getByRole("button", { name: "Добавить в корзину" })).toBeVisible({ timeout: 10_000 });
});
