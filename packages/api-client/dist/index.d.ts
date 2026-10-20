import { type AxiosInstance } from "axios";
import { AdminApi, AuthApi, CartApi, CatalogApi, ModerationApi, OrdersApi, SellerApi, ServiceApi } from "./generated/index";
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
export declare function createApiClient(options: ApiClientOptions): ApiClient;
export * from "./generated/index";
