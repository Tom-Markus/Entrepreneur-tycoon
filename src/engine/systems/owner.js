// Le dirigeant : prélèvements (indépendant) ou rémunération (SRL), coût de la vie.
// La fiscalité personnelle détaillée (IPP, cotisations, précompte) est dans tax.js.

import { pay, personalIn, personalOut } from '../ledger.js';
import { directorIpp } from '../taxmath.js';
import { log } from '../log.js';

/**
 * Transfert du compte pro vers le compte perso.
 * Indépendant : simple prélèvement (le bénéfice est taxé à l'IPP de toute façon).
 * SRL : rémunération de dirigeant (charge déductible pour la société), avec
 * précompte professionnel retenu à la source (régularisé en fin d'année par tax.js).
 */
export function transferToOwner(state, amount, reason = 'draw') {
  if (amount <= 0) return 0;
  if (state.meta.legal === 'srl') {
    pay(state, amount, 'remuneration');
    personalIn(state, amount, reason === 'draw' ? 'revenu' : 'renflouement');
    // Précompte professionnel retenu à la source (taux moyen estimé sur l'année).
    const annual = Math.max(amount, state.personal.draw) * 12;
    const rate = annual > 0 ? directorIpp(annual) / annual : 0;
    const w = Math.round(amount * rate);
    personalOut(state, w, 'precompte');
    state.tax.year.precompte += w;
    state.tax.year.directorPay += amount;
  } else {
    pay(state, amount, 'prelevement');
    personalIn(state, amount, reason === 'draw' ? 'revenu' : 'renflouement');
  }
  return amount;
}

export function monthEnd(state) {
  const p = state.personal;
  // 1) Prélèvement / rémunération du mois (dans la limite de ce qui est disponible).
  const available = Math.max(0, Math.floor(state.cash + state.finance.overdraftLimit * 0.5));
  const draw = Math.min(p.draw, available);
  transferToOwner(state, draw);
  if (draw < p.draw) log(state, 'bad', 'Trésorerie trop juste : ta rémunération du mois a été réduite.');
}

/** Après les impôts du mois : coût de la vie, renflouement si nécessaire. */
export function endOfMonthLiving(state) {
  const p = state.personal;
  personalOut(state, p.livingCost, 'vie');
  let taken = 0;
  // Plusieurs passes : en SRL, le précompte retenu réduit le net versé.
  for (let i = 0; i < 4 && p.cash < 0; i++) {
    const need = -p.cash;
    transferToOwner(state, need, 'emergency');
    taken += need;
  }
  if (taken > 0) log(state, 'bad', `Ton compte perso était à sec : ${(taken / 100).toFixed(0)} € pris sur l'entreprise pour vivre.`);
  p.history.push({ cash: p.cash, ...p.month });
  if (p.history.length > 240) p.history.shift();
  p.month = {};
}
