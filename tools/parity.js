#!/usr/bin/env node
/*
 * vanilla.waves - tools/parity.js
 * Bewijst dat waves-core.js, vanilla.waves.js en vanilla.waves.min.js
 * bit-identieke wave-output geven (alle 34 waves × y/t, seed-fastpath, morph,
 * range, wild, sampler, closing-period), en dat de bundel de bronnen letterlijk
 * bevat. Deterministische paden alleen - shift gebruikt per-sessie-entropie en
 * valt daarbuiten (by design, canon-getrouw).
 * Draai:  node tools/parity.js   → exit 0 = groen, exit 1 = drift.
 */
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function loadIn(files) {
  // Minimale browser-achtige sandbox: de engine heeft document/matchMedia-guards.
  const sandbox = {
    console, Math, Number, Array, String, Object, JSON, performance,
    document: {
      readyState: 'loading',
      addEventListener() {},
      querySelectorAll() { return []; },
      createElement() { return { style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild(c) { return c; } }; }
    }
  };
  sandbox.globalThis = sandbox;
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const f of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
  }
  return sandbox;
}

const A = loadIn(['waves-core.js']).VanillaWaves;
const B = loadIn(['vanilla.waves.js']).VanillaWaves;
const C = loadIn(['vanilla.waves.min.js']).VanillaWaves;

let checks = 0, fails = 0;
function eq(label, a, b, c) {
  checks++;
  const same = (Number.isNaN(a) && Number.isNaN(b) && Number.isNaN(c)) || (a === b && b === c);
  if (!same) { fails++; console.log('FAIL', label, a, b, c); }
}

eq('count', A.count, B.count, C.count);
for (let i = 0; i < A.count; i++) {
  eq('name#' + i, A.list()[i].name, B.list()[i].name, C.list()[i].name);
}

const ys = [-137.7, -12.3, 0, 0.5, 7, 63.9, 200.1];
const ts = [0, 1.618, 42.42];
for (let w = 0; w < A.count; w++) {
  for (const y of ys) for (const t of ts) {
    const o = { wave: w, t, amplitude: 80, frequency: 0.7, phase: 0.3, seed: w * 3 + 1 };
    eq(`wave#${w} y${y} t${t}`, A.wave(y, o), B.wave(y, o), C.wave(y, o));
    const o2 = { wave: w, t, range: [-55, 55], seed: 9 };
    eq(`range#${w} y${y} t${t}`, A.wave(y, o2), B.wave(y, o2), C.wave(y, o2));
  }
}

for (let s = 0; s < 40; s++) eq('seedfast#' + s, A.wave(11.1, s), B.wave(11.1, s), C.wave(11.1, s));
eq('namefast', A.wave(5, 'triangle'), B.wave(5, 'triangle'), C.wave(5, 'triangle'));

for (const mix of [0, 0.25, 0.5, 1]) {
  const o = { wave: ['sine', 'batman'], mix, t: 2.2, amplitude: 60 };
  eq('morph mix ' + mix, A.wave(3.3, o), B.wave(3.3, o), C.wave(3.3, o));
}

for (const u of [0.2, 0.8]) {
  const o = { wave: 'meta sine', mode: 'wild', unpredictability: u, t: 1.5, seed: 5 };
  eq('wild u' + u, A.wave(17.5, o), B.wave(17.5, o), C.wave(17.5, o));
}

const mk = (W) => W.createSampler({ wave: 'wobble sine', range: [-50, 50], frequency: 1.3 });
const sa = mk(A), sb = mk(B), sc = mk(C);
for (const y of ys) for (const t of ts) eq(`sampler y${y} t${t}`, sa.sample(y, t), sb.sample(y, t), sc.sample(y, t));

const mkM = (W) => W.createSampler({ wave: ['triangle', 'noise'], seed: 7 });
const ma = mkM(A), mb = mkM(B), mc = mkM(C);
for (const mix of [0, 0.4, 1]) eq('samplermorph ' + mix, ma.sample(2, 1, mix), mb.sample(2, 1, mix), mc.sample(2, 1, mix));

const mkC = (W) => W.createSampler({ group: 'closing', shift: true });
eq('closing period', mkC(A).period, mkC(B).period, mkC(C).period);

// Structureel: bundel bevat de bronnen letterlijk; engine-API aanwezig.
const strip = (s) => s.replace(/^﻿/, '').trim();
const bunSrc = fs.readFileSync(path.join(ROOT, 'vanilla.waves.js'), 'utf8');
const okCore = bunSrc.includes(strip(fs.readFileSync(path.join(ROOT, 'waves-core.js'), 'utf8')));
const okEng  = bunSrc.includes(strip(fs.readFileSync(path.join(ROOT, 'engine.js'), 'utf8')));
if (!okCore) { fails++; console.log('FAIL bundel bevat waves-core.js niet letterlijk'); }
if (!okEng)  { fails++; console.log('FAIL bundel bevat engine.js niet letterlijk'); }
checks += 2;
for (const [name, W] of [['bundle', B], ['min', C]]) {
  checks++;
  if (typeof W.register !== 'function' || typeof W.init !== 'function' || typeof W.destroy !== 'function') {
    fails++; console.log('FAIL engine-API ontbreekt in ' + name);
  }
}

console.log(`\nParity: ${checks - fails}/${checks} identiek over core / bundle / min`);
process.exit(fails ? 1 : 0);
