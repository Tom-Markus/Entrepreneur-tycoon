// Délègue au module du secteur choisi.

import { sectorModule } from '../sectors/index.js';

export function init(state, opts, diff, rng) {
  sectorModule(state).init(state, opts, diff, rng);
}

export function daily(state, rng) {
  sectorModule(state).daily(state, rng);
}

export function monthEnd(state, rng) {
  const m = sectorModule(state);
  if (m.monthEnd) m.monthEnd(state, rng);
}
