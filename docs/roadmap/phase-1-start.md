# Roadmap — Фаза 1: фундамент

> **Статус:** ГОТОВА · **Обновлено:** 2026-10-19

**Суть:** скелет монорепы, контракт v1, инфраструктура и доказательный контур (conformance) — фундамент, без которого фронты начинать нельзя.

**Цель:** довести репу до состояния «`pnpm doctor && pnpm setup` работает, контракт собран и сверен, обе роли инфраструктуры поднимаются, conformance-раннер гоняет сценарии против бекенда».

Границы фазы:
- Бизнес-фичи (корзина, заказы, роли) — фаза 2; фронты — фазы 2–4; docker-комбо и фабрика — фаза 5.
- NestJS-бекенд начат в этой фазе сверх плана (auth-каркас) — см. сессию 02.

## Этапы

### 1.1 — Скелет монорепы

- [x] pnpm workspaces: `packages/*`, `backend/nestjs`, `frontend/*`; `packageManager`-пин, `.nvmrc`
- [x] Общий tsconfig/base, eslint, conventional commits (привычка с первого коммита)
- [x] Корневые скрипты: doctor/setup/start-заглушка/infra/db/generate/extract-заглушка/test:e2e-через-conformance

### 1.2 — Контракт v1 (фича 01)

- [x] `openapi.yaml`: auth, каталог, корзина, заказы, промокоды, доставка, медиа, admin, health
- [x] Единые ошибки/пагинация/даты; Idempotency-Key в спецификации
- [x] Spectral-конфиг + линт (0 ошибок)

### 1.3 — Инфраструктура (фича 05)

- [x] `infra/docker-compose.infra.yml`: postgres + minio + healthchecks + restart:unless-stopped
- [x] Node-раннер миграций + `schema_migrations`-журнал с чексуммами
- [x] Схема маркетплейса v1 (фича 02): все таблицы ролей и статусных машин
- [x] Сиды: аккаунты 4 ролей, категории, 40 товаров, PNG-картинки в S3, промокоды, доставка, 2 заказа
- [x] `pnpm doctor` / `setup` / `infra:up|down` / `db:migrate|seed` (+ s3rver-fallback, WSL keep-alive)

### 1.4 — Доказательный контур (ADR-005)

- [x] `packages/conformance`: fetch + ajv по схеме, 17 сценариев
- [x] Laravel-каркас: приложение, маппинг схемы, auth-эндпоинты
- [x] conformance зелёный против Laravel (сначала service+auth 7/7, к концу фазы полный 17/17 — см. фазу 2)
- [x] NestJS-каркас (сверх плана): health+auth, conformance service+auth 7/7, JWT взаимозаменяем с Laravel

## Критерии готовности

1. [x] Чистый клон: `pnpm doctor && pnpm setup` проходит без ручных правок (проверено на этой машине: WSL2+docker).
2. [x] `pnpm db:migrate && pnpm db:seed` на пустой БД даёт полный маркетплейс-датасет с картинками в MinIO/S3.
3. [x] `spectral lint` и conformance (health+auth) зелёные.
4. [x] ADR-001..011 не противоречат коду (дополнения по факту: s3rver-fallback, WSL keep-alive).

## Осознанные НЕ-цели фазы

- Любые фронты, панель, docker-комбо, фабрика, видео.
- ~~NestJS (только после того, как Laravel-каркас прошёл conformance)~~ — начат после прохождения Laravel-каркаса, auth-паритет.
