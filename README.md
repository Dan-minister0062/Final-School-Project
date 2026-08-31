# Madrassat-Al-fath-Project

School management system for Madrassat Al-Fath.

- **Frontend:** React 18 + Vite (see `src/`)
- **Backend:** Laravel 12 API (see `alfath-backend/`)

## Frontend

```bash
npm install
npm run dev
```

Configured via `.env` (`VITE_API_URL`, defaults to `http://localhost:8000/api`).

## Backend

```bash
cd alfath-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
