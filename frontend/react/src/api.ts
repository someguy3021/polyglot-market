// Единый SDK-клиент (та же схема, что в Quasar-фронте): токены из localStorage,
// одноразовый Idempotency-Key для POST /orders (ADR-011).
import { createApiClient, type ApiClient } from "@showcase/api-client";

const BASE_URL: string = (import.meta.env?.VITE_API_URL as string) ?? "http://127.0.0.1:8000";

let idempotencyKey: string | undefined;
export function setOrderIdempotencyKey(key: string | undefined) {
  idempotencyKey = key;
}

export const api: ApiClient = createApiClient({
  baseURL: BASE_URL,
  getToken: () => localStorage.getItem("pm.token") ?? undefined,
  getCartToken: () => localStorage.getItem("pm.cart") ?? undefined,
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

export function currentUser(): SessionUser | null {
  try {
    return JSON.parse(localStorage.getItem("pm.user") ?? "null") as SessionUser | null;
  } catch {
    return null;
  }
}
