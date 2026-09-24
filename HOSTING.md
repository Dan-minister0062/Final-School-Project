# Hosting Guide — Madrassat Al Fath School Management System

Target setup: **cPanel shared hosting · PHP 8.2+ · MySQL · React (Vite) SPA + Laravel 12 API**
Domain: **madrassatalfath.com** (registered at Namecheap)

Recommended architecture — two hosts under the SAME root domain so the login cookie is shared:

| URL                          | What runs there          |
|------------------------------|--------------------------|
| `https://madrassatalfath.com`        | React SPA (the website) |
| `https://api.madrassatalfath.com`    | Laravel 12 API          |

> Why two subdomains? The frontend and the API use a session **cookie** (Sanctum SPA auth). Cookies can only be shared when both apps live under one root domain — exactly what `madrassatalfath.com` + `api.madrassatalfath.com` give you.

---

## 1. What the project needs (verified)

| Component  | Requirement                                                                        |
|------------|-------------------------------------------------------------------------------------|
| PHP        | **8.2 or 8.3** (Laravel 12 requires `^8.2`)                                        |
| MySQL      | One database + one user                                                             |
| Node.js    | **20.19+ or 22.12+** (Vite 7 requirement) — only needed to *build* the frontend      |
| Composer   | Only needed to *install* Laravel dependencies                                       |
| Extensions | `pdo_mysql`, `mbstring`, `xml`, `ctype`, `json`, `tokenizer`, `openssl`, `curl`, `fileinfo`, `intl`, `zip` (zip = composer) |
| SSL        | Free AutoSSL / Let's Encrypt on BOTH subdomains (required for login cookies)        |
| Email      | Any SMTP account (Gmail App Password, or the host's mail)                           |

No cron jobs and no queue worker are required — **all emails are sent synchronously** (admission receipt, approval/rejection, contact replies, password reset).

---

## 2. Step 0 — DNS: make Namecheap point at your host

1. Buy hosting that includes **cPanel** (the domain is already at Namecheap).
2. In cPanel, copy your **IP address** (e.g. `162.0.200.77`).
3. In **Namecheap → Domain List → madrassatalfath.com → Advanced DNS**:
   - `A Record  @   →  <your cPanel IP>`
   - `A Record  api →  <your cPanel IP>`  (or `CNAME api → @`)
4. DNS propagates in a few minutes to a few hours. Verify with https://dnschecker.org.

> If your cPanel host uses **different nameservers** (not Namecheap), instead change the domain's nameservers on Namecheap to the host's nameservers (e.g. `ns1.host.com`, `ns2.host.com`).

---

## 3. Step 1 — Build the frontend (on your computer)

```bash
cd C:\xampp\htdocs\Final-School-Project\Final-School-Project
npm install
```

Create `.env.production` in the project root (same folder as `package.json`):

```
VITE_API_URL=https://api.madrassatalfath.com/api
VITE_CSRF_URL=https://api.madrassatalfath.com/sanctum/csrf-cookie
VITE_APP_NAME=Madrasatul Fathi School
VITE_APP_VERSION=1.0.0
```

Then build:

```bash
npm run build
```

This creates the **`dist/`** folder. Upload **the contents of `dist/`** (the `index.html` + `assets/` inside it), not the `dist/` folder itself.

---

## 4. Step 2 — Prepare the backend

Copy `school-backend/.env.production.example` to `school-backend/.env` and fill it with the real values (section 6 has the exact final file). The `.env` is **never** uploaded if you can avoid it — it must contain your secrets, and Composer/Artisan on the server will read it from `school-backend/.env`.

Recommended: upload the project **without** `.env`, then create `.env` on the server in cPanel → File Manager → `public_html/api/`, and generate the key with the Terminal:

```bash
cd ~/public_html/api
cp .env.production.example .env
php artisan key:generate
```

---

## 5. Step 3 — Create the MySQL database (cPanel)

1. cPanel → **MySQL® Databases**.
2. Create a database, e.g. `madrassa_school`. cPanel prefixes it with your account username — the real name becomes `youruser_madrassa_school`.
3. Create a user, e.g. `madrassa_user` → real name `youruser_madrassa_user`, with a strong password copied into `.env`.
4. **Add user to database** → grant **ALL PRIVILEGES**.
5. Put the *real* prefixed names into `.env`:

```
DB_DATABASE=youruser_madrassa_school
DB_USERNAME=youruser_madrassa_user
DB_PASSWORD=<strong password>
DB_HOST=localhost
DB_PORT=3306
```

---

## 6. Step 4 — Upload the files

In cPanel → **File Manager**:

1. **Frontend** → upload the contents of `dist/` into **`public_html/`** (the main domain root). Result:
   ```
   public_html/
   ├── index.html          <- React app
   ├── .htaccess           <- SPA fallback (create, see below)
   └── assets/...
   ```

   Create **`public_html/.htaccess`** with this exact content so React's client-side routes work on refresh:
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

2. **Backend** → upload the **contents of `school-backend/`** into **`public_html/api/`**:
   ```
   public_html/
   ├── index.html              # React SPA
   ├── .htaccess
   ├── assets/...
   └── api/                    # Laravel
       ├── app/  bootstrap/  config/  database/  public/  resources/  routes/  storage/  vendor/  artisan  composer.json  .env
   ```

3. **Create the API subdomain** → cPanel → **Domains → Create A New Domain**:
   - Subdomain: `api.madrassatalfath.com`
   - Document root: `public_html/api/public`   ← **must point to Laravel's `public/`, never `api/` itself**

   This is the single most common mistake. The API must be served from `.../api/public` so `.env` and source code stay out of the web root.

4. **Set permissions** (cPanel → File Manager → select → Permissions, or Terminal):
   ```
   chmod -R 755 storage bootstrap/cache
   chmod -R 775 storage/framework storage/logs bootstrap/cache
   ```

---

## 7. Step 5 — Install backend dependencies & migrate (server Terminal)

cPanel → **Terminal** (or SSH). Most Composer packages are pure PHP, but run Composer **on the server** for correctness:

```bash
cd ~/public_html/api
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

php artisan migrate --force
php artisan db:seed --force          # creates classes + subjects (LOAD)
php artisan storage:link
php artisan optimize                 # config:cache + route:cache + view:cache
```

> **`db:seed` creates demo accounts with password `password123`** (`admin@madrasatulfathi.com`, `teacher@...`, `parent@...`, `student@...`). Log in and change every password BEFORE telling anyone the URL, or delete `demo@example.com`.

> No Terminal? Two options: (a) ask the host to enable Terminal/SSH (shared hosts usually offer it), or (b) upload the project with a locally-built `vendor` (Linux-agnostic for this stack) and run migrations via a single-use temporary route — then delete it.

---

## 8. Step 6 — The exact production `.env`

### 8a. Frontend — `…/.env.production` (in project root, used at build time)
```
VITE_API_URL=https://api.madrassatalfath.com/api
VITE_CSRF_URL=https://api.madrassatalfath.com/sanctum/csrf-cookie
VITE_APP_NAME=Madrasatul Fathi School
VITE_APP_VERSION=1.0.0
```

### 8b. Backend — `school-backend/.env` (on the server)
```
APP_NAME="Madrasatul Fathi School"
APP_ENV=production
APP_KEY=<generated by: php artisan key:generate>
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
DB_PASSWORD=<your strong DB password>

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

**The four lines that make login work across the two domains — get them exactly right:**
- `SESSION_DOMAIN=.madrassatalfath.com` — leading dot, root domain (cookie shared by `madrassatalfath.com` and `api.madrassatalfath.com`).
- `SANCTUM_STATEFUL_DOMAINS=madrassatalfath.com` — hostname only, no `https://`, no trailslash.
- `CORS_ALLOWED_ORIGINS=https://madrassatalfath.com` — full origin, matches the browser exactly.
- `SESSION_SECURE_COOKIE=true` — only after HTTPS is active on both.

**Security notes:**
- `APP_DEBUG=false` — never ship `true`.
- The backend `.env` is outside the web root (`public_html/api/public`) so it cannot be downloaded — do not move it into `public/`.
- Never commit `school-backend/.env` to git (the `.gitignore` already excludes it).

---

## 9. Step 7 — Enable HTTPS

- cPanel → **SSL/TLS Status** (or AutoSSL / Let's Encrypt via `Install` on the domain/subdomain).
- Secure **both** `madrassatalfath.com` and `api.madrassatalfath.com`, then:
- Optional: force HTTPS for the API by adding to `public_html/api/public/.htaccess`, above the Laravel rules:
  ```apache
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  ```
- Verify: https://madrassatalfath.com loads and https://api.madrassatalfath.com/up returns `{"status":"OK"}`.

---

## 10. Step 8 — Post-launch checklist

1. `https://madrassatalfath.com` → homepage renders with styles/images.
2. `https://api.madrassatalfath.com/up` → `OK`, not a Laravel error page.
3. **Login as admin** → dashboard loads, no blank screen (tests cookies + CORS + session).
4. Approve a registration → parent receives the email (check inbox + spam).
5. Contact form reply → sender receives the reply email.
6. Forgot password → reset link arrives and points at `https://madrassatalfath.com/accept-invite/…`.
7. Refresh any admin sub-page → still loads (SPA fallback works).
8. Logout → session clears.

---

## 11. Routine maintenance

- **Backups** — cPanel → Backup: full home directory + MySQL database, daily if possible.
- **Laravel updates**
  ```bash
  cd ~/public_html/api
  composer update
  php artisan migrate --force
  php artisan optimize:clear && php artisan optimize
  ```
- **Frontend rebuild** — change code → `npm run build` → re-upload `dist/` contents to `public_html/`.
- **Logs** — `public_html/api/storage/logs/laravel.log` when something 500s.
- **Renewal** — AutoSSL renews itself; verify monthly.

---

*End of guide. The most frequent issues are (1) `SESSION_DOMAIN`/`SANCTUM_STATEFUL_DOMAINS` not matching the exact domain, and (2) the API document root pointing at `api/` instead of `api/public`.*