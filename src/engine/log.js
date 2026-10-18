// Journal d'événements lisible par le joueur (stocké dans l'état, borné).
// Chaque entrée a un identifiant croissant : l'interface affiche en
// notification les entrées `toast` qu'elle n'a pas encore vues, sans jamais
// modifier l'état.

import { CONFIG } from '../data/config.js';

/**
 * Ajoute une entrée au journal.
 * kind : 'info' | 'good' | 'bad' | 'tax' | 'event' | 'staff' | 'market' | 'invest'
 */
export function log(state, kind, text, toast = false) {
  state.logSeq = (state.logSeq || 0) + 1;
  state.log.push({ id: state.logSeq, day: state.time.day, kind, text, toast });
  if (state.log.length > CONFIG.logSize) state.log.splice(0, state.log.length - CONFIG.logSize);
}
