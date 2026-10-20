// Обёртка над сгенерированным клиентом (правки руками — только здесь, ADR-004).
// Единая точка сборки SDK для всех 7 фронтендов: baseURL + перехватчики авторизации.
import axios from "axios";
import { AdminApi, AuthApi, CartApi, CatalogApi, ModerationApi, OrdersApi, SellerApi, ServiceApi, } from "./generated/index";
export function createApiClient(options) {
    const http = axios.create({ baseURL: options.baseURL });
    http.interceptors.request.use((config) => {
        const token = options.getToken?.();
        const cartToken = options.getCartToken?.();
        if (token)
            config.headers.Authorization = `Bearer ${token}`;
        else if (cartToken)
            config.headers["X-Cart-Token"] = cartToken;
        const idempotencyKey = options.getIdempotencyKey?.();
        if (idempotencyKey)
            config.headers["Idempotency-Key"] = idempotencyKey;
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
