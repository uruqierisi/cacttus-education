/* Usage: node bundle.mjs <label>  — summarises cacttus-edu-front/dist */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { DIST_DIR as DIST, RUNS_DIR as ROOT } from "./paths.mjs";
const label = process.argv[2];
const files = readdirSync(join(DIST, "assets"));
const code = files.filter((f) => /\.(js|css)$/.test(f)).sort();
const assets = files.filter((f) => !/\.(js|css)$/.test(f));
const strip = (f) => f.replace(/-[A-Za-z0-9_-]{8}(\.\w+)$/, "$1");
const chunks = code.map((f) => {
  const buf = readFileSync(join(DIST, "assets", f));
  return { name: strip(f), raw: buf.length, gzip: gzipSync(buf).length };
});
const assetBytes = assets.reduce((n, f) => n + statSync(join(DIST, "assets", f)).size, 0);
const out = {
  chunkCount: chunks.length,
  chunks,
  codeRawTotal: chunks.reduce((n, c) => n + c.raw, 0),
  codeGzipTotal: chunks.reduce((n, c) => n + c.gzip, 0),
  staticAssetCount: assets.length,
  staticAssetBytes: assetBytes,
};
mkdirSync(join(ROOT, label), { recursive: true });
writeFileSync(join(ROOT, label, "bundle.json"), JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`chunks: ${out.chunkCount}`);
for (const c of chunks) console.log(`  ${c.name.padEnd(14)} ${String(c.raw).padStart(8)}B raw  ${String(c.gzip).padStart(7)}B gzip`);
console.log(`code raw ${out.codeRawTotal}B | code gzip ${out.codeGzipTotal}B | static assets ${out.staticAssetCount} files / ${out.staticAssetBytes}B`);
