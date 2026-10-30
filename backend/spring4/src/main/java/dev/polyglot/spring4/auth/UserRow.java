package dev.polyglot.spring4.auth;

import java.time.OffsetDateTime;

/** Строка users как есть в общей БД (схема — shared/db/migrations, ADR-002). */
public record UserRow(
        String id,
        String email,
        String passwordHash,
        String name,
        String role,
        boolean blocked,
        OffsetDateTime createdAt) {
}
