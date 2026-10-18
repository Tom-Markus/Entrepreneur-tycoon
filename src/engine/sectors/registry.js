// Registre des DONNÉES de secteur (sans logique, pour éviter les dépendances circulaires).

import { AGENCE } from '../../data/sectors/agence.js';
import { RESTAURANT } from '../../data/sectors/restaurant.js';
import { ECOMMERCE } from '../../data/sectors/ecommerce.js';
import { ARTISAN } from '../../data/sectors/artisan.js';
import { SOUTIEN } from '../../data/sectors/soutien.js';

export const SECTOR_DATA = {
  agence: AGENCE,
  restaurant: RESTAURANT,
  ecommerce: ECOMMERCE,
  artisan: ARTISAN,
  soutien: SOUTIEN,
};

export function sectorData(state) {
  const d = SECTOR_DATA[state.meta.sector];
  if (!d) throw new Error(`Secteur inconnu : ${state.meta.sector}`);
  return d;
}
