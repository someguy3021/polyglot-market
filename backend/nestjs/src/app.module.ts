import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? "polyglot",
      password: process.env.DB_PASSWORD ?? "secret",
      database: process.env.DB_DATABASE ?? "polyglot",
      entities: [__dirname + "/**/*.entity.js"],
      // Схема живёт в общих миграциях (ADR-002) — synchronize запрещён.
      synchronize: false,
      logging: false,
    }),
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
