import { ResponseContext, RequestContext, HttpFile, HttpInfo } from '../http/http';
import { Configuration, ConfigurationOptions, mergeConfiguration } from '../configuration'
import type { Middleware } from '../middleware';
import { Observable, of, from } from '../rxjsStub';
import {mergeMap, map} from  '../rxjsStub';
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

import { AdminApiRequestFactory, AdminApiResponseProcessor} from "../apis/AdminApi";
export class ObservableAdminApi {
    private requestFactory: AdminApiRequestFactory;
    private responseProcessor: AdminApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: AdminApiRequestFactory,
        responseProcessor?: AdminApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new AdminApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new AdminApiResponseProcessor();
    }

    /**
     * Создать промокод
     * @param promoCodeInput
     */
    public createPromoCodeWithHttpInfo(promoCodeInput: PromoCodeInput, _options?: ConfigurationOptions): Observable<HttpInfo<PromoCode>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.createPromoCode(promoCodeInput, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createPromoCodeWithHttpInfo(rsp)));
            }));
    }

    /**
     * Создать промокод
     * @param promoCodeInput
     */
    public createPromoCode(promoCodeInput: PromoCodeInput, _options?: ConfigurationOptions): Observable<PromoCode> {
        return this.createPromoCodeWithHttpInfo(promoCodeInput, _options).pipe(map((apiResponse: HttpInfo<PromoCode>) => apiResponse.data));
    }

    /**
     * Удалить товар (жёстко)
     * @param id
     */
    public deleteProductWithHttpInfo(id: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.deleteProduct(id, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteProductWithHttpInfo(rsp)));
            }));
    }

    /**
     * Удалить товар (жёстко)
     * @param id
     */
    public deleteProduct(id: string, _options?: ConfigurationOptions): Observable<void> {
        return this.deleteProductWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Все заказы (админ)
     * @param [page]
     * @param [perPage]
     * @param [status]
     */
    public listAllOrdersWithHttpInfo(page?: number, perPage?: number, status?: OrderStatus, _options?: ConfigurationOptions): Observable<HttpInfo<OrderList>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listAllOrders(page, perPage, status, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listAllOrdersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Все заказы (админ)
     * @param [page]
     * @param [perPage]
     * @param [status]
     */
    public listAllOrders(page?: number, perPage?: number, status?: OrderStatus, _options?: ConfigurationOptions): Observable<OrderList> {
        return this.listAllOrdersWithHttpInfo(page, perPage, status, _options).pipe(map((apiResponse: HttpInfo<OrderList>) => apiResponse.data));
    }

    /**
     * Промокоды (админ)
     */
    public listPromoCodesWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<ListPromoCodes200Response>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listPromoCodes(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listPromoCodesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Промокоды (админ)
     */
    public listPromoCodes(_options?: ConfigurationOptions): Observable<ListPromoCodes200Response> {
        return this.listPromoCodesWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<ListPromoCodes200Response>) => apiResponse.data));
    }

    /**
     * Пользователи (админ)
     * @param [page]
     * @param [perPage]
     * @param [role]
     */
    public listUsersWithHttpInfo(page?: number, perPage?: number, role?: UserRole, _options?: ConfigurationOptions): Observable<HttpInfo<ListUsers200Response>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listUsers(page, perPage, role, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listUsersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Пользователи (админ)
     * @param [page]
     * @param [perPage]
     * @param [role]
     */
    public listUsers(page?: number, perPage?: number, role?: UserRole, _options?: ConfigurationOptions): Observable<ListUsers200Response> {
        return this.listUsersWithHttpInfo(page, perPage, role, _options).pipe(map((apiResponse: HttpInfo<ListUsers200Response>) => apiResponse.data));
    }

    /**
     * Допустимые переходы: new→paid|cancelled, paid→shipped|cancelled, shipped→done, done/cancelled — терминальные.
     * Сменить статус заказа
     * @param id
     * @param updateOrderStatusRequest
     */
    public updateOrderStatusWithHttpInfo(id: string, updateOrderStatusRequest: UpdateOrderStatusRequest, _options?: ConfigurationOptions): Observable<HttpInfo<Order>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.updateOrderStatus(id, updateOrderStatusRequest, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateOrderStatusWithHttpInfo(rsp)));
            }));
    }

    /**
     * Допустимые переходы: new→paid|cancelled, paid→shipped|cancelled, shipped→done, done/cancelled — терминальные.
     * Сменить статус заказа
     * @param id
     * @param updateOrderStatusRequest
     */
    public updateOrderStatus(id: string, updateOrderStatusRequest: UpdateOrderStatusRequest, _options?: ConfigurationOptions): Observable<Order> {
        return this.updateOrderStatusWithHttpInfo(id, updateOrderStatusRequest, _options).pipe(map((apiResponse: HttpInfo<Order>) => apiResponse.data));
    }

    /**
     * Назначить роль пользователю
     * @param id
     * @param updateUserRoleRequest
     */
    public updateUserRoleWithHttpInfo(id: string, updateUserRoleRequest: UpdateUserRoleRequest, _options?: ConfigurationOptions): Observable<HttpInfo<User>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.updateUserRole(id, updateUserRoleRequest, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateUserRoleWithHttpInfo(rsp)));
            }));
    }

    /**
     * Назначить роль пользователю
     * @param id
     * @param updateUserRoleRequest
     */
    public updateUserRole(id: string, updateUserRoleRequest: UpdateUserRoleRequest, _options?: ConfigurationOptions): Observable<User> {
        return this.updateUserRoleWithHttpInfo(id, updateUserRoleRequest, _options).pipe(map((apiResponse: HttpInfo<User>) => apiResponse.data));
    }

}

import { AuthApiRequestFactory, AuthApiResponseProcessor} from "../apis/AuthApi";
export class ObservableAuthApi {
    private requestFactory: AuthApiRequestFactory;
    private responseProcessor: AuthApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: AuthApiRequestFactory,
        responseProcessor?: AuthApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new AuthApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new AuthApiResponseProcessor();
    }

    /**
     * Текущий пользователь
     */
    public getMeWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<User>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getMe(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getMeWithHttpInfo(rsp)));
            }));
    }

    /**
     * Текущий пользователь
     */
    public getMe(_options?: ConfigurationOptions): Observable<User> {
        return this.getMeWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<User>) => apiResponse.data));
    }

    /**
     * Вход по email и паролю
     * @param loginInput
     */
    public loginWithHttpInfo(loginInput: LoginInput, _options?: ConfigurationOptions): Observable<HttpInfo<AuthToken>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.login(loginInput, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.loginWithHttpInfo(rsp)));
            }));
    }

    /**
     * Вход по email и паролю
     * @param loginInput
     */
    public login(loginInput: LoginInput, _options?: ConfigurationOptions): Observable<AuthToken> {
        return this.loginWithHttpInfo(loginInput, _options).pipe(map((apiResponse: HttpInfo<AuthToken>) => apiResponse.data));
    }

    /**
     * Создаёт пользователя с ролью `buyer`. Продавцов/модераторов назначает админ.
     * Регистрация покупателя
     * @param registerInput
     */
    public registerWithHttpInfo(registerInput: RegisterInput, _options?: ConfigurationOptions): Observable<HttpInfo<AuthToken>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.register(registerInput, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.registerWithHttpInfo(rsp)));
            }));
    }

    /**
     * Создаёт пользователя с ролью `buyer`. Продавцов/модераторов назначает админ.
     * Регистрация покупателя
     * @param registerInput
     */
    public register(registerInput: RegisterInput, _options?: ConfigurationOptions): Observable<AuthToken> {
        return this.registerWithHttpInfo(registerInput, _options).pipe(map((apiResponse: HttpInfo<AuthToken>) => apiResponse.data));
    }

}

import { CartApiRequestFactory, CartApiResponseProcessor} from "../apis/CartApi";
export class ObservableCartApi {
    private requestFactory: CartApiRequestFactory;
    private responseProcessor: CartApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: CartApiRequestFactory,
        responseProcessor?: CartApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new CartApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new CartApiResponseProcessor();
    }

    /**
     * Гостю в ответе заголовок `X-Cart-Token` — сохранить и слать далее.
     * Добавить товар в корзину
     * @param cartItemInput
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public addCartItemWithHttpInfo(cartItemInput: CartItemInput, xCartToken?: string, _options?: ConfigurationOptions): Observable<HttpInfo<Cart>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.addCartItem(cartItemInput, xCartToken, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.addCartItemWithHttpInfo(rsp)));
            }));
    }

    /**
     * Гостю в ответе заголовок `X-Cart-Token` — сохранить и слать далее.
     * Добавить товар в корзину
     * @param cartItemInput
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public addCartItem(cartItemInput: CartItemInput, xCartToken?: string, _options?: ConfigurationOptions): Observable<Cart> {
        return this.addCartItemWithHttpInfo(cartItemInput, xCartToken, _options).pipe(map((apiResponse: HttpInfo<Cart>) => apiResponse.data));
    }

    /**
     * Удалить позицию из корзины
     * @param id
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public deleteCartItemWithHttpInfo(id: string, xCartToken?: string, _options?: ConfigurationOptions): Observable<HttpInfo<Cart>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.deleteCartItem(id, xCartToken, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteCartItemWithHttpInfo(rsp)));
            }));
    }

    /**
     * Удалить позицию из корзины
     * @param id
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public deleteCartItem(id: string, xCartToken?: string, _options?: ConfigurationOptions): Observable<Cart> {
        return this.deleteCartItemWithHttpInfo(id, xCartToken, _options).pipe(map((apiResponse: HttpInfo<Cart>) => apiResponse.data));
    }

    /**
     * Для авторизованного — аккаунтная корзина. Для гостя — по заголовку `X-Cart-Token` (UUID из ответа `POST /cart/items` при первом добавлении, хранится на клиенте). 
     * Текущая корзина
     */
    public getCartWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<Cart>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getCart(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getCartWithHttpInfo(rsp)));
            }));
    }

    /**
     * Для авторизованного — аккаунтная корзина. Для гостя — по заголовку `X-Cart-Token` (UUID из ответа `POST /cart/items` при первом добавлении, хранится на клиенте). 
     * Текущая корзина
     */
    public getCart(_options?: ConfigurationOptions): Observable<Cart> {
        return this.getCartWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<Cart>) => apiResponse.data));
    }

    /**
     * Вызывается после логина/регистрации с тем `X-Cart-Token`, под которым гость собирал корзину. Позиции сливаются по товару (количества суммируются до 99), гостевая корзина помечается merged. 
     * Мердж гостевой корзины в аккаунтную
     * @param mergeCartRequest
     */
    public mergeCartWithHttpInfo(mergeCartRequest: MergeCartRequest, _options?: ConfigurationOptions): Observable<HttpInfo<Cart>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.mergeCart(mergeCartRequest, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.mergeCartWithHttpInfo(rsp)));
            }));
    }

    /**
     * Вызывается после логина/регистрации с тем `X-Cart-Token`, под которым гость собирал корзину. Позиции сливаются по товару (количества суммируются до 99), гостевая корзина помечается merged. 
     * Мердж гостевой корзины в аккаунтную
     * @param mergeCartRequest
     */
    public mergeCart(mergeCartRequest: MergeCartRequest, _options?: ConfigurationOptions): Observable<Cart> {
        return this.mergeCartWithHttpInfo(mergeCartRequest, _options).pipe(map((apiResponse: HttpInfo<Cart>) => apiResponse.data));
    }

    /**
     * Изменить количество позиции
     * @param id
     * @param updateCartItemRequest
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public updateCartItemWithHttpInfo(id: string, updateCartItemRequest: UpdateCartItemRequest, xCartToken?: string, _options?: ConfigurationOptions): Observable<HttpInfo<Cart>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.updateCartItem(id, updateCartItemRequest, xCartToken, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateCartItemWithHttpInfo(rsp)));
            }));
    }

    /**
     * Изменить количество позиции
     * @param id
     * @param updateCartItemRequest
     * @param [xCartToken] Токен гостевой корзины (игнорируется при Bearer-авторизации)
     */
    public updateCartItem(id: string, updateCartItemRequest: UpdateCartItemRequest, xCartToken?: string, _options?: ConfigurationOptions): Observable<Cart> {
        return this.updateCartItemWithHttpInfo(id, updateCartItemRequest, xCartToken, _options).pipe(map((apiResponse: HttpInfo<Cart>) => apiResponse.data));
    }

}

import { CatalogApiRequestFactory, CatalogApiResponseProcessor} from "../apis/CatalogApi";
export class ObservableCatalogApi {
    private requestFactory: CatalogApiRequestFactory;
    private responseProcessor: CatalogApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: CatalogApiRequestFactory,
        responseProcessor?: CatalogApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new CatalogApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new CatalogApiResponseProcessor();
    }

    /**
     * Карточка товара
     * @param id
     */
    public getProductWithHttpInfo(id: string, _options?: ConfigurationOptions): Observable<HttpInfo<Product>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getProduct(id, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getProductWithHttpInfo(rsp)));
            }));
    }

    /**
     * Карточка товара
     * @param id
     */
    public getProduct(id: string, _options?: ConfigurationOptions): Observable<Product> {
        return this.getProductWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<Product>) => apiResponse.data));
    }

    /**
     * Категории каталога
     */
    public listCategoriesWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<ListCategories200Response>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listCategories(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listCategoriesWithHttpInfo(rsp)));
            }));
    }

    /**
     * Категории каталога
     */
    public listCategories(_options?: ConfigurationOptions): Observable<ListCategories200Response> {
        return this.listCategoriesWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<ListCategories200Response>) => apiResponse.data));
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
    public listProductsWithHttpInfo(page?: number, perPage?: number, category?: string, seller?: string, q?: string, priceMin?: number, priceMax?: number, sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc', _options?: ConfigurationOptions): Observable<HttpInfo<ListProducts200Response>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listProducts(page, perPage, category, seller, q, priceMin, priceMax, sort, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listProductsWithHttpInfo(rsp)));
            }));
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
    public listProducts(page?: number, perPage?: number, category?: string, seller?: string, q?: string, priceMin?: number, priceMax?: number, sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc', _options?: ConfigurationOptions): Observable<ListProducts200Response> {
        return this.listProductsWithHttpInfo(page, perPage, category, seller, q, priceMin, priceMax, sort, _options).pipe(map((apiResponse: HttpInfo<ListProducts200Response>) => apiResponse.data));
    }

}

import { ModerationApiRequestFactory, ModerationApiResponseProcessor} from "../apis/ModerationApi";
export class ObservableModerationApi {
    private requestFactory: ModerationApiRequestFactory;
    private responseProcessor: ModerationApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: ModerationApiRequestFactory,
        responseProcessor?: ModerationApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new ModerationApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new ModerationApiResponseProcessor();
    }

    /**
     * Одобрить товар
     * @param id
     */
    public approveProductWithHttpInfo(id: string, _options?: ConfigurationOptions): Observable<HttpInfo<Product>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.approveProduct(id, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.approveProductWithHttpInfo(rsp)));
            }));
    }

    /**
     * Одобрить товар
     * @param id
     */
    public approveProduct(id: string, _options?: ConfigurationOptions): Observable<Product> {
        return this.approveProductWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<Product>) => apiResponse.data));
    }

    /**
     * Очередь модерации товаров
     * @param [page]
     * @param [perPage]
     */
    public moderationQueueWithHttpInfo(page?: number, perPage?: number, _options?: ConfigurationOptions): Observable<HttpInfo<ProductList>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.moderationQueue(page, perPage, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.moderationQueueWithHttpInfo(rsp)));
            }));
    }

    /**
     * Очередь модерации товаров
     * @param [page]
     * @param [perPage]
     */
    public moderationQueue(page?: number, perPage?: number, _options?: ConfigurationOptions): Observable<ProductList> {
        return this.moderationQueueWithHttpInfo(page, perPage, _options).pipe(map((apiResponse: HttpInfo<ProductList>) => apiResponse.data));
    }

    /**
     * Отклонить товар
     * @param id
     * @param rejectProductRequest
     */
    public rejectProductWithHttpInfo(id: string, rejectProductRequest: RejectProductRequest, _options?: ConfigurationOptions): Observable<HttpInfo<Product>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.rejectProduct(id, rejectProductRequest, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.rejectProductWithHttpInfo(rsp)));
            }));
    }

    /**
     * Отклонить товар
     * @param id
     * @param rejectProductRequest
     */
    public rejectProduct(id: string, rejectProductRequest: RejectProductRequest, _options?: ConfigurationOptions): Observable<Product> {
        return this.rejectProductWithHttpInfo(id, rejectProductRequest, _options).pipe(map((apiResponse: HttpInfo<Product>) => apiResponse.data));
    }

}

import { OrdersApiRequestFactory, OrdersApiResponseProcessor} from "../apis/OrdersApi";
export class ObservableOrdersApi {
    private requestFactory: OrdersApiRequestFactory;
    private responseProcessor: OrdersApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: OrdersApiRequestFactory,
        responseProcessor?: OrdersApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new OrdersApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new OrdersApiResponseProcessor();
    }

    /**
     * Требует `Idempotency-Key` (UUID). Повтор того же ключа тем же пользователем возвращает исходный заказ (200, не 201). Корзина конвертируется, склад уменьшается транзакционно. 
     * Оформить заказ из корзины
     * @param idempotencyKey
     * @param orderInput
     */
    public createOrderWithHttpInfo(idempotencyKey: string, orderInput: OrderInput, _options?: ConfigurationOptions): Observable<HttpInfo<Order>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.createOrder(idempotencyKey, orderInput, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createOrderWithHttpInfo(rsp)));
            }));
    }

    /**
     * Требует `Idempotency-Key` (UUID). Повтор того же ключа тем же пользователем возвращает исходный заказ (200, не 201). Корзина конвертируется, склад уменьшается транзакционно. 
     * Оформить заказ из корзины
     * @param idempotencyKey
     * @param orderInput
     */
    public createOrder(idempotencyKey: string, orderInput: OrderInput, _options?: ConfigurationOptions): Observable<Order> {
        return this.createOrderWithHttpInfo(idempotencyKey, orderInput, _options).pipe(map((apiResponse: HttpInfo<Order>) => apiResponse.data));
    }

    /**
     * Доступно владельцу, модератору и админу.
     * Заказ по id
     * @param id
     */
    public getOrderWithHttpInfo(id: string, _options?: ConfigurationOptions): Observable<HttpInfo<Order>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getOrder(id, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getOrderWithHttpInfo(rsp)));
            }));
    }

    /**
     * Доступно владельцу, модератору и админу.
     * Заказ по id
     * @param id
     */
    public getOrder(id: string, _options?: ConfigurationOptions): Observable<Order> {
        return this.getOrderWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<Order>) => apiResponse.data));
    }

    /**
     * Мои заказы
     * @param [page]
     * @param [perPage]
     */
    public listMyOrdersWithHttpInfo(page?: number, perPage?: number, _options?: ConfigurationOptions): Observable<HttpInfo<OrderList>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listMyOrders(page, perPage, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listMyOrdersWithHttpInfo(rsp)));
            }));
    }

    /**
     * Мои заказы
     * @param [page]
     * @param [perPage]
     */
    public listMyOrders(page?: number, perPage?: number, _options?: ConfigurationOptions): Observable<OrderList> {
        return this.listMyOrdersWithHttpInfo(page, perPage, _options).pipe(map((apiResponse: HttpInfo<OrderList>) => apiResponse.data));
    }

    /**
     * Способы доставки
     */
    public listShippingMethodsWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<ListShippingMethods200Response>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listShippingMethods(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listShippingMethodsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Способы доставки
     */
    public listShippingMethods(_options?: ConfigurationOptions): Observable<ListShippingMethods200Response> {
        return this.listShippingMethodsWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<ListShippingMethods200Response>) => apiResponse.data));
    }

    /**
     * Проверка промокода
     * @param validatePromoRequest
     */
    public validatePromoWithHttpInfo(validatePromoRequest: ValidatePromoRequest, _options?: ConfigurationOptions): Observable<HttpInfo<PromoValidation>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.validatePromo(validatePromoRequest, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.validatePromoWithHttpInfo(rsp)));
            }));
    }

    /**
     * Проверка промокода
     * @param validatePromoRequest
     */
    public validatePromo(validatePromoRequest: ValidatePromoRequest, _options?: ConfigurationOptions): Observable<PromoValidation> {
        return this.validatePromoWithHttpInfo(validatePromoRequest, _options).pipe(map((apiResponse: HttpInfo<PromoValidation>) => apiResponse.data));
    }

}

import { SellerApiRequestFactory, SellerApiResponseProcessor} from "../apis/SellerApi";
export class ObservableSellerApi {
    private requestFactory: SellerApiRequestFactory;
    private responseProcessor: SellerApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: SellerApiRequestFactory,
        responseProcessor?: SellerApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new SellerApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new SellerApiResponseProcessor();
    }

    /**
     * Создать товар (черновик)
     * @param productInput
     */
    public createSellerProductWithHttpInfo(productInput: ProductInput, _options?: ConfigurationOptions): Observable<HttpInfo<Product>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.createSellerProduct(productInput, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.createSellerProductWithHttpInfo(rsp)));
            }));
    }

    /**
     * Создать товар (черновик)
     * @param productInput
     */
    public createSellerProduct(productInput: ProductInput, _options?: ConfigurationOptions): Observable<Product> {
        return this.createSellerProductWithHttpInfo(productInput, _options).pipe(map((apiResponse: HttpInfo<Product>) => apiResponse.data));
    }

    /**
     * Удалить изображение товара
     * @param id
     * @param imageId
     */
    public deleteProductImageWithHttpInfo(id: string, imageId: string, _options?: ConfigurationOptions): Observable<HttpInfo<void>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.deleteProductImage(id, imageId, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.deleteProductImageWithHttpInfo(rsp)));
            }));
    }

    /**
     * Удалить изображение товара
     * @param id
     * @param imageId
     */
    public deleteProductImage(id: string, imageId: string, _options?: ConfigurationOptions): Observable<void> {
        return this.deleteProductImageWithHttpInfo(id, imageId, _options).pipe(map((apiResponse: HttpInfo<void>) => apiResponse.data));
    }

    /**
     * Продажи продавца (позиции чужих заказов по своим товарам)
     * @param [page]
     * @param [perPage]
     */
    public listSellerOrderItemsWithHttpInfo(page?: number, perPage?: number, _options?: ConfigurationOptions): Observable<HttpInfo<ListSellerOrderItems200Response>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listSellerOrderItems(page, perPage, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listSellerOrderItemsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Продажи продавца (позиции чужих заказов по своим товарам)
     * @param [page]
     * @param [perPage]
     */
    public listSellerOrderItems(page?: number, perPage?: number, _options?: ConfigurationOptions): Observable<ListSellerOrderItems200Response> {
        return this.listSellerOrderItemsWithHttpInfo(page, perPage, _options).pipe(map((apiResponse: HttpInfo<ListSellerOrderItems200Response>) => apiResponse.data));
    }

    /**
     * Товары продавца (все статусы)
     * @param [page]
     * @param [perPage]
     */
    public listSellerProductsWithHttpInfo(page?: number, perPage?: number, _options?: ConfigurationOptions): Observable<HttpInfo<ProductList>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.listSellerProducts(page, perPage, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.listSellerProductsWithHttpInfo(rsp)));
            }));
    }

    /**
     * Товары продавца (все статусы)
     * @param [page]
     * @param [perPage]
     */
    public listSellerProducts(page?: number, perPage?: number, _options?: ConfigurationOptions): Observable<ProductList> {
        return this.listSellerProductsWithHttpInfo(page, perPage, _options).pipe(map((apiResponse: HttpInfo<ProductList>) => apiResponse.data));
    }

    /**
     * Отправить товар на модерацию
     * @param id
     */
    public submitSellerProductWithHttpInfo(id: string, _options?: ConfigurationOptions): Observable<HttpInfo<Product>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.submitSellerProduct(id, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.submitSellerProductWithHttpInfo(rsp)));
            }));
    }

    /**
     * Отправить товар на модерацию
     * @param id
     */
    public submitSellerProduct(id: string, _options?: ConfigurationOptions): Observable<Product> {
        return this.submitSellerProductWithHttpInfo(id, _options).pipe(map((apiResponse: HttpInfo<Product>) => apiResponse.data));
    }

    /**
     * Одобренный товар при правке возвращается в draft и требует повторной модерации.
     * Изменить свой товар
     * @param id
     * @param productInput
     */
    public updateSellerProductWithHttpInfo(id: string, productInput: ProductInput, _options?: ConfigurationOptions): Observable<HttpInfo<Product>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.updateSellerProduct(id, productInput, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.updateSellerProductWithHttpInfo(rsp)));
            }));
    }

    /**
     * Одобренный товар при правке возвращается в draft и требует повторной модерации.
     * Изменить свой товар
     * @param id
     * @param productInput
     */
    public updateSellerProduct(id: string, productInput: ProductInput, _options?: ConfigurationOptions): Observable<Product> {
        return this.updateSellerProductWithHttpInfo(id, productInput, _options).pipe(map((apiResponse: HttpInfo<Product>) => apiResponse.data));
    }

    /**
     * multipart/form-data, поле `file`; jpeg/png/webp до 5 МБ. Первое изображение становится primary.
     * Загрузить изображение товара
     * @param id
     * @param file
     */
    public uploadProductImageWithHttpInfo(id: string, file: HttpFile, _options?: ConfigurationOptions): Observable<HttpInfo<ProductImage>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.uploadProductImage(id, file, _config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.uploadProductImageWithHttpInfo(rsp)));
            }));
    }

    /**
     * multipart/form-data, поле `file`; jpeg/png/webp до 5 МБ. Первое изображение становится primary.
     * Загрузить изображение товара
     * @param id
     * @param file
     */
    public uploadProductImage(id: string, file: HttpFile, _options?: ConfigurationOptions): Observable<ProductImage> {
        return this.uploadProductImageWithHttpInfo(id, file, _options).pipe(map((apiResponse: HttpInfo<ProductImage>) => apiResponse.data));
    }

}

import { ServiceApiRequestFactory, ServiceApiResponseProcessor} from "../apis/ServiceApi";
export class ObservableServiceApi {
    private requestFactory: ServiceApiRequestFactory;
    private responseProcessor: ServiceApiResponseProcessor;
    private configuration: Configuration;

    public constructor(
        configuration: Configuration,
        requestFactory?: ServiceApiRequestFactory,
        responseProcessor?: ServiceApiResponseProcessor
    ) {
        this.configuration = configuration;
        this.requestFactory = requestFactory || new ServiceApiRequestFactory(configuration);
        this.responseProcessor = responseProcessor || new ServiceApiResponseProcessor();
    }

    /**
     * Живость сервиса
     */
    public getHealthWithHttpInfo(_options?: ConfigurationOptions): Observable<HttpInfo<GetHealth200Response>> {
        const _config = mergeConfiguration(this.configuration, _options);

        const requestContextPromise = this.requestFactory.getHealth(_config);
        // build promise chain
        let middlewarePreObservable = from<RequestContext>(requestContextPromise);
        for (const middleware of _config.middleware) {
            middlewarePreObservable = middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => middleware.pre(ctx)));
        }

        return middlewarePreObservable.pipe(mergeMap((ctx: RequestContext) => _config.httpApi.send(ctx))).
            pipe(mergeMap((response: ResponseContext) => {
                let middlewarePostObservable = of(response);
                for (const middleware of _config.middleware.reverse()) {
                    middlewarePostObservable = middlewarePostObservable.pipe(mergeMap((rsp: ResponseContext) => middleware.post(rsp)));
                }
                return middlewarePostObservable.pipe(map((rsp: ResponseContext) => this.responseProcessor.getHealthWithHttpInfo(rsp)));
            }));
    }

    /**
     * Живость сервиса
     */
    public getHealth(_options?: ConfigurationOptions): Observable<GetHealth200Response> {
        return this.getHealthWithHttpInfo(_options).pipe(map((apiResponse: HttpInfo<GetHealth200Response>) => apiResponse.data));
    }

}
