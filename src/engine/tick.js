// Boucle de temps du moteur.
//
// tick(state, dtDays, rng) accumule une durée (en jours de jeu, fraction
// possible) et simule chaque JOUR complet. Découper le temps en petits ou
// grands morceaux donne donc exactement le même résultat.

import { createRng } from './rng.js';
import { SYSTEMS } from './hooks.js';
import { dateOf, DAYS_PER_MONTH } from './calendar.js';

/** Nombre maximal de jours simulés par appel (protection). */
const MAX_DAYS_PER_CALL = 3700;
const EPS = 1e-7;

/** Vrai si le moteur attend une décision du joueur (événement à choix). */
export function isBlocked(state) {
  return state.status === 'bankrupt' || (state.events && state.events.pending.length > 0);
}

/**
 * Avance le temps de `dtDays` jours de jeu.
 * @returns {object} le même objet state (muté)
 */
export function tick(state, dtDays, rng) {
  if (!(dtDays > 0) || isBlocked(state)) return state;
  state.time.frac += dtDays;
  let n = 0;
  // EPS : 10 × 0,1 doit donner exactement 1 jour malgré les arrondis flottants.
  while (state.time.frac >= 1 - EPS && n < MAX_DAYS_PER_CALL) {
    state.time.frac = Math.max(0, state.time.frac - 1);
    stepDay(state, rng);
    n++;
    if (isBlocked(state)) {
      state.time.frac = 0; // le reste du temps est « perdu » : le jeu est en pause
      break;
    }
  }
  state.rngState = rng.state;
  return state;
}

/** Raccourci : crée le rng depuis l'état, avance, réécrit l'état du rng. */
export function advance(state, dtDays) {
  const rng = createRng(state.rngState);
  return tick(state, dtDays, rng);
}

/** Simule une journée complète. */
export function stepDay(state, rng) {
  for (const s of SYSTEMS) if (s.daily) s.daily(state, rng);

  const d = dateOf(state.time.day);
  if (d.dom === DAYS_PER_MONTH) {
    for (const s of SYSTEMS) if (s.monthEnd) s.monthEnd(state, rng);
    if (d.month % 3 === 2) for (const s of SYSTEMS) if (s.quarterEnd) s.quarterEnd(state, rng);
    if (d.month === 11) for (const s of SYSTEMS) if (s.yearEnd) s.yearEnd(state, rng);
  }
  for (const s of SYSTEMS) if (s.endOfDay) s.endOfDay(state, rng);
  state.time.day += 1;
}
