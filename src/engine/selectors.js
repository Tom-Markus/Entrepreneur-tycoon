// Valeurs dérivées de l'état, utilisées par l'interface, le score et les bots.

import { bookValue, receivablesTotal } from './ledger.js';
import { sectorModule } from './sectors/index.js';

/** Dettes bancaires restantes (capital). */
export function debtTotal(state) {
  let d = 0;
  for (const l of state.loans || []) d += l.remaining;
  return d;
}

/** Valeur du portefeuille personnel (placements + immobilier net de crédit). */
export function investmentsValue(state) {
  const inv = state.investments;
  if (!inv) return 0;
  let v = inv.savings + inv.etf.value + inv.stocks.value;
  for (const p of inv.realEstate) v += p.value - p.mortgage.remaining;
  return v;
}

/** Dettes fiscales déjà connues mais pas encore payées. */
export function taxLiabilities(state) {
  let t = 0;
  if (state.tax) for (const s of state.tax.schedule) if (s.amount > 0) t += s.amount;
  if (state.finance) t += Math.max(0, state.finance.vat.collected - state.finance.vat.deductible);
  return t;
}

/**
 * Patrimoine net du fondateur ≈ part de l'entreprise (trésorerie + créances +
 * stock + actifs − dettes) + compte perso + placements.
 */
export function netWorth(state) {
  const ownership = state.ownership ? state.ownership.founder : 1;
  const m = sectorModule(state);
  const stock = m.stockValue ? m.stockValue(state) : 0;
  const business = state.cash + receivablesTotal(state) + stock + bookValue(state) - debtTotal(state) - taxLiabilities(state);
  // SRL : responsabilité limitée (une société en négatif vaut 0 pour le fondateur).
  const share = business > 0 ? Math.round(business * ownership) : state.meta.legal === 'srl' ? 0 : business;
  return share + state.personal.cash + investmentsValue(state);
}

export function kpis(state) {
  const m = sectorModule(state);
  return m.kpis ? m.kpis(state) : [];
}

export function lastMonths(state, n = 12) {
  return state.finance.history.slice(-n);
}

/**
 * Revenu passif mensuel net (voir docs/DESIGN.md § 11.2). Le détail est
 * calculé chaque fin de mois par passive.js ; on lit le dernier résultat.
 */
export function passiveIncome(state) {
  const p = state.passive || { total: 0, avg3: 0, parts: {} };
  return { total: p.avg3 || 0, last: p.total || 0, parts: p.parts || {}, target: state.passiveTarget || 0 };
}
