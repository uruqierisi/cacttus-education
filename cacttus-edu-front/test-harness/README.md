# Split verification harness

Behaviour-equivalence harness for `cacttus-edu-front`. Built to prove that breaking
`src/app/App.tsx` (8,645 lines) into 86 modules changed nothing a user can observe, and
kept afterwards because it is the cheapest way to answer "did that refactor move a
pixel?" for any future change to this app.

It is **not** a unit test suite. It renders the real production build in a real browser
and compares the result against a previously captured run.

---

## What it checks

| | |
|---|---|
| **DOM** | 30 routes × 2 viewports (375 and 1280), serialised canonically and diffed. This is the primary signal. |
| **Screenshots** | Full-page PNGs at both widths, `--shots`. Advisory — see *Known non-determinism*. |
| **Horizontal overflow** | At 375px, on every route, **including `position: fixed` subtrees**. |
| **Forms** | All eight public form surfaces still POST to the slugs `marketing/lib/forms.config.ts` declares, with the same payload shape. |
| **Sanitiser** | A probe article carrying `data:` src/href, `javascript:` href, `onerror` and `<script>` must come back stripped, with a legitimate `https://` link intact. |
| **Bundle** | Chunk list, raw and gzip sizes, static asset count and bytes. |

### Why the overflow scan does not skip `position: fixed`

An earlier scan on this project excluded fixed subtrees and therefore reported zero
overflow while a real iPhone scrolled 384px sideways. Chrome does not count a
`position: fixed` subtree toward `document.scrollWidth`; iOS Safari does. The cause was
the mobile drawer's `fixed inset-0` wrapper, fixed by adding `overflow-hidden` to it.
`scanOverflow` deliberately measures every element so that regression cannot hide again.

### Why the API is replayed, not called

The trainings, posts and form definitions these pages render come from a live database.
Without replay, two captures taken minutes apart differ for reasons that have nothing to
do with the code, and the diff becomes noise. `installFixtures` serves every
`GET /api/public/**` from bytes recorded once into `../test-fixtures/`, so baseline and
comparison runs are measured against identical data.

The same interception makes the form checks safe: POSTs are fulfilled locally with a
synthetic 201 and never reach the network, so all eight surfaces can be driven to
submission against a running backend without creating a single `Submission` row.

---

## Setup

```sh
cd cacttus-edu-front/test-harness
npm install          # installs playwright and, via postinstall, the chromium build
```

## Recording a baseline, then checking a change

```sh
cd cacttus-edu-front

# 1. On the commit you want to hold the line at:
sh test-harness/verify.sh baseline

# 2. Make the change, then after every step:
sh test-harness/verify.sh step01
sh test-harness/verify.sh step02
```

`verify.sh` runs `pnpm typecheck`, then `pnpm build`, restarts a `vite preview` of the
production build, captures, and diffs against the baseline. `compare.mjs` exits non-zero
on any difference, so the script fails the step.

**`pnpm build` on its own is not a gate.** It is `vite build`, which transpiles with
esbuild and discards types — a broken import or a missing export builds clean and only
fails at runtime, which is exactly what moving code between files produces. That is why
`verify.sh` runs `tsc` first.

## The other checks

```sh
cd cacttus-edu-front/test-harness

node capture.mjs baseline --shots     # add screenshots (slower, ~60MB per run)
node forms.mjs baseline               # form slug + payload assertions
node bundle.mjs baseline              # chunk list and sizes from ../dist
node compare.mjs baseline final       # diff two runs
```

Re-recording fixtures — only when the API shape changes, and it invalidates every
existing baseline:

```sh
docker compose up -d db               # from the repo root
cd backend && npm run dev             # backend on :4000
cd cacttus-edu-front/test-harness && node record-fixtures.mjs
```

`record-fixtures.mjs` discovers real training and post slugs from the list endpoints and
records each detail page, plus every form slug in `forms.config.ts` and any form a
training links to. It does **not** overwrite `api/posts_sanitizer-probe.json`, which is
hand-authored — see below.

---

## Environment

| Variable | Default | Use |
|---|---|---|
| `APP_ORIGIN` | `http://localhost:5199` | the `vite preview` under test |
| `PREVIEW_PORT` | `5199` | port `verify.sh` starts preview on |
| `RUNS_DIR` | `test-harness/runs` | keep captured runs outside the repo |
| `BASELINE_LABEL` | `baseline` | compare against a differently named run |
| `API_BASE` | `http://localhost:4000` | backend, `record-fixtures.mjs` only |

Port 5199 rather than 5174: the app pins 5174 with `strictPort`, and running the harness
should not fight a dev server.

---

## Determinism

Two captures of the same build must be identical, or a diff means nothing. Verified
before the split began: 60/60 DOM captures matched across two independent runs.

Two things are deliberately neutralised to get there:

- **`setInterval` is stubbed** in the page. `RotatingWord` cycles every 2400ms and
  `SuccessCarousel` advances every 3500ms, which makes the homepage DOM depend on
  capture timing. `setTimeout` is left alone — the popup entrance and the semester tab
  fade need it. The stub is applied identically to every run, so it cannot mask a
  regression; it only removes false diffs.
- **Vite asset content-hashes, React `useId` values and blob URLs are normalised** out of
  the serialised DOM, along with whitespace runs and attribute order.

### Known non-determinism

`InfiniteLogoMarquee` is a continuously running CSS animation. On `/programim`,
`/siguria` and `/trajnime` this makes:

- **screenshots** differ between any two runs (5 of 60 PNGs), and
- the overflow scan's `worstRight` jitter by 1–3px.

Both were confirmed by capturing the *same* build twice. `document.scrollWidth` is
unaffected, and the DOM text is unaffected, which is why the DOM diff is the gate and the
screenshots are advisory.

---

## Files

| | |
|---|---|
| `paths.mjs` | every location the harness needs, derived from its own path |
| `routes.mjs` | the 30 routes and 2 viewports |
| `fixtures.mjs` | API replay, POST capture, timer freeze |
| `serialize.mjs` | canonical DOM serialiser, overflow scan, sanitiser probe — passed to `page.evaluate` as real functions, so nothing is escaped through a string |
| `capture.mjs` | records one labelled run |
| `compare.mjs` | diffs two runs, non-zero exit on any difference |
| `forms.mjs` | drives and asserts the eight form surfaces |
| `bundle.mjs` | summarises `../dist` |
| `record-fixtures.mjs` | one-shot API recorder |
| `verify.sh` | typecheck → build → preview → capture → diff |

`runs/` is gitignored: a full run with screenshots is ~120 files and ~60MB.

## Fixtures

`../test-fixtures/` is committed. `index.json` lists every recorded response with its
status and byte count.

One entry is **synthetic and hand-authored**, flagged in `index.json`:
`api/posts_sanitizer-probe.json`. It is served at `/lajme/sanitizer-probe` and exists
solely to prove the DOMPurify hook in `src/app/lib/sanitize.ts` is still registered in the
production bundle. That hook is a module-scope side effect; if it were ever tree-shaken
or split away from `renderSafeHtml`, `data:` URLs would silently start surviving
sanitisation. The probe is the check that would notice.
