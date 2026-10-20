import { expect, test } from "@playwright/test";

/**
 * Покупательский путь на React-фронте (MUI): локаторы отличаются от Quasar —
 * MUI TextField рендерит placeholder/label как обычный input.
 */
test("react: покупатель — корзина гостя → checkout → заказ", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".MuiCard-root").first()).toBeVisible({ timeout: 45_000 });

  // первый товар с запасом
  const cards = page.locator(".MuiCard-root").filter({ hasText: /в наличии: \d{2,}/ });
  await cards.first().getByRole("button", { name: "В корзину" }).click();
  await expect(page.locator(".MuiBadge-badge")).toBeVisible({ timeout: 10_000 });

  // checkout без логина: API допускает гостя без токена корзины? Нет — заказ требует
  // авторизации, но корзина уже лежит в гостевом токене; логин мерджит. Здесь — логин.
  await page.goto("/login");
  await page.getByLabel("Email").fill("buyer@demo.dev");
  await page.getByLabel("Пароль").fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/$|\/checkout|\/orders/, { timeout: 15_000 });

  await page.goto("/checkout");
  await page.getByLabel("Промокод (например WELCOME10)").fill("WELCOME10");
  await page.getByRole("button", { name: "Проверить" }).click();
  await expect(page.locator(".MuiChip-label").first()).toBeVisible({ timeout: 10_000 });
  await page.getByLabel(/Standard/).click();
  await page.getByLabel("Улица, дом").fill("E2E Street 7");
  await page.getByLabel("Город").fill("Reactville");
  await page.getByLabel("Индекс").fill("54321");

  await page.getByRole("button", { name: /Подтвердить заказ/ }).click();
  await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 });
  await expect(page.getByText(/Заказ #[0-9a-f]+/).first()).toBeVisible({ timeout: 15_000 });
});
