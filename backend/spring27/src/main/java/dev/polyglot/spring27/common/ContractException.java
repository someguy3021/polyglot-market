package dev.polyglot.spring27.common;

import java.util.List;
import java.util.Map;

/** Ошибка в формате контракта: { status, error, message, details? }. */
public class ContractException extends RuntimeException {

    private final int status;
    private final String error;
    private final Map<String, List<String>> details;

    public ContractException(int status, String error, String message) {
        this(status, error, message, null);
    }

    public ContractException(int status, String error, String message, Map<String, List<String>> details) {
        super(message);
        this.status = status;
        this.error = error;
        this.details = details;
    }

    public static ContractException validation(String message, Map<String, List<String>> details) {
        return new ContractException(422, "validation_error", message, details);
    }

    public static ContractException unprocessable(String message) {
        return new ContractException(422, "unprocessable", message);
    }

    public static ContractException unauthorized(String message) {
        return new ContractException(401, "unauthorized", message);
    }

    public static ContractException forbidden(String message) {
        return new ContractException(403, "forbidden", message);
    }

    public static ContractException notFound(String message) {
        return new ContractException(404, "not_found", message);
    }

    public static ContractException conflict(String message) {
        return new ContractException(409, "conflict", message);
    }

    public int getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    public Map<String, List<String>> getDetails() {
        return details;
    }
}
