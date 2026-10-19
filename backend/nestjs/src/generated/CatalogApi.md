# .CatalogApi

All URIs are relative to *http://localhost:8000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getProduct**](CatalogApi.md#getProduct) | **GET** /products/{id} | Карточка товара
[**listCategories**](CatalogApi.md#listCategories) | **GET** /categories | Категории каталога
[**listProducts**](CatalogApi.md#listProducts) | **GET** /products | Каталог одобренных товаров


# **getProduct**
> Product getProduct()


### Example


```typescript
import { createConfiguration, CatalogApi } from '';
import type { CatalogApiGetProductRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CatalogApi(configuration);

const request: CatalogApiGetProductRequest = {
  
  id: "id_example",
};

const data = await apiInstance.getProduct(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **id** | [**string**] |  | defaults to undefined


### Return type

**Product**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Товар с картинками, категорией и продавцом |  -  |
**404** | Не найдено |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listCategories**
> ListCategories200Response listCategories()


### Example


```typescript
import { createConfiguration, CatalogApi } from '';

const configuration = createConfiguration();
const apiInstance = new CatalogApi(configuration);

const request = {};

const data = await apiInstance.listCategories(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**ListCategories200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Плоский список категорий |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **listProducts**
> ListProducts200Response listProducts()


### Example


```typescript
import { createConfiguration, CatalogApi } from '';
import type { CatalogApiListProductsRequest } from '';

const configuration = createConfiguration();
const apiInstance = new CatalogApi(configuration);

const request: CatalogApiListProductsRequest = {
  
  page: 1,
  
  perPage: 20,
    // Slug категории (optional)
  category: "category_example",
    // Slug магазина продавца (optional)
  seller: "seller_example",
    // Полнотекстовый поиск по названию (pg_trgm) (optional)
  q: "q_example",
  
  priceMin: 0,
  
  priceMax: 0,
  
  sort: "newest",
};

const data = await apiInstance.listProducts(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **page** | [**number**] |  | (optional) defaults to 1
 **perPage** | [**number**] |  | (optional) defaults to 20
 **category** | [**string**] | Slug категории | (optional) defaults to undefined
 **seller** | [**string**] | Slug магазина продавца | (optional) defaults to undefined
 **q** | [**string**] | Полнотекстовый поиск по названию (pg_trgm) | (optional) defaults to undefined
 **priceMin** | [**number**] |  | (optional) defaults to undefined
 **priceMax** | [**number**] |  | (optional) defaults to undefined
 **sort** | [**&#39;newest&#39; | &#39;oldest&#39; | &#39;price_asc&#39; | &#39;price_desc&#39;**]**Array<&#39;newest&#39; &#124; &#39;oldest&#39; &#124; &#39;price_asc&#39; &#124; &#39;price_desc&#39;>** |  | (optional) defaults to 'newest'


### Return type

**ListProducts200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Страница каталога |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


