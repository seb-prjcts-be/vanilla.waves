/*!
 * vanilla.waves - waves-core.mjs
 * ES-module-ingang op de math. Dit bestand bevat GEEN wiskunde: het importeert
 * waves-core.js om z'n side-effect (de globals) en her-exporteert die als named
 * exports. Zo blijft er precies EEN kopie van de canonieke p5.waves-math en kan
 * de ESM-laag nooit van de canon afdrijven.
 *
 *   import { createSampler } from './waves-core.mjs';
 *
 * Werkt in de browser (ESM), in Node (waves-core.js wordt daar als CommonJS
 * geladen, de globalThis-toewijzing is identiek) en in bundlers. Bevat bewust
 * NIET de DOM-engine: die is browser-only en zelf-initialiserend. Wil je de
 * engine, laad dan vanilla.waves.js via een <script>-tag.
 *
 * Vereist geen buildstap: dit bestand wordt niet gegenereerd, in tegenstelling
 * tot vanilla.waves.js en vanilla.waves.min.js.
 * License: MIT · seb@prjcts
 */

import './waves-core.js';

const W = globalThis.VanillaWaves;

if (!W || typeof W.createSampler !== 'function') {
  throw new Error(
    'vanilla.waves: waves-core.js heeft de VanillaWaves-global niet gezet. ' +
    'Controleer of waves-core.mjs naast waves-core.js staat.'
  );
}

// De API-functies zijn vrije functies zonder `this`-binding, dus losmaken van
// het object is veilig.
export const wave          = W.wave;
export const createSampler = W.createSampler;
export const list          = W.list;
export const benchmark     = W.benchmark;
export const data          = W.data;
export const count         = W.count;

export default W;
