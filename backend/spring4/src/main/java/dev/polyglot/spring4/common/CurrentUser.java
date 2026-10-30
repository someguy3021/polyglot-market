package dev.polyglot.spring4.common;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Параметр метода-контроллера: текущий пользователь из Bearer-токена. */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUser {

    /** false — параметр nullable (гостевые сценарии корзины). */
    boolean required() default true;
}
