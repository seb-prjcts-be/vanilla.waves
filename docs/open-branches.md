# Openstaande branches

> Stand: 2026-07-31. Na de opruiming is `main` het enige systeem. Er blijven
> drie branches over die werk bevatten dat NIET in main zit. Dit bestand legt
> vast wat daar leeft, zodat het vindbaar blijft en niet per ongeluk verdwijnt.

## Waarom deze drie niet gewoon gemerged zijn

Alle drie stammen van vóór de v0.2.0-sprong naar het p5.waves v3.6.0-dialect.
Ze dragen een **34-waves core en bijbehorende gegenereerde bundels** mee:

| branch | waves in core | `spike sine` | `shake out` |
|---|---|---|---|
| `main` | **35** | ja | ja |
| `claude/elastic-bell-9ef047` | 34 | nee | nee |
| `claude/tender-elgamal-d720f5` | 34 | nee | nee |
| `fix/engine-robustness` | 34 | nee | nee |

Een gewone `git merge` trekt die oude math en die oude `vanilla.waves.js` /
`.min.js` over de huidige core heen. Dat is een stille regressie van het
dialect. Salvage gaat dus per bestand: **bronbestanden cherry-picken, daarna
opnieuw bouwen en pariteit bewijzen** - nooit de gegenereerde bundels
overnemen.

---

## `fix/engine-robustness` (@ `3772cd6`)

Echte bugfixes in `engine.js` die main vandaag NIET heeft. Dit is verscheepte
code, dus dit is de meest urgente van de drie.

- `destroy()` ruimt in main niet op wat `create()` toevoegde: de aangemaakte
  DOM-kinderen blijven staan. De fix onthoudt `baseChildren` en verwijdert
  alleen wat erbij kwam.
- Optionele `def.destroy(state, node)`-disposer, zodat renderers eigen timers
  en listeners kunnen vrijgeven.
- Main forceert `aria-hidden="true"` op elk element. De fix zet dat alleen als
  de auteur niets opgaf en niet expliciet `data-decorative="false"` kiest.
- Niet-numerieke seeds en een niet-eindige `data-speed` geven in main een
  `NaN`-tijd. De fix hasht string-seeds en klemt speed af.

Extra bestand op deze branch: `build.mjs` (een andere buildscript-variant dan
`tools/build.js` hieronder - kies er bewust een van).

## `claude/elastic-bell-9ef047` (@ `895e518`)

Bevat vier bestanden die main mist:

- `tools/build.js` - bundelt core + engine, minify via terser
- `tools/parity.js` - bewijst bit-identieke output core/bundel/min
- `AUDIT.md` - audit-punch-list met status
- `docs/art.html` - "nocturne for 34 waves", het canvasloze kunststuk

**Let op:** `STATUS.md` en `cloud.md` schrijven voor dat je na elke wijziging
aan core of engine `node tools/build.js` en `node tools/parity.js` draait. Die
tools bestaan alleen hier. Zolang deze branch niet gesalvaged is, beschrijven
die projectnotities een harnas dat in main niet bestaat.

## `claude/tender-elgamal-d720f5` (@ `679c000`)

Een complete `examples/`-map met negen losstaande voorbeelden, elk met een
`index.html` en een `info.json`:

`bar_meter` · `checkbox_field` · `chip_walkers` · `glyph_field` · `one_number` ·
`progress_morph` · `radial_loader` · `slider_stack` · `text_loader`

Plus `docs/examples.js`. Overlapt deels met wat later als `docs/examples.html`
in main is beland, maar de losse voorbeelden zelf staan daar niet.

---

## Opgeruimd op 2026-07-31

Deze vijf zijn verwijderd (lokaal en op origin) nadat bewezen was dat hun
inhoud in main zit:

| branch | bewijs |
|---|---|
| `claude/vanilla-waves-docs-examples-cc014f` | fast-forward in main als `704d8e2` |
| `claude/waves-improvements-sync-04f597` | was identiek aan main, bestond alleen lokaal |
| `claude/sad-bassi-0c84f7` | squash-merged als `d751f73` (#5) |
| `docs-adobe-palette` | squash-merged als `9b7e26e` (#4) |
| `claude/zen-sutherland-d88b88` | squash-merged als `6bd93ca` (#3) |
