package dev.polyglot.spring27.common;

import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import dev.polyglot.spring27.auth.UserRow;

import javax.servlet.http.HttpServletRequest;

/** Резолвит @CurrentUser; required=true без пользователя → 401 в формате контракта. */
@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                && parameter.getParameterType().equals(UserRow.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
            NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        HttpServletRequest servlet = webRequest.getNativeRequest(HttpServletRequest.class);
        UserRow user = servlet == null ? null : (UserRow) servlet.getAttribute(AuthFilter.ATTR);
        if (user == null && parameter.getParameterAnnotation(CurrentUser.class).required()) {
            throw ContractException.unauthorized("Unauthenticated.");
        }
        return user;
    }
}
