# Сессия 2 (2026-10-19): фаза 1 и Laravel API: конформанс против двух бекендов

> **Суть:** фаза 1 закрыта целиком и сверх плана: работающий вертикальный срез — инфраструктура, общая схема, сиды с картинками в S3, контракт v1 с сгенерированным SDK и **conformance-раннер, зелёный против обоих бекендов** (Laravel 17/17, NestJS auth-каркас 7/7, JWT взаимозаменяем в обе стороны).
> **Коммиты:** 4b68845 (инфра-скелет), e3cfd3a (схема+сиды), 7594f96 (контракт+клиенты+conformance), 0a58c50 (Laravel полный API), 96e6f7b (NestJS скелет).
> **Файлы:** +37328/−0 по 197 файлам (дифф-стат коммитов сессии)

## Что сделано

- **Скелет монорепы:** pnpm workspaces, tsconfig.base, eslint, корневые скрипты (doctor/setup/infra/db/generate:clients).
- **Инфраструктура:** postgres:17 в WSL-docker (Ubuntu-24.04) + healthchecks + restart:unless-stopped; с3rver-fallback для S3, когда образ MinIO не пуллится (allowlist-сеть этой машины); keep-alive против гашения WSL-VM.
- **Схема и сиды:** `shared/db/migrations/001_init.sql` (12 таблиц, enum'ы ролей/статусов, констрейнты переходов); сиды — 6 аккаунтов, 3 магазина, 40 товаров, 80 PNG (собственный энкодер без зависимостей) в S3, промокоды (включая негативные кейсы), доставка, 2 заказа.
- **Контракт v1:** 38 операций, spectral 0 ошибок; `@showcase/api-client` (typescript-axios) сгенерирован и закоммичен, DX-обёртка с interceptors (Bearer/X-Cart-Token/Idempotency-Key); TS-модели для NestJS.
- **Conformance-раннер** (`packages/conformance`, TS): fetch + ajv по схемам контракта, 17 сценариев — health, auth, каталог с фильтрами/сортировкой, гостевая корзина, checkout с идемпотентностью, ролевые запреты, промокоды.
- **Laravel 12.70 — полный API:** все 38 операций; единый формат ошибок через рендер исключений; идемпотентный checkout в транзакции с блокировками; медиа через flysystem-s3 + Intervention-превью; роли seller/moderator/admin. **Conformance 17/17**, путь картинки проверен вручную (upload 201 → PNG из S3).
- **NestJS 11 — auth-каркас** (сверх плана фазы 1): TypeORM поверх общей схемы (synchronize запрещён), ContractError-фильтр, JWT. **Conformance service+auth 7/7; токены Laravel↔NestJS взаимозаменяемы** — главный тезис «1 контракт = 2 бекенда» доказан исполняемо.

## Грабли (в память)

- Windows-спавн: pnpm/composer — .cmd-шимы (нужен shell), wsl.exe/java — прямой спавн; `java -version` пишет в stderr.
- Git Bash калечит POSIX-пути при прямых вызовах wsl.exe — спавнить из Node.
- bcrypt между стеками: Laravel принимает только `$2y$`; bcryptjs генерит `$2a$` — сиды и NestJS перефиксивают.
- Eloquent для uuid-схемы: HasUuids обязателен; password маппится в password_hash через Attribute get/set.
- NestJS POST по умолчанию 201 — логину нужен @HttpCode(200); TypeORM требует явных snake_case-имён колонок.
- Порт 8000 этой машины занят соседним docker-проектом (`engineering-family`) — Laravel гонялся на 8010; панель обязана уметь автоподбор портов (фича 06).

## Что осталось

- Юнит-тесты сервисов Laravel (чекбокс 2.1) — долг фазы 2.
- Quasar-фронт (2.2) и E2E-пара (2.3) — следующий крупный этап.
- NestJS: полный паритет контракта (фаза 3) — каркас готов, паттерн конформанса отработан.
- Панель/менеджер процессов (5.1) — pulled-forward кандидат.

## Гейт закрытия сессии (фича 04 §7)

- Затронутые задачи сведены: «задач нет» (реестр не заводился)
- Хвостов нет
- Свип: чужих доков нет

## Итог

- Состояние: spectral 0 ошибок; conformance Laravel 17/17 (порт 8010), NestJS 7/7 (порт 3000) — против живых процессов на этой машине; миграции/сиды воспроизводимы с нуля; коммиты конвенциональные.

## Дополнение 1 (2026-10-19): полная хронология граблей и фиксов

### Окружение (стартовые проверки)

- Хост: Windows 10 (Git Bash), целевая среда — WSL2. Тулчейн: node 24.14.1, pnpm 10.16.1,
  php 8.3.11 (ZTS, `C:\php-8.3.11`), composer 2.7.9, java 21.0.10, docker на Windows — НЕТ.
- Docker найден внутри WSL (Ubuntu-24.04): docker 29.7.2, compose v5.5.0, демон живой.
  Каждая команда — через `wsl.exe -d Ubuntu-24.04 -e docker ...`.

### Спавн процессов на Windows (scripts/lib/exec.mjs)

- Симптом 1: doctor показывал «Docker ✗» при живом WSL-docker. Причина: `execFileSync` с
  `shell: true` ломал кавычки в `sh -c "docker --version"` → sh получал голый `docker` → usage-dump.
- Симптом 2: pnpm/composer — .cmd/.bat-шимы, прямой спавн без shell → EINVAL.
- Симптом 3: `java -version` пишет версию в STDERR → пустой stdout читался как «не найдена».
- Фикс: `scripts/lib/exec.mjs` — `spawnSync` + объединение stdout+stderr + SHELL_CMDS
  (pnpm/composer/npm — через shell), wsl.exe/java/php — прямым спавном.

### Инфраструктура: MinIO недоступен, WSL-гашение, соседний проект

- `docker compose up`: `pull access denied for minio/minio` — у сети allowlist-посредник.
  Проверки: postgres:17-alpine — тянется; redis:7-alpine — тянется; bitnami/minio — «not found»;
  quay.io — 401; api.github.com — пусто; dl.min.io — 410. Вывод: доступен только library-набор Docker Hub + npm.
- Решение: `scripts/infra.mjs up` — канонический compose (postgres+minio), при ошибке пулла —
  postgres-контейнер + встроенный S3 dev-сервер (s3rver) на том же :9002 (задокументировано в ADR-008).
- s3rver: последняя версия 3.7.1 (запрос `^6.0.1` не существует); креды хардкод S3RVER/S3RVER →
  регистрация minioadmin/minioadmin через глубокий импорт `s3rver/lib/models/account`
  (createKeyPair в глобальный реестр; безопасно — версия запинена в lockfile).
- Postgres-контейнер умирал между вызовами: WSL-VM гаснет без процессов (exit 255, чистый
  shutdown в логах). Первый keep-alive (`nohup ... &`) погибал вместе с WSL-сессией;
  рабочий вариант — `setsid nohup sleep 3600 ... &` (scripts/lib/docker.mjs keepWslAlive).
- Соседний docker-проект `engineering-family` в том же WSL: их nginx держит хост-порт 8000
  (их pg на 5430/5431, redis 6378). Наши порты не конфликтуют, кроме 8000 → Laravel локально
  на 8010; правило для панели — автоподбор свободного порта (фича 06, реализовано).

### Контракт и conformance

- Spectral: 2 YAML-ошибки «Incomplete explicit mapping pair» — двоеточие внутри
  нецитированных description (строки 794, 1053) → обёрнуты в кавычки.
- `exclusiveMinimum: 0` (число) — некорректно для OAS 3.0 → boolean + minimum (2 места).
- ajv (draft-07) не принимает boolean exclusiveMinimum из OAS 3.0 → `oasToDraft07()`:
  boolean exclusiveMinimum → custom-ключ xExclusiveMinimum (валидатор data > minimum).
- Путь спеки в spec.ts: сначала `../../shared/...` (мимо), затем Windows pathname `/D:/...`
  без fileURLToPath → фикс: `fileURLToPath(new URL("../../../shared/api-spec/openapi.yaml", import.meta.url))`.
- Сценарий «гостевая корзина» стал падать после появления в каталоге conformance-товаров со
  stock=1 (каждый прогон roles создаёт новый Conf Product) → сценарий выбирает товары со stock >= 5.

### Laravel (php 8.3.11, Laravel 12.70)

- composer install: не хватало ext-pdo_pgsql и ext-sodium → включены в `C:\php-8.3.11\php.ini`
  (дописаны `extension=pdo_pgsql|pgsql|sodium`; DLL были в комплекте). Позже для
  Intervention Image — `extension=gd`; ВАЖНО: `php -S` грузит расширения при старте →
  рестарт artisan serve после включения gd (первый рестарт не сработал — убил процесс не по
  тому порту; надёжно: PID из netstat :8010 → taskkill //F, затем новый serve).
- artisan: опечатка `define('LARAVEL_START', microtime(true);` (нет скобки) → фикс.
- bootstrap/app.php: приложение присвоено `$app`, но файл не делал `return` → artisan падал
  «handleCommand() on int». Добавлен `return $app;`.
- `$middleware->api(prevent: false)` — в установленной сборке нет параметра `prevent`
  («Unknown named parameter») → пустой closure.
- `/auth/me` без токена: 500 «Route [login] not defined» — Authenticate-мидлварь тянет
  redirect на route('login') → фикс: `$middleware->redirectGuestsTo(fn () => null)` +
  `$exceptions->shouldRenderJsonWhen(fn () => true)` + рендер
  PHPOpenSourceSaver JWTException → 401.
- Неверный пароль отдавал 422 (ValidationException) — контракту нужен 401 → в контроллере
  прямой JSON 401 unauthorized.
- Пароли: «This password does not use the Bcrypt algorithm» — Laravel требует `$2y$`-префикс,
  bcryptjs генерит `$2a$` → сиды и NestJS перефиксивают (`replace(/^\$2[ab]\$/, "$2y$")`).
- JWT: «Key provided is shorter than 256 bits, only 208» — dev-секрет 26 байт → удлинён
  до 64+ символов в обоих .env.example и локальном .env.
- Eloquent + uuid-схема: «invalid input syntax for type uuid: "7"/"0"» — модели считали PK
  инкрементным int → `HasUuids` на User/SellerProfile; поле пароля — Attribute get/set
  (password ↔ password_hash, хэш через password_hash(PASSWORD_BCRYPT)).
- Регистрация: «column "password" does not exist» — $fillable пропускал password мимо
  мутатора до добавления set-ветки Attribute.
- IdempotencyKey с HasUuids пытался вставить колонку `id`, которой в таблице нет → убран
  trait, `primaryKey = 'key'`, `incrementing = false`.
- Seller createProduct: `$data['categoryId']` не маппился в `category_id` → NOT NULL violation
  → явный маппинг полей в create/update.
- ModeratorController не проверял роль: продавец одобрял свой товар (200 вместо 403) →
  `requireModerator` на queue/approve/reject.

### NestJS (Node 24, Nest 11, TypeORM 0.3)

- Сгенерированные модели (openapi-generator `typescript`) содержат browser-код
  (`window`, `FileReader` в src/generated/http) → `src/generated` исключён из tsconfig build
  (в обоих tsconfig: build перекрывал exclude базового).
- POST в Nest по умолчанию 201, а контракту нужен 200 на login → `@HttpCode(200)`.
- TypeORM без явных имён колонок искал `UserEntity.created_at`-подобный camelCase → в
  сущностях прописаны `name: "created_at"/"updated_at"/"password_hash"`; seller_profiles —
  PK `user_id` (PrimaryColumn, без генерации).
- Дубликат email отдаёт 401 → `ContractError(422, 'validation_error', ..., { email: [...] })`
  + ValidationPipe с exceptionFactory, собирающим details из class-validator.

### Медиа-путь (ручная проверка, ADR-008)

- login seller → POST /seller/products (201 draft) → submit → 200 pending_moderation →
  POST /seller/products/{id}/images (multipart PNG 640×480 из собственного энкодера) →
  201, is_primary=true → GET url → 200 image/png 45119 bytes из s3rver.

### Панель (scripts/panel/manager.ts + panel/)

- Менеджер на TS (tsx), без внешних зависимостей; раздаёт panel/ статику; API:
  /api/status, /api/start, /api/stop, /api/stop-all.
- Автоподбор портов подтверждён живьём: laravel → 8001 (8000 занят), nestjs → 3001
  (3000 держал standalone-процесс этой сессии).
- Инвариант «1 бекенд» подтверждён: POST /api/start nestjs при живом laravel →
  laravel остановлен автоматически.
- Health-проверки менеджера: laravel/nestjs `/health` → up.
- Заглушка (долг 5.1): кнопка «Скачать полный лог» пока открывает /api/status; реальные
  логи пишутся в `.infra/logs/<app>-<stamp>.log`, хвост 200 строк — в /api/status.
- panel/app.js — браузерный JS с top-level await → `<script type="module">` обязателен
  (первый запуск молча не выполнялся бы с обычным script).
