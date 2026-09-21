# Hosting Guide — Madrassat Al Fath School Management System

This guide explains exactly how to host the project (Laravel 12 backend + React/Vite frontend), what must be done **before** hosting, where to host it easily, and the exact steps to go live.

---

## 1. Is the project ready to host?

**Yes, with a short checklist.** The code is structured and configured for production:

| Part       | Status / requirement                                            |
|------------|-----------------------------------------------------------------|
| Frontend   | React 18 + Vite. `npm run build` works and produces `dist/`.     |
| Backend    | Laravel 12, PHP `^8.2`, MySQL, Sanctum SPA (cookie) auth.        |
| Sessions   | `SESSION_DRIVER=database` — session table migration is present.  |
| Cache/Queue| database driver — cache + jobs table migrations are present.     |
| Email      | SMTP configurable via `.env` (used for registration approval, contact replies, password reset). |
| Files      | No upload storage is required (avatars are stored in the DB as base64). `storage:link` optional. |
| Cron       | No scheduled tasks are required.                                 |
| Queue worker | Not required (emails are sent synchronously).                   |

### ⚠️ Things that MUST be done before going live (do them first)
1. **Generate a real `APP_KEY`** for the backend (never use the local one).
2. **Put real secrets in `.env`** — database password, SMTP credentials, app URLs.
3. **Create the production database** and run migrations.
4. **Give the admin account a strong password** (the seeder uses `password123` — do NOT seed demo accounts on a live server).
5. **Use HTTPS everywhere** — cookie auth requires `SESSION_SECURE_COOKIE=true`, which only works over HTTPS.
6. **Frontend must point to the real API** via `VITE_API_URL` + `VITE_CSRF_URL` before building.

---

## 2. What you need before hosting

### Domain name
- One domain, e.g. `myschool.com`
- Use two subdomains:
  - `app.myschool.com` → the website (React SPA)
  - `api.myschool.com`  → the Laravel API
  - (Both must be under the SAME root domain so the session cookie works across them.)

### Hosting account with these minimums
- **PHP 8.2 or 8.3** (Laravel 12 requires ^8.2)
- **MySQL** (or MariaDB) — one database + one user
- **Node.js 20+** on the machine (only needed to build the frontend)
- **Composer** (to install backend dependencies)
- **SSL certificate** (free Let's Encrypt is fine)
- SMTP mailbox/credentials for sending emails (any provider: Gmail app password, Zoho, Mailgun, SendGrid, host's own mail)

### Project files
- Everything inside this folder. Deploy:
  - Backend: the `school-backend/` folder → the PHP host
  - Frontend: the built `dist/` folder (from `npm run build`) → the web host

---

## 3. Where to host it easily (recommendations)

Pick ONE path below. All are beginner-friendly.

| Option | Best for | Cost | Notes |
|--------|----------|------|-------|
| **A. Shared hosting (cPanel)** — Hostinger, Namecheap, A2 Hosting, HostGator | Easy setup, everything in one place (PHP + MySQL + SSL + email) | ~$2–6/mo | Recommended for this project |
| **B. Frontend free (Vercel/Netlify/Cloudflare) + backend on Render/Railway** | Free tiers, modern workflow | ~$0–5/mo | Requires a bit more config; use if you want free hosting |
| **C. Cloud VPS** — DigitalOcean, Vultr, Hetzner | Full control, larger scale | ~$6–20/mo | Needs Linux admin skills |

> **Recommendation for this project:** **Option A (Hostinger shared hosting)** because it gives you PHP + MySQL + free SSL + email in one control panel, which matches this stack perfectly. Use Hostinger, Namecheap, or A2.

---

## 4. Option A — Step-by-step (Shared hosting / cPanel) — Recommended

### Before you start
Do this and you have: domain, hosting bought, DNS pointing, SSL active.

### Step 1: Build the frontend (on your computer)
```bash
cd /path/to/project
npm install
# create file: .env.production  (see section 6 for contents)
npm run build
```
This creates a `dist/` folder. Keep it — you will upload it.

### Step 2: Prepare the backend `.env`
1. Copy `school-backend/.env.production.example` → `school-backend/.env`.
2. Fill in real values (see section 6).
3. Then run on your computer (if PHP+Composer installed):
```bash
cd school-backend
composer install --no-dev --optimize-autoloader
php artisan key:generate
```
Copy down the generated `APP_KEY` value (or upload `.env` as-is; keep APP_KEY generated).

Skip Step 3 below if your host's installer generates a key; otherwise keep the key you made.

### Step 3: Upload to the host
Via cPanel → **File Manager** (or FTP/SSH):

1. Create these folders under your domain root (e.g. `public_html`):
   - `public_html/app`  → frontend
   - `public_html/api`  → backend
2. Upload and extract:
   - **Frontend** (`dist/` contents — the files INSIDE dist, not the folder) → into `public_html/app/`
   - **Backend** (the whole `school-backend/` contents) → into `public_html/api/`

Your structure should look like:
```
public_html/
├── app/                     # React build
│   ├── index.html
│   └── assets/...
└── api/                     # Laravel
    ├── app/...
    ├── public/              # <-- this is the web root for the API
    ├── artisan
    ├── ...
```

### Step 4: Create the MySQL database
In cPanel → **MySQL Databases**:
1. Create a database (e.g. `school_db`).
2. Create a user (e.g. `school_user`) + strong password.
3. Add the user to the database with **ALL PRIVILEGES**.
4. Put these exact names/password into `api/.env` (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).

### Step 5: Point the API web root to Laravel's `public/`
**Important:** Laravel must be served from `api/public/`, never from `api/`.
- If using a subdomain `api.myschool.com` → set its document root to `public_html/api/public`.
- If cPanel shows you as a subdomain user whose root already is `public_html`, you may need to create `public_html/api` as a **subdomain or alias** pointing to `api/public`. If that's not possible, instead rename `api/public` → `api/public_html` and serve the subdomain from there. The goal is files like `api/index.php` being the entry.

### Step 6: Point the app domain at the React build
- Subdomain `app.myschool.com` → document root `public_html/app`.
- Upload an `.htaccess` in `public_html/app/` so all routes return `index.html` (SPA fallback). Create the file with this content:
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

### Step 7: Run migrations
In cPanel → **Terminal** (or SSH):
```bash
cd public_html/api
php artisan migrate --force
php artisan config:cache route:cache view:cache
php artisan optimize
```
If no Terminal is available, many shared hosts run migrations via a small one-time script URL or ask support to run it. Some hosts (Hostinger) offer an "Artisan GUI" / SSH Terminal.

### Step 8: Enable SSL (free)
- cPanel → **SSL/TLS Status** → secure both `app.myschool.com` and `api.myschool.com` (usually AutoSSL/Let's Encrypt).
- Keep `APP_URL`, `FRONTEND_URL` and both `VITE_*` values prefixed with `https://`.

### Step 9: Test
Follow the checklist in section 8.

---

## 5. Option B — Step-by-step (Vercel frontend + Render backend)

Use for the free tier / modern setup.

### Backend on Render.com
1. Create account → **New + → Web Service**.
2. Connect your Git repo, or drag the `school-backend/` folder.
3. Settings:
   - Runtime: **PHP**
   - Build command: `composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader && cp .env.production.example .env`
   - Start command: `php artisan serve --host=0.0.0.0 --port=$PORT`
4. Add a **MySQL**: **New + → Database → MySQL** (Render creates DB automatically).
5. Environment variables (in Render dashboard):
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=<paste generated key>
   APP_URL=https://api.yourrenderhost.onrender.com
   FRONTEND_URL=https://app.vercel.app
   DB_CONNECTION=mysql
   DB_DATABASE=<from Render>
   DB_USERNAME=<from Render>
   DB_PASSWORD=<from Render>
   DB_HOST=<from Render>
   DB_PORT=3306
   SESSION_DRIVER=database
   SESSION_SECURE_COOKIE=true
   SESSION_DOMAIN=vercel.app
   SANCTUM_STATEFUL_DOMAINS=app.vercel.app
   CORS_ALLOWED_ORIGINS=https://app.vercel.app
   CACHE_STORE=database
   QUEUE_CONNECTION=sync
   MAIL_MAILER=smtp
   MAIL_HOST=...
   MAIL_PORT=587
   MAIL_USERNAME=...
   MAIL_PASSWORD=...
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS=no-reply@myschool.com
   MAIL_FROM_NAME="Madrassat Al Fath"
   ```
6. In **Shell** tab run: `php artisan key:generate`, `php artisan migrate --force`, `php artisan config:cache`.
7. Make sure the service responds on `/up`.

### Frontend on Vercel
1. Push the frontend to a Git repo.
2. Import to Vercel → framework **Vite**.
3. Environment variables: `VITE_API_URL=https://api.yourrenderhost.onrender.com/api`, `VITE_CSRF_URL=https://api.yourrenderhost.onrender.com/sanctum/csrf-cookie`.
4. Vercel auto-buils `dist/` and handles SPA fallback automatically.
5. Deploy.

> ⚠️ Cookie auth across two different providers only works reliably because both share `SESSION_DOMAIN` (=`.vercel.app`) and the API is configured as stateful for that origin. Ideally keep API + app under the same domain for zero-friction cookies.

---

## 6. The exact environment files to create

### 6a. Frontend → create `.env.production` (in project root)
```
VITE_API_URL=https://api.myschool.com/api
VITE_CSRF_URL=https://api.myschool.com/sanctum/csrf-cookie
VITE_APP_NAME=Madrasatul Fathi School
VITE_APP_VERSION=1.0.0
```
Then run `npm run build` so these values are baked into `dist/`.

### 6b. Backend → `school-backend/.env` (production values)
```
APP_NAME="Madrasatul Fathi School"
APP_ENV=production
APP_KEY=<RUN: php artisan key:generate>
APP_DEBUG=false
APP_URL=https://api.myschool.com
FRONTEND_URL=https://app.myschool.com

LOG_CHANNEL=stack
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=school_db
DB_USERNAME=school_user
DB_PASSWORD=REPLACE_WITH_STRONG_PASSWORD

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=.myschool.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

SANCTUM_STATEFUL_DOMAINS=app.myschool.com
SANCTUM_EXPIRATION=60
CORS_ALLOWED_ORIGINS=https://app.myschool.com

CACHE_STORE=database
QUEUE_CONNECTION=database

MAIL_MAILER=smtp
MAIL_HOST=smtp.myschool.com
MAIL_PORT=587
MAIL_USERNAME=REPLACE_WITH_SMTP_USERNAME
MAIL_PASSWORD=REPLACE_WITH_SMTP_PASSWORD
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@myschool.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Critical lines to double-check before going live:**
- `SESSION_DOMAIN` starts with a dot and is the **root domain** (`.myschool.com`) so the cookie is shared between `app.` and `api.`.
- `SANCTUM_STATEFUL_DOMAINS` = the frontend host (no scheme, no trailing slash): `app.myschool.com`.
- `CORS_ALLOWED_ORIGINS` = the full frontend URL: `https://app.myschool.com`.
- `APP_DEBUG=false` — never ship with `true`.
- `SESSION_SECURE_COOKIE=true` — this requires HTTPS on both subdomains.

---

## 7. Before-hosting checklist (summary)

- [ ] Domain purchased, DNS points to host
- [ ] Phone/email verified on host
- [ ] PHP 8.2+ enabled
- [ ] MySQL database + user created (strong password)
- [ ] SMTP credentials usable (you can send a test email)
- [ ] Backend `.env` filled (APP_KEY generated, debug off, real DB + SMTP)
- [ ] Frontend `.env.production` created and `npm run build` run
- [ ] Admin password not `password123` (change it in Settings, or create a fresh admin after migrate)
- [ ] SSL certificates active on both subdomains
- [ ] `php artisan migrate --force` completed
- [ ] Laravel served from `public/` (never expose `app/` or `.env`)

---

## 8. After-hosting test checklist

Run these in a normal browser (not localhost):

1. **Open** `https://app.myschool.com` → homepage loads, images/styles OK.
2. **Register** a new account → form validates.
3. **Login** as admin → dashboard loads (not blank).
4. **Admin pages** → Users, Classes, Subjects, Registrations, Payments, Announcements all open without 500 errors.
5. **Approve a registration** → the student account is created; the approval email arrives in the inbox.
6. **Submit a payment** (parent) → it appears under Pending Payments; approving it marks the student paid in Registrations.
7. **Mark a paid+approved student** → shows green **Paid** badge with full student/parent details.
8. **Contact form** reply → email sent.
9. **Forgot password** → reset email arrives.
10. **Logout** works and session clears.
11. Check `https://api.myschool.com/api/classes` without a token → 401 (auth protected), not a Laravel error page.

---

## 9. Post-launch maintenance

- **Backups** — enable daily automated DB backups in your host (cPanel → Backup, or Render → Database → Backups). Download a backup frequently.
- **SSL expiry** — AutoSSL renews automatically; verify monthly.
- **Updates** — keep Laravel and dependencies updated:
  ```bash
  composer update
  php artisan migrate --force
  ```
- **Logs** — check `school-backend/storage/logs/laravel.log` if a page fails.
- **Security** — never commit `.env`; keep `APP_DEBUG=false`; use HTTPS only; change admin password regularly.

---

*End of guide. If you hit any step, the two most common causes are (1) `SESSION_DOMAIN`/`SANCTUM_STATEFUL_DOMAINS` values not matching your exact domain, and (2) the API web root pointing at `api/` instead of `api/public/`.*