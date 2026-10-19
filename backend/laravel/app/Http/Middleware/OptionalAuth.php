<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Throwable;

/**
 * Мягкая аутентификация для корзины: если валидный JWT есть — пользователь на запросе,
 * если нет — гость с X-Cart-Token. Никогда не 401.
 */
class OptionalAuth
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $guard = auth('api');
            if ($guard->setRequest($request)->getToken() && ($user = $guard->authenticate())) {
                auth()->setUser($user);
            }
        } catch (Throwable) {
            // невалидный токен → считаем гостем
        }

        return $next($request);
    }
}
