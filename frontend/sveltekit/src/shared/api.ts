// SDK-клиент SvelteKit: браузерные токены из localStorage (SSR-безопасно — на сервере их нет).
import { createApiClient } from "@showcase/api-client";

const BASE_URL =
  (typeof window !== "undefined" && window.API_URL) ||
  (import.meta.env && import.meta.env.VITE_API_URL) ||
  "http://127.0.0.1:8000";

let idempotencyKey: string | undefined;
export function setOrderIdempotencyKey(key: string | undefined) {
  idempotencyKey = key;
}

export const api = createApiClient({
  baseURL: BASE_URL,
  getToken: () => (typeof localStorage !== "undefined" ? localStorage.getItem("pm.token") ?? undefined : undefined),
  getCartToken: () => (typeof localStorage !== "undefined" ? localStorage.getItem("pm.cart") ?? undefined : undefined),
  getIdempotencyKey: () => idempotencyKey,
});

export const apiBaseUrl = BASE_URL;

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
