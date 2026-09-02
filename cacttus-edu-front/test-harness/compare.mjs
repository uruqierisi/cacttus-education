/*
 * compare.mjs <labelA> <labelB>
 *
 * Diffs two captured runs' DOM text. Exits non-zero on any difference — the gate the
 * App.tsx split was held to: any diff beyond whitespace means stop.
 *
 * Whitespace is already normalised away by serializeDom, so a reported difference is a
 * real change in tags, attributes or text.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { RUNS_DIR } from "./paths.mjs";

const [A, B] = process.argv.slice(2);
if (!A || !B) {
  console.error("usage: node compare.mjs <labelA> <labelB>");
  process.exit(2);
}

const dirA = join(RUNS_DIR, A, "dom");
const dirB = join(RUNS_DIR, B, "dom");
const files = readdirSync(dirA).sort();
let differing = 0;
let missing = 0;

for (const f of files) {
  const pb = join(dirB, f);
  if (!existsSync(pb)) {
    console.log(`MISSING in ${B}: ${f}`);
    missing++;
    continue;
  }
  const a = readFileSync(join(dirA, f), "utf8");
  const b = readFileSync(pb, "utf8");
  if (a === b) continue;
  differing++;
  const la = a.split("\n");
  const lb = b.split("\n");
  console.log(`\nDIFF ${f}  (${la.length} vs ${lb.length} lines)`);
  let shown = 0;
  for (let i = 0; i < Math.max(la.length, lb.length) && shown < 12; i++) {
    if (la[i] !== lb[i]) {
      console.log(`  L${i + 1}\n   - ${la[i] ?? "<eof>"}\n   + ${lb[i] ?? "<eof>"}`);
      shown++;
    }
  }
}

const extra = readdirSync(dirB).filter((f) => !existsSync(join(dirA, f)));
for (const f of extra) console.log(`EXTRA in ${B}: ${f}`);

console.log(`\n${files.length} captures compared | differing: ${differing} | missing: ${missing} | extra: ${extra.length}`);
process.exit(differing + missing + extra.length ? 1 : 0);
