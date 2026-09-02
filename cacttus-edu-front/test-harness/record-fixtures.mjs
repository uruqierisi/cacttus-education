/* One-shot recorder: saves every GET /api/public/** response the site can issue,
   as raw bytes, so baseline and post-split runs compare against identical data. */
import { writeFileSync, mkdirSync } from "node:fs";
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

// Every form slug the site can ask for: the four in forms.config.ts plus whatever
// each training's detail payload links to.
const formSlugs = new Set([
  "aplikim-studime-profesionale",
  "kontakt",
  "kontakt-biznesi",
  "rezervo-klase",
]);
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
