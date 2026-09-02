# Deployment

Production runs on a single VPS: Docker Compose with Postgres, the API, and Caddy
serving both SPA bundles statically and reverse-proxying the API.

## Server layout

Everything lives under `~/apps/cacttus`:

```
~/apps/cacttus/
├── repo/                       git checkout (build context for the backend image)
├── static/
│   ├── marketing/              built cacttus-edu-front bundle  -> /srv/marketing
│   └── dashboard/              built dashboard bundle          -> /srv/dashboard
├── uploads/                    upload volume  -> /data/uploads in the backend
├── .env.prod                   secrets, chmod 600, NEVER committed
├── Caddyfile                   copy of repo/deploy/Caddyfile
└── docker-compose.prod.yml     copy of repo/deploy/docker-compose.prod.yml
```

The three tracked templates are in `repo/deploy/`. When you change one, copy it up:

```sh
cp ~/apps/cacttus/repo/deploy/docker-compose.prod.yml ~/apps/cacttus/
cp ~/apps/cacttus/repo/deploy/Caddyfile              ~/apps/cacttus/
```

`.env.prod` is created once from `deploy/env.prod.example` and edited by hand.

## The `dc` alias

```sh
alias dc='docker compose -f ~/apps/cacttus/docker-compose.prod.yml --env-file ~/apps/cacttus/.env.prod'
```

`--env-file` is load-bearing: `env_file:` on the backend service only populates the
*container's* environment. Compose's own `${POSTGRES_USER}` / `${POSTGRES_PASSWORD}`
interpolation on the `db` service reads the `--env-file` (or a plain `.env`), and
without it the database comes up with empty credentials.

## Deploy

From `~/apps/cacttus/repo`:

```sh
git pull
dc build backend
dc run --rm backend npx prisma migrate deploy
dc up -d
```

`migrate deploy` runs against `DIRECT_DATABASE_URL` and applies only committed
migrations — it never generates or resets anything.

### After editing the Caddyfile

```sh
cp ~/apps/cacttus/repo/deploy/Caddyfile ~/apps/cacttus/
dc restart caddy
```

`dc up -d` is **not** enough. The Caddyfile is a bind mount, so Compose sees no
change to the service definition and leaves the container alone with the old
config still loaded.

## Building and shipping the SPAs

The bundles are built on a laptop and copied up; the server never runs a frontend
build. Both API URLs are baked in at build time, so they must be set before building.

Marketing:

```sh
cd cacttus-edu-front
VITE_API_BASE_URL=https://api.cacttus.education pnpm build
scp -r dist/* USER@SERVER:~/apps/cacttus/static/marketing/
```

Dashboard:

```sh
cd dashboard
VITE_API_BASE_URL=https://api.cacttus.education \
VITE_PUBLIC_SITE_URL=https://cacttus.education \
npm run build
scp -r dist/* USER@SERVER:~/apps/cacttus/static/dashboard/
```

Caddy serves these from a read-only bind mount, so no restart is needed after an
`scp` — the next request reads the new files.

## Checks after a deploy

```sh
dc ps                                             # all three up, db healthy
curl -fsS https://api.cacttus.education/health    # {"status":"ok"}
curl -sI https://cacttus.education | grep -i strict-transport
```
