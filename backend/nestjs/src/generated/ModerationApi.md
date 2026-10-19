# .ModerationApi

All URIs are relative to *http://localhost:8000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**approveProduct**](ModerationApi.md#approveProduct) | **POST** /moderator/products/{id}/approve | Одобрить товар
[**moderationQueue**](ModerationApi.md#moderationQueue) | **GET** /moderator/queue | Очередь модерации товаров
[**rejectProduct**](ModerationApi.md#rejectProduct) | **POST** /moderator/products/{id}/reject | Отклонить товар


# **approveProduct**
> Product approveProduct()


### Example


```typescript
import { createConfiguration, ModerationApi } from '';
import type { ModerationApiApproveProductRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ModerationApi(configuration);

const request: ModerationApiApproveProductRequest = {
  
  id: "id_example",
};

const data = await apiInstance.approveProduct(request);
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
**200** | Статус &#x60;approved&#x60; |  -  |
**403** | Недостаточно прав |  -  |
**404** | Не найдено |  -  |
**409** | Товар не в статусе &#x60;pending_moderation&#x60; |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **moderationQueue**
> ProductList moderationQueue()


### Example


```typescript
import { createConfiguration, ModerationApi } from '';
import type { ModerationApiModerationQueueRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ModerationApi(configuration);

const request: ModerationApiModerationQueueRequest = {
  
  page: 1,
  
  perPage: 20,
};

const data = await apiInstance.moderationQueue(request);
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
**200** | Товары в статусе &#x60;pending_moderation&#x60; |  -  |
**401** | Не аутентифицирован |  -  |
**403** | Недостаточно прав |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **rejectProduct**
> Product rejectProduct(rejectProductRequest)


### Example


```typescript
import { createConfiguration, ModerationApi } from '';
import type { ModerationApiRejectProductRequest } from '';

const configuration = createConfiguration();
const apiInstance = new ModerationApi(configuration);

const request: ModerationApiRejectProductRequest = {
  
  id: "id_example",
  
  rejectProductRequest: {
    reason: "reason_example",
  },
};

const data = await apiInstance.rejectProduct(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **rejectProductRequest** | **RejectProductRequest**|  |
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
**200** | Статус &#x60;rejected&#x60;, причина сохранена |  -  |
**403** | Недостаточно прав |  -  |
**404** | Не найдено |  -  |
**409** | Товар не в статусе &#x60;pending_moderation&#x60; |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


