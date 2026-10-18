// Registre de la LOGIQUE des secteurs (modules avec init/daily/monthEnd/actions…).

import * as agence from './agence.js';
import * as restaurant from './restaurant.js';
import * as ecommerce from './ecommerce.js';
import * as artisan from './artisan.js';
import * as soutien from './soutien.js';

export const SECTOR_MODULES = { agence, restaurant, ecommerce, artisan, soutien };

export function sectorModule(state) {
  const m = SECTOR_MODULES[state.meta.sector];
  if (!m) throw new Error(`Secteur inconnu : ${state.meta.sector}`);
  return m;
}
