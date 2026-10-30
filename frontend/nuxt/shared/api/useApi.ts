// Composable поверх SDK: единая точка API для всех компонентов (SSR + клиент).
import { createApiClient, type ApiClient } from "@showcase/api-client";

let idempotencyKey: string | undefined;
export function setOrderIdempotencyKey(key: string | undefined) {
  idempotencyKey = key;
}

export function useApi(): ApiClient {
  const config = useRuntimeConfig();
  return createApiClient({
    baseURL: (import.meta.client && window.API_URL) || config.public.apiUrl,
    getToken: () => (import.meta.client ? localStorage.getItem("pm.token") ?? undefined : undefined),
    getCartToken: () => (import.meta.client ? localStorage.getItem("pm.cart") ?? undefined : undefined),
    getIdempotencyKey: () => idempotencyKey,
  });
}

export function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string; details?: Record<string, string[]> } } };
  const details = e?.response?.data?.details;
  const first = details ? Object.values(details).flat()[0] : undefined;
  return first ?? e?.response?.data?.message ?? "Ошибка запроса";
}
