# .SellerApi

All URIs are relative to *http://localhost:8000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**createSellerProduct**](SellerApi.md#createSellerProduct) | **POST** /seller/products | Создать товар (черновик)
[**deleteProductImage**](SellerApi.md#deleteProductImage) | **DELETE** /seller/products/{id}/images/{imageId} | Удалить изображение товара
[**listSellerOrderItems**](SellerApi.md#listSellerOrderItems) | **GET** /seller/order-items | Продажи продавца (позиции чужих заказов по своим товарам)
[**listSellerProducts**](SellerApi.md#listSellerProducts) | **GET** /seller/products | Товары продавца (все статусы)
[**submitSellerProduct**](SellerApi.md#submitSellerProduct) | **POST** /seller/products/{id}/submit | Отправить товар на модерацию
[**updateSellerProduct**](SellerApi.md#updateSellerProduct) | **PUT** /seller/products/{id} | Изменить свой товар
[**uploadProductImage**](SellerApi.md#uploadProductImage) | **POST** /seller/products/{id}/images | Загрузить изображение товара


# **createSellerProduct**
> Product createSellerProduct(productInput)


### Example


```typescript
import { createConfiguration, SellerApi } from '';
import type { SellerApiCreateSellerProductRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SellerApi(configuration);

const request: SellerApiCreateSellerProductRequest = {
  
  productInput: {
    title: "title_example",
    description: "description_example",
    price: 0,
    stock: 0,
    categoryId: "categoryId_example",
  },
};

const data = await apiInstance.createSellerProduct(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **productInput** | **ProductInput**|  |


### Return type

**Product**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Черновик создан |  -  |
**403** | Недостаточно прав |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **deleteProductImage**
> void deleteProductImage()


### Example


```typescript
import { createConfiguration, SellerApi } from '';
import type { SellerApiDeleteProductImageRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SellerApi(configuration);

const request: SellerApiDeleteProductImageRequest = {
  
  id: "id_example",
  
  imageId: "imageId_example",
};

const data = await apiInstance.deleteProductImage(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **imageId** | [**string**] |  | defaults to undefined


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

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listSellerOrderItems**
> ListSellerOrderItems200Response listSellerOrderItems()


### Example


```typescript
import { createConfiguration, SellerApi } from '';
import type { SellerApiListSellerOrderItemsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SellerApi(configuration);

const request: SellerApiListSellerOrderItemsRequest = {
  
  page: 1,
  
  perPage: 20,
};

const data = await apiInstance.listSellerOrderItems(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | [**number**] |  | (optional) defaults to 1
 **perPage** | [**number**] |  | (optional) defaults to 20


### Return type

**ListSellerOrderItems200Response**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Позиции заказов по своим товарам |  -  |
**401** | Не аутентифицирован |  -  |
**403** | Недостаточно прав |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listSellerProducts**
> ProductList listSellerProducts()


### Example


```typescript
import { createConfiguration, SellerApi } from '';
import type { SellerApiListSellerProductsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SellerApi(configuration);

const request: SellerApiListSellerProductsRequest = {
  
  page: 1,
  
  perPage: 20,
};

const data = await apiInstance.listSellerProducts(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | [**number**] |  | (optional) defaults to 1
 **perPage** | [**number**] |  | (optional) defaults to 20


### Return type

**ProductList**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Свои товары |  -  |
**401** | Не аутентифицирован |  -  |
**403** | Недостаточно прав |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **submitSellerProduct**
> Product submitSellerProduct()


### Example


```typescript
import { createConfiguration, SellerApi } from '';
import type { SellerApiSubmitSellerProductRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SellerApi(configuration);

const request: SellerApiSubmitSellerProductRequest = {
  
  id: "id_example",
};

const data = await apiInstance.submitSellerProduct(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**Product**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Статус &#x60;pending_moderation&#x60; |  -  |
**403** | Недостаточно прав |  -  |
**409** | Товар не в статусе draft/rejected |  -  |
**404** | Не найдено |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **updateSellerProduct**
> Product updateSellerProduct(productInput)

Одобренный товар при правке возвращается в draft и требует повторной модерации.

### Example


```typescript
import { createConfiguration, SellerApi } from '';
import type { SellerApiUpdateSellerProductRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SellerApi(configuration);

const request: SellerApiUpdateSellerProductRequest = {
  
  id: "id_example",
  
  productInput: {
    title: "title_example",
    description: "description_example",
    price: 0,
    stock: 0,
    categoryId: "categoryId_example",
  },
};

const data = await apiInstance.updateSellerProduct(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **productInput** | **ProductInput**|  |
 **id** | [**string**] |  | defaults to undefined


### Return type

**Product**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Товар обновлён |  -  |
**403** | Недостаточно прав |  -  |
**404** | Не найдено |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **uploadProductImage**
> ProductImage uploadProductImage()

multipart/form-data, поле `file`; jpeg/png/webp до 5 МБ. Первое изображение становится primary.

### Example


```typescript
import { createConfiguration, SellerApi } from '';
import type { SellerApiUploadProductImageRequest } from '';

const configuration = createConfiguration();
const apiInstance = new SellerApi(configuration);

const request: SellerApiUploadProductImageRequest = {
  
  id: "id_example",
  
  file: { data: Buffer.from(fs.readFileSync('/path/to/file', 'utf-8')), name: '/path/to/file' },
};

const data = await apiInstance.uploadProductImage(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined
 **file** | [**HttpFile**] |  | defaults to undefined


### Return type

**ProductImage**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: multipart/form-data
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Изображение загружено (в S3-хранилище, с превью) |  -  |
**403** | Недостаточно прав |  -  |
**404** | Не найдено |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


