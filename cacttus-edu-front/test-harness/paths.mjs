/* Everything the harness needs to locate, derived from this file's own location so the
   harness runs from a clone rather than from wherever it happened to be authored.

   RUNS_DIR and APP_ORIGIN are overridable from the environment: RUNS_DIR so a captured
   baseline can live outside the repo, APP_ORIGIN so the same scripts can point at a
   `vite preview` on any port. */
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

export const HARNESS_DIR = dirname(fileURLToPath(import.meta.url));
/** cacttus-edu-front/ — the app this harness verifies. */
export const APP_DIR = resolve(HARNESS_DIR, "..");
/** Recorded API responses, replayed into every run. Committed alongside the harness. */
export const FIXTURE_DIR = join(APP_DIR, "test-fixtures");
/** Vite's build output, for `bundle.mjs`. */
export const DIST_DIR = join(APP_DIR, "dist");
/** Where captured runs are written. Gitignored. */
export const RUNS_DIR = process.env.RUNS_DIR
  ? resolve(process.env.RUNS_DIR)
  : join(HARNESS_DIR, "runs");
/** The server under test — a `vite preview` of the production build, not the dev server. */
export const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://localhost:5199";
/** The live backend, used only by record-fixtures.mjs. */
export const API_BASE = process.env.API_BASE ?? "http://localhost:4000";
