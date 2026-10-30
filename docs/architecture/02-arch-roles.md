<!-- GENERATED из arch.model.json (фича 16, ADR-030). НЕ ПРАВИТЬ РУКАМИ: правь модель, затем devst arch canon -->
# Архитектура: роли и границы

> **Статус:** генерируемая проекция arch.model.json (ручные правки детектятся) · **Обновлено:** 2026-10-30
> **Суть:** карта архитектурных ролей и разрешённых границ — правится через модель, не руками.

> defaultDeny: да (не разрешено явно — запрещено)

## Роли

| Роль | Пути | Флаги | Откуда (why) |
|---|---|---|---|
| nest/domain | backend/nestjs/src/domain/** | циклы внутри запрещены | Clean: сущности и ошибки контракта; не зависят ни от кого |
| nest/application | backend/nestjs/src/application/** | — | Clean: use-cases (сервисы фич, порты, конфиг); зависят только от domain; Repository<T> TypeORM считается портом к данным |
| nest/infrastructure | backend/nestjs/src/infrastructure/** | — | Clean: адаптеры — S3-хранилище (реализация порта ImageStorage), логгер |
| nest/presentation | backend/nestjs/src/presentation/** | — | Clean: HTTP-слой — контроллеры, DTO, гарды, фильтр ошибок, метрики, health |
| laravel/domain | backend/laravel/app/Domain/** | циклы внутри запрещены | Clean: Eloquent-модели как доменные сущности (прагматичный Clean, ADR-014); не зависят ни от кого |
| laravel/application | backend/laravel/app/Application/** | — | Clean: use-cases — сервисы (CartResolver и будущие) |
| laravel/infrastructure | backend/laravel/app/Infrastructure/** | — | Clean: адаптеры; пока пусто — матрица охраняет направление на будущее |
| laravel/presentation | backend/laravel/app/Http/** | — | Clean: HTTP-слой Laravel — контроллеры, Requests, Resources, Middleware |
| laravel/composition | backend/laravel/app/Providers/** | — | Корень композиции Laravel: провайдеры связывают слои |
| spring4/domain | backend/spring4/src/**/*Row.java, backend/spring4/src/**/*View*.java, backend/spring4/src/**/ContractException.java, backend/spring4/src/**/PageMeta.java, backend/spring4/src/**/PageResponse.java | — | Clean: строки БД, формы контракта, контрактная ошибка, пагинация — ни от кого не зависят (ADR-015). Слои по суффиксам классов внутри фича-пакетов — массив глобов (DSL devst, сессия 54) |
| spring4/application | backend/spring4/src/**/*Service.java | — | Clean: use-cases; JdbcTemplate-репозитории инжектятся напрямую — приложение зависит от infrastructure (прагматичный Clean, ADR-015) |
| spring4/infrastructure | backend/spring4/src/**/*Repository.java, backend/spring4/src/**/S3Storage.java, backend/spring4/src/**/ImageThumbs.java, backend/spring4/src/**/S3Props.java | — | Clean: SQL-репозитории, S3-адаптер, превью, конфиг S3 |
| spring4/presentation | backend/spring4/src/**/*Controller.java, backend/spring4/src/**/AuthFilter.java, backend/spring4/src/**/RolesInterceptor.java, backend/spring4/src/**/CurrentUserArgumentResolver.java, backend/spring4/src/**/CurrentUser.java, backend/spring4/src/**/Roles.java, backend/spring4/src/**/ApiExceptionHandler.java | — | Clean: HTTP-слой — контроллеры, Bearer-фильтр, роли-интерсептор, резолвер пользователя, обработчик ошибок контракта |
| spring4/composition | backend/spring4/src/**/Spring4Application.java, backend/spring4/src/**/WebConfig.java | — | Корень композиции: main + CORS/интерсепторы |
| spring27/domain | backend/spring27/src/** | суффиксы: Row, View, Views, Exception, Meta, Response | Clean: строки БД, формы контракта, контрактная ошибка, пагинация (ADR-015). Суффикс-роли на одном глобе — DSL devst, сессия 54; суффиксы непересекающиеся |
| spring27/application | backend/spring27/src/** | суффиксы: Service | Clean: use-cases; репозитории инжектятся напрямую — зависит от infrastructure (прагматичный Clean, ADR-015) |
| spring27/infrastructure | backend/spring27/src/** | суффиксы: Repository, Storage, Thumbs, Props | Clean: SQL-репозитории, S3-адаптер, превью, конфиг S3 |
| spring27/presentation | backend/spring27/src/** | суффиксы: Controller, Filter, Interceptor, Resolver, Advice, Handler, CurrentUser, Roles | Clean: HTTP-слой — контроллеры, Bearer-фильтр, роли-интерсептор, резолвер, обработчик ошибок контракта |
| spring27/composition | backend/spring27/src/** | суффиксы: Application, Config | Корень композиции: main + CORS/интерсепторы |
| quasar/app | frontend/vue-quasar/src/app/** | — | FSD-слой app: App.vue, main, router |
| quasar/pages | frontend/vue-quasar/src/pages/** | slices (горизонтали слайсов запрещены) | FSD-слой pages: экраны-слайсы, горизонталь запрещена |
| quasar/shared | frontend/vue-quasar/src/shared/** | — | FSD-слой shared: api-клиент, сторы |
| vue2/app | frontend/vue2/src/app/** | — | FSD-слой app: App.vue, main, router |
| vue2/pages | frontend/vue2/src/pages/** | slices (горизонтали слайсов запрещены) | FSD-слой pages: экраны-слайсы, горизонталь запрещена |
| vue2/shared | frontend/vue2/src/shared/** | — | FSD-слой shared: api-клиент, стор |
| react/app | frontend/react/src/app/** | — | FSD-слой app: App, main |
| react/pages | frontend/react/src/pages/** | slices (горизонтали слайсов запрещены) | FSD-слой pages: экраны-слайсы, горизонталь запрещена |
| react/shared | frontend/react/src/shared/** | — | FSD-слой shared: api-клиент, стор, ui-обёртки |
| next/pages | frontend/next/src/app/** | — | FSD-слой pages: App Router Next — роутинг и экраны (src/app — конвенция Next, ADR-014); slices не включены — файлы маршрута не слайсы, кросс-импорты внутри app/ — идиома фреймворка |
| next/shared | frontend/next/src/shared/** | — | FSD-слой shared: client/server api-клиенты |
| sk/app | frontend/sveltekit/src/routes/+layout* | — | FSD-слой app: корневая оболочка SvelteKit (+layout) |
| sk/pages | frontend/sveltekit/src/routes/** | slices (горизонтали слайсов запрещены) | FSD-слой pages: маршруты SvelteKit — экраны-слайсы |
| sk/shared | frontend/sveltekit/src/shared/** | — | FSD-слой shared: api, сессия, ui |
| nuxt/app | frontend/nuxt/app.vue | — | FSD-слой app: корневая оболочка Nuxt |
| nuxt/pages | frontend/nuxt/pages/** | slices (горизонтали слайсов запрещены) | FSD-слой pages: экраны-слайсы |
| nuxt/features | frontend/nuxt/features/** | slices (горизонтали слайсов запрещены) | FSD-слой features: фича auth (форма) |
| nuxt/shared | frontend/nuxt/shared/** | — | FSD-слой shared: api, сессия (auto-import настраивается в nuxt.config) |
| angular/app | frontend/angular/src/app/app.* | — | FSD-слой app: корневой компонент, конфиг, роуты Angular |
| angular/pages | frontend/angular/src/app/pages/** | slices (горизонтали слайсов запрещены) | FSD-слой pages: экраны-компоненты |
| angular/shared | frontend/angular/src/app/shared/** | — | FSD-слой shared: сессия-сервис |

## Границы (разрешённые импорты)

```mermaid
graph TD
  nest_application --> nest_domain
  nest_infrastructure --> nest_application
  nest_infrastructure --> nest_domain
  nest_presentation --> nest_application
  nest_presentation --> nest_domain
  nest_presentation --> nest_infrastructure
  laravel_application --> laravel_domain
  laravel_infrastructure --> laravel_application
  laravel_infrastructure --> laravel_domain
  laravel_presentation --> laravel_application
  laravel_presentation --> laravel_domain
  laravel_composition --> laravel_application
  laravel_composition --> laravel_domain
  laravel_composition --> laravel_infrastructure
  laravel_composition --> laravel_presentation
  spring4_application --> spring4_domain
  spring4_application --> spring4_infrastructure
  spring4_infrastructure --> spring4_domain
  spring4_presentation --> spring4_application
  spring4_presentation --> spring4_domain
  spring4_presentation --> spring4_infrastructure
  spring4_composition --> spring4_application
  spring4_composition --> spring4_domain
  spring4_composition --> spring4_infrastructure
  spring4_composition --> spring4_presentation
  spring27_application --> spring27_domain
  spring27_application --> spring27_infrastructure
  spring27_infrastructure --> spring27_domain
  spring27_presentation --> spring27_application
  spring27_presentation --> spring27_domain
  spring27_presentation --> spring27_infrastructure
  spring27_composition --> spring27_application
  spring27_composition --> spring27_domain
  spring27_composition --> spring27_infrastructure
  spring27_composition --> spring27_presentation
  quasar_app --> quasar_pages
  quasar_app --> quasar_shared
  quasar_pages --> quasar_shared
  vue2_app --> vue2_pages
  vue2_app --> vue2_shared
  vue2_pages --> vue2_shared
  react_app --> react_pages
  react_app --> react_shared
  react_pages --> react_shared
  next_pages --> next_shared
  sk_app --> sk_pages
  sk_app --> sk_shared
  sk_pages --> sk_shared
  nuxt_app --> nuxt_pages
  nuxt_app --> nuxt_features
  nuxt_app --> nuxt_shared
  nuxt_pages --> nuxt_features
  nuxt_pages --> nuxt_shared
  nuxt_features --> nuxt_shared
  angular_app --> angular_pages
  angular_app --> angular_shared
  angular_pages --> angular_shared
```

## Контракты узлов

| Роль | Контракт |
|---|---|
| quasar/pages | slices: горизонтали между слайсами запрещены |
| vue2/pages | slices: горизонтали между слайсами запрещены |
| react/pages | slices: горизонтали между слайсами запрещены |
| sk/pages | slices: горизонтали между слайсами запрещены |
| nuxt/pages | slices: горизонтали между слайсами запрещены |
| nuxt/features | slices: горизонтали между слайсами запрещены |
| angular/pages | slices: горизонтали между слайсами запрещены |
