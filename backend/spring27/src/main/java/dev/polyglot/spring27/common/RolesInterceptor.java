package dev.polyglot.spring27.common;

import java.util.Arrays;

import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import dev.polyglot.spring27.auth.UserRow;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/** Ролевой контроль: 401 без пользователя, 403 при несовпадении роли (паритет NestJS-гарду). */
@Component
public class RolesInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }
        HandlerMethod hm = (HandlerMethod) handler;
        Roles required = hm.getMethodAnnotation(Roles.class);
        if (required == null) {
            required = hm.getBeanType().getAnnotation(Roles.class);
        }
        if (required == null || required.value().length == 0) {
            return true;
        }
        UserRow user = (UserRow) request.getAttribute(AuthFilter.ATTR);
        if (user == null) {
            throw ContractException.unauthorized("Unauthenticated.");
        }
        if (!Arrays.asList(required.value()).contains(user.role)) {
            throw ContractException.forbidden(user.role + " role is not allowed here.");
        }
        return true;
    }
}
