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
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

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
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vanilla.waves-build-'));
const tempBundle = path.join(tempDir, 'vanilla.waves.js');
const tempMinified = path.join(tempDir, 'vanilla.waves.min.js');
const terserArgs = [
  '--yes', '--package', 'terser@5.49.0', 'terser', tempBundle,
  '--compress', '--mangle', '--output', tempMinified
];

try {
  fs.writeFileSync(tempBundle, bundle);
  if (process.platform === 'win32') {
    const npxCli = path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js');
    execFileSync(process.execPath, [npxCli, ...terserArgs], { stdio: 'inherit' });
  } else {
    execFileSync('npx', terserArgs, { stdio: 'inherit' });
  }

  fs.renameSync(tempBundle, 'vanilla.waves.js');
  fs.renameSync(tempMinified, 'vanilla.waves.min.js');
  console.log('wrote vanilla.waves.js  (' + bundle.length + ' chars)');
  console.log('wrote vanilla.waves.min.js  (' + fs.statSync('vanilla.waves.min.js').size + ' bytes)');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
