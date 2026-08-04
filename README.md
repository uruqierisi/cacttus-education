# Cacttus Education — Admin System

Admin system for **Cacttus Education** — a single panel for managing applications, dynamic forms, trainings, news/blog posts, and users, built on top of a secure role-based API.

This repository is separate from the public marketing site (built independently). It exposes a **public API** that the marketing site consumes (forms and blog posts), plus a **protected admin dashboard**.

---

## Contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Local setup](#local-setup)
- [Commands](#commands)
- [Roles & access](#roles--access)
- [Public API](#public-api)
- [Tests](#tests)
- [Deployment](#deployment)
- [Notes](#notes)

---

## Architecture

A monorepo with two separate applications:

- **`backend/`** — REST API (Node.js + Express + Prisma). Exposes two route groups:
  - `/api/public/*` — no authentication, consumed by the marketing site (forms + blog posts).
  - `/api/admin/*` and `/api/auth/*` — JWT-protected, for the admin dashboard.
- **`dashboard/`** — Single Page Application (React + Vite) that consumes the admin API.
- **`docker-compose.yml`** — local PostgreSQL via Docker.

The link to the marketing site happens **only through the public API** — there is no shared code.

---

## Tech stack

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT (access + refresh in httpOnly cookies), bcryptjs, Zod, multer, papaparse, sharp.

**Dashboard:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router, axios, Recharts, Tiptap.

**Infra:** Docker (PostgreSQL), Vitest + supertest (tests).

---

## Project structure

```
CacttusEdu/
├── backend/
│   ├── prisma/            # schema, migrations, seed
│   ├── src/
│   │   ├── routes/        # auth, admin/*, public/*
│   │   ├── controllers/   # request/response logic
│   │   ├── services/      # business logic
│   │   ├── schemas/       # Zod validation
│   │   ├── middleware/    # auth, RBAC, rate-limit, upload
│   │   └── lib/           # prisma, jwt, cookies, audit, storage, slug…
│   └── tests/             # unit + integration
├── dashboard/
│   └── src/
│       ├── pages/         # dashboard pages
│       ├── components/    # UI + features
│       ├── api/           # API clients
│       └── context/       # auth
└── docker-compose.yml
```

---

## Local setup

**Prerequisites:** Node.js 18+, Docker Desktop.

### 1. Database (Docker)

From the project root:

```bash
docker compose up -d
docker compose ps        # wait until status is (healthy)
```

> The PostgreSQL port is configurable via `POSTGRES_PORT` in the root `.env`. The local value is not 5432 if that port is already taken by other PostgreSQL services on the system.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # fill in the values (see below)
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev               # http://localhost:4000  (/health/ready)
```

Key values in `backend/.env`:

| Variable | Description |
|---|---|
| `DATABASE_URL` / `DIRECT_DATABASE_URL` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Two different secrets |
| `SEED_ADMIN_PASSWORD` | Initial admin password |
| `CORS_ORIGINS` | Allowed origins (dashboard + marketing site) |
| `UPLOAD_DIR` | Directory for uploaded images |
| `PUBLIC_API_URL` | Public API address (for image URLs) |

### 3. Dashboard

```bash
cd dashboard
npm install
cp .env.example .env      # set VITE_API_URL to http://localhost:4000
npm run dev               # http://localhost:5173
```

---

## Commands

| Command | Location | Description |
|---|---|---|
| `docker compose up -d` | root | Starts PostgreSQL |
| `npm run dev` | backend / dashboard | Runs in development mode |
| `npm run build` | backend / dashboard | Builds (and type-checks) |
| `npm run db:seed` | backend | Seeds the initial users |
| `npm run test` | backend | Runs the tests |
| `npm run test:coverage` | backend | Tests with coverage |

> `npm run build` is the only command that fully type-checks. Development mode does not.

---

## Roles & access

Two roles, enforced **on the server** on every route (the UI mirrors this but never relies on hiding alone):

| Action | Admin | Editor |
|---|:---:|:---:|
| Statistics (Overview) | ✅ | ❌ |
| Applications — view / export | ✅ | ✅ |
| Applications — delete | ✅ | ❌ |
| Forms — create / generate URL | ✅ | ✅ |
| Forms — delete | ✅ | ❌ |
| News / Blogs | ✅ | ✅ |
| Users | ✅ | ❌ |
| Audit log | ✅ | ❌ |

---

## Public API

These routes are consumed by the marketing site. They require no authentication.

### Forms

**Get a form's configuration**

```
GET /api/public/forms/:slug
```

Returns the form's field definitions (if active and not deleted). Example:

```javascript
const res = await fetch(`${API_URL}/api/public/forms/regjistrimi-per-cyber`);
const { data } = await res.json();
// data.fields → the list of questions to render
```

**Submit an application**

```
POST /api/public/forms/:slug/submit
Content-Type: application/json
```

```javascript
await fetch(`${API_URL}/api/public/forms/regjistrimi-per-cyber/submit`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Arta Krasniqi",
    email: "arta@example.com",
    phone: "+383 44 123 456",
    data: {
      // answers keyed by the form's fields
      motivimi: "…"
    }
  })
});
```

The server validates the submission against the form's fields, stores `name` / `email` / `phone` in dedicated columns and the rest in `data`. The status is set automatically and unknown fields are dropped.

### Blogs / News

**List of published posts**

```
GET /api/public/posts
```

**A single post**

```
GET /api/public/posts/:slug
```

> **CORS:** the marketing site's origin must be in `CORS_ORIGINS`. That origin gets CORS access, but **not** credentials (cookies) — those are for the admin dashboard only.

---

## Tests

```bash
cd backend
npm run test
npm run test:coverage
```

Tests (Vitest + supertest) run against a dedicated test database, isolated from the development database.

---

## Deployment

> This repository is configured for local development. Production deployment is a separate step.

Pre-deployment checklist:

- Rotate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` with new values (do not use the ones from `.env.example`).
- Set a real `SEED_ADMIN_PASSWORD`.
- Set `PUBLIC_API_URL` to the public API address.
- Set `UPLOAD_DIR` to a persistent path outside the repo and back it up (images are not stored in the database).
- Restrict the PostgreSQL port to a private interface (not `0.0.0.0`).
- Use `npx prisma migrate deploy` (not `migrate dev`).
- Set `CORS_ORIGINS` to the exact origins (dashboard + marketing site); credentials are allowed only for the dashboard.

---

## Notes

- Forms are **data, not code** — a new form is created from the panel and generates a public URL automatically, without changing code.
- Deleting forms is a **soft delete** — application data is never lost.
- The audit log is **append-only** — every staff action is recorded and cannot be modified.
- Image uploads are validated by the file's real signature (magic bytes), not just the extension.

---

*Private project — Cacttus Education.*