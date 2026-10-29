// Глобальный интерцептор метрик: считает каждый HTTP-запрос и его латентность.
// Маршрут берётся из шаблона express (req.route.path), чтобы /products/{id} не
// плодил кардинальность; на ошибках статус может быть неточным — исключение
// уходит в контрактный фильтр уже после интерцептора (осознанный компромисс).
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { Request, Response } from "express";
import { httpRequestDuration, httpRequestsTotal } from "./metrics";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = Date.now();
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const observe = (): void => {
      const route = req.route?.path ?? req.baseUrl ?? req.path;
      const labels = { method: req.method, route, status: String(res.statusCode) };
      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, (Date.now() - started) / 1000);
    };
    return next.handle().pipe(tap({ next: observe, error: observe }));
  }
}
