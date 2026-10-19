import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions } from '../configuration'
import type { Middleware } from '../middleware';

import { AuthToken } from '../models/AuthToken';
import { Cart } from '../models/Cart';
import { CartItem } from '../models/CartItem';
import { CartItemInput } from '../models/CartItemInput';
import { Category } from '../models/Category';
import { GetHealth200Response } from '../models/GetHealth200Response';
import { InlineObject } from '../models/InlineObject';
import { ListCategories200Response } from '../models/ListCategories200Response';
import { ListProducts200Response } from '../models/ListProducts200Response';
import { ListPromoCodes200Response } from '../models/ListPromoCodes200Response';
import { ListSellerOrderItems200Response } from '../models/ListSellerOrderItems200Response';
import { ListShippingMethods200Response } from '../models/ListShippingMethods200Response';
import { ListUsers200Response } from '../models/ListUsers200Response';
import { LoginInput } from '../models/LoginInput';
import { MergeCartRequest } from '../models/MergeCartRequest';
import { ModelError } from '../models/ModelError';
import { Order } from '../models/Order';
import { OrderInput } from '../models/OrderInput';
import { OrderItem } from '../models/OrderItem';
import { OrderList } from '../models/OrderList';
import { OrderStatus } from '../models/OrderStatus';
import { PaginationMeta } from '../models/PaginationMeta';
import { Product } from '../models/Product';
import { ProductImage } from '../models/ProductImage';
import { ProductInput } from '../models/ProductInput';
import { ProductList } from '../models/ProductList';
import { PromoCode } from '../models/PromoCode';
import { PromoCodeInput } from '../models/PromoCodeInput';
import { PromoValidation } from '../models/PromoValidation';
import { RegisterInput } from '../models/RegisterInput';
import { RejectProductRequest } from '../models/RejectProductRequest';
import { SellerBrief } from '../models/SellerBrief';
import { SellerOrderItem } from '../models/SellerOrderItem';
import { ShippingAddress } from '../models/ShippingAddress';
import { ShippingMethod } from '../models/ShippingMethod';
import { UpdateCartItemRequest } from '../models/UpdateCartItemRequest';
import { UpdateOrderStatusRequest } from '../models/UpdateOrderStatusRequest';
import { UpdateUserRoleRequest } from '../models/UpdateUserRoleRequest';
import { User } from '../models/User';
import { UserRole } from '../models/UserRole';
import { ValidatePromoRequest } from '../models/ValidatePromoRequest';

import { ObservableAdminApi } from "./ObservableAPI";
import { AdminApiRequestFactory, AdminApiResponseProcessor} from "../apis/AdminApi";

export interface AdminApiCreatePromoCodeRequest {
    /**
     * 
     * @type PromoCodeInput
     * @memberof AdminApicreatePromoCode
     */
    promoCodeInput: PromoCodeInput
}

export interface AdminApiDeleteProductRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AdminApideleteProduct
     */
    id: string
}

export interface AdminApiListAllOrdersRequest {
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof AdminApilistAllOrders
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 20
     * @type number
     * @memberof AdminApilistAllOrders
     */
    perPage?: number
    /**
     * 
     * Defaults to: undefined
     * @type OrderStatus
     * @memberof AdminApilistAllOrders
     */
    status?: OrderStatus
}

export interface AdminApiListPromoCodesRequest {
}

export interface AdminApiListUsersRequest {
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof AdminApilistUsers
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 20
     * @type number
     * @memberof AdminApilistUsers
     */
    perPage?: number
    /**
     * 
     * Defaults to: undefined
     * @type UserRole
     * @memberof AdminApilistUsers
     */
    role?: UserRole
}

export interface AdminApiUpdateOrderStatusRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AdminApiupdateOrderStatus
     */
    id: string
    /**
     * 
     * @type UpdateOrderStatusRequest
     * @memberof AdminApiupdateOrderStatus
     */
    updateOrderStatusRequest: UpdateOrderStatusRequest
}

export interface AdminApiUpdateUserRoleRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof AdminApiupdateUserRole
     */
    id: string
    /**
     * 
     * @type UpdateUserRoleRequest
     * @memberof AdminApiupdateUserRole
     */
    updateUserRoleRequest: UpdateUserRoleRequest
}

export class ObjectAdminApi {
    private api: ObservableAdminApi

    public constructor(configuration: Configuration, requestFactory?: AdminApiRequestFactory, responseProcessor?: AdminApiResponseProcessor) {
        this.api = new ObservableAdminApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Создать промокод
     * @param param the request object
     */
    public createPromoCodeWithHttpInfo(param: AdminApiCreatePromoCodeRequest, options?: ConfigurationOptions): Promise<HttpInfo<PromoCode>> {
        return this.api.createPromoCodeWithHttpInfo(param.promoCodeInput,  options).toPromise();
    }

    /**
     * Создать промокод
     * @param param the request object
     */
    public createPromoCode(param: AdminApiCreatePromoCodeRequest, options?: ConfigurationOptions): Promise<PromoCode> {
        return this.api.createPromoCode(param.promoCodeInput,  options).toPromise();
    }

    /**
     * Удалить товар (жёстко)
     * @param param the request object
     */
    public deleteProductWithHttpInfo(param: AdminApiDeleteProductRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.deleteProductWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Удалить товар (жёстко)
     * @param param the request object
     */
    public deleteProduct(param: AdminApiDeleteProductRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.deleteProduct(param.id,  options).toPromise();
    }

    /**
     * Все заказы (админ)
     * @param param the request object
     */
    public listAllOrdersWithHttpInfo(param: AdminApiListAllOrdersRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<OrderList>> {
        return this.api.listAllOrdersWithHttpInfo(param.page, param.perPage, param.status,  options).toPromise();
    }

    /**
     * Все заказы (админ)
     * @param param the request object
     */
    public listAllOrders(param: AdminApiListAllOrdersRequest = {}, options?: ConfigurationOptions): Promise<OrderList> {
        return this.api.listAllOrders(param.page, param.perPage, param.status,  options).toPromise();
    }

    /**
     * Промокоды (админ)
     * @param param the request object
     */
    public listPromoCodesWithHttpInfo(param: AdminApiListPromoCodesRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ListPromoCodes200Response>> {
        return this.api.listPromoCodesWithHttpInfo( options).toPromise();
    }

    /**
     * Промокоды (админ)
     * @param param the request object
     */
    public listPromoCodes(param: AdminApiListPromoCodesRequest = {}, options?: ConfigurationOptions): Promise<ListPromoCodes200Response> {
        return this.api.listPromoCodes( options).toPromise();
    }

    /**
     * Пользователи (админ)
     * @param param the request object
     */
    public listUsersWithHttpInfo(param: AdminApiListUsersRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ListUsers200Response>> {
        return this.api.listUsersWithHttpInfo(param.page, param.perPage, param.role,  options).toPromise();
    }

    /**
     * Пользователи (админ)
     * @param param the request object
     */
    public listUsers(param: AdminApiListUsersRequest = {}, options?: ConfigurationOptions): Promise<ListUsers200Response> {
        return this.api.listUsers(param.page, param.perPage, param.role,  options).toPromise();
    }

    /**
     * Допустимые переходы: new→paid|cancelled, paid→shipped|cancelled, shipped→done, done/cancelled — терминальные.
     * Сменить статус заказа
     * @param param the request object
     */
    public updateOrderStatusWithHttpInfo(param: AdminApiUpdateOrderStatusRequest, options?: ConfigurationOptions): Promise<HttpInfo<Order>> {
        return this.api.updateOrderStatusWithHttpInfo(param.id, param.updateOrderStatusRequest,  options).toPromise();
    }

    /**
     * Допустимые переходы: new→paid|cancelled, paid→shipped|cancelled, shipped→done, done/cancelled — терминальные.
     * Сменить статус заказа
     * @param param the request object
     */
    public updateOrderStatus(param: AdminApiUpdateOrderStatusRequest, options?: ConfigurationOptions): Promise<Order> {
        return this.api.updateOrderStatus(param.id, param.updateOrderStatusRequest,  options).toPromise();
    }

    /**
     * Назначить роль пользователю
     * @param param the request object
     */
    public updateUserRoleWithHttpInfo(param: AdminApiUpdateUserRoleRequest, options?: ConfigurationOptions): Promise<HttpInfo<User>> {
        return this.api.updateUserRoleWithHttpInfo(param.id, param.updateUserRoleRequest,  options).toPromise();
    }

    /**
     * Назначить роль пользователю
     * @param param the request object
     */
    public updateUserRole(param: AdminApiUpdateUserRoleRequest, options?: ConfigurationOptions): Promise<User> {
        return this.api.updateUserRole(param.id, param.updateUserRoleRequest,  options).toPromise();
    }

}

import { ObservableAuthApi } from "./ObservableAPI";
import { AuthApiRequestFactory, AuthApiResponseProcessor} from "../apis/AuthApi";

export interface AuthApiGetMeRequest {
}

export interface AuthApiLoginRequest {
    /**
     * 
     * @type LoginInput
     * @memberof AuthApilogin
     */
    loginInput: LoginInput
}

export interface AuthApiRegisterRequest {
    /**
     * 
     * @type RegisterInput
     * @memberof AuthApiregister
     */
    registerInput: RegisterInput
}

export class ObjectAuthApi {
    private api: ObservableAuthApi

    public constructor(configuration: Configuration, requestFactory?: AuthApiRequestFactory, responseProcessor?: AuthApiResponseProcessor) {
        this.api = new ObservableAuthApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Текущий пользователь
     * @param param the request object
     */
    public getMeWithHttpInfo(param: AuthApiGetMeRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<User>> {
        return this.api.getMeWithHttpInfo( options).toPromise();
    }

    /**
     * Текущий пользователь
     * @param param the request object
     */
    public getMe(param: AuthApiGetMeRequest = {}, options?: ConfigurationOptions): Promise<User> {
        return this.api.getMe( options).toPromise();
    }

    /**
     * Вход по email и паролю
     * @param param the request object
     */
    public loginWithHttpInfo(param: AuthApiLoginRequest, options?: ConfigurationOptions): Promise<HttpInfo<AuthToken>> {
        return this.api.loginWithHttpInfo(param.loginInput,  options).toPromise();
    }

    /**
     * Вход по email и паролю
     * @param param the request object
     */
    public login(param: AuthApiLoginRequest, options?: ConfigurationOptions): Promise<AuthToken> {
        return this.api.login(param.loginInput,  options).toPromise();
    }

    /**
     * Создаёт пользователя с ролью `buyer`. Продавцов/модераторов назначает админ.
     * Регистрация покупателя
     * @param param the request object
     */
    public registerWithHttpInfo(param: AuthApiRegisterRequest, options?: ConfigurationOptions): Promise<HttpInfo<AuthToken>> {
        return this.api.registerWithHttpInfo(param.registerInput,  options).toPromise();
    }

    /**
     * Создаёт пользователя с ролью `buyer`. Продавцов/модераторов назначает админ.
     * Регистрация покупателя
     * @param param the request object
     */
    public register(param: AuthApiRegisterRequest, options?: ConfigurationOptions): Promise<AuthToken> {
        return this.api.register(param.registerInput,  options).toPromise();
    }

}

import { ObservableCartApi } from "./ObservableAPI";
import { CartApiRequestFactory, CartApiResponseProcessor} from "../apis/CartApi";

export interface CartApiAddCartItemRequest {
    /**
     * 
     * @type CartItemInput
     * @memberof CartApiaddCartItem
     */
    cartItemInput: CartItemInput
    /**
     * Токен гостевой корзины (игнорируется при Bearer-авторизации)
     * Defaults to: undefined
     * @type string
     * @memberof CartApiaddCartItem
     */
    xCartToken?: string
}

export interface CartApiDeleteCartItemRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof CartApideleteCartItem
     */
    id: string
    /**
     * Токен гостевой корзины (игнорируется при Bearer-авторизации)
     * Defaults to: undefined
     * @type string
     * @memberof CartApideleteCartItem
     */
    xCartToken?: string
}

export interface CartApiGetCartRequest {
}

export interface CartApiMergeCartRequest {
    /**
     * 
     * @type MergeCartRequest
     * @memberof CartApimergeCart
     */
    mergeCartRequest: MergeCartRequest
}

export interface CartApiUpdateCartItemRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof CartApiupdateCartItem
     */
    id: string
    /**
     * 
     * @type UpdateCartItemRequest
     * @memberof CartApiupdateCartItem
     */
    updateCartItemRequest: UpdateCartItemRequest
    /**
     * Токен гостевой корзины (игнорируется при Bearer-авторизации)
     * Defaults to: undefined
     * @type string
     * @memberof CartApiupdateCartItem
     */
    xCartToken?: string
}

export class ObjectCartApi {
    private api: ObservableCartApi

    public constructor(configuration: Configuration, requestFactory?: CartApiRequestFactory, responseProcessor?: CartApiResponseProcessor) {
        this.api = new ObservableCartApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Гостю в ответе заголовок `X-Cart-Token` — сохранить и слать далее.
     * Добавить товар в корзину
     * @param param the request object
     */
    public addCartItemWithHttpInfo(param: CartApiAddCartItemRequest, options?: ConfigurationOptions): Promise<HttpInfo<Cart>> {
        return this.api.addCartItemWithHttpInfo(param.cartItemInput, param.xCartToken,  options).toPromise();
    }

    /**
     * Гостю в ответе заголовок `X-Cart-Token` — сохранить и слать далее.
     * Добавить товар в корзину
     * @param param the request object
     */
    public addCartItem(param: CartApiAddCartItemRequest, options?: ConfigurationOptions): Promise<Cart> {
        return this.api.addCartItem(param.cartItemInput, param.xCartToken,  options).toPromise();
    }

    /**
     * Удалить позицию из корзины
     * @param param the request object
     */
    public deleteCartItemWithHttpInfo(param: CartApiDeleteCartItemRequest, options?: ConfigurationOptions): Promise<HttpInfo<Cart>> {
        return this.api.deleteCartItemWithHttpInfo(param.id, param.xCartToken,  options).toPromise();
    }

    /**
     * Удалить позицию из корзины
     * @param param the request object
     */
    public deleteCartItem(param: CartApiDeleteCartItemRequest, options?: ConfigurationOptions): Promise<Cart> {
        return this.api.deleteCartItem(param.id, param.xCartToken,  options).toPromise();
    }

    /**
     * Для авторизованного — аккаунтная корзина. Для гостя — по заголовку `X-Cart-Token` (UUID из ответа `POST /cart/items` при первом добавлении, хранится на клиенте). 
     * Текущая корзина
     * @param param the request object
     */
    public getCartWithHttpInfo(param: CartApiGetCartRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<Cart>> {
        return this.api.getCartWithHttpInfo( options).toPromise();
    }

    /**
     * Для авторизованного — аккаунтная корзина. Для гостя — по заголовку `X-Cart-Token` (UUID из ответа `POST /cart/items` при первом добавлении, хранится на клиенте). 
     * Текущая корзина
     * @param param the request object
     */
    public getCart(param: CartApiGetCartRequest = {}, options?: ConfigurationOptions): Promise<Cart> {
        return this.api.getCart( options).toPromise();
    }

    /**
     * Вызывается после логина/регистрации с тем `X-Cart-Token`, под которым гость собирал корзину. Позиции сливаются по товару (количества суммируются до 99), гостевая корзина помечается merged. 
     * Мердж гостевой корзины в аккаунтную
     * @param param the request object
     */
    public mergeCartWithHttpInfo(param: CartApiMergeCartRequest, options?: ConfigurationOptions): Promise<HttpInfo<Cart>> {
        return this.api.mergeCartWithHttpInfo(param.mergeCartRequest,  options).toPromise();
    }

    /**
     * Вызывается после логина/регистрации с тем `X-Cart-Token`, под которым гость собирал корзину. Позиции сливаются по товару (количества суммируются до 99), гостевая корзина помечается merged. 
     * Мердж гостевой корзины в аккаунтную
     * @param param the request object
     */
    public mergeCart(param: CartApiMergeCartRequest, options?: ConfigurationOptions): Promise<Cart> {
        return this.api.mergeCart(param.mergeCartRequest,  options).toPromise();
    }

    /**
     * Изменить количество позиции
     * @param param the request object
     */
    public updateCartItemWithHttpInfo(param: CartApiUpdateCartItemRequest, options?: ConfigurationOptions): Promise<HttpInfo<Cart>> {
        return this.api.updateCartItemWithHttpInfo(param.id, param.updateCartItemRequest, param.xCartToken,  options).toPromise();
    }

    /**
     * Изменить количество позиции
     * @param param the request object
     */
    public updateCartItem(param: CartApiUpdateCartItemRequest, options?: ConfigurationOptions): Promise<Cart> {
        return this.api.updateCartItem(param.id, param.updateCartItemRequest, param.xCartToken,  options).toPromise();
    }

}

import { ObservableCatalogApi } from "./ObservableAPI";
import { CatalogApiRequestFactory, CatalogApiResponseProcessor} from "../apis/CatalogApi";

export interface CatalogApiGetProductRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof CatalogApigetProduct
     */
    id: string
}

export interface CatalogApiListCategoriesRequest {
}

export interface CatalogApiListProductsRequest {
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof CatalogApilistProducts
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 20
     * @type number
     * @memberof CatalogApilistProducts
     */
    perPage?: number
    /**
     * Slug категории
     * Defaults to: undefined
     * @type string
     * @memberof CatalogApilistProducts
     */
    category?: string
    /**
     * Slug магазина продавца
     * Defaults to: undefined
     * @type string
     * @memberof CatalogApilistProducts
     */
    seller?: string
    /**
     * Полнотекстовый поиск по названию (pg_trgm)
     * Defaults to: undefined
     * @type string
     * @memberof CatalogApilistProducts
     */
    q?: string
    /**
     * 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof CatalogApilistProducts
     */
    priceMin?: number
    /**
     * 
     * Minimum: 0
     * Defaults to: undefined
     * @type number
     * @memberof CatalogApilistProducts
     */
    priceMax?: number
    /**
     * 
     * Defaults to: &#39;newest&#39;
     * @type &#39;newest&#39; | &#39;oldest&#39; | &#39;price_asc&#39; | &#39;price_desc&#39;
     * @memberof CatalogApilistProducts
     */
    sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc'
}

export class ObjectCatalogApi {
    private api: ObservableCatalogApi

    public constructor(configuration: Configuration, requestFactory?: CatalogApiRequestFactory, responseProcessor?: CatalogApiResponseProcessor) {
        this.api = new ObservableCatalogApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Карточка товара
     * @param param the request object
     */
    public getProductWithHttpInfo(param: CatalogApiGetProductRequest, options?: ConfigurationOptions): Promise<HttpInfo<Product>> {
        return this.api.getProductWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Карточка товара
     * @param param the request object
     */
    public getProduct(param: CatalogApiGetProductRequest, options?: ConfigurationOptions): Promise<Product> {
        return this.api.getProduct(param.id,  options).toPromise();
    }

    /**
     * Категории каталога
     * @param param the request object
     */
    public listCategoriesWithHttpInfo(param: CatalogApiListCategoriesRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ListCategories200Response>> {
        return this.api.listCategoriesWithHttpInfo( options).toPromise();
    }

    /**
     * Категории каталога
     * @param param the request object
     */
    public listCategories(param: CatalogApiListCategoriesRequest = {}, options?: ConfigurationOptions): Promise<ListCategories200Response> {
        return this.api.listCategories( options).toPromise();
    }

    /**
     * Каталог одобренных товаров
     * @param param the request object
     */
    public listProductsWithHttpInfo(param: CatalogApiListProductsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ListProducts200Response>> {
        return this.api.listProductsWithHttpInfo(param.page, param.perPage, param.category, param.seller, param.q, param.priceMin, param.priceMax, param.sort,  options).toPromise();
    }

    /**
     * Каталог одобренных товаров
     * @param param the request object
     */
    public listProducts(param: CatalogApiListProductsRequest = {}, options?: ConfigurationOptions): Promise<ListProducts200Response> {
        return this.api.listProducts(param.page, param.perPage, param.category, param.seller, param.q, param.priceMin, param.priceMax, param.sort,  options).toPromise();
    }

}

import { ObservableModerationApi } from "./ObservableAPI";
import { ModerationApiRequestFactory, ModerationApiResponseProcessor} from "../apis/ModerationApi";

export interface ModerationApiApproveProductRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ModerationApiapproveProduct
     */
    id: string
}

export interface ModerationApiModerationQueueRequest {
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof ModerationApimoderationQueue
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 20
     * @type number
     * @memberof ModerationApimoderationQueue
     */
    perPage?: number
}

export interface ModerationApiRejectProductRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof ModerationApirejectProduct
     */
    id: string
    /**
     * 
     * @type RejectProductRequest
     * @memberof ModerationApirejectProduct
     */
    rejectProductRequest: RejectProductRequest
}

export class ObjectModerationApi {
    private api: ObservableModerationApi

    public constructor(configuration: Configuration, requestFactory?: ModerationApiRequestFactory, responseProcessor?: ModerationApiResponseProcessor) {
        this.api = new ObservableModerationApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Одобрить товар
     * @param param the request object
     */
    public approveProductWithHttpInfo(param: ModerationApiApproveProductRequest, options?: ConfigurationOptions): Promise<HttpInfo<Product>> {
        return this.api.approveProductWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Одобрить товар
     * @param param the request object
     */
    public approveProduct(param: ModerationApiApproveProductRequest, options?: ConfigurationOptions): Promise<Product> {
        return this.api.approveProduct(param.id,  options).toPromise();
    }

    /**
     * Очередь модерации товаров
     * @param param the request object
     */
    public moderationQueueWithHttpInfo(param: ModerationApiModerationQueueRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ProductList>> {
        return this.api.moderationQueueWithHttpInfo(param.page, param.perPage,  options).toPromise();
    }

    /**
     * Очередь модерации товаров
     * @param param the request object
     */
    public moderationQueue(param: ModerationApiModerationQueueRequest = {}, options?: ConfigurationOptions): Promise<ProductList> {
        return this.api.moderationQueue(param.page, param.perPage,  options).toPromise();
    }

    /**
     * Отклонить товар
     * @param param the request object
     */
    public rejectProductWithHttpInfo(param: ModerationApiRejectProductRequest, options?: ConfigurationOptions): Promise<HttpInfo<Product>> {
        return this.api.rejectProductWithHttpInfo(param.id, param.rejectProductRequest,  options).toPromise();
    }

    /**
     * Отклонить товар
     * @param param the request object
     */
    public rejectProduct(param: ModerationApiRejectProductRequest, options?: ConfigurationOptions): Promise<Product> {
        return this.api.rejectProduct(param.id, param.rejectProductRequest,  options).toPromise();
    }

}

import { ObservableOrdersApi } from "./ObservableAPI";
import { OrdersApiRequestFactory, OrdersApiResponseProcessor} from "../apis/OrdersApi";

export interface OrdersApiCreateOrderRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OrdersApicreateOrder
     */
    idempotencyKey: string
    /**
     * 
     * @type OrderInput
     * @memberof OrdersApicreateOrder
     */
    orderInput: OrderInput
}

export interface OrdersApiGetOrderRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof OrdersApigetOrder
     */
    id: string
}

export interface OrdersApiListMyOrdersRequest {
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof OrdersApilistMyOrders
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 20
     * @type number
     * @memberof OrdersApilistMyOrders
     */
    perPage?: number
}

export interface OrdersApiListShippingMethodsRequest {
}

export interface OrdersApiValidatePromoRequest {
    /**
     * 
     * @type ValidatePromoRequest
     * @memberof OrdersApivalidatePromo
     */
    validatePromoRequest: ValidatePromoRequest
}

export class ObjectOrdersApi {
    private api: ObservableOrdersApi

    public constructor(configuration: Configuration, requestFactory?: OrdersApiRequestFactory, responseProcessor?: OrdersApiResponseProcessor) {
        this.api = new ObservableOrdersApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Требует `Idempotency-Key` (UUID). Повтор того же ключа тем же пользователем возвращает исходный заказ (200, не 201). Корзина конвертируется, склад уменьшается транзакционно. 
     * Оформить заказ из корзины
     * @param param the request object
     */
    public createOrderWithHttpInfo(param: OrdersApiCreateOrderRequest, options?: ConfigurationOptions): Promise<HttpInfo<Order>> {
        return this.api.createOrderWithHttpInfo(param.idempotencyKey, param.orderInput,  options).toPromise();
    }

    /**
     * Требует `Idempotency-Key` (UUID). Повтор того же ключа тем же пользователем возвращает исходный заказ (200, не 201). Корзина конвертируется, склад уменьшается транзакционно. 
     * Оформить заказ из корзины
     * @param param the request object
     */
    public createOrder(param: OrdersApiCreateOrderRequest, options?: ConfigurationOptions): Promise<Order> {
        return this.api.createOrder(param.idempotencyKey, param.orderInput,  options).toPromise();
    }

    /**
     * Доступно владельцу, модератору и админу.
     * Заказ по id
     * @param param the request object
     */
    public getOrderWithHttpInfo(param: OrdersApiGetOrderRequest, options?: ConfigurationOptions): Promise<HttpInfo<Order>> {
        return this.api.getOrderWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Доступно владельцу, модератору и админу.
     * Заказ по id
     * @param param the request object
     */
    public getOrder(param: OrdersApiGetOrderRequest, options?: ConfigurationOptions): Promise<Order> {
        return this.api.getOrder(param.id,  options).toPromise();
    }

    /**
     * Мои заказы
     * @param param the request object
     */
    public listMyOrdersWithHttpInfo(param: OrdersApiListMyOrdersRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<OrderList>> {
        return this.api.listMyOrdersWithHttpInfo(param.page, param.perPage,  options).toPromise();
    }

    /**
     * Мои заказы
     * @param param the request object
     */
    public listMyOrders(param: OrdersApiListMyOrdersRequest = {}, options?: ConfigurationOptions): Promise<OrderList> {
        return this.api.listMyOrders(param.page, param.perPage,  options).toPromise();
    }

    /**
     * Способы доставки
     * @param param the request object
     */
    public listShippingMethodsWithHttpInfo(param: OrdersApiListShippingMethodsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ListShippingMethods200Response>> {
        return this.api.listShippingMethodsWithHttpInfo( options).toPromise();
    }

    /**
     * Способы доставки
     * @param param the request object
     */
    public listShippingMethods(param: OrdersApiListShippingMethodsRequest = {}, options?: ConfigurationOptions): Promise<ListShippingMethods200Response> {
        return this.api.listShippingMethods( options).toPromise();
    }

    /**
     * Проверка промокода
     * @param param the request object
     */
    public validatePromoWithHttpInfo(param: OrdersApiValidatePromoRequest, options?: ConfigurationOptions): Promise<HttpInfo<PromoValidation>> {
        return this.api.validatePromoWithHttpInfo(param.validatePromoRequest,  options).toPromise();
    }

    /**
     * Проверка промокода
     * @param param the request object
     */
    public validatePromo(param: OrdersApiValidatePromoRequest, options?: ConfigurationOptions): Promise<PromoValidation> {
        return this.api.validatePromo(param.validatePromoRequest,  options).toPromise();
    }

}

import { ObservableSellerApi } from "./ObservableAPI";
import { SellerApiRequestFactory, SellerApiResponseProcessor} from "../apis/SellerApi";

export interface SellerApiCreateSellerProductRequest {
    /**
     * 
     * @type ProductInput
     * @memberof SellerApicreateSellerProduct
     */
    productInput: ProductInput
}

export interface SellerApiDeleteProductImageRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SellerApideleteProductImage
     */
    id: string
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SellerApideleteProductImage
     */
    imageId: string
}

export interface SellerApiListSellerOrderItemsRequest {
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof SellerApilistSellerOrderItems
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 20
     * @type number
     * @memberof SellerApilistSellerOrderItems
     */
    perPage?: number
}

export interface SellerApiListSellerProductsRequest {
    /**
     * 
     * Minimum: 1
     * Defaults to: 1
     * @type number
     * @memberof SellerApilistSellerProducts
     */
    page?: number
    /**
     * 
     * Minimum: 1
     * Maximum: 100
     * Defaults to: 20
     * @type number
     * @memberof SellerApilistSellerProducts
     */
    perPage?: number
}

export interface SellerApiSubmitSellerProductRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SellerApisubmitSellerProduct
     */
    id: string
}

export interface SellerApiUpdateSellerProductRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SellerApiupdateSellerProduct
     */
    id: string
    /**
     * 
     * @type ProductInput
     * @memberof SellerApiupdateSellerProduct
     */
    productInput: ProductInput
}

export interface SellerApiUploadProductImageRequest {
    /**
     * 
     * Defaults to: undefined
     * @type string
     * @memberof SellerApiuploadProductImage
     */
    id: string
    /**
     * 
     * Defaults to: undefined
     * @type HttpFile
     * @memberof SellerApiuploadProductImage
     */
    file: HttpFile
}

export class ObjectSellerApi {
    private api: ObservableSellerApi

    public constructor(configuration: Configuration, requestFactory?: SellerApiRequestFactory, responseProcessor?: SellerApiResponseProcessor) {
        this.api = new ObservableSellerApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Создать товар (черновик)
     * @param param the request object
     */
    public createSellerProductWithHttpInfo(param: SellerApiCreateSellerProductRequest, options?: ConfigurationOptions): Promise<HttpInfo<Product>> {
        return this.api.createSellerProductWithHttpInfo(param.productInput,  options).toPromise();
    }

    /**
     * Создать товар (черновик)
     * @param param the request object
     */
    public createSellerProduct(param: SellerApiCreateSellerProductRequest, options?: ConfigurationOptions): Promise<Product> {
        return this.api.createSellerProduct(param.productInput,  options).toPromise();
    }

    /**
     * Удалить изображение товара
     * @param param the request object
     */
    public deleteProductImageWithHttpInfo(param: SellerApiDeleteProductImageRequest, options?: ConfigurationOptions): Promise<HttpInfo<void>> {
        return this.api.deleteProductImageWithHttpInfo(param.id, param.imageId,  options).toPromise();
    }

    /**
     * Удалить изображение товара
     * @param param the request object
     */
    public deleteProductImage(param: SellerApiDeleteProductImageRequest, options?: ConfigurationOptions): Promise<void> {
        return this.api.deleteProductImage(param.id, param.imageId,  options).toPromise();
    }

    /**
     * Продажи продавца (позиции чужих заказов по своим товарам)
     * @param param the request object
     */
    public listSellerOrderItemsWithHttpInfo(param: SellerApiListSellerOrderItemsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ListSellerOrderItems200Response>> {
        return this.api.listSellerOrderItemsWithHttpInfo(param.page, param.perPage,  options).toPromise();
    }

    /**
     * Продажи продавца (позиции чужих заказов по своим товарам)
     * @param param the request object
     */
    public listSellerOrderItems(param: SellerApiListSellerOrderItemsRequest = {}, options?: ConfigurationOptions): Promise<ListSellerOrderItems200Response> {
        return this.api.listSellerOrderItems(param.page, param.perPage,  options).toPromise();
    }

    /**
     * Товары продавца (все статусы)
     * @param param the request object
     */
    public listSellerProductsWithHttpInfo(param: SellerApiListSellerProductsRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<ProductList>> {
        return this.api.listSellerProductsWithHttpInfo(param.page, param.perPage,  options).toPromise();
    }

    /**
     * Товары продавца (все статусы)
     * @param param the request object
     */
    public listSellerProducts(param: SellerApiListSellerProductsRequest = {}, options?: ConfigurationOptions): Promise<ProductList> {
        return this.api.listSellerProducts(param.page, param.perPage,  options).toPromise();
    }

    /**
     * Отправить товар на модерацию
     * @param param the request object
     */
    public submitSellerProductWithHttpInfo(param: SellerApiSubmitSellerProductRequest, options?: ConfigurationOptions): Promise<HttpInfo<Product>> {
        return this.api.submitSellerProductWithHttpInfo(param.id,  options).toPromise();
    }

    /**
     * Отправить товар на модерацию
     * @param param the request object
     */
    public submitSellerProduct(param: SellerApiSubmitSellerProductRequest, options?: ConfigurationOptions): Promise<Product> {
        return this.api.submitSellerProduct(param.id,  options).toPromise();
    }

    /**
     * Одобренный товар при правке возвращается в draft и требует повторной модерации.
     * Изменить свой товар
     * @param param the request object
     */
    public updateSellerProductWithHttpInfo(param: SellerApiUpdateSellerProductRequest, options?: ConfigurationOptions): Promise<HttpInfo<Product>> {
        return this.api.updateSellerProductWithHttpInfo(param.id, param.productInput,  options).toPromise();
    }

    /**
     * Одобренный товар при правке возвращается в draft и требует повторной модерации.
     * Изменить свой товар
     * @param param the request object
     */
    public updateSellerProduct(param: SellerApiUpdateSellerProductRequest, options?: ConfigurationOptions): Promise<Product> {
        return this.api.updateSellerProduct(param.id, param.productInput,  options).toPromise();
    }

    /**
     * multipart/form-data, поле `file`; jpeg/png/webp до 5 МБ. Первое изображение становится primary.
     * Загрузить изображение товара
     * @param param the request object
     */
    public uploadProductImageWithHttpInfo(param: SellerApiUploadProductImageRequest, options?: ConfigurationOptions): Promise<HttpInfo<ProductImage>> {
        return this.api.uploadProductImageWithHttpInfo(param.id, param.file,  options).toPromise();
    }

    /**
     * multipart/form-data, поле `file`; jpeg/png/webp до 5 МБ. Первое изображение становится primary.
     * Загрузить изображение товара
     * @param param the request object
     */
    public uploadProductImage(param: SellerApiUploadProductImageRequest, options?: ConfigurationOptions): Promise<ProductImage> {
        return this.api.uploadProductImage(param.id, param.file,  options).toPromise();
    }

}

import { ObservableServiceApi } from "./ObservableAPI";
import { ServiceApiRequestFactory, ServiceApiResponseProcessor} from "../apis/ServiceApi";

export interface ServiceApiGetHealthRequest {
}

export class ObjectServiceApi {
    private api: ObservableServiceApi

    public constructor(configuration: Configuration, requestFactory?: ServiceApiRequestFactory, responseProcessor?: ServiceApiResponseProcessor) {
        this.api = new ObservableServiceApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Живость сервиса
     * @param param the request object
     */
    public getHealthWithHttpInfo(param: ServiceApiGetHealthRequest = {}, options?: ConfigurationOptions): Promise<HttpInfo<GetHealth200Response>> {
        return this.api.getHealthWithHttpInfo( options).toPromise();
    }

    /**
     * Живость сервиса
     * @param param the request object
     */
    public getHealth(param: ServiceApiGetHealthRequest = {}, options?: ConfigurationOptions): Promise<GetHealth200Response> {
        return this.api.getHealth( options).toPromise();
    }

}
