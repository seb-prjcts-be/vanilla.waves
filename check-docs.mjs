/*!
 * vanilla.waves - check-docs.mjs
 * Vangt de bug-klasse "de docs beweren een aantal dat de code niet meer heeft".
 * Leest de ECHTE aantallen uit de verscheepte library en vergelijkt die met elk
 * getal-claim in de HTML. Faalt met exit 1 zodra er eentje niet klopt.
 *
 *   node check-docs.mjs
 *
 * Draai dit na ELKE dialect-wijziging, samen met de build. Geen dependencies.
 * License: MIT · seb@prjcts
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import './waves-core.js';

const W = globalThis.VanillaWaves;

// ─── De waarheid, gemeten uit de code (niet overgetypt) ──────────────────────
const total = W.count;

const poolSize = (group) => {
  const seen = new Set();
  for (let seed = 0; seed < 4000; seed++) seen.add(W.createSampler({ seed, group }).waveName);
  return seen.size;
};

let periodic = 0;
for (const w of W.data) if (W.createSampler({ wave: w.name }).period != null) periodic++;

const truth = new Map([
  [total,             'total waves'],
  [poolSize('gentle'), 'gentle pool'],
  [poolSize('harsh'),  'harsh pool'],
  [poolSize('closing'),'closing pool'],
  [poolSize('ghost'),  'ghost pool'],
  [periodic,           'waves with a measured period'],
  [total - periodic,   'waves without a period']
]);

// ─── Elke "<n> waves/shapes"-claim in de HTML ────────────────────────────────
const files = ['index.html', ...readdirSync('docs').filter(f => f.endsWith('.html')).map(f => join('docs', f))];
const CLAIM = /\b(\d{1,3})\s+(shapes|waves|wave formulas|wave shapes)\b/g;

const problems = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(CLAIM)) {
    const n = Number(m[1]);
    if (truth.has(n)) continue;
    const line = text.slice(0, m.index).split('\n').length;
    problems.push({ file, line, claim: `${m[1]} ${m[2]}` });
  }
}

// ─── Rapport ─────────────────────────────────────────────────────────────────
console.log('measured from the shipped library:');
for (const [n, what] of truth) console.log(`  ${String(n).padStart(3)}  ${what}`);
console.log('');

if (problems.length === 0) {
  console.log(`docs-check OK - every claim across ${files.length} pages matches the library.`);
  process.exit(0);
}

console.log(`docs-check FAILED - ${problems.length} claim(s) match no real count:\n`);
for (const p of problems) console.log(`  ${p.file}:${p.line}  "${p.claim}"`);
console.log('\nFix the prose, or add the number to the measured set if it is genuinely new.');
process.exit(1);
