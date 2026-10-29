import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ContractError, ContractExceptionFilter } from "./contract-exception.filter";
import { MetricsInterceptor } from "./metrics/metrics.interceptor";
import { PinoLogger } from "./logger";

async function bootstrap() {
  const logger = new PinoLogger("bootstrap");
  const app = await NestFactory.create(AppModule);
  // JSON-логи в stdout (6.3): их собирает promtail → Loki
  app.useLogger(logger);
  // Метрики HTTP (6.3): счётчик и латентность по маршруту
  app.useGlobalInterceptors(new MetricsInterceptor());
  // CORS: фронты живут на своих портах (демо-среда — любой origin)
  app.enableCors({ origin: true, exposedHeaders: ["X-Cart-Token"] });
  // Ошибки валидации DTO — сразу в формате контракта (422 + details)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new ContractError(
          422,
          "validation_error",
          "The given data was invalid.",
          Object.fromEntries(errors.map((e) => [e.property, Object.values(e.constraints ?? {})])),
        ),
    }),
  );
  app.useGlobalFilters(new ContractExceptionFilter());
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, "0.0.0.0");
  logger.log(`контракт на http://127.0.0.1:${port}, метрики на /metrics`);
}

void bootstrap();
