# Cover-image uploads — operations & deploy checklist

Blog cover images are uploaded to the API and written to **local disk**. Unlike
everything else in this system, they are **not in the database** — a Postgres dump does
not contain them. That single fact drives every item below.

Nothing here is configured for production yet. This is the checklist for when we deploy.

## How it works today

| | |
|---|---|
| Endpoint | `POST /api/admin/uploads` (ADMIN + EDITOR), multipart field `file` |
| Served at | `GET /uploads/<uuid>.<ext>` — static, inert, no auth |
| Storage dir | `UPLOAD_DIR` (default `./uploads`, i.e. `backend/uploads`) |
| URL base | `PUBLIC_API_URL` (default `http://localhost:4000`) |
| Accepted | PNG, JPEG, WEBP, GIF — **decided by magic bytes, not by extension or mime** |
| Max size | 5 MB, enforced by multer as the request streams |
| Normalisation | sharp re-encodes every image and downscales anything wider than 2000px |

`Post.coverImage` stores the **absolute** URL. A pasted external `https://` link is still
accepted and stored identically — upload and paste are the same field.

## Deploy checklist

### 1. `UPLOAD_DIR` must point outside the repo

```bash
UPLOAD_DIR=/var/lib/cacttus/uploads
```

A path inside the deployment directory is destroyed by the next release. Create it and
give the API user write access:

```bash
sudo mkdir -p /var/lib/cacttus/uploads
sudo chown -R <api-user>:<api-user> /var/lib/cacttus/uploads
sudo chmod 750 /var/lib/cacttus/uploads
```

### 2. Back it up

It is **not** covered by the database backup. Add it to whatever backs up Postgres, e.g.

```bash
rsync -a --delete /var/lib/cacttus/uploads/ /backups/cacttus-uploads/
```

Losing this directory means every published article loses its cover image, and the URLs
in `Post.coverImage` become permanent 404s. There is no way to regenerate them.

### 3. If the API runs in Docker — mount it as a volume

Without a volume, uploads live in the container's writable layer and are **gone on every
restart, redeploy or image rebuild**.

```yaml
services:
  api:
    volumes:
      - cacttus-uploads:/var/lib/cacttus/uploads
    environment:
      UPLOAD_DIR: /var/lib/cacttus/uploads

volumes:
  cacttus-uploads:
    name: cacttus-uploads
```

Same reasoning as `cacttus-pgdata` in the root `docker-compose.yml`: a named volume
survives `docker compose down`, and only `down -v` destroys it.

### 4. Set `PUBLIC_API_URL` to the real public hostname

```bash
PUBLIC_API_URL=https://api.cacttus.education
```

**This is baked into stored URLs.** Every image uploaded while it says `localhost:4000`
stores `http://localhost:4000/uploads/…` in the database and will not render anywhere
else. Set it *before* anyone uploads in that environment.

If the hostname ever changes afterwards, existing rows need a one-off rewrite:

```sql
UPDATE posts
SET "coverImage" = replace("coverImage", 'https://old-host', 'https://new-host')
WHERE "coverImage" LIKE 'https://old-host/uploads/%';
```

### 5. Behind a reverse proxy

`/uploads/*` is served by Express. If nginx/Caddy fronts the API, either let it proxy
through, or serve the directory directly for better throughput — but if you serve it
directly you must reproduce the response headers the app sets (see below), particularly
`X-Content-Type-Options: nosniff`.

## Security posture (already implemented — do not regress)

- **Type is decided by content.** `lib/image-type.ts` reads magic bytes. The
  client-supplied mime and filename are never trusted for anything.
- **Every image is re-encoded** by sharp. Bytes on disk are produced by the encoder, not
  copied from the upload, so anything smuggled in metadata or appended after a valid
  image does not survive.
- **SVG is refused.** It is XML that can carry script; served from our origin it would be
  stored XSS. The four raster formats cannot execute, so the allowlist *is* the fix.
- **Filenames are server-generated** (`crypto.randomUUID()`), and the client's filename is
  discarded outright — not sanitised, discarded. `assertInsideRoot()` in `lib/storage.ts`
  is a second, independent guarantee that nothing is written outside `UPLOAD_DIR`.
- **Static responses are inert**: `X-Content-Type-Options: nosniff`,
  `Content-Security-Policy: default-src 'none'; sandbox`, no directory listing, dotfiles
  ignored.
- **Uploads are deliberately not audited.** The `Post` create/update that adopts the URL
  already is (`POST_CREATED` / `POST_UPDATED`). An orphaned file nobody references is not
  an event worth a row, and adding one would have needed a new `AuditAction` value.

## Known gap: orphaned files

Replacing or removing a cover image, or deleting a post, does **not** delete the file from
disk. `StorageAdapter.delete()` exists and is implemented, but nothing calls it yet —
deleting eagerly risks breaking a second post that reuses the same URL. Either add
reference-counted cleanup or run a periodic sweep that removes files no `Post.coverImage`
points at. Low priority while volume is small; it only ever wastes disk.

## Swapping to S3 / Cloudflare R2 later

`lib/storage.ts` defines `StorageAdapter { save, delete }` and `LocalDiskAdapter`.
Migration is one new class plus **one line**:

```ts
export const storage: StorageAdapter = new S3Adapter();
```

No route, controller, service or schema changes — `save()` returns a finished public URL,
so callers cannot tell where the bytes live. Existing rows keep working as long as the old
`/uploads/*` URLs stay reachable, so migrate by copying the directory to the bucket and
leaving a redirect in place.
