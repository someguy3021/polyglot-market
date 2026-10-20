// SDK-клиент: токены из localStorage (читаются на каждом запросе), Idempotency-Key (ADR-011).
import { createApiClient } from "@showcase/api-client";

const BASE_URL = (import.meta.env && import.meta.env.VITE_API_URL) || "http://127.0.0.1:8000";

let idempotencyKey;
export function setOrderIdempotencyKey(key) {
  idempotencyKey = key;
}

export const api = createApiClient({
  baseURL: BASE_URL,
  getToken: () => localStorage.getItem("pm.token") || undefined,
  getCartToken: () => localStorage.getItem("pm.cart") || undefined,
  getIdempotencyKey: () => idempotencyKey,
});

export function errorMessage(err) {
  const details = err && err.response && err.response.data && err.response.data.details;
  if (details) {
    const first = Object.values(details).flat()[0];
    if (first) return String(first);
  }
  return (err && err.response && err.response.data && err.response.data.message) || "Ошибка запроса";
}
