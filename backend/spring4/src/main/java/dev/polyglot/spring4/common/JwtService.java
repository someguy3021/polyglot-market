package dev.polyglot.spring4.common;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * JWT HS256, claim sub, 24ч — общий секрет с NestJS/Laravel (JWT_SECRET):
 * токены взаимозаменяемы между всеми четырьмя бекендами.
 */
@Service
public class JwtService {

    private static final Duration TTL = Duration.ofHours(24);

    private final SecretKey key;

    public JwtService(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public String issue(String userId) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(TTL)))
                .signWith(key)
                .compact();
    }

    /** Подпись/срок проверяются сразу; null — токен невалиден. */
    public String verifySubject(String token) {
        try {
            return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
        } catch (RuntimeException e) {
            return null;
        }
    }
}
