package dev.polyglot.spring27.auth;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class UsersRepository {

    public static class UserInsert {
        public final String email;
        public final String passwordHash;
        public final String name;
        public final String role;

        public UserInsert(String email, String passwordHash, String name, String role) {
            this.email = email;
            this.passwordHash = passwordHash;
            this.name = name;
            this.role = role;
        }
    }

    private static final RowMapper<UserRow> MAPPER = new RowMapper<UserRow>() {
        @Override
        public UserRow mapRow(ResultSet rs, int i) throws SQLException {
            return new UserRow(
                    rs.getString("id"),
                    rs.getString("email"),
                    rs.getString("password_hash"),
                    rs.getString("name"),
                    rs.getString("role"),
                    rs.getBoolean("blocked"),
                    rs.getObject("created_at", java.time.OffsetDateTime.class));
        }
    };

    private final JdbcTemplate jdbc;

    public UsersRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public UserRow findById(String id) {
        List<UserRow> rows = jdbc.query("SELECT * FROM users WHERE id = ?::uuid", MAPPER, id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public UserRow findByEmail(String email) {
        List<UserRow> rows = jdbc.query("SELECT * FROM users WHERE email = ?", MAPPER, email);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public void insert(UserInsert u) {
        jdbc.update("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?::user_role)",
                u.email, u.passwordHash, u.name, u.role);
    }

    public void updateRole(String id, String role) {
        jdbc.update("UPDATE users SET role = ?::user_role, updated_at = now() WHERE id = ?::uuid", role, id);
    }

    /** Страница пользователей; role — опциональный фильтр (админ, GET /admin/users). */
    public List<UserRow> page(int limit, int offset, String role) {
        List<Object> params = new ArrayList<Object>();
        String where = "";
        if (role != null) {
            where = " WHERE role = ?::user_role";
            params.add(role);
        }
        params.add(limit);
        params.add(offset);
        return jdbc.query("SELECT * FROM users" + where + " ORDER BY created_at ASC LIMIT ? OFFSET ?",
                MAPPER, params.toArray());
    }

    public int count(String role) {
        if (role == null) {
            return jdbc.queryForObject("SELECT count(*) FROM users", Integer.class);
        }
        return jdbc.queryForObject("SELECT count(*) FROM users WHERE role = ?::user_role", Integer.class, role);
    }
}
