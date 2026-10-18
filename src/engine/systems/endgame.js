// Fin de partie : défaut de paiement, faillite (et victoire, cf. passive.js).

import { DIFFICULTIES } from '../../data/difficulty.js';
import { personalOut, receive } from '../ledger.js';
import { log } from '../log.js';
import { buildPostMortem } from '../postmortem.js';

export function init(state) {
  state.endgame = { distressDays: 0, maxDistress: 0, postmortem: null, wonDay: null, recoveredFromNegative: 0, wasNegative: false };
}

export function daily(state) {
  if (state.status === 'bankrupt') return;
  const eg = state.endgame;
  const limit = -state.finance.overdraftLimit;
  // Indépendant : responsabilité illimitée → le patrimoine perso renfloue d'abord.
  if (state.cash < limit && state.meta.legal === 'independant' && state.personal.cash > 0) {
    const need = Math.min(state.personal.cash, limit - state.cash + 1);
    personalOut(state, need, 'renflouement');
    receive(state, need, 'apport');
    state.stats.apports = (state.stats.apports || 0) + need;
    log(state, 'bad', `Responsabilité illimitée : ${(need / 100).toFixed(0)} € de ton épargne personnelle renflouent l'entreprise.`);
  }
  if (state.cash < 0) eg.wasNegative = true;
  if (state.cash < limit) {
    eg.distressDays += 1;
    eg.maxDistress = Math.max(eg.maxDistress, eg.distressDays);
    state.flags.salaryLate = true;
    if (eg.distressDays === 1) {
      log(state, 'bad', 'Défaut de paiement ! Ta trésorerie dépasse le découvert autorisé. Trouve du cash (prêt, apport, ventes) avant la faillite.', true);
    }
    const grace = DIFFICULTIES[state.meta.difficulty].graceDays;
    if (eg.distressDays >= grace) goBankrupt(state);
  } else {
    if (eg.distressDays > 0) log(state, 'good', 'Tu es sorti du défaut de paiement.');
    eg.distressDays = 0;
    state.flags.salaryLate = false;
    if (eg.wasNegative && state.cash > 0) {
      eg.recoveredFromNegative += 1;
      eg.wasNegative = false;
    }
  }
}

export function goBankrupt(state) {
  state.status = 'bankrupt';
  state.endgame.bankruptDay = state.time.day;
  if (state.meta.legal === 'independant') {
    // Les créanciers saisissent le patrimoine personnel (simplifié).
    state.endgame.seized = Math.max(0, state.personal.cash);
    state.personal.cash = Math.min(0, state.personal.cash);
  }
  state.endgame.postmortem = buildPostMortem(state);
  log(state, 'bad', 'Faillite prononcée par le tribunal de l’entreprise.', true);
}
