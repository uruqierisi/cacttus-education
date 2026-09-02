import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FIXTURE_DIR } from "./paths.mjs";

/** Fixture filename for an API path, matching what record-fixtures.mjs writes. */
const key = (p) => p.replace(/^\/api\/public\//, "").replace(/[^A-Za-z0-9._-]/g, "_") || "root";

/**
 * Serve every `GET /api/public/**` from recorded bytes, and capture POSTs without
 * letting them leave the browser.
 *
 * Replaying is what makes a DOM diff meaningful: the trainings, posts and form
 * definitions the pages render come from a live database that changes between runs, so
 * without this every capture would differ for reasons that have nothing to do with the
 * code. The glob matches any host, so it works whatever VITE_API_BASE_URL was built in.
 *
 * POSTs are fulfilled locally with a synthetic 201. `route.fulfill` never touches the
 * network, so driving a form to completion creates no Submission row — which is why
 * forms.mjs can exercise all eight surfaces against a real backend safely.
 *
 * Pass `sink` to collect those POSTs for assertions.
 */
export function installFixtures(ctx, sink) {
  return ctx.route("**/api/public/**", async (route) => {
    const req = route.request();
    const u = new URL(req.url());

    if (req.method() !== "GET") {
      sink?.push({ method: req.method(), url: req.url(), pathname: u.pathname, body: req.postData() });
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { id: "intercepted", createdAt: "2026-01-01T00:00:00.000Z" } }),
      });
    }

    const file = join(FIXTURE_DIR, "api", `${key(u.pathname)}.json`);
    if (!existsSync(file)) {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "NO_FIXTURE", code: "NO_FIXTURE" } }),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: readFileSync(file) });
  });
}

/**
 * Freeze the two auto-advancing timers on the homepage — RotatingWord (2400ms) and
 * SuccessCarousel (3500ms) — so its DOM is deterministic.
 *
 * `setInterval` is stubbed rather than the whole clock: `setTimeout` drives the popup's
 * entrance animation and the semester tabs' fade, and those need to run. Applied
 * identically to every run, so it cannot mask a regression — it only removes a source of
 * false diffs. Verified: two captures of the same build come out 60/60 identical.
 */
export const FREEZE_TIMERS = `window.setInterval = function () { return 0; };`;
