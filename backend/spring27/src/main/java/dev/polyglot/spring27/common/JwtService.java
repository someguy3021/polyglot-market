package dev.polyglot.spring27.common;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

/**
 * JWT HS256, claim sub, 24ч — общий секрет с NestJS/Laravel (JWT_SECRET):
 * токены взаимозаменяемы между всеми четырьмя бекендами.
 * jjwt 0.11 — API эпохи Boot 2.7 (setSubject/parserBuilder).
 */
@Service
public class JwtService {

    private static final long TTL_MS = 24L * 60 * 60 * 1000;

    private final SecretKey key;

    public JwtService(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String issue(String userId) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + TTL_MS))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Подпись/срок проверяются сразу; null — токен невалиден. */
    public String verifySubject(String token) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build()
                    .parseClaimsJws(token).getBody().getSubject();
        } catch (RuntimeException e) {
            return null;
        }
    }
}
