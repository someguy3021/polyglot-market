# Laravel backend — Polyglot Market

Laravel-реализация единого контракта [`shared/api-spec/openapi.yaml`](../../shared/api-spec/openapi.yaml).

**Важно:** схему БД этот проект НЕ создаёт. Миграции общие — `shared/db/migrations`, применяются
Node-раннером (`pnpm db:migrate` из корня). Причина — ADR-002: экстракт без PHP должен уметь
поднять БД. Eloquent-модели здесь только маппят общую схему (поле пароля — `password_hash`).

## Запуск

```bash
composer install
cp .env.example .env        # при необходимости поправьте DB_*/JWT_SECRET
php artisan key:generate
php artisan serve --port=8000
```

Проверка соответствия контракту (из корня репы):

```bash
pnpm conformance            # CONFORMANCE_BASE_URL=http://127.0.0.1:8000
```

## Структура

| Путь | Что |
|---|---|
| `bootstrap/app.php` | приложение + единый рендер ошибок контракта `{status, error, message, details}` |
| `routes/api.php` | пути = операции контракта (apiPrefix пустой) |
| `app/Http/Requests` | валидация (FormRequest), ошибки — в формате контракта |
| `app/Models` | Eloquent поверх общей схемы (users.role — enum, images — S3-ключи) |
| `config/jwt.php` | JWT (php-open-source-saver/jwt-auth), секрет общий с NestJS |
