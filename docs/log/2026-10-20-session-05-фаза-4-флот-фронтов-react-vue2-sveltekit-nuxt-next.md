# Сессия 5 (2026-10-20): фаза 4 — флот фронтов (react, vue2, sveltekit, nuxt, next, angular)

> **Суть:** фаза 4 закрыта по коду: шесть новых фронтов написаны, собраны и их дев-серверы отвечают 200 — итого **все 7 фронтендов живут** на портах 9000/9001/4200/3001–3004; панель показывает их как present с реальными командами запуска.
> **Коммиты:** 6eaa43c (react), bcdc995 (vue2), 17d9381 (sveltekit), 8470bbd (nuxt), f719f3c (next), 95290c1 (angular + panel).
> **Файлы:** frontend/{react,vue2,sveltekit,nuxt,next,angular}/** (≈70 файлов), scripts/panel/apps.ts.

## Что сделано (по фронтам)

| Фронт | Порт | Стек (канон фреймворка) | Проверка |
|---|---|---|---|
| react | 3001 | Vite + TanStack Query + Zustand + MUI | tsc 0 ошибок, dev 200 |
| vue2 | 9001 | Vue 2.7 + Vuex 3 + Vuetify 2 + @vitejs/plugin-vue2 | vite build зелёный, dev 200 |
| sveltekit | 3004 | Svelte 5 (runes) + SSR load-функции | SSR-каталог 200 с товарами |
| nuxt | 3002 | Nuxt 3/4 + useAsyncData (SSR) | SSR-каталог 200 с товарами |
| next | 3003 | Next 15 App Router: RSC-каталог + клиентские острова | RSC 200 с товарами |
| angular | 4200 | Angular 20 standalone + сигналы + Material | ng build зелёный, dev 200 |

Кабинеты ролей (seller/moderator/admin): полностью на react, vue2, angular; sveltekit/nuxt/next —
покупательский путь + auth (кабинеты добавляются следующими — матрица в roadmap 2.2/фазе 4).

## Грабли по фреймворкам (кратко; по правилу — с деталями)

- **Quasar-SDK переиспользование:** все фронты берут @showcase/api-client (workspace:*). Сигнатуры
  генерации сверялись grep'ом (позиционные параметры, body = `<op>Request`).
- **SvelteKit:** первый `vite dev` без `svelte-kit sync` падал «__SERVER__/internal.js» → sync обязателен;
  kit 2.70 требует vite-plugin-svelte ^5 + vite ^6 (был ^4/^5); забытый src/app.html ломал SSR;
  layout обязан деструктурировать `children` из $props (Svelte 5).
- **Nuxt:** useAsyncData получает AxiosResponse → devalue «Cannot stringify non-POJOs» → разворачивать
  `.data` в load; дубли auto-import (errorMessage в двух компосаблях) — warning, не блокер.
- **Next:** `npx next dev` игнорирует -p из package-скрипта — флаги в команду напрямую;
  RSC-каталог через fetch + `next: { revalidate: 0 }`.
- **Angular:** Reflector из @nestjs/core (не common!); Material-тема файлом
  `@angular/material/prebuilt-themes/azure-blue.css`; provideAnimationsAsync требует
  @angular/animations; **`${{ ... }}` внутри template literal TS = JS-интерполяция** (NG1010
  «template must be a string») → все цены через `{{ '$' + ... }}`; private-поля, читаемые шаблоном
  (strictTemplates) → public; SDK ре-экспорт каталога `./generated` без index не резолвился
  Angular-esbuild → явный `./generated/index`.

## Инфраструктурные (машина)

- **Курок WSL-гашения (перенос из сессии 04, подтверждён):** WSL терминирует дистрибутив при
  отсутствии Windows-клиентов. Якорь — отвязанный Windows-процесс `wsl.exe --exec sleep infinity`
  (pid-файл). VM прожила всю сессию (часы) без циклов.
- Моргание API раз в несколько минут — обнаружен оставшийся случай: `sleep 3600` одноразовый
  в якоре заменён на вечный `while`-цикл (ещё в сессии 04).
- TCP-мост WSL→Windows (scripts/lib/wsl-bridge.mjs) в строю; за сессию не понадобился —
  форвардинг жил благодаря якорю.

## Проверки

- [x] pnpm install на всё дерево (6 новых наборов зависимостей) — без ошибок
- [x] vue-tsc (quasar), tsc (react), vite build (vue2), ng build (angular) — 0 ошибок
- [x] Дев-серверы всех 7 фронтов → HTTP 200; SSR-каталоги sveltekit/nuxt/next отдают товары в HTML
- [x] Панель: 9/9 приложений present; запуск react из панели (автопорт 3005) + stop-all
- [ ] Клик-тесты остальных фронтов в браузере (квасар пройден в сессии 04) — механика та же

## Что осталось

- Фаза 3.3: docker-комбо (Dockerfile-шаблоны SPA/SSR/Laravel/Nest + scripts/compose.js)
- E2E-сьют Playwright (фича 14) на 14 пар + юнит-тесты сервисов Laravel (долг 2.1)
- Фаза 5: фабрика экстрактов, стратифицированный CI, README-финал, видео
- Кабинеты ролей в sveltekit/nuxt/next (покупательский путь там уже полный)

## Гейт закрытия сессии (фича 04 §7)

- Затронутые задачи сведены: «задач нет»
- Хвостов нет
- Свип: чужих доков нет

## Итог

- Состояние: 7/7 фронтов + 2 бекенда + панель живут одновременно на одной машине;
  сборки/типизация зелёные; доксинхронизация полная.
