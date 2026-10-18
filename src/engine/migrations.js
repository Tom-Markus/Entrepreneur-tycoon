// Migrations du format de sauvegarde.
// MIGRATIONS[v] transforme un état de version v en version v+1.
// Pour changer le format : incrémenter CONFIG.saveVersion et ajouter une entrée.

import { CONFIG } from '../data/config.js';

export const MIGRATIONS = {
  // Exemple de migration (version 0 = prototype sans saveVersion) :
  0: (s) => {
    s.meta = s.meta || {};
    s.meta.saveVersion = 1;
    s.flags = s.flags || {};
    return s;
  },
};

/**
 * Amène un état à la version courante. Lève une erreur si la sauvegarde
 * vient d'une version plus récente que le jeu.
 */
export function migrate(state, migrations = MIGRATIONS, target = CONFIG.saveVersion) {
  if (!state || typeof state !== 'object') throw new Error('Sauvegarde vide ou illisible.');
  let v = state.meta && Number.isInteger(state.meta.saveVersion) ? state.meta.saveVersion : 0;
  if (v > target) throw new Error(`Sauvegarde créée par une version plus récente du jeu (v${v}).`);
  while (v < target) {
    const m = migrations[v];
    if (!m) throw new Error(`Aucune migration depuis la version ${v}.`);
    state = m(state);
    v += 1;
    state.meta.saveVersion = v;
  }
  return state;
}
