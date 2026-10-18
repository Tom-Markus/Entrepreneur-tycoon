// Fiscalité : TVA trimestrielle, cotisations sociales (provisoires + régularisation),
// IPP / ISOC annuels, précompte professionnel, dividendes, échéancier.
// Les taux viennent de src/data/fiscalite.js ; les calculs de src/engine/taxmath.js.

import { FISCALITE as F } from '../../data/fiscalite.js';
import { pay, receive, personalOut, personalIn, amortizationForYear } from '../ledger.js';
import { dateOf, dayOf, formatDate } from '../calendar.js';
import {
  ippTax, isocTax, reducedRateEligible, socialQuarterly, socialAnnualDue, socialBaseFromProfit, directorFlatCosts, dividendExemptionCredit,
} from '../taxmath.js';
import { log } from '../log.js';

const STARTER_YEARS = 3;

export function init(state) {
  state.tax = {
    schedule: [], // échéances à venir : { id, kind, label, dueDay, amount, payer: 'company'|'personal' }
    seq: 0,
    social: { chosenBase: 0, lastIncome: null, provisionalFor: {} }, // provisionalFor[année] = provisionnelles appelées pour cette année
    year: { socialPaidCompany: 0, socialPaidPersonal: 0, precompte: 0, dividendsGross: 0, dividendRateMax: 0, directorPay: 0 },
    lossCarry: 0,
    reserves: 0, // bénéfices reportés distribuables (SRL)
    results: [], // résultats annuels
    paidTotals: { tva: 0, impot: 0, cotisations: 0 },
    vatQuarters: [],
  };
}

// --- Échéancier --------------------------------------------------------------

export function schedulePayment(state, { kind, label, dueDay, amount, payer = 'company' }) {
  state.tax.seq += 1;
  state.tax.schedule.push({ id: state.tax.seq, kind, label, dueDay, amount, payer });
  state.tax.schedule.sort((a, b) => a.dueDay - b.dueDay);
}

function settle(state, item) {
  const cat = item.kind === 'tva' ? 'tva' : item.kind === 'cotisations' || item.kind === 'regul' ? 'cotisations' : 'impot';
  if (item.amount >= 0) {
    if (item.payer === 'personal') {
      personalOut(state, item.amount, cat);
      if (cat === 'cotisations') state.tax.year.socialPaidPersonal += item.amount;
    } else {
      pay(state, item.amount, cat);
      if (cat === 'cotisations') state.tax.year.socialPaidCompany += item.amount;
    }
    state.tax.paidTotals[cat] = (state.tax.paidTotals[cat] || 0) + item.amount;
    if (item.amount > 0) {
      log(state, 'tax', `${item.label} payé : ${(item.amount / 100).toLocaleString('fr-BE', { maximumFractionDigits: 0 })} €.`, item.amount > 200_000);
      if (item.kind === 'tva') state.stats.vatPaid = (state.stats.vatPaid || 0) + 1;
    }
  } else {
    const refund = -item.amount;
    if (item.payer === 'personal') personalIn(state, refund, 'remboursement');
    else receive(state, refund, 'autres_revenus');
    if (cat === 'cotisations') {
      if (item.payer === 'personal') state.tax.year.socialPaidPersonal -= refund;
      else state.tax.year.socialPaidCompany -= refund;
    }
    log(state, 'good', `${item.label} : remboursement de ${(refund / 100).toLocaleString('fr-BE', { maximumFractionDigits: 0 })} €.`, refund > 100_000);
  }
}

export function daily(state) {
  const t = state.tax;
  const today = state.time.day;
  while (t.schedule.length && t.schedule[0].dueDay <= today) settle(state, t.schedule.shift());
  // Franchise TVA : sortie automatique au-delà du seuil.
  const f = state.finance;
  if (f.franchise && f.vatYearTurnover > F.tva.franchiseThreshold) {
    f.franchise = false;
    log(state, 'tax', 'Ton chiffre d’affaires dépasse 25 000 € : tu sors du régime de franchise et dois désormais facturer la TVA.', true);
  }
}

// --- TVA ------------------------------------------------------------------------

function vatDeclaration(state) {
  const f = state.finance;
  const d = dateOf(state.time.day);
  const net = f.vat.collected - f.vat.deductible;
  state.tax.vatQuarters.push({ q: d.quarter, year: d.year, collected: f.vat.collected, deductible: f.vat.deductible, net });
  if (state.tax.vatQuarters.length > 40) state.tax.vatQuarters.shift();
  f.vat.collected = 0;
  f.vat.deductible = 0;
  if (net === 0) return;
  // Échéance : le 20 du mois qui suit le trimestre.
  const nextMonth = d.month + 1;
  const due = nextMonth > 11 ? dayOf(d.yearIdx + 1, 0, F.tva.dueDayOfMonth) : dayOf(d.yearIdx, nextMonth, F.tva.dueDayOfMonth);
  schedulePayment(state, { kind: 'tva', label: `TVA du T${d.quarter + 1} ${d.year}`, dueDay: due, amount: net });
}

// --- Cotisations sociales ----------------------------------------------------------

/** Base annuelle utilisée pour les cotisations provisoires. */
export function provisionalBase(state) {
  const yearIdx = dateOf(state.time.day).yearIdx;
  const s = state.tax.social;
  const known = yearIdx >= STARTER_YEARS && s.lastIncome != null ? s.lastIncome : 0;
  return Math.max(known, s.chosenBase || 0);
}

export function quarterlySocial(state) {
  return socialQuarterly(provisionalBase(state));
}

function socialProvisional(state) {
  const amount = quarterlySocial(state);
  const d = dateOf(state.time.day);
  // Indépendant : payé par l'entreprise (même patrimoine). SRL : par le dirigeant.
  const payer = state.meta.legal === 'srl' ? 'personal' : 'company';
  const pf = state.tax.social.provisionalFor;
  pf[d.yearIdx] = (pf[d.yearIdx] || 0) + amount;
  schedulePayment(state, { kind: 'cotisations', label: `Cotisations sociales T${d.quarter + 1}`, dueDay: state.time.day + 1, amount, payer });
}

// --- Annuel ---------------------------------------------------------------------------

function annualDue(yearIdx) {
  return dayOf(yearIdx + 1, 5, 30); // 30 juin N+1 (simplifié)
}

function regulDue(yearIdx) {
  return dayOf(yearIdx + 1, F.social.regularizationMonth, 15);
}

/** Résultat fiscal de l'année en cours (estimation possible en cours d'année). */
export function yearResult(state, { projectFullYear = false } = {}) {
  const f = state.finance;
  const d = dateOf(state.time.day);
  const t = state.tax;
  const frac = projectFullYear ? Math.max(1, (d.dayOfYear + 1) / 360) : 1;
  const scale = projectFullYear ? 1 / Math.min(1, frac) : 1;
  const revenue = f.year.revenue * scale;
  const expenses = f.year.expenses * scale;
  const amort = amortizationForYear(state, d.yearIdx);
  const operating = Math.round(revenue - expenses - amort);
  if (state.meta.legal === 'srl') {
    const directorPay = t.year.directorPay * scale;
    const taxable = Math.max(0, operating - t.lossCarry);
    const reduced = reducedRateEligible(directorPay, taxable);
    const isoc = isocTax(taxable, reduced);
    // IPP du dirigeant sur sa rémunération
    const socialP = Math.max(t.year.socialPaidPersonal * scale, socialAnnualDue(socialBaseFromProfit(directorPay)));
    const net = Math.max(0, directorPay - socialP);
    const ipp = ippTax(net - directorFlatCosts(net)).total;
    return { legal: 'srl', revenue, expenses, amort, operating, taxable, reduced, isoc, directorPay, ipp, precompte: t.year.precompte * scale, social: socialP };
  }
  const socialPaid = t.year.socialPaidCompany * scale;
  const beforeSocial = operating;
  const taxable = Math.max(0, beforeSocial - socialPaid - t.lossCarry);
  const ipp = ippTax(taxable).total;
  return { legal: 'independant', revenue, expenses, amort, operating, taxable, ipp, social: socialPaid, beforeSocial };
}

/** Impôt estimé pour l'année en cours (projection sur 12 mois) — affiché dans Finances. */
export function estimateYearTax(state) {
  const r = yearResult(state, { projectFullYear: true });
  if (r.legal === 'srl') return { company: r.isoc, personal: Math.max(0, r.ipp - r.precompte), result: r };
  const base = socialBaseFromProfit(r.beforeSocial);
  const regul = Math.max(0, socialAnnualDue(base) - r.social);
  return { company: r.ipp + regul, personal: 0, result: r, regul };
}

export function yearEnd(state) {
  const t = state.tax;
  const d = dateOf(state.time.day);
  const r = yearResult(state);
  const result = { year: d.year, yearIdx: d.yearIdx, ...r };

  if (r.legal === 'srl') {
    // Perte reportée
    if (r.operating < 0) t.lossCarry += -r.operating;
    else t.lossCarry = Math.max(0, t.lossCarry - r.operating);
    if (r.isoc > 0) schedulePayment(state, { kind: 'impot', label: `ISOC ${d.year}`, dueDay: annualDue(d.yearIdx), amount: r.isoc });
    t.reserves += Math.max(0, r.operating - r.isoc);
    if (r.operating < 0) t.reserves = Math.max(0, t.reserves + r.operating);
    // IPP du dirigeant : solde après précompte et crédit dividendes
    const credit = dividendExemptionCredit(t.year.dividendsGross, t.year.dividendRateMax);
    const balance = r.ipp - t.year.precompte - credit;
    result.dividendCredit = credit;
    result.ippBalance = balance;
    if (balance !== 0) schedulePayment(state, { kind: 'impot', label: `Solde IPP ${d.year}`, dueDay: annualDue(d.yearIdx), amount: balance, payer: 'personal' });
    // Régularisation des cotisations sur la rémunération réelle
    const base = socialBaseFromProfit(r.directorPay);
    const regul = socialAnnualDue(base) - (t.social.provisionalFor[d.yearIdx] || 0);
    result.regul = regul;
    if (Math.abs(regul) > 1000) schedulePayment(state, { kind: 'regul', label: `Régularisation cotisations ${d.year}`, dueDay: regulDue(d.yearIdx), amount: regul, payer: 'personal' });
    t.social.lastIncome = base;
    if (!r.reduced && r.taxable > 0) log(state, 'tax', `ISOC ${d.year} au taux plein (25 %) : ta rémunération (${Math.round(r.directorPay / 100)} €) est sous le seuil requis pour le taux réduit.`, true);
  } else {
    if (r.beforeSocial - r.social < 0) t.lossCarry += -(r.beforeSocial - r.social);
    else t.lossCarry = Math.max(0, t.lossCarry - (r.beforeSocial - r.social));
    const credit = dividendExemptionCredit(t.year.dividendsGross, t.year.dividendRateMax);
    const ipp = r.ipp - credit;
    result.dividendCredit = credit;
    if (ipp !== 0) schedulePayment(state, { kind: 'impot', label: `IPP ${d.year}`, dueDay: annualDue(d.yearIdx), amount: ipp });
    const base = socialBaseFromProfit(r.beforeSocial);
    const regul = socialAnnualDue(base) - (t.social.provisionalFor[d.yearIdx] || 0);
    result.regul = regul;
    if (Math.abs(regul) > 1000) {
      schedulePayment(state, { kind: 'regul', label: `Régularisation cotisations ${d.year}`, dueDay: regulDue(d.yearIdx), amount: regul });
      if (regul > 300_000) log(state, 'tax', `Ta caisse d'assurances sociales calcule une régularisation de ${Math.round(regul / 100)} € pour ${d.year}, payable le ${formatDate(regulDue(d.yearIdx))}. Prévois-la !`, true);
    }
    t.social.lastIncome = base;
  }
  delete t.social.provisionalFor[d.yearIdx - 2];
  t.results.push(result);
  if (t.results.length > 60) t.results.shift();
  t.year = { socialPaidCompany: 0, socialPaidPersonal: 0, precompte: 0, dividendsGross: 0, dividendRateMax: 0, directorPay: 0 };
  state.finance.vatYearTurnover = 0;
  const total = (result.isoc || 0) + Math.max(0, result.ippBalance ?? result.ipp ?? 0);
  log(state, 'tax', `Clôture ${d.year} : résultat ${Math.round(r.operating / 100)} €, impôt calculé ${Math.round(total / 100)} € exigible le ${formatDate(annualDue(d.yearIdx))}.`, true);
}

export function quarterEnd(state) {
  if (!state.finance.franchise) vatDeclaration(state);
  else {
    state.finance.vat.collected = 0;
    state.finance.vat.deductible = 0;
  }
  socialProvisional(state);
}

/** Échéances à venir (pour l'interface et les bots). */
export function upcoming(state, days = 400) {
  return state.tax.schedule.filter((s) => s.dueDay <= state.time.day + days);
}

export { STARTER_YEARS };
