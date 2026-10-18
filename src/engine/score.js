// =============================================================================
//  computeScore(state) — fonction PURE (aucun effet de bord), base du futur
//  classement (V2). Toute modification doit rester rétro-compatible ou
//  incrémenter SCORE_VERSION.
//
//  score = arrondi((base + passif + victoire + succès) × multDifficulté × multFaillite)
//    base      = patrimoine net en € / 100          (1 point par 100 € de patrimoine)
//    passif    = revenu passif mensuel net en € × 2
//    victoire  = 5 000 + 25 × max(0, 240 − mois nécessaires pour gagner)  (si gagné)
//    succès    = 50 × nombre de succès débloqués
//    multDifficulté : Facile 0,8 · Normal 1 · Réaliste 1,25 · Difficile 1,5
//    multFaillite   : 0,25 si faillite, sinon 1
//  Le score ne descend jamais sous 0.
// =============================================================================

import { DIFFICULTIES } from '../data/difficulty.js';
import { netWorth, passiveIncome } from './selectors.js';

export const SCORE_VERSION = 1;

export function computeScore(state) {
  const nw = netWorth(state);
  const base = nw / 10_000; // centimes → € / 100
  const passive = (passiveIncome(state).total / 100) * 2;
  const wonDay = state.endgame && state.endgame.wonDay;
  const victory = wonDay != null ? 5000 + 25 * Math.max(0, 240 - Math.floor(wonDay / 30)) : 0;
  const achievements = 50 * Object.keys((state.achievements && state.achievements.unlocked) || {}).length;
  const diffMult = (DIFFICULTIES[state.meta.difficulty] || DIFFICULTIES.normal).scoreMult;
  const bankruptMult = state.status === 'bankrupt' ? 0.25 : 1;
  const total = Math.max(0, Math.round((base + passive + victory + achievements) * diffMult * bankruptMult));
  return { total, version: SCORE_VERSION, parts: { base: Math.round(base), passive: Math.round(passive), victory, achievements, diffMult, bankruptMult } };
}
