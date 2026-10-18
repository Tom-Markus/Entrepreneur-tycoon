// Registre de la LOGIQUE des secteurs (modules avec init/daily/monthEnd/actions…).

import * as agence from './agence.js';

export const SECTOR_MODULES = {
  agence,
};

export function sectorModule(state) {
  const m = SECTOR_MODULES[state.meta.sector];
  if (!m) throw new Error(`Secteur inconnu : ${state.meta.sector}`);
  return m;
}
