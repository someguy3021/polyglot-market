/**
 * Общие API-хелперы спеков (фича 14): подготовка данных через контракт,
 * чтобы UI-тест покрывал именно UI-действия роли. Адрес бекенда — E2E_API_URL.
 */
export const API = process.env.E2E_API_URL ?? "http://127.0.0.1:8010";

export async function apiLogin(email: string, password = "password"): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`login ${email}: HTTP ${res.status}`);
  const { token } = (await res.json()) as { token: string };
  return token;
}

export async function apiFirstCategoryId(): Promise<string> {
  const res = await fetch(`${API}/categories`);
  const body = (await res.json()) as { data: Array<{ id: string }> | Array<{ id: string }> };
  const list = Array.isArray(body) ? body : body.data;
  return list[0]!.id;
}

/** Черновик товара продавца через контракт (для фронтов без UI-формы создания). */
export async function apiCreateDraftProduct(token: string, title: string): Promise<string> {
  const categoryId = await apiFirstCategoryId();
  const res = await fetch(`${API}/seller/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, description: "Создано E2E роль-сценарием", price: 13.5, stock: 25, categoryId }),
  });
  if (!res.ok) throw new Error(`create product: HTTP ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data?: { id: string }; id?: string };
  return body.data?.id ?? body.id!;
}

/** Свежий заказ покупателя через контракт (для admin-сценария). */
export async function apiCreateBuyerOrder(): Promise<{ id: string; status: string }> {
  const token = await apiLogin("buyer@demo.dev");
  const res = await fetch(`${API}/products?perPage=5`, { headers: { Authorization: `Bearer ${token}` } });
  const body = (await res.json()) as { data?: Array<{ id: string; stock: number }>; items?: Array<{ id: string; stock: number }> };
  const products = body.data ?? body.items ?? [];
  const product = products.find((p) => p.stock >= 5) ?? products[0]!;
  await fetch(`${API}/cart/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  const orderRes = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      shippingMethodCode: "standard",
      shippingAddress: { line1: "Role St 1", city: "Testville", zip: "00000", country: "US" },
    }),
  });
  const order = (await orderRes.json()) as { data?: { id: string; status: string }; id?: string; status?: string };
  const view = order.data ?? { id: order.id!, status: order.status! };
  if (orderRes.status !== 201) throw new Error(`create order: HTTP ${orderRes.status}`);
  return { id: view.id, status: view.status };
}
