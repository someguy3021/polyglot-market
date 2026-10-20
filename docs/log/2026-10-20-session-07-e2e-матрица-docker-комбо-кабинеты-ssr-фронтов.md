# Сессия 7 (2026-10-20): E2E-матрица, docker-комбо, кабинеты SSR-фронтов

> **Суть:** доказана E2E-матрица на живых парах (quasar×laravel 2/2, quasar×nestjs 2/2, react×laravel 1/1, react×nestjs-в-docker 1/1 — один сьют, разные E2E_FRONT_URL); фаза 3.3 docker-комбо реализована и проверена снаружи (react×nestjs в 4 контейнерах); кабинеты ролей дописаны в sveltekit/nuxt/next; юнит-тесты 7/7+7/7.
> **Коммиты:** c83362a (юниты), 6bb8375 (e2e), 95290c1 (angular+panel), caf6f1e (фабрика+CI+llms), fe79370/408a5a8 (docs), b8668e7→cc5b4e8 (docker combo + кабинеты + фиксы).
> **Файлы:** packages/e2e/**, packages/api-client (ESM), backend/nestjs (cart fix + Dockerfile), frontend/{react,sveltekit,nuxt,next,angular}/**, scripts/{combo,combo-down,extract-stack}.mjs, .github/workflows/ci.yml, llms.txt.

## Что сделано

- **Кабинеты ролей** в sveltekit/nuxt/next (9 страниц): продавец (список/на модерацию/картинки), модератор (approve/reject с причиной), админ (заказы + селект допустимых переходов) + nav-ссылки в хедерах. Фаза 4 закрыта полностью.
- **Фаза 3.3 docker-комбо:** scripts/combo.mjs генерирует самодостаточный компоуз (postgres из infra по host-gateway + бекенд + фронт), Dockerfile-шаблоны: SPA = node-runtime + serve.mjs + config.js runtime-API_URL; NestJS = tsc build + prod-deps; Laravel = php-cli + composer. Проверено снаружи: nest /health 200, SPA 200 + config.js, товары через контейнерный API.
- **E2E-матрица**: один сьют покупательского пути, E2E_FRONT_URL переключает пару. Грабли локаторов: Quasar — label вместо placeholder, радио кликается по тексту, бейдж корзины `header .q-badge`; MUI — то же (label); устойчивость — товары с `в наличии: \d{2,}`.
- **Юнит-тесты** контрактной логики: PHPUnit 7/7 (промо-правила, TRANSITIONS), vitest 7/7 (паритет). Грабли: json_error() дублировался при повторном инклуде bootstrap → function_exists guard; `new PromoCode` без БД имеет active=null (в БД дефолт true) — в тестах задавать явно.
- **SDK ESM**: api-client пересобран (type:module, ES2022) — CJS-дист не экспортировал именованные символы для Vite/Rollup; types остались src/index.ts.
- **Фикс реального бага (пойман E2E):** NestJS CartService.resolve фильтровал корзину по converted:false — после первого заказа unique(user_id) давал 500 на новом добавлении. Паритет с Laravel: переиспользовать строку, сбрасывая converted.
- **Фабрика экстрактов** (5.2) + **CI** (5.3: spectral, SDK-drift, юниты, типизация флагманов, nightly-матрица) + **llms.txt** (5.4).

## Грабли сессии

- cdn.playwright.dev блокирован → channel:chrome (системный Chrome).
- combo-down убивал WSL-якорь → VM гасла → postgres недоступен. Якорь теперь живёт после combo-down (гаснет только при infra down/reset).
- Docker registry флейкает (auth timeout) — library-образы тянутся ретраями; nginx:alpine не дождался → SPA-runtime на node:24-alpine.
- NestJS main.ts слушал 127.0.0.1 — в контейнере снаружи недостижимо → 0.0.0.0.
- NestJS без CORS — react-фронт в комбо не мог позвать API → enableCors + exposedHeaders X-Cart-Token.
- api-client CJS-дист не именует экспорты для Rollup → ESM (type:module).

## Что осталось

- Docker-образы остальных фронтов (шаблон SPA одинаков; angular/nuxt/next/sveltekit — copy-paste с портами).
- Ночные прогоны полной матрицы в CI (воркфлоу готов, включить schedule).
- Видео-демо (фича 17) — запись автора.

## Гейт закрытия сессии (фича 04 §7)

- Затронутые задачи сведены: «задач нет»
- Хвостов нет
- Свип: чужих доков нет

## Итог

- Состояние: E2E 2/2+2/2+1/1+1/1 (четыре пары), юниты 7/7+7/7, spectral 0, комбо в контейнерах проверено снаружи; `devst check` 0/0; дерево чистое.

## Дополнение 1 (2026-10-20): E2E-матрица как раннер

- `scripts/e2e-matrix.mjs` + `pnpm e2e:matrix` — раннер пар: для каждой пары db:reset →
  quasar dev перезапускается с VITE_API_URL бекенда → спеки покупательского пути своего фронта.
  Пара 9000:8010 — 2 passed зелёные.
- Матрица гоняет ТОЛЬКО покупательские спеки своего фронта (селекторы фреймворк-специфичны);
  роль-сценарии roles.quasar.spec.ts — opt-in прогон против quasar×laravel (зелёные: seller →
  moderator цепочка, admin new→paid).
- Исправления по пути: json_error() перенос до `return $app` (каскадный падеж conformance/юнитов),
  vendor/bin/phpunit путь в check:all, /health-проб в базовом URL конформанса.
