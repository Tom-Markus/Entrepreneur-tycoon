// Secteur soutien scolaire : inscriptions saisonnières, abonnements mensuels,
// capacité (profs × groupes × taille), sessions d'examens qui font la réputation.

import { SOUTIEN as D } from '../../data/sectors/soutien.js';
import { dateOf, DAYS_PER_MONTH } from '../calendar.js';
import { earn, spend } from '../ledger.js';
import { upgradeEffect } from '../upgrades.js';
import { modMult } from '../modifiers.js';
import { productivity, countRole } from '../systems/staff.js';
import { rateCustomer, changeReputation } from '../systems/company.js';
import { htFromTtc, diffOf, playerMarket, baseWhy, prodMod } from './common.js';
import { log } from '../log.js';
import { clamp } from '../money.js';

export const mainRole = 'enseignant';

export function init(state) {
  state.sector = {
    price: D.refPrice,
    groupSize: D.groupSize.default,
    students: 8,
    discounted: 0, // élèves à tarif réduit (partenariat école)
    discountMult: 1,
    waitlist: 0,
    lastSuccess: null,
    results: [],
    stageStudents: 0,
    today: { joined: 0, capacity: 0 },
    month: { joined: 0, left: 0, turnedAway: 0 },
    stats: { maxStudents: 8, sessions: 0, bestSuccess: 0 },
  };
}

export function refPrice() {
  return D.refPrice;
}

export function priceIndex(state) {
  return state.sector.price / D.refPrice;
}

function marketMult(state) {
  return upgradeEffect(state, 'marketMult') || 1;
}

export function marketValue(state) {
  return D.marketPool * 4 * marketMult(state) * diffOf(state).marketMult * htFromTtc(state, D.refPrice, D.vatRate);
}

/** Compétence moyenne des enseignants (fondateur inclus), pondérée par leurs groupes. */
function teachingSkill(state) {
  let w = 0;
  let sk = 0;
  if (state.staff.founder.active) {
    w += D.founderSlots;
    sk += state.staff.founder.skill * D.founderSlots;
  }
  for (const e of state.staff.employees) {
    const r = D.roles[e.role];
    if (r && r.teach) {
      const slots = r.slots * productivity(state, e);
      w += slots;
      sk += e.skill * slots;
    }
  }
  return w ? sk / w : 40;
}

/** Nombre d'élèves que l'équipe et les locaux peuvent accueillir. */
export function capacity(state) {
  const s = state.sector;
  let slots = state.staff.founder.active ? D.founderSlots * (0.7 + 0.3 * state.staff.founder.energy / 100) : 0;
  for (const e of state.staff.employees) {
    const r = D.roles[e.role];
    if (r && r.teach) slots += r.slots * productivity(state, e);
  }
  slots *= upgradeEffect(state, 'slotsMult') * prodMod(state);
  const teach = Math.floor(slots * s.groupSize);
  const seats = Math.floor((D.baseSeats + upgradeEffect(state, 'seats')) * modMult(state, 'capacity'));
  return { teach, seats, total: Math.min(teach, seats) };
}

/** Taux de réussite attendu aux examens. */
export function expectedSuccess(state) {
  const s = state.sector;
  const skill = teachingSkill(state);
  const coord = countRole(state, 'coordinateur') > 0 ? D.roles.coordinateur.success : 0;
  const group = (D.groupSize.default - s.groupSize) * 0.018;
  return clamp(0.52 + 0.36 * ((skill - 50) / 50) + group + coord + upgradeEffect(state, 'success'), 0.25, 0.97);
}

export function quality(state) {
  return clamp((0.6 + expectedSuccess(state) * 0.55) * modMult(state, 'quality'), 0.3, 2);
}

function examBoost(state, month) {
  return month === 11 || month === 4 ? 1 + upgradeEffect(state, 'examBoost') : 1;
}

export function enrollmentRate(state) {
  const d = dateOf(state.time.day);
  const extra = 1 + upgradeEffect(state, 'attraction') + (upgradeEffect(state, 'resultsVisible') && state.sector.lastSuccess > 0.8 ? 0.1 : 0);
  const m = playerMarket(state, D, state.sector.price, D.refPrice, extra);
  const season = D.seasonality[d.month] * examBoost(state, d.month);
  const perDay = (D.marketPool * marketMult(state) * diffOf(state).marketMult * season * m.eco * m.ev * m.share * modMult(state, 'enrollment')) / DAYS_PER_MONTH;
  return { perDay, m, season, location: marketMult(state) };
}

export function daily(state, rng) {
  const s = state.sector;
  state.company.quality = quality(state);
  const er = enrollmentRate(state);
  const cap = capacity(state);
  const arrivals = rng.poisson(er.perDay);
  const room = Math.max(0, cap.total - s.students);
  const joined = Math.min(arrivals, room);
  s.students += joined;
  s.month.joined += joined;
  s.month.turnedAway += arrivals - joined;
  s.stats.maxStudents = Math.max(s.stats.maxStudents, s.students);
  s.today = { joined, capacity: cap.total, arrivals };
  // Satisfaction des familles : rapport qualité/prix et taille des groupes
  const score = 48 + 60 * (expectedSuccess(state) - 0.65) + 25 * (D.refPrice / s.price - 1) + 2 * (D.groupSize.default - s.groupSize);
  rateCustomer(state, clamp(score, 0, 100), 0.01);
  if (arrivals > joined) rateCustomer(state, 35, 0.01);
  // Fournitures
  spend(state, Math.round((s.students * D.materialPerStudent) / DAYS_PER_MONTH), 0.21, 'materiel');
  state.company.capacityUse = cap.total > 0 ? s.students / cap.total : 1;
  state.staff.lastWorkload = cap.teach > 0 ? s.students / cap.teach : 0;
  state.company.demandPerDay = er.perDay;
  state.company.why = [
    ...baseWhy(er.m, `Abonnement ${(s.price / 100).toFixed(0)} €/mois (marché 175 €).`),
    { label: 'Calendrier scolaire', value: er.season, hint: 'Rentrée et avant-examens : affluence. Été : désert.' },
    { label: 'Implantations', value: er.location, hint: 'Antenne, cours hybrides.' },
  ];
  state.company.bottleneck = arrivals > joined ? (cap.teach < cap.seats ? 'personnel' : 'places') : er.m.share < 0.12 ? 'demande' : null;
}

export function monthEnd(state, rng) {
  const s = state.sector;
  const d = dateOf(state.time.day);
  // Facturation des abonnements (prélevés en début de mois suivant → encaissés ici)
  const full = Math.max(0, s.students - s.discounted);
  const ttc = full * s.price + s.discounted * Math.round(s.price * s.discountMult);
  if (ttc > 0) earn(state, htFromTtc(state, ttc, D.vatRate), D.vatRate, 'abonnements');
  // Stages d'été
  if (upgradeEffect(state, 'stages') > 0 && D.stage.month.includes(d.month)) {
    const m = playerMarket(state, D, s.price, D.refPrice, 1);
    const n = Math.min(capacity(state).total, rng.poisson(D.stage.pool * m.share * marketMult(state) * diffOf(state).marketMult * 2));
    if (n > 0) {
      earn(state, htFromTtc(state, n * D.stage.price, D.vatRate), D.vatRate, 'stages');
      s.stageStudents += n;
      log(state, 'good', `Stages d'été : ${n} participants.`);
    }
  }
  // Sessions d'examens → résultats → réputation
  if (D.examMonths.includes(d.month) && s.students > 0) {
    const success = clamp(expectedSuccess(state) + rng.normal(0, 0.04), 0.2, 0.99);
    s.lastSuccess = success;
    s.results.push({ day: state.time.day, success, students: s.students });
    if (s.results.length > 30) s.results.shift();
    s.stats.sessions++;
    s.stats.bestSuccess = Math.max(s.stats.bestSuccess, success);
    const delta = (success - 0.72) * 45;
    changeReputation(state, delta);
    rateCustomer(state, clamp(success * 100, 0, 100), 0.3);
    log(state, delta >= 0 ? 'good' : 'bad', `Session d'examens : ${Math.round(success * 100)} % de réussite (réputation ${delta >= 0 ? '+' : ''}${delta.toFixed(1).replace('.', ',')}).`, true);
  }
  // Désinscriptions
  const coord = countRole(state, 'coordinateur') > 0 ? 0.8 : 1;
  let churn = D.churnMonthly * upgradeEffect(state, 'churnMult') * coord;
  if (s.lastSuccess != null && s.lastSuccess < 0.6) churn *= 1.5;
  if (d.month === 5) churn = D.yearEndChurn; // fin de l'année scolaire
  const left = Math.min(s.students, Math.round(s.students * churn + rng.normal(0, 0.5)));
  s.students -= Math.max(0, left);
  s.discounted = Math.min(s.discounted, s.students);
  s.month = { joined: 0, left: 0, turnedAway: 0 };
}

export function eventOp(state, e) {
  const s = state.sector;
  if (e.op === 'addStudents') {
    const room = Math.max(0, capacity(state).total - s.students);
    const n = Math.min(e.n, room);
    s.students += n;
    s.discounted += n;
    s.discountMult = e.priceMult;
    if (n < e.n) log(state, 'info', `Faute de place, seuls ${n} élèves du partenariat ont pu être accueillis.`);
  }
}

export function kpis(state) {
  const s = state.sector;
  const cap = capacity(state);
  return [
    { label: 'Abonnement TTC', value: s.price, fmt: 'eur', suffix: '/mois' },
    { label: 'Élèves inscrits', value: s.students, fmt: 'int' },
    { label: 'Capacité', value: cap.total, fmt: 'int' },
    { label: 'Taille des groupes', value: s.groupSize, fmt: 'int' },
    { label: 'Réussite attendue', value: expectedSuccess(state), fmt: 'pct' },
    { label: 'Dernière session', value: s.lastSuccess ?? NaN, fmt: 'pct' },
  ];
}

export function sceneInfo(state) {
  const s = state.sector;
  return { activity: Math.min(1, s.students / Math.max(1, capacity(state).total)), customers: Math.min(4, s.today.joined * 2 + 1), students: s.students };
}

export const actions = {
  setPrice(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.price = clamp(v, D.minPrice, D.maxPrice);
    return { ok: true };
  },
  setGroupSize(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.groupSize = clamp(v, D.groupSize.min, D.groupSize.max);
    return { ok: true };
  },
};
