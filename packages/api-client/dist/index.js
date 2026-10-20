"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiClient = createApiClient;
// Обёртка над сгенерированным клиентом (правки руками — только здесь, ADR-004).
// Единая точка сборки SDK для всех 7 фронтендов: baseURL + перехватчики авторизации.
const axios_1 = __importDefault(require("axios"));
const index_1 = require("./generated/index");
function createApiClient(options) {
    const http = axios_1.default.create({ baseURL: options.baseURL });
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
        auth: new index_1.AuthApi(undefined, "", http),
        catalog: new index_1.CatalogApi(undefined, "", http),
        cart: new index_1.CartApi(undefined, "", http),
        orders: new index_1.OrdersApi(undefined, "", http),
        seller: new index_1.SellerApi(undefined, "", http),
        moderation: new index_1.ModerationApi(undefined, "", http),
        admin: new index_1.AdminApi(undefined, "", http),
        service: new index_1.ServiceApi(undefined, "", http),
    };
}
__exportStar(require("./generated/index"), exports);
