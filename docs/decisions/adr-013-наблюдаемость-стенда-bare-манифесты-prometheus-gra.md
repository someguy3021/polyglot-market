# ADR-013: наблюдаемость стенда: bare-манифесты Prometheus/Grafana/Loki без helm и операторов

> **Статус:** Принято · **Дата:** 2026-10-29

**Суть:** стек наблюдаемости (Prometheus + Grafana + Loki/Promtail + kube-state-metrics) деплоится голыми манифестами Kustomize в `infra/k8s/observability/`, применяется тем же `pnpm k8s:up`; метрики приложений — prom-client (`/metrics` NestJS) + Traefik-счётчики, логи — pino-JSON (NestJS) и stderr (Laravel) через promtail.

**Отвергнуто:** kube-prometheus-stack (helm + Prometheus Operator) — тяжеловес и новый инструмент ради демо; ELK — не влезает в машину; helm-чарты Grafana/Loki — та же логика, что в ADR-012: манифесты в репе видны целиком.

**Связанное:** [ADR-012](./adr-012-kubernetes-стенд-локально-kind-в-wsl2-манифесты-cloud-переносимы.md) · features/18 · features/15

## Контекст

- Фаза 6.3 обещает «нагрузка → реплики → графики» для витрины: рекрутер должен видеть автоскейлинг глазами, без kubectl.
- Стенд живёт по принципам ADR-012: явные команды, манифесты в репе, локальный registry (внешние пуллы на машине флапают).
- Метрики нужны из трёх мест: приложение (RPS/латентность NestJS), edge (RPS по всем трём сервисам — это уже умеет Traefik), кластер (реплики деплойментов для графика HPA — kube-state-metrics; CPU подов — cAdvisor с kubelet).

## Опции

### A. kube-prometheus-stack через helm

- Плюсы: индустриальный стандарт, оператор, готовые дашборды.
- Минусы: +helm как инструмент, +CRD оператора (десятки ресурсов), тяжёлый для машины; «витрина одной командой» превращается в «витрина + менеджер пакетов».

### B. Bare-манифесты Prometheus + Grafana + Loki + Promtail + kube-state-metrics

- Плюсы: пять YAML-файлов в репе, никакого helm; каждый компонент — один Deployment с ConfigMap; стиль идентичен остальному стенду (Traefik тоже без helm); облако-переносимо как есть.
- Минусы: свою «экосистему правил» (Alertmanager, Operator'ы) не получаем — для демо и не нужно; дашборд собираем руками.

## Решение

**Вариант B.** `infra/k8s/observability/` (Kustomize, namespace polyglot): Prometheus v3 (scrape по аннотациям `prometheus.io/*` подов + kubelet/cAdvisor + kube-state-metrics; RBAC с nonResourceURLs /metrics, /metrics/cadvisor), Loki single-binary (tsdb+filesystem, PVC 2Gi), Promtail DaemonSet (логи подов из /var/log/pods; pino-JSON парсится в level), Grafana 11 (datasources + дашборд «Polyglot stand» провижинятся из ConfigMap — дашборд as code). Grafana наружу: NodePort 30090 → http://localhost:8180, анонимный просмотр (демо).

Инструментирование приложений:
- NestJS: `prom-client` — `polyglot_http_requests_total` + `polyglot_http_request_duration_seconds` (глобальный интерцептор, маршрут из шаблона express) и дефолтные метрики процесса; `pino` как LoggerService — JSON-строки в stdout.
- Laravel: без инструментирования кода — `LOG_CHANNEL=stderr` (логи уходят в stdout пода → promtail), RPS виден через Traefik.
- Traefik: `--metrics.prometheus` на отдельном entrypoint :8082, discovery по аннотациям.

Все образы наблюдаемости идут через локальный registry (IMAGES в scripts/k8s.mjs) — прямой пулл traefik с docker.io уже бился о флей auth.docker.io (session 10); kube-state-metrics/metrics-server — с registry.k8s.io (досягаем), в кластер — тем же путём.

## Обоснование

- Тот же масштаб решений, что у Traefik в ADR-012: голые манифесты «открыл файл — понял всё»; helm добавил бы инструмент, не добавив витринной ценности.
- Ограниченный/флапающий реестр: все образы через локальный registry закрывают класс падений «пулл во время демонстрации».
- Grafana-дашборд в ConfigMap = экспонат «как мы смотрим» лежит в git, а не собран мышкой в UI.

## Последствия

**Позитивные:**
- `pnpm k8s:up` поднимает витрину сразу с наблюдаемостью; `pnpm k8s:load` наполняет графики «нагрузка → реплики» живыми данными.
- Паттерн переносится в облако без изменений (标准ные CRD/ресурсы; сервис-дискавери — по аннотациям).

**Негативные / риски:**
- Свой Prometheus-config: новые источники метрик требуют ручной правки relabel-правил (в отличие от операторного ServiceMonitor).
- Loki single-binary без репликации — для демо-стенда осознанно; retention 3д/2Gi.
- Дашборд-JSON в репе — руками; Grafana-экспорт придётся вставлять обратно при правках из UI.
