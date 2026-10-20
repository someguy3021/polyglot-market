// SDK-клиент для клиентских компонентов (корзина/checkout/заказы/auth).
"use client";

import { createApiClient, type ApiClient } from "@showcase/api-client";

let idempotencyKey: string | undefined;
export function setOrderIdempotencyKey(key: string | undefined) {
  idempotencyKey = key;
}

export const api: ApiClient = createApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
  getToken: () => (typeof localStorage !== "undefined" ? localStorage.getItem("pm.token") ?? undefined : undefined),
  getCartToken: () => (typeof localStorage !== "undefined" ? localStorage.getItem("pm.cart") ?? undefined : undefined),
  getIdempotencyKey: () => idempotencyKey,
});

export function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string; details?: Record<string, string[]> } } };
  const details = e?.response?.data?.details;
  const first = details ? Object.values(details).flat()[0] : undefined;
  return first ?? e?.response?.data?.message ?? "Ошибка запроса";
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "seller" | "moderator" | "admin";
  blocked: boolean;
  shopName: string | null;
  createdAt: string;
}

export function readUser(): SessionUser | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("pm.user") ?? "null") as SessionUser | null;
  } catch {
    return null;
  }
}
