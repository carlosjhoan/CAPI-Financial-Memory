# PFM — Personal Finance Manager

## Stack

- **Backend**: NestJS 10, TypeORM 0.3, PostgreSQL 15, Swagger (OpenAPI), Passport (JWT + Google OAuth)
- **Frontend**: Vite 5, React 18, TypeScript, TailwindCSS 3 (dark mode via `class`), React Router v6 (SPA), React Query v5, React Hook Form + Zod, Axios
- **Auth**: JWT (`@nestjs/jwt` + `passport-jwt`) + Google OAuth (`passport-google-oauth20`)
- **Monorepo**: npm workspaces (`backend/`, `frontend/`)

## Commands

| Context | Command | Notes |
|---------|---------|-------|
| Root | `npm run dev` | Runs both via `concurrently` |
| Backend | `cd backend && npm run start:dev` | NestJS watch mode on `:3000` |
| Backend | `npm run build` | `nest build` |
| Backend | `npm run lint` | ESLint + Prettier |
| Backend | `npm run test` | Jest (unit, `*.spec.ts`) |
| Backend | `npm run test:e2e` | **Not configured** — `test/jest-e2e.json` missing |
| Backend | `npm run migration:generate — <name>` | TypeORM migration |
| Backend | `npm run migration:run` | Apply pending migrations |
| Frontend | `cd frontend && npm run dev` | Vite on `:5173`, proxies `/api` → `:3000` |
| Frontend | `npm run build` | `tsc && vite build` |
| Frontend | `npm run lint` | ESLint with `--max-warnings 0` |
| Frontend | `npm run test` | Vitest |
| Frontend | `npm run test:ui` | Vitest with UI |
| Frontend | `npm run test:coverage` | Vitest with coverage |

## Architecture

### Backend (hexagonal)
```
domain/          → entities, repository interfaces, domain services
application/     → use cases, auth module (controller/service/strategies/guards)
infrastructure/  → web (controllers, DTOs, modules), persistence (TypeORM), config
```
Path aliases: `@domain/*`, `@application/*`, `@infrastructure/*`, `@shared/*`

### Frontend (feature-based)
```
core/       → api client (Axios), contexts (Auth, Toast, Filter), hooks, types
features/   → auth/, debts/, expenses/, incomes/, loans/ (each: pages/, components/, hooks/, services/, types/)
shared/     → reusable UI (Button, Card, Modal, Input, Toast, etc.)
layouts/    → MainLayout
routes/     → lazy-loaded route definitions
```
Path aliases: `@/*`, `@core/*`, `@features/*`, `@shared/*`, `@layouts/*`, `@routes/*`

## Critical differences between packages

| | Backend | Frontend |
|---|---|---|
| TypeScript strictness | Relaxed (`strictNullChecks: false`, `noImplicitAny: false`) | Strict (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`) |
| `any` allowed | Yes (ESLint rule: `off`) | No |
| Module system | CommonJS | ESM (`"type": "module"`) |
| Test runner | Jest (config in package.json) | Vitest |

## Key quirks

1. **Migrations are manual** — `synchronize: false` in `data-source.ts`. Run `npm run migration:run` after schema changes.
2. **Auth is implemented** in `backend/src/application/auth/` (JWT + Google OAuth), but **no tests exist**.
3. **Frontend auth integration is incomplete** — `AuthContext`, `LoginPage`, `RegisterPage` exist but `features/auth/services/` is empty. Auth service calls likely need implementation.
4. **`oauth_client/` contains real Google OAuth secrets** — should be in `.gitignore`. Do not commit.
5. **`.env` files with real secrets are tracked** (`backend/.env`, `frontend/.env`). Do not add new secrets here.
6. **No e2e test config** — `backend/test/jest-e2e.json` doesn't exist; running `test:e2e` will fail.
7. **No CI/CD config** — no workflow files found.
8. **No pre-commit hooks** configured.

## API conventions

- Base: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`
- Response format: `{ statusCode, data, message, timestamp }`
- Paginated: adds `meta: { total, page, limit, totalPages }`
- Error: `{ statusCode, error, message, timestamp }`
- All dates in ISO 8601 (`YYYY-MM-DD`)
- Month params are **1-indexed** (1=January)

## Frontend conventions

- Dark mode via Tailwind `class` strategy + `dark:` prefix. Theme persisted in localStorage.
- Debouncing: 300ms on filter inputs (custom `useDebounce` hook).
- React Query default: `staleTime: 5min`, `gcTime: 10min`.
- Lazy loading: all feature pages use `React.lazy()` + `Suspense`.
- No `any` — strict TypeScript enforced on frontend.
- The Vite proxy handles `/api` → `:3000`; in dev you don't need the full URL.
- Shared UI components live in `frontend/src/shared/components/`.

## Setup

```bash
docker compose up -d        # PostgreSQL 15 on :5432
npm install                 # installs root + both workspaces
cd backend && npm run start:dev   # backend on :3000
cd frontend && npm run dev        # frontend on :5173
```

Backend `.env` vars: `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `PORT`, `NODE_ENV`.
Frontend `.env` vars: `VITE_API_URL=http://localhost:3000/api`, `VITE_GOOGLE_CLIENT_ID`.
