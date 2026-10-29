// JSON-логгер NestJS поверх pino (6.3): stdout в JSON-строках — их собирает
// promtail и складывает в Loki с уровнем (level). Структура: level/time/service/context.
import { LoggerService } from "@nestjs/common";
import pino, { Logger } from "pino";

const root: Logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "nestjs" },
});

export class PinoLogger implements LoggerService {
  private readonly base: Logger;

  constructor(context?: string) {
    this.base = context ? root.child({ context }) : root;
  }

  log(message: unknown, context?: string): void {
    this.write("info", message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write("error", message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write("warn", message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write("debug", message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write("trace", message, context);
  }

  private write(level: "info" | "error" | "warn" | "debug" | "trace", message: unknown, context?: string, trace?: string): void {
    const logger = context ? this.base.child({ context }) : this.base;
    const payload = typeof message === "string" ? { msg: message } : message;
    if (trace) logger.child({ trace })[level](payload);
    else logger[level](payload);
  }
}
