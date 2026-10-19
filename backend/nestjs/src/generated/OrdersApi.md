# .OrdersApi

All URIs are relative to *http://localhost:8000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createOrder**](OrdersApi.md#createOrder) | **POST** /orders | Оформить заказ из корзины
[**getOrder**](OrdersApi.md#getOrder) | **GET** /orders/{id} | Заказ по id
[**listMyOrders**](OrdersApi.md#listMyOrders) | **GET** /orders | Мои заказы
[**listShippingMethods**](OrdersApi.md#listShippingMethods) | **GET** /shipping-methods | Способы доставки
[**validatePromo**](OrdersApi.md#validatePromo) | **POST** /promo/validate | Проверка промокода


# **createOrder**
> Order createOrder(orderInput)

Требует `Idempotency-Key` (UUID). Повтор того же ключа тем же пользователем возвращает исходный заказ (200, не 201). Корзина конвертируется, склад уменьшается транзакционно. 

### Example


```typescript
import { createConfiguration, OrdersApi } from '';
import type { OrdersApiCreateOrderRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrdersApi(configuration);

const request: OrdersApiCreateOrderRequest = {
  
  idempotencyKey: "Idempotency-Key_example",
  
  orderInput: {
    shippingMethodCode: "shippingMethodCode_example",
    promoCode: "promoCode_example",
    shippingAddress: {
      line1: "line1_example",
      line2: "line2_example",
      city: "city_example",
      zip: "zip_example",
      country: "country_example",
    },
  },
};

const data = await apiInstance.createOrder(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **orderInput** | **OrderInput**|  |
 **idempotencyKey** | [**string**] |  | defaults to undefined


### Return type

**Order**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Заказ создан |  -  |
**200** | Повтор с тем же Idempotency-Key — исходный заказ |  -  |
**401** | Не аутентифицирован |  -  |
**409** | Корзина пуста |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **getOrder**
> Order getOrder()

Доступно владельцу, модератору и админу.

### Example


```typescript
import { createConfiguration, OrdersApi } from '';
import type { OrdersApiGetOrderRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrdersApi(configuration);

const request: OrdersApiGetOrderRequest = {
  
  id: "id_example",
};

const data = await apiInstance.getOrder(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**Order**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Заказ с позициями |  -  |
**401** | Не аутентифицирован |  -  |
**403** | Недостаточно прав |  -  |
**404** | Не найдено |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listMyOrders**
> OrderList listMyOrders()


### Example


```typescript
import { createConfiguration, OrdersApi } from '';
import type { OrdersApiListMyOrdersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrdersApi(configuration);

const request: OrdersApiListMyOrdersRequest = {
  
  page: 1,
  
  perPage: 20,
};

const data = await apiInstance.listMyOrders(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | [**number**] |  | (optional) defaults to 1
 **perPage** | [**number**] |  | (optional) defaults to 20


### Return type

**OrderList**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Заказы текущего пользователя |  -  |
**401** | Не аутентифицирован |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listShippingMethods**
> ListShippingMethods200Response listShippingMethods()


### Example


```typescript
import { createConfiguration, OrdersApi } from '';

const configuration = createConfiguration();
const apiInstance = new OrdersApi(configuration);

const request = {};

const data = await apiInstance.listShippingMethods(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**ListShippingMethods200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Активные способы доставки |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **validatePromo**
> PromoValidation validatePromo(validatePromoRequest)


### Example


```typescript
import { createConfiguration, OrdersApi } from '';
import type { OrdersApiValidatePromoRequest } from '';

const configuration = createConfiguration();
const apiInstance = new OrdersApi(configuration);

const request: OrdersApiValidatePromoRequest = {
  
  validatePromoRequest: {
    code: "code_example",
    subtotal: 0,
  },
};

const data = await apiInstance.validatePromo(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **validatePromoRequest** | **ValidatePromoRequest**|  |


### Return type

**PromoValidation**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Промокод применим |  -  |
**422** | Промокод не применим (истёк, исчерпан, малый subtotal) |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


