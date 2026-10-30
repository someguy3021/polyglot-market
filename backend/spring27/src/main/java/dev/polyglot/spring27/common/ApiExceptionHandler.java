package dev.polyglot.spring27.common;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import javax.validation.ConstraintViolationException;

/** Единый формат ошибок контракта: { status, error, message, details? }. */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    public static class ErrorView {
        public final int status;
        public final String error;
        public final String message;
        public final Map<String, List<String>> details;

        public ErrorView(int status, String error, String message, Map<String, List<String>> details) {
            this.status = status;
            this.error = error;
            this.message = message;
            this.details = details;
        }
    }

    @ExceptionHandler(ContractException.class)
    public ResponseEntity<ErrorView> contract(ContractException e) {
        return ResponseEntity.status(e.getStatus()).body(new ErrorView(e.getStatus(), e.getError(), e.getMessage(), e.getDetails()));
    }

    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorView> bodyValidation(org.springframework.web.bind.MethodArgumentNotValidException e) {
        Map<String, List<String>> details = new LinkedHashMap<String, List<String>>();
        for (org.springframework.validation.FieldError fe : e.getBindingResult().getFieldErrors()) {
            List<String> messages = details.get(fe.getField());
            if (messages == null) {
                messages = new ArrayList<String>();
                details.put(fe.getField(), messages);
            }
            messages.add(fe.getDefaultMessage());
        }
        return ResponseEntity.status(422).body(new ErrorView(422, "validation_error", "The given data was invalid.", details));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorView> malformed(Exception e) {
        return ResponseEntity.status(422).body(new ErrorView(422, "validation_error", "The given data was invalid.", null));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorView> paramValidation(ConstraintViolationException e) {
        Map<String, List<String>> details = new LinkedHashMap<String, List<String>>();
        for (javax.validation.ConstraintViolation<?> v : e.getConstraintViolations()) {
            String path = v.getPropertyPath().toString();
            int dot = path.lastIndexOf('.');
            String key = dot < 0 ? path : path.substring(dot + 1);
            List<String> messages = details.get(key);
            if (messages == null) {
                messages = new ArrayList<String>();
                details.put(key, messages);
            }
            messages.add(v.getMessage());
        }
        return ResponseEntity.status(422).body(new ErrorView(422, "validation_error", "The given data was invalid.", details));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorView> integrity(DataIntegrityViolationException e) {
        // Нарушение FK/CHECK, которое сервис не поймал сам (например, несуществующая категория)
        return ResponseEntity.status(422).body(new ErrorView(422, "validation_error", "The given data was invalid.", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorView> internal(Exception e) {
        log.error("internal error: {} {}", e.getClass().getSimpleName(), e.getMessage(), e);
        return ResponseEntity.status(500).body(new ErrorView(500, "internal", "Internal server error.", null));
    }
}
