// Placements personnels : épargne réglementée, ETF, actions, immobilier locatif.
// Rendements simulés (log-normaux + krachs), frais (TOB, courtage, droits
// d'enregistrement) et fiscalité belge simplifiée.

import { INVESTMENTS as I } from '../../data/investments.js';
import { FISCALITE as F } from '../../data/fiscalite.js';
import { personalIn, personalOut } from '../ledger.js';
import { annuity, clamp } from '../money.js';
import { dateOf } from '../calendar.js';
import { log } from '../log.js';

export function init(state) {
  state.investments = {
    savings: 0,
    etf: { value: 0, basis: 0 },
    stocks: { value: 0, basis: 0 },
    realEstate: [],
    reSeq: 0,
    index: { etf: 100, stocks: 100 },
    year: { interest: 0, dividends: 0, gains: 0, fees: 0, rent: 0 },
    lastMonth: { interest: 0, dividends: 0, rentNet: 0 },
    history: [],
  };
}

export function savingsRate(state) {
  return clamp(state.world.baseRate * I.savings.rateFromBase + I.savings.rateAdd, 0.002, 0.05);
}

export function mortgageRate(state) {
  return state.world.baseRate + I.realEstate.mortgageSpread;
}

/** Frais d'une transaction en bourse : TOB plafonnée + courtage. */
export function tradeFees(kind, amount) {
  const tob = kind === 'etf' ? F.tob.etf : F.tob.actions;
  const cfg = I[kind];
  return Math.round(Math.min(amount * tob.rate, tob.max) + Math.max(cfg.brokerMin, amount * cfg.brokerFee));
}

// --- Actions -----------------------------------------------------------------

export function deposit(state, amount) {
  amount = Math.round(amount);
  if (!(amount > 0) || amount > state.personal.cash) return { ok: false, message: 'Montant invalide ou compte perso insuffisant.' };
  personalOut(state, amount, 'epargne');
  state.investments.savings += amount;
  return { ok: true };
}

export function withdraw(state, amount) {
  amount = Math.round(amount);
  const inv = state.investments;
  if (!(amount > 0) || amount > inv.savings) return { ok: false, message: 'Montant invalide.' };
  inv.savings -= amount;
  personalIn(state, amount, 'epargne');
  return { ok: true };
}

export function buy(state, kind, amount) {
  amount = Math.round(amount);
  if (!['etf', 'stocks'].includes(kind)) return { ok: false, message: 'Produit inconnu.' };
  if (!(amount >= 10_000)) return { ok: false, message: 'Minimum 100 €.' };
  const fees = tradeFees(kind, amount);
  if (amount + fees > state.personal.cash) return { ok: false, message: 'Compte perso insuffisant (frais et TOB compris).' };
  personalOut(state, amount + fees, 'bourse');
  const p = state.investments[kind];
  p.value += amount;
  p.basis += amount;
  state.investments.year.fees += fees;
  state.stats.invested = (state.stats.invested || 0) + amount;
  return { ok: true };
}

export function sell(state, kind, amount) {
  const p = state.investments[kind];
  if (!p) return { ok: false, message: 'Produit inconnu.' };
  amount = Math.min(Math.round(amount), p.value);
  if (!(amount > 0)) return { ok: false, message: 'Rien à vendre.' };
  const fees = tradeFees(kind, amount);
  const basisPart = Math.round((p.basis * amount) / p.value);
  state.investments.year.gains += amount - basisPart;
  p.basis -= basisPart;
  p.value -= amount;
  personalIn(state, amount - fees, 'bourse');
  state.investments.year.fees += fees;
  return { ok: true };
}

/** Coût total d'achat d'un bien (prix + droits + notaire) et prêt nécessaire. */
export function propertyQuote(state, item, downPct) {
  const fees = Math.round(item.price * (F.immobilier.droitsEnregistrement + F.immobilier.fraisNotaire));
  const dp = clamp(downPct, I.realEstate.minDownPayment, 1);
  const loan = Math.round(item.price * (1 - dp));
  const cash = item.price - loan + fees;
  const rate = mortgageRate(state);
  const payment = loan > 0 ? annuity(loan, rate, I.realEstate.mortgageYears * 12) : 0;
  return { fees, loan, cash, rate, payment };
}

export function buyProperty(state, id, downPct = 0.2) {
  const item = I.realEstate.catalog.find((x) => x.id === id);
  if (!item) return { ok: false, message: 'Bien inconnu.' };
  const q = propertyQuote(state, item, downPct);
  if (q.cash > state.personal.cash) return { ok: false, message: `Il te faut ${Math.round(q.cash / 100)} € sur ton compte perso (apport + droits d'enregistrement + notaire).` };
  // La banque vérifie que la mensualité reste supportable (≈ 1/3 des revenus mensuels connus).
  const income = monthlyPersonalIncome(state);
  const totalPay = state.investments.realEstate.reduce((s, p) => s + p.mortgage.payment, 0) + q.payment;
  if (q.loan > 0 && totalPay > income * 0.5 + q.payment * 0.7) return { ok: false, message: 'La banque refuse le crédit : tes revenus ne couvrent pas assez les mensualités (augmente ton apport).' };
  personalOut(state, q.cash, 'immobilier');
  state.investments.reSeq += 1;
  state.investments.realEstate.push({
    id: state.investments.reSeq,
    type: item.id,
    label: item.label,
    price: item.price,
    value: item.price,
    rent: item.rent,
    maintenance: item.maintenance || I.realEstate.maintenancePct,
    vacantUntil: state.time.day + 30, // le temps de trouver un locataire
    mortgage: { remaining: q.loan, rate: q.rate, payment: q.payment, monthsLeft: q.loan > 0 ? I.realEstate.mortgageYears * 12 : 0 },
    boughtDay: state.time.day,
  });
  state.stats.propertiesBought = (state.stats.propertiesBought || 0) + 1;
  log(state, 'invest', `Achat : ${item.label} pour ${Math.round(item.price / 100)} € (+ ${Math.round(q.fees / 100)} € de droits et frais).`, true);
  return { ok: true };
}

export function sellProperty(state, pid) {
  const inv = state.investments;
  const p = inv.realEstate.find((x) => x.id === pid);
  if (!p) return { ok: false, message: 'Bien introuvable.' };
  const net = Math.round(p.value * (1 - I.realEstate.sellFeePct)) - p.mortgage.remaining;
  if (net < 0 && -net > state.personal.cash) return { ok: false, message: 'La vente ne couvre pas le crédit restant.' };
  if (net >= 0) personalIn(state, net, 'immobilier');
  else personalOut(state, -net, 'immobilier');
  inv.realEstate = inv.realEstate.filter((x) => x !== p);
  log(state, 'invest', `Vente : ${p.label} (${Math.round(net / 100)} € net après remboursement du crédit).`, true);
  return { ok: true };
}

/** Revenus mensuels connus du dirigeant (pour l'évaluation bancaire). */
export function monthlyPersonalIncome(state) {
  const h = (state.personal.history || []).slice(-6);
  let inc = 0;
  for (const m of h) inc += Math.max(0, (m.revenu || 0) + (m.dividendes || 0) + (m.loyers || 0));
  return h.length ? inc / h.length : state.personal.draw;
}

// --- Simulation mensuelle ----------------------------------------------------------

export function monthEnd(state, rng) {
  const inv = state.investments;
  const d = dateOf(state.time.day);
  // Marché : facteur commun (ETF) + spécifique (actions)
  const e = I.etf;
  const muE = Math.log(1 + e.annualReturn) / 12 - (e.annualVol * e.annualVol) / 24;
  const z = rng.normal(0, 1);
  let rE = muE + (e.annualVol / Math.sqrt(12)) * z + (state.world.economy - 1) * 0.01;
  if (rng.chance(I.crash.monthlyProb)) {
    const drop = rng.range(I.crash.drop[0], I.crash.drop[1]);
    rE += Math.log(1 - drop);
    state.stats.crashes = (state.stats.crashes || 0) + 1;
    log(state, 'invest', `Krach boursier : les marchés perdent ${Math.round(drop * 100)} % ! Garder son calme est souvent la meilleure stratégie.`, true);
  }
  const s = I.stocks;
  const muS = Math.log(1 + s.annualReturn) / 12 - (s.annualVol * s.annualVol) / 24;
  const idio = Math.sqrt(Math.max(0, (s.annualVol * s.annualVol) / 12 - (s.beta * s.beta * e.annualVol * e.annualVol) / 12));
  const rS = muS + s.beta * (rE - muE) + idio * rng.normal(0, 1);
  inv.index.etf *= Math.exp(rE);
  inv.index.stocks *= Math.exp(rS);
  inv.etf.value = Math.round(inv.etf.value * Math.exp(rE));
  inv.stocks.value = Math.round(inv.stocks.value * Math.exp(rS));
  // Dividendes trimestriels des actions (précompte 30 % retenu)
  let divNet = 0;
  if (d.month % 3 === 2 && inv.stocks.value > 0) {
    const gross = Math.round((inv.stocks.value * s.dividendYield) / 4);
    divNet = Math.round(gross * (1 - F.dividendes.precompte));
    personalIn(state, divNet, 'dividendes');
    inv.year.dividends += gross;
    state.tax.year.dividendsGross += gross;
    state.tax.year.dividendRateMax = Math.max(state.tax.year.dividendRateMax, F.dividendes.precompte);
  }
  // Épargne : intérêts capitalisés
  const interest = Math.round((inv.savings * savingsRate(state)) / 12);
  inv.savings += interest;
  inv.year.interest += interest;
  // Immobilier
  let rentNet = 0;
  const R = I.realEstate;
  for (const p of inv.realEstate) {
    const occupied = p.vacantUntil <= state.time.day;
    if (occupied) {
      personalIn(state, p.rent, 'loyers');
      inv.year.rent += p.rent;
      rentNet += p.rent;
      if (rng.chance(R.vacancyProbYearly / 12)) {
        p.vacantUntil = state.time.day + 30 * rng.int(R.vacancyMonths[0], R.vacancyMonths[1]);
        log(state, 'invest', `${p.label} : le locataire part, logement vide quelques mois.`);
      }
    }
    const maint = Math.round((p.value * p.maintenance) / 12);
    personalOut(state, maint, 'immobilier');
    rentNet -= maint;
    if (p.mortgage.remaining > 0) {
      const intr = Math.round((p.mortgage.remaining * p.mortgage.rate) / 12);
      const princ = Math.min(p.mortgage.remaining, p.mortgage.payment - intr);
      personalOut(state, intr + princ, 'credit_hypothecaire');
      p.mortgage.remaining -= princ;
      p.mortgage.monthsLeft -= 1;
      rentNet -= intr + princ;
    }
    // Précompte immobilier (septembre)
    if (d.month === 8) {
      const pi = Math.round(p.rent * F.immobilier.precompteMoisLoyer);
      personalOut(state, pi, 'impots_perso');
      rentNet -= pi;
    }
    const g = Math.log(1 + R.appreciation) / 12 + rng.normal(0, R.appreciationVol / Math.sqrt(12));
    p.value = Math.round(p.value * Math.exp(g));
  }
  inv.lastMonth = { interest, dividends: divNet, rentNet };
  inv.history.push({ m: Math.floor(state.time.day / 30), savings: inv.savings, etf: inv.etf.value, stocks: inv.stocks.value, re: inv.realEstate.reduce((t, p) => t + p.value - p.mortgage.remaining, 0) });
  if (inv.history.length > 600) inv.history.shift();
}

export function yearEnd(state) {
  const inv = state.investments;
  // Épargne : 15 % au-delà de l'exonération
  const taxSav = Math.round(Math.max(0, inv.year.interest - F.epargne.exemptInterest) * F.epargne.taxRate);
  if (taxSav > 0) inv.savings = Math.max(0, inv.savings - taxSav);
  // Plus-values financières : 10 % au-delà de 10 000 €
  const taxGains = Math.round(Math.max(0, inv.year.gains - F.plusValues.exemption) * F.plusValues.rate);
  if (taxGains > 0) personalOut(state, taxGains, 'impots_perso');
  // Taxe sur les comptes-titres
  const titres = inv.etf.value + inv.stocks.value;
  let tact = 0;
  if (titres > F.tact.threshold) tact = Math.round(Math.min(titres * F.tact.rate, (titres - F.tact.threshold) * 0.1));
  if (tact > 0) personalOut(state, tact, 'impots_perso');
  // IPP approximé sur les loyers
  const taxRent = Math.round(inv.year.rent * F.immobilier.ippSurLoyer);
  if (taxRent > 0) personalOut(state, taxRent, 'impots_perso');
  // Indexation des loyers
  for (const p of inv.realEstate) p.rent = Math.round(p.rent * (1 + I.realEstate.rentIndexation));
  const total = taxSav + taxGains + tact + taxRent;
  if (total > 0) log(state, 'tax', `Fiscalité de tes placements ${dateOf(state.time.day).year} : ${Math.round(total / 100)} € (épargne, plus-values, comptes-titres, loyers).`);
  inv.year = { interest: 0, dividends: 0, gains: 0, fees: 0, rent: 0 };
}
