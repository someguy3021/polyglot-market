// Минимальный HTTP-клиент сценариев: JSON-запрос + строгие ожидания статуса.
export interface ApiResponse<T = unknown> {
  status: number;
  headers: Headers;
  body: T;
  raw: string;
}

const BASE_URL = process.env.CONFORMANCE_BASE_URL ?? "http://127.0.0.1:8000";

export function baseUrl(): string {
  return BASE_URL;
}

export async function call(
  method: string,
  path: string,
  opts: {
    token?: string;
    cartToken?: string;
    idempotencyKey?: string;
    body?: unknown;
    form?: FormData;
  } = {},
): Promise<ApiResponse> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.cartToken) headers["X-Cart-Token"] = opts.cartToken;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
  let payload: BodyInit | undefined;
  if (opts.form) {
    payload = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(opts.body);
  }
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  const raw = await res.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = raw;
  }
  return { status: res.status, headers: res.headers, body, raw };
}

export class AssertionError extends Error {}

export function expectStatus(res: ApiResponse, expected: number | number[]): void {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(res.status)) {
    throw new AssertionError(`ожидался статус ${allowed.join("|")}, получен ${res.status}: ${String(res.raw).slice(0, 200)}`);
  }
}

export function expect(cond: unknown, message: string): void {
  if (!cond) throw new AssertionError(message);
}
