# vanilla.waves

## Missie
Het wave-dialect als **pure vanilla-JS port** — geen p5, geen canvas. Levert twee dingen:
(a) de wave-**math** (sampler, wave-formules, groups gentle/harsh/closing, shift/mix/seed), en
(b) een lichte **DOM-engine** (gedeelde rAF-loop met FPS-cap, IntersectionObserver-pauze,
reduced-motion, `register/init/destroy`, helpers).
Parallel aan `p5.waves` (p5/canvas) en `processing.waves` (Java): zelfde dialect, andere runtime.
Dit is de **bib/motor** — concrete componenten leven in `vanilla.waves_elements`.

## Boom
- waves-core.js        → math: createSampler(), wave-formules, groups, shift/mix/seed
- engine.js           → gedeelde rAF-loop, IO-pauze, reduced-motion, register/init/destroy, helpers (norm/num/el)
- vanilla.waves.js    → bundelt core + engine, exposeert global `VanillaWaves` (alias `vWaves`)
- vanilla.waves.min.js→ CDN-build (jsDelivr-gh, getagd zoals p5.waves)
- docs/waves.feature.md→ changedoc: port-gap-analyse + drift-watch t.o.v. canonieke p5.waves-manifest
- index.html        → live demo's (GitHub Pages)
- README.md / LICENSE (MIT) / cloud.md

## Regels
- **Zero runtime-dependencies.** De math leeft HIER (eigen port), niet via een p5.waves-script.
  → anders is het geen echte bib maar een plugin. **BESLIST 2026-06-29** ("eerst bib, dan plugin" impliceert dat de bib de math bezit).
- Het is een PORT van het dialect → moet **in sync** blijven met de canonieke p5.waves-core.
  Drift = bug. `processing.waves` is het precedent voor "zelfde dialect, los onderhouden".
- De engine kent **geen** concrete componenten. Core blijft puur; elements importeren de core, nooit omgekeerd.
- Naamgeving: CSS-prefix `wv-`, custom-elements met koppelteken (`<wave-loader>`). **Nooit punten** in class/element-namen (`p5.waves.loader` werkt niet als selector).

## Notities
- 2026-06-29: opzet gestart. Twee aparte repos: `vanilla.waves` (deze, core) + `vanilla.waves_elements`.
- 2026-06-29: bewust NIET mengen met `p5.waves_snippets` (dat blijft p5/canvas-catalogus, eigen rework).
- 2026-06-29: BESLIST — math zelf porten (**zero-dep**), niet leunen op p5.waves' sampler. Volgt uit "eerst bib, dan plugin".
- 2026-06-29: consolidatiebron = `building_blocks_elements`: `wel.js` (engine + helpers + register-patroon), `waves-loader.js` (loop + IO). Die kern hieruit destilleren.
- 2026-06-29: canonieke baseline vastgelegd in docs/waves.feature.md op p5.waves v3.4.0 / commit 6ce959e / 34 waves (via manifest). Die doc is dé checklist om de port tegen af te bouwen + drift te bewaken.
- 2026-06-29: wekelijkse routine `waves-dialect-drift-watch` (ma, cron **03:14** = π; feitelijke dispatch ~03:22 door scheduler-jitter; report-only) bewaakt canon ↔ taal-ports. Draait enkel als de Claude-app open is.
- 2026-06-29: BESLIST — **shift-entropie = canon-getrouw** (per-page-load toeval, default aan), zoals p5.waves. Geen determinisme-modus voor nu. Reden (Seb): de per-load-variatie is rijker dan een vaste reeks; binnen één sessie is het gedrag identiek aan determinisme.
- 2026-06-29: ✅ `waves-core.js` KLAAR. Vondst: canonieke p5.waves-math is al puur vanilla → port = canonieke kern byte-getrouw, enkel de 8 p5-prototype-regels weg, eigen global (VanillaWaves/vWaves/Waves-drop-in). Bit-identiek geverifieerd (1009/1009 parity-checks tegen v3.4.0).
- 2026-06-29: ✅ `engine.js` KLAAR (gedeelde rAF-loop 30fps + IO-pauze + register/init/destroy + helpers, uit `wel.js`). Pipeline deterministisch geverifieerd (register→init→create→update→destroy). Augmenteert de VanillaWaves-global; marker = `data-wv`, klasse `wv--ready`.
- 2026-06-29: ✅ `vanilla.waves.js` gegenereerd (bundel core+engine, niet met de hand bewerken).
- 2026-06-29: ✅ `.min.js` gegenereerd (terser, bit-identiek geverifieerd 1009/1009). README + LICENSE (MIT) + live demo `index.html` toegevoegd.
- 2026-06-29: ✅ GEPUBLICEERD — repo `github.com/seb-prjcts-be/vanilla.waves`, tag **v0.1.0**. jsDelivr live (HTTP 200): `cdn.jsdelivr.net/gh/seb-prjcts-be/vanilla.waves@v0.1.0/vanilla.waves.min.js`. GitHub Pages aan: `seb-prjcts-be.github.io/vanilla.waves/`. Dialect-baseline p5.waves v3.4.0.
- 2026-06-29: AUDIT (Seb, read-only) bracht 3 engine-bugs aan het licht → branch `fix/engine-robustness` (commit 76198a0), bewijs-eerst-flow: (#1) `destroy()` ruimde renderer-DOM niet op → re-init dupliceerde; nu disposer-hook `destroy(state,node)` + verwijdert enkel wat `create()` toevoegde. (#2) `aria-hidden` werd hard op élk `[data-wv]` gezet; nu conditioneel + opt-out `data-decorative="false"`. (#3) niet-numerieke `data-seed` → engine-starttijd NaN → statisch; nu seed/speed gesaniteerd (hash). RED→GREEN bewezen tegen de écht verscheepte `.min.js` in een `node:vm`-sandbox (repro in C:\tmp\waves-repro, wegwerpbaar). Core/math NIET aangeraakt → pariteit intact (34 waves finite).
- 2026-06-29: ✅ `build.mjs` toegevoegd (was er niet — jouw #5): reproduceerbare bundel-build (concat core+engine → terser). Raakt math niet aan. Min kromp 28k→16k (terser-config nu canoniek vastgelegd). NB: `waves-core.js:24` verwijst nog naar niet-getrackte `tests/snapshot.js` — aparte beslissing (harness toevoegen óf claim verzachten).
- NOG OPEN: #4 (console-"onbekend type"-ruis, werkt wel) + #6 (`Waves.data` mutable/`count` statisch, core/by-design) niet gefixt. Pages-werk (showcase/examples/guide/about) leeft op aparte branch `claude/tender-elgamal-d720f5`. Warme-tint-familie (vanille/koffie/?) = open ontwerpkeuze, prompt-spec klaar maar niet uitgevoerd.
- VOLGENDE STAP: `vanilla.waves_elements` (eerste element: `loader`, uit `waves-loader.js`), gebouwd op de gepubliceerde engine.
