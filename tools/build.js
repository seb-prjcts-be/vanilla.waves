#!/usr/bin/env node
/*
 * vanilla.waves - tools/build.js
 * Genereert de bundels uit de bronbestanden, reproduceerbaar:
 *   vanilla.waves.js      = header + waves-core.js + engine.js (leesbaar)
 *   vanilla.waves.min.js  = idem, geminified via terser (npx)
 * Draai:  node tools/build.js
 * Draai daarna altijd:  node tools/parity.js   (bit-identiek bewijs)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
// BOM strippen: een BOM midden in een bundel is een parse-risico.
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^﻿/, '').trim();

const HEADER = [
  '/*!',
  ' * vanilla.waves - gebundelde build (waves-core.js + engine.js).',
  ' * GEGENEREERD - niet met de hand bewerken; draai: node tools/build.js',
  ' * Zero-dependency vanilla-JS port van het p5.waves-dialect + DOM-engine.',
  ' */',
  ''
].join('\r\n');

const bundle = HEADER + read('waves-core.js') + '\r\n\r\n' + read('engine.js') + '\r\n';
fs.writeFileSync(path.join(ROOT, 'vanilla.waves.js'), bundle);
console.log('vanilla.waves.js      ' + bundle.length + ' bytes');

// terser houdt /*!-commentaren (licenties) standaard vast
execFileSync('npx', ['--yes', 'terser', 'vanilla.waves.js', '-c', '-m', '-o', 'vanilla.waves.min.js'],
  { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' });
console.log('vanilla.waves.min.js  ' +
  fs.statSync(path.join(ROOT, 'vanilla.waves.min.js')).size + ' bytes');
console.log('\nNu verifiëren:  node tools/parity.js');
