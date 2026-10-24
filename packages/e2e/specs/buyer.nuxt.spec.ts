import { expect, test } from "@playwright/test";

/**
 * Покупательский путь на Nuxt-фронте (SSR, plain-HTML): каталог рендерится на сервере,
 * добавление в корзину через alert() (Playwright гасит диалоги автоматически),
 * бейдж корзины — b.badge в шапке.
 */
test("nuxt: покупатель — корзина гостя → логин → мердж → checkout → заказ", async ({ page }) => {
  await page.goto("/");
  // SSR: контент виден до гидратации — даём клиенту оживить страницу
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 45_000 });

  const cards = page.locator(".card", { has: page.getByText(/в наличии: \d{2,}/) });
  await cards.first().getByRole("button", { name: "В корзину" }).click();
  await expect(page.locator("header .badge")).toHaveText(/^1$/, { timeout: 10_000 });

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Email").fill("buyer@demo.dev");
  await page.getByPlaceholder("Пароль").fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("link", { name: "Заказы" })).toBeVisible({ timeout: 15_000 });

  await page.goto("/cart");
  await expect(page.getByText("Итого: $")).toBeVisible();

  await page.goto("/checkout");
  await page.getByPlaceholder("Промокод (например WELCOME10)").fill("WELCOME10");
  await page.getByRole("button", { name: "Проверить" }).click();
  await expect(page.locator(".chip")).toContainText("скидка", { timeout: 10_000 });
  await page.getByText("Standard delivery").click();
  await page.getByPlaceholder("Улица, дом").fill("E2E Street 2");
  await page.getByPlaceholder("Город").fill("Nuxtville");
  await page.getByPlaceholder("Индекс").fill("22222");

  await page.getByRole("button", { name: "Подтвердить заказ" }).click();
  await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 });
  await expect(page.getByText(/Заказ #[0-9a-f]+/).first()).toBeVisible({ timeout: 15_000 });
});

test("nuxt: гость — каталог → карточка товара открывается", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 45_000 });
  await page.locator(".card").filter({ hasText: "$" }).first().click();
  await expect(page.getByRole("button", { name: "Добавить в корзину" })).toBeVisible({ timeout: 10_000 });
});
