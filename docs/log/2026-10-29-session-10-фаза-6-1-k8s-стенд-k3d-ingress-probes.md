# Сессия 10 (2026-10-29): фаза 6.1 — k8s-стенд (kind в WSL2, ingress, пробы)

> **Суть:** открыт production-grade слой: стек (postgres, s3rver, NestJS, react) в kind-кластере за Traefik-ingress с пробами; `pnpm k8s:up/down/status`; conformance 17/17 сквозь ingress; ADR-012 (kind вместо k3d — ghcr.io заблокирован).
> **Коммиты:** c613fbe — feat(k8s): стенд kind в WSL2 (код, манифесты, ADR-012, фича 18, roadmap phase-6, AGENTS.md).
> **Файлы:** 22 changed, +1289/−11 (c613fbe)

## Что сделано

1. Фаза 6 открыта (решение автора «Да, давай», 2026-10-29): ADR-012, фича 18 (ТЗ R1–R6), roadmap phase-6 (этапы 6.1–6.4). Фаза 5 не блокируется (видео/публикация — автор).
2. Замер реестров машины (влияет на выбор раннера): `docker pull rancher/mirrored-pause:3.6` — OK; `ghcr.io/k3d-io/k3d-proxy:5.8.3` — `dial tcp 4.225.11.196:443: i/o timeout` (ghcr заблокирован → **k3d невозможен**); github.com/dl.k8s.io — 200; minio/minio — по-прежнему pull denied (ADR-008). Итог: **kind** (kindest/node — с docker.io, системные образы внутри).
3. Стенд: `scripts/k8s.mjs` (up/down/status) + `infra/k8s/` (kind-config, CRD traefik.io, base/: traefik 3.3, postgres 17-alpine, s3rver-образ `pm-s3rver:local` из нового `infra/k8s/s3-dev.Dockerfile`, nestjs, react, Ingress `/api`→nestjs со срезом префикса + `/`→react, пробы на всех деплойментах, Secret из .env). Скрипт сам ставит kind v0.26.0 + kubectl v1.32.0 в `~/.local/bin` WSL, собирает/пушит образы в локальный registry, ждёт rollout'ы, гоняет миграции+сиды с хоста (DB_PORT=55432, S3_ENDPOINT=:59002), smoke.
4. Патч `backend/nestjs/src/common/s3.ts`: `S3_URL_BASE` отдельно от `S3_ENDPOINT` — pod пишет в `http://s3:9000`, браузерные URL через проброшенный :59002 (обратная совместимость: дефолт = старое поведение).

## Грабли и как чинились (хронология прогонов)

- **Прогон 1** — `Error: kubectl version — код выхода 127`: проверка `kubectl version … | head -1` маскировала 127 пайпом → установка пропущена. Фикс: `command -v kubectl`.
- **Прогон 2** — kind create: `Ready after 58s`; упал `docker build`: `path "D:/AI_Cwork/polyglot-market/" not found` — `toWslPath` не матчил прямые слэши (`import.meta.url` даёт `D:/…`, а не `D:\…`). Фикс в `scripts/lib/docker.mjs` (оба разделителя).
- **Прогон 3** — `kind load docker-image …`: `ctr: content digest sha256:612d…: not found` на ЛЮБОМ образе (в т.ч. старом postgres) — docker 29 + containerd image store ломают docker save → ctr import. Фикс: канонический рецепт kind — локальный registry-контейнер `kind-registry` (registry:2) в сети kind + tag/push + containerdConfigPatches-зеркало `localhost:5001` → `http://kind-registry:5000`; кластер пересоздан под новый конфиг.
- **Прогон 4** — `namespaces "polyglot" not found` при создании секрета: applySecret шёл ДО applyManifests (раньше не стреляло — кластер уже существовал). Фикс: порядок apply → secret.
- **Прогон 5** — rollout-таймаут: postgres 0/1 (первичный initdb ~1 мин, пробы с initialDelay 15s его пинали), nestjs CrashLoopBackOff (TypeORM стучался в неготовую БД). Фикс: мягче пробы postgres (readiness failureThreshold 24, liveness initialDelay 60s) + `initContainer wait-db` (pg_isready loop) у nestjs — прод-паттерн.
- **Прогон 6** — smoke: `/api/health` → 404 «page not found» от Traefik при зелёных подах. Самая длинная диагностика:
  1. RBAC: `endpointslices` у меня были в группе `""`, а живут в `discovery.k8s.io` — исправлено;
  2. в ClusterRole не хватало `nodes` (cluster-scope lookup) — добавлено;
  3. корень: провайдер kubernetescrd ждёт синхронизации информеров по ВСЕМ типам traefik.io; на отсутствующих CRD (IngressRoute, TLSOption, …, `ServersTransportTCP` — добавлен в 3.3.x) List вечно падает → **конфиг молча не публикуется**, «Configuration received» 0. Лечение: полный набор минимальных пермиссив-CRD (`infra/k8s/crds/traefik-middleware-crd.yaml`, 10 типов) + RBAC на все типы. После этого — зелено.
- **Прогон 7 (финал)** — полный цикл зелёный: rollout'ы 5/5 `condition met`, forward-порты нативные (3/3), миграции «уже применена», сиды «данные уже есть» (идемпотентно), smoke 3/3: `/api/health` 200, `/api/products` 200 (`{"data":[…]}, 40 товаров из сидов` — заодно поправлен чекер: ответ-обёртка, не массив), `/` 200 SPA-HTML.
- **Conformance против кластера**: `CONFORMANCE_BASE_URL=http://127.0.0.1:8080/api pnpm conformance` — **17/17** (auth, catalog, cart X-Cart-Token, orders Idempotency-Key, roles 403-матрица, promo) — весь контракт сквозь Traefik со срезом `/api`.

## Прочие проверки

- Юниты NestJS: `pnpm --dir backend/nestjs test` — **7/7** (после патча s3.ts).
- `pnpm lint` — чисто; `node --check scripts/k8s.mjs` — ок.
- `pnpm typecheck` — **падает на `packages/conformance/src/spec.ts`** (ajv-типы из node_modules-дрейфа: `no construct signatures`); мои правки conformance не касаются — док-долг, зафиксирован, чинить отдельно.

## Что осталось / что всплыло

- 6.2–6.4 фазы 6: роутинг двух бекендов за ingress + HPA/k6; Prometheus+Grafana+Loki; ночная kind-джоба в CI.
- WSL-гашение убивает кластер при простое (наследие ADR-009) — `k8s:up` идемпотентен и поднимает всё; данные в PVC живут до `k8s:down`.
- ТЗ фичи 18 (R1–R6) ждёт верификации автора (`devst feature verify`).
- `.k8s/` (мосты) добавлен в .gitignore; rename ADR-файла (k3d→kind) сделан ДО первого коммита, ссылки в карте/фиче обновлены.

## Гейт закрытия сессии (фича 04 §7)

- Затронутые задачи сведены: «задач нет» — новые работы оформлены фичей 18 (см. devst board).
- Хвосты: «хвостов нет».
- Свип: llms.txt/ADR-индекс для скринеров упоминает ADR-001…011 — новый ADR-012 и фаза 6 туда не добавлены → долг витрины, сделать при публикации (фаза 5, автор). Grep по docs/ на устаревшие факты о портах: AGENTS.md обновлён (порты стенда), docs/README.md обновлён.

## Итог

- Состояние: стенд поднят и зелёный (`pnpm k8s:up` идемпотентен); smoke 3/3; conformance 17/17 через ingress; юниты NestJS 7/7; lint чист; typecheck красный по ЧУЖОЙ причине (conformance/ajv — док-долг).
