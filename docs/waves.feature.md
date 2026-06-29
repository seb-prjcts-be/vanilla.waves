# waves.feature — changedoc & port-gap-analyse

> Levend document. Twee taken: **(A)** bijhouden welk deel van het canonieke
> p5.waves-dialect de `vanilla.waves`-port al dekt, en **(B)** drift bewaken —
> zodra de canonieke lib verandert (nieuwe waves, opties, verwijderde API's),
> moet de port volgen. Ideaal als terugkerende **routine**: manifest ophalen →
> diffen tegen de snapshot hieronder → punch-list.
>
> **Canonieke bron (single source of truth):**
> `https://seb-prjcts-be.github.io/p5.waves/docs/p5.waves.manifest.json`
> (door een pre-commit hook uit de lib-source gegenereerd; lagt nooit).

Status-legenda: ⬜ te porten · ✅ gedaan · 🚫 n.v.t. (p5/canvas-specifiek) · ❓ open beslissing

---

## Snapshot van de canonieke lib (baseline voor drift-diff)

| veld | waarde | gemeten |
|---|---|---|
| version | **3.4.0** | 2026-06-29 |
| commit | `6ce959e` | 2026-06-29 |
| wave_count | **34** | 2026-06-29 |

Recente canonieke wijzigingen die de port meteen goed moet zetten:
- **v3.3.0** — `Waves.createGrid()` *verwijderd* → 2D-veld = twee samplers + handmatige loop. `group: 'closing'` + `sampler.period`/`targetPeriod` *toegevoegd* (experimenteel).
- **v3.4.0** — lib volledig **eval-free / CSP-safe** (`new Function`/`eval` weg; elke wave draagt een vooraf-gecompileerde `fn` naast z'n `algo`-string). Geen API-wijziging; output bit-identiek aan 3.3.0.

---

## A. API-oppervlak dat de port moet dekken

> **STATUS 2026-06-29 — A1–A4 ✅ GELEVERD** door `waves-core.js`. Vondst: de
> canonieke `p5.waves.js`-math is al puur vanilla (enkel `Math.*`); de port =
> de canonieke kern byte-getrouw, met alleen de p5-prototype-hook verwijderd.
> Geverifieerd **bit-identiek** tegen p5.waves v3.4.0: 1009/1009 parity-checks
> (alle 34 golven × y/seed, morph, range, wild, sampler). Resterend werk =
> engine (A5-context) + de elements-laag, niet de math.

### A1. Wave-math (de kern — dit MOET de port zelf bezitten) — ✅ in waves-core.js
| onderdeel | canoniek | port-status |
|---|---|---|
| 34 wave-formules (`classic sine` … `smooth solid sine`) | `waves[]` in manifest | ⬜ |
| seed→wave via **FNV-1a hash** | `seed` opt | ⬜ |
| groups als pools: `gentle`(27) · `harsh`(7) · `closing`(17) · `all`(34) · array | `group` opt | ⬜ |
| shift (auto-cyclen naar nieuwe wave) + morph-transitie | `shift`/`shiftInterval`/`shiftDuration` | ⬜ |
| morph/mix tussen twee formules (`wave:[a,b]` + `mix`) | `mix` opt | ⬜ |
| wild-mode + `unpredictability` | `mode`/`unpredictability` | ⬜ |
| period-meting (`period`/`targetPeriod`, 4 decimalen, `null` voor niet-periodiek) | v3.3.0 | ⬜ |
| **eval-free**: elke wave = `algo` (display) + `fn` (uitvoerbaar) | v3.4.0 | ⬜ — port moet óók CSP-safe zijn |

### A2. Globale functies
| canoniek | betekenis | port |
|---|---|---|
| `Waves.wave(y, secondParam)` | losse sample (getal→getal) | ⬜ |
| `Waves.createSampler(opts)` | sampler-object (hergebruik) | ⬜ |
| `Waves.list()` | `[{index,name,algo}]` | ⬜ |
| `Waves.count` | aantal waves (34) | ⬜ |
| `Waves.data` | ruwe WAVES-array (+ custom toevoegen, vereist `algo`+`fn`) | ⬜ |
| ~~`Waves.createGrid()`~~ | **verwijderd v3.3.0** | 🚫 niet porten |
| `waves()` / `createWaveSampler()` / `p.waves()` | p5 global/instance-shorthands | 🚫 p5-gebonden → port exposeert eigen global (`VanillaWaves`/`vWaves`) |

### A3. Sampler-methodes & getters
| canoniek | port |
|---|---|
| `s.sample(y)` · `s.sample(y,t)` · `s.sample(y,t,mix)` | ⬜ |
| getters: `waveName` · `shifting` · `targetName` · `mix` · `period` · `targetPeriod` | ⬜ |

### A4. Options-keys + defaults
| optie | type | default | port |
|---|---|---|---|
| `wave` | string / index / `[a,b]` | random | ⬜ |
| `t` | number | `0` | ⬜ — **engine levert t** (geen `millis()`); zie B-noot |
| `amplitude` | number | `100` | ⬜ |
| `range` | `[min,max]` (overschrijft amplitude) | `null` | ⬜ |
| `frequency` | number | `1` | ⬜ |
| `phase` | number | `0` | ⬜ |
| `seed` | number | `0` | ⬜ |
| `mode` | `'stable'`/`'wild'` | `'stable'` | ⬜ |
| `unpredictability` | 0–1 (alleen wild) | `0` | ⬜ |
| `shift` | boolean | `false` | ⬜ |
| `group` | pool/array | `'all'` | ⬜ |
| `shiftInterval` | number (geclampt ≥ ε sinds v3.2.7) | `3` | ⬜ |
| `shiftDuration` | number (geclampt) | `1` | ⬜ |
| `mix` | 0–1 | `0.5` | ⬜ |

### A5. Wat NIET wordt geport (p5/canvas-specifiek)
🚫 `millis()`/`createCanvas`/`beginShape`/`colorMode HSB` enz. — de vanilla-engine
levert tijd (`t`) zelf via z'n rAF-loop en mapt naar DOM/CSS i.p.v. canvas.

---

## B. Open beslissingen (dialect ↔ port)
- ✅ **Shift-entropie — BESLIST (2026-06-29):** entropie **1:1 overnemen** (canon-getrouw, per-page-load toeval default aan). Géén determinisme-flag voor nu. Reden: per-load-variatie is rijker; binnen één sessie identiek aan determinisme.
- ❓ **Tijdsmodel.** Canoniek krijgt `t` van de sketch (`millis()/1000`). De engine bezit z'n eigen `t` (dt-accumulatie, FPS-cap, IO-pauze). Bevestigen dat de math `t` puur als argument neemt en geen interne klok aanneemt (dat doet ze al — sampler heeft geen interne klok).
- ❓ **Custom waves.** Overnemen dat `Waves.data`-entries `algo`+`fn` vereisen (eval-free). Port moet identiek CSP-safe blijven; geen `new Function`.
- ❓ **2D-veld.** Geen `createGrid` (verwijderd). Levert de port een *helper-patroon* (twee samplers sommeren) als element, of laten we dat aan `vanilla.waves_elements` over?

---

## D. Andere taal-ports (drift t.o.v. canoniek)
De manifest tracket alleen JS-derived-repos (`p5.waves_svg`, `p5.waves_pulse`),
**niet** de taal-ports. Daarom horen die hier.

| port | pin | dialect-status (2026-06-29, bron-geverifieerd) |
|---|---|---|
| **processing.waves** (Java) | v1.0.0, "port of p5.waves **v3.3.0**" | ✅ **in sync.** Heeft 34 waves in v3.3.0-volgorde, gentle/harsh/**closing** (`Waves.java:129-141`), `period` (`:42`), shift+entropie, morph/mix, wild/unpredictability. `WaveDef` draagt al `algo`+`fn`. v3.4.0 (eval-free/CSP) is **JS-specifiek → N.V.T. voor Java**, output bit-identiek. Enige actie: label naar 3.4.0 overwegen + bevestigen dat geen latere dialect-wijziging gemist is. **Loopt NIET achter op groups** (eerdere aanname weerlegd). |
| **vanilla.waves** (JS vanilla) | — | ⬜ nog te bouwen; alles ⬜ (zie A). |

## C. Drift-watch — auditlog
Elke routine-run: manifest ophalen, vergelijken met de Snapshot-tabel hierboven,
verschillen hier dateren. Bij een nieuwe versie: `added_apis[]`/`removed_apis[]`
lezen en de A-tabellen bijwerken.

- **2026-06-29** — baseline vastgelegd op v3.4.0 / `6ce959e` / 34 waves. Geen drift. Verwijderd sinds vorige major: `createGrid`. Toegevoegd: `closing`-group, `period`/`targetPeriod`.
- **2026-06-29** — `waves-core.js` toegevoegd = canonieke math byte-getrouw (p5-hook eruit, eigen global). Bit-identiek geverifieerd: 1009/1009 parity-checks tegen p5.waves v3.4.0. A1–A4 ✅.
- **2026-06-29** — `engine.js` ✅ (DOM-loop 30fps + IO-pauze + register/init/destroy + helpers, uit wel.js; pipeline geverifieerd) en `vanilla.waves.js` bundel gegenereerd. **Bib functioneel klaar.** Next: `vanilla.waves_elements` (loader-element eerst). TODO core: `.min.js`-release-artefact.

---

## Hoe deze doc wordt ververst (routine-recept)
Geautomatiseerd door de wekelijkse scheduled-task **`waves-dialect-drift-watch`**
(ma, cron **03:14** = π — feitelijke dispatch ~03:22 door scheduler-jitter; **report-only** —
levert een punch-list, wijzigt deze doc NIET; manueel bijwerken op basis van het rapport).
Draait enkel als de Claude-app open is.
De `p5waves_sync`-skill dekt de JS-laag (skills/derived/frozen repos); deze routine
dekt specifiek de **taal-ports** (sectie D).

1. `WebFetch` de manifest-URL → lees `version`, `commit`, `wave_count`, `waves[]`, `added_apis[]`, `removed_apis[]`.
2. Diff tegen de **Snapshot**-tabel. Gelijk → noteer "geen drift" in C met datum.
3. Verschillend → werk Snapshot + A-tabellen bij, en zet elke `removed_apis[]` op 🚫 ("nooit porten"), elke `added_apis[]` als nieuwe ⬜-regel.
4. Hercheck de taal-ports (sectie D) tegen de nieuwe canon.
5. Houd de port-status (⬜/✅) bij naarmate `vanilla.waves` groeit.
