// Единый клиент SDK для приложения: baseURL из env, токены читаются на каждом запросе.
// Idempotency-Key для POST /orders — одноразовый, выставляется чекаутом (ADR-011).
import { createApiClient, type ApiClient } from "@showcase/api-client";

const BASE_URL: string =
  (window as { API_URL?: string }).API_URL ??
  (import.meta.env?.VITE_API_URL as string) ??
  "http://127.0.0.1:8000";

let idempotencyKey: string | undefined;

export function setOrderIdempotencyKey(key: string | undefined): void {
  idempotencyKey = key;
}

export const api: ApiClient = createApiClient({
  baseURL: BASE_URL,
  getToken: () => localStorage.getItem("pm.token") ?? undefined,
  getCartToken: () => localStorage.getItem("pm.cart") ?? undefined,
  getIdempotencyKey: () => idempotencyKey,
});

export const apiBaseUrl = BASE_URL;

/** Достаёт тело ответа из AxiosPromise и заголовки, если нужны (X-Cart-Token). */
export async function call<T>(promise: Promise<{ data: T; headers?: Record<string, unknown> }>) {
  const res = await promise;
  return res.data;
}

export function errorMessage(err: unknown): string {
  const anyErr = err as { response?: { data?: { message?: string; details?: Record<string, string[]> } } };
  const details = anyErr?.response?.data?.details;
  if (details) {
    const first = Object.values(details).flat()[0];
    if (first) return first;
  }
  return anyErr?.response?.data?.message ?? "Ошибка запроса";
}
