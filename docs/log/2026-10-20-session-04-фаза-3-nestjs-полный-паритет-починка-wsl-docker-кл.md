# Сессия 4 (2026-10-20): фаза 3 — NestJS полный паритет, починка WSL-docker, клик-тест Quasar

> **Суть:** NestJS доведён до полного паритета контракта (conformance 17/17 против :3000 — как и у Laravel); найден и починен курок гашения WSL-docker; покупательский путь Quasar-фронта пройден живьём в браузере от каталога до заказа ($21.19 с WELCOME10).
> **Коммиты:** см. конец сессии.
> **Файлы:** backend/nestjs/** (+14 файлов), scripts/lib/{docker,wsl-bridge}.mjs, panel/**, docs.

## 1. Починка WSL-docker (просьба автора — «раньше работало, копай»)

- **Курок найден в journalctl прошлого бута:** `WSL ERROR: InitTerminateInstanceInternal:2901:
  systemctl poweroff did not terminate the instance in 10000 ms, calling reboot(RB_POWER_OFF)` —
  WSL ТЕРМИНИРУЕТ дистрибутив, когда на Windows-стороне не остаётся клиентов. Процессы внутри VM
  (мой setsid-якорь, docker daemon) при этом не считаются — поэтому внутривенный keep-alive не спасал.
- **Фикс:** keepWslAlive теперь поднимает отвязанный Windows-процесс `wsl.exe --exec sleep infinity`
  (detached+unref, pid-файл .infra/wsl-alive.pid) — постоянная клиент-сессия. Внутривенный цикл
  оставлен второй линией.
- **Проверка временем:** после фикса VM прожила всю сессию (uptime 33+ мин и растёт) без единого
  цикла — до этого контейнеры flap'ались каждые 15–60 секунд. Гипотеза подтверждена.
- По пути: дубли import'ов в docker.mjs после правки (SyntaxError) — убраны; `infra down/reset`
  теперь гасит и якорь.

## 2. NestJS до полного паритета (фаза 3.1–3.2)

- **Сущности** (shop.entities.ts): Category, Product, ProductImage, Cart, CartItem, PromoCode
  (+rejectionReason/discountFor), ShippingMethod, Order (+TRANSITIONS), OrderItem, IdempotencyKey
  (составной PK без генерации). Всё поверх общей схемы, synchronize:false.
- **Services:** CatalogService (фильтры/сортировка/пагинация + пакетная догрузка связей),
  CartService (гость/аккаунт, мердж), OrdersService (идемпотентный checkout в транзакции с
  pessimistic_write на корзину и товарах, промо, доставка), SellerService (медиа: sharp-превью + S3).
- **Guards:** JwtAuthGuard (жёсткий), OptionalJwtAuthGuard (мягкий, аналог auth.optional — корзина),
  RolesGuard + @Roles (модерация/админ).
- **Формат ошибок** — ContractError через глобальный фильтр, паритет с Laravel (422 validation_error
  с details, 401/403/404/409).
- **Грабли (кратко, полные — в тексте):** ValidationPipe whitelist:true вырезает свойства без
  декораторов → shippingAddress нужен вложенный AddressDto + @ValidateNested (иначе NOT NULL
  violation); Nest POST по умолчанию 201 → @HttpCode(200) на submit/approve/reject/merge/promo;
  глоб-паттерн entities/*.entity.js не резолвился → явный список классов; Reflector живёт в
  @nestjs/core; конфликты «repo-поле = имя метода» (categories, orderItems, users) → переименованы.

## 3. Клик-тест Quasar (devtools MCP, отложенный в сессии 03 — закрыт)

Полный путь живьём: каталог рендерит 40 товаров с картинками из S3 → «Canvas Tote Bag Heavy» в
корзину (гость, X-Cart-Token) → логин buyer@demo.dev → тост «Добро пожаловать», **счётчик корзины
сам показал 1** (мердж сработал) → checkout: WELCOME10 проверен (скидка −$1.80), Standard $4.99,
итого **$21.19** сходится → «Подтвердить заказ» → тост «Заказ 01a1571e… оформлен» → /orders
показывает новый заказ + 2 сидовых, корзина обнулена. Скриншот каталога снят (viewport, jpeg).
Нюанс автоматизации: fill_form не триггерит v-model Quasar — значения ставились нативным сеттером
+ input-событием; клики по Quasar-компонентам — через el.click() в evaluate_script.

## Грабли NestJS-сборки по ходу (детали в git-истории)

- 17→8→2→0 ошибок типизации: конфликты имён репозиторий/метод, UserEntity реэкспорт из
  shop.entities, Reflector из @nestjs/core, No metadata for «CartEntity» (глоб entities → явный
  список классов), отсутствующий @HttpCode, whitelist-вырезание shippingAddress.

## Что осталось

- **Фаза 3.3 (docker-комбо)** — не начата: Dockerfile-шаблоны (SPA/SSR/Laravel/Nest), compose.js,
  проверка подъёма пары. Отдельная сессия: там сборки образов из контейнеров (npm/packagist из
  WSL-сети под allowlist — отдельный риск).
- Юнит-тесты сервисов Laravel (долг 2.1), E2E Playwright-пара (2.3), NestJS: медиа-путь руками
  (upload проверен только conformance-сценарием продавца без картинок).

## Гейт закрытия сессии (фича 04 §7)

- Затронутые задачи сведены: «задач нет»
- Хвостов нет
- Свип: чужих доков нет

## Итог

- Состояние: **conformance 17/17 против NestJS :3000 и 17/17 против Laravel :8010** (один сет);
  JWT взаимозаменяем; UI-путь покупателя пройден в браузере; WSL-docker стабилен всю сессию.
