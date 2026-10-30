package dev.polyglot.spring27.auth;

import java.time.Instant;

/** Публичный профиль пользователя контракта (shopName — всегда null, паритет NestJS). */
public class UserView {

    public final String id;
    public final String email;
    public final String name;
    public final String role;
    public final boolean blocked;
    public final String shopName;
    public final Instant createdAt;

    public UserView(String id, String email, String name, String role, boolean blocked,
            String shopName, Instant createdAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.role = role;
        this.blocked = blocked;
        this.shopName = shopName;
        this.createdAt = createdAt;
    }

    public static UserView of(UserRow u) {
        return new UserView(u.id, u.email, u.name, u.role, u.blocked, null, u.createdAt.toInstant());
    }
}
