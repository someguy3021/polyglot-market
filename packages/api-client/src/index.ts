// Обёртка над сгенерированным клиентом (правки руками — только здесь, ADR-004).
// Единая точка сборки SDK для всех 7 фронтендов: baseURL + перехватчики авторизации.
import axios, { type AxiosInstance } from "axios";
import {
  AdminApi,
  AuthApi,
  CartApi,
  CatalogApi,
  ModerationApi,
  OrdersApi,
  SellerApi,
  ServiceApi,
} from "./generated/index";

export interface ApiClientOptions {
  /** Адрес бекенда: http://localhost:8000 (Laravel) или http://localhost:3000 (NestJS) */
  baseURL: string;
  /** Отдаёт текущий JWT (если авторизован) */
  getToken?: () => string | undefined;
  /** Отдаёт токен гостевой корзины (если нет авторизации) */
  getCartToken?: () => string | undefined;
  /** Отдаёт Idempotency-Key для POST /orders (см. ADR-011) */
  getIdempotencyKey?: () => string | undefined;
}

export interface ApiClient {
  http: AxiosInstance;
  auth: AuthApi;
  catalog: CatalogApi;
  cart: CartApi;
  orders: OrdersApi;
  seller: SellerApi;
  moderation: ModerationApi;
  admin: AdminApi;
  service: ServiceApi;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const http = axios.create({ baseURL: options.baseURL });

  http.interceptors.request.use((config) => {
    const token = options.getToken?.();
    const cartToken = options.getCartToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    else if (cartToken) config.headers["X-Cart-Token"] = cartToken;
    const idempotencyKey = options.getIdempotencyKey?.();
    if (idempotencyKey) config.headers["Idempotency-Key"] = idempotencyKey;
    return config;
  });

  return {
    http,
    auth: new AuthApi(undefined, "", http),
    catalog: new CatalogApi(undefined, "", http),
    cart: new CartApi(undefined, "", http),
    orders: new OrdersApi(undefined, "", http),
    seller: new SellerApi(undefined, "", http),
    moderation: new ModerationApi(undefined, "", http),
    admin: new AdminApi(undefined, "", http),
    service: new ServiceApi(undefined, "", http),
  };
}

export * from "./generated/index";
