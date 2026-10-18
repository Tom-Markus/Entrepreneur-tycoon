// Secteur artisan : demandes → devis → planning des ouvriers → chantier → facture.
// Camionnettes, matériel, déplacements, bouche-à-oreille, contrats d'entretien.

import { ARTISAN as D } from '../../data/sectors/artisan.js';
import { FISCALITE } from '../../data/fiscalite.js';
import { dateOf, isWeekend } from '../calendar.js';
import { earn, invoice, spend } from '../ledger.js';
import { upgradeEffect, hasUpgrade } from '../upgrades.js';
import { modMult } from '../modifiers.js';
import { productivity, qualityOf, countRole } from '../systems/staff.js';
import { rateCustomer, changeReputation } from '../systems/company.js';
import { diffOf, playerMarket, baseWhy, prodMod } from './common.js';
import { log } from '../log.js';
import { clamp } from '../money.js';

export const mainRole = 'ouvrier';

export function metier(state) {
  return D.metiers[state.meta.metier] || D.metiers.plombier;
}

export function init(state) {
  if (!D.metiers[state.meta.metier]) state.meta.metier = 'plombier';
  state.sector = {
    rate: D.refRate,
    margin: D.refMargin,
    policy: 'capacite',
    quotes: [], // devis en attente de réponse
    jobs: [], // chantiers acceptés (file)
    seq: 0,
    wom: 0, // stock de bouche-à-oreille
    contracts: 0,
    today: { capacity: 0, used: 0, leads: 0 },
    stats: { jobsDone: 0, quotes: 0, won: 0, lost: 0, malfacons: 0 },
  };
}

export function refPrice() {
  return D.refRate;
}

export function priceIndex(state) {
  return (state.sector.rate / D.refRate) * (0.85 + 0.15 * ((1 + state.sector.margin) / (1 + D.refMargin)));
}

export function marketValue(state) {
  return D.marketLeads * diffOf(state).marketMult * 21 * 1.6 * D.hoursPerDay * D.refRate * 0.85;
}

function vans(state) {
  return 1 + upgradeEffect(state, 'vans');
}

/** Jours-homme disponibles par jour ouvré. */
export function workforce(state) {
  const f = state.staff.founder;
  const workers = [];
  if (f.active) workers.push(1 * (0.7 + 0.3 * f.energy / 100) * (0.6 + f.skill / 140));
  for (const e of state.staff.employees) {
    const r = D.roles[e.role];
    if (r && r.speed) workers.push(r.speed * productivity(state, e));
  }
  workers.sort((a, b) => b - a);
  const seatsOnRoad = vans(state) * 2;
  let total = 0;
  workers.forEach((w, i) => (total += i < seatsOnRoad ? w : w * 0.5));
  const pm = countRole(state, 'planificateur') > 0 ? 1.05 : 1;
  return total * D.billableRatio * upgradeEffect(state, 'speedMult') * pm * modMult(state, 'capacity') * prodMod(state);
}

export function quality(state) {
  let wq = 0;
  let n = 0;
  if (state.staff.founder.active) {
    wq += 0.6 + state.staff.founder.skill / 125;
    n++;
  }
  for (const e of state.staff.employees) {
    if (D.roles[e.role] && D.roles[e.role].speed) {
      wq += qualityOf(e);
      n++;
    }
  }
  const q = (n ? wq / n : 0.8) + upgradeEffect(state, 'quality');
  return clamp(q * modMult(state, 'quality'), 0.3, 2);
}

export function backlogDays(state) {
  return state.sector.jobs.reduce((s, j) => s + Math.max(0, j.daysTotal - j.daysDone), 0);
}

function availableJobs(state) {
  return metier(state).jobs.filter((j) => !j.requires || hasUpgrade(state, j.requires));
}

function jobValue(state, t, rate = state.sector.rate, margin = state.sector.margin) {
  const labor = t.days * D.hoursPerDay * rate;
  const mat = t.materials * modMult(state, 'materialCost') * (1 + margin);
  return Math.round(labor + mat + (t.urgent ? D.urgentFee : 0));
}

function womFactor(state) {
  return 1 + 0.35 * Math.log(1 + state.sector.wom / 8);
}

export function leadRate(state) {
  const d = dateOf(state.time.day);
  const m = playerMarket(state, D, priceIndex(state) * D.refRate, D.refRate, 1);
  const season = metier(state).seasonality[d.month];
  const brand = upgradeEffect(state, 'leadsMult');
  const wom = womFactor(state);
  const lambda = D.marketLeads * diffOf(state).marketMult * season * m.eco * m.ev * m.share * brand * wom;
  return { lambda, m, season, brand, wom };
}

function acceptProb(state, t, price) {
  const ref = jobValue(state, t, D.refRate, D.refMargin);
  const plan = Math.min(2, countRole(state, 'planificateur')) * D.roles.planificateur.accept;
  let p = D.baseAccept * Math.pow(ref / price, 1.3) * (0.7 + state.company.reputation / 170) * (1 + plan + upgradeEffect(state, 'accept'));
  if (t.urgent) p = Math.min(0.95, p * 1.3);
  return clamp(p, 0.04, 0.95);
}

function newQuote(state, rng) {
  const s = state.sector;
  const d = dateOf(state.time.day);
  const list = availableJobs(state);
  const years = state.time.day / 360;
  const t = rng.weighted(list, (j) => j.weight * ((j.season && j.season[d.month]) || 1) * (1 + (j.trend || 0) * years));
  const price = jobValue(state, t);
  s.seq += 1;
  return {
    id: s.seq,
    type: t.id,
    label: t.label,
    price,
    vat: rng.chance(t.renoShare) ? FISCALITE.tva.renovation : FISCALITE.tva.rates.normal,
    decide: state.time.day + (t.urgent ? 0 : rng.int(2, 5)),
    p: acceptProb(state, t, price),
  };
}

function startJob(state, q) {
  const t = metier(state).jobs.find((j) => j.id === q.type);
  state.sector.jobs.push({
    id: q.id, type: q.type, label: q.label, price: q.price, vat: q.vat, daysTotal: t.days, daysDone: 0,
    materials: Math.round(t.materials * modMult(state, 'materialCost') * (1 - upgradeEffect(state, 'materialCut'))),
    matPaid: false, payNow: !!t.payNow, urgent: !!t.urgent, payDelay: q.payDelay || D.paymentDays,
  });
  if (t.urgent) state.sector.jobs.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}

function finishJob(state, j, rng) {
  const s = state.sector;
  s.jobs = s.jobs.filter((x) => x !== j);
  if (j.payNow) earn(state, j.price, j.vat, 'chantiers');
  else invoice(state, j.price, j.vat, 'chantiers', { dueIn: j.payDelay, defaultProb: D.defaultProb * modMult(state, 'defaultRisk'), lateProb: D.lateProb, label: j.label, rng });
  const q = state.company.quality * rng.range(0.9, 1.1);
  const score = clamp(50 + 80 * (q - 0.85), 0, 100);
  rateCustomer(state, score, 0.08);
  if (score > 65) s.wom += 1;
  if (rng.chance(Math.max(0, 1.05 - q) * 0.25)) {
    s.stats.malfacons++;
    changeReputation(state, -1.5);
    s.wom = Math.max(0, s.wom - 3);
    log(state, 'bad', `Malfaçon signalée sur « ${j.label} » : il faudra repasser.`);
    s.jobs.push({ ...j, id: ++s.seq, label: `Reprise : ${j.label}`, price: 0, daysTotal: j.daysTotal * 0.25, daysDone: 0, materials: 0, matPaid: true, payNow: true });
  }
  if (j.type === 'entretien' && upgradeEffect(state, 'contracts') > 0 && rng.chance(D.maintenanceContract.signProb)) s.contracts++;
  s.stats.jobsDone++;
  state.stats.unitsSold = (state.stats.unitsSold || 0) + 1;
}

export function daily(state, rng) {
  const s = state.sector;
  const day = state.time.day;
  const weekend = isWeekend(day);
  state.company.quality = quality(state);
  const lr = leadRate(state);
  // Nouvelles demandes → devis
  const n = rng.poisson(lr.lambda * (weekend ? D.weekendLeads : 1));
  const cap = workforce(state);
  for (let i = 0; i < n; i++) {
    const q = newQuote(state, rng);
    if (weekend && !metier(state).jobs.find((j) => j.id === q.type).urgent) continue;
    if (s.policy === 'capacite' && backlogDays(state) > Math.max(1, cap) * 25 && !metier(state).jobs.find((j) => j.id === q.type).urgent) {
      s.stats.lost++;
      continue;
    }
    s.quotes.push(q);
    s.stats.quotes++;
  }
  // Réponses des clients
  const due = s.quotes.filter((q) => q.decide <= day);
  s.quotes = s.quotes.filter((q) => q.decide > day);
  for (const q of due) {
    if (rng.chance(q.p)) {
      startJob(state, q);
      s.stats.won++;
    } else s.stats.lost++;
  }
  // Chantiers (jours ouvrés ; dépannages aussi le week-end, à capacité réduite)
  let pool = weekend ? cap * 0.25 : cap;
  const total = pool;
  for (const j of [...s.jobs]) {
    if (pool <= 0) break;
    if (weekend && !j.urgent) continue;
    if (!j.matPaid) {
      if (j.materials > 0) spend(state, j.materials, 0.21, 'materiel');
      j.matPaid = true;
    }
    const w = Math.min(pool, j.daysTotal - j.daysDone, Math.max(1, j.daysTotal * 0.5) + 1);
    j.daysDone += w;
    pool -= w;
    spend(state, Math.round(w * D.travelPerDay * (1 - Math.min(0.5, upgradeEffect(state, 'travelCut')))), 0.21, 'deplacements');
    if (j.daysDone >= j.daysTotal - 1e-6) finishJob(state, j, rng);
  }
  const used = total - pool;
  s.today = { capacity: total, used, leads: n };
  state.company.capacityUse = total > 0 ? used / total : 1;
  const backlog = backlogDays(state);
  state.staff.lastWorkload = cap > 0 ? Math.min(2, backlog / (cap * 21)) : 0;
  state.company.demandPerDay = lr.lambda;
  state.company.why = [
    ...baseWhy(lr.m, 'Ton taux horaire et ta marge sur matériel face aux autres artisans.'),
    { label: 'Saison', value: lr.season, hint: metier(state).id === 'plombier' ? 'L’hiver, les chaudières tombent en panne.' : 'Activité assez régulière.' },
    { label: 'Bouche-à-oreille', value: lr.wom, hint: 'Chaque chantier réussi te ramène des clients.' },
    { label: 'Visibilité', value: lr.brand, hint: 'Site, avis Google, lettrage des camionnettes.' },
  ];
  state.company.bottleneck = backlog > cap * 25 ? 'capacite' : lr.lambda < 0.4 ? 'demande' : null;
}

export function monthEnd(state, rng) {
  const s = state.sector;
  s.wom *= 1 - D.womDecayMonthly;
  if (s.contracts > 0) {
    s.contracts = Math.max(0, s.contracts - Math.round(s.contracts * D.maintenanceContract.churnMonthly * rng.range(0.5, 1.5)));
    invoice(state, s.contracts * D.maintenanceContract.fee, FISCALITE.tva.renovation, 'chantiers', { dueIn: 10, defaultProb: 0.01, label: 'Contrats d’entretien', rng });
  }
}

export function eventOp(state, e) {
  const s = state.sector;
  if (e.op === 'coldwave' && metier(state).id === 'plombier') {
    state.modifiers.push({ key: 'demand', mult: 1.4, add: 0, until: state.time.day + 10, label: 'Chaudières en panne', source: 'Vague de froid' });
  }
  if (e.op === 'bigJob') {
    s.seq += 1;
    const price = Math.round(e.days * D.hoursPerDay * s.rate * (e.valueMult || 1) + e.days * 30_000);
    s.jobs.push({ id: s.seq, type: 'gros', label: 'Gros chantier (promoteur)', price, vat: FISCALITE.tva.rates.normal, daysTotal: e.days, daysDone: 0, materials: e.days * 22_000, matPaid: false, payNow: false, urgent: false, payDelay: e.payDelay || 60 });
  }
}

export function kpis(state) {
  const s = state.sector;
  const rate = s.stats.quotes ? s.stats.won / Math.max(1, s.stats.won + s.stats.lost) : 0;
  return [
    { label: 'Taux horaire', value: s.rate, fmt: 'eur', suffix: '/h' },
    { label: 'Équipe (j-homme/jour)', value: workforce(state), fmt: 'num1' },
    { label: 'Carnet (jours-homme)', value: backlogDays(state), fmt: 'num1' },
    { label: 'Devis acceptés', value: rate, fmt: 'pct' },
    { label: 'Chantiers réalisés', value: s.stats.jobsDone, fmt: 'int' },
    { label: 'Contrats d’entretien', value: s.contracts, fmt: 'int' },
  ];
}

export function sceneInfo(state) {
  return { activity: state.company.capacityUse || 0, customers: Math.min(4, state.sector.quotes.length), vans: vans(state), jobs: state.sector.jobs.length };
}

export const actions = {
  setRate(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.rate = clamp(v, D.minRate, D.maxRate);
    return { ok: true };
  },
  setMargin(state, a) {
    const v = Number(a.value) / 100;
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.margin = clamp(v, 0, 0.6);
    return { ok: true };
  },
  setPolicy(state, a) {
    if (!['capacite', 'tout'].includes(a.value)) return { ok: false, message: 'Politique inconnue.' };
    state.sector.policy = a.value;
    return { ok: true };
  },
};

export { vans };
