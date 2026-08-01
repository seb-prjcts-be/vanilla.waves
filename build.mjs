/*!
 * vanilla.waves — build.mjs
 * Reproduceerbare build: bundelt waves-core.js + engine.js tot vanilla.waves.js
 * en minificeert dat tot vanilla.waves.min.js met terser. Geen runtime-deps;
 * terser is een dev-tool (npx). Pas NOOIT de gegenereerde bestanden met de hand
 * aan — wijzig de bron (waves-core.js / engine.js) en draai `node build.mjs`.
 *
 * De math in waves-core.js blijft byte-getrouw aan de canonieke p5.waves-core;
 * deze build raakt die niet aan, enkel concatenatie + minificatie. Bewijs dat de
 * output klopt: `node check-parity.mjs` (gedrag identiek aan de core) en
 * `node check-docs.mjs`.
 *
 * terser bewaart `/*!`-banners standaard (de `!` markeert ze als belangrijk),
 * dus geen --comments-vlag nodig: dat vermijdt shell-quoting-gedoe.
 * License: MIT · seb@prjcts
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
const core   = stripBom(fs.readFileSync('waves-core.js', 'utf8')).trimEnd();
const engine = stripBom(fs.readFileSync('engine.js', 'utf8')).trimEnd();

const bundle = HEADER + core + '\n\n' + engine + '\n';
fs.writeFileSync('vanilla.waves.js', bundle);
console.log('wrote vanilla.waves.js  (' + bundle.length + ' chars)');

execSync('npx --no-install terser vanilla.waves.js --compress --mangle --output vanilla.waves.min.js', { stdio: 'inherit' });
console.log('wrote vanilla.waves.min.js  (' + fs.statSync('vanilla.waves.min.js').size + ' bytes)');
