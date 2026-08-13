FROM php:8.3-fpm-alpine AS php-base

RUN apk add --no-cache \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    oniguruma-dev \
    sqlite-dev \
    mysql-client \
    && docker-php-ext-install \
    pdo_mysql \
    pdo_sqlite \
    mbstring \
    zip \
    gd \
    bcmath

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

FROM php-base AS app-dependencies

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev

FROM php-base AS node-builder

RUN apk add --no-cache nodejs npm

COPY --from=app-dependencies /var/www/html /var/www/html

COPY package*.json ./
RUN npm ci

COPY resources ./resources
COPY public ./public
COPY tsconfig.json vite.config.ts ./
COPY components.json ./

RUN cp .env.example .env \
    && php artisan wayfinder:generate --with-form \
    && npm run build

FROM php-base AS runtime

COPY --from=app-dependencies /var/www/html /var/www/html
COPY --from=node-builder /var/www/html/public/build /var/www/html/public/build

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 9000

CMD ["php-fpm"]
