# DEPLOYMENT.md — madrassatalfath.com (cPanel)

Ordered runbook for putting this project live on cPanel shared hosting.

> ## Status: blocked on DNS (verified 2026-09-26)
>
> **Done:** both archives uploaded and hash-verified; `.env` configured against
> `madrlckj_alfath`; all 33 migrations already applied (no migration required);
> API host guard live; frontend and API files byte-identical to local; no stray
> `.env` copies, archives, or `.git` on the server.
>
> **Blocker 1 — DNS points at the wrong server.** `madrassatalfath.com`, `www` and
> `api` all resolve to `198.54.116.177`, the old server. It serves a frontend-only
> copy and **no API**, so the public site is broken. The database and the API live on
> `198.54.114.177`. Re-point all three A records to `198.54.114.177`.
>
> **Blocker 2 — no SSL has ever been issued.** Both servers present the host's generic
> `CN=*.web-hosting.com` Sectigo certificate, which fails hostname verification for
> this domain. Browsers show a full-page warning.
>
> **Blocker 3 — cPanel has not activated the domains** on `198.54.114.177`. It serves
> cPanel's default page and returns 404 for `/login`, `/up` and `/api/classes`.
> Activation follows DNS automatically, then the document roots must be re-checked.

**Architecture**

| Host | Serves | cPanel document root |
| --- | --- | --- |
| `https://madrassatalfath.com` | React SPA (Vite build) | `/home/madrlckj/public_html` |
| `https://api.madrassatalfath.com` | Laravel 12 API | `/home/madrlckj/api.madrassatalfath.com/public` |

The API is a **subdomain with its own document root outside `public_html`**. The main
domain cannot reach the Laravel folder at all.

**Hosting account**

| Item | Value |
| --- | --- |
| cPanel | `https://server230.web-hosting.com/cpanel` |
| Username | `madrlckj` |
| Server IP | `198.54.114.177` |
| Home directory | `/home/madrlckj` |

> The previously used account `hamza123@...` on server `198.54.116.177` is a **different,
> inactive host**. Do not use it. Rotate that password, it was exposed.

---

## 0. What is already prepared

Two ready-to-upload archives live in `cpanel-upload/`:

| File | Size | Contents |
| --- | --- | --- |
| `madrassatalfath-frontend.zip` | 2.6 MB | `index.html`, `.htaccess`, `assets/` (11 files) |
| `madrassatalfath-api.zip` | 8.1 MB | Full Laravel app **including a production `vendor/`** (7,253 entries) |

Both were verified by extracting them and running the app:

- Laravel boots (`Laravel Framework 12.69.1`), all 34 migrations and both seeders run.
- Seeding produces **26 classes, 11 subjects, 0 users** — there are no demo accounts.
- No `.env`, no `node_modules`, no tests, no logs, no compiled caches, no SQLite file.
- Entry paths use forward slashes, so they unzip correctly on Linux.

Because `vendor/` is bundled, **you do not need Composer on the server.**

**Server requirements:** PHP **8.2+** (cPanel → MultiPHP Manager) with
`pdo_mysql mbstring xml ctype json tokenizer openssl curl fileinfo intl zip`, MySQL 5.7+/8.0,
and `.htaccess` support (`mod_rewrite`).

---

## 1. DNS — do this first

Nothing can be verified until the domain points at this server. Current state is wrong:

| Record | Currently | Should be |
| --- | --- | --- |
| `@` A | `159.198.67.235` | `198.54.114.177` |
| `api` A | does not resolve | `198.54.114.177` |
| NS | `pdns1/pdns2.registrar-servers.com` | **leave unchanged** |

> **Do NOT follow the nameserver instruction in the hosting welcome email.** It is wrong
> for this account. Querying `dns1.namecheaphosting.com` directly returns `198.54.116.177`
> for **both** `madrassatalfath.com` and `api.madrassatalfath.com` — the old, empty server.
> Changing to those nameservers would pin both domains to a host with nothing on it.

Namecheap is both the registrar and the DNS host, so **no nameserver change is needed**.
Just edit the records.

1. Namecheap → **Advanced DNS** → delete the `@` record pointing at `159.198.67.235`
2. Add:

   | Type | Host | Value | TTL |
   | --- | --- | --- | --- |
   | A | `@` | `198.54.114.177` | Automatic |
   | A | `www` | `198.54.114.177` | Automatic |
   | A | `api` | `198.54.114.177` | Automatic |

3. Leave the MX records untouched (they belong to Namecheap email).
4. Verify — both must return `198.54.114.177`, usually within 5–30 minutes:
   ```bash
   nslookup madrassatalfath.com 8.8.8.8
   nslookup api.madrassatalfath.com 8.8.8.8
   ```

Only if the A-record route is refused should you contact hosting support and ask for the
authoritative nameservers for cPanel account `madrlckj`.

> If SSL fails to issue, it is almost always because DNS is missing or still propagating.
> Fix DNS first, then retry SSL.

### Mail records — leave them alone

The domain's mail is **Namecheap**, not this cPanel server:

```
MX  5   mx1-hosting.jellyfish.systems
MX  10  mx2-hosting.jellyfish.systems
MX  20  mx3-hosting.jellyfish.systems
```

Do **not** change the MX records. See section 10 for the SMTP implications.

---

## 2. Database (cPanel → MySQL® Databases)

1. **Create a Database**, e.g. `madrassa`, and a **User**, e.g. `madrassauser`, with a
   strong random password.
2. Add the user to the database with **ALL PRIVILEGES**.
3. cPanel prefixes both with your account name, so the real values are:
   ```
   DB_DATABASE=madrlckj_madrassa
   DB_USERNAME=madrlckj_madrassauser
   ```
   Use the exact names cPanel shows you — never an unprefixed name.

---

## 3. Verify the domains (cPanel → Domains)

Both domains are already added:

| Domain | Document root | Verify it is exactly |
| --- | --- | --- |
| `madrassatalfath.com` | `/home/madrlckj/public_html` | same |
| `api.madrassatalfath.com` | `/home/madrlckj/api.madrassatalfath.com/public` | same |

Also add `www.madrassatalfath.com` as an alias of the main domain, because the frontend
build includes it in `SANCTUM_STATEFUL_DOMAINS` and `CORS_ALLOWED_ORIGINS`.

Before verifying, the vhosts only answer once DNS points here. After DNS propagates,
re-check the document roots and mark both domains as valid.

---

## 4. Upload the frontend (cPanel → File Manager)

1. Go to `/home/madrlckj/public_html`.
2. Upload `madrassatalfath-frontend.zip` and extract it there.
3. **Delete the ZIP afterwards** — it would otherwise be publicly downloadable.
4. Final layout:
   ```
   public_html/
   ├── .htaccess
   ├── index.html
   └── assets/
   ```
5. Confirm `index.html` is directly in `public_html`, not nested in `public_html/frontend/`.
6. **Delete any leftover `.git` directory** in `public_html` if one exists.

> **There is a second, identical frontend copy at `/home/madrlckj/www/`** (verified
> byte-for-byte identical: `index.html` `45B7643A…`, `.htaccess` `39D74E5B…`). Only one
> of these is the real document root. Two copies means two places to update on every
> future deploy, and a real risk of serving stale assets if they drift apart. Confirm
> which directory cPanel uses as the document root, then delete the other. A legacy
> `/home/madrlckj/madrassatalfath.com/hamza123/` folder from the previous account also
> remains and can be removed.

The bundled `.htaccess` serves the SPA, blocks dotfiles, and **blocks any request to
`/api`** on the main domain so API calls are never sent to the wrong host.

---

## 5. Upload the API (cPanel → File Manager)

1. Go to `/home/madrlckj/api.madrassatalfath.com`.
2. Upload `madrassatalfath-api.zip` and extract it there.
3. **Delete the ZIP afterwards.**
4. Final layout:
   ```
   api.madrassatalfath.com/
   ├── .htaccess            <- safety net, only applies if docroot is ever moved up
   ├── .env.production.example
   ├── artisan
   ├── app/  bootstrap/  config/  database/  public/  resources/  routes/  storage/  vendor/
   └── composer.json  composer.lock
   ```
5. Confirm `public/index.php` exists, and that the document root from section 3 points at
   that `public/` folder.

**Which `.htaccess` actually protects you:** the document root is `public/`, so Apache only
ever reads `public/.htaccess`. That file carries the host guard (403 for any host other
than `api.madrassatalfath.com`) and the dotfile block. The `.htaccess` in the parent
folder is never processed with this document root — it is only a fallback if the document
root is ever changed to the app root.

---

## 6. Create the API `.env` (cPanel → Terminal)

```bash
cd ~/api.madrassatalfath.com
cp .env.production.example .env
php artisan key:generate --force
nano .env          # or edit in cPanel File Manager → "Edit"
```

Only the lines marked below need changing; the rest of the template is already correct.

```dotenv
APP_NAME="Madrasatul Fathi School"
APP_ENV=production
APP_KEY=                        # filled in by key:generate
APP_DEBUG=false
APP_TIMEZONE=Africa/Casablanca
APP_URL=https://api.madrassatalfath.com
FRONTEND_URL=https://madrassatalfath.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=madrlckj_madrassa          # CHANGE
DB_USERNAME=madrlckj_madrassauser      # CHANGE
DB_PASSWORD=your-strong-password       # CHANGE

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_PATH=/
SESSION_DOMAIN=.madrassatalfath.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

SANCTUM_STATEFUL_DOMAINS=madrassatalfath.com,www.madrassatalfath.com
SANCTUM_EXPIRATION=60
CORS_ALLOWED_ORIGINS=https://madrassatalfath.com,https://www.madrassatalfath.com

CACHE_STORE=database
QUEUE_CONNECTION=sync

MAIL_MAILER=log                        # CHANGE until SMTP is configured
```

Notes that matter:

- `SESSION_DOMAIN` is **dot-prefixed** (`.madrassatalfath.com`) so cookies are shared
  across the apex and the subdomain.
- `SANCTUM_STATEFUL_DOMAINS` must have **no scheme and no trailing slash**;
  `CORS_ALLOWED_ORIGINS` needs `https://` but no trailing slash.
- `APP_DEBUG=false` in production. A Laravel error page means something is misconfigured.
- `SESSION_SECURE_COOKIE=true` means **login will not work over plain HTTP** — SSL is
  required, not optional.
- `.env` is confidential. Never commit it or paste it into chat.

### Mail: use `log` for now

Do **not** set `MAIL_HOST=mail.madrassatalfath.com`. That name resolves to
`198.54.116.177`, the old inactive server, and will refuse connections. Set
`MAIL_MAILER=log` and the app stays fully functional while mail goes to
`storage/logs/laravel.log`. Configure real SMTP in section 10 after launch.

---

## 7. Install, migrate, seed, create the admin (cPanel → Terminal)

```bash
cd ~/api.madrassatalfath.com

php artisan migrate --seed --force
php artisan school:create-admin
php artisan optimize
```

- `migrate --seed` creates the schema **and** the catalog (26 classes, 11 subjects).
  It creates **no user accounts**.
- Both seeders use `firstOrCreate`/`updateOrCreate`, so re-running `--seed` is safe and
  will **not** duplicate classes or subjects.
- `school:create-admin` prompts for name, email, and a hidden password (12+ characters).
  It creates the admin, or promotes/updates an existing account and revokes its sessions.
  Run it again any time you need to reset the admin password.
- `optimize` builds config, route, and view caches.

Composer is optional — only needed if you later change PHP dependencies:

```bash
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
```

### 7.1 Check account statuses before launch

Login requires `status = 'active'`. Accounts that predate the `status` column may hold
`NULL`, and the presenter already treats `NULL` as active — so the login check treats
`NULL` as active too, rather than locking legacy accounts out.

Confirm nothing is unintentionally blocked:

```bash
php artisan tinker --execute='foreach (DB::table("users")->select("status", DB::raw("COUNT(*) as n"))->groupBy("status")->get() as $r) { echo "[" . ($r->status ?? "NULL") . "] => " . $r->n . PHP_EOL; }'
```

Only `active` and `pending` (plus deliberately suspended values) are meaningful. Anything
unexpected should be corrected in phpMyAdmin before the site is public.

Audit the admin accounts too — confirm you know every one of their passwords:

```bash
php artisan tinker --execute='foreach (DB::table("users")->where("role","admin")->get(["id","name","email","status"]) as $u) { echo "#" . $u->id . "  " . $u->name . "  <" . $u->email . ">" . PHP_EOL; }'
```

---

## 8. Permissions

**Archives built on Windows store no Unix permissions, so extraction leaves everything
`777`/`666`. On shared hosting that means any other user on the server can rewrite your
PHP. Always run this after extracting:**

```bash
cd ~/api.madrassatalfath.com

find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;

# the only paths Laravel must be able to write
chmod -R ug+rwx storage bootstrap/cache

# keep secrets readable by the web user only
chmod 640 .env
```

For the frontend:

```bash
cd ~/public_html
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
```

Nothing in `app/`, `config/`, or `vendor/` needs to be writable.

---

## 9. Issue SSL (cPanel → SSL/TLS Status)

1. Issue AutoSSL or Let's Encrypt for **both** `madrassatalfath.com` and
   `api.madrassatalfath.com` (plus `www` if you added it).
2. Turn on **Force HTTPS Redirect** for both domains. Use the cPanel toggle instead of
   hand-editing `.htaccess`.
3. Confirm `https://` works before testing login — secure cookies need it.

---

## 10. Verify the launch

- [ ] `https://api.madrassatalfath.com/up` returns **HTTP 200**
- [ ] `https://api.madrassatalfath.com/api/classes` returns 200 JSON with 26 classes
- [ ] `https://madrassatalfath.com` renders the site over HTTPS (no mixed-content warnings)
- [ ] Refreshing a deep link such as `/login` or `/admissions` still loads the SPA
- [ ] Browser console shows **no CORS errors** and requests go to `api.madrassatalfath.com`
- [ ] Log in with the admin from section 7 and open the dashboard
- [ ] Register a test account → it is **not** logged in and shows as `pending`
- [ ] Approve that registration in the admin panel → it can then log in
- [ ] `APP_DEBUG=false` holds; no Laravel exception page on a bad URL
- [ ] `https://madrassatalfath.com/.env` and `/vendor/` return 404
- [ ] `https://api.madrassatalfath.com/api/classes` requested over plain HTTP is 403

---

## 11. Email (optional, after the site is live)

Mail is currently Namecheap (`*.jellyfish.systems`). Two workable routes:

**Keep Namecheap mail (simplest).** Use Namecheap's SMTP relay instead of the domain's
mail host:

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=mail.namecheap.com
MAIL_PORT=587
MAIL_USERNAME=your-full-mailbox-address
MAIL_PASSWORD=your-mailbox-password
MAIL_ENCRYPTION=tls
```

**Move to cPanel mail.** Create the mailbox in cPanel, switch the MX records to this
server, and fix the `mail.` A record (it still points at the dead old server
`198.54.116.177`). Only then is `MAIL_HOST=mail.madrassatalfath.com` correct.

Gmail is not a valid sender for this domain and will be rejected or land in spam. If you
use it for testing, `MAIL_HOST=smtp.gmail.com` and `MAIL_PASSWORD` must be a 16-character
**App Password**. Add SPF/DKIM either way.

Until mail is configured, `MAIL_MAILER=log` keeps the app working.

---

## 12. Updating later

**Frontend** — rebuild locally, then upload:

```bash
npm ci
npm run build
```

Upload the **contents** of `dist/` to `/home/madrlckj/public_html/` (replace `assets/`
and `index.html`, keep `.htaccess`), then re-run the frontend permission fix.

**Backend** — upload the changed files to `/home/madrlckj/api.madrassatalfath.com/`, then:

```bash
cd ~/api.madrassatalfath.com
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
```

**Database backups** — cPanel → phpMyAdmin → Export, or schedule backups in cPanel.

---

## 13. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| cPanel shows "server misconfigured" | Domain not validated yet — DNS is still pointing elsewhere (section 1) |
| SSL will not issue | DNS missing or still propagating (section 1) |
| DNS set but still parked | Nameservers are not this account's real DNS; contact hosting support (section 1) |
| `500` on the API | Read `~/api.madrassatalfath.com/storage/logs/laravel.log`; usually a wrong `DB_PASSWORD` or unprefixed `DB_DATABASE` |
| `403` from the API | Request arrived over the wrong host, or a dotfile was requested — the guard is working |
| `403` on a legitimate API call | Document root is wrong, or you edited `public/.htaccess` badly (section 5) |
| `419` / login loops | `SESSION_DOMAIN` missing the leading dot, or `SESSION_SECURE_COOKIE=true` while the site is still HTTP |
| CORS error in console | `CORS_ALLOWED_ORIGINS` must match the browser origin exactly, with scheme and no trailing slash |
| SPA 404s on refresh | `public_html/.htaccess` missing, or files nested one folder too deep |
| Blank page, blank console | API unreachable; confirm DNS and that the docroot is `api.madrassatalfath.com/public` |
| "Application key not set" | Run `php artisan key:generate --force` |
| Migration errors | Run `php artisan migrate --force` and read the **first** error, not the last |
| Emails never arrive | `MAIL_MAILER=log` fallback, wrong `MAIL_HOST` (section 11), or no SPF/DKIM |
| Someone could edit your code | Permissions were left at 777 — rerun section 8 |

---

## 14. Security notes

- Keep `APP_DEBUG=false`; it can leak database values and stack traces.
- **Rotate the cPanel and FTP passwords.** Both were shared in plain text during setup.
- Never commit `.env`. The archives contain only `.env.production.example`, which has
  placeholders and no credentials.
- **Delete `.env.save`** in the API folder once you no longer need it. It is a leftover
  backup sitting next to the app.
- No demo or default accounts exist. The only way in is the admin from section 7.
- Public sign-ups are held at `pending` and cannot log in until an admin approves them.
- `QUEUE_CONNECTION=sync` means no queue worker and no cron job are required.
- No user file uploads exist yet, so `php artisan storage:link` is **not** needed.
  If you add them later, run it and make sure `public/storage` is writable.
