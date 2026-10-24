// Сессия на сигналах: токены в localStorage (читает SDK), состояние — signal.
import { Injectable, signal } from "@angular/core";
import { createApiClient } from "@showcase/api-client";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "moderator" | "admin";
  blocked: boolean;
  shopName: string | null;
  createdAt: string;
}

let idempotencyKey: string | undefined;

// Адрес бекенда: runtime /config.js (docker) или дефолт :8000. Один источник —
// SDK и прямые fetch'и (checkout) обязаны читать его, никаких захардкоженных URL.
export const API_BASE =
  (typeof window !== "undefined" && window.API_URL) || "http://127.0.0.1:8000";

@Injectable({ providedIn: "root" })
export class SessionService {
  readonly apiBase = API_BASE;
  readonly api = createApiClient({
    baseURL: API_BASE,
    getToken: () => localStorage.getItem("pm.token") ?? undefined,
    getCartToken: () => localStorage.getItem("pm.cart") ?? undefined,
    getIdempotencyKey: () => idempotencyKey,
  });

  readonly user = signal<SessionUser | null>(this.readUser());
  readonly cart = signal<{ subtotal: number; count: number; items: any[] }>({ subtotal: 0, count: 0, items: [] });

  setOrderIdempotencyKey(key: string | undefined) {
    idempotencyKey = key;
  }

  private readUser(): SessionUser | null {
    try {
      return JSON.parse(localStorage.getItem("pm.user") ?? "null") as SessionUser | null;
    } catch {
      return null;
    }
  }

  async afterAuth(token: string, user: SessionUser) {
    localStorage.setItem("pm.token", token);
    localStorage.setItem("pm.user", JSON.stringify(user));
    this.user.set(user);
    const cartToken = localStorage.getItem("pm.cart");
    if (cartToken) {
      try {
        await this.api.cart.mergeCart({ token: cartToken });
        localStorage.removeItem("pm.cart");
      } catch {
        /* мердж не критичен */
      }
    }
    await this.loadCart();
  }

  login(email: string, password: string) {
    return this.api.auth.login({ email, password }).then((r) => this.afterAuth(r.data.token, r.data.user as SessionUser));
  }

  register(name: string, email: string, password: string) {
    return this.api.auth.register({ name, email, password }).then((r) => this.afterAuth(r.data.token, r.data.user as SessionUser));
  }

  logout() {
    ["pm.token", "pm.user", "pm.cart"].forEach((k) => localStorage.removeItem(k));
    this.user.set(null);
    this.cart.set({ subtotal: 0, count: 0, items: [] });
  }

  async loadCart() {
    const res = await this.api.cart.getCart();
    const body = res.data as any;
    this.cart.set({
      subtotal: body.subtotal ?? 0,
      count: (body.items ?? []).reduce((acc: number, i: any) => acc + (i.quantity ?? 0), 0),
      items: body.items ?? [],
    });
  }

  async addToCart(productId: string, quantity = 1): Promise<string | null> {
    try {
      const res = await this.api.cart.addCartItem({ productId, quantity });
      const header = (res.headers?.["x-cart-token"] ?? res.headers?.["X-Cart-Token"]) as string | undefined;
      if (header) localStorage.setItem("pm.cart", header);
      await this.loadCart();
      return null;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      return e?.response?.data?.message ?? "Ошибка запроса";
    }
  }
}

export function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string; details?: Record<string, string[]> } } };
  const details = e?.response?.data?.details;
  const first = details ? Object.values(details).flat()[0] : undefined;
  return first ?? e?.response?.data?.message ?? "Ошибка запроса";
}
