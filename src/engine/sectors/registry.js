// Registre des DONNÉES de secteur (sans logique, pour éviter les dépendances circulaires).

import { AGENCE } from '../../data/sectors/agence.js';

export const SECTOR_DATA = {
  agence: AGENCE,
};

export function sectorData(state) {
  const d = SECTOR_DATA[state.meta.sector];
  if (!d) throw new Error(`Secteur inconnu : ${state.meta.sector}`);
  return d;
}
