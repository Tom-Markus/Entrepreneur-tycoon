// Point d'entrée unique des décisions du joueur.
// Une action est un objet sérialisable { type, ...paramètres }.
// Chaque action réussie est ajoutée à state.actionLog avec le jour courant,
// ce qui permet de rejouer une partie (seed + actions) : voir docs/V2.md.

import { createRng } from './rng.js';
import { CONFIG } from '../data/config.js';

const HANDLERS = {};

/** Enregistre des gestionnaires d'actions : { type: (state, action, rng) => result }. */
export function registerActions(map) {
  Object.assign(HANDLERS, map);
}

export function knownActions() {
  return Object.keys(HANDLERS);
}

/**
 * Applique une action. Retourne { ok: boolean, message?: string }.
 * N'avance jamais le temps.
 */
export function applyAction(state, action) {
  if (!action || typeof action.type !== 'string') return { ok: false, message: 'Action invalide.' };
  const h = HANDLERS[action.type];
  if (!h) return { ok: false, message: `Action inconnue : ${action.type}` };
  if (state.status === 'bankrupt' && !action.allowWhenOver) return { ok: false, message: 'La partie est terminée.' };
  const rng = createRng(state.rngState);
  let res;
  try {
    res = h(state, action, rng) || { ok: true };
  } catch (e) {
    return { ok: false, message: `Erreur : ${e.message}` };
  }
  state.rngState = rng.state;
  if (res.ok) {
    state.actionLog.push({ d: state.time.day, a: action });
    if (state.actionLog.length > CONFIG.actionLogMax) state.actionLog.shift();
  }
  return res;
}

registerActions({
  noop: () => ({ ok: true }),
});
