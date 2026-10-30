// Сессия на рунах Svelte 5: экспортируемое $state-состояние (module-level runes).
import { api } from "./api";
import type { SessionUser } from "./api";

function readUser(): SessionUser | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("pm.user") ?? "null") as SessionUser | null;
  } catch {
    return null;
  }
}

export const session = $state({
  get token() {
    return typeof localStorage !== "undefined" ? localStorage.getItem("pm.token") ?? "" : "";
  },
  user: readUser(),
});

export const cart = $state<{ id: string; subtotal: number; count: number; items: Array<any> }>({
  id: "",
  subtotal: 0,
  count: 0,
  items: [],
});

export async function loadCart() {
  const res = await api.cart.getCart();
  const body = res.data as { id: string; subtotal?: number; items?: Array<any> };
  cart.id = body.id;
  cart.subtotal = body.subtotal ?? 0;
  cart.items = body.items ?? [];
  cart.count = cart.items.reduce((acc, i) => acc + (i.quantity ?? 0), 0);
}

export async function addToCart(productId: string, quantity = 1): Promise<string | null> {
  try {
    const res = await api.cart.addCartItem({ productId, quantity });
    const header = (res.headers?.["x-cart-token"] ?? res.headers?.["X-Cart-Token"]) as string | undefined;
    if (header && typeof localStorage !== "undefined") localStorage.setItem("pm.cart", header);
    await loadCart();
    return null;
  } catch (err) {
    return errorMessage(err);
  }
}

export async function login(email: string, password: string) {
  const res = await api.auth.login({ email, password });
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("pm.token", res.data.token);
    localStorage.setItem("pm.user", JSON.stringify(res.data.user));
  }
  session.user = res.data.user as SessionUser;
  const cartToken = typeof localStorage !== "undefined" ? localStorage.getItem("pm.cart") : null;
  if (cartToken) {
    try {
      await api.cart.mergeCart({ token: cartToken });
      localStorage.removeItem("pm.cart");
    } catch {
      /* мердж не критичен */
    }
  }
  await loadCart();
}

export async function register(name: string, email: string, password: string) {
  const res = await api.auth.register({ name, email, password });
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("pm.token", res.data.token);
    localStorage.setItem("pm.user", JSON.stringify(res.data.user));
  }
  session.user = res.data.user as SessionUser;
  await loadCart();
}

export function logout() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("pm.token");
    localStorage.removeItem("pm.user");
    localStorage.removeItem("pm.cart");
  }
  session.user = null;
  cart.items = [];
  cart.count = 0;
  cart.subtotal = 0;
}
