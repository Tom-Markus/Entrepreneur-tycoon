// Déblocage des succès (vérifiés chaque jour de fin de mois et via checkAchievements).

import { ACHIEVEMENTS } from '../../data/achievements.js';
import { log } from '../log.js';

export function init(state) {
  state.achievements = { unlocked: {} };
}

export function checkAchievements(state) {
  const u = state.achievements.unlocked;
  for (const a of ACHIEVEMENTS) {
    if (u[a.id] != null) continue;
    if (a.sector && a.sector !== state.meta.sector) continue;
    let ok = false;
    try {
      ok = a.check(state);
    } catch {
      ok = false;
    }
    if (ok) {
      u[a.id] = state.time.day;
      log(state, 'good', `🏅 Succès débloqué : ${a.label}`, true);
    }
  }
}

export function monthEnd(state) {
  checkAchievements(state);
}

/** Les plus rapides (première vente) sont aussi vérifiés chaque semaine. */
export function daily(state) {
  if (state.time.day % 7 === 0) checkAchievements(state);
}
