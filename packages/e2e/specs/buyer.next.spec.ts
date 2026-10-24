import { expect, test } from "@playwright/test";

/**
 * Покупательский путь на Next-фронте (App Router): каталог — RSC без кнопки «В корзину»,
 * гость добавляет товар со страницы товара; шапка статична, логин проверяем по мерджу
 * корзины; промокод-инпут — placeholder «WELCOME10».
 */
test("next: покупатель — корзина гостя → логин → мердж → checkout → заказ", async ({ page }) => {
  await page.goto("/");
  // SSR: контент виден до гидратации — даём клиенту оживить страницу
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 60_000 });

  // RSC-каталог: карточка — ссылка на страницу товара, добавление оттуда.
  // Подтверждения в UI нет — ждём ответ POST /cart/items, иначе goto /cart
  // отменяет запрос на полпути (гостевой токен не успеет сохраниться).
  const addItem = page.waitForResponse((r) => r.url().includes("/cart/items") && r.request().method() === "POST");
  await page.locator(".card").filter({ hasText: /в наличии: \d{2,}/ }).first().click();
  await page.getByRole("button", { name: "Добавить в корзину" }).click();
  await addItem;

  await page.goto("/cart");
  await expect(page.getByText("Итого: $")).toBeVisible({ timeout: 10_000 });

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Email").fill("buyer@demo.dev");
  await page.getByPlaceholder("Пароль").fill("password");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page).toHaveURL(/\/$|\/checkout|\/orders/, { timeout: 15_000 });

  // мердж: позиция из гостевой корзины жива под аккаунтом
  await page.goto("/cart");
  await expect(page.getByText("Итого: $")).toBeVisible({ timeout: 10_000 });

  await page.goto("/checkout");
  await page.getByPlaceholder("WELCOME10").fill("WELCOME10");
  await page.getByRole("button", { name: "Проверить" }).click();
  await expect(page.getByText(/скидка/)).toBeVisible({ timeout: 10_000 });
  await page.getByText("Standard delivery").click();
  await page.getByPlaceholder("Улица, дом").fill("E2E Street 3");
  await page.getByPlaceholder("Город").fill("Nextville");
  await page.getByPlaceholder("Индекс").fill("33333");

  await page.getByRole("button", { name: "Подтвердить заказ" }).click();
  await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 });
  await expect(page.getByText(/Заказ #[0-9a-f]+/).first()).toBeVisible({ timeout: 15_000 });
});

test("next: гость — каталог (RSC) → карточка товара открывается", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 60_000 });
  await page.locator(".card").filter({ hasText: "$" }).first().click();
  await expect(page.getByRole("button", { name: "Добавить в корзину" })).toBeVisible({ timeout: 15_000 });
});
