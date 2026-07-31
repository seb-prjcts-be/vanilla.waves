# Werkwijze en bekende problemen

> Stand: 2026-07-31.

## Werkafspraak: branches leven één dag

**Een branch die op het einde van de dag niet in `main` zit, is dood.**

`main` is het enige systeem. Werk landt dezelfde dag in main of het bestaat
niet. Geen langlopende feature-branches, geen "later mergen", geen parkeren.

De reden staat hieronder: op 2026-07-31 bleken zeven branches te bestaan,
waarvan drie met werk dat maandenlang buiten main lag. Die drie waren
onmergebaar geworden, ze droegen een 34-waves core mee terwijl main er 35 had.
Een merge zou het dialect hebben teruggedraaid. Werk dat niet meteen landt,
rot: niet omdat het slecht is, maar omdat main eronder doorloopt.

## Controle vóór commit

Twee dingen die niet uit code of `git log` te halen zijn en dus mis kunnen
gaan zonder dat iemand het ziet:

```bash
node check-docs.mjs
```

Vergelijkt elk getal-claim in de HTML ("35 shapes", "19 waves") met de aantallen
die de verscheepte library zélf rapporteert. Faalt met exit 1 bij drift.
Aanleiding: de landingspagina beweerde maandenlang "34 shapes" terwijl de
library er 35 had, en de v0.2.0-sweep die claimde dat overal te hebben gefixt
had index.html en about.html gemist.

## Open bugs in `engine.js` (in main, niet gefixt)

Deze zaten in een fix-branch die nooit geland is en op 2026-07-31 is opgeruimd.
Ze staan hier omdat het echte bugs in verscheepte code zijn, niet omdat de
branch bewaard moet blijven.

1. **`destroy()` ruimt niet op wat `create()` toevoegde.** De aangemaakte
   DOM-kinderen blijven staan na `VanillaWaves.destroy(el)`. Fix: onthoud bij
   `create` hoeveel kinderen het element al had en verwijder bij `destroy`
   alleen wat erbij kwam.
2. **`aria-hidden="true"` wordt op elk element geforceerd.** Ook op elementen
   die niet decoratief zijn. Fix: alleen zetten als de auteur zelf niets opgaf,
   met een opt-out via `data-decorative="false"`, en bij `destroy` weer
   weghalen als de engine hem gezet had.
3. **Niet-numerieke seeds en niet-eindige `data-speed` geven een `NaN`-tijd.**
   `Number('abc')` is `NaN` en dat lekt door in de starttijd, waardoor het
   element bevriest. Fix: string-seeds hashen naar een stabiel getal en speed
   afklemmen op een eindige waarde.

Ontbrekend randje: er is ook geen `def.destroy(state, node)`-haak, zodat
renderers eigen timers en listeners niet kunnen vrijgeven.

## Weggegooid op 2026-07-31

Deze branches zijn verwijderd zonder te mergen. Bewust, volgens de regel
hierboven. Wat erin zat, staat hier zodat de keuze navolgbaar blijft:

| branch | wat erin zat | gevolg |
|---|---|---|
| `fix/engine-robustness` | de drie engine-bugs hierboven, plus `build.mjs` | bugs staan nu hierboven als open werk in main |
| `claude/elastic-bell-9ef047` | `tools/build.js`, `tools/parity.js`, `AUDIT.md`, `docs/art.html` | build- en parity-harnas bestaat NIET in main |
| `claude/tender-elgamal-d720f5` | negen losse voorbeelden onder `examples/` | weg |

**Belangrijk gevolg:** `cloud.md` en `STATUS.md` schrijven voor dat je na elke
core-wijziging `node tools/build.js` en `node tools/parity.js` draait. Die
bestanden zitten niet in main en zijn nu ook niet meer op een branch. Die
werkafspraak verwijst dus naar gereedschap dat niet bestaat, en
`vanilla.waves.js` / `.min.js` kunnen op dit moment niet gereproduceerd worden.
Dat is de grootste openstaande schuld.
