<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

require_once __DIR__.'/../vendor/autoload.php';

/*
| Единый формат ошибок контракта: { status, error, message, details? }.
| Рендер исключений — единственное место, где он собирается (ADR-004/005).
*/
$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        apiPrefix: '',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // API-only: неавторизованных не редиректим (route('login') не существует) — 401 JSON из хендлера.
        $middleware->redirectGuestsTo(fn () => null);
        $middleware->alias([
            'auth.optional' => \App\Http\Middleware\OptionalAuth::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // API-only сервис: любые ошибки аутентификации — JSON, никаких redirect на route('login').
        $exceptions->shouldRenderJsonWhen(fn (Request $request, Throwable $e) => true);
        $exceptions->render(function (ValidationException $e, Request $request) {
            return json_error(422, 'validation_error', $e->getMessage(), $e->errors());
        });
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return json_error(401, 'unauthorized', $e->getMessage() ?: 'Unauthenticated.');
        });
        // jwt-auth бросает свои исключения в обход AuthenticationException (битый/просроченный токен)
        $exceptions->render(function (\PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException $e, Request $request) {
            return json_error(401, 'unauthorized', 'Unauthenticated.');
        });
        $exceptions->render(function (AuthorizationException $e, Request $request) {
            return json_error(403, 'forbidden', $e->getMessage() ?: 'Forbidden.');
        });
        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            return json_error(404, 'not_found', 'Resource not found.');
        });
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            return json_error(404, 'not_found', $e->getMessage() ?: 'Not found.');
        });
        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            $map = [
                400 => 'validation_error',
                401 => 'unauthorized',
                403 => 'forbidden',
                404 => 'not_found',
                409 => 'conflict',
                422 => 'unprocessable',
            ];
            $status = $e->getStatusCode();
            return json_error($status, $map[$status] ?? 'internal', $e->getMessage() ?: 'Error.');
        });
        $exceptions->render(function (Throwable $e, Request $request) {
            if (config('app.debug')) {
                return null; // отдаём отладку дефолтному рендеру Laravel (APP_DEBUG=true)
            }
            return json_error(500, 'internal', 'Internal server error.');
        });
    })->create();

return $app;

/** Собирает единый формат ошибки из контракта (shared/api-spec/openapi.yaml → Error). */
function json_error(int $status, string $error, string $message, array $details = []): JsonResponse
{
    $body = ['status' => $status, 'error' => $error, 'message' => $message];
    if ($details !== []) {
        $body['details'] = collect($details)
            ->map(fn ($messages) => array_values((array) $messages))
            ->all();
    }

    return response()->json($body, $status);
}
