# vanilla.waves

**The wave dialect, without p5 and without a canvas.** A zero-dependency,
vanilla-JS port of [p5.waves](https://github.com/seb-prjcts-be/p5.waves): the
same `wave()` / `createSampler()` math, plus a tiny DOM engine that drives plain
HTML elements instead of a `<canvas>`.

```
p5.waves         the dialect for p5.js / canvas
processing.waves the dialect for Processing / Java
vanilla.waves    the dialect for plain DOM/CSS, zero dependencies   (you are here)
```

- **Zero dependencies.** No p5, no canvas, no build step. One `<script>`.
- **Bit-identical math.** The sampler returns the exact same numbers as
  p5.waves v3.4.0, verified across 1009 parity checks (all 34 waves, morph,
  range, wild, sampler).
- **DOM engine included.** Register an element type, mark it with `data-wv`,
  and one shared 30 fps loop animates it; offscreen elements pause
  automatically.
- **Respects `prefers-reduced-motion`:** renders one static frame instead of
  animating.

---

## Why this exists

The p5.waves *math* never actually needed p5. Look at the source: `wave()`,
`createSampler()`, the 34 wave formulas, the seeded shift/morph engine, all of
it is pure `Math.*`. The only p5 touchpoint is an 8-line prototype hook at the
bottom of the file.

`vanilla.waves` is that canonical core, byte-for-byte, with the p5 hook removed
and a DOM engine bolted on. So you get the full wave dialect, the same
breathing, shifting, morphing motion, to drive **loaders, backgrounds, text
fields, meters, any DOM element**, with nothing else loaded.

---

## Install

### CDN (jsDelivr): one tag, everything

```html
<script src="https://cdn.jsdelivr.net/gh/seb-prjcts-be/vanilla.waves@v0.1.0/vanilla.waves.min.js"></script>
```

That bundle is `waves-core.js` (the math) plus `engine.js` (the DOM loop). Want
just the math? Load `waves-core.js` on its own.

### Local

Copy `vanilla.waves.min.js` (or `vanilla.waves.js` for the readable build) next
to your HTML and point a `<script>` at it. No npm, no bundler.

---

## Quick start

### 1. Just the math

`VanillaWaves` (alias `vWaves`, and `Waves` as a drop-in when p5.waves isn't
present) exposes the dialect:

```js
// one value in, one value out: always a number
VanillaWaves.wave(x, { wave: 'mountain peaks', t: performance.now() / 1000, amplitude: 80 });

// a reusable sampler (cheaper for many calls per frame)
const s = VanillaWaves.createSampler({ shift: true, range: [-50, 50] });
s.sample(x, t);          // position + time
s.waveName;              // "mountain peaks"  (live getter)
```

Drive any DOM property with it: a bar height, a hue, a transform:

```js
const s = VanillaWaves.createSampler({ seed: 13, range: [0, 100] });
function tick(now) {
  bar.style.height = s.sample(0, now / 1000) + '%';
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

### 2. The DOM engine

Register an element *type* once, then mark elements with `data-wv="<type>"`.
The shared loop calls your `update` every frame; offscreen elements pause.

```html
<div data-wv="bars" data-seed="13" data-count="20"></div>

<script src="vanilla.waves.min.js"></script>
<script>
  VanillaWaves.register('bars', {
    create(node, opts, h) {
      const n = h.num(opts.count, 16);
      const bars = [];
      for (let i = 0; i < n; i++) bars.push(node.appendChild(h.el('span')));
      return { bars, sampler: h.makeSampler() };   // state
    },
    update(state, t) {                              // every frame
      state.bars.forEach((b, i) => {
        // sampler value mapped to a scaleY
        const v = 0.1 + state.sampler.sample(i * 0.5, t) * 0.9;
        b.style.transform = 'scaleY(' + v.toFixed(3) + ')';
      });
    }
  });
  // auto-inits on DOMContentLoaded. Register types BEFORE that, or call
  // VanillaWaves.init() again after registering types / adding nodes.
</script>
```

When the work is done (e.g. content finished loading), stop and clean up:

```js
VanillaWaves.destroy(myElement);   // or a selector, NodeList, or nothing for all
```

`destroy` removes **only the nodes your `create` added** (pre-existing author
content is left intact), runs your optional `destroy(state, node)` disposer if
you defined one, restores `aria-hidden`, and stops the shared loop once the last
element is gone — so `destroy()` followed by `init()` re-renders cleanly instead
of duplicating children.

---

## API

### Math (identical to p5.waves)

| Call | Returns |
|---|---|
| `VanillaWaves.wave(y)` | default wave, frozen |
| `VanillaWaves.wave(y, 3)` | **seed** 3 (hashed to a wave) |
| `VanillaWaves.wave(y, 'triangle')` | wave by name |
| `VanillaWaves.wave(y, { ... })` | full options (below) |
| `VanillaWaves.createSampler({ ... })` | a sampler object |
| `VanillaWaves.list()` / `.count` / `.data` | discover the 34 waves at runtime |

**Options** (all optional): `wave` (name / index / `[a,b]` to morph), `t`,
`amplitude` (default 100), `range` `[min,max]` (overrides amplitude),
`frequency` (1), `phase` (0), `seed` (0), `mode` `'stable'`/`'wild'`,
`unpredictability` (0..1, wild only), `mix` (0..1, for morph), `shift` (bool),
`group` `'gentle'`/`'harsh'`/`'closing'`/`'all'`/array, `shiftInterval` (3),
`shiftDuration` (1).

**Sampler:** `sample(y)`, `sample(y, t)`, `sample(y, t, mix)`. Live getters:
`waveName`, `targetName`, `shifting`, `mix`, `period`, `targetPeriod`.

> **Note:** `shift` is **not** deterministic across page loads. A per-session
> random offset is mixed in, so the same `seed` yields a different wave
> *sequence* on every reload (identical within one session). This is faithful to
> p5.waves and intentional: the per-load variation is richer than a fixed
> sequence.

### Engine (vanilla.waves only)

| Call | Does |
|---|---|
| `VanillaWaves.register(name, { create, update?, destroy? })` | define an element type |
| `VanillaWaves.init(target?)` | wire up `[data-wv]` (or a selector / element / NodeList) |
| `VanillaWaves.destroy(target?)` | stop and clean up |

`create(node, opts, helpers)` returns your state object; `update(state, t)`
mutates the DOM each frame; optional `destroy(state, node)` releases any
resources you allocated (timers, listeners). **Helpers:** `makeSampler(extra?)`
(a sampler with element-friendly defaults), `norm(v)` (maps about [-1,1] to
[0,1]), `num(v, default)`, `el(tag, class?)`.

**Conventions:** marker attribute `data-wv`, ready class `wv--ready`, shared loop
at 30 fps, `data-*` attributes become `opts`, `data-speed` scales time. CSS
class and element names use a `wv-` prefix, never dots (`p5.waves.loader` is not
a valid selector).

**Accessibility & seeds.** Decorative elements get `aria-hidden="true"`
automatically. If a `data-wv` element carries meaning, opt out with
`data-decorative="false"` (or set your own `aria-hidden`) and the engine leaves
it alone. `data-seed` may be any string — non-numeric seeds are hashed to a
stable start offset, so they animate just like numeric ones.

---

## Parity and drift

`waves-core.js` is the canonical `p5.waves.js` math with only the p5 prototype
hook removed. It tracks p5.waves as the source of truth; a weekly drift-watch
routine compares the two so the port can never silently fall behind. See
[`docs/waves.feature.md`](docs/waves.feature.md).

Dialect baseline: **p5.waves v3.4.0** (commit `6ce959e`, 34 waves).

---

## Project layout

```
waves-core.js        the math (zero-dep port of p5.waves)
engine.js            the DOM engine (shared loop, register/init/destroy)
build.mjs            regenerates the two bundles from the sources
vanilla.waves.js     generated bundle (core + engine, readable)
vanilla.waves.min.js generated bundle, minified, the CDN artifact
docs/waves.feature.md port-coverage + drift-watch changedoc
index.html           live demos
```

**Build.** The two `vanilla.waves(.min).js` files are generated — never edit them
by hand. Change `waves-core.js` or `engine.js`, then run `node build.mjs` (uses
`terser` via `npx`; no runtime dependencies). The build only concatenates +
minifies; it never alters the math, so parity with the canonical p5.waves core
is preserved by construction.

The element library (loaders, controls, draggables) lives in a separate
package, **vanilla.waves_elements**, built on this engine.

---

## License

MIT, Sebastien Vanblaere ([seb@prjcts](https://github.com/seb-prjcts-be))
