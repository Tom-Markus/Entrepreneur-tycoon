// Actions communes à tous les secteurs. Les actions propres à un secteur
// passent par { type: 'sector', name, ...params }.

import { registerActions } from './actions.js';
import { sectorModule } from './sectors/index.js';
import { buyUpgrade } from './upgrades.js';
import * as staff from './systems/staff.js';
import { personalOut, personalIn, receive, pay } from './ledger.js';
import * as loans from './systems/loans.js';
import { decide } from './events.js';
import * as inv from './systems/investments.js';
import { checkAchievements } from './systems/achievements.js';
import { dividendRate } from './taxmath.js';
import { dateOf } from './calendar.js';
import { clamp } from './money.js';
import { log } from './log.js';

registerActions({
  sector(state, a, rng) {
    const m = sectorModule(state);
    const h = m.actions && m.actions[a.name];
    if (!h) return { ok: false, message: `Action de secteur inconnue : ${a.name}` };
    return h(state, a, rng) || { ok: true };
  },
  setMarketing(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.company.marketing = clamp(v, 0, 5_000_000);
    return { ok: true };
  },
  buyUpgrade(state, a) {
    const r = buyUpgrade(state, a.id);
    if (!r.ok) return { ok: false, message: r.reason };
    const m = sectorModule(state);
    if (m.onUpgrade) m.onUpgrade(state, a.id);
    return { ok: true };
  },
  hire(state, a) {
    return staff.hire(state, a.id);
  },
  fire(state, a) {
    return staff.fire(state, a.id);
  },
  train(state, a) {
    return staff.train(state, a.id);
  },
  raise(state, a) {
    return staff.raise(state, a.id, a.pct || 0.05);
  },
  postJobAd(state, a, rng) {
    return staff.postJobAd(state, rng, a.role);
  },
  setDraw(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.personal.draw = clamp(v, 0, 5_000_000);
    return { ok: true };
  },
  /** Apport personnel : compte perso → compte pro. */
  apport(state, a) {
    const v = Math.round(Number(a.value));
    if (!(v > 0)) return { ok: false, message: 'Montant invalide.' };
    if (v > state.personal.cash) return { ok: false, message: 'Pas assez d’argent sur ton compte personnel.' };
    personalOut(state, v, 'apport');
    receive(state, v, 'apport');
    state.stats.apports = (state.stats.apports || 0) + v;
    log(state, 'info', `Apport personnel de ${(v / 100).toFixed(0)} € dans l'entreprise.`);
    return { ok: true };
  },
  /** Le fondateur se retire de l'opérationnel (nécessite un gérant). */
  retire(state) {
    if (!state.staff.founder.active) return { ok: false, message: 'Tu es déjà retiré·e de l’opérationnel.' };
    if (!staff.hasManager(state)) return { ok: false, message: 'Il faut d’abord recruter un·e gérant·e compétent·e.' };
    state.staff.founder.active = false;
    state.stats.retiredDay = state.time.day;
    log(state, 'good', 'Tu te retires de l’opérationnel : ton gérant dirige désormais l’entreprise.', true);
    return { ok: true };
  },
  decide(state, a, rng) {
    return decide(state, a.uid, a.choice, rng);
  },
  deposit(state, a) {
    return inv.deposit(state, Number(a.amount));
  },
  withdraw(state, a) {
    return inv.withdraw(state, Number(a.amount));
  },
  buyAsset(state, a) {
    const r = inv.buy(state, a.kind, Number(a.amount));
    if (r.ok) checkAchievements(state);
    return r;
  },
  sellAsset(state, a) {
    return inv.sell(state, a.kind, Number(a.amount));
  },
  buyProperty(state, a) {
    const r = inv.buyProperty(state, a.id, Number(a.downPct ?? 0.2));
    if (r.ok) checkAchievements(state);
    return r;
  },
  sellProperty(state, a) {
    return inv.sellProperty(state, a.id);
  },
  continueSandbox(state) {
    if (state.status !== 'won') return { ok: false, message: 'Disponible après la victoire.' };
    state.status = 'sandbox';
    log(state, 'info', 'Mode bac à sable : la partie continue sans fin. Les succès restent à débloquer !');
    return { ok: true };
  },
  requestLoan(state, a) {
    return loans.requestLoan(state, Number(a.amount), Number(a.months));
  },
  repayLoan(state, a) {
    return loans.repayLoan(state, a.id);
  },
  seekInvestor(state, a, rng) {
    if (state.offers.investor) return { ok: false, message: 'Une offre est déjà sur la table.' };
    if ((state.stats.lastInvestorSearch ?? -999) > state.time.day - 90) return { ok: false, message: 'Les investisseurs ne te recevront pas avant 3 mois.' };
    state.stats.lastInvestorSearch = state.time.day;
    return loans.makeInvestorOffer(state, rng);
  },
  acceptInvestor(state) {
    return loans.acceptInvestor(state);
  },
  declineInvestor(state) {
    state.offers.investor = null;
    return { ok: true };
  },
  /** Base annuelle choisie pour les cotisations sociales provisoires (0 = automatique). */
  setSocialBase(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v) || v < 0) return { ok: false, message: 'Valeur invalide.' };
    state.tax.social.chosenBase = Math.min(v, 50_000_000);
    return { ok: true };
  },
  /** Dividende brut décidé par l'assemblée générale (SRL). */
  payDividend(state, a) {
    if (state.meta.legal !== 'srl') return { ok: false, message: 'Seule une société verse des dividendes.' };
    const amount = Math.round(Number(a.amount));
    if (!(amount >= 10_000)) return { ok: false, message: 'Montant minimum : 100 €.' };
    if (amount > state.tax.reserves) return { ok: false, message: 'Pas assez de bénéfices reportés (réserves) : on ne distribue que des bénéfices déjà taxés.' };
    if (amount > state.cash) return { ok: false, message: 'Trésorerie insuffisante (test de liquidité).' };
    const rate = dividendRate(dateOf(state.time.day).yearIdx);
    pay(state, amount, 'dividende');
    state.tax.reserves -= amount;
    const own = state.ownership.founder;
    const mine = Math.round(amount * own);
    const tax = Math.round(mine * rate);
    personalIn(state, mine - tax, 'dividendes');
    state.tax.year.dividendsGross += mine;
    state.tax.year.dividendRateMax = Math.max(state.tax.year.dividendRateMax, rate);
    state.stats.dividendsYear = (state.stats.dividendsYear || 0) + (amount - mine);
    state.stats.dividendsTotal = (state.stats.dividendsTotal || 0) + mine - tax;
    log(state, 'good', `Dividende de ${Math.round(amount / 100)} € brut : tu reçois ${Math.round((mine - tax) / 100)} € net (précompte ${Math.round(rate * 100)} %).`, true);
    return { ok: true };
  },
  unretire(state) {
    if (state.staff.founder.active) return { ok: false, message: 'Tu travailles déjà dans l’entreprise.' };
    if (staff.seatsAvailable(state) <= 0) return { ok: false, message: 'Plus de place dans les locaux.' };
    state.staff.founder.active = true;
    log(state, 'info', 'Tu reprends du service dans l’entreprise.');
    return { ok: true };
  },
});
