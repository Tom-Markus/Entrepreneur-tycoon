// Secteur agence web : leads → projets → heures → factures (+ maintenance, SaaS).

import { AGENCE as D } from '../../data/sectors/agence.js';
import { DIFFICULTIES } from '../../data/difficulty.js';
import { dateOf, isWeekend } from '../calendar.js';
import { attractiveness, playerShare, priceFactor, marketingFactor, reputationFactor } from '../demand.js';
import { invoice, earn, spend } from '../ledger.js';
import { upgradeEffect } from '../upgrades.js';
import { modMult } from '../modifiers.js';
import { productivity, qualityOf, countRole, teamBonus } from '../systems/staff.js';
import { rateCustomer, changeReputation } from '../systems/company.js';
import { economyIndex } from '../systems/core.js';
import { log } from '../log.js';
import { clamp } from '../money.js';

const WORKDAYS_PER_MONTH = 21;

export function init(state) {
  state.sector = {
    rate: D.refRate,
    policy: 'capacite', // 'manuel' | 'capacite' | 'tout'
    leads: [],
    projects: [],
    leadSeq: 0,
    projSeq: 0,
    maint: { contracts: [], seq: 0 },
    saas: { status: 'none', subscribers: 0, price: D.saas.defaultPrice, acc: 0, peak: 0 },
    hours: { avail: 0, used: 0 },
    stats: { projectsDone: 0, hoursBilled: 0, leadsLost: 0, leadsWon: 0, lateProjects: 0 },
  };
}

// --- Calculs -------------------------------------------------------------

/** Heures facturables disponibles par jour ouvré. */
export function hoursPerDay(state) {
  const st = state.staff;
  let h = 0;
  if (st.founder.active) h += D.founderHours * (0.6 + st.founder.skill / 140) * (st.founder.energy / 100 * 0.4 + 0.6);
  for (const e of st.employees) {
    const r = D.roles[e.role];
    if (r && r.hours) h += r.hours * productivity(state, e);
  }
  const pm = countRole(state, 'chef_projet') > 0 ? 1 + D.roles.chef_projet.prod : 1;
  return h * teamBonus(state) * pm * upgradeEffect(state, 'prodMult') * modMult(state, 'productivity');
}

/** Qualité perçue du travail (1 ≈ moyenne du marché). */
export function quality(state) {
  const st = state.staff;
  let wq = 0;
  let w = 0;
  if (st.founder.active) {
    wq += (0.6 + st.founder.skill / 125) * D.founderHours;
    w += D.founderHours;
  }
  let designers = 0;
  for (const e of st.employees) {
    const r = D.roles[e.role];
    if (!r || !r.hours) continue;
    wq += qualityOf(e) * r.hours;
    w += r.hours;
    if (e.role === 'designer') designers++;
  }
  const base = w > 0 ? wq / w : 0.8;
  const q = base + Math.min(3, designers) * D.roles.designer.quality + upgradeEffect(state, 'quality');
  return clamp(q * modMult(state, 'quality'), 0.3, 2);
}

export function backlogHours(state) {
  let s = 0;
  for (const p of state.sector.projects) s += Math.max(0, p.hoursReal - p.done);
  return s;
}

function overrunMult(state) {
  let m = upgradeEffect(state, 'overrunMult');
  if (countRole(state, 'chef_projet') > 0) m *= D.roles.chef_projet.overrun;
  return m;
}

export function refPrice(state) {
  return Math.round(D.refRate * modMult(state, 'refPrice'));
}

/** Attractivité du joueur (part des demandes du marché). */
export function playerAttraction(state) {
  const credibility = state.meta.legal === 'srl' ? 1.06 : 1; // clients B2B rassurés par une société
  return attractiveness({
    price: state.sector.rate,
    refPrice: refPrice(state),
    elasticity: D.elasticity,
    quality: state.company.quality,
    reputation: state.company.reputation,
    marketing: state.company.marketing,
    marketingRef: D.marketingRef,
    extra: credibility * modMult(state, 'attraction'),
  });
}

function commercialFactor(state) {
  let sum = 0;
  for (const e of state.staff.employees) if (e.role === 'commercial') sum += productivity(state, e);
  return 1 + D.roles.commercial.leads * Math.pow(sum, 0.8);
}

/** Demandes attendues par jour ouvré (avec le détail des facteurs). */
export function leadRate(state) {
  const d = dateOf(state.time.day);
  const diff = DIFFICULTIES[state.meta.difficulty];
  const att = playerAttraction(state);
  const share = playerShare(state, att.value);
  const season = D.seasonality[d.month];
  const eco = economyIndex(state);
  const ev = modMult(state, 'demand');
  const brand = upgradeEffect(state, 'leadsMult');
  const sales = commercialFactor(state);
  const lambda = D.marketLeads * diff.marketMult * season * eco * ev * share * brand * sales;
  return { lambda, share, att, season, eco, ev, brand, sales };
}

// --- Leads & projets ----------------------------------------------------------

function newLead(state, rng) {
  const s = state.sector;
  const big = upgradeEffect(state, 'bigProjects') > 0;
  const types = D.projectTypes.filter((t) => !t.minRep || state.company.reputation >= t.minRep || big);
  const t = rng.weighted(types, (x) => x.weight * (big && x.hours[0] >= 90 ? 2 : 1));
  const hours = rng.int(t.hours[0], t.hours[1]);
  const budget = Math.round(
    refPrice(state) * t.budget * upgradeEffect(state, 'budgetMult') * Math.exp(rng.normal(0, 0.18)) * Math.sqrt(economyIndex(state)),
  );
  s.leadSeq += 1;
  return {
    id: s.leadSeq,
    type: t.id,
    label: t.label,
    client: rng.pick(D.clientNames),
    hours,
    budget: Math.round(budget / 100) * 100,
    deadline: t.deadline,
    expires: state.time.day + D.leadExpiryDays,
  };
}

/** Le client accepte-t-il le taux actuel ? */
export function leadAffordable(state, lead) {
  return state.sector.rate <= lead.budget;
}

function canAbsorb(state, lead) {
  const cap = Math.max(1, hoursPerDay(state)) * WORKDAYS_PER_MONTH * 1.4;
  return backlogHours(state) + lead.hours <= cap;
}

export function acceptLead(state, leadId, rng) {
  const s = state.sector;
  const i = s.leads.findIndex((l) => l.id === leadId);
  if (i < 0) return { ok: false, message: 'Demande introuvable ou expirée.' };
  const lead = s.leads[i];
  s.leads.splice(i, 1);
  if (!leadAffordable(state, lead)) {
    s.stats.leadsLost += 1;
    log(state, 'bad', `${lead.client} trouve ton taux trop élevé et part chez un concurrent.`);
    return { ok: false, message: 'Le client refuse ton taux horaire.' };
  }
  const overrun = 1 + Math.max(0, rng.normal(0.14, 0.14)) * overrunMult(state);
  const price = lead.hours * s.rate;
  s.projSeq += 1;
  const p = {
    id: s.projSeq,
    client: lead.client,
    label: lead.label,
    hoursEst: lead.hours,
    hoursReal: Math.round(lead.hours * overrun * 10) / 10,
    done: 0,
    price,
    deposit: 0,
    start: state.time.day,
    deadlineDay: state.time.day + lead.deadline,
    internal: false,
  };
  const dep = upgradeEffect(state, 'deposit');
  if (dep > 0) {
    p.deposit = Math.round(price * dep);
    invoice(state, p.deposit, D.vatRate, 'projets', { dueIn: 3, label: `Acompte ${p.client}` });
  }
  s.projects.push(p);
  s.stats.leadsWon += 1;
  log(state, 'good', `Projet signé : ${p.label} pour ${p.client} (${lead.hours} h).`);
  return { ok: true };
}

export function declineLead(state, leadId) {
  const s = state.sector;
  const i = s.leads.findIndex((l) => l.id === leadId);
  if (i < 0) return { ok: false, message: 'Demande introuvable.' };
  s.leads.splice(i, 1);
  return { ok: true };
}

function completeProject(state, p, rng) {
  const s = state.sector;
  s.projects = s.projects.filter((x) => x !== p);
  if (p.internal) {
    s.saas.status = 'live';
    s.saas.subscribers = 5;
    state.flags.saasLive = true;
    log(state, 'good', 'Ton SaaS est en ligne ! Les premiers abonnés arrivent.', true);
    return;
  }
  const remaining = p.price - p.deposit;
  const defaultP = D.defaultProb * upgradeEffect(state, 'defaultMult') * modMult(state, 'defaultRisk');
  invoice(state, remaining, D.vatRate, 'projets', {
    dueIn: D.paymentDays,
    defaultProb: defaultP,
    lateProb: D.lateProb,
    label: p.client,
    rng,
  });
  const late = Math.max(0, state.time.day - p.deadlineDay);
  if (late > 0) s.stats.lateProjects += 1;
  const q = state.company.quality * rng.range(0.92, 1.08);
  const score = clamp(50 + 75 * (q - 0.85) - 2.5 * late, 0, 100);
  rateCustomer(state, score, 0.15);
  if (score > 70) changeReputation(state, 0.5);
  if (score < 35) changeReputation(state, -1.5);
  s.stats.projectsDone += 1;
  s.stats.hoursBilled += p.hoursEst;
  state.stats.unitsSold = (state.stats.unitsSold || 0) + 1;
  log(state, 'good', `Projet livré : ${p.label} (${p.client})${late ? `, avec ${late} j de retard` : ''}.`);
  // Contrat de maintenance ?
  if (upgradeEffect(state, 'unlockMaintenance') > 0 && rng.chance(D.maintenance.signProb * (score / 70))) {
    const fee = Math.round(rng.range(D.maintenance.fee[0], D.maintenance.fee[1]) / 500) * 500;
    s.maint.seq += 1;
    s.maint.contracts.push({ id: s.maint.seq, client: p.client, fee });
    log(state, 'good', `${p.client} signe un contrat de maintenance (${(fee / 100).toFixed(0)} €/mois).`);
  }
}

/** Démarre le projet interne SaaS (appelé quand l'amélioration est achetée). */
export function startSaas(state) {
  const s = state.sector;
  if (s.saas.status !== 'none') return;
  s.saas.status = 'dev';
  s.projSeq += 1;
  s.projects.push({
    id: s.projSeq, client: 'Interne', label: 'Développement du SaaS', hoursEst: D.saas.devHours, hoursReal: D.saas.devHours,
    done: 0, price: 0, deposit: 0, start: state.time.day, deadlineDay: state.time.day + 9999, internal: true,
  });
  log(state, 'info', `Développement du SaaS lancé (${D.saas.devHours} h de travail interne).`);
}

function maintHoursPerDay(state) {
  const s = state.sector;
  return (s.maint.contracts.length * D.maintenance.hoursPerMonth + s.saas.subscribers * D.saas.supportHoursPerSub) / WORKDAYS_PER_MONTH;
}

// --- Simulation quotidienne ------------------------------------------------------

export function daily(state, rng) {
  const s = state.sector;
  state.company.quality = quality(state);
  const lr = leadRate(state);
  state.company.share = lr.share;
  state.company.attraction = lr.att.value;
  const weekend = isWeekend(state.time.day);

  // 1) Nouvelles demandes
  if (!weekend) {
    const n = rng.poisson(lr.lambda);
    for (let i = 0; i < n; i++) s.leads.push(newLead(state, rng));
  }
  // 2) Acceptation automatique
  if (s.policy !== 'manuel') {
    for (const lead of [...s.leads]) {
      if (!leadAffordable(state, lead)) continue;
      if (s.policy === 'capacite' && !canAbsorb(state, lead)) continue;
      acceptLead(state, lead.id, rng);
    }
  }
  // 3) Demandes expirées = clients perdus
  const before = s.leads.length;
  s.leads = s.leads.filter((l) => l.expires > state.time.day);
  s.stats.leadsLost += before - s.leads.length;

  // 4) Production
  const cap = hoursPerDay(state);
  let avail = weekend ? 0 : Math.max(0, cap - maintHoursPerDay(state));
  const total = avail;
  const clientProjects = s.projects.filter((p) => !p.internal).sort((a, b) => a.deadlineDay - b.deadlineDay);
  const internal = s.projects.find((p) => p.internal);
  if (internal && avail > 0) {
    const share = clientProjects.length ? 0.3 : 1;
    const h = Math.min(avail * share, internal.hoursReal - internal.done);
    internal.done += h;
    avail -= h;
    if (internal.done >= internal.hoursReal - 1e-6) completeProject(state, internal, rng);
  }
  for (const p of clientProjects) {
    if (avail <= 0) break;
    const h = Math.min(avail, p.hoursReal - p.done);
    p.done += h;
    avail -= h;
    if (p.done >= p.hoursReal - 1e-6) completeProject(state, p, rng);
  }
  if (!weekend) {
    s.hours = { avail: total, used: total - avail };
    state.company.capacityUse = total > 0 ? (total - avail) / total : 1;
  }
  const backlog = backlogHours(state);
  state.staff.lastWorkload = cap > 0 ? Math.min(2, backlog / (cap * WORKDAYS_PER_MONTH)) : 0;

  // 5) SaaS
  if (s.saas.status === 'live') saasDaily(state, rng);

  // 6) Panneau « pourquoi ? »
  state.company.why = [
    { label: 'Part de marché', value: lr.share, kind: 'pct', hint: 'Ta part des demandes face aux concurrents.' },
    { label: 'Prix (taux horaire)', value: lr.att.parts.prix, hint: 'Plus ton taux dépasse 65 €/h, moins on te choisit.' },
    { label: 'Qualité', value: lr.att.parts.qualite, hint: 'Compétence de l’équipe, designers et améliorations.' },
    { label: 'Réputation', value: lr.att.parts.reputation, hint: 'Projets livrés à temps et bien faits.' },
    { label: 'Marketing', value: lr.att.parts.marketing, hint: 'Rendements décroissants : doubler le budget ne double pas les clients.' },
    { label: 'Saison', value: lr.season, hint: 'Été et fin d’année calmes, rentrée chargée.' },
    { label: 'Conjoncture', value: lr.eco, hint: 'Les PME investissent moins en période de crise.' },
    { label: 'Événements', value: lr.ev, hint: 'Effets temporaires en cours.' },
    { label: 'Image de marque', value: lr.brand, hint: 'Portfolio, référencement, locaux.' },
    { label: 'Commerciaux', value: lr.sales, hint: 'Chaque commercial ramène des demandes.' },
  ];
  const affordable = s.leads.filter((l) => leadAffordable(state, l)).length;
  state.company.bottleneck =
    backlog > cap * WORKDAYS_PER_MONTH * 1.2
      ? 'capacite'
      : s.leads.length > 0 && affordable === 0
        ? 'prix'
        : lr.lambda < 0.15
          ? 'demande'
          : null;
  state.company.demandPerDay = lr.lambda;
}

function saasDaily(state, rng) {
  const s = state.sector;
  const c = D.saas;
  const pf = priceFactor(s.saas.price, c.defaultPrice, c.elasticity);
  const mf = marketingFactor(state.company.marketing, D.marketingRef);
  const rf = reputationFactor(state.company.reputation);
  const sat = Math.max(0, 1 - s.saas.subscribers / c.potential);
  const lambda = c.baseNewPerDay * upgradeEffect(state, 'saasGrowthMult') * mf * rf * pf * sat * economyIndex(state) * (1 + s.saas.subscribers / 400);
  const gained = rng.poisson(lambda);
  const churnBoost = state.company.quality < 0.9 ? 1.5 : 1;
  const lost = rng.poisson((s.saas.subscribers * c.churnMonthly * churnBoost * modMult(state, 'saasChurn')) / 30);
  s.saas.subscribers = Math.max(0, s.saas.subscribers + gained - lost);
  s.saas.peak = Math.max(s.saas.peak, s.saas.subscribers);
}

export function monthEnd(state, rng) {
  const s = state.sector;
  // Maintenance : facturation + résiliations
  const churn = D.maintenance.churnMonthly * upgradeEffect(state, 'maintChurnMult') * modMult(state, 'maintChurn');
  s.maint.contracts = s.maint.contracts.filter((c) => !rng.chance(churn));
  let maintTotal = 0;
  for (const c of s.maint.contracts) maintTotal += c.fee;
  if (maintTotal > 0) invoice(state, maintTotal, D.vatRate, 'maintenance', { dueIn: 15, defaultProb: 0.01, label: 'Maintenance', rng });
  // SaaS : abonnements payés par carte
  if (s.saas.status === 'live') {
    const mrr = s.saas.subscribers * s.saas.price;
    earn(state, mrr, D.vatRate, 'saas');
    spend(state, D.saas.serverCostBase + s.saas.subscribers * D.saas.serverCostPerSub, 0.21, 'logiciels');
  }
}

/** Revenu récurrent mensuel (maintenance + SaaS), HT. */
export function recurringRevenue(state) {
  const s = state.sector;
  let m = 0;
  for (const c of s.maint.contracts) m += c.fee;
  if (s.saas.status === 'live') m += s.saas.subscribers * s.saas.price;
  return m;
}

export function kpis(state) {
  const s = state.sector;
  return [
    { label: 'Taux horaire', value: s.rate, fmt: 'eur', suffix: '/h' },
    { label: 'Capacité', value: hoursPerDay(state), fmt: 'num1', suffix: ' h/jour' },
    { label: 'Carnet de commandes', value: backlogHours(state), fmt: 'num0', suffix: ' h' },
    { label: 'Projets en cours', value: s.projects.filter((p) => !p.internal).length, fmt: 'int' },
    { label: 'Projets livrés', value: s.stats.projectsDone, fmt: 'int' },
    { label: 'Récurrent mensuel', value: recurringRevenue(state), fmt: 'eur' },
  ];
}

/** Pour la scène : nombre de « clients » visibles et d'employés au travail. */
export function sceneInfo(state) {
  const s = state.sector;
  return {
    activity: Math.min(1, state.company.capacityUse || 0),
    customers: Math.min(6, s.leads.length + s.projects.length),
    workers: state.staff.employees.length + (state.staff.founder.active ? 1 : 0),
  };
}

export const actions = {
  setRate(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.rate = clamp(v, D.minRate, D.maxRate);
    return { ok: true };
  },
  setPolicy(state, a) {
    if (!['manuel', 'capacite', 'tout'].includes(a.value)) return { ok: false, message: 'Politique inconnue.' };
    state.sector.policy = a.value;
    return { ok: true };
  },
  acceptLead(state, a, rng) {
    return acceptLead(state, a.id, rng);
  },
  declineLead(state, a) {
    return declineLead(state, a.id);
  },
  setSaasPrice(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.saas.price = clamp(v, D.saas.minPrice, D.saas.maxPrice);
    return { ok: true };
  },
};

/** Appelé après l'achat d'une amélioration de ce secteur. */
export function onUpgrade(state, id) {
  if (id === 'saas') startSaas(state);
}

