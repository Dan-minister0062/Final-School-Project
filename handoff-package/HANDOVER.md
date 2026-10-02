# Deployment Handover — madrassatalfath.com

Migration package for moving the school portal off `server230.web-hosting.com`, where
cPanel has domain entries but no generated Apache vhost config. The files and database
are correct; only the hosting layer was broken.

## Contents

| File | Purpose |
| --- | --- |
| `api.zip` | Laravel 12 backend, production `vendor/` included, no `.env`, no dev dependencies |
| `frontend.zip` | Built React/Vite static site (SPA), includes `.htaccess` |
| `HANDOVER.md` | This runbook |
| `verify.sh` | Post-deploy verification script |

## Requirements for the new host

- PHP **8.2+** with `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `fileinfo`, `curl`, `intl`, `zip`
- MySQL 5.7+ / MariaDB 10.4+
- Apache with `mod_rewrite` and `AllowOverride All`
- Composer is **not** required — `vendor/` is bundled

## Step 1 — point DNS

At the new registrar, set:

```
A     @      <new server IP>
CNAME www    madrassatalfath.com
A     api    <new server IP>
```

Leave MX records alone unless mail is migrating too. If the old host keeps serving
`autoconfig`/`autodiscover`, either repoint or delete those records — they currently
reference a dead server (`198.54.116.177`).

## Step 2 — create the database

```sql
CREATE DATABASE newdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'newuser'@'localhost' IDENTIFIED BY 'a-long-random-password';
GRANT ALL PRIVILEGES ON newdb.* TO 'newuser'@'localhost';
FLUSH PRIVILEGES;
```

## Step 3 — import the schema and data

From the old host's phpMyAdmin: **Export → Quick → SQL**, then import here. Alternatively
use the CLI:

```bash
mysql -u newuser -p newdb < export.sql
```

There are 33 migrations and 25 tables. The schema is current — all migrations are applied,
so `php artisan migrate` should report nothing to do after import.

## Step 4 — deploy the API

Extract `api.zip` into the API application directory, then set the document root to the
`public/` subfolder. **Do not point the document root at the application root** — that
exposes `.env`.

```bash
cd ~/api.madrassatalfath.com
unzip api.zip
cp .env.example .env
php artisan key:generate
```

Edit `.env` — the values that matter:

```dotenv
APP_NAME=Alfath
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.madrassatalfath.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=newdb
DB_USERNAME=newuser
DB_PASSWORD=a-long-random-password

FRONTEND_URL=https://madrassatalfath.com

SESSION_DOMAIN=api.madrassatalfath.com
SANCTUM_STATEFUL_DOMAINS=madrassatalfath.com,www.madrassatalfath.com

MAIL_MAILER=log
CACHE_STORE=database
QUEUE_CONNECTION=database
```

`MAIL_MAILER=log` is intentional — email writes to the log instead of sending. Configure
real SMTP once you have credentials.

Verify the connection before anything else:

```bash
php artisan config:clear
php artisan db:show
```

`db:show` listing your tables confirms the database credentials are correct. If it errors,
check `DB_*` values — a stale config cache is the usual culprit, and `config:clear` fixes it.

## Step 5 — permissions

```bash
cd ~/api.madrassatalfath.com
chmod 640 .env
chmod -R ug+rwx storage bootstrap/cache
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
```

`.env` must never be world-readable. It holds the database password and `APP_KEY`.

## Step 6 — deploy the frontend

Extract `frontend.zip` contents **into the document root** (not a subfolder). The archive
contains `index.html`, `assets/`, and `.htaccess` at its root.

The `.htaccess` is required. Without it, deep links like `/login` and `/admissions` return
404 on refresh, because the server looks for real files that don't exist in a SPA. It
rewrites all unmatched paths to `index.html` and blocks `/api` and dotfiles.

```bash
cd ~/public_html
unzip frontend.zip
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
```

Confirm the API URL baked into the bundle points at the new host:

```bash
grep -o 'https://api\.[a-z0-9.-]*' assets/index-*.js | sort -u
```

## Step 7 — seed reference data

Idempotent — safe to re-run. Seeds 26 classes and 11 subjects, no user accounts.

```bash
php artisan db:seed --force
```

## Step 8 — create the first admin

```bash
php artisan school:create-admin
```

Interactive. It creates the account or promotes an existing one, and revokes that user's
active sessions so a password change takes effect immediately.

## Step 9 — cache and verify

```bash
php artisan optimize
```

Then run `verify.sh` (see below).

## Step 10 — SSL

Issue the certificate **last**, after the site is confirmed serving over HTTP. CAs validate
over HTTP; a domain serving a placeholder cannot be validated. This is exactly why two
Namecheap orders sat in `pending` on the old host.

Use the host's AutoSSL or Let's Encrypt, then turn on force-HTTPS redirect. Verify the
certificate chain properly — a `200` response obtained with `curl -k` proves nothing about
hostname validity.

## verify.sh

```bash
IP=<new server IP>

echo "--- frontend vhost ---"
curl -s -o /dev/null -w "apex /          %{http_code}\n" -H "Host: madrassatalfath.com" http://$IP/
curl -s -o /dev/null -w "apex /login     %{http_code}\n" -H "Host: madrassatalfath.com" http://$IP/login
curl -s -o /dev/null -w "apex /admissions %{http_code}\n" -H "Host: madrassatalfath.com" http://$IP/admissions

echo "--- api vhost ---"
curl -s -o /dev/null -w "api /up         %{http_code}\n" -H "Host: api.madrassatalfath.com" http://$IP/up
curl -s -o /dev/null -w "api /api/classes %{http_code}\n" -H "Host: api.madrassatalfath.com" http://$IP/api/classes

echo "--- is it really the React app? (not a cPanel placeholder) ---"
curl -s -H "Host: madrassatalfath.com" http://$IP/ | head -c 120; echo

echo "--- classes payload ---"
curl -s -H "Host: api.madrassatalfath.com" http://$IP/api/classes | head -c 200; echo

echo "--- protection (must be 403/404, never 200) ---"
curl -s -o /dev/null -w "apex /.env   %{http_code}\n" -H "Host: madrassatalfath.com" http://$IP/.env
curl -s -o /dev/null -w "apex /vendor %{http_code}\n" -H "Host: madrassatalfath.com" http://$IP/vendor
curl -s -o /dev/null -w "api via apex %{http_code}\n" -H "Host: madrassatalfath.com" http://$IP/up

echo "--- TLS (subject must match; must NOT be *.web-hosting.com) ---"
echo | openssl s_client -connect $IP:443 -servername madrassatalfath.com 2>/dev/null \
  | grep -E "^subject=|Verify return code"
echo | openssl s_client -connect $IP:443 -servername api.madrassatalfath.com 2>/dev/null \
  | grep -E "^subject=|Verify return code"
```

### Expected results

| Check | Expected |
| --- | --- |
| `apex /` | `200` |
| `apex /login`, `/admissions` | `200` — proves the SPA rewrite works |
| `api /up` | `200` — proves Laravel boots |
| `api /api/classes` | `200` with JSON |
| `apex /.env`, `/vendor`, `api via apex` | `403` or `404`, never `200` |
| TLS subject | `CN=madrassatalfath.com` |
| `Verify return code` | `0 (ok)` |

A `/` returning `200` is not sufficient on its own — a cPanel placeholder also returns
`200`. The body check is what distinguishes a real deploy from a default page.

## User accounts and roles

26 users exist in the database: 10 students, 8 parents, 4 admins, 4 teachers.

The `status` column is `varchar(20)` and legacy rows may be `NULL` or empty. Login treats
`NULL` and empty as active; `pending` and any other value are blocked. New self-registrations
are always created as `pending` and require admin approval. Public registration only
accepts `teacher`, `parent`, or `student` — `admin` is rejected at validation, so nobody
can self-register into an admin role.

Audit the 4 existing admin accounts before going live:

```sql
SELECT id, name, email, role, status FROM users WHERE role = 'admin';
SELECT status, COUNT(*) FROM users GROUP BY status;
```

## Security notes

Credentials used during the original deployment must be treated as exposed and rotated:

- The cPanel and FTP password for the `madrlckj` account
- A Gmail app password that was stored in `.env` (mailer is set to `log`, so it is not
  actively used — revoke it anyway)
- A cPanel API token, which has been revoked

`HOSTING.md` in the repository root contains a real email address. Remove or replace it if
the repository is ever made public.

## What's already been fixed in this codebase

- Public registration rejects the `admin` role; new accounts are `pending` pending approval
- Login accepts legacy `NULL`/empty `status` while still blocking `pending` and other values
- `public/.htaccess` restricts the API to `api.madrassatalfath.com` (with optional port) and
  blocks dotfiles
- The frontend `.htaccess` blocks `/api` so the API is only reachable on its own hostname
- `school:create-admin` command for bootstrapping and password resets
- Seeders use `firstOrCreate`/`updateOrCreate`, so re-running is safe
