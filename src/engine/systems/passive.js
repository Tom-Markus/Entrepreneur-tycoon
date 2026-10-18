// Revenu passif mensuel net, patrimoine, victoire (voir docs/DESIGN.md § 11.2).

import { INVESTMENTS as I } from '../../data/investments.js';
import { FISCALITE as F } from '../../data/fiscalite.js';
import { hasManager } from './staff.js';
import { savingsRate } from './investments.js';
import { netWorth } from '../selectors.js';
import { ippTax, socialAnnualDue, socialBaseFromProfit, isocTax, reducedRateEligible, directorIpp } from '../taxmath.js';
import { log } from '../log.js';

export function init(state) {
  state.passive = { total: 0, avg3: 0, parts: {}, history: [] };
}

/** Bénéfice net mensuel que l'entreprise verse au fondateur, après impôts (estimation). */
export function businessPassive(state) {
  if (state.staff.founder.active || !hasManager(state)) return 0;
  const h = state.finance.history.slice(-6);
  if (!h.length) return 0;
  const profit = h.reduce((s, x) => s + x.profit, 0) / h.length;
  if (state.meta.legal === 'srl') {
    const pay = state.personal.draw;
    const annualProfit = Math.max(0, profit * 12);
    const isoc = isocTax(annualProfit, reducedRateEligible(pay * 12, annualProfit));
    const dividends = (annualProfit - isoc) * (1 - F.dividendes.vvprbisYear3) * state.ownership.founder;
    const salary = pay * 12 - directorIpp(pay * 12) - socialAnnualDue(socialBaseFromProfit(pay * 12));
    return Math.max(0, Math.round((dividends + Math.max(0, salary)) / 12));
  }
  const annual = Math.max(0, profit * 12);
  const social = socialAnnualDue(socialBaseFromProfit(annual));
  const net = annual - social - ippTax(Math.max(0, annual - social)).total;
  return Math.max(0, Math.round(net / 12));
}

/** Décomposition du revenu passif mensuel net. */
export function computePassive(state) {
  const inv = state.investments;
  const epargne = Math.round((inv.savings * savingsRate(state) * (1 - (inv.savings * savingsRate(state) > F.epargne.exemptInterest ? F.epargne.taxRate : 0))) / 12);
  const portfolio = inv.etf.value + inv.stocks.value;
  // Règle des 4 % nette d'une taxe sur les plus-values estimée
  const bourse = Math.round((portfolio * I.safeWithdrawalRate * (1 - F.plusValues.rate * 0.5)) / 12);
  let immobilier = 0;
  for (const p of inv.realEstate) {
    const expectedRent = p.rent * (1 - I.realEstate.vacancyProbYearly * 0.17);
    const costs = (p.value * p.maintenance) / 12 + (p.rent * F.immobilier.precompteMoisLoyer) / 12 + p.rent * F.immobilier.ippSurLoyer;
    immobilier += expectedRent - costs - (p.mortgage.remaining > 0 ? p.mortgage.payment : 0);
  }
  immobilier = Math.round(immobilier);
  const entreprise = businessPassive(state);
  const parts = { epargne, bourse, immobilier, entreprise };
  return { parts, total: epargne + bourse + immobilier + entreprise };
}

export function monthEnd(state) {
  const p = state.passive;
  const c = computePassive(state);
  p.parts = c.parts;
  p.total = c.total;
  p.history.push(c.total);
  if (p.history.length > 600) p.history.shift();
  const last3 = p.history.slice(-3);
  p.avg3 = Math.round(last3.reduce((a, b) => a + b, 0) / last3.length);
  // Compléter l'instantané du mois
  const snap = state.finance.history[state.finance.history.length - 1];
  if (snap) {
    snap.passive = p.total;
    snap.netWorth = netWorth(state);
  }
  // Victoire : moyenne sur 3 mois ≥ objectif
  if (state.status === 'playing' && last3.length === 3 && p.avg3 >= state.passiveTarget) {
    state.status = 'won';
    state.endgame.wonDay = state.time.day;
    log(state, 'good', 'LIBERTÉ FINANCIÈRE ! Tes revenus passifs couvrent ton objectif.', true);
  }
}
