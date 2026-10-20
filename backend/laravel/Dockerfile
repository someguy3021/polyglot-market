# Laravel-бекенд (фича 03): php-cli + composer + artisan serve.
# Сборка ТОЛЬКО из корня репы: docker build -f backend/laravel/Dockerfile .
FROM php:8.3-cli-alpine AS base
RUN docker-php-ext-install pdo pdo_pgsql
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www
COPY backend/laravel/composer.json backend/laravel/composer.lock* ./
RUN composer install --no-interaction --no-scripts
COPY backend/laravel .
RUN php artisan key:generate --force || true
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
