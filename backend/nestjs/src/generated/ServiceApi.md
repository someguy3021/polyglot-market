# .ServiceApi

All URIs are relative to *http://localhost:8000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getHealth**](ServiceApi.md#getHealth) | **GET** /health | Живость сервиса


# **getHealth**
> GetHealth200Response getHealth()


### Example


```typescript
import { createConfiguration, ServiceApi } from '';

const configuration = createConfiguration();
const apiInstance = new ServiceApi(configuration);

const request = {};

const data = await apiInstance.getHealth(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**GetHealth200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Сервис работает |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


