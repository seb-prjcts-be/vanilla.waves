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
- 2026-06-29: VONDST identiteit — p5.waves én processing.waves draaien op een **byte-identieke** `style.css` (canon B&W, Oswald/Inter, géén `--accent`; accent = zwart #000). Ports onderscheiden zich NIET op chrome-kleur, enkel op **taal/vocabulaire** (jar vs script vs DOM) + een eigen naam voor de hallmark-pagina (Curation Engine → Signal Loom). Kleur leeft alleen ín de sketches/elementen.
- 2026-06-29: BESLIST (Seb) — vanilla.waves pages = **strikt monochrome canon** (geen warme tint, geen rood in de chrome); taal geswapt naar DOM-runtime ("Zero-dependency DOM port", "One script tag. No build step.", `data-wv`). De oude warme `index.html` (#d9d8d2/#14140f/#ff2e2e + Courier overal) was drift → vervangen door canon-tokens.
- 2026-06-29: ✅ PAGES + EXAMPLES gebouwd (p5.waves-structuur gespiegeld): `docs/style.css` (canon + `wv-`-elementlaag), nieuwe `index.html` (showcase, hero-stage = live bar-meter), `docs/examples.html` (gallery, 9 secties), `docs/examples.js` (gedeelde renderers), `examples/<slug>/` standalone (one_number, bar_meter, slider_stack, checkbox_field, progress_morph, glyph_field, radial_loader, chip_walkers, text_loader). Visueel geverifieerd via preview (console clean). Bug gevonden+gefixt: `.wv-eq span` had geen `height` → 0px onder `align-items:flex-end`.
- 2026-06-29: CONCEPT — examples = **herkenbare DOM-elementen wave-gedreven** (range-input, `<progress>`, checkbox-grid, tekstnode, knop). `docs/examples.js` is de levende **seed voor de `vanilla.waves_elements`-CDN**: elke demo is een geregistreerd `data-wv`-type. Renderers leven NIET in core/engine (boundary bewaakt).
- 2026-06-29: ✅ `docs/guide.html` + `docs/about.html` toegevoegd (canon prose-stijl, DOM-runtime taal: install = 1 tag, declaratief `data-wv` vs imperatief `createSampler`, optie-tabel, 34 waves, engine-API, build-your-own-type; about = 3-runtime-lineage + math/engine-architectuur + boundary). Nav (Guide/About) overal gewired. Tab-hidden zet rAF op pauze (verwacht; geen bug). Commits 2f0baee + 08a207c op branch claude/tender-elgamal-d720f5.
- VOLGENDE STAP: `vanilla.waves_elements` als eigen repo/CDN — destilleer de `data-wv`-types uit `docs/examples.js` (begin met `loader`/`eq`), gebouwd op de gepubliceerde engine. Optioneel: eigen naam voor de hallmark-pagina (bv. "Element Foundry") + waves-referentiepagina (`docs/waves.html`).
