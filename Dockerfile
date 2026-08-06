# Stage 1: PHP Dependencies
FROM php:8.5-fpm AS vendor
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy composer files and install
COPY composer.json composer.lock* ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader

# Stage 2: Node Dependencies & Build
FROM node:22-alpine AS frontend
WORKDIR /var/www/html
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
# Required for Laravel Vite plugin or Wayfinder to properly read routes if needed, 
# although mostly static JS is built here.
COPY --from=vendor /var/www/html/vendor ./vendor
RUN npm run build

# Stage 3: Production Runtime
FROM php:8.5-fpm
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Copy application files
COPY . .
COPY --from=vendor /var/www/html/vendor ./vendor
COPY --from=frontend /var/www/html/public/build ./public/build

# Set permissions for Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Production environment variables
ENV APP_ENV=production
ENV APP_DEBUG=false

EXPOSE 9000
CMD ["php-fpm"]
