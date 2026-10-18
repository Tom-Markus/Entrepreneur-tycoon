// Utilitaires de test : avancer le temps en résolvant automatiquement les décisions.
import { advance, applyAction } from '../src/engine/index.js';

/** Avance de `days` jours ; chaque décision en attente reçoit son choix « bot » (ou `choice`). */
export function run(state, days, choice = null) {
  const target = state.time.day + days;
  let guard = 0;
  while (state.time.day < target && state.status !== 'bankrupt' && guard++ < days * 3 + 10) {
    advance(state, target - state.time.day);
    while (state.events && state.events.pending.length) {
      const p = state.events.pending[0];
      applyAction(state, { type: 'decide', uid: p.uid, choice: choice ?? p.botChoice ?? 0 });
    }
  }
  return state;
}
