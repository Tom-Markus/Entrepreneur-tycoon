// Calculs fiscaux PURS (aucun état) à partir de src/data/fiscalite.js.
// Tous les montants en centimes.

import { FISCALITE as F } from '../data/fiscalite.js';

/** Impôt progressif brut sur un montant selon les tranches. */
function progressive(amount, brackets) {
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (amount <= prev) break;
    const slice = Math.min(amount, b.upTo) - prev;
    tax += slice * b.rate;
    prev = b.upTo;
  }
  return tax;
}

/**
 * IPP d'un revenu imposable annuel (centimes).
 * Quotité exemptée = réduction d'impôt calculée sur la quotité au barème.
 * Additionnels communaux appliqués sur l'impôt de l'État.
 */
export function ippTax(taxable) {
  const t = Math.max(0, taxable);
  const gross = progressive(t, F.ipp.brackets);
  const reduction = progressive(Math.min(t, F.ipp.quotiteExemptee), F.ipp.brackets);
  const state = Math.max(0, gross - reduction);
  const total = Math.round(state * (1 + F.ipp.centimesAdditionnels));
  return { total, state: Math.round(state), communal: total - Math.round(state), marginal: marginalRate(t) };
}

export function marginalRate(taxable) {
  for (const b of F.ipp.brackets) if (taxable <= b.upTo) return b.rate;
  return F.ipp.brackets[F.ipp.brackets.length - 1].rate;
}

/** Cotisations sociales annuelles « théoriques » sur un revenu (sans minimum, sans frais). */
export function socialOnIncome(income) {
  const s = F.social;
  const i = Math.max(0, income);
  const a = Math.min(i, s.ceiling1) * s.rate1;
  const b = Math.max(0, Math.min(i, s.ceiling2) - s.ceiling1) * s.rate2;
  return a + b;
}

/** Cotisation trimestrielle (minimum + frais de gestion inclus) pour une base annuelle. */
export function socialQuarterly(baseAnnual) {
  const q = Math.max(F.social.minQuarterly, socialOnIncome(baseAnnual) / 4);
  return Math.round(q * (1 + F.social.fraisGestion));
}

/** Cotisations annuelles définitives pour un revenu réel (4 trimestres). */
export function socialAnnualDue(income) {
  return socialQuarterly(income) * 4;
}

/**
 * Revenu de référence des cotisations à partir d'un bénéfice « avant cotisations ».
 * Les cotisations sont elles-mêmes déductibles : on résout r = P − c(r) par
 * quelques itérations (convergence rapide, le taux < 21 %).
 */
export function socialBaseFromProfit(profitBeforeSocial) {
  let r = Math.max(0, profitBeforeSocial);
  for (let i = 0; i < 6; i++) r = Math.max(0, profitBeforeSocial - socialAnnualDue(r));
  return r;
}

/**
 * ISOC. reducedOk = la société remplit les conditions du taux réduit PME
 * (rémunération du dirigeant suffisante).
 */
export function isocTax(taxable, reducedOk) {
  const t = Math.max(0, taxable);
  if (!reducedOk) return Math.round(t * F.isoc.normalRate);
  const low = Math.min(t, F.isoc.reducedBracket);
  return Math.round(low * F.isoc.reducedRate + (t - low) * F.isoc.normalRate);
}

/** Condition de rémunération du dirigeant pour le taux réduit. */
export function reducedRateEligible(directorPayYear, taxableProfit) {
  return directorPayYear >= Math.min(F.isoc.minDirectorPay, Math.max(0, taxableProfit));
}

/** Frais forfaitaires du dirigeant d'entreprise. */
export function directorFlatCosts(netIncome) {
  return Math.round(Math.min(Math.max(0, netIncome) * F.dirigeant.fraisForfaitairesRate, F.dirigeant.fraisForfaitairesMax));
}

/** IPP estimé d'un dirigeant pour une rémunération brute annuelle. */
export function directorIpp(grossAnnual) {
  const social = socialAnnualDue(socialBaseFromProfit(grossAnnual));
  const net = Math.max(0, grossAnnual - social);
  return ippTax(net - directorFlatCosts(net)).total;
}

/** Précompte professionnel mensuel estimé (rémunération mensuelle constante). */
export function monthlyWithholding(grossMonthly) {
  return Math.round(directorIpp(grossMonthly * 12) / 12);
}

/**
 * Taux de précompte mobilier sur un dividende de la société selon son ancienneté
 * (VVPR-bis simplifié) : exercice 1 → 30 %, exercice 2 → 20 %, ensuite 15 %.
 */
export function dividendRate(companyYearIdx) {
  if (companyYearIdx <= 0) return F.dividendes.precompte;
  if (companyYearIdx === 1) return F.dividendes.vvprbisYear2;
  return F.dividendes.vvprbisYear3;
}

/** Crédit d'impôt pour l'exonération des dividendes (833 € × taux, plafonné). */
export function dividendExemptionCredit(dividendsGross, rate) {
  return Math.round(Math.min(dividendsGross, F.dividendes.exemption) * rate);
}
