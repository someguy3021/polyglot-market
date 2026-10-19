import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, PromiseConfigurationOptions, wrapOptions } from '../configuration'
import { PromiseMiddleware, Middleware, PromiseMiddlewareWrapper } from '../middleware';

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
import { ObservableAdminApi } from './ObservableAPI';

import { AdminApiRequestFactory, AdminApiResponseProcessor} from "../apis/AdminApi";
export class PromiseAdminApi {
    private api: ObservableAdminApi

    public constructor(
        configuration: Configuration,
        requestFactory?: AdminApiRequestFactory,
        responseProcessor?: AdminApiResponseProcessor
    ) {
        this.api = new ObservableAdminApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Создать промокод
     * @param promoCodeInput
     */
    public createPromoCodeWithHttpInfo(promoCodeInput: PromoCodeInput, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PromoCode>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createPromoCodeWithHttpInfo(promoCodeInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Создать промокод
     * @param promoCodeInput
     */
    public createPromoCode(promoCodeInput: PromoCodeInput, _options?: PromiseConfigurationOptions): Promise<PromoCode> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createPromoCode(promoCodeInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Удалить товар (жёстко)
     * @param id
     */
    public deleteProductWithHttpInfo(id: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteProductWithHttpInfo(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Удалить товар (жёстко)
     * @param id
     */
    public deleteProduct(id: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteProduct(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Все заказы (админ)
     * @param [page]
     * @param [perPage]
     * @param [status]
     */
    public listAllOrdersWithHttpInfo(page?: number, perPage?: number, status?: OrderStatus, _options?: PromiseConfigurationOptions): Promise<HttpInfo<OrderList>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listAllOrdersWithHttpInfo(page, perPage, status, observableOptions);
        return result.toPromise();
    }

    /**
     * Все заказы (админ)
     * @param [page]
     * @param [perPage]
     * @param [status]
     */
    public listAllOrders(page?: number, perPage?: number, status?: OrderStatus, _options?: PromiseConfigurationOptions): Promise<OrderList> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listAllOrders(page, perPage, status, observableOptions);
        return result.toPromise();
    }

    /**
     * Промокоды (админ)
     */
    public listPromoCodesWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<ListPromoCodes200Response>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listPromoCodesWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Промокоды (админ)
     */
    public listPromoCodes(_options?: PromiseConfigurationOptions): Promise<ListPromoCodes200Response> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listPromoCodes(observableOptions);
        return result.toPromise();
    }

    /**
     * Пользователи (админ)
     * @param [page]
     * @param [perPage]
     * @param [role]
     */
    public listUsersWithHttpInfo(page?: number, perPage?: number, role?: UserRole, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ListUsers200Response>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listUsersWithHttpInfo(page, perPage, role, observableOptions);
        return result.toPromise();
    }

    /**
     * Пользователи (админ)
     * @param [page]
     * @param [perPage]
     * @param [role]
     */
    public listUsers(page?: number, perPage?: number, role?: UserRole, _options?: PromiseConfigurationOptions): Promise<ListUsers200Response> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listUsers(page, perPage, role, observableOptions);
        return result.toPromise();
    }

    /**
     * Допустимые переходы: new→paid|cancelled, paid→shipped|cancelled, shipped→done, done/cancelled — терминальные.
     * Сменить статус заказа
     * @param id
     * @param updateOrderStatusRequest
     */
    public updateOrderStatusWithHttpInfo(id: string, updateOrderStatusRequest: UpdateOrderStatusRequest, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Order>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateOrderStatusWithHttpInfo(id, updateOrderStatusRequest, observableOptions);
        return result.toPromise();
    }

    /**
     * Допустимые переходы: new→paid|cancelled, paid→shipped|cancelled, shipped→done, done/cancelled — терминальные.
     * Сменить статус заказа
     * @param id
     * @param updateOrderStatusRequest
     */
    public updateOrderStatus(id: string, updateOrderStatusRequest: UpdateOrderStatusRequest, _options?: PromiseConfigurationOptions): Promise<Order> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateOrderStatus(id, updateOrderStatusRequest, observableOptions);
        return result.toPromise();
    }

    /**
     * Назначить роль пользователю
     * @param id
     * @param updateUserRoleRequest
     */
    public updateUserRoleWithHttpInfo(id: string, updateUserRoleRequest: UpdateUserRoleRequest, _options?: PromiseConfigurationOptions): Promise<HttpInfo<User>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateUserRoleWithHttpInfo(id, updateUserRoleRequest, observableOptions);
        return result.toPromise();
    }

    /**
     * Назначить роль пользователю
     * @param id
     * @param updateUserRoleRequest
     */
    public updateUserRole(id: string, updateUserRoleRequest: UpdateUserRoleRequest, _options?: PromiseConfigurationOptions): Promise<User> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateUserRole(id, updateUserRoleRequest, observableOptions);
        return result.toPromise();
    }


}



import { ObservableAuthApi } from './ObservableAPI';

import { AuthApiRequestFactory, AuthApiResponseProcessor} from "../apis/AuthApi";
export class PromiseAuthApi {
    private api: ObservableAuthApi

    public constructor(
        configuration: Configuration,
        requestFactory?: AuthApiRequestFactory,
        responseProcessor?: AuthApiResponseProcessor
    ) {
        this.api = new ObservableAuthApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Текущий пользователь
     */
    public getMeWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<User>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getMeWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Текущий пользователь
     */
    public getMe(_options?: PromiseConfigurationOptions): Promise<User> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getMe(observableOptions);
        return result.toPromise();
    }

    /**
     * Вход по email и паролю
     * @param loginInput
     */
    public loginWithHttpInfo(loginInput: LoginInput, _options?: PromiseConfigurationOptions): Promise<HttpInfo<AuthToken>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.loginWithHttpInfo(loginInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Вход по email и паролю
     * @param loginInput
     */
    public login(loginInput: LoginInput, _options?: PromiseConfigurationOptions): Promise<AuthToken> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.login(loginInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Создаёт пользователя с ролью `buyer`. Продавцов/модераторов назначает админ.
     * Регистрация покупателя
     * @param registerInput
     */
    public registerWithHttpInfo(registerInput: RegisterInput, _options?: PromiseConfigurationOptions): Promise<HttpInfo<AuthToken>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.registerWithHttpInfo(registerInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Создаёт пользователя с ролью `buyer`. Продавцов/модераторов назначает админ.
     * Регистрация покупателя
     * @param registerInput
     */
    public register(registerInput: RegisterInput, _options?: PromiseConfigurationOptions): Promise<AuthToken> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.register(registerInput, observableOptions);
        return result.toPromise();
    }


}



import { ObservableCartApi } from './ObservableAPI';

import { CartApiRequestFactory, CartApiResponseProcessor} from "../apis/CartApi";
export class PromiseCartApi {
    private api: ObservableCartApi

    public constructor(
        configuration: Configuration,
        requestFactory?: CartApiRequestFactory,
        responseProcessor?: CartApiResponseProcessor
    ) {
        this.api = new ObservableCartApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Гостю в ответе заголовок `X-Cart-Token` — сохранить и слать далее.
     * Добавить товар в корзину
     * @param cartItemInput
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public addCartItemWithHttpInfo(cartItemInput: CartItemInput, xCartToken?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Cart>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.addCartItemWithHttpInfo(cartItemInput, xCartToken, observableOptions);
        return result.toPromise();
    }

    /**
     * Гостю в ответе заголовок `X-Cart-Token` — сохранить и слать далее.
     * Добавить товар в корзину
     * @param cartItemInput
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public addCartItem(cartItemInput: CartItemInput, xCartToken?: string, _options?: PromiseConfigurationOptions): Promise<Cart> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.addCartItem(cartItemInput, xCartToken, observableOptions);
        return result.toPromise();
    }

    /**
     * Удалить позицию из корзины
     * @param id
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public deleteCartItemWithHttpInfo(id: string, xCartToken?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Cart>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteCartItemWithHttpInfo(id, xCartToken, observableOptions);
        return result.toPromise();
    }

    /**
     * Удалить позицию из корзины
     * @param id
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public deleteCartItem(id: string, xCartToken?: string, _options?: PromiseConfigurationOptions): Promise<Cart> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteCartItem(id, xCartToken, observableOptions);
        return result.toPromise();
    }

    /**
     * Для авторизованного — аккаунтная корзина. Для гостя — по заголовку `X-Cart-Token` (UUID из ответа `POST /cart/items` при первом добавлении, хранится на клиенте). 
     * Текущая корзина
     */
    public getCartWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<Cart>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getCartWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Для авторизованного — аккаунтная корзина. Для гостя — по заголовку `X-Cart-Token` (UUID из ответа `POST /cart/items` при первом добавлении, хранится на клиенте). 
     * Текущая корзина
     */
    public getCart(_options?: PromiseConfigurationOptions): Promise<Cart> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getCart(observableOptions);
        return result.toPromise();
    }

    /**
     * Вызывается после логина/регистрации с тем `X-Cart-Token`, под которым гость собирал корзину. Позиции сливаются по товару (количества суммируются до 99), гостевая корзина помечается merged. 
     * Мердж гостевой корзины в аккаунтную
     * @param mergeCartRequest
     */
    public mergeCartWithHttpInfo(mergeCartRequest: MergeCartRequest, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Cart>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.mergeCartWithHttpInfo(mergeCartRequest, observableOptions);
        return result.toPromise();
    }

    /**
     * Вызывается после логина/регистрации с тем `X-Cart-Token`, под которым гость собирал корзину. Позиции сливаются по товару (количества суммируются до 99), гостевая корзина помечается merged. 
     * Мердж гостевой корзины в аккаунтную
     * @param mergeCartRequest
     */
    public mergeCart(mergeCartRequest: MergeCartRequest, _options?: PromiseConfigurationOptions): Promise<Cart> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.mergeCart(mergeCartRequest, observableOptions);
        return result.toPromise();
    }

    /**
     * Изменить количество позиции
     * @param id
     * @param updateCartItemRequest
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public updateCartItemWithHttpInfo(id: string, updateCartItemRequest: UpdateCartItemRequest, xCartToken?: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Cart>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateCartItemWithHttpInfo(id, updateCartItemRequest, xCartToken, observableOptions);
        return result.toPromise();
    }

    /**
     * Изменить количество позиции
     * @param id
     * @param updateCartItemRequest
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public updateCartItem(id: string, updateCartItemRequest: UpdateCartItemRequest, xCartToken?: string, _options?: PromiseConfigurationOptions): Promise<Cart> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateCartItem(id, updateCartItemRequest, xCartToken, observableOptions);
        return result.toPromise();
    }


}



import { ObservableCatalogApi } from './ObservableAPI';

import { CatalogApiRequestFactory, CatalogApiResponseProcessor} from "../apis/CatalogApi";
export class PromiseCatalogApi {
    private api: ObservableCatalogApi

    public constructor(
        configuration: Configuration,
        requestFactory?: CatalogApiRequestFactory,
        responseProcessor?: CatalogApiResponseProcessor
    ) {
        this.api = new ObservableCatalogApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Карточка товара
     * @param id
     */
    public getProductWithHttpInfo(id: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Product>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getProductWithHttpInfo(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Карточка товара
     * @param id
     */
    public getProduct(id: string, _options?: PromiseConfigurationOptions): Promise<Product> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getProduct(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Категории каталога
     */
    public listCategoriesWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<ListCategories200Response>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listCategoriesWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Категории каталога
     */
    public listCategories(_options?: PromiseConfigurationOptions): Promise<ListCategories200Response> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listCategories(observableOptions);
        return result.toPromise();
    }

    /**
     * Каталог одобренных товаров
     * @param [page]
     * @param [perPage]
     * @param [category] Slug категории
     * @param [seller] Slug магазина продавца
     * @param [q] Полнотекстовый поиск по названию (pg_trgm)
     * @param [priceMin]
     * @param [priceMax]
     * @param [sort]
     */
    public listProductsWithHttpInfo(page?: number, perPage?: number, category?: string, seller?: string, q?: string, priceMin?: number, priceMax?: number, sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc', _options?: PromiseConfigurationOptions): Promise<HttpInfo<ListProducts200Response>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listProductsWithHttpInfo(page, perPage, category, seller, q, priceMin, priceMax, sort, observableOptions);
        return result.toPromise();
    }

    /**
     * Каталог одобренных товаров
     * @param [page]
     * @param [perPage]
     * @param [category] Slug категории
     * @param [seller] Slug магазина продавца
     * @param [q] Полнотекстовый поиск по названию (pg_trgm)
     * @param [priceMin]
     * @param [priceMax]
     * @param [sort]
     */
    public listProducts(page?: number, perPage?: number, category?: string, seller?: string, q?: string, priceMin?: number, priceMax?: number, sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc', _options?: PromiseConfigurationOptions): Promise<ListProducts200Response> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listProducts(page, perPage, category, seller, q, priceMin, priceMax, sort, observableOptions);
        return result.toPromise();
    }


}



import { ObservableModerationApi } from './ObservableAPI';

import { ModerationApiRequestFactory, ModerationApiResponseProcessor} from "../apis/ModerationApi";
export class PromiseModerationApi {
    private api: ObservableModerationApi

    public constructor(
        configuration: Configuration,
        requestFactory?: ModerationApiRequestFactory,
        responseProcessor?: ModerationApiResponseProcessor
    ) {
        this.api = new ObservableModerationApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Одобрить товар
     * @param id
     */
    public approveProductWithHttpInfo(id: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Product>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.approveProductWithHttpInfo(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Одобрить товар
     * @param id
     */
    public approveProduct(id: string, _options?: PromiseConfigurationOptions): Promise<Product> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.approveProduct(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Очередь модерации товаров
     * @param [page]
     * @param [perPage]
     */
    public moderationQueueWithHttpInfo(page?: number, perPage?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ProductList>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.moderationQueueWithHttpInfo(page, perPage, observableOptions);
        return result.toPromise();
    }

    /**
     * Очередь модерации товаров
     * @param [page]
     * @param [perPage]
     */
    public moderationQueue(page?: number, perPage?: number, _options?: PromiseConfigurationOptions): Promise<ProductList> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.moderationQueue(page, perPage, observableOptions);
        return result.toPromise();
    }

    /**
     * Отклонить товар
     * @param id
     * @param rejectProductRequest
     */
    public rejectProductWithHttpInfo(id: string, rejectProductRequest: RejectProductRequest, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Product>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.rejectProductWithHttpInfo(id, rejectProductRequest, observableOptions);
        return result.toPromise();
    }

    /**
     * Отклонить товар
     * @param id
     * @param rejectProductRequest
     */
    public rejectProduct(id: string, rejectProductRequest: RejectProductRequest, _options?: PromiseConfigurationOptions): Promise<Product> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.rejectProduct(id, rejectProductRequest, observableOptions);
        return result.toPromise();
    }


}



import { ObservableOrdersApi } from './ObservableAPI';

import { OrdersApiRequestFactory, OrdersApiResponseProcessor} from "../apis/OrdersApi";
export class PromiseOrdersApi {
    private api: ObservableOrdersApi

    public constructor(
        configuration: Configuration,
        requestFactory?: OrdersApiRequestFactory,
        responseProcessor?: OrdersApiResponseProcessor
    ) {
        this.api = new ObservableOrdersApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Требует `Idempotency-Key` (UUID). Повтор того же ключа тем же пользователем возвращает исходный заказ (200, не 201). Корзина конвертируется, склад уменьшается транзакционно. 
     * Оформить заказ из корзины
     * @param idempotencyKey
     * @param orderInput
     */
    public createOrderWithHttpInfo(idempotencyKey: string, orderInput: OrderInput, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Order>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createOrderWithHttpInfo(idempotencyKey, orderInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Требует `Idempotency-Key` (UUID). Повтор того же ключа тем же пользователем возвращает исходный заказ (200, не 201). Корзина конвертируется, склад уменьшается транзакционно. 
     * Оформить заказ из корзины
     * @param idempotencyKey
     * @param orderInput
     */
    public createOrder(idempotencyKey: string, orderInput: OrderInput, _options?: PromiseConfigurationOptions): Promise<Order> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createOrder(idempotencyKey, orderInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Доступно владельцу, модератору и админу.
     * Заказ по id
     * @param id
     */
    public getOrderWithHttpInfo(id: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Order>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getOrderWithHttpInfo(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Доступно владельцу, модератору и админу.
     * Заказ по id
     * @param id
     */
    public getOrder(id: string, _options?: PromiseConfigurationOptions): Promise<Order> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getOrder(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Мои заказы
     * @param [page]
     * @param [perPage]
     */
    public listMyOrdersWithHttpInfo(page?: number, perPage?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<OrderList>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listMyOrdersWithHttpInfo(page, perPage, observableOptions);
        return result.toPromise();
    }

    /**
     * Мои заказы
     * @param [page]
     * @param [perPage]
     */
    public listMyOrders(page?: number, perPage?: number, _options?: PromiseConfigurationOptions): Promise<OrderList> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listMyOrders(page, perPage, observableOptions);
        return result.toPromise();
    }

    /**
     * Способы доставки
     */
    public listShippingMethodsWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<ListShippingMethods200Response>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listShippingMethodsWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Способы доставки
     */
    public listShippingMethods(_options?: PromiseConfigurationOptions): Promise<ListShippingMethods200Response> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listShippingMethods(observableOptions);
        return result.toPromise();
    }

    /**
     * Проверка промокода
     * @param validatePromoRequest
     */
    public validatePromoWithHttpInfo(validatePromoRequest: ValidatePromoRequest, _options?: PromiseConfigurationOptions): Promise<HttpInfo<PromoValidation>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.validatePromoWithHttpInfo(validatePromoRequest, observableOptions);
        return result.toPromise();
    }

    /**
     * Проверка промокода
     * @param validatePromoRequest
     */
    public validatePromo(validatePromoRequest: ValidatePromoRequest, _options?: PromiseConfigurationOptions): Promise<PromoValidation> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.validatePromo(validatePromoRequest, observableOptions);
        return result.toPromise();
    }


}



import { ObservableSellerApi } from './ObservableAPI';

import { SellerApiRequestFactory, SellerApiResponseProcessor} from "../apis/SellerApi";
export class PromiseSellerApi {
    private api: ObservableSellerApi

    public constructor(
        configuration: Configuration,
        requestFactory?: SellerApiRequestFactory,
        responseProcessor?: SellerApiResponseProcessor
    ) {
        this.api = new ObservableSellerApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Создать товар (черновик)
     * @param productInput
     */
    public createSellerProductWithHttpInfo(productInput: ProductInput, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Product>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createSellerProductWithHttpInfo(productInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Создать товар (черновик)
     * @param productInput
     */
    public createSellerProduct(productInput: ProductInput, _options?: PromiseConfigurationOptions): Promise<Product> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.createSellerProduct(productInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Удалить изображение товара
     * @param id
     * @param imageId
     */
    public deleteProductImageWithHttpInfo(id: string, imageId: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<void>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteProductImageWithHttpInfo(id, imageId, observableOptions);
        return result.toPromise();
    }

    /**
     * Удалить изображение товара
     * @param id
     * @param imageId
     */
    public deleteProductImage(id: string, imageId: string, _options?: PromiseConfigurationOptions): Promise<void> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.deleteProductImage(id, imageId, observableOptions);
        return result.toPromise();
    }

    /**
     * Продажи продавца (позиции чужих заказов по своим товарам)
     * @param [page]
     * @param [perPage]
     */
    public listSellerOrderItemsWithHttpInfo(page?: number, perPage?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ListSellerOrderItems200Response>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSellerOrderItemsWithHttpInfo(page, perPage, observableOptions);
        return result.toPromise();
    }

    /**
     * Продажи продавца (позиции чужих заказов по своим товарам)
     * @param [page]
     * @param [perPage]
     */
    public listSellerOrderItems(page?: number, perPage?: number, _options?: PromiseConfigurationOptions): Promise<ListSellerOrderItems200Response> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSellerOrderItems(page, perPage, observableOptions);
        return result.toPromise();
    }

    /**
     * Товары продавца (все статусы)
     * @param [page]
     * @param [perPage]
     */
    public listSellerProductsWithHttpInfo(page?: number, perPage?: number, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ProductList>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSellerProductsWithHttpInfo(page, perPage, observableOptions);
        return result.toPromise();
    }

    /**
     * Товары продавца (все статусы)
     * @param [page]
     * @param [perPage]
     */
    public listSellerProducts(page?: number, perPage?: number, _options?: PromiseConfigurationOptions): Promise<ProductList> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.listSellerProducts(page, perPage, observableOptions);
        return result.toPromise();
    }

    /**
     * Отправить товар на модерацию
     * @param id
     */
    public submitSellerProductWithHttpInfo(id: string, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Product>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.submitSellerProductWithHttpInfo(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Отправить товар на модерацию
     * @param id
     */
    public submitSellerProduct(id: string, _options?: PromiseConfigurationOptions): Promise<Product> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.submitSellerProduct(id, observableOptions);
        return result.toPromise();
    }

    /**
     * Одобренный товар при правке возвращается в draft и требует повторной модерации.
     * Изменить свой товар
     * @param id
     * @param productInput
     */
    public updateSellerProductWithHttpInfo(id: string, productInput: ProductInput, _options?: PromiseConfigurationOptions): Promise<HttpInfo<Product>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateSellerProductWithHttpInfo(id, productInput, observableOptions);
        return result.toPromise();
    }

    /**
     * Одобренный товар при правке возвращается в draft и требует повторной модерации.
     * Изменить свой товар
     * @param id
     * @param productInput
     */
    public updateSellerProduct(id: string, productInput: ProductInput, _options?: PromiseConfigurationOptions): Promise<Product> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.updateSellerProduct(id, productInput, observableOptions);
        return result.toPromise();
    }

    /**
     * multipart/form-data, поле `file`; jpeg/png/webp до 5 МБ. Первое изображение становится primary.
     * Загрузить изображение товара
     * @param id
     * @param file
     */
    public uploadProductImageWithHttpInfo(id: string, file: HttpFile, _options?: PromiseConfigurationOptions): Promise<HttpInfo<ProductImage>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.uploadProductImageWithHttpInfo(id, file, observableOptions);
        return result.toPromise();
    }

    /**
     * multipart/form-data, поле `file`; jpeg/png/webp до 5 МБ. Первое изображение становится primary.
     * Загрузить изображение товара
     * @param id
     * @param file
     */
    public uploadProductImage(id: string, file: HttpFile, _options?: PromiseConfigurationOptions): Promise<ProductImage> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.uploadProductImage(id, file, observableOptions);
        return result.toPromise();
    }


}



import { ObservableServiceApi } from './ObservableAPI';

import { ServiceApiRequestFactory, ServiceApiResponseProcessor} from "../apis/ServiceApi";
export class PromiseServiceApi {
    private api: ObservableServiceApi

    public constructor(
        configuration: Configuration,
        requestFactory?: ServiceApiRequestFactory,
        responseProcessor?: ServiceApiResponseProcessor
    ) {
        this.api = new ObservableServiceApi(configuration, requestFactory, responseProcessor);
    }

    /**
     * Живость сервиса
     */
    public getHealthWithHttpInfo(_options?: PromiseConfigurationOptions): Promise<HttpInfo<GetHealth200Response>> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getHealthWithHttpInfo(observableOptions);
        return result.toPromise();
    }

    /**
     * Живость сервиса
     */
    public getHealth(_options?: PromiseConfigurationOptions): Promise<GetHealth200Response> {
        const observableOptions = wrapOptions(_options);
        const result = this.api.getHealth(observableOptions);
        return result.toPromise();
    }


}



