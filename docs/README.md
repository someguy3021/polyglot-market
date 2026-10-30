# Polyglot Market — Документация

> **Статус:** живая карта · **Обновлено:** 2026-10-29 · **Тир:** T2 (dev-standard v1.10)
> **Суть:** карта всей документации + панель текущего состояния. L0-файл: агент читает всегда, первым после AGENTS.md.
> **Связанное:** [../AGENTS.md](../AGENTS.md)

Монорепа-витрина для вакансий: интернет-маркетплейс (4 роли: покупатель/продавец/админ/модератор) с единым OpenAPI-контрактом, четырьмя бекендами (Laravel, NestJS, spring4 на Spring Boot 4, spring27 на Spring Boot 2.7 легаси) и семью фронтами (Quasar, Vue 2, Angular, React, Nuxt, Next, SvelteKit), общей PostgreSQL+MinIO, веб-панелью управления и фабрикой автономных экстракт-репо. Ключевое обещание: один и тот же фронт работает с любым бекендом без единой правки — доказано conformance-тестами и e2e-матрицей. Приоритетный читатель — ИИ-скринер (решение автора, 2026-10-19).

## Сейчас

- Фаза: 5 «фабрика и витрина» [В РАБОТЕ] — [phase-5-фаза-5-фабрика-и-витрина.md](./roadmap/phase-5-фаза-5-фабрика-и-витрина.md)
- Последняя сессия: 12 (2026-10-30) — витрина выросла до 4 бекендов: spring4 (Spring Boot 4.1.2, …
- Горячее: [open-questions.md](./open-questions.md)

## Карта документации

### `architecture/` — как устроено («что есть»)

- [01-overview.md](./architecture/01-overview.md) — слои, порты, поток запуска, blueprint
- [02-arch-roles.md](./architecture/02-arch-roles.md) — канон arch-модели (генерируется из arch.model.json, не править руками)
- [arch.model.json](./architecture/arch.model.json) — модель границ: 32 роли (вкл. spring4/spring27), Clean-бекенды, FSD-фронты (ADR-014, ADR-015)

### `features/` — как работают фичи (сценарии)

- [01](./features/01-openapi-контракт-и-генерация-клиентов.md) — контракт и генерация SDK
- [02](./features/02-домен-маркетплейса-четыре-роли.md) — домен маркетплейса, 4 роли
- [03](./features/03-бекенд-laravel.md) — Laravel-бекенд
- [04](./features/04-бекенд-nestjs.md) — NestJS-бекенд
- [05](./features/05-инфраструктура-и-сиды.md) — postgres/minio, миграции, сиды, doctor/setup
- [06](./features/06-веб-панель-управления.md) — панель процессов и логов
- [07](./features/07-фронт-vue-3-quasar.md) — фронт Quasar (флагман)
- [08](./features/08-фронт-react-vite.md) — фронт React (флагман)
- [09](./features/09-фронт-angular.md) — фронт Angular
- [10](./features/10-фронт-nuxt.md) — фронт Nuxt (SSR)
- [11](./features/11-фронт-next-js.md) — фронт Next (RSC)
- [12](./features/12-фронт-vue-2-vite.md) — фронт Vue 2 (legacy-витрина)
- [13](./features/13-фронт-sveltekit.md) — фронт SvelteKit
- [14](./features/14-e2e-все-роли-все-действия.md) — E2E: 4 роли × 14 комбинаций
- [15](./features/15-ci-стратифицированный.md) — CI: PR-быстро, матрица ночью
- [16](./features/16-фабрика-экстрактов.md) — фабрика экстракт-репо
- [17](./features/17-видео-демо.md) — видео для рекрутера
- [18](./features/18-k8s-стенд-деплой-стека-в-локальный-кластер.md) — k8s-стенд: kind, ingress, пробы
- [19](./features/19-бекенд-spring4-spring-boot-4.md) — бекенд spring4 (Spring Boot 4 + Loom)
- [20](./features/20-бекенд-spring27-spring-boot-2-7-легаси.md) — бекенд spring27 (Boot 2.7, Java 8, легаси)

### `decisions/` — ADR (почему выбрали так)

- [ADR-001](./decisions/adr-001-postgresql-как-единственная-субд-во-всех-режимах.md) — PostgreSQL везде
- [ADR-002](./decisions/adr-002-общие-sql-миграции-с-node-раннером.md) — общие SQL-миграции
- [ADR-003](./decisions/adr-003-явные-pnpm-setup-doctor-start-вместо-postinstall.md) — явные команды вместо postinstall
- [ADR-004](./decisions/adr-004-openapi-3-0-3-и-генерация-sdk-typescript-axios.md) — контракт 3.0.3, SDK в git
- [ADR-005](./decisions/adr-005-conformance-тесты-контракта-в-v1.md) — conformance в v1
- [ADR-006](./decisions/adr-006-один-активный-бекенд-одновременно.md) — один активный бекенд
- [ADR-007](./decisions/adr-007-docker-только-комбо-профилями-из-корня-репо.md) — docker-комбо из корня
- [ADR-008](./decisions/adr-008-медиа-minio-с-первого-дня.md) — MinIO с первого дня
- [ADR-009](./decisions/adr-009-целевая-платформа-wsl2.md) — WSL2, не Windows-native
- [ADR-010](./decisions/adr-010-фабрика-экстрактов-публична-и-с-lockfile.md) — фабрика публична
- [ADR-011](./decisions/adr-011-идемпотентность-заказов-через-idempotency-key.md) — Idempotency-Key
- [ADR-012](./decisions/adr-012-kubernetes-стенд-локально-kind-в-wsl2-манифесты-cloud-переносимы.md) — k8s-стенд: kind в WSL2 (k3d отвергнут: ghcr.io заблокирован)
- [adr-013-наблюдаемость-стенда-bare-манифесты-prometheus-gra.md](./decisions/adr-013-наблюдаемость-стенда-bare-манифесты-prometheus-gra.md) — стек наблюдаемости (Prometheus + Grafana + Loki/Promtail + …
- [ADR-014](./decisions/adr-014-arch-модель-devst-clean-на-бекендах-fsd-на-фронтах.md) — arch-модель devst: Clean бекенды, FSD фронты, arch-linting
- [ADR-015](./decisions/adr-015-java-бекенды-spring4-и-spring27.md) — Java-бекенды: spring4 (Boot 4) + spring27 (легаси), порты/JDBC

### `roadmap/` — что делаем и что осталось

- [phase-1-start.md](./roadmap/phase-1-start.md) — Фаза 1: фундамент — ГОТОВА
- [фаза 2](./roadmap/phase-2-фаза-2-первый-сквозной-путь.md) — флагманская пара — ГОТОВА
- [фаза 3](./roadmap/phase-3-фаза-3-второй-бекенд.md) — NestJS + docker-комбо — ГОТОВА
- [фаза 4](./roadmap/phase-4-фаза-4-флот-фронтов.md) — остальные 6 фронтов — ГОТОВА
- [фаза 5](./roadmap/phase-5-фаза-5-фабрика-и-витрина.md) — фабрика, CI-матрица, публикация — В РАБОТЕ (видео/публикация — автор)
- [фаза 6](./roadmap/phase-6-фаза-6-production-grade-k8s-наблюдаемость.md) — production-grade: k8s, балансировка, наблюдаемость — В РАБОТЕ

### `research/` — разведки

- _(пока пусто — `devst new research "тема"`)_
- [2026-10-30-глоб-dsl-arch-модели-несколько-путей-на-роль-кейс-.md](./research/2026-10-30-глоб-dsl-arch-модели-несколько-путей-на-роль-кейс-.md) — роль arch-модели несёт ровно один глоб в `path` — на репе с…

### `log/` — журнал сессий

- Последние: [2026-10-30-session-12-java-бекенды-spring4-boot-4-и-spring27-boot-2-7-ле.md](./log/2026-10-30-session-12-java-бекенды-spring4-boot-4-и-spring27-boot-2-7-ле.md) · [2026-10-30-session-11-arch-модель-devst-clean-бекенды-fsd-фронты-arch-li.md](./log/2026-10-30-session-11-arch-модель-devst-clean-бекенды-fsd-фронты-arch-li.md) · [2026-10-29-session-10-фаза-6-1-k8s-стенд-k3d-ingress-probes.md](./log/2026-10-29-session-10-фаза-6-1-k8s-стенд-k3d-ingress-probes.md).
  Всего: 12 (старые — сортировкой имён файлов).

## Как искать

1. Тема → карта → шапка доки → тело, если шапки мало.
2. Символ/файл кода → grep по имени в docs/.
3. «Что сейчас» → панель «Сейчас» + последний log + open-questions.

## Соглашения по ведению

- ADR: Контекст → Опции → Решение → Обоснование → Последствия; тупики — в Опциях; append-only.
- architecture/ — «как сейчас» + TODO-секция; log/ — после каждой сессии (цель ~60–80 строк, бюджет 200).
- Ссылки на код — от корня репы, имена символов; статусы — только в шапках.
- Линт конвенций: `devst check`.
