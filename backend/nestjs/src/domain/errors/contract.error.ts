// Ошибка с уже готовым телом контракта: { status, error, message, details? }.
// Clean: доменная ошибка — сервисы бросают её, не зная про HTTP; форму ответа
// из неё собирает ContractExceptionFilter (presentation, аналог json_error()
// в Laravel bootstrap/app.php).
export class ContractError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
  }
}
