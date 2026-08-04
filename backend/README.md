# Cacttus Education — Backend API

Express + TypeScript + Prisma (PostgreSQL / Neon) REST API. It serves two audiences:

| Surface | Base path | Auth | Consumer |
| --- | --- | --- | --- |
| Public | `/api/public` | none | Marketing site (Figma Make / React + Vite) |
| Admin | `/api/admin` | Bearer access token | Admin dashboard (`../dashboard`) |
| Auth | `/api/auth` | mixed | Admin dashboard |
| Health | `/health` | none | Platform probes |

## Setup

```bash
cp .env.example .env      # then fill in DATABASE_URL and the two JWT secrets
npm install
npm run prisma:generate
npx prisma migrate dev --name init   # run this yourself when you are ready
npm run db:seed
npm run dev
```

> The scaffold intentionally ships **no migration files**. Run `prisma migrate dev`
> once you have a Neon database URL in `.env`.

Generate secrets with `openssl rand -base64 48` (one per JWT secret — they must differ).

## Auth model

- `POST /api/auth/login` returns a **15-minute access token in the JSON body** and sets a
  **refresh token in an httpOnly cookie** scoped to `/api/auth`.
- The dashboard keeps the access token in memory only. A page reload calls
  `POST /api/auth/refresh` to mint a new one from the cookie.
- Refresh tokens are **rotated on every use** and signed with a separate secret.
- Both tokens carry a `typ` claim, so neither can be replayed as the other.

## Endpoints

```
GET    /health                                   liveness
GET    /health/ready                             readiness (DB round-trip)

POST   /api/auth/login                           { email, password }
POST   /api/auth/refresh                         (refresh cookie)
POST   /api/auth/logout                          (refresh cookie) -> 204
GET    /api/auth/me                              bearer
POST   /api/auth/change-password                 bearer -> 204

GET    /api/public/posts                         ?page&pageSize&search
GET    /api/public/posts/:slug
GET    /api/public/forms/:slug                   field definitions for rendering
POST   /api/public/forms/:slug/submissions       { name, email, phone, data }

GET    /api/admin/forms                          ?page&pageSize&type&isActive&includeDeleted&search&sort&order
POST   /api/admin/forms
GET    /api/admin/forms/field-types
GET    /api/admin/forms/:id
PATCH  /api/admin/forms/:id
DELETE /api/admin/forms/:id                      soft delete (ADMIN)
POST   /api/admin/forms/:id/restore              (ADMIN)

GET    /api/admin/submissions                    ?page&pageSize&formId&status&search&from&to&order
GET    /api/admin/submissions/stats
GET    /api/admin/submissions/export             -> text/csv
GET    /api/admin/submissions/:id
PATCH  /api/admin/submissions/:id/status         { status }

GET    /api/admin/posts                          ?page&pageSize&published&search&sort&order
POST   /api/admin/posts
GET    /api/admin/posts/stats
GET    /api/admin/posts/:id
PATCH  /api/admin/posts/:id
DELETE /api/admin/posts/:id                      (ADMIN)
```

Every response uses one envelope:

```jsonc
// success
{ "success": true, "data": {}, "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 } }
// failure
{ "success": false, "error": { "code": "VALIDATION_FAILED", "message": "...", "details": [] } }
```

## The generic form model

`Form.fields` is a JSON array. One row per public form; no table per form type.

```json
[
  {
    "name": "school_name",
    "label": "Emri i shkollës",
    "type": "text",
    "required": true,
    "placeholder": "",
    "helpText": "",
    "order": 0,
    "options": []
  },
  {
    "name": "school_kind",
    "label": "Lloji i shkollës",
    "type": "select",
    "required": true,
    "order": 1,
    "options": [
      { "value": "public", "label": "Publike" },
      { "value": "private", "label": "Private" }
    ]
  }
]
```

Supported `type` values: `text`, `textarea`, `email`, `phone`, `number`, `date`,
`select`, `multiselect`, `radio`, `checkbox`. Choice types require `options`.

`name`, `email` and `phone` are **reserved** — they are real columns on `Submission`
and are rejected as custom field names.

## Soft delete

Forms are never hard-deleted. `DELETE /api/admin/forms/:id` stamps `deletedAt` and
sets `isActive = false`. `src/services/forms.service.ts` is the only file that knows
about the filter — every read path composes it from the `notDeleted()` helper there.

## Layout

```
src/
  app.ts                 Express assembly (middleware order)
  server.ts              listen + graceful shutdown
  config/                env validation, CORS policy, constants
  controllers/           HTTP shape only — no business logic
  services/              business logic + Prisma access
  routes/                route table (admin / public / auth / health)
  schemas/               Zod request schemas
  middleware/            auth, validation, rate limits, errors, logging
  lib/                   prisma singleton, jwt, cookies, csv, html, logger
  types/                 Express request augmentation
prisma/
  schema.prisma
  seed.ts
```
