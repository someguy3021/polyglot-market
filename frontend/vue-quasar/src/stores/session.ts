// Сессия: JWT, профиль, гостевой cart-токен. Токены живут в localStorage —
// SDK читает их на каждом запросе (src/api/client.ts), стор — реактивное зеркало.
import { defineStore } from "pinia";
import { api, call, errorMessage } from "../api/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "moderator" | "admin";
  blocked: boolean;
  shopName: string | null;
  createdAt: string;
}

const TOKEN_KEY = "pm.token";
const CART_KEY = "pm.cart";
const USER_KEY = "pm.user";

function readUser(): SessionUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? "null") as SessionUser | null;
  } catch {
    return null;
  }
}

export const useSession = defineStore("session", {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) ?? "",
    cartToken: localStorage.getItem(CART_KEY) ?? "",
    user: readUser(),
  }),
  getters: {
    isAuth: (s) => Boolean(s.token && s.user),
    role: (s) => s.user?.role ?? null,
    isSeller: (s) => s.user?.role === "seller",
    isModerator: (s) => s.user?.role === "moderator",
    isAdmin: (s) => s.user?.role === "admin",
  },
  actions: {
    persist() {
      if (this.token) localStorage.setItem(TOKEN_KEY, this.token);
      else localStorage.removeItem(TOKEN_KEY);
      if (this.cartToken) localStorage.setItem(CART_KEY, this.cartToken);
      else localStorage.removeItem(CART_KEY);
      if (this.user) localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      else localStorage.removeItem(USER_KEY);
    },
    noteCartToken(headerValue: unknown) {
      const value = headerValue as string | undefined;
      if (value && !this.token) {
        this.cartToken = value;
        this.persist();
      }
    },
    async login(email: string, password: string) {
      const res = await api.auth.login({ email, password });
      this.token = res.data.token;
      this.user = res.data.user as SessionUser;
      this.persist();
      await this.mergeGuestCart();
    },
    async register(name: string, email: string, password: string) {
      const res = await api.auth.register({ name, email, password });
      this.token = res.data.token;
      this.user = res.data.user as SessionUser;
      this.persist();
      await this.mergeGuestCart();
    },
    async fetchMe() {
      if (!this.token) return;
      this.user = (await call(api.auth.getMe())) as SessionUser;
      this.persist();
    },
    async mergeGuestCart() {
      if (!this.cartToken) return;
      try {
        await call(api.cart.mergeCart({ token: this.cartToken }));
        localStorage.removeItem(CART_KEY);
        this.cartToken = "";
        this.persist();
      } catch {
        // мердж не критичен: гостевая корзина просто не перенесётся
      }
    },
    logout() {
      this.token = "";
      this.user = null;
      this.cartToken = "";
      this.persist();
    },
  },
});

export { errorMessage };
