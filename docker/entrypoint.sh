#!/bin/sh
set -e

# Pastikan public storage symlink terpasang
if [ ! -e /var/www/html/public/storage ]; then
  cd /var/www/html && php artisan storage:link || true
fi

# Migrasi database otomatis
if [ "$RUN_MIGRATE" = "true" ] || [ "$RUN_MIGRATE_FRESH" = "true" ]; then
  if [ "$RUN_MIGRATE_FRESH" = "true" ]; then
    echo "Running migrate:fresh..."
    php artisan migrate:fresh --force
  else
    echo "Running migrate --force..."
    php artisan migrate --force
  fi
  if [ "$RUN_SEEDER" = "true" ]; then
    echo "Running db:seed..."
    php artisan db:seed --force
  fi
fi

# Optimasi cache Laravel di production
if [ "$APP_ENV" = "production" ]; then
  php artisan config:cache || true
  php artisan route:cache || true
  php artisan view:cache || true
fi

# Atur ownership ke www-data
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache 2>/dev/null || true

exec "$@"
