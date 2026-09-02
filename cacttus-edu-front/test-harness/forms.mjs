/* Usage: node forms.mjs <label>
   Drives every public form surface, intercepts the POST before it leaves the browser
   (route.fulfill — nothing reaches the backend), and asserts the slug it targets. */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { installFixtures, FREEZE_TIMERS } from "./fixtures.mjs";
import { APP_ORIGIN as ORIGIN, RUNS_DIR as ROOT } from "./paths.mjs";

const LABEL = process.argv[2] ?? "forms";

/* slug -> what forms.config.ts says it must be. Kept here as literals on purpose:
   if a page silently repoints, this file is the thing that disagrees. */
const SURFACES = [
  {
    id: "apply-band-home",
    path: "/",
    expectSlug: "aplikim-studime-profesionale",
    scope: "form",
    submit: "Apliko këtu",
    expectKeys: ["name", "email", "phone", "data"],
  },
  {
    id: "scroll-popup",
    path: "/",
    expectSlug: "aplikim-studime-profesionale",
    open: async (page) => {
      // Several "Apliko tani" buttons exist (banner, navbar, hero) and the closed mobile
      // drawer holds hidden copies — click the first one actually visible.
      const all = page.getByRole("button", { name: "Apliko tani" });
      const n = await all.count();
      for (let i = 0; i < n; i++) {
        if (await all.nth(i).isVisible()) { await all.nth(i).click(); break; }
      }
      await page.waitForTimeout(900);
    },
    scope: '[role="dialog"] form',
    submit: "Apliko",
    expectKeys: ["name", "email", "phone", "data"],
  },
  {
    id: "kontakti",
    path: "/kontakti",
    expectSlug: "kontakt",
    scope: "form",
    submit: "Dërgo mesazhin",
    expectKeys: ["name", "email", "phone", "data"],
    expectData: ["subjekti", "mesazhi"],
  },
  {
    id: "training-detail",
    path: "/trajnime/ethical-hacking-training",
    expectSlug: "regjistrimi-kiber-siguri",
    scope: "#apliko form",
    submit: "Dërgo aplikimin",
    expectKeys: ["name", "email", "phone", "data", "trainingId"],
  },
  {
    id: "forma-slug",
    path: "/forma/aplikim-studime-profesionale",
    expectSlug: "aplikim-studime-profesionale",
    scope: "form",
    submit: "Dërgo aplikimin",
    expectKeys: ["name", "email", "phone", "data"],
  },
  {
    id: "biznese-trajnime",
    path: "/biznese/trajnime",
    expectSlug: "kontakt-biznesi",
    scope: "section:has-text('Keni nevojë për trajnime')",
    submit: "Kontaktoni ne",
    expectKeys: ["name", "email", "phone", "data"],
    expectData: ["tipi_kerkeses", "kompania"],
    expectDataValues: { tipi_kerkeses: "Trajnime të personalizuara" },
  },
  {
    id: "biznese-talente",
    path: "/biznese/talente",
    expectSlug: "kontakt-biznesi",
    scope: "section:has-text('Regjistrohu si punëdhënës partner')",
    submit: "Regjistrohu në rrjet",
    expectKeys: ["name", "email", "phone", "data"],
    expectData: ["tipi_kerkeses", "kompania", "fusha_interesit"],
    expectDataValues: { tipi_kerkeses: "Partneritet / Punëdhënës" },
  },
  {
    id: "biznese-klasa",
    path: "/biznese/klasa",
    expectSlug: "rezervo-klase",
    scope: "#rezervo-klasen",
    submit: "Rezervo tani",
    expectKeys: ["name", "email", "phone", "data"],
    expectData: ["klasa", "data_deshiruar", "nr_personave", "shenime"],
  },
];

const VALUE_FOR = (el) => {
  const t = (el.type || "").toLowerCase();
  const hint = ((el.name || "") + " " + (el.placeholder || "") + " " + (el.ariaLabel || "")).toLowerCase();
  if (t === "email" || hint.includes("email")) return "harness@example.test";
  if (t === "tel" || /telefon|phone/.test(hint)) return "+38344123456";
  if (/dat[ae]/.test(hint)) return "2026-10-01";
  if (/nr\.|person|pjesemarres/.test(hint)) return "12";
  return "harness-value";
};

const browser = await chromium.launch();
const results = [];

for (const s of SURFACES) {
  const sink = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(FREEZE_TIMERS);
  await installFixtures(ctx, sink);
  const page = await ctx.newPage();
  const rec = { id: s.id, expectSlug: s.expectSlug, ok: false, notes: [] };

  try {
    await page.goto(ORIGIN + s.path, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(600);
    if (s.open) await s.open(page);

    const scope = page.locator(s.scope).first();
    await scope.waitFor({ state: "visible", timeout: 15000 });

    // Fill every control inside the scope, generically.
    const inputs = scope.locator('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const el = inputs.nth(i);
      if (!(await el.isVisible())) continue;
      const meta = await el.evaluate((n) => ({
        type: n.type,
        name: n.name,
        placeholder: n.placeholder,
        ariaLabel: n.getAttribute("aria-label"),
      }));
      await el.fill(VALUE_FOR(meta));
    }
    const selects = scope.locator("select");
    const sc = await selects.count();
    for (let i = 0; i < sc; i++) {
      const el = selects.nth(i);
      if (!(await el.isVisible())) continue;
      const values = await el.evaluate((n) => Array.from(n.options).map((o) => o.value).filter(Boolean));
      if (values.length) await el.selectOption(values[0]);
    }

    await scope.getByRole("button", { name: s.submit, exact: false }).first().click();
    await page.waitForTimeout(1500);

    const posts = sink.filter((r) => r.method === "POST");
    if (posts.length !== 1) {
      rec.notes.push(`expected exactly 1 POST, saw ${posts.length}: ${posts.map((p) => p.pathname).join(",")}`);
    } else {
      const p = posts[0];
      rec.pathname = p.pathname;
      const m = p.pathname.match(/\/api\/public\/forms\/([^/]+)\/submit$/);
      const slug = m ? decodeURIComponent(m[1]) : null;
      rec.slug = slug;
      if (slug !== s.expectSlug) rec.notes.push(`slug ${slug} !== expected ${s.expectSlug}`);
      let body = null;
      try {
        body = JSON.parse(p.body ?? "null");
      } catch {
        rec.notes.push("body was not JSON");
      }
      if (body) {
        rec.topKeys = Object.keys(body).sort();
        rec.dataKeys = body.data ? Object.keys(body.data).sort() : [];
        for (const k of s.expectKeys ?? []) if (!(k in body)) rec.notes.push(`missing top-level key ${k}`);
        for (const k of s.expectData ?? []) if (!body.data || !(k in body.data)) rec.notes.push(`missing data key ${k}`);
        for (const [k, v] of Object.entries(s.expectDataValues ?? {}))
          if (body.data?.[k] !== v) rec.notes.push(`data.${k} = ${JSON.stringify(body.data?.[k])} !== ${JSON.stringify(v)}`);
      }
      rec.cookieHeader = (await page.evaluate(() => document.cookie)) || "";
      if (rec.cookieHeader) rec.notes.push(`page set cookies: ${rec.cookieHeader}`);
    }
    rec.ok = rec.notes.length === 0;
  } catch (e) {
    rec.notes.push(`ERROR ${e.message.split("\n")[0]}`);
  }
  results.push(rec);
  await ctx.close();
}
await browser.close();

mkdirSync(join(ROOT, LABEL), { recursive: true });
writeFileSync(join(ROOT, LABEL, "forms.json"), JSON.stringify(results, null, 2) + "\n", "utf8");

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.id.padEnd(18)} -> ${r.slug ?? "?"}`);
  if (r.topKeys) console.log(`        top=${r.topKeys.join(",")}  data=${(r.dataKeys ?? []).join(",") || "-"}`);
  for (const n of r.notes) { console.log(`        ! ${n}`); failed++; }
}
console.log(failed ? `\n${failed} problem(s)` : "\nall form surfaces post to the expected slugs");
