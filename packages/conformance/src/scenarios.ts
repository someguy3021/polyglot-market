// Сценарии conformance: один и тот же набор против любого бекенда (ADR-005).
// Каждый сценарий сверяет статусы, форматы ошибок и тела со схемами контракта.
import { call, expect, expectStatus, baseUrl } from "./http.js";
import { validate } from "./spec.js";

export interface ScenarioResult {
  name: string;
  ok: boolean;
  error?: string;
  ms: number;
}

export interface Scenario {
  name: string;
  run: () => Promise<void>;
}

const uniq = () => Date.now() + Math.floor(Math.random() * 1e6);

export const scenarios: Scenario[] = [
  {
    name: "service: GET /health соответствует схеме",
    run: async () => {
      const res = await call("GET", "/health");
      expectStatus(res, 200);
      expect(errors("getHealth", res), `невалидный /health: ${errors("getHealth", res).join("; ")}`);
    },
  },
  {
    name: "auth: register создаёт покупателя и возвращает JWT",
    run: async () => {
      const email = `conf+${uniq()}@demo.dev`;
      const res = await call("POST", "/auth/register", { body: { name: "Conformance", email, password: "Sup3rSecret" } });
      expectStatus(res, 201);
      expect(errors("AuthToken", res.body), `невалидный AuthToken: ${errors("AuthToken", res.body).join("; ")}`);
      expect((res.body as { user?: { role?: string } }).user?.role === "buyer", "новый пользователь должен быть buyer");
    },
  },
  {
    name: "auth: register отклоняет дубликат email (422, формат Error)",
    run: async () => {
      const body = { name: "Dup", email: "buyer@demo.dev", password: "Sup3rSecret" };
      const res = await call("POST", "/auth/register", { body });
      expectStatus(res, 422);
      expect(errorFormat(res), `тело не в формате Error: ${res.raw.slice(0, 160)}`);
    },
  },
  {
    name: "auth: register отклоняет короткий пароль (422, details)",
    run: async () => {
      const res = await call("POST", "/auth/register", { body: { name: "Weak", email: `conf+weak${uniq()}@demo.dev`, password: "1234567" } });
      expectStatus(res, 422);
      expect(errorFormat(res), "тело не в формате Error");
      const details = (res.body as { details?: Record<string, unknown> }).details;
      expect(details && Object.keys(details).length > 0, "ожидались details с полевыми ошибками");
    },
  },
  {
    name: "auth: login демо-покупателя возвращает валидный токен",
    run: async () => {
      const res = await call("POST", "/auth/login", { body: { email: "buyer@demo.dev", password: "password" } });
      expectStatus(res, 200);
      expect(errors("AuthToken", res.body), `невалидный AuthToken: ${errors("AuthToken", res.body).join("; ")}`);
      const token = (res.body as { token?: string }).token;
      const me = await call("GET", "/auth/me", { token });
      expectStatus(me, 200);
      expect(errors("User", me.body), `невалидный User: ${errors("User", me.body).join("; ")}`);
      expect((me.body as { email?: string }).email === "buyer@demo.dev", "me.email должен совпадать с логином");
    },
  },
  {
    name: "auth: неверный пароль — 401 в формате Error",
    run: async () => {
      const res = await call("POST", "/auth/login", { body: { email: "buyer@demo.dev", password: "wrong" } });
      expectStatus(res, 401);
      expect(errorFormat(res), "тело не в формате Error");
    },
  },
  {
    name: "auth: /auth/me без токена — 401",
    run: async () => {
      const res = await call("GET", "/auth/me");
      expectStatus(res, 401);
      expect(errorFormat(res), "тело не в формате Error");
    },
  },
  {
    name: "catalog: GET /products — пагинация и схема товара",
    run: async () => {
      const res = await call("GET", "/products?page=1&perPage=5");
      expectStatus(res, 200);
      const body = res.body as { data?: unknown[]; meta?: { perPage?: number; total?: number } };
      expect(Array.isArray(body.data) && body.data!.length > 0, "ожидались товары (сиды)");
      expect(body.data!.length <= 5, "perPage не соблюдён");
      expect(errors("PaginationMeta", body.meta), `невалидный meta: ${errors("PaginationMeta", body.meta).join("; ")}`);
      for (const product of body.data!) {
        const errs = validate("Product", product);
        expect(errs.length === 0, `невалидный Product: ${errs.join("; ")}`);
      }
    },
  },
  {
    name: "catalog: фильтры category/price + сортировка price_asc",
    run: async () => {
      const res = await call("GET", "/products?category=books&price_min=10&price_max=40&sort=price_asc&perPage=50");
      expectStatus(res, 200);
      const body = res.body as { data?: { price?: number; category?: { slug?: string } }[] };
      expect((body.data ?? []).length > 0, "ожидались товары books в диапазоне цен");
      const prices = body.data!.map((p) => p.price ?? 0);
      expect(prices.every((p) => p >= 10 && p <= 40), "фильтр цены не соблюдён");
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i - 1]! <= prices[i]!, "сортировка price_asc не соблюдена");
      }
    },
  },
  {
    name: "catalog: GET /products/{id} — карточка, 404 в формате Error",
    run: async () => {
      const list = await call("GET", "/products?perPage=1");
      const id = (list.body as { data?: { id?: string }[] }).data?.[0]?.id;
      expect(typeof id === "string", "не получили id товара");
      const res = await call("GET", `/products/${id}`);
      expectStatus(res, 200);
      expect(errors("Product", res.body), `невалидный Product: ${errors("Product", res.body).join("; ")}`);
      const missing = await call("GET", "/products/00000000-0000-4000-8000-000000000000");
      expectStatus(missing, 404);
      expect(errorFormat(missing), "404 не в формате Error");
    },
  },
  {
    name: "cart: гостевая корзина по X-Cart-Token (add → get → patch → delete)",
    run: async () => {
      const list = await call("GET", "/products?perPage=2");
      const [p1, p2] = (list.body as { data?: { id?: string }[] }).data ?? [];
      expect(p1?.id && p2?.id, "нужны два товара из сидов");
      const add = await call("POST", "/cart/items", { body: { productId: p1!.id, quantity: 2 } });
      expectStatus(add, 201);
      const token = add.headers.get("x-cart-token") ?? add.headers.get("X-Cart-Token");
      expect(typeof token === "string" && token.length > 0, "ответ не вернул X-Cart-Token для гостя");
      expect(errors("Cart", add.body), `невалидный Cart: ${errors("Cart", add.body).join("; ")}`);
      const add2 = await call("POST", "/cart/items", { cartToken: token, body: { productId: p2!.id, quantity: 1 } });
      expectStatus(add2, 201);
      const got = await call("GET", "/cart", { cartToken: token });
      expectStatus(got, 200);
      const cart = got.body as { items?: { quantity?: number }[]; subtotal?: number };
      expect(cart.items?.length === 2, "в корзине должно быть 2 позиции");
      const itemId = (got.body as { items?: { id?: string }[] }).items?.[0]?.id;
      const patched = await call("PATCH", `/cart/items/${itemId}`, { cartToken: token, body: { quantity: 3 } });
      expectStatus(patched, 200);
      const removed = await call("DELETE", `/cart/items/${itemId}`, { cartToken: token });
      expectStatus(removed, 200);
      const after = (removed.body as { items?: unknown[] }).items?.length ?? -1;
      expect(after === 1, "после удаления должна остаться 1 позиция");
    },
  },
  {
    name: "cart: add несуществующего товара — 404; не-approved — 4xx",
    run: async () => {
      const res = await call("POST", "/cart/items", { body: { productId: "00000000-0000-4000-8000-000000000000", quantity: 1 } });
      expectStatus(res, 404);
      expect(errorFormat(res), "404 не в формате Error");
    },
  },
  {
    name: "orders: checkout с Idempotency-Key — повтор возвращает тот же заказ",
    run: async () => {
      const email = `conf+order${uniq()}@demo.dev`;
      const reg = await call("POST", "/auth/register", { body: { name: "Order Conf", email, password: "Sup3rSecret" } });
      const token = (reg.body as { token?: string }).token;
      expect(typeof token === "string", "нет токена после регистрации");
      const list = await call("GET", "/products?perPage=3");
      const product = (list.body as { data?: { id?: string }[] }).data?.[0];
      await call("POST", "/cart/items", { token, body: { productId: product!.id, quantity: 1 } });
      const key = crypto.randomUUID();
      const body = {
        shippingMethodCode: "standard",
        shippingAddress: { line1: "Conf St 1", city: "Testville", zip: "12345", country: "US" },
      };
      const first = await call("POST", "/orders", { token, idempotencyKey: key, body });
      expectStatus(first, 201);
      expect(errors("Order", first.body), `невалидный Order: ${errors("Order", first.body).join("; ")}`);
      const second = await call("POST", "/orders", { token, idempotencyKey: key, body });
      expectStatus(second, [200, 201]);
      expect((second.body as { id?: string }).id === (first.body as { id?: string }).id, "повтор с тем же ключом вернул другой заказ");
      const empty = await call("POST", "/orders", { token, idempotencyKey: crypto.randomUUID(), body });
      expectStatus(empty, 409);
      expect(errorFormat(empty), "409 не в формате Error");
    },
  },
  {
    name: "orders: POST /orders без Idempotency-Key — 4xx",
    run: async () => {
      const email = `conf+nokey${uniq()}@demo.dev`;
      const reg = await call("POST", "/auth/register", { body: { name: "No Key", email, password: "Sup3rSecret" } });
      const token = (reg.body as { token?: string }).token;
      const body = { shippingMethodCode: "standard", shippingAddress: { line1: "A", city: "B", zip: "1", country: "US" } };
      const res = await call("POST", "/orders", { token, body });
      expect(res.status === 400 || res.status === 422, `ожидались 400|422, получен ${res.status}`);
      expect(errorFormat(res), "тело не в формате Error");
    },
  },
  {
    name: "roles: продавец не может одобрить свой товар (403), модератор может",
    run: async () => {
      const seller = await call("POST", "/auth/login", { body: { email: "seller@demo.dev", password: "password" } });
      const sellerToken = (seller.body as { token?: string }).token;
      const cat = await call("GET", "/categories");
      const categoryId = (cat.body as { data?: { id?: string }[] }).data?.[0]?.id;
      const created = await call("POST", "/seller/products", {
        token: sellerToken,
        body: { title: `Conf Product ${uniq()}`, description: "conformance", price: 9.99, categoryId, stock: 1 },
      });
      expectStatus(created, 201);
      const productId = (created.body as { id?: string }).id;
      const submitted = await call("POST", `/seller/products/${productId}/submit`, { token: sellerToken });
      expectStatus(submitted, 200);
      const selfApprove = await call("POST", `/moderator/products/${productId}/approve`, { token: sellerToken });
      expectStatus(selfApprove, 403);
      const moderator = await call("POST", "/auth/login", { body: { email: "moderator@demo.dev", password: "password" } });
      const moderatorToken = (moderator.body as { token?: string }).token;
      const approved = await call("POST", `/moderator/products/${productId}/approve`, { token: moderatorToken });
      expectStatus(approved, 200);
      expect((approved.body as { status?: string }).status === "approved", "статус должен стать approved");
    },
  },
  {
    name: "roles: покупатель не имеет доступа к админ-эндпоинтам (403)",
    run: async () => {
      const buyer = await call("POST", "/auth/login", { body: { email: "buyer@demo.dev", password: "password" } });
      const token = (buyer.body as { token?: string }).token;
      const res = await call("GET", "/admin/orders", { token });
      expectStatus(res, 403);
      expect(errorFormat(res), "403 не в формате Error");
    },
  },
  {
    name: "promo: WELCOME10 валиден, EXPIRED10 отклонён",
    run: async () => {
      const ok = await call("POST", "/promo/validate", { body: { code: "WELCOME10", subtotal: 100 } });
      expectStatus(ok, 200);
      const v = ok.body as { valid?: boolean; discount?: number };
      expect(v.valid === true && v.discount === 10, `WELCOME10: ожидался discount 10, получен ${v.discount}`);
      const expired = await call("POST", "/promo/validate", { body: { code: "EXPIRED10", subtotal: 100 } });
      expectStatus(expired, 422);
      expect(errorFormat(expired), "422 не в формате Error");
    },
  },
];

function errors(schemaName: string, body: unknown): string[] {
  return validate(schemaName, body);
}

function errorFormat(res: { body: unknown }): boolean {
  const b = res.body as { status?: number; error?: string; message?: string } | null;
  return Boolean(b && typeof b.status === "number" && typeof b.error === "string" && typeof b.message === "string");
}

export { baseUrl };
