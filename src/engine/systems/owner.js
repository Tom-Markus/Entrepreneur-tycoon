// Le dirigeant : prélèvements (indépendant) ou rémunération (SRL), coût de la vie.
// La fiscalité personnelle détaillée (IPP, cotisations, précompte) est dans tax.js.

import { pay, personalIn, personalOut } from '../ledger.js';
import { log } from '../log.js';

/**
 * Transfert du compte pro vers le compte perso.
 * Indépendant : simple prélèvement (le bénéfice est taxé à l'IPP de toute façon).
 * SRL : rémunération de dirigeant (charge déductible pour la société) ; le
 * précompte professionnel est géré par tax.js via `state.personal.payslip`.
 */
export function transferToOwner(state, amount, reason = 'draw') {
  if (amount <= 0) return 0;
  if (state.meta.legal === 'srl') {
    pay(state, amount, 'remuneration');
    state.personal.grossPayYear = (state.personal.grossPayYear || 0) + amount;
    state.personal.pendingGross = (state.personal.pendingGross || 0) + amount;
  } else {
    pay(state, amount, 'prelevement');
  }
  personalIn(state, amount, reason === 'draw' ? 'revenu' : 'renflouement');
  return amount;
}

export function monthEnd(state) {
  const p = state.personal;
  // 1) Prélèvement / rémunération du mois (dans la limite de ce qui est disponible).
  const available = Math.max(0, state.cash + state.finance.overdraftLimit * 0.5);
  const draw = Math.min(p.draw, available);
  transferToOwner(state, draw);
  if (draw < p.draw) log(state, 'bad', 'Trésorerie trop juste : ta rémunération du mois a été réduite.');
}

/** Après les impôts du mois : coût de la vie, renflouement si nécessaire. */
export function endOfMonthLiving(state) {
  const p = state.personal;
  personalOut(state, p.livingCost, 'vie');
  if (p.cash < 0) {
    const need = -p.cash;
    transferToOwner(state, need, 'emergency');
    log(state, 'bad', `Ton compte perso était à sec : ${(need / 100).toFixed(0)} € pris sur l'entreprise pour vivre.`);
  }
  p.history.push({ cash: p.cash, ...p.month });
  if (p.history.length > 240) p.history.shift();
  p.month = {};
}
