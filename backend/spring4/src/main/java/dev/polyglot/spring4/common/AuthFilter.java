package dev.polyglot.spring4.common;

import java.io.IOException;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import dev.polyglot.spring4.auth.UserRow;
import dev.polyglot.spring4.auth.UsersRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Bearer-токен → request attribute. Здесь аутентификация НЕ обязательна:
 * эндпоинты решают сами (@CurrentUser / @Roles), 401 они отдают в формате контракта.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class AuthFilter extends OncePerRequestFilter {

    public static final String ATTR = "pm.user";

    private final JwtService jwt;
    private final UsersRepository users;

    public AuthFilter(JwtService jwt, UsersRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String sub = jwt.verifySubject(header.substring(7).trim());
            if (sub != null) {
                // заблокированный пользователь = неаутентифицированный (паритет NestJS-гарду)
                users.findById(sub).filter(u -> !u.blocked()).ifPresent(u -> request.setAttribute(ATTR, u));
            }
        }
        chain.doFilter(request, response);
    }
}
