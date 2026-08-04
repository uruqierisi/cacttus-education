# Cacttus Education Website — Codebase Audit

## Scope
Reviewed the full repository at `C:\Users\CacttusEducationStud\Downloads\Cacttus Education Website`, excluding `node_modules` and lockfile internals. Confirmed via `git status` that this directory is **not** a git repository (`fatal: not a git repository`) — there is no commit history and no `.gitignore` to check; all git-history-based checks were skipped for that reason, not skipped by oversight.

Had Bash/Node execution access (Node v24.19.0, pnpm 11.20.0 pre-installed). `node_modules` and `pnpm-lock.yaml` already existed, so `pnpm audit --prod` was run — this is read-only and network-only (queries the advisory database), it installs or modifies nothing. No `npm install`, `pnpm install`, build, lint, or typecheck command was run, because none of the latter exist as scripts in `package.json`. No files were created, edited, or deleted.

Read in full: `src/app/App.tsx` (2,911 lines, five chunked reads), `src/app/components/ui/chart.tsx`, `src/app/components/figma/ImageWithFallback.tsx`, `src/main.tsx`, `index.html`, `vite.config.ts`, `package.json`, all four CSS entry files, `guidelines/Guidelines.md`, `ATTRIBUTIONS.md`. Grepped the full tree for secrets, `dangerouslySetInnerHTML`/`eval`/`innerHTML`, `fetch`/`axios`, `localStorage`/`sessionStorage`, `target="_blank"`, and `any`/`as any`/`@ts-ignore`. Did not deep-read `src/imports/pasted_text/*` (1,150 lines of pasted design-brief text, not executable) or the ~40 unused shadcn/ui primitive files beyond confirming which are actually imported. `frontend-builder.md`, `react-specialist.md`, `react-tutor.md`, and `INSTALL.md` at the repo root are unrelated Claude Code subagent definitions, not part of the website — noted but not audited as app code.

## Repo map

```
index.html                          Vite entry HTML — has an SEO-breaking robots meta tag (see Critical #1)
vite.config.ts                      Vite config: React + Tailwind 4 plugins, @ alias, a dead figma-asset-resolver plugin
package.json                        name is still the Figma Make scaffold default; only "dev"/"build" scripts exist
pnpm-lock.yaml, pnpm-workspace.yaml pnpm's lockfile + workspace file
yarn.lock                           A SECOND, conflicting lockfile — unexpected, see High #7
src/
  main.tsx                          createRoot + renders <App/>, imports styles/index.css
  app/
    App.tsx                        2,911-line monolith: every page, every shared UI primitive, the router, all hardcoded content data
    components/
      figma/ImageWithFallback.tsx   Graceful <img> fallback component — built but never imported/used anywhere
      ui/*.tsx (~40 files)          shadcn/ui-derived primitives (accordion, dialog, chart, sidebar, etc.) — the app only actually uses a handful of Radix-backed pieces indirectly; most are unused scaffolding from the Figma export
  imports/
    image.png, Bursa_Redesign.png, logo-180px.png   Real local brand/photo assets, imported directly (not via the figma-asset-resolver)
    pasted_text/*.txt, *.md         1,150 lines of pasted design-brief/content text — reference material, not code
  styles/
    fonts.css, tailwind.css, theme.css, index.css   Tailwind 4 CSS-first setup, imported by main.tsx
    globals.css                     0 bytes, and not imported by anything — orphaned
guidelines/Guidelines.md            Untouched Figma Make template ("Add your own guidelines here", rest HTML-commented)
ATTRIBUTIONS.md                     Correctly credits shadcn/ui (MIT) and Unsplash (Unsplash License)
frontend-builder.md, react-specialist.md, react-tutor.md, INSTALL.md   Unrelated Claude Code subagent definitions at repo root — not website code
```

Flagged as unexpected: no `.git`, no `.gitignore`, no `tsconfig.json`, no ESLint config anywhere in the tree — for a project on TypeScript 5.9-class tooling with a strict-sounding stack, there is no type-checking or linting configured at all (see High #6). Two different package managers' lockfiles committed side by side (High #7). `react`/`react-dom` are declared only as optional `peerDependencies`, not real dependencies (see Low #16).

## Executive summary
**19 findings: 2 Critical, 5 High, 4 Medium, 5 Low, 3 Informational.**

The most damaging problems are not exotic — they are things that make the site fail at its own stated purpose. A `noindex, nofollow` robots tag left over from the Figma export means no search engine will ever index this public enrollment site (Critical #1). Two form flows (the contact page and the training-application modal) render input fields wired to a permanent no-op, so a visitor literally cannot type into them (Critical #2), and most other "apply"/"register"/"sponsor" buttons across the business subpages have no click handler at all. On top of that, the pinned `react-router@7.13.0` carries 12 known advisories including 6 rated High (RCE, XSS, DoS) per a live `pnpm audit`. There is no linting or type-checking wired into the project's tooling, so none of this — nor any future regression — is caught automatically. Actual exploitable-today security surface is otherwise small, because the app is currently 100% static (no `fetch`, no `dangerouslySetInnerHTML` in reachable code, no secrets found); the real risk is that the client-side patterns in place now (unvalidated form "success," an unsanitized `dangerouslySetInnerHTML` in an unused chart component) will become active vulnerabilities the moment the blog/form-config/submission API is wired up, if not corrected first.

## Findings

### Critical
1. `index.html:10` — The page ships `<meta name="robots" content="noindex, nofollow" />`, a Figma Make default that was never removed. → Every search engine is explicitly told not to index this page or follow any link from it, meaning organic search — the primary acquisition channel for a public enrollment site — is completely disabled. → **Fix:** delete that meta tag (or replace with `index, follow`) before this ever goes to production; also replace the equally leftover `<meta name="description">` (`index.html:9`, still describes a "design prototyping" tool, not a school).

2. `src/app/App.tsx:874-876` and `src/app/App.tsx:2733-2736` — The training-application modal and the site's contact form both call `<FormField ... value="" onChange={() => {}} />` (and `<FormSelect ... value="" onChange={() => {}} />`), a hardcoded empty string with a no-op handler instead of component state. → These are controlled inputs pinned to `""` forever: a visitor cannot type a single character into "Emri," "Email," "Numri i telefonit," or the subject dropdown on either form, yet the surrounding UI still lets them click submit and see a "sent successfully" message. This is the core lead-capture flow of an enrollment site, and it silently captures nothing. → **Fix:** wire each field to real `useState` (the same pattern already used correctly in `HorizontalApplicationBand`, `App.tsx:657-658`) and pass the actual value/setter through.

### High
3. `package.json:59` — `react-router` is pinned to `7.13.0`. A read-only `pnpm audit --prod` returned 12 advisories against it: 6 High (including an unauthenticated RCE via turbo-stream deserialization, GHSA-49rj-9fvp-4h2h, and a route-matching DoS, GHSA-chx6-hx7r-mcp5), 5 Moderate, 1 Low, all patched at `>=7.18.0` (one requires `>=8.3.0`). → Several of these specifically target data-router/RSC/SSR features (loaders, `__manifest`, single-fetch) that this app's declarative `BrowserRouter`/`Routes` setup doesn't currently use, so immediate exploitability is lower than the raw severity suggests — but the vulnerable code still ships in the client bundle, and any future move toward loaders or SSR would activate the exposed surface. → **Fix:** `pnpm update react-router` to the latest 7.x (or evaluate 8.x) and re-run `pnpm audit` to confirm zero remaining advisories.

4. `src/app/App.tsx:1925-1927`, `2109`, `2211-2219`, `2292-2293`, `2473`, `2487-2488` (representative, not exhaustive) — The "Kontaktoni ne," "Regjistrohu në rrjet," "Bëhu sponsor" (all three tiers), "Kërko ofertë," and "Rezervo tani" buttons across the business subpages (`PageBizneseTrajnime`, `PageBizneseTalente`, `PageBizneseBursa`, `PageBiznestKlasa`) have no `onClick`, are not `type="submit"` inside a `<form>`, and in several cases (e.g. `App.tsx:1916-1931`) the surrounding `<input>`s aren't wrapped in a `<form>` at all. → Every one of these is a primary conversion action for a business-facing page, and clicking any of them does nothing — not even the fake-success pattern used elsewhere. → **Fix:** either wire these into the same controlled-form + `HorizontalApplicationBand`-style success pattern, or, if that's deliberately deferred, note it explicitly in a handoff doc so it isn't mistaken for "done."

5. `src/app/App.tsx:660-663` (`HorizontalApplicationBand`) and `App.tsx:2732` (`PageKontakti`) — Both `onSubmit` handlers are exactly `e.preventDefault(); setSubmitted(true);` with no check that any field is non-empty or well-formed, and no `fetch`/persistence of any kind. → A completely empty submission is treated identically to a complete one, and the user is told "Aplikimi u dërgua" ("your application was sent") regardless. Once the real submission endpoint exists, this ships straight through with no client-side validation boundary. → **Fix:** validate required fields before calling `setSubmitted(true)`, and treat the eventual `fetch` call's success/failure as the actual trigger for the success state rather than the button click itself.

6. Repo-wide — There is no `tsconfig.json`, no ESLint config (`eslint.config.js`/`.eslintrc*`), no ESLint devDependency, and `package.json` has no `"lint"` or `"typecheck"` script — only `"dev"` and `"build"` (`package.json:6-9`). → TypeScript compiler errors and React-hooks correctness rules (`rules-of-hooks`, `exhaustive-deps`) have never been checked anywhere in this project's tooling; `vite build` transpiles with esbuild and does not type-check. Any type error or hook-dependency bug currently in the 2,911-line `App.tsx` — or introduced tomorrow — is invisible until it manifests as a runtime bug. → **Fix:** add a `tsconfig.json` (strict mode), an ESLint 9 flat config with `eslint-plugin-react-hooks`, and `"typecheck": "tsc --noEmit"` / `"lint": "eslint ."` scripts, then run both once to see what surfaces.

7. Repo root — `pnpm-lock.yaml` + `pnpm-workspace.yaml` **and** `yarn.lock` are committed side by side, with no `package-lock.json`. → Two different lockfiles for two different package managers describing the same `dependencies` block will drift the moment either is regenerated; a contributor running `yarn install` gets a different resolved tree than one running `pnpm install`, silently. → **Fix:** pick one package manager (the `pnpm.overrides`/`pnpm-workspace.yaml` presence suggests pnpm is the intended one — note pnpm itself already warns that the `pnpm.overrides` key in `package.json:87-91` is obsolete and ignored), delete the other lockfile, and add the unused one's lockfile name to `.gitignore` once a `.gitignore` exists.

### Medium
8. `src/app/App.tsx:1260-1264` (`PARTNER_LOGOS`), `2773-2786` (`TEAM_MEMBERS`), `2815-2828` (`LIGJËRUEIT`), plus testimonials at `1876-1887`, `2085-2096`, and student stories at `2231-2234` — Dozens of named "team members," "trainers," and testimonial-givers are each paired with a random Unsplash stock photo of an unrelated real person, and a company-logo marquee under "Ku punojnë të diplomuarit tanë" ("where our graduates work") lists Microsoft, Google, Amazon, IBM, Accenture, Deloitte, PwC, KPMG, and others by name. → None of this is marked as sample data anywhere in the code; if published as-is it reads as factual claims about real staff, real alumni outcomes, and real employer relationships, none of which this audit can verify are true. This is a business/legal-risk item adjacent to (not strictly inside) security or code quality, but it's exactly the fabricated-content pattern the audit was scoped to flag. → **Fix:** before launch, replace with either real staff/employer data or content explicitly marked as illustrative, and swap the stock photography for real photos or clearly generic avatars.

9. `src/app/components/ui/chart.tsx:82-101` (`ChartStyle`) — Builds a `<style>` tag via `dangerouslySetInnerHTML`, string-interpolating each chart series' `color`/`theme` value directly into CSS with no escaping or validation. → Currently unreachable — `chart.tsx` is never imported anywhere in `src/app/App.tsx` — but the moment a future chart (e.g., enrollment or engagement stats sourced from the new backend) is wired up with config values that trace back to remote data, an unescaped string here becomes a CSS-injection point. → **Fix:** if/when this component is adopted, validate `color`/`theme` values against an allow-listed format (hex/rgb/css-variable) before interpolating, rather than trusting the config object's shape alone.

10. `src/app/App.tsx:2903` — The router's catch-all is `<Route path="*" element={<PageBallina />} />`. → Any unmatched URL — a typo, a stale bookmark, a broken external link — silently renders the homepage instead of a "page not found" state, so there's no way for a user or a search engine to tell a bad link from a good one. Combined with Critical #1, this also means link-rot is invisible in analytics. → **Fix:** add a real `PageNotFound` component with a 200-but-clearly-labeled or (once server-rendered) proper 404 response.

11. `vite.config.ts:6-14` — The `figma-asset-resolver` plugin resolves virtual `figma:asset/*` imports to `path.resolve(__dirname, 'src/assets', filename)`, but `src/assets/` does not exist anywhere in the repo; every real image import in `App.tsx` instead uses relative paths into `src/imports/`. → Dead plugin code pointing at a nonexistent directory — harmless today only because nothing actually imports via the `figma:asset/` scheme anymore. → **Fix:** delete the plugin and its import if `figma:asset/` imports are no longer used, or fix the target path if they're expected to return.

### Low
12. `src/app/components/figma/ImageWithFallback.tsx` — A complete, working `onError`-fallback image component exists but is imported nowhere; every one of the 50+ raw `<img>` tags in `App.tsx` (many pointing at external `images.unsplash.com` URLs) has no fallback if a URL 404s or Unsplash rate-limits hotlinking. → **Fix:** either adopt `ImageWithFallback` in place of raw `<img>` for externally-sourced images, or delete it if it's not going to be used.

13. `src/app/App.tsx:518-522` (Footer) and `2753-2755` (`PageKontakti`) — Social-media icon buttons render as `<button>` with an icon child, no `href`, no `onClick`, and no `aria-label`. → They look interactive but do nothing and are unreadable to a screen reader ("button" with no accessible name). → **Fix:** either link them to the real social profiles with `<a>` + `rel="noopener"`, or remove them until the profiles exist.

14. `package.json:2` — `"name": "@figma/my-make-file"` is the untouched Figma Make scaffold default. → **Fix:** rename to something like `cacttus-education-website`.

15. `src/styles/globals.css` — 0 bytes, and not referenced by `src/styles/index.css`'s import chain (`fonts.css`, `tailwind.css`, `theme.css` only). → Orphaned dead file. → **Fix:** delete it.

16. `package.json:75-86` — `react` and `react-dom` are declared only under `peerDependencies` at `18.3.1`, both marked `optional: true`, while `devDependencies` pin `@types/react`/`@types/react-dom` to `^19.2.18`/`^19.2.4` (`package.json:69-70`). → React is not a direct dependency at all here; whatever version actually gets installed depends entirely on the package manager's peer-resolution behavior (this is the React 18/19 tension noted in scope, and it's a step worse than a normal version mismatch since there's no direct `"react"` entry to point to). → **Fix:** add explicit `"react"` and `"react-dom"` entries under `dependencies` pinned to one real version, and match `@types/react`/`@types/react-dom` to it.

### Informational
17. This directory has no `.git` — there is no version control at all, so there's also no `.gitignore` to check and no commit history to audit for secrets that were later removed. No `.env*` files exist anywhere in the tree, and a repo-wide grep for API-key/token/password/secret patterns returned no real hits (only false positives inside `node_modules` package internals and the npm package literally named `js-tokens`).

18. `src/app/App.tsx:527` — Footer copyright is hardcoded as `"Cacttus Education 2026. Të gjitha drejtat e rezervuara."` — will read as stale starting January 2027 unless someone remembers to update it by hand.

19. `src/app/App.tsx:1400-1401` — Tuple-like data arrays (e.g. `SEM_PROGRAMIM`'s `modules: [["Hyrje...", 45], ...]`) infer as `(string | number)[]`, requiring `name as string` / `hours as number` at render time to satisfy the compiler. Not unsafe like `any`, but a sign these structures should be typed as explicit tuples or interfaces rather than leaned on with assertions.

## Prioritized action list
1. Remove the `noindex, nofollow` robots meta tag and fix the placeholder meta description (`index.html:9-10`) — single highest-leverage fix in the codebase for a site whose entire purpose is public discovery.
2. Fix the frozen `value=""` / `onChange={() => {}}` form fields in the contact form and training-application modal (`App.tsx:874-876`, `2733-2736`) so visitors can actually type into them.
3. Upgrade `react-router` off `7.13.0` to a patched version and re-run `pnpm audit` to confirm the 12 advisories are cleared.
4. Add `tsconfig.json` (strict) and an ESLint 9 flat config with `eslint-plugin-react-hooks`, plus `"typecheck"`/`"lint"` scripts, so the next round of changes is actually checked.
5. Decide on one package manager and delete the other lockfile (`yarn.lock` vs. `pnpm-lock.yaml`/`pnpm-workspace.yaml`).
6. Wire up or explicitly defer (in writing) the dead CTA buttons across the business subpages and add real validation to the two forms that do submit.
7. Before launch, resolve the fabricated team/trainer/testimonial/partner-logo content — replace with real data or clearly mark as illustrative.
8. Lower priority, batchable together: adopt `ImageWithFallback`, add a real 404 route, remove the dead `figma-asset-resolver` plugin and orphaned `globals.css`, fix the `react`/`react-dom` dependency declaration, and rename the package.

## Sign-off
No files were modified during this audit.
