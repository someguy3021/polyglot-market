package dev.polyglot.spring4.service;

import java.time.Instant;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** GET /health — живость сервиса (контракт: status ok + имя сервиса + время). */
@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "spring4", "time", Instant.now().toString());
    }
}
