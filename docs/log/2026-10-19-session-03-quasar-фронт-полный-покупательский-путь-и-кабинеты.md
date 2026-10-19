# Сессия 3 (2026-10-19): Quasar-фронт: полный покупательский путь и кабинеты ролей

> **Суть:** фича 07 реализована полностью — флагманский фронт Vue 3 + Quasar (17 файлов, vue-tsc strict без ошибок): каталог с фильтрами, карточка, гостевая корзина с мерджем, checkout с промокодом и Idempotency-Key, кабинеты продавца/модератора/админа; живой клик-тест заблокирован циклящим docker-демоном WSL (машина, не репа).
> **Коммиты:** см. конец сессии.
> **Файлы:** frontend/vue-quasar/** (20 файлов), scripts/panel/**, scripts/lib/{docker,exec,wsl-bridge}.mjs

## Что сделано

- **Ядро:** package.json (quasar 2.17, pinia, vue-router 4, @showcase/api-client workspace:*), vite.config
  (@quasar/vite-plugin без sass), tsconfig strict, .env.development (VITE_API_URL=…:8010 — порт этой машины).
- **Клиент** (src/api/client.ts): createApiClient с геттерами токенов из localStorage; одноразовый
  Idempotency-Key для POST /orders (setOrderIdempotencyKey, ADR-011); errorMessage() вытаскивает
  message/details из формата ошибок контракта.
- **Сторы:** session (token/user/cartToken + persist + mergeGuestCart после login/register),
  cart (load/add/setQuantity/remove; гостевой токен из заголовка X-Cart-Token ответа).
- **Страницы покупателя:** каталог (поиск debounce, категория, цена от/до, сортировка, пагинация,
  скелетоны), карточка (галерея, количество), корзина (±количество, удаление), checkout (способы
  доставки radio, проверка промокода WELCOME10, адрес, расчёт итога, подтверждение), заказы (чипы
  статусной машины), login/register (демо-креды на форме).
- **Кабинеты ролей:** продавец (QTable своих товаров, диалог создания, «на модерацию», q-file загрузка
  картинки), модератор (очередь, approve / reject с диалогом причины), админ (заказы + смена статуса
  через select допустимых переходов статусной машины TRANSITIONS).
- **Роутер:** guards meta.auth и meta.roles (seller/moderator/admin), redirect на /login?next=….

## Грабли (в память)

- Сигнатуры сгенерированного SDK: параметры позиционные (listProducts(page, perPage, category,
  seller, q, priceMin, priceMax, sort)), body-аргументы названы `<operationId>Request`
  (rejectProduct(id, rejectProductRequest)) — сверял grep'ом api.ts, не догадками.
- createOrder требует (idempotencyKey, body) — первым аргументом именно заголовок.
- Сгенерённые модели делают поля опциональными (subtotal?: number) → toView() в cart-сторе
  принимает RawCart с опциональными полями и нормализует.
- QFile требует modelValue → `:model-value="null"` при использовании только @update:model-value.
- Vue-tsc strict: 7 ошибок при первом прогоне (OrderStatus enum в updateOrderStatus, отсутствие
  subtotal в raw-типе, createOrder с 1 аргументом) — все сведены.

## Хронология инфраструктурных граблей этой машины (подробно — по правилу логов)

- **CORS №1:** браузер на 127.0.0.1:9000, а CORS_ORIGINS разрешал только localhost:9000 →
  «No Access-Control-Allow-Origin» → добавлены оба хоста для всех портов фронтов (.env и .env.example).
- **CORS №2:** заголовок всё равно не появлялся — config/cors.php paths=['api/*'] не матчит пути
  контракта (apiPrefix пустой, роуты в корне) → paths=['*'].
- **WSL-гашение №2:** postgres «Up about an hour» умер: keep-alive был `setsid sleep 3600` —
  одноразовый sleep истёк через час, VM погасла (exit 255, clean shutdown) → вечный якорь
  `setsid nohup sh -c "while :; do sleep 3600; done"`.
- **WSL-forwarding №1:** после перезапуска VM проброс 127.0.0.1:5432 не перерегистрировался
  (netstat: нет LISTEN на Windows; внутри WSL pg_isready — ok; WSL IP 172.20.45.71) — известное
  поведение Win10. `wsl --shutdown` + чистый infra:up помог разово.
- **WSL-forwarding №2 (системное):** через минуты forwarding снова умер; диагностика показала
  **сам docker.service в WSL в состоянии activating/цикла** (ps etimes dockerd = 9 секунд, все
  контейнеры обоих проектов «Up 6–24 секунды», RestartCount=0, OOM=false, VM uptime 14 мин) —
  циклится сам демон, вероятно их соседний тулинг. Это НЕ наша инфраструктура; наш стек
  (keep-alive, s3rver-fallback, TCP-мост) отработал как спроектирован.
- **Мост (новое):** scripts/lib/wsl-bridge.mjs + ensureForward() в infra.mjs — если
  127.0.0.1:<порт> не отвечает, поднимается Windows-сайд TCP-прокси на WSL IP (pid-файл,
  автоперезапуск при up). В текущем цикле демона не спасает (контейнеры сами рестартуют),
  но чинит класс проблем «forwarding отвалился».

## Проверки

- [x] `vue-tsc --noEmit` — 0 ошибок (после сведения 7 типовых нестыковок со сгенерённым SDK).
- [x] Рендер приложения в браузере (devtools MCP): layout, хедер, фильтры, ошибки API корректно
  всплывают Notify — компонентная база работает.
- [x] API в стабильных окнах: /products, /categories отдают данные с CORS-заголовками
  (curl с Origin — 200 + access-control-allow-origin).
- [ ] **Клик-тест покупательского пути** — ЗАБЛОКИРОВАН: docker-демон WSL этой машины циклится
  (dockerd etimes 9с, контейнеры flap'аются каждые ~15–60с). Не блокирует код: тот же API уже
  доказан conformance 17/17 (сессия 02). Вернуться при стабильном docker (см. чекбокс roadmap 2.2).

## Что осталось

- Клик-тест в браузере (2 минуты при стабильном docker): каталог → корзина → login+мердж →
  checkout с WELCOME10 → заказ → админ смена статуса; скриншот.
- Юнит-тесты сервисов Laravel (долг 2.1), E2E Playwright-пара (2.3).

## Гейт закрытия сессии (фича 04 §7)

- Затронутые задачи сведены: «задач нет»
- Хвостов нет
- Свип: чужих доков нет

## Итог

- Состояние: vue-tsc 0 ошибок; приложение собирается и рендерится; API-сторона пары доказана
  ранее (conformance 17/17); инфра-скрипты расширены мостом и вечным keep-alive.
