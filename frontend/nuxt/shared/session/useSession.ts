// Сессия: useState (SSR-безопасный) + localStorage-токены на клиенте.
// Клиент API создаётся на вызов (useApi() — композабл с runtime-config), не на уровне модуля.
import { errorMessage, setOrderIdempotencyKey, useApi } from "../api/useApi";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "moderator" | "admin";
  blocked: boolean;
  shopName: string | null;
  createdAt: string;
}

export const useSession = () =>
  useState<SessionUser | null>("session-user", () => (import.meta.client ? JSON.parse(localStorage.getItem("pm.user") || "null") : null));

export const useCart = () =>
  useState<{ id: string; subtotal: number; items: Array<any> }>("session-cart", () => ({
    id: "",
    subtotal: 0,
    items: [],
  }));

export async function loadCart() {
  const cart = useCart();
  const api = useApi();
  try {
    const res = await api.cart.getCart();
    const body = res.data as any;
    cart.value = { id: body.id, subtotal: body.subtotal ?? 0, items: body.items ?? [] };
  } catch {
    /* корзина появится после первого добавления */
  }
}

export async function addToCart(productId: string, quantity = 1): Promise<string | null> {
  const cart = useCart();
  const api = useApi();
  try {
    const res = await api.cart.addCartItem({ productId, quantity });
    const header = (res.headers?.["x-cart-token"] ?? res.headers?.["X-Cart-Token"]) as string | undefined;
    if (header && import.meta.client) localStorage.setItem("pm.cart", header);
    cart.value = { id: (res.data as any).id, subtotal: (res.data as any).subtotal ?? 0, items: (res.data as any).items ?? [] };
    return null;
  } catch (err) {
    return errorMessage(err);
  }
}

async function afterAuth(token: string, user: SessionUser) {
  const api = useApi();
  const state = useSession();
  if (import.meta.client) {
    localStorage.setItem("pm.token", token);
    localStorage.setItem("pm.user", JSON.stringify(user));
  }
  state.value = user;
  const cartToken = import.meta.client ? localStorage.getItem("pm.cart") : null;
  if (cartToken) {
    try {
      await api.cart.mergeCart({ token: cartToken });
      if (import.meta.client) localStorage.removeItem("pm.cart");
    } catch {
      /* мердж не критичен */
    }
  }
  await loadCart();
}

export async function login(email: string, password: string) {
  const api = useApi();
  const res = await api.auth.login({ email, password });
  await afterAuth(res.data.token, res.data.user as SessionUser);
}

export async function register(name: string, email: string, password: string) {
  const api = useApi();
  const res = await api.auth.register({ name, email, password });
  await afterAuth(res.data.token, res.data.user as SessionUser);
}

export function logout() {
  const state = useSession();
  if (import.meta.client) {
    localStorage.removeItem("pm.token");
    localStorage.removeItem("pm.user");
    localStorage.removeItem("pm.cart");
  }
  state.value = null;
  navigateTo("/");
}

export { errorMessage, setOrderIdempotencyKey };
