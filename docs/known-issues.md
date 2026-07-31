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

```bash
node check-docs.mjs && node check-parity.mjs
```

**`check-docs.mjs`** vergelijkt elk getal-claim in de HTML ("35 shapes",
"19 waves") met de aantallen die de verscheepte library zélf rapporteert.
Aanleiding: de landingspagina beweerde "34 shapes" terwijl de library er 35 had,
en de v0.2.0-sweep die claimde dat overal gefixt te hebben had `index.html` en
`docs/about.html` gemist. Bewezen werkend: zet "34 shapes" terug en hij meldt
`index.html:42` met exit 1.

**`check-parity.mjs`** bewijst dat `vanilla.waves.js` en `vanilla.waves.min.js`
dezelfde getallen geven als `waves-core.js`. Vangt "iemand paste de core aan en
vergat te herbouwen". Laadt de drie bestanden in aparte vm-contexten, 8620
checks. Bewezen werkend: verander één coëfficiënt in de bundel en hij faalt op
het laatste float-cijfer.

## Twee sites tegelijk (opgelost 2026-07-31)

Deze repo ligt onder de webroot (`C:\server\htdocs`). Agent-tooling maakt
tijdelijke git-worktrees onder `.claude/worktrees/`, en zo'n worktree is een
VOLLEDIGE tweede kopie van de site. Apache serveerde die gewoon mee. Resultaat:
`/vanilla.waves/` was correct terwijl
`/vanilla.waves/.claude/worktrees/<naam>/` een oude versie toonde die nog
"34 shapes" beweerde, allebei met HTTP 200.

Dat is de verklaring voor terugkerende "regressies" die geen regressie waren:
er werd geverifieerd tegen de ene kopie en gepubliceerd vanuit de andere.

Dichtgezet met een `.htaccess` in de repo-root die alles onder `.claude/`
404't. Geverifieerd: site, docs en library 200; `.claude/launch.json` en
`.claude/worktrees/` 404. GitHub Pages doet niets met dat bestand.

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

**Gevolg, deels opgelost.** De verificatiekant is terug: `check-parity.mjs`
bewijst dat de bundels overeenkomen met de core, en meldde op 2026-07-31 dat de
huidige bundels correct zijn (8620 checks, 35 waves overal).

Wat nog ontbreekt is de **bouwkant**. Er is geen script dat
`vanilla.waves.js` en `vanilla.waves.min.js` opnieuw genereert uit
`waves-core.js` + `engine.js`. Zolang dat zo is kan de core niet gewijzigd
worden: elke wijziging maakt de bundels ongeldig en er is geen manier om ze bij
te werken. Dat blokkeert ook de engine-bugs hierboven. Dit is de grootste
resterende schuld.
