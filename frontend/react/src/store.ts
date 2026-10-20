// Сессия и корзина на Zustand: токены синхронизируются с localStorage (их читает SDK).
import { create } from "zustand";
import { api, errorMessage, type SessionUser } from "./api";

interface CartItemView {
  id: string;
  quantity: number;
  lineTotal: number;
  product: { id: string; title: string; price: number; image: string | null };
}

interface CartView {
  id: string;
  items: CartItemView[];
  subtotal: number;
}

interface AppState {
  token: string;
  cartToken: string;
  user: SessionUser | null;
  cart: CartView | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuth: (token: string, user: SessionUser) => Promise<void>;
  setCartToken: (token: string | undefined) => void;
  loadCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<string | null>;
  setQty: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

const persist = (s: { token: string; cartToken: string; user: SessionUser | null }) => {
  if (s.token) localStorage.setItem("pm.token", s.token);
  else localStorage.removeItem("pm.token");
  if (s.cartToken) localStorage.setItem("pm.cart", s.cartToken);
  else localStorage.removeItem("pm.cart");
  if (s.user) localStorage.setItem("pm.user", JSON.stringify(s.user));
  else localStorage.removeItem("pm.user");
};

const toView = (body: { id: string; subtotal?: number; items?: Array<any> }): CartView => ({
  id: body.id,
  subtotal: body.subtotal ?? 0,
  items: (body.items ?? []).map((i) => ({
    id: i.id,
    quantity: i.quantity ?? 0,
    lineTotal: i.lineTotal ?? 0,
    product: {
      id: i.product.id,
      title: i.product.title,
      price: i.product.price,
      image: i.product.images?.find((x: any) => x.isPrimary)?.url ?? i.product.images?.[0]?.url ?? null,
    },
  })),
});

export const useApp = create<AppState>((set, get) => ({
  token: localStorage.getItem("pm.token") ?? "",
  cartToken: localStorage.getItem("pm.cart") ?? "",
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem("pm.user") ?? "null") as SessionUser | null;
    } catch {
      return null;
    }
  })(),
  cart: null,

  async login(email, password) {
    const res = await api.auth.login({ email, password });
    await get().setAuth(res.data.token, res.data.user as SessionUser);
  },

  async register(name, email, password) {
    const res = await api.auth.register({ name, email, password });
    await get().setAuth(res.data.token, res.data.user as SessionUser);
  },

  async setAuth(token, user) {
    set({ token, user });
    persist(get());
    // мердж гостевой корзины после аутентификации
    const cartToken = get().cartToken;
    if (cartToken) {
      try {
        await api.cart.mergeCart({ token: cartToken });
        set({ cartToken: "" });
        persist(get());
      } catch {
        /* мердж не критичен */
      }
    }
  },

  logout() {
    set({ token: "", user: null, cartToken: "", cart: null });
    persist(get());
  },

  setCartToken(token) {
    set({ cartToken: token ?? "" });
    persist(get());
  },

  async loadCart() {
    const res = await api.cart.getCart();
    set({ cart: toView(res.data) });
  },

  async addToCart(productId, quantity = 1) {
    try {
      const res = await api.cart.addCartItem({ productId, quantity });
      const header = (res.headers?.["x-cart-token"] ?? res.headers?.["X-Cart-Token"]) as string | undefined;
      if (header && !get().token) get().setCartToken(header);
      set({ cart: toView(res.data) });
      return null;
    } catch (err) {
      return errorMessage(err);
    }
  },

  async setQty(itemId, quantity) {
    const res = await api.cart.updateCartItem(itemId, { quantity });
    set({ cart: toView(res.data) });
  },

  async removeItem(itemId) {
    const res = await api.cart.deleteCartItem(itemId);
    set({ cart: toView(res.data) });
  },
}));
