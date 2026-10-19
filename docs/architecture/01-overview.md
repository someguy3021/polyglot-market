# 01 — Обзор архитектуры

> **Статус:** актуально · **Обновлено:** 2026-10-19 (сессия 01)

**Суть:** монорепа-витрина «1 API — 2 бекенда — 7 фронтов»: маркетплейс с общим OpenAPI-контрактом, общей БД и панелью управления; сюда смотришь, чтобы понять слои, порты и поток запуска.

**Ключевые факты:**
- Один OpenAPI-контракт (3.0.3) — источник правды; оба бекенда обязаны ему отвечать (проверяет conformance).
- Активен строго один бекенд; фронты (7) не меняют ни строчки при его смене.
- PostgreSQL + MinIO — единственный Docker (infra); процессы приложений — нативно (WSL2/Linux/macOS).
- Настройка только явными командами: `pnpm doctor` → `pnpm setup` → `pnpm start`.
- Везде TypeScript, где это Node-сторона; PHP — только Laravel-бекенд.

**Связанное:** [ADR-001..011](../decisions/) · features/01–17 · `pnpm-workspace.yaml` (появится в фазе 1)

## Как устроено сейчас

Слои и направления зависимостей (фронты зависят только от SDK, SDK — только от контракта):

```
                 shared/api-spec/openapi.yaml   ← ЕДИНСТВЕННЫЙ источник правды
                        │  generate:clients
                        ▼
                 packages/api-client (@showcase/api-client)
                        ▲
   ┌────────────────────┼───────────────────────────┐
   │ 7 фронтов          │                           │
   │ quasar vue2 angular│ react nuxt next sveltekit │
   └─────────┬──────────┴─────────────┬─────────────┘
             │        HTTP (REST)     │
             ▼                        ▼
   backend/laravel :8000   ИЛИ   backend/nestjs :3000   ← один активен (ADR-006)
             └────────────┬─────────────┘
                          ▼
      PostgreSQL :5432  +  MinIO :9002   ← infra docker compose (ADR-001/008)
                          ▲
        общие миграции shared/db/migrations + сиды (Node-раннер, ADR-002)

   scripts/manager + panel/ :5555   ← панель управления процессами (нативный режим)
   scripts/compose.js               ← docker-комбо «1 фронт + 1 бек» (ADR-007)
   scripts/extract-stack            ← фабрика автономных репо (ADR-010)
```

| Путь | Роль |
|---|---|
| `shared/api-spec/` | контракт, spectral-конфиг |
| `shared/db/` | общие SQL-миграции + сиды (обе роли БД — маркетплейс, фича 02) |
| `packages/api-client/` | сгенерированный TS SDK (коммитится, ADR-004) |
| `packages/conformance/` | раннер сверок «ответ ↔ контракт» (ADR-005) |
| `backend/laravel/`, `backend/nestjs/` | взаимозаменяемые реализации API |
| `frontend/*` (7 шт) | quasar, vue2, angular, react, nuxt, next, sveltekit |
| `panel/`, `scripts/` | панель управления + менеджер, doctor/setup, compose, extract |
| `infra/` | postgres + minio, шаблоны Dockerfile (SPA/SSR) |

Течение типового запуска (нативно): `pnpm infra:up` → `pnpm db:migrate && db:seed` → панель → старт бекенда → старт фронта → магазин на порту фронта. Смена бекенда = стоп/старт в панели, данные общие.

Порты: панель 5555, laravel 8000, nestjs 3000, quasar 9000, vue2 9001, angular 4200, react 3001, nuxt 3002, next 3003, sveltekit 3004, postgres 5432, minio 9002/9003.

Версии: последние stable на день старта кода (ориентир 2026-10: Node 24 LTS, PHP 8.4+, Laravel 12+, NestJS 11+, Angular 20+, React 19, Next 15+, Nuxt 4+, Vue 3.5+, Svelte 5, Vue 2.7.16 — осознанный legacy); точные пины — в манифестах при старте фазы 1.

## Ключевые решения

- [ADR-001](../decisions/adr-001-postgresql-как-единственная-субд-во-всех-режимах.md) — PostgreSQL везде, infra в Docker
- [ADR-002](../decisions/adr-002-общие-sql-миграции-с-node-раннером.md) — общие SQL-миграции, Node-раннер
- [ADR-003](../decisions/adr-003-явные-pnpm-setup-doctor-start-вместо-postinstall.md) — явные doctor/setup/start
- [ADR-004](../decisions/adr-004-openapi-3-0-3-и-генерация-sdk-typescript-axios.md) — OpenAPI 3.0.3, SDK в git
- [ADR-005](../decisions/adr-005-conformance-тесты-контракта-в-v1.md) — conformance-тесты в v1
- [ADR-006](../decisions/adr-006-один-активный-бекенд-одновременно.md) — один активный бекенд
- [ADR-007](../decisions/adr-007-docker-только-комбо-профилями-из-корня-репо.md) — docker-комбо из корня, runtime API_URL
- [ADR-008](../decisions/adr-008-медиа-minio-с-первого-дня.md) — MinIO + превью с первого дня
- [ADR-009](../decisions/adr-009-целевая-платформа-wsl2.md) — WSL2, Windows-native нет
- [ADR-010](../decisions/adr-010-фабрика-экстрактов-публична-и-с-lockfile.md) — фабрика публична, честная история
- [ADR-011](../decisions/adr-011-идемпотентность-заказов-через-idempotency-key.md) — Idempotency-Key на заказы

## TODO / как должно быть

- [ ] Фаза 1: скелет монорепы + контракт v1 + infra + conformance-раннер (см. roadmap)
- [ ] `pnpm-workspace.yaml` и корневые скрипты зафиксируют приведённые команды
- [ ] llms.txt / ADR-индекс для ИИ-скринеров — при публикации (фаза 5)
