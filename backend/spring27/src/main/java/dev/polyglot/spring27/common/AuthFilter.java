package dev.polyglot.spring27.common;

import java.io.IOException;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import dev.polyglot.spring27.auth.UserRow;
import dev.polyglot.spring27.auth.UsersRepository;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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
                UserRow user = users.findById(sub);
                if (user != null && !user.blocked) {
                    request.setAttribute(ATTR, user);
                }
            }
        }
        chain.doFilter(request, response);
    }
}
