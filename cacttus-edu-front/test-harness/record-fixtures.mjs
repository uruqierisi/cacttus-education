/* One-shot recorder: saves every GET /api/public/** response the site can issue,
   as raw bytes, so baseline and post-split runs compare against identical data. */
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { API_BASE as BASE, FIXTURE_DIR as OUT } from "./paths.mjs";
mkdirSync(join(OUT, "api"), { recursive: true });

const key = (p) => p.replace(/^\/api\/public\//, "").replace(/[^A-Za-z0-9._-]/g, "_") || "root";

async function grab(path) {
  const res = await fetch(BASE + path, { headers: { Accept: "application/json" } });
  const text = await res.text();
  const file = `api/${key(path)}.json`;
  writeFileSync(join(OUT, file), text, "utf8");
  return { path, status: res.status, file, bytes: Buffer.byteLength(text) };
}

const paths = [
  "/api/public/trainings",
  "/api/public/trainings/filters",
  "/api/public/posts",
];

// Discover real slugs from the list endpoints, then record their detail pages.
const trainings = await (await fetch(BASE + "/api/public/trainings")).json();
const posts = await (await fetch(BASE + "/api/public/posts")).json();
const trainingSlugs = (trainings.data ?? []).map((t) => t.slug);
const postSlugs = (posts.data ?? []).map((p) => p.slug);
for (const s of trainingSlugs) paths.push(`/api/public/trainings/${encodeURIComponent(s)}`);
for (const s of postSlugs) paths.push(`/api/public/posts/${encodeURIComponent(s)}`);

// Every form slug the site can ask for: the ones forms.config.ts names, plus whatever
// each training's detail payload links to.
//
// READ OUT OF forms.config.ts rather than listed here. The single `APPLICATION_FORM_SLUG`
// this used to hard-code became the per-programme `APPLICATION_FORM_SLUGS` map, and a
// hand-kept copy silently stopped recording the form the band actually requests — a
// missing fixture shows up as a 404 in the replay, not as an error here.
const config = readFileSync(new URL("../src/marketing/lib/forms.config.ts", import.meta.url), "utf8");
const formSlugs = new Set([...config.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]));
// Plus any form the ROUTE TABLE visits directly. `/forma/:slug` is reachable with a slug
// forms.config.ts does not name — it is the link an admin copies out of the dashboard —
// so the routes file is a second, independent source of slugs the replay will need.
const routeFile = readFileSync(new URL("./routes.mjs", import.meta.url), "utf8");
for (const m of routeFile.matchAll(/\/forma\/([a-z0-9-]+)/g)) formSlugs.add(m[1]);
for (const s of trainingSlugs) {
  const d = await (await fetch(`${BASE}/api/public/trainings/${encodeURIComponent(s)}`)).json();
  const fs2 = d?.data?.form?.slug;
  if (fs2) formSlugs.add(fs2);
}
for (const s of formSlugs) paths.push(`/api/public/forms/${encodeURIComponent(s)}`);

const index = [];
for (const p of paths) index.push(await grab(p));
writeFileSync(join(OUT, "index.json"), JSON.stringify(index, null, 2) + "\n", "utf8");

console.log(`recorded ${index.length} responses`);
console.log(`trainingSlugs=${JSON.stringify(trainingSlugs)}`);
console.log(`postSlugs=${JSON.stringify(postSlugs)}`);
for (const r of index) console.log(`  ${r.status} ${r.bytes.toString().padStart(7)}B  ${r.path}`);
