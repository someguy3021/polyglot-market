package dev.polyglot.spring27.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** GET /health — живость сервиса (контракт: status ok + имя сервиса + время). */
@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<String, Object>();
        body.put("status", "ok");
        body.put("service", "spring27");
        body.put("time", Instant.now().toString());
        return body;
    }
}
