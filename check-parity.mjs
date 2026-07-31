/*!
 * vanilla.waves - check-parity.mjs
 * Bewijst dat de GEGENEREERDE bundels dezelfde getallen geven als de canonieke
 * math in waves-core.js. Vangt de bug-klasse "iemand paste de core aan en
 * vergat te herbouwen", of omgekeerd "de bundel liep vooruit op de core".
 *
 *   node check-parity.mjs
 *
 * Laadt elk bestand in een EIGEN vm-context met een minimale DOM-stub, zodat de
 * drie kopieen elkaars globals niet overschrijven. Geen dependencies.
 * License: MIT · seb@prjcts
 */

import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

// ─── Minimale DOM-stub: genoeg om de engine te laten laden, niets meer ───────
function loadInSandbox(file) {
  const noop = () => {};
  const sandbox = {
    console,
    performance,
    Math,
    Date,
    document: {
      readyState: 'complete',
      addEventListener: noop,
      createElement: () => ({ style: {}, classList: { add: noop, remove: noop } }),
      querySelectorAll: () => []
    },
    window: undefined,
    requestAnimationFrame: noop,
    cancelAnimationFrame: noop,
    matchMedia: () => ({ matches: false, addEventListener: noop }),
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
    Element: class {},
    NodeList: class {},
    HTMLElement: class {}
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  createContext(sandbox);
  runInContext(readFileSync(file, 'utf8'), sandbox, { filename: file });
  const W = sandbox.VanillaWaves;
  if (!W || typeof W.createSampler !== 'function') throw new Error(`${file}: no VanillaWaves`);
  return W;
}

const targets = {
  'waves-core.js':        loadInSandbox('waves-core.js'),
  'vanilla.waves.js':     loadInSandbox('vanilla.waves.js'),
  'vanilla.waves.min.js': loadInSandbox('vanilla.waves.min.js')
};

const ref = targets['waves-core.js'];
const names = ref.list();

// ─── De vergelijkingen ───────────────────────────────────────────────────────
const cases = [];
for (const name of names) {
  for (let i = 0; i < 40; i++) {
    const x = i * 3.7 - 40;
    cases.push({ label: `wave ${name}`, x, opts: { wave: name, amplitude: 100 } });
    cases.push({ label: `range ${name}`, x, opts: { wave: name, range: [-7, 13], t: 2.5 } });
  }
}
for (let i = 0; i < 200; i++) {
  const x = i * 1.13;
  cases.push({ label: 'morph', x, opts: { wave: ['classic sine', 'mountain peaks'], mix: (i % 11) / 10 } });
  cases.push({ label: 'wild', x, opts: { wave: 'noise', mode: 'wild', unpredictability: 0.7, seed: i } });
  cases.push({ label: 'seed pick', x, opts: { seed: i, t: i * 0.31 } });
}

let checks = 0;
const failures = [];

for (const [file, W] of Object.entries(targets)) {
  if (W === ref) continue;

  if (W.count !== ref.count) failures.push(`${file}: count ${W.count} vs ${ref.count}`);
  if (W.list().join('|') !== names.join('|')) failures.push(`${file}: wave name list differs`);

  for (const c of cases) {
    const a = ref.wave(c.x, c.opts);
    const b = W.wave(c.x, c.opts);
    checks++;
    if (!Object.is(a, b)) {
      failures.push(`${file}: ${c.label} @ x=${c.x} -> ${b}, expected ${a}`);
      if (failures.length > 20) break;
    }
  }

  // samplers, inclusief de closing-periode
  for (const name of names) {
    const sa = ref.createSampler({ wave: name, range: [0, 1] });
    const sb = W.createSampler({ wave: name, range: [0, 1] });
    checks++;
    if (!Object.is(sa.period, sb.period)) failures.push(`${file}: period ${name} -> ${sb.period}, expected ${sa.period}`);
    for (let i = 0; i < 25; i++) {
      const x = i * 2.9, t = i * 0.4;
      checks++;
      if (!Object.is(sa.sample(x, t), sb.sample(x, t))) {
        failures.push(`${file}: sampler ${name} @ (${x}, ${t})`);
        break;
      }
    }
  }
}

// ─── Rapport ─────────────────────────────────────────────────────────────────
console.log(`core   : ${ref.count} waves`);
for (const [f, W] of Object.entries(targets)) if (W !== ref) console.log(`bundle : ${f} -> ${W.count} waves`);
console.log('');

if (failures.length === 0) {
  console.log(`parity OK - ${checks} checks, bundles bit-identical to waves-core.js.`);
  process.exit(0);
}
console.log(`parity FAILED - ${failures.length} mismatch(es) over ${checks} checks:\n`);
for (const f of failures.slice(0, 20)) console.log('  ' + f);
console.log('\nRegenerate the bundles from waves-core.js + engine.js before shipping.');
process.exit(1);
