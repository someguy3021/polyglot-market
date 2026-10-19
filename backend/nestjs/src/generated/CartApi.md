# .CartApi

All URIs are relative to *http://localhost:8000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**addCartItem**](CartApi.md#addCartItem) | **POST** /cart/items | Добавить товар в корзину
[**deleteCartItem**](CartApi.md#deleteCartItem) | **DELETE** /cart/items/{id} | Удалить позицию из корзины
[**getCart**](CartApi.md#getCart) | **GET** /cart | Текущая корзина
[**mergeCart**](CartApi.md#mergeCart) | **POST** /cart/merge | Мердж гостевой корзины в аккаунтную
[**updateCartItem**](CartApi.md#updateCartItem) | **PATCH** /cart/items/{id} | Изменить количество позиции


# **addCartItem**
> Cart addCartItem(cartItemInput)

Гостю в ответе заголовок `X-Cart-Token` — сохранить и слать далее.

### Example


```typescript
import { createConfiguration, CartApi } from '';
import type { CartApiAddCartItemRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CartApi(configuration);

const request: CartApiAddCartItemRequest = {
  
  cartItemInput: {
    productId: "productId_example",
    quantity: 1,
  },
    // Токен гостевой корзины (игнорируется при Bearer-авторизации) (optional)
  xCartToken: "X-Cart-Token_example",
};

const data = await apiInstance.addCartItem(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **cartItemInput** | **CartItemInput**|  |
 **xCartToken** | [**string**] | Токен гостевой корзины (игнорируется при Bearer-авторизации) | (optional) defaults to undefined


### Return type

**Cart**

### Authorization

[cartToken](README.md#cartToken), [bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Корзина после добавления |  * X-Cart-Token - Токен гостевой корзины (только для гостей) <br>  |
**401** | Не аутентифицирован |  -  |
**404** | Не найдено |  -  |
**409** | Товар не в продаже (не approved) или нет на складе |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteCartItem**
> Cart deleteCartItem()


### Example


```typescript
import { createConfiguration, CartApi } from '';
import type { CartApiDeleteCartItemRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CartApi(configuration);

const request: CartApiDeleteCartItemRequest = {
  
  id: "id_example",
    // Токен гостевой корзины (игнорируется при Bearer-авторизации) (optional)
  xCartToken: "X-Cart-Token_example",
};

const data = await apiInstance.deleteCartItem(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **xCartToken** | [**string**] | Токен гостевой корзины (игнорируется при Bearer-авторизации) | (optional) defaults to undefined


### Return type

**Cart**

### Authorization

[cartToken](README.md#cartToken), [bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Корзина после удаления |  -  |
**404** | Не найдено |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getCart**
> Cart getCart()

Для авторизованного — аккаунтная корзина. Для гостя — по заголовку `X-Cart-Token` (UUID из ответа `POST /cart/items` при первом добавлении, хранится на клиенте). 

### Example


```typescript
import { createConfiguration, CartApi } from '';

const configuration = createConfiguration();
const apiInstance = new CartApi(configuration);

const request = {};

const data = await apiInstance.getCart(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**Cart**

### Authorization

[cartToken](README.md#cartToken), [bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Корзина с позициями и подытогом |  -  |
**401** | Не аутентифицирован |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **mergeCart**
> Cart mergeCart(mergeCartRequest)

Вызывается после логина/регистрации с тем `X-Cart-Token`, под которым гость собирал корзину. Позиции сливаются по товару (количества суммируются до 99), гостевая корзина помечается merged. 

### Example


```typescript
import { createConfiguration, CartApi } from '';
import type { CartApiMergeCartRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CartApi(configuration);

const request: CartApiMergeCartRequest = {
  
  mergeCartRequest: {
    token: "token_example",
  },
};

const data = await apiInstance.mergeCart(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **mergeCartRequest** | **MergeCartRequest**|  |


### Return type

**Cart**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Аккаунтная корзина после мерджа |  -  |
**401** | Не аутентифицирован |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateCartItem**
> Cart updateCartItem(updateCartItemRequest)


### Example


```typescript
import { createConfiguration, CartApi } from '';
import type { CartApiUpdateCartItemRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CartApi(configuration);

const request: CartApiUpdateCartItemRequest = {
  
  id: "id_example",
  
  updateCartItemRequest: {
    quantity: 1,
  },
    // Токен гостевой корзины (игнорируется при Bearer-авторизации) (optional)
  xCartToken: "X-Cart-Token_example",
};

const data = await apiInstance.updateCartItem(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateCartItemRequest** | **UpdateCartItemRequest**|  |
 **id** | [**string**] |  | defaults to undefined
 **xCartToken** | [**string**] | Токен гостевой корзины (игнорируется при Bearer-авторизации) | (optional) defaults to undefined


### Return type

**Cart**

### Authorization

[cartToken](README.md#cartToken), [bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Корзина после изменения |  -  |
**404** | Не найдено |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


