/**
 * Bundle size gate.
 *
 * The widget ships to third-party sites as a blocking-adjacent asset, so its
 * size is a product constraint rather than a vanity metric. This fails the
 * build when the gzipped bundle crosses the budget, because a limit nobody
 * enforces is a limit that quietly stops being true.
 *
 * Run from the repo root or from packages/core — both work.
 */
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUDGET_KB = 15;

const target = resolve(ROOT, 'packages/core/dist/shakuf.js');

if (!existsSync(target)) {
  console.error(`\n  no bundle at ${target}\n  run \`npm run build\` first\n`);
  process.exit(1);
}

const raw = readFileSync(target);
const gz = gzipSync(raw, { level: 9 }).length;
const br = brotliCompressSync(raw).length;
const kb = (n) => (n / 1024).toFixed(2);
const budget = BUDGET_KB * 1024;
const pct = ((gz / budget) * 100).toFixed(0);

console.log('');
console.log(`  raw     ${kb(raw.length).padStart(7)} KB`);
console.log(`  gzip    ${kb(gz).padStart(7)} KB   ${pct}% of ${BUDGET_KB} KB budget`);
console.log(`  brotli  ${kb(br).padStart(7)} KB`);
console.log('');

if (gz > budget) {
  console.error(`  OVER BUDGET by ${kb(gz - budget)} KB\n`);
  process.exit(1);
}

console.log(`  ${kb(budget - gz)} KB of headroom\n`);
