package dev.polyglot.spring27.auth;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import dev.polyglot.spring27.common.ContractException;
import dev.polyglot.spring27.common.JwtService;

@Service
public class AuthService {

    public static class AuthPayload {
        public final String token;
        public final UserView user;

        public AuthPayload(String token, UserView user) {
            this.token = token;
            this.user = user;
        }
    }

    private final UsersRepository users;
    private final JwtService jwt;
    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder(10);

    public AuthService(UsersRepository users, JwtService jwt) {
        this.users = users;
        this.jwt = jwt;
    }

    public AuthPayload register(String name, String email, String password) {
        if (users.findByEmail(email) != null) {
            Map<String, java.util.List<String>> details = new HashMap<String, java.util.List<String>>();
            details.put("email", Collections.singletonList("The email has already been taken."));
            throw ContractException.validation("The given data was invalid.", details);
        }
        // $2y-префикс: паритет с Laravel-хешами в общей таблице (как в NestJS auth.service);
        // в replacement "$" экранируем — иначе regex читает "$2y" как ссылку на группу
        String hash = bcrypt.encode(password).replaceFirst("^\\$2a\\$", "\\$2y\\$");
        users.insert(new UsersRepository.UserInsert(email, hash, name, "buyer"));
        UserRow user = users.findByEmail(email);
        return new AuthPayload(jwt.issue(user.id), UserView.of(user));
    }

    public AuthPayload login(String email, String password) {
        // BCryptPasswordEncoder.matches читает $2a/$2b/$2y — хеши из любой из трёх реализаций
        UserRow user = users.findByEmail(email);
        if (user == null || !bcrypt.matches(password, user.passwordHash)) {
            throw ContractException.unauthorized("Invalid credentials.");
        }
        return new AuthPayload(jwt.issue(user.id), UserView.of(user));
    }
}
