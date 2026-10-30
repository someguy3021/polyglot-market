package dev.polyglot.spring4.auth;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UsersRepository {

    public record UserInsert(String email, String passwordHash, String name, String role) {
    }

    private static final RowMapper<UserRow> MAPPER = (rs, i) -> new UserRow(
            rs.getString("id"),
            rs.getString("email"),
            rs.getString("password_hash"),
            rs.getString("name"),
            rs.getString("role"),
            rs.getBoolean("blocked"),
            rs.getObject("created_at", OffsetDateTime.class));

    private final JdbcClient jdbc;

    public UsersRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UserRow> findById(String id) {
        return jdbc.sql("SELECT * FROM users WHERE id = ?::uuid")
                .param(id)
                .query(MAPPER)
                .optional();
    }

    public Optional<UserRow> findByEmail(String email) {
        return jdbc.sql("SELECT * FROM users WHERE email = ?")
                .param(email)
                .query(MAPPER)
                .optional();
    }

    public void insert(UserInsert u) {
        jdbc.sql("""
                INSERT INTO users (email, password_hash, name, role)
                VALUES (?, ?, ?, ?::user_role)
                """)
                .param(u.email())
                .param(u.passwordHash())
                .param(u.name())
                .param(u.role())
                .update();
    }

    public void updateRole(String id, String role) {
        jdbc.sql("UPDATE users SET role = ?::user_role, updated_at = now() WHERE id = ?::uuid")
                .param(role)
                .param(id)
                .update();
    }

    /** Страница пользователей; role — опциональный фильтр (админ, GET /admin/users). */
    public List<UserRow> page(int limit, int offset, String role) {
        String where = role == null ? "" : " WHERE role = ?::user_role";
        String sql = "SELECT * FROM users" + where + " ORDER BY created_at ASC LIMIT ? OFFSET ?";
        var q = jdbc.sql(sql);
        if (role != null) q = q.param(role);
        return q.param(limit).param(offset).query(MAPPER).list();
    }

    public int count(String role) {
        String where = role == null ? "" : " WHERE role = ?::user_role";
        var q = jdbc.sql("SELECT count(*) FROM users" + where);
        if (role != null) q = q.param(role);
        return q.query(Integer.class).single();
    }
}
