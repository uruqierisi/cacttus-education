/*
 * capture.mjs <label> [--shots]
 *
 * Visits every route in routes.mjs at both viewports against a running `vite preview`,
 * with the API replayed from fixtures, and writes:
 *
 *   runs/<label>/dom/<route>__<vw>.txt   canonical DOM text  (the thing that is diffed)
 *   runs/<label>/shots/<route>__<vw>.png full-page screenshot (--shots only)
 *   runs/<label>/overflow.json           375px overflow scan, fixed subtrees included
 *   runs/<label>/sanitizer.json          what survived DOMPurify on the probe article
 *   runs/<label>/console.json            console errors and page errors
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROUTES, VIEWPORTS } from "./routes.mjs";
import { installFixtures, FREEZE_TIMERS } from "./fixtures.mjs";
import { serializeDom, scanOverflow, probeSanitizer } from "./serialize.mjs";
import { APP_ORIGIN, RUNS_DIR } from "./paths.mjs";

const LABEL = process.argv[2];
const SHOTS = process.argv.includes("--shots");
if (!LABEL) {
  console.error("usage: node capture.mjs <label> [--shots]");
  process.exit(2);
}

const OUT = join(RUNS_DIR, LABEL);
mkdirSync(join(OUT, "dom"), { recursive: true });
if (SHOTS) mkdirSync(join(OUT, "shots"), { recursive: true });

const browser = await chromium.launch();
const overflow = {};
const consoleErrors = [];
let sanitizer = null;
let n = 0;

for (const [vwName, width, height] of VIEWPORTS) {
  /* A real browser context per viewport, so the CSS viewport is genuinely 375 or 1280 —
     resizing a window after the fact does not reliably change it. */
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  await ctx.addInitScript(FREEZE_TIMERS);
  await installFixtures(ctx);
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[${vwName}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${vwName}] PAGEERROR ${e.message}`));

  for (const [name, path] of ROUTES) {
    await page.goto(APP_ORIGIN + path, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(700); // let effects and CSS transitions settle
    writeFileSync(join(OUT, "dom", `${name}__${vwName}.txt`), (await page.evaluate(serializeDom)) + "\n", "utf8");
    if (vwName === "375") overflow[name] = await page.evaluate(scanOverflow);
    if (name === "lajme-probe" && vwName === "1280") sanitizer = await page.evaluate(probeSanitizer);
    if (SHOTS) await page.screenshot({ path: join(OUT, "shots", `${name}__${vwName}.png`), fullPage: true });
    n++;
  }
  await ctx.close();
}
await browser.close();

writeFileSync(join(OUT, "overflow.json"), JSON.stringify(overflow, null, 2) + "\n", "utf8");
writeFileSync(join(OUT, "console.json"), JSON.stringify(consoleErrors, null, 2) + "\n", "utf8");
writeFileSync(join(OUT, "sanitizer.json"), JSON.stringify(sanitizer, null, 2) + "\n", "utf8");

const bad = Object.entries(overflow).filter(([, o]) => o.scrollWidth > o.clientWidth);
console.log(`captured ${n} page-views into runs/${LABEL}`);
console.log(bad.length ? `OVERFLOW@375: ${bad.map(([k]) => k).join(", ")}` : "overflow@375: clean on all routes");
console.log("sanitizer probe:", JSON.stringify(sanitizer));
if (consoleErrors.length) {
  console.log(`console errors: ${consoleErrors.length}`);
  for (const e of consoleErrors.slice(0, 5)) console.log("  " + e);
}
