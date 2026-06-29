/*!
 * vanilla.waves — build.mjs
 * Reproduceerbare build: bundelt waves-core.js + engine.js tot vanilla.waves.js
 * en minificeert dat tot vanilla.waves.min.js met terser. Geen runtime-deps;
 * terser is een dev-tool (npx). Pas NOOIT de gegenereerde bestanden met de hand
 * aan — wijzig de bron (waves-core.js / engine.js) en draai `node build.mjs`.
 *
 * De math in waves-core.js blijft byte-getrouw aan de canonieke p5.waves-core;
 * deze build raakt die niet aan, enkel concatenatie + minificatie.
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const HEADER =
`/*!
 * vanilla.waves — gebundelde build (waves-core.js + engine.js).
 * GEGENEREERD — niet met de hand bewerken; pas de bronbestanden aan en hergenereer.
 * Zero-dependency vanilla-JS port van het p5.waves-dialect + DOM-engine.
 */
`;

const stripBom = (s) => s.replace(/^﻿/, '');
const core   = stripBom(fs.readFileSync('waves-core.js', 'utf8'));
const engine = stripBom(fs.readFileSync('engine.js', 'utf8'));

const bundle = HEADER + core.trimEnd() + '\n\n' + engine.trimEnd() + '\n';
fs.writeFileSync('vanilla.waves.js', bundle);
console.log('wrote vanilla.waves.js  (' + bundle.length + ' bytes)');

execSync(
  'npx --no-install terser vanilla.waves.js --compress --mangle --comments "/^!/" --output vanilla.waves.min.js',
  { stdio: 'inherit' }
);
const min = fs.statSync('vanilla.waves.min.js').size;
console.log('wrote vanilla.waves.min.js  (' + min + ' bytes)');
