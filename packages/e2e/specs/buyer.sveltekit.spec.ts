import { expect, test, type Page, type Locator } from "@playwright/test";

/**
 * Покупательский путь на SvelteKit-фронте (Svelte 5 runes, SSR): каталог с сервера,
 * добавление подтверждается .notice «Добавлено в корзину», бейджа в шапке нет —
 * факт добавления проверяем корзиной.
 *
 * Dev-особенность SSR: HTML виден до гидратации, клик «впустую» теряется —
 * первые действия ретраятся до появления эффекта (см. clickUntil).
 */
async function clickUntil(page: Page, locator: Locator, effect: () => Promise<boolean>, what: string) {
  await expect(async () => {
    try {
      await locator.click({ timeout: 3000 });
    } catch {
      /* клик до гидратации теряется; возможна и навигация с отвалом локатора */
    }
    if (!(await effect())) throw new Error(`${what}: эффекта нет — страница ещё не ожила`);
  }).toPass({ timeout: 30_000 });
}

test("sveltekit: покупатель — корзина гостя → логин → мердж → checkout → заказ", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 45_000 });
  await page.waitForLoadState("networkidle");

  const cards = page.locator(".card", { has: page.getByText(/в наличии: \d{2,}/) });
  await clickUntil(page, cards.first().getByRole("button", { name: "В корзину" }),
    async () => (await page.locator(".notice").count()) > 0, "В корзину");
  await expect(page.locator(".notice")).toContainText("Добавлено в корзину", { timeout: 10_000 });

  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByPlaceholder("Email").fill("buyer@demo.dev");
  await page.getByPlaceholder("Пароль").fill("password");
  await clickUntil(page, page.getByRole("button", { name: "Войти" }),
    async () => (await page.getByRole("button", { name: "Выйти" }).count()) > 0, "Войти");
  await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible({ timeout: 15_000 });

  // мердж: гостевая позиция жива под аккаунтом
  await page.goto("/cart");
  await expect(page.getByText("Итого: $")).toBeVisible({ timeout: 10_000 });

  await page.goto("/checkout");
  await page.getByPlaceholder("Промокод (например WELCOME10)").fill("WELCOME10");
  await page.getByRole("button", { name: "Проверить" }).click();
  await expect(page.locator(".chip")).toContainText("скидка", { timeout: 10_000 });
  await page.getByText("Standard delivery").click();
  await page.getByPlaceholder("Улица, дом").fill("E2E Street 6");
  await page.getByPlaceholder("Город").fill("Svelteville");
  await page.getByPlaceholder("Индекс").fill("66666");

  await page.getByRole("button", { name: "Подтвердить заказ" }).click();
  await expect(page).toHaveURL(/\/orders/, { timeout: 15_000 });
  await expect(page.getByText(/Заказ #[0-9a-f]+/).first()).toBeVisible({ timeout: 15_000 });
});

test("sveltekit: гость — каталог → карточка товара открывается", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("в наличии:").first()).toBeVisible({ timeout: 45_000 });
  await page.waitForLoadState("networkidle");

  await clickUntil(page, page.locator(".card").filter({ hasText: "$" }).first(),
    async () => page.url().includes("/product/"), "клик по карточке");
  await expect(page.getByRole("button", { name: "Добавить в корзину" })).toBeVisible({ timeout: 10_000 });
});
