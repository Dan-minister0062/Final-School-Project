# DEPLOYMENT.md — madrassatalfath.com (cPanel)

Runbook for putting **React (Vite) frontend + Laravel 12 API + MySQL** live on cPanel shared hosting. Read `HOSTING.md` for the full walkthrough; this file is the ordered checklist to execute.

**Architecture**
- `https://madrassatalfath.com` → React SPA served from `public_html/`
- `https://api.madrassatalfath.com` → Laravel API served from `public_html/api/public/`

---

## 0. Requirements (hard ceilings)
- PHP **8.2+** (cPanel → MultiPHP Manager) with `pdo_mysql mbstring xml ctype json tokenizer openssl curl fileinfo intl zip`
- Node **20.19+ / 22.12+** (build machine only) · Composer (server)
- MySQL db + user · SSL on both hosts · SMTP credentials

---

## 1. DNS (Namecheap)

1. Get your cPanel IP from the host.
2. Namecheap → **Advanced DNS** for `madrassatalfath.com`:
   - `A  @   -> <IP>`
   - `A  api -> <IP>`  (or `CNAME api -> @`)
3. Wait for propagation (confirm on dnschecker.org).
   - If the host uses other nameservers, change nameservers on Namecheap instead.

## 2. Build the frontend (local)

```bash
# project root
npm install
```

Create `.env.production`:
```
VITE_API_URL=https://api.madrassatalfath.com/api
VITE_CSRF_URL=https://api.madrassatalfath.com/sanctum/csrf-cookie
VITE_APP_NAME=Madrasatul Fathi School
VITE_APP_VERSION=1.0.0
```

```bash
npm run build     # produces dist/
```
Keep the **contents** of `dist/` for upload.

## 3. Backend prep (local, optional)

```bash
cd school-backend
cp .env.production.example .env   # fill values from section 6
```
The `.env` is confidential — recreate it on the server, do not share/commit it.

## 4. Database (cPanel → MySQL Databases)

- Create DB (e.g. `madrassa_school`) and user (e.g. `madrassa_user`) with a strong password.
- Add user to DB → **ALL PRIVILEGES**.
- Note the **real prefixed names** (`youruser_madrassa_school`, `youruser_madrassa_user`) for `.env`.

## 5. Upload (cPanel → File Manager)

```
public_html/
├── index.html            <- from dist/ (frontend)
├── .htaccess             <- SPA fallback (below)
├── assets/...
└── api/                  <- contents of school-backend/ (backend)
    └── public/           <- API document root
```

`public_html/.htaccess` (SPA fallback so deep links refresh correctly):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 6. Subdomain + document root (cPanel → Domains)

- Create `api.madrassatalfath.com`.
- Document root: **`public_html/api/public`** (never `public_html/api`).
- Permissions:
  ```bash
  chmod -R 755 storage bootstrap/cache
  chmod -R 775 storage/framework storage/logs bootstrap/cache
  ```

## 7. `.env` (create inside `public_html/api/`)

```
APP_NAME="Madrasatul Fathi School"
APP_ENV=production
APP_KEY=<run: php artisan key:generate>
APP_DEBUG=false
APP_URL=https://api.madrassatalfath.com
FRONTEND_URL=https://madrassatalfath.com

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=youruser_madrassa_school
DB_USERNAME=youruser_madrassa_user
DB_PASSWORD=<strong>

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.madrassatalfath.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

SANCTUM_STATEFUL_DOMAINS=madrassatalfath.com
SANCTUM_EXPIRATION=60
CORS_ALLOWED_ORIGINS=https://madrassatalfath.com

CACHE_STORE=database
QUEUE_CONNECTION=sync

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=alfathweb2020@gmail.com
MAIL_PASSWORD=<Gmail App Password>
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=alfathweb2020@gmail.com
MAIL_FROM_NAME="Madrasatul Fathi School"
```

Critical: `SESSION_DOMAIN` = `.madrassatalfath.com` (dot-prefixed) · `SANCTUM_STATEFUL_DOMAINS` = `madrassatalfath.com` (no scheme) · `CORS_ALLOWED_ORIGINS` = `https://madrassatalfath.com` · `APP_DEBUG=false`.

## 8. Install, migrate, seed, cache (cPanel → Terminal)

```bash
cd ~/public_html/api
cp .env.production.example .env     # or upload your prepared .env
php artisan key:generate --force    # set the APP_KEY
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
php artisan migrate --force
php artisan db:seed --force         # classes + subjects (+ demo accounts!)
php artisan storage:link
php artisan optimize                # config/route/view cache
```

> ⚠️ `db:seed` creates `admin@madrasatulfathi.com`, `teacher@…`, `parent@…`, `student@…` with password `password123` and a `demo@example.com` admin. **Change all passwords immediately** before sharing the URL.

## 9. SSL

- cPanel → **SSL/TLS Status** or AutoSSL/Let's Encrypt for `madrassatalfath.com` and `api.madrassatalfath.com`.
- (Optional) force HTTPS on the API — add to `public_html/api/public/.htaccess` above Laravel's rules:
  ```apache
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  ```

## 10. SMPT / Gmail note

- Gmail SMTP needs an **App Password** (Google Account → Security → 2-Step Verification → App passwords), not the account password.
- Automated app mail can land in **Spam** — recipients should mark "Report not spam"; consider Brevo/Resend later for fancier deliverability.

## 11. Verify

- [ ] `https://api.madrassatalfath.com/up` → `{"status":"OK"}`
- [ ] `https://madrassatalfath.com` renders; refresh a deep link (/login, /admissions) works
- [ ] Admin login → dashboard loads (cookie + CORS + session all tested)
- [ ] Approve a registration → parent email arrives
- [ ] Contact reply → email arrives
- [ ] Forgot password → reset link arrives, points at `https://madrassatalfath.com/accept-invite/...`
- [ ] Logout clears the session
- [ ] `APP_DEBUG` is `false`, no Laravel exception page on bad requests

## 12. Maintenance

```bash
cd ~/public_html/api
composer update && php artisan migrate --force && php artisan optimize:clear && php artisan optimize
```
- Frontend: rebuild locally and re-upload `dist/` contents.
- Backups: cPanel database + home backup, run frequently.
- Logs: `public_html/api/storage/logs/laravel.log`.