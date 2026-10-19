import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ContractError, ContractExceptionFilter } from "./contract-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  await app.listen(port, "127.0.0.1");
  console.log(`nestjs: контракт на http://127.0.0.1:${port}`);
}

void bootstrap();
