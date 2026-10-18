// Financement : prêts bancaires (annuités), remboursement anticipé, investisseurs (SRL).

import { FINANCE } from '../../data/finance.js';
import { pay, receive } from '../ledger.js';
import { annuity, clamp } from '../money.js';
import { log } from '../log.js';
import { avgRevenue } from './finance.js';

const L = FINANCE.loan;

export function init(state) {
  state.loans = [];
  state.loanSeq = 0;
  state.ownership = { founder: 1, investors: [] };
  state.offers = { investor: null };
  // Prêt de démarrage (voir company.init) : 48 mois au taux du marché
  if (state.flags.starterLoan) {
    const amount = state.flags.starterLoan;
    const rate = state.world.baseRate + L.baseSpread + (state.meta.legal === 'independant' ? L.independantPremium : 0) + 0.01;
    const payment = annuity(amount, rate, 48);
    state.loanSeq += 1;
    state.loans.push({ id: state.loanSeq, principal: amount, remaining: amount, rate, months: 48, monthsLeft: 48, payment, startDay: 0 });
    receive(state, amount, 'pret');
    state.stats.loansTaken = 1;
    log(state, 'info', `Ton apport ne couvre pas l'équipement de départ : la banque t'accorde un prêt de démarrage de ${Math.round(amount / 100)} € (48 mois, mensualité ${Math.round(payment / 100)} €).`, true);
    delete state.flags.starterLoan;
  }
}

export function totalDebt(state) {
  return state.loans.reduce((s, l) => s + l.remaining, 0);
}

export function monthlyDebtService(state) {
  return state.loans.reduce((s, l) => s + l.payment, 0);
}

function avgProfit(state, n = 6) {
  const h = state.finance.history.slice(-n);
  return h.length ? h.reduce((s, x) => s + x.profit, 0) / h.length : 0;
}

/** Taux proposé par la banque (annuel) et plafond empruntable. */
export function loanOffer(state, months = 48) {
  const rep = state.company.reputation;
  const rev = avgRevenue(state, 6);
  const profit = avgProfit(state, 6);
  const debt = totalDebt(state);
  let rate = state.world.baseRate + L.baseSpread;
  if (state.meta.legal === 'independant') rate += L.independantPremium;
  rate += rep < 30 ? 0.02 : rep < 50 ? 0.01 : rep < 70 ? 0.004 : 0;
  if (profit < 0) rate += 0.015;
  rate += (months / 12 - 3) * 0.0015; // les longues durées coûtent un peu plus
  if (state.endgame && state.endgame.distressDays > 0) rate += 0.03;
  if ((state.flags.loanPromo || 0) > state.time.day) rate -= 0.01; // campagne promotionnelle de la banque
  rate = clamp(rate, 0.015, 0.16);
  const history = state.finance.history.length;
  let max = history < 6 ? L.startupMax[state.meta.legal] : rev * L.revenueMultiple * (0.6 + rep / 100);
  // Capacité de remboursement : mensualités totales ≤ 35 % du CA mensuel moyen
  const service = monthlyDebtService(state);
  const capacity = Math.max(0, (rev || 200_000) * L.maxDebtServiceShare - service);
  const r = rate / 12;
  const maxFromService = r > 0 ? (capacity * (1 - Math.pow(1 + r, -months))) / r : capacity * months;
  max = Math.min(max, maxFromService, L.maxTotalDebt - debt);
  if (state.endgame && state.endgame.distressDays > 20) max = Math.min(max, rev);
  if (history >= 6 && profit < -rev * 0.3) max = 0; // la banque refuse une activité qui saigne
  return { rate, max: Math.max(0, Math.floor(max / 100_000) * 100_000) };
}

export function requestLoan(state, amount, months) {
  months = clamp(Math.round(months), L.minMonths, L.maxMonths);
  amount = Math.round(amount);
  if (!(amount >= 100_000)) return { ok: false, message: 'Montant minimum : 1 000 €.' };
  const offer = loanOffer(state, months);
  if (amount > offer.max) return { ok: false, message: `La banque refuse : maximum ${Math.round(offer.max / 100)} € aujourd'hui.` };
  const payment = annuity(amount, offer.rate, months);
  state.loanSeq += 1;
  state.loans.push({ id: state.loanSeq, principal: amount, remaining: amount, rate: offer.rate, months, monthsLeft: months, payment, startDay: state.time.day });
  receive(state, amount, 'pret');
  state.stats.loansTaken = (state.stats.loansTaken || 0) + 1;
  log(state, 'info', `Prêt accordé : ${Math.round(amount / 100)} € sur ${months} mois à ${(offer.rate * 100).toFixed(2)} % (mensualité ${Math.round(payment / 100)} €).`, true);
  return { ok: true };
}

export function repayLoan(state, id) {
  const l = state.loans.find((x) => x.id === id);
  if (!l) return { ok: false, message: 'Prêt introuvable.' };
  const penalty = Math.round(l.remaining * (l.rate / 12) * L.earlyRepaymentMonthsOfInterest);
  if (state.cash - l.remaining - penalty < 0) return { ok: false, message: 'Trésorerie insuffisante pour rembourser ce prêt.' };
  pay(state, l.remaining, 'remboursement');
  pay(state, penalty, 'interets');
  state.loans = state.loans.filter((x) => x !== l);
  state.stats.loansRepaid = (state.stats.loansRepaid || 0) + 1;
  log(state, 'good', `Prêt remboursé par anticipation (indemnité de remploi : ${Math.round(penalty / 100)} €).`);
  return { ok: true };
}

export function monthEnd(state) {
  for (const l of state.loans) {
    const interest = Math.round(l.remaining * (l.rate / 12));
    const principal = Math.min(l.remaining, l.payment - interest);
    pay(state, interest, 'interets');
    pay(state, principal, 'remboursement');
    l.remaining -= principal;
    l.monthsLeft -= 1;
  }
  const done = state.loans.filter((l) => l.remaining <= 0 || l.monthsLeft <= 0);
  if (done.length) {
    state.loans = state.loans.filter((l) => !done.includes(l));
    state.stats.loansRepaid = (state.stats.loansRepaid || 0) + done.length;
    log(state, 'good', 'Un prêt est entièrement remboursé.');
  }
  // Offre d'investisseur expirée
  if (state.offers.investor && state.offers.investor.expires <= state.time.day) state.offers.investor = null;
}

// --- Investisseurs (SRL) --------------------------------------------------------

export function valuation(state) {
  const I = FINANCE.investor;
  const rev = avgRevenue(state, 12) * 12;
  const profit = avgProfit(state, 12) * 12;
  return Math.max(I.minValuation, rev * I.revenueMultiple, profit * I.profitMultiple);
}

export function makeInvestorOffer(state, rng) {
  if (state.meta.legal !== 'srl') return { ok: false, message: 'Seule une société (SRL) peut ouvrir son capital.' };
  const I = FINANCE.investor;
  const investorsShare = 1 - state.ownership.founder;
  const stakes = I.stakes.filter((s) => investorsShare + s <= I.maxInvestorShare);
  if (!stakes.length) return { ok: false, message: 'Tu garderais moins de 51 % : aucun investisseur supplémentaire.' };
  const stake = rng.pick(stakes);
  const v = valuation(state) * (0.8 + state.company.reputation / 250) * rng.range(0.85, 1.15);
  const amount = Math.round((v * stake) / (1 - stake) / 100_000) * 100_000;
  state.offers.investor = { stake, amount, expires: state.time.day + I.offerDays, name: rng.pick(['Wallonie Angels', 'Brussels Seed Club', 'Flanders Ventures', 'Famille Delvaux', 'Mme Peeters, ex-CEO']) };
  return { ok: true };
}

export function acceptInvestor(state) {
  const o = state.offers.investor;
  if (!o) return { ok: false, message: 'Aucune offre en cours.' };
  if (o.expires <= state.time.day) return { ok: false, message: 'Offre expirée.' };
  receive(state, o.amount, 'investisseur');
  state.ownership.founder = Math.round(state.ownership.founder * (1 - o.stake) * 10000) / 10000;
  state.ownership.investors.push({ name: o.name, invested: o.amount, day: state.time.day, stake: o.stake });
  state.offers.investor = null;
  state.stats.fundraises = (state.stats.fundraises || 0) + 1;
  log(state, 'good', `${o.name} investit ${Math.round(o.amount / 100)} € contre ${Math.round(o.stake * 100)} % des parts. Tu détiens désormais ${Math.round(state.ownership.founder * 100)} %.`, true);
  return { ok: true };
}

/** Contrepartie : les investisseurs attendent un dividende annuel. */
export function yearEnd(state) {
  if (!state.ownership.investors.length) return;
  const expected = state.ownership.investors.reduce((s, i) => s + i.invested, 0) * FINANCE.investor.expectedYield;
  if ((state.stats.dividendsYear || 0) < expected * 0.5) {
    state.company.reputation = Math.max(0, state.company.reputation - 3);
    for (const e of state.staff.employees) e.motivation = Math.max(0, e.motivation - 5);
    log(state, 'bad', 'Tes investisseurs sont mécontents : pas assez de dividendes cette année. Ambiance tendue et rumeurs dans la presse.', true);
  }
  state.stats.dividendsYear = 0;
}
