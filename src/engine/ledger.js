// Registre comptable : TOUT mouvement d'argent passe par ces fonctions.
// Elles tiennent à jour la trésorerie, la TVA du trimestre, le compte de
// résultat du mois et de l'année (base imposable) et les flux par catégorie
// (utilisés par le post-mortem).

import { mul } from './money.js';
import { ECONOMY } from '../data/economy.js';
import { dateOf } from './calendar.js';

/** Catégories qui ne sont PAS des charges déductibles (flux financiers ou impôts). */
const NON_EXPENSE = new Set([
  'tva', 'impot', 'cotisations', 'precompte', 'remboursement', 'prelevement', 'dividende', 'investissement',
]);

export function initLedger(state) {
  state.finance = {
    month: emptyPeriod(),
    year: emptyPeriod(),
    totals: { revenue: 0, expenses: 0 },
    vat: { collected: 0, deductible: 0 },
    vatYearTurnover: 0, // CA de l'année civile (franchise TVA)
    receivables: [],
    receivableSeq: 0,
    assets: [], // investissements amortissables
    history: [], // instantanés mensuels
    dailyCash: [],
    overdraftLimit: ECONOMY.overdraftStart,
    overdraftRate: ECONOMY.overdraftRate,
    franchise: false,
  };
}

function emptyPeriod() {
  return { revenue: 0, expenses: 0, byCat: {}, revByCat: {}, outflow: 0, inflow: 0 };
}

export function resetMonth(state) {
  state.finance.month = emptyPeriod();
}
export function resetYear(state) {
  state.finance.year = emptyPeriod();
}

function addCat(obj, cat, amount) {
  obj[cat] = (obj[cat] || 0) + amount;
}

function recordRevenue(state, ht, cat) {
  const f = state.finance;
  f.month.revenue += ht;
  f.year.revenue += ht;
  f.totals.revenue += ht;
  addCat(f.month.revByCat, cat, ht);
  addCat(f.year.revByCat, cat, ht);
  f.vatYearTurnover += ht;
}

function recordExpense(state, amount, cat) {
  const f = state.finance;
  if (NON_EXPENSE.has(cat)) return;
  f.month.expenses += amount;
  f.year.expenses += amount;
  f.totals.expenses += amount;
}

function recordOut(state, amount, cat) {
  const f = state.finance;
  f.month.outflow += amount;
  addCat(f.month.byCat, cat, amount);
  addCat(f.year.byCat, cat, amount);
}

function vatFor(state, ht, rate) {
  return state.finance.franchise ? 0 : mul(ht, rate);
}

/** Vente encaissée immédiatement. Retourne le montant TTC encaissé. */
export function earn(state, ht, vatRate, cat) {
  if (ht <= 0) return 0;
  const vat = vatFor(state, ht, vatRate);
  state.cash += ht + vat;
  state.finance.vat.collected += vat;
  state.finance.month.inflow += ht + vat;
  recordRevenue(state, ht, cat);
  return ht + vat;
}

/**
 * Facture à payer plus tard (créance). Le chiffre d'affaires et la TVA sont
 * dus dès la facturation (règle belge) : la TVA peut donc être due avant
 * l'encaissement !
 */
export function invoice(state, ht, vatRate, cat, { dueIn = 30, defaultProb = 0, lateProb = 0, label = '', rng = null } = {}) {
  if (ht <= 0) return null;
  const vat = vatFor(state, ht, vatRate);
  state.finance.vat.collected += vat;
  recordRevenue(state, ht, cat);
  let due = state.time.day + dueIn;
  let willDefault = false;
  if (rng) {
    if (rng.chance(lateProb)) due += rng.int(15, 45);
    willDefault = rng.chance(defaultProb);
  }
  const r = {
    id: ++state.finance.receivableSeq,
    ht,
    vat,
    amount: ht + vat,
    due,
    cat,
    label,
    willDefault,
  };
  state.finance.receivables.push(r);
  return r;
}

/** Encaisse les créances arrivées à échéance (appelé chaque jour). */
export function processReceivables(state, onDefault) {
  const f = state.finance;
  const today = state.time.day;
  const keep = [];
  for (const r of f.receivables) {
    if (r.due > today) {
      keep.push(r);
      continue;
    }
    if (r.willDefault) {
      // Impayé : la TVA est récupérée (note de crédit), le HT devient une perte.
      f.vat.collected -= r.vat;
      recordExpense(state, r.ht, 'creances');
      addCat(f.month.byCat, 'creances', r.ht);
      state.stats.badDebts = (state.stats.badDebts || 0) + r.ht;
      if (onDefault) onDefault(r);
    } else {
      state.cash += r.amount;
      f.month.inflow += r.amount;
    }
  }
  f.receivables = keep;
}

/** Remboursement d'une vente (retour produit) : CA et TVA collectée diminuent. */
export function refund(state, ht, vatRate, cat) {
  if (ht <= 0) return 0;
  const vat = vatFor(state, ht, vatRate);
  const f = state.finance;
  state.cash -= ht + vat;
  f.vat.collected -= vat;
  f.month.revenue -= ht;
  f.year.revenue -= ht;
  f.totals.revenue -= ht;
  f.month.revByCat[cat] = (f.month.revByCat[cat] || 0) - ht;
  f.year.revByCat[cat] = (f.year.revByCat[cat] || 0) - ht;
  recordOut(state, ht + vat, 'retours');
  return ht + vat;
}

/**
 * Achat avec TVA. opts.capex = investissement amorti (pas une charge immédiate).
 * En franchise TVA, la TVA n'est pas déductible : elle devient une charge.
 */
export function spend(state, ht, vatRate, cat, opts = {}) {
  if (ht <= 0) return 0;
  const vat = mul(ht, vatRate);
  const total = ht + vat;
  state.cash -= total;
  const deductibleVat = state.finance.franchise ? 0 : vat;
  state.finance.vat.deductible += deductibleVat;
  const cost = ht + (vat - deductibleVat);
  if (opts.capex) {
    const d = dateOf(state.time.day);
    state.finance.assets.push({ label: opts.label || cat, cost, yearIdx: d.yearIdx, years: ECONOMY.amortizationYears });
    recordOut(state, total, 'investissement');
  } else {
    recordExpense(state, cost, cat);
    recordOut(state, total, cat);
  }
  return total;
}

/** Paiement sans TVA (salaires, impôts, remboursements, assurances…). */
export function pay(state, amount, cat) {
  if (amount <= 0) return 0;
  state.cash -= amount;
  recordExpense(state, amount, cat);
  recordOut(state, amount, cat);
  return amount;
}

/** Entrée d'argent qui n'est pas un chiffre d'affaires (prêt, apport, subvention). */
export function receive(state, amount, cat, { taxable = false } = {}) {
  if (amount <= 0) return 0;
  state.cash += amount;
  state.finance.month.inflow += amount;
  if (taxable) {
    state.finance.month.revenue += amount;
    state.finance.year.revenue += amount;
    addCat(state.finance.month.revByCat, cat, amount);
    addCat(state.finance.year.revByCat, cat, amount);
  }
  return amount;
}

/** Amortissement de l'année (fraction du coût des investissements). */
export function amortizationForYear(state, yearIdx) {
  let total = 0;
  for (const a of state.finance.assets) {
    if (yearIdx >= a.yearIdx && yearIdx < a.yearIdx + a.years) total += Math.round(a.cost / a.years);
  }
  return total;
}

/** Valeur nette comptable des investissements (pour le patrimoine). */
export function bookValue(state) {
  const y = dateOf(state.time.day).yearIdx;
  let v = 0;
  for (const a of state.finance.assets) {
    const used = Math.max(0, y - a.yearIdx);
    v += Math.max(0, Math.round(a.cost * (1 - used / a.years)));
  }
  return v;
}

/** Total des créances en attente. */
export function receivablesTotal(state) {
  let s = 0;
  for (const r of state.finance.receivables) s += r.amount;
  return s;
}

// --- Compte personnel du dirigeant ---------------------------------------

export function personalIn(state, amount, cat) {
  if (amount <= 0) return;
  state.personal.cash += amount;
  addCat(state.personal.month, cat, amount);
}

export function personalOut(state, amount, cat) {
  if (amount <= 0) return;
  state.personal.cash -= amount;
  addCat(state.personal.month, cat, -amount);
}
