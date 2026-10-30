package dev.polyglot.spring27.auth;

import java.time.OffsetDateTime;

/** Строка users как есть в общей БД (схема — shared/db/migrations, ADR-002). */
public class UserRow {

    public final String id;
    public final String email;
    public final String passwordHash;
    public final String name;
    public final String role;
    public final boolean blocked;
    public final OffsetDateTime createdAt;

    public UserRow(String id, String email, String passwordHash, String name, String role,
            boolean blocked, OffsetDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.name = name;
        this.role = role;
        this.blocked = blocked;
        this.createdAt = createdAt;
    }
}
