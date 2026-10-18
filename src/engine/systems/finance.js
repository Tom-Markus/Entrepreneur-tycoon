// Finance : créances, découvert, historique mensuel, trésorerie quotidienne.

import { ECONOMY } from '../../data/economy.js';
import { CONFIG } from '../../data/config.js';
import { processReceivables, pay, resetMonth, resetYear, amortizationForYear, receivablesTotal } from '../ledger.js';
import { dateOf, monthIndexOf } from '../calendar.js';
import { log } from '../log.js';
import { clamp } from '../money.js';

export function daily(state) {
  processReceivables(state, (r) => {
    log(state, 'bad', `Impayé : ${r.label || 'un client'} ne paiera jamais sa facture (${(r.amount / 100).toFixed(0)} €).`, true);
  });
  // Intérêts débiteurs du découvert (calculés chaque jour, année de 360 jours).
  if (state.cash < 0) {
    const interest = Math.round((-state.cash * state.finance.overdraftRate) / 360);
    if (interest > 0) pay(state, interest, 'interets');
  }
}

export function endOfDay(state) {
  const dc = state.finance.dailyCash;
  dc.push(state.cash);
  if (dc.length > CONFIG.dailyHistoryDays) dc.splice(0, dc.length - CONFIG.dailyHistoryDays);
}

/** Moyenne du chiffre d'affaires mensuel sur les n derniers mois. */
export function avgRevenue(state, n = 3) {
  const h = state.finance.history.slice(-n);
  if (!h.length) return 0;
  return h.reduce((s, x) => s + x.revenue, 0) / h.length;
}

export function monthEnd(state) {
  const f = state.finance;
  const d = dateOf(state.time.day);
  const amort = Math.round(amortizationForYear(state, d.yearIdx) / 12);
  const snap = {
    m: monthIndexOf(state.time.day),
    revenue: f.month.revenue,
    expenses: f.month.expenses,
    amort,
    profit: f.month.revenue - f.month.expenses - amort,
    cash: state.cash,
    personal: state.personal.cash,
    receivables: receivablesTotal(state),
    reputation: Math.round(state.company.reputation * 10) / 10,
    share: Math.round(state.company.share * 1000) / 1000,
    employees: state.staff.employees.length,
    byCat: { ...f.month.byCat },
    revByCat: { ...f.month.revByCat },
    inflow: f.month.inflow,
    outflow: f.month.outflow,
  };
  // Les autres systèmes peuvent compléter l'instantané (patrimoine, passif…).
  state.finance.pendingSnapshot = snap;
  f.history.push(snap);
  if (f.history.length > 600) f.history.shift();
  // Limite de découvert : ≈ 50 % du CA mensuel moyen, jamais sous le minimum de départ.
  const avg = avgRevenue(state, 3);
  const credibility = state.meta.legal === 'srl' ? 1 : 0.8;
  f.overdraftLimit = clamp(Math.round(avg * ECONOMY.overdraftRevenueShare * credibility), ECONOMY.overdraftStart, ECONOMY.overdraftMax);
  if (state.flags.overdraftCut) f.overdraftLimit = ECONOMY.overdraftStart;
  resetMonth(state);
}

/** Après le calcul de l'impôt annuel (tax.yearEnd), on remet l'année à zéro. */
export function yearEnd(state) {
  resetYear(state);
}
