package dev.polyglot.spring4.common;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import jakarta.validation.ConstraintViolationException;

/** Единый формат ошибок контракта: { status, error, message, details? }. */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class);

    public record ErrorView(int status, String error, String message, Map<String, List<String>> details) {
    }

    @ExceptionHandler(ContractException.class)
    public ResponseEntity<ErrorView> contract(ContractException e) {
        return ResponseEntity.status(e.getStatus()).body(new ErrorView(e.getStatus(), e.getError(), e.getMessage(), e.getDetails()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorView> bodyValidation(MethodArgumentNotValidException e) {
        Map<String, List<String>> details = new java.util.LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
                .forEach(fe -> details.computeIfAbsent(fe.getField(), k -> new java.util.ArrayList<>()).add(fe.getDefaultMessage()));
        return ResponseEntity.status(422).body(new ErrorView(422, "validation_error", "The given data was invalid.", details));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class, HandlerMethodValidationException.class})
    public ResponseEntity<ErrorView> malformed(Exception e) {
        return ResponseEntity.status(422).body(new ErrorView(422, "validation_error", "The given data was invalid.", null));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorView> paramValidation(ConstraintViolationException e) {
        Map<String, List<String>> details = new java.util.LinkedHashMap<>();
        e.getConstraintViolations()
                .forEach(v -> details.computeIfAbsent(lastPathSegment(v.getPropertyPath().toString()), k -> new java.util.ArrayList<>())
                        .add(v.getMessage()));
        return ResponseEntity.status(422).body(new ErrorView(422, "validation_error", "The given data was invalid.", details));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorView> noRoute(NoResourceFoundException e) {
        return ResponseEntity.status(404).body(new ErrorView(404, "not_found", "Not found.", null));
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorView> integrity(org.springframework.dao.DataIntegrityViolationException e) {
        // Нарушение FK/CHECK, которое сервис не поймал сам (например, несуществующая категория)
        return ResponseEntity.status(422).body(new ErrorView(422, "validation_error", "The given data was invalid.", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorView> internal(Exception e) {
        log.error("internal error: {} {}", e.getClass().getSimpleName(), e.getMessage(), e);
        return ResponseEntity.status(500).body(new ErrorView(500, "internal", "Internal server error.", null));
    }

    private static String lastPathSegment(String path) {
        int dot = path.lastIndexOf('.');
        return dot < 0 ? path : path.substring(dot + 1);
    }
}
