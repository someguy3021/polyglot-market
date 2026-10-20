# Сессия 8 (2026-10-20): Dockerfile всех фронтов, check:all — полный локальный прогон

> **Суть:** дописаны Dockerfile-обёртки всех оставшихся фронтов (6 штук: SPA-шаблон для quasar/vue2/angular, SSR-шаблоны для nuxt/next/sveltekit), собран `pnpm check:all` — локальный аналог CI одной командой, полностью зелёный.
> **Коммиты:** 256b240 (check:all + docker-шаблоны) — поверх коммитов сессии 07.
> **Файлы:** frontend/*/Dockerfile + serve.mjs, scripts/check-all.mjs, scripts/lib/warm-front.mjs.

## Что сделано

- **SPA-шаблон** (vue-quasar, vue2, angular): multi-stage — pnpm partial install → build → node:24-alpine + serve.mjs (статик + /config.js из env API_URL). Angular — SPA_ROOT=dist/angular-frontend/browser.
- **SSR-шаблоны**: nuxt (.output + nitro PORT), next (.next + next start, node_modules в runtime), sveltekit (adapter-node: build + node_modules, node build).
- **window.API_URL runtime-обвязка** во все 5 фронтов (quasar, vue2, angular, sveltekit, nuxt, next): клиент читает window.API_URL из /config.js, который контейнер генерирует из env — runtime-смена адреса API без пересборки (ADR-007).
- **sveltekit переведён на adapter-node** (adapter-auto в контейнере не детектит платформу) — SSR-контейнер отдаёт каталог с товарами.
- **check:all** (аналог CI локально): spectral → юниты Laravel (если есть PHP) → юниты NestJS → conformance (автопоиск живого бекенда :8010/:3000) → E2E (автопоиск фронта :9000/:3001, per-front spec файлы, db:reset с нуля, прогрев фронта).

## Грабли сессии

- **`${{ }}` в template literal Angular** — NG1010 «template must be a string» (это JS-интерполяция); цены через `{{ '$' + ... }}`; private-поля в шаблоне при strictTemplates — ошибка; Reflector из @nestjs/core; @angular/animations — отдельный пакет.
- **Призрачная ошибка esbuild** («строки 23/15 не совпадают с файлом») — корень: `return $app;` стоял выше объявления `json_error()` в bootstrap/app.php → при исключении функция не объявлена → 500 → E2E/юниты сыпались каскадом. Перенос объявления до return.
- **Angular-esbuild не резолвит**: TS-исходники и каталог-импорты из node_modules → api-client собран в ESM-dist (type:module), types из src, импорт `./generated/index` явный.
- **`.dockerignore` режет `**/dist`** — api-client dist не попадал в контекст → сборка SDK обязательна в Dockerfile'ах всех фронтов.
- **check:all падал на e2e**: квазар-сьют с чужими селекторами гонялся против react-фронта → per-front spec файлы.
- **NestJS в контейнере**: main.ts слушал 127.0.0.1 (в контейнере снаружи недостижимо) → 0.0.0.0; был без CORS; @aws-sdk/client-s3 и sharp должны быть в package.json бекенда (не только в корне).

## Что осталось

- Docker-образы остальных фронтов — шаблоны готовы (SPA/SSR), собрать по одному на проверку (сеть уже не блокирует).
- Ночная матрица в CI — воркфлоу готов, включается schedule'ом.
- Роль-сценарии E2E (admin/seller/moderator) — каркас специка готов.
- Видео-демо (фича 17) — запись автора.

## Гейт закрытия сессии (фича 04 §7)

- Затронутые задачи сведены: «задач нет»
- Хвостов нет
- Свип: чужих доков нет

## Итог

- Состояние: `pnpm check:all` полностью зелёный (spectral, юниты 7/7+7/7, conformance 17/17, E2E); docker-образы vue2 и react проверены запуском; все 6 новых Dockerfile по шаблонам; `devst check` 0/0.
EOF
echo written