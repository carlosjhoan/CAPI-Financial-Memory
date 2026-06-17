<div align="center">
  <div style="display: inline-block; border-radius: 50%; overflow: hidden; line-height: 0;">
    <img alt="CAPI" src="frontend/public/assets/CAPI_logo.png" width="320">
  </div>
</div>

<h1 align="center">CAPI</h1>

<p align="center"><i><font color="#6b7280">Goodbye Financial Amnesia!</font></i></p>

La mayoría de la gente no sabe con certeza cuánto debe, cuánto gasta al mes, o si le están pagando lo que le prestó. Eso es **amnesia financiera** — y CAPI existe para terminarla.

Cuatro categorías que cubren las finanzas personales de cualquier persona: **deudas**, **gastos**, **ingresos** y **préstamos otorgados**. Números claros, sin vueltas, sin dashboards de vergüenza.

> Que un proyecto chico esté bien hecho no es un lujo. Es el estándar.

---

## Quick Start

```bash
docker compose up -d              # PostgreSQL
npm install && npm run dev        # Backend :3000 + Frontend :5173
```

## Commands

| Context | Command | What it does |
|---------|---------|--------------|
| Root | `npm run dev` | Both via `concurrently` |
| Backend | `npm run start:dev` | NestJS watch on `:3000` |
| Backend | `npm run test` | Jest |
| Backend | `npm run migration:run` | Apply pending TypeORM migrations |
| Frontend | `npm run dev` | Vite on `:5173`, proxies `/api` → `:3000` |
| Frontend | `npm run test` | Vitest |

## API Docs

Swagger UI at [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) — full endpoint reference, schemas, and interactive testing.

## Architecture

```
backend/     ─── domain/ → application/ → infrastructure/    (hexagonal)
frontend/    ─── core/ → features/ → shared/                 (feature-based)
```

## Env Variables

```env
# backend/.env
DB_TYPE=postgres    # postgres | mysql | mongo
DB_HOST=localhost   # DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
JWT_SECRET=changeit
GOOGLE_CLIENT_ID=   # Optional, for Google OAuth

# frontend/.env
VITE_API_URL=http://localhost:3000/api
```

## Tech

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeORM + PostgreSQL |
| Frontend | React + Vite + TailwindCSS + React Query |
| Auth | JWT + Google OAuth |
| Forms | React Hook Form + Zod |
| Router | React Router v6 |

## API Response Format

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
