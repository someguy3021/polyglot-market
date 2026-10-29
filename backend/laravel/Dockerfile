# Laravel-бекенд (фича 03): php-cli + composer + artisan serve.
# Сборка ТОЛЬКО из корня репы: docker build -f backend/laravel/Dockerfile .
FROM php:8.3-cli-alpine AS base
# pdo_pgsql требует libpq-dev, которого нет в cli-alpine. Рантайм-библиотеку
# (postgresql-libs) возвращаем ПОСЛЕ удаления заголовков: без неё .so не грузится
# и composer не видит ext-pdo_pgsql (session 10).
RUN apk add --no-cache --virtual .build-deps postgresql-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && apk del .build-deps \
    && apk add --no-cache postgresql-libs
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www
COPY backend/laravel/composer.json backend/laravel/composer.lock* ./
RUN composer install --no-interaction --no-scripts
COPY backend/laravel .
RUN php artisan key:generate --force || true
# bootstrap/cache отсутствует в репе (gitignore) — artisan serve без него падает
# ("directory must be present and writable", session 10); storage/framework — то же.
RUN mkdir -p bootstrap/cache storage/framework/cache storage/framework/sessions storage/framework/views \
    && chmod -R ug+rwX bootstrap/cache storage
EXPOSE 8000
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
