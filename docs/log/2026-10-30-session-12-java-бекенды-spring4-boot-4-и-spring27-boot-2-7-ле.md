# Сессия 12 (2026-10-30): Java-бекенды: spring4 (Boot 4) и spring27 (Boot 2.7 легаси)

> **Суть:** витрина выросла до 4 бекендов: spring4 (Spring Boot 4.1.2, виртуальные потоки, :8020) и spring27 (Boot 2.7.18, код Java 8, :8030) — оба проходят conformance 17/17 и e2e-пару с quasar 5/5 (ADR-015, фичи 19–20).
> **Коммиты:** feat(backs): spring4+spring27 — код, обвязка, ADR-015, фичи 19/20, доки
> **Файлы:** ~75 новых (два Maven-проекта по ~35 исходников + pom/yml/wrapper) + обвязка и доки

## Что сделано

- Заказ автора (дословно): «берём сразу ОБЕ — java-spring-4 и java-spring-2.7, 2 бекенда у нас будут». Ответил на вопрос про Kotlin в ходе сессии (Android+Spring-на-Kotlin; в витрину не брали — ADR-015, «Отвергнуто»).
- **ADR-015**: выбор стеков, порты 8020/8030, отклонения — Kotlin, JPA (PG-enums/numeric без ORM-боли, `FOR UPDATE` явно), springdoc (у NestJS/Laravel `/api/docs` нет — паритет).
- **Тулчейн**: Maven 3.9.12 распакован в `D:/AI_Cwork/tools/apache-maven-3.9.12` (вне репы); в оба бекенда сгенерён wrapper `mvnw` (сам качает Maven). JDK машины — 21.0.10 (Microsoft); Boot 4 baseline 17, кода под 25 не требуется.
- **backend/spring4** (~35 файлов, `dev.polyglot.spring4`): Boot 4.1.2, `spring.threads.virtual.enabled`, Spring MVC + `JdbcClient`, jakarta-валидация, Jackson 3 (`tools.jackson` — дефолт Boot 4), jjwt 0.13, AWS SDK v2 + TwelveMonkeys webp, bcrypt с `$2y$`-префиксом, pgjdbc `stringtype=unspecified`. Слои Clean (ADR-014): контроллеры → сервисы → репозитории; ошибки — единый `@RestControllerAdvice` в формате контракта.
- **backend/spring27** (~30 файлов, `dev.polyglot.spring27`): Boot 2.7.18, `maven.compiler.release=8` (компилятор запрещает API новее Java 8), javax.*, `JdbcTemplate` + RowMapper, POJO вместо records, Jackson 2, jjwt 0.11 (`parserBuilder`), AWS SDK v1. Поведение — поэтапный паритет NestJS (resolve корзины, мердж до 99, идемпотентный чекаут с FOR UPDATE, переходы статусов, промо-правила, слаги, `$2y$`).
- **Обвязка**: `scripts/e2e-matrix.mjs` — BACKENDS + start-логика для spring4/spring27 (`--back=`), дефолт матрицы остался laravel+nestjs; `scripts/panel/apps.ts` — два новых бекенда (инвариант «≤1 бекенд» работает как есть); `scripts/doctor.mjs` — Java теперь «нужна и для spring4/spring27».
- **Доки**: ADR-015, фичи 19/20, AGENTS.md (шапка «4 бекенда», таблица, порты, Проверено), карта docs/README.md (ADR-015, фичи, панель), roadmap 5.5, open-questions (arch-модель — ждёт автора).

## Грабли (переживут сессию)

- **Windows file-lock**: `mvn package` при запущенном jar падает «Unable to rename …jar to ….jar.original» — сначала `taskkill`, потом сборка.
- **`replaceFirst("$2y$")`** — `$2` в replacement трактуется как ссылка на regex-группу («No group 2»); экранировать: `"\\$2y\\$"`.
- **pgjdbc**: `setString` против uuid-колонок без `?stringtype=unspecified` даёт «operator does not exist: uuid = character varying» — прописано в обоих application.yml.
- **Jackson 3**: Boot 4 несёт `tools.jackson.*` — импорты `com.fasterxml.jackson.databind` не резолвятся; исключения unchecked (без try/catch).
- **`JdbcClient`** не имеет `.forEach()` у query-результата — только `.list()/.optional()/.single()` (Boot 4).
- **`carts.token` NOT NULL UNIQUE** со схемным DEFAULT `gen_random_uuid()`: если при INSERT не передать свой токен, заголовок X-Cart-Token укажет на несуществующую строку — токен вставляем всегда (для аккаунтных корзин — сгенерённый и никогда не публикуемый).
- `mvnw` на Windows требует `shell: true` у spawn (как и `php artisan`).

## Что осталось / что всплыло

- **`pnpm typecheck` красный ДО сессии**: `packages/conformance/src/spec.ts` — ajv 8.20-тайпинги («has no construct signatures»); stash-тестом доказано, что падение существует на чистом HEAD без изменений сессии. Похоже, протухло от обновлённого node_modules (код conformance не менялся давно). Чинить отдельным ходом.
- Docker-образы Java-бекендов, фабрика экстрактов 7×4, k8s-стенд, роли в arch-модели — roadmap 5.5 (arch-модель — ждёт верификации автора: open-questions).
- Полная e2e-матрица 4×7 (28 пар) не гонялась — только контрольные пары quasar×{spring4,spring27}; полная — по требованию `--back=`.
- `serve-backend` в package.json указывает на несуществующий `scripts/serve-backend.mjs` — док-долг, не трогал (не относится к сессии).

## Гейт закрытия сессии (фича 04 §7)

- Затронутые задачи сведены: «задач нет» — board не использовался
- Хвосты: «хвостов нет»
- Свип: изменение обещания витрины «2 бекенда → 4» отражено в AGENTS.md, docs/README.md, package.json, features/19–20, ADR-015

## Итог

- Состояние: conformance 17/17 × 2 (spring4 :8020, spring27 :8030), e2e quasar×spring4 5/5, quasar×spring27 5/5, `mvn package` обоих зелёный; `pnpm lint` 0 ошибок (9 старых warning); `pnpm typecheck` красный, но ДО сессии (см. выше, stash-тест); юниты Laravel/NestJS не затронуты.

## Дополнение 1 (2026-10-30): arch-модель — роли Java-бекендов

- Автор спросил «а архитектура devst сделала там?» → показал состояние: `arch check` зелёный, но java-файлы вне ролей (покрытие 38%). Модель сознательно не трогал: канон границ правится только через верификацию автора (ADR-014, фича 16).
- Предложил черновик: грубые роли `spring4/backend` (backend/spring4/src/**) и `spring27/backend` (backend/spring27/src/**), рёбра пустые (самодостаточны; кросс-импорты запрещены default-deny). Слои Clean в Java-коде — суффиксами классов внутри фича-пакетов, а глоб-DSL devst не умеет несколько путей на роль (дыра уже была в open-questions автору devst).
- > **Верифицировано @author 2026-10-30: «Верифицирую — вноси».** (выбор варианта в диалоге)
- Внесено: модель 30→32 роли, `arch check` — границ соблюдено, покрытие **38% → 57%** (362 файла вне ролей), `arch canon` перегенерировал 02-arch-roles.md. Open-questions: активный вопрос закрыт, вместо него — дыра DSL автору devst. Roadmap 5.5 — чекбокс закрыт.
