# Roadmap — Фаза 6: production-grade (k8s, наблюдаемость)

> **Статус:** ГОТОВА · **Обновлено:** 2026-10-29

**Суть:** production-grade слой витрины: локальный Kubernetes (k3d), балансировка через ingress, наблюдаемость (метрики/логи/дашборды), кластерный CI-прогон.

**Цель:** витрина отвечает на вопрос «а как это живёт в проде»: маршрутизация 2 бекендов за ingress, автоскейлинг под нагрузкой, метрики и логи в Grafana — локально, одной командой.

Границы фазы:
- Не блокирует публикацию фазы 5 (видео/публикация — автор, идут параллельно).
- Дефолтный локальный путь (`pnpm setup/start`) не изменяется; k8s — опциональный слой (ADR-012).

## Этапы

### 6.1 — Кластер и деплой (фича 18, ADR-012)

- [x] kind+kubectl в WSL2 (`~/.local/bin`), `scripts/k8s.mjs`: up/down/status, идемпотентно (k3d отвергнут — ghcr.io заблокирован, ADR-012)
- [x] Манифесты `infra/k8s/` (Kustomize): postgres, S3 (s3rver), NestJS, react, Traefik-ingress (/api → nestjs со срезом префикса, / → фронт), readiness/liveness-пробы, секреты из .env, локальный registry (kind load сломан на docker 29 + containerd store)
- [x] `pnpm k8s:up` полный цикл на этой машине: rollout'ы 5/5 зелёные, миграции+сиды против кластерной БД, smoke 3/3, conformance 17/17 через ingress

### 6.2 — Балансировка как демо

- [x] Ingress-роутинг на оба бекенда (`/api` → nestjs, `/api/laravel` → laravel, свой stripPrefix на каждый — демонстрация ADR-006); conformance 17/17 через КАЖДЫЙ из них
- [x] HPA на nestjs (1→5) и laravel (1→3, CPU 60%) + metrics-server; `pnpm k8s:load` — k6-прогон с таймлайном реплик: nestjs 1→5 к t=46с, 25349 запросов, 0 отказов

### 6.3 — Наблюдаемость

- [x] Prometheus + Grafana + Loki/Promtail в кластере (bare-манифесты `infra/k8s/observability/`, ADR-013); kube-state-metrics для графика реплик
- [x] /metrics на NestJS (prom-client: RPS + латентность + процесс), pino-JSON-логи, Laravel — stderr; Traefik-метрики на отдельном entrypoint
- [x] Дашборд «Polyglot stand» as code (ConfigMap): RPS по сервисам, реплики, p95, CPU подов, объём логов; Grafana на http://localhost:8180

### 6.4 — CI

- [x] Ночная джоба k8s-stand: чистый раннер → pnpm k8s:up (kind+деплой) → Grafana healthcheck → conformance 17/17 через оба бекенда; диагностика подов при падении
- [x] k8s-скрипты работают нативно на linux/darwin (scripts/lib/k8s-runtime.mjs) — CI и mac-разработка без WSL

## Критерии готовности

1. `pnpm k8s:up` на чистой машине (k3d+kubectl докачиваются самим скриптом) → стенд отвечает на :8080.
2. Скриншоты/видео-фрагмент: ingress-роутинг двух бекендов + Grafana с метриками под нагрузкой.

## Осознанные НЕ-цели

- Service mesh (Istio), multi-node, ArgoCD — не для локальной витрины.
- Реальный клауд/облачная публикация — манифесты переносимы, но деплой в клауд не делаем.
- Полная матрица 2×7 в кластере — паттерн доказывается на представителях.
