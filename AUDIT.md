# Audit vanilla.waves - 2026-07-02

Volledige doorlichting van map + repo (branch `claude/elastic-bell-9ef047`).
Geverifieerd met een echte Node-parity-run en live browser-inspectie, niet op
het oog. Status per item: ⬜ open · ✅ opgelost (verwerkt op 2026-07-02, zelfde
sessie).

## Wat bewezen goed zit

- **Parity-checks identiek** over `waves-core.js` → `vanilla.waves.js`
  → `vanilla.waves.min.js` (alle 34 waves × y/t, seed-fastpath, morph, range,
  wild, sampler, closing-period). Na de fixes hieronder opnieuw gedraaid met de
  in-repo test: **1539/1539 groen**. De bundels bevatten core + engine
  letterlijk; geen drift.
- Canonieke baseline klopt: p5.waves-manifest meldt v3.4.0 / `6ce959e` / 34
  waves - exact de geclaimde baseline.
- Alle `data-wv`-types en `data-*`-opties in de docs bestaan echt in
  `waves-demos.js`; wave-namen/indices/groepsgroottes kloppen (op de items
  hieronder na, inmiddels gefixt).

## Bugs

1. ✅ **Hero-spectrum renderde nooit.** CSS-regel won van het
   `stroke`-attribuut. Fix: ribbons zetten de kleur nu als inline
   `style.stroke` (wint wél van CSS). Les in cloud.md genoteerd.
2. ✅ **Nav-logo 404** op examples/waves/guide/about → overal `../index.html`.
3. ✅ **Ring-snippet ReferenceError** (`t` ongedeclareerd) → `const t = performance.now() / 1000;` toegevoegd.
4. ✅ **Amplitude-claim** `[-amp/2,+amp/2]` → gecorrigeerd naar `[-amp,+amp]`
   in guide; zelfde misvatting in waves-demos-comment gefixt.
5. ✅ **Bars/eq-snippets konden negatieve scaleY geven** → clamp toegevoegd in
   index/examples/engine-snippets; guide-starter en README gebruiken nu
   `range: [0, 1]`.

## Drift (docs vs. code)

6. ✅ Periodes kaart 05 (62.60→62.83) en kaart 12 (62.82→62.83).
7. ✅ Kaart 16 "up down noise": gentle → harsh (conform CHARACTER[16]).
8. ✅ Closing-tag toegevoegd aan 11 steps down, 26 up down pulse,
   33 smooth solid sine - nu 17/17 kaarten getagd.
9. ✅ **Site laadt de lib nu lokaal** (root: `vanilla.waves.min.js`, docs:
   `../vanilla.waves.min.js`) - de Pages-site toont altijd de actuele repo.
   CDN-pad blijft het install-advies voor externe gebruikers (README).
10. ✅ Getters-claim genuanceerd in guide + README: shift-sampler = live
    getters; non-shift = alleen `waveIndex`/`waveName`/`period`.

## Verbeterpunten (polish / robuustheid)

11. ✅ Ribbons `data-rows="1"`-guard (geen deling door nul meer).
12. ✅ Dode regel in field-renderer verwijderd.
13. ✅ `destroy()` roept nu een optionele `destroy(state, node)`-hook aan en
    verwijdert `aria-hidden`; gedocumenteerd in engine.html + guide + README.
14. ✅ `prefers-reduced-motion` wordt live gevolgd (change-listener): aan →
    loop stopt + één statisch frame; uit → loop start.
15. ✅ Contrast: codecomments en `.footer-sub` van `--text-faint` naar
    `--text-muted` (WCAG AA).
16. ✅ Ongebruikte `--c1…--c5` verwijderd; COFFEE/SPECTRUM in waves-demos.js is
    de enige bron (comment in CSS wijst ernaar).
17. ✅ Hamburger heeft `aria-expanded`/`aria-controls`; actieve nav-link heeft
    `aria-current="page"`.
18. ✅ Reproduceerbare build + test in de repo: `tools/build.js` (bundel +
    terser-minify) en `tools/parity.js` (1539 checks, exit 1 bij drift).
    Bundels geregenereerd; min kromp 28 KB → 16 KB (nu ook gemangeld).
19. ✅ `cloud.md` aangemaakt (missie/boom/regels/notities).

## Nieuw in deze branch

- ✅ `docs/art.html` - **"nocturne for 34 waves"**: volledig canvasloze
  kunstcompositie (geweven interferentieveld, naadloze closing-ring met
  live HUD op de sampler-getters, per-letter golvende titel, meter), gedreven
  door de LOKALE bundel en de eigen `register/init` engine-API. Desktop +
  mobiel geverifieerd, nul console-fouten. Gelinkt in de site-nav als
  **Nocturne** op alle pagina's.
