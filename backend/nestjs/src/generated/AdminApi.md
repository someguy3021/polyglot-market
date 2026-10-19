# .AdminApi

All URIs are relative to *http://localhost:8000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createPromoCode**](AdminApi.md#createPromoCode) | **POST** /admin/promo-codes | Создать промокод
[**deleteProduct**](AdminApi.md#deleteProduct) | **DELETE** /admin/products/{id} | Удалить товар (жёстко)
[**listAllOrders**](AdminApi.md#listAllOrders) | **GET** /admin/orders | Все заказы (админ)
[**listPromoCodes**](AdminApi.md#listPromoCodes) | **GET** /admin/promo-codes | Промокоды (админ)
[**listUsers**](AdminApi.md#listUsers) | **GET** /admin/users | Пользователи (админ)
[**updateOrderStatus**](AdminApi.md#updateOrderStatus) | **PUT** /admin/orders/{id}/status | Сменить статус заказа
[**updateUserRole**](AdminApi.md#updateUserRole) | **PUT** /admin/users/{id}/role | Назначить роль пользователю


# **createPromoCode**
> PromoCode createPromoCode(promoCodeInput)


### Example


```typescript
import { createConfiguration, AdminApi } from '';
import type { AdminApiCreatePromoCodeRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AdminApi(configuration);

const request: AdminApiCreatePromoCodeRequest = {
  
  promoCodeInput: {
    code: "ZXBU5JLXPXUUB-3NI2MDBGRX3_IFTFI16NDLX",
    type: "percent",
    value: 0,
    minSubtotal: 0,
    maxUses: 1,
    expiresAt: new Date('1970-01-01T00:00:00.00Z'),
  },
};

const data = await apiInstance.createPromoCode(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **promoCodeInput** | **PromoCodeInput**|  |


### Return type

**PromoCode**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Промокод создан |  -  |
**403** | Недостаточно прав |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteProduct**
> void deleteProduct()


### Example


```typescript
import { createConfiguration, AdminApi } from '';
import type { AdminApiDeleteProductRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AdminApi(configuration);

const request: AdminApiDeleteProductRequest = {
  
  id: "id_example",
};

const data = await apiInstance.deleteProduct(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**void**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**204** | Удалено |  -  |
**403** | Недостаточно прав |  -  |
**404** | Не найдено |  -  |
**409** | Товар входит в существующие заказы |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listAllOrders**
> OrderList listAllOrders()


### Example


```typescript
import { createConfiguration, AdminApi } from '';
import type { AdminApiListAllOrdersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AdminApi(configuration);

const request: AdminApiListAllOrdersRequest = {
  
  page: 1,
  
  perPage: 20,
  
  status: "new",
};

const data = await apiInstance.listAllOrders(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | [**number**] |  | (optional) defaults to 1
 **perPage** | [**number**] |  | (optional) defaults to 20
 **status** | **OrderStatus** |  | (optional) defaults to undefined


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
**200** | Заказы всех пользователей |  -  |
**401** | Не аутентифицирован |  -  |
**403** | Недостаточно прав |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listPromoCodes**
> ListPromoCodes200Response listPromoCodes()


### Example


```typescript
import { createConfiguration, AdminApi } from '';

const configuration = createConfiguration();
const apiInstance = new AdminApi(configuration);

const request = {};

const data = await apiInstance.listPromoCodes(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**ListPromoCodes200Response**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Все промокоды |  -  |
**401** | Не аутентифицирован |  -  |
**403** | Недостаточно прав |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listUsers**
> ListUsers200Response listUsers()


### Example


```typescript
import { createConfiguration, AdminApi } from '';
import type { AdminApiListUsersRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AdminApi(configuration);

const request: AdminApiListUsersRequest = {
  
  page: 1,
  
  perPage: 20,
  
  role: "buyer",
};

const data = await apiInstance.listUsers(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | [**number**] |  | (optional) defaults to 1
 **perPage** | [**number**] |  | (optional) defaults to 20
 **role** | **UserRole** |  | (optional) defaults to undefined


### Return type

**ListUsers200Response**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Список пользователей |  -  |
**401** | Не аутентифицирован |  -  |
**403** | Недостаточно прав |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateOrderStatus**
> Order updateOrderStatus(updateOrderStatusRequest)

Допустимые переходы: new→paid|cancelled, paid→shipped|cancelled, shipped→done, done/cancelled — терминальные.

### Example


```typescript
import { createConfiguration, AdminApi } from '';
import type { AdminApiUpdateOrderStatusRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AdminApi(configuration);

const request: AdminApiUpdateOrderStatusRequest = {
  
  id: "id_example",
  
  updateOrderStatusRequest: {
    status: "new",
  },
};

const data = await apiInstance.updateOrderStatus(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateOrderStatusRequest** | **UpdateOrderStatusRequest**|  |
 **id** | [**string**] |  | defaults to undefined


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
**200** | Заказ обновлён |  -  |
**403** | Недостаточно прав |  -  |
**404** | Не найдено |  -  |
**409** | Недопустимый переход статуса |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateUserRole**
> User updateUserRole(updateUserRoleRequest)


### Example


```typescript
import { createConfiguration, AdminApi } from '';
import type { AdminApiUpdateUserRoleRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AdminApi(configuration);

const request: AdminApiUpdateUserRoleRequest = {
  
  id: "id_example",
  
  updateUserRoleRequest: {
    role: "buyer",
  },
};

const data = await apiInstance.updateUserRole(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateUserRoleRequest** | **UpdateUserRoleRequest**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**User**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Роль обновлена |  -  |
**403** | Недостаточно прав |  -  |
**404** | Не найдено |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


