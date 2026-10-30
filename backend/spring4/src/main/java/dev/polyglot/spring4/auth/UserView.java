package dev.polyglot.spring4.auth;

import java.time.Instant;

/** Публичный профиль пользователя контракта (shopName — всегда null, паритет NestJS). */
public record UserView(
        String id,
        String email,
        String name,
        String role,
        boolean blocked,
        String shopName,
        Instant createdAt) {

    public static UserView of(UserRow u) {
        return new UserView(u.id(), u.email(), u.name(), u.role(), u.blocked(), null, u.createdAt().toInstant());
    }
}
