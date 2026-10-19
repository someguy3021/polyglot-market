# .AuthApi

All URIs are relative to *http://localhost:8000*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getMe**](AuthApi.md#getMe) | **GET** /auth/me | Текущий пользователь
[**login**](AuthApi.md#login) | **POST** /auth/login | Вход по email и паролю
[**register**](AuthApi.md#register) | **POST** /auth/register | Регистрация покупателя


# **getMe**
> User getMe()


### Example


```typescript
import { createConfiguration, AuthApi } from '';

const configuration = createConfiguration();
const apiInstance = new AuthApi(configuration);

const request = {};

const data = await apiInstance.getMe(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters
This endpoint does not need any parameter.


### Return type

**User**

### Authorization

[bearerAuth](README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | Профиль текущего пользователя |  -  |
**401** | Не аутентифицирован |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **login**
> AuthToken login(loginInput)


### Example


```typescript
import { createConfiguration, AuthApi } from '';
import type { AuthApiLoginRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AuthApi(configuration);

const request: AuthApiLoginRequest = {
  
  loginInput: {
    email: "email_example",
    password: "password_example",
  },
};

const data = await apiInstance.login(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **loginInput** | **LoginInput**|  |


### Return type

**AuthToken**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**200** | JWT-токен и пользователь |  -  |
**401** | Не аутентифицирован |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)

# **register**
> AuthToken register(registerInput)

Создаёт пользователя с ролью `buyer`. Продавцов/модераторов назначает админ.

### Example


```typescript
import { createConfiguration, AuthApi } from '';
import type { AuthApiRegisterRequest } from '';

const configuration = createConfiguration();
const apiInstance = new AuthApi(configuration);

const request: AuthApiRegisterRequest = {
  
  registerInput: {
    name: "name_example",
    email: "email_example",
    password: "password_example",
  },
};

const data = await apiInstance.register(request);
console.log('API called successfully. Returned data:', data);
```


### Parameters

Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **registerInput** | **RegisterInput**|  |


### Return type

**AuthToken**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
**201** | Пользователь создан |  -  |
**422** | Ошибка валидации входных данных |  -  |

[[Back to top]](#) [[Back to API list]](README.md#documentation-for-api-endpoints) [[Back to Model list]](README.md#documentation-for-models) [[Back to README]](README.md)


