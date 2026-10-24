// Серверные вызовы — обычный fetch с абсолютным URL (RSC);
// клиентские компоненты используют SDK @showcase/api-client.
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: { name: string };
  seller: { shopName: string };
  images: Array<{ url: string; isPrimary: boolean }>;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  shippingMethod: { name: string };
  items: Array<{ id: string; title: string; quantity: number; price: number }>;
}

export async function fetchCatalog(params: Record<string, string> = {}): Promise<{
  data: Product[];
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
}> {
  // пустые значения (category= из формы фильтров) выкидываем: API отвечает 422
  // на пустую категорию, а RSC-страница — 500 на неуспешный fetch
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== ""));
  const qs = new URLSearchParams(clean).toString();
  const res = await fetch(`${API_URL}/products${qs ? `?${qs}` : ""}`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error(`catalog ${res.status}`);
  return res.json();
}

export async function fetchProduct(id: string): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("not found");
  return res.json();
}

export function money(v: number): string {
  return `$${v.toFixed(2)}`;
}
