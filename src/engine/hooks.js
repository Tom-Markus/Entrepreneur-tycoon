// Registre ordonné des systèmes du moteur.
// Chaque système peut exposer : init(state, opts, diff, rng), daily(state, rng),
// monthEnd(state, rng), quarterEnd(state, rng), yearEnd(state, rng).
// L'ordre du tableau est l'ordre d'exécution (important pour le déterminisme).

import * as core from './systems/core.js';

export const SYSTEMS = [core];

export function initHooks() {
  return SYSTEMS.filter((s) => s.init).map((s) => s.init);
}
