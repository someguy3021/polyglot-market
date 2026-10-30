package dev.polyglot.spring27.common;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** CORS для фронтов (демо-среда — любой origin) + интерсепторы/резолверы. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final RolesInterceptor roles;
    private final CurrentUserArgumentResolver currentUser;

    public WebConfig(RolesInterceptor roles, CurrentUserArgumentResolver currentUser) {
        this.roles = roles;
        this.currentUser = currentUser;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("*")
                .allowedHeaders("*")
                // гостевая корзина живёт в этом заголовке — фронт должен его видеть
                .exposedHeaders("X-Cart-Token")
                .maxAge(3600);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(roles);
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUser);
    }
}
