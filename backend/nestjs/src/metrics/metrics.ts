// Метрики NestJS для Prometheus (фича 18/6.3): дефолтные метрики процесса +
// HTTP-счётчик и гистограмма латентности. Эндпоинт /metrics — операционный,
// вне контракта (ADR-005 затрагивает только контрактные маршруты).
import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

export const registry = new Registry();
registry.setDefaultLabels({ service: "nestjs" });
collectDefaultMetrics({ register: registry });

export const httpRequestsTotal = new Counter({
  name: "polyglot_http_requests_total",
  help: "HTTP-запросы к NestJS по маршруту и статусу",
  labelNames: ["method", "route", "status"] as const,
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: "polyglot_http_request_duration_seconds",
  help: "Латентность HTTP-запросов NestJS в секундах",
  labelNames: ["method", "route", "status"] as const,
  registers: [registry],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});
