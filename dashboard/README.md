# Cacttus Education — Admin Dashboard

React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui single-page app. It talks
only to the protected `/api/admin` and `/api/auth` surfaces of `../backend`.

## Setup

```bash
cp .env.example .env.local   # set VITE_API_BASE_URL
npm install
npm run dev                  # http://localhost:5173
```

The backend must have `DASHBOARD_ORIGIN=http://localhost:5173` for CORS and cookies
to work.

## Design tokens

Client-locked brand, **light theme only** (no `dark:` utilities anywhere):

| Token | Hex | HSL variable |
| --- | --- | --- |
| primary | `#823685` | `--primary: 298 42% 37%` |
| secondary | `#91478d` | `--secondary: 303 34% 42%` |
| base | `#FFFFFF` | `--background: 0 0% 100%` |

Typeface is **Publica Sans** (licensed — FaceType / Marcus Sterz). The font stack in
`tailwind.config.ts` already names it; drop the `.woff2` files into `public/fonts/`
and add the matching `@font-face` block to `src/index.css` when the licence lands.
Until then the stack degrades to the system UI font.

## Auth flow

1. The access token lives **in memory only** (`src/lib/token-store.ts`) — never in
   `localStorage`, so an XSS payload cannot read it.
2. The refresh token is an httpOnly cookie the browser sends only to `/api/auth`.
3. On boot, `AuthProvider` calls `POST /api/auth/refresh`; success restores the
   session, failure lands on `/login`.
4. Any `401` from the API triggers one transparent refresh + replay
   (`src/lib/api-client.ts`); concurrent 401s share a single refresh request.

## shadcn/ui

`components.json` is configured for the `new-york` style with the `@/` alias, so
`npx shadcn@latest add <component>` drops new primitives straight into
`src/components/ui/`. The primitives already vendored: button, input, textarea,
label, card, badge, table, select, dialog, dropdown-menu, switch, skeleton.

## Layout

```
src/
  main.tsx               entry
  App.tsx                providers (react-query, auth, router, toaster)
  index.css              design tokens + base layer
  api/                   typed API modules + react-query keys
  components/
    ui/                  shadcn/ui primitives
    layout/              app shell, sidebar, topbar
    common/              page header, state views, pagination, confirm dialog
    forms/               form field-definition editor
  context/               auth context
  hooks/                 useAuth, useDebouncedValue, useDocumentTitle
  lib/                   config, api client, token store, errors, format, constants
  pages/                 route components (lazy-loaded)
  router/                route table + route guards
```

## z-index ladder

Documented once so overlays never fight: sidebar overlay `30` · sidebar `40` ·
topbar `30` · Radix portals (dialog, select, dropdown) `50`.
