# Production deployment checklist

This project is a React SPA backed by Laravel and MySQL. Serve the React `dist` directory from `https://app.example.com` and Laravel's `school-backend/public` directory from `https://api.example.com` (or use equivalent paths under one HTTPS domain).

1. Copy `.env.production.example` to the frontend `.env.production` and replace the example API domain.
2. Copy `school-backend/.env.production.example` to `school-backend/.env`. Generate a new `APP_KEY` with `php artisan key:generate --force`; supply a restricted MySQL user, the real frontend domain, and working SMTP credentials. Never commit either `.env` file.
3. On the server, install PHP 8.2+ with PDO MySQL, OpenSSL, Mbstring, XML, Ctype, JSON, Fileinfo, Tokenizer, and Intl. Install Composer dependencies with `composer install --no-dev --optimize-autoloader`.
4. Build the SPA with `npm ci` then `npm run build`. Configure the web server to return `index.html` for unknown frontend routes. Configure Laravel's web root as `school-backend/public`, never `school-backend`.
5. Run `php artisan migrate --force`, `php artisan storage:link`, and `php artisan optimize`. The tracked session migration makes a fresh database compatible with `SESSION_DRIVER=database`.
6. Run a persistent queue worker when using the database queue: `php artisan queue:work --sleep=3 --tries=3 --max-time=3600`.
7. Enable HTTPS before setting `SESSION_SECURE_COOKIE=true`. Keep the React and API domains listed exactly in `CORS_ALLOWED_ORIGINS` and `SANCTUM_STATEFUL_DOMAINS`; do not use wildcard origins with credentialed cookies.
8. After deployment, verify login, logout, password reset email delivery, an authenticated API request, uploads, and each role dashboard.
