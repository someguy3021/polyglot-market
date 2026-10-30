// Единый формат ошибок контракта: { status, error, message, details? }.
// Единственное место его сборки — аналог json_error() в Laravel (bootstrap/app.php).
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Response } from "express";
import { ContractError } from "../../domain/errors/contract.error";

const ERROR_CODES: Record<number, string> = {
  400: "validation_error",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "unprocessable",
};

@Catch()
export class ContractExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof ContractError) {
      return res.status(exception.status).json({
        status: exception.status,
        error: exception.code,
        message: exception.message,
        ...(exception.details ? { details: exception.details } : {}),
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === "object" && payload !== null && "message" in payload
          ? (payload as { message?: unknown }).message
          : exception.message;
      return res.status(status).json({
        status,
        error: ERROR_CODES[status] ?? "internal",
        message: typeof message === "string" ? message : "Error.",
      });
    }

    console.error(exception);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: 500,
      error: "internal",
      message: "Internal server error.",
    });
  }
}
