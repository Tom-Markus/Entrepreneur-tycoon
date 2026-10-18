// Moteur d'événements aléatoires.
//
// Les événements sont des DONNÉES (src/data/events.js) avec des effets
// déclaratifs : l'interface peut afficher les conséquences de chaque choix
// avant de choisir (describeEffects), les bots peuvent décider, et tout reste
// sérialisable.
//
// Anti-répétition : pondération, cooldown propre à chaque événement, délai
// global entre deux événements, « once », chaînes programmées.

import { EVENTS, EVENT_PARAMS } from '../data/events.js';
import { DIFFICULTIES } from '../data/difficulty.js';
import { pay, receive, personalIn, personalOut } from './ledger.js';
import { addModifier } from './modifiers.js';
import { makeCandidate } from './systems/staff.js';
import { spawnCompetitor, updateAttraction } from './systems/competitors.js';
import { makeInvestorOffer } from './systems/loans.js';
import { sectorModule } from './sectors/index.js';
import { avgRevenue } from './systems/finance.js';
import { clamp } from './money.js';
import { log } from './log.js';

const BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

export function eventById(id) {
  return BY_ID[id];
}

export function init(state) {
  state.events = { pending: [], scheduled: [], cooldowns: {}, lastDay: EVENT_PARAMS.firstEventDay - EVENT_PARAMS.minGapDays, history: [], uid: 0, counts: {} };
}

function severity(state) {
  return DIFFICULTIES[state.meta.difficulty].eventSeverity;
}

// --- Contexte (cible de l'événement) ------------------------------------------------

function pickContext(state, ev, rng) {
  const ctx = {};
  if (ev.target === 'employee' || ev.target === 'keyEmployee') {
    const list = [...state.staff.employees].filter((e) => e.role !== 'gerant' || ev.target === 'keyEmployee');
    if (!list.length) return null;
    const e = ev.target === 'keyEmployee' ? list.sort((a, b) => b.skill - a.skill)[0] : rng.pick(list);
    ctx.employeeId = e.id;
    ctx.employee = e.name;
  }
  if (ev.target === 'competitor') {
    const list = state.competitors.filter((c) => c.alive);
    if (!list.length) return null;
    const c = rng.pick(list);
    ctx.competitorId = c.id;
    ctx.competitor = c.name;
  }
  return ctx;
}

function fill(text, ctx) {
  return String(text).replace(/\{(\w+)\}/g, (_, k) => (ctx && ctx[k] != null ? ctx[k] : `{${k}}`));
}

// --- Montants ---------------------------------------------------------------------

/** Résout un montant déclaratif en centimes (avant sévérité). */
export function resolveAmount(state, amt) {
  if (typeof amt === 'number') return amt;
  if (!amt) return 0;
  let base = 0;
  if (amt.of === 'revenue') base = Math.max(avgRevenue(state, 3), 300_000);
  else if (amt.of === 'payroll') base = state.staff.employees.reduce((s, e) => s + e.salary, 0);
  else if (amt.of === 'cash') base = Math.max(0, state.cash);
  let v = base * (amt.f || 0);
  if (amt.min != null) v = Math.max(v, amt.min);
  if (amt.max != null) v = Math.min(v, amt.max);
  return Math.round(v / 100) * 100;
}

function scaled(state, amount) {
  // Les pertes sont amplifiées par la difficulté, les gains atténués.
  const sev = severity(state);
  return amount < 0 ? Math.round(amount * sev) : Math.round(amount / Math.sqrt(sev));
}

function scaledMult(state, mult) {
  const sev = severity(state);
  if (mult < 1) return clamp(1 - (1 - mult) * sev, 0.05, 1);
  return 1 + (mult - 1) / Math.sqrt(sev);
}

// --- Effets -----------------------------------------------------------------------

/** Probabilité effective d'un effet « chance » (peut dépendre de l'état). */
export function chanceOf(state, e, ctx) {
  let p = typeof e.p === 'number' ? e.p : 0.5;
  if (e.pFn) p = e.pFn(state, ctx);
  return clamp(p, 0, 1);
}

export function applyEffects(state, effects, ctx, rng, src) {
  for (const e of effects || []) applyEffect(state, e, ctx, rng, src);
}

function applyEffect(state, e, ctx, rng, src) {
  switch (e.t) {
    case 'cash': {
      const v = scaled(state, resolveAmount(state, e.amount));
      if (v >= 0) receive(state, v, e.cat || 'autres_revenus', { taxable: e.taxable !== false });
      else pay(state, -v, e.cat || 'evenements');
      break;
    }
    case 'personal': {
      const v = scaled(state, resolveAmount(state, e.amount));
      if (v >= 0) personalIn(state, v, 'evenement');
      else personalOut(state, -v, 'evenement');
      break;
    }
    case 'rep':
      state.company.reputation = clamp(state.company.reputation + (e.v < 0 ? e.v * severity(state) : e.v), 0, 100);
      break;
    case 'sat':
      state.company.satisfaction = clamp(state.company.satisfaction + e.v, 0, 100);
      break;
    case 'mod':
      addModifier(state, { key: e.key, mult: e.mult != null ? scaledMult(state, e.mult) : 1, add: e.add || 0, days: e.days, label: e.label || src, source: src });
      break;
    case 'motivation':
      for (const emp of state.staff.employees) emp.motivation = clamp(emp.motivation + e.v, 0, 100);
      break;
    case 'loseEmployee': {
      const emp = state.staff.employees.find((x) => x.id === ctx.employeeId);
      if (emp) {
        state.staff.employees = state.staff.employees.filter((x) => x !== emp);
        state.stats.resignations = (state.stats.resignations || 0) + 1;
      }
      break;
    }
    case 'employeeSkill': {
      const emp = state.staff.employees.find((x) => x.id === ctx.employeeId);
      if (emp) emp.skill = clamp(emp.skill + e.v, 1, 100);
      break;
    }
    case 'employeeRaise': {
      const emp = state.staff.employees.find((x) => x.id === ctx.employeeId);
      if (emp) {
        emp.salary = Math.round((emp.salary * (1 + e.pct)) / 1000) * 1000;
        emp.motivation = clamp(emp.motivation + 20, 0, 100);
      }
      break;
    }
    case 'employeeAbsent': {
      const emp = state.staff.employees.find((x) => x.id === ctx.employeeId);
      if (emp) emp.absentUntil = Math.max(emp.absentUntil || 0, state.time.day + e.days);
      break;
    }
    case 'salaryIndex':
      for (const emp of state.staff.employees) emp.salary = Math.round((emp.salary * (1 + e.pct)) / 100) * 100;
      break;
    case 'candidate': {
      const c = makeCandidate(state, rng, e.role || sectorModule(state).mainRole || null, { skill: e.skill, salaryMult: e.salaryMult || 1, trait: e.trait });
      if (e.salaryMult === 0) c.salary = 0; // stagiaire non rémunéré (convention de stage)
      c.expires = state.time.day + 20;
      state.staff.candidates.push(c);
      break;
    }
    case 'fixedCost':
      state.company.extraFixed = (state.company.extraFixed || 0) + scaled(state, -Math.abs(e.amount)) * -1;
      break;
    case 'chain':
      state.events.scheduled.push({ id: e.id, day: state.time.day + (e.days || 30), ctx });
      break;
    case 'flag':
      state.flags[e.key] = e.value === undefined ? true : e.value;
      break;
    case 'flagUntil':
      state.flags[e.key] = state.time.day + e.days;
      break;
    case 'economyTrend':
      state.world.economyTrend += e.v;
      break;
    case 'baseRate':
      state.world.baseRate = clamp(state.world.baseRate + e.v, 0, 0.08);
      break;
    case 'competitorPromo': {
      const c = state.competitors.find((x) => x.id === ctx.competitorId);
      if (c) {
        c.promoUntil = state.time.day + (e.days || 21);
        updateAttraction(state);
      }
      break;
    }
    case 'competitorBankrupt': {
      const c = state.competitors.find((x) => x.id === ctx.competitorId);
      if (c && c.alive) {
        c.alive = false;
        c.deadDay = state.time.day;
        state.stats.competitorsBankrupt = (state.stats.competitorsBankrupt || 0) + 1;
        updateAttraction(state);
      }
      break;
    }
    case 'newCompetitor':
      spawnCompetitor(state, rng, e.strategy);
      break;
    case 'investorOffer':
      if (state.meta.legal === 'srl' && !state.offers.investor) makeInvestorOffer(state, rng);
      break;
    case 'founderEnergy':
      state.staff.founder.energy = clamp(state.staff.founder.energy + e.v, 10, 100);
      break;
    case 'stat':
      state.stats[e.key] = (state.stats[e.key] || 0) + (e.v ?? 1);
      break;
    case 'sector':
      if (!commonOp(state, e)) {
        const m = sectorModule(state);
        if (m.eventOp) m.eventOp(state, e, rng, ctx);
      }
      break;
    case 'chance': {
      const p = chanceOf(state, e, ctx);
      const ok = rng.chance(p);
      applyEffects(state, ok ? e.success : e.fail, ctx, rng, src);
      if (e.successText || e.failText) log(state, ok ? 'good' : 'bad', fill(ok ? e.successText : e.failText, ctx), true);
      break;
    }
    case 'log':
      log(state, e.kind || 'event', fill(e.text, ctx), !!e.toast);
      break;
    default:
      break;
  }
}

/** Opérations communes à tous les secteurs. Retourne vrai si gérée. */
function commonOp(state, e) {
  switch (e.op) {
    case 'delayReceivables':
      for (const r of state.finance.receivables) r.due += e.days;
      return true;
    case 'clearCandidates':
      state.staff.candidates = [];
      return true;
    case 'raiseSocialBase': {
      const last = state.tax.results[state.tax.results.length - 1];
      if (last) state.tax.social.chosenBase = Math.max(state.tax.social.chosenBase, Math.round(last.operating * 0.8));
      return true;
    }
    case 'upgradeDiscount':
      state.flags.upgradeDiscount = { pct: e.pct, until: state.time.day + e.days, cat: 'locaux' };
      return true;
    default:
      return false;
  }
}

// --- Aperçu des conséquences ---------------------------------------------------------

const MOD_LABELS = {
  demand: 'Demande', productivity: 'Productivité', quality: 'Qualité', unitCost: 'Coût des achats', energy: 'Coût de l’énergie',
  economy: 'Conjoncture', attraction: 'Attractivité', cpc: 'Coût par clic', defaultRisk: 'Risque d’impayés', motivation: 'Motivation',
  materialCost: 'Coût des matériaux', refPrice: 'Prix du marché', saasChurn: 'Résiliations SaaS', maintChurn: 'Résiliations maintenance',
  hygiene: 'Hygiène', capacity: 'Capacité', returns: 'Retours', delivery: 'Délais de livraison', enrollment: 'Inscriptions',
};

function eurTxt(c) {
  return `${Math.round(c / 100).toLocaleString('fr-BE')} €`;
}

/** Lignes lisibles décrivant les effets d'un choix (avec probabilités). */
export function describeEffects(state, choice, ctx = {}) {
  const out = [];
  const walk = (effects, prefix = '') => {
    for (const e of effects || []) {
      switch (e.t) {
        case 'cash': {
          const v = scaled(state, resolveAmount(state, e.amount));
          out.push({ text: `${prefix}${v >= 0 ? '+' : '−'}${eurTxt(Math.abs(v))} (trésorerie)`, kind: v >= 0 ? 'good' : 'bad' });
          break;
        }
        case 'personal': {
          const v = scaled(state, resolveAmount(state, e.amount));
          out.push({ text: `${prefix}${v >= 0 ? '+' : '−'}${eurTxt(Math.abs(v))} (compte perso)`, kind: v >= 0 ? 'good' : 'bad' });
          break;
        }
        case 'rep':
          out.push({ text: `${prefix}Réputation ${e.v > 0 ? '+' : '−'}${Math.abs(Math.round(e.v < 0 ? e.v * severity(state) : e.v))}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'sat':
          out.push({ text: `${prefix}Satisfaction clients ${e.v > 0 ? '+' : '−'}${Math.abs(e.v)}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'mod': {
          const m = e.mult != null ? scaledMult(state, e.mult) : 1;
          const pct = Math.round((m - 1) * 100);
          const label = MOD_LABELS[e.key] || e.key;
          const goodDir = ['unitCost', 'energy', 'cpc', 'defaultRisk', 'materialCost', 'saasChurn', 'maintChurn', 'returns', 'delivery'].includes(e.key) ? pct < 0 : pct > 0;
          out.push({ text: `${prefix}${label} ${pct > 0 ? '+' : '−'}${Math.abs(pct)} % pendant ${e.days} jours`, kind: goodDir ? 'good' : 'bad' });
          break;
        }
        case 'motivation':
          out.push({ text: `${prefix}Motivation de l’équipe ${e.v > 0 ? '+' : '−'}${Math.abs(e.v)}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'loseEmployee':
          out.push({ text: `${prefix}${ctx.employee || 'L’employé'} quitte l’entreprise`, kind: 'bad' });
          break;
        case 'employeeRaise':
          out.push({ text: `${prefix}Salaire de ${ctx.employee || 'l’employé'} +${Math.round(e.pct * 100)} %`, kind: 'bad' });
          break;
        case 'employeeSkill':
          out.push({ text: `${prefix}Compétence de ${ctx.employee || 'l’employé'} ${e.v > 0 ? '+' : ''}${e.v}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'employeeAbsent':
          out.push({ text: `${prefix}${ctx.employee || 'L’employé'} absent ${e.days} jours`, kind: 'bad' });
          break;
        case 'salaryIndex':
          out.push({ text: `${prefix}Tous les salaires +${(e.pct * 100).toFixed(1).replace('.', ',')} %`, kind: 'bad' });
          break;
        case 'candidate':
          out.push({ text: `${prefix}Un nouveau candidat rejoint ton vivier`, kind: 'good' });
          break;
        case 'fixedCost':
          out.push({ text: `${prefix}Charges fixes +${eurTxt(Math.abs(scaled(state, -Math.abs(e.amount))))}/mois`, kind: 'bad' });
          break;
        case 'chance': {
          const p = Math.round(chanceOf(state, e, ctx) * 100);
          out.push({ text: `${prefix}${p} % de chances :`, kind: 'muted' });
          walk(e.success, '   ✔ ');
          out.push({ text: `${prefix}${100 - p} % de risques :`, kind: 'muted' });
          walk(e.fail, '   ✘ ');
          break;
        }
        case 'chain':
          if (e.hint) out.push({ text: `${prefix}${e.hint}`, kind: 'muted' });
          break;
        case 'investorOffer':
          out.push({ text: `${prefix}Une offre d’investissement arrive (onglet Finances)`, kind: 'good' });
          break;
        case 'founderEnergy':
          out.push({ text: `${prefix}Ton énergie ${e.v > 0 ? '+' : '−'}${Math.abs(e.v)}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'competitorBankrupt':
          out.push({ text: `${prefix}${ctx.competitor || 'Le concurrent'} disparaît`, kind: 'good' });
          break;
        case 'sector':
          if (e.hint) out.push({ text: `${prefix}${e.hint}`, kind: e.kind || 'muted' });
          break;
        case 'baseRate':
          out.push({ text: `${prefix}Taux d’intérêt ${e.v > 0 ? '+' : '−'}${Math.abs(e.v * 100).toFixed(2).replace('.', ',')} pt`, kind: e.v > 0 ? 'bad' : 'good' });
          break;
        default:
          if (e.hint) out.push({ text: `${prefix}${e.hint}`, kind: 'muted' });
      }
    }
  };
  walk(choice.effects);
  return out;
}

// --- Déclenchement --------------------------------------------------------------------

function eligible(state, ev) {
  const t = state.events;
  const day = state.time.day;
  if (ev.chainOnly) return false;
  if (ev.sectors && !ev.sectors.includes(state.meta.sector)) return false;
  if (ev.legal && ev.legal !== state.meta.legal) return false;
  if (ev.minDay && day < ev.minDay) return false;
  if (ev.once && t.counts[ev.id]) return false;
  if ((t.cooldowns[ev.id] || -1) > day) return false;
  if (ev.when && !ev.when(state)) return false;
  return true;
}

function weightOf(state, ev) {
  const sev = severity(state);
  let w = ev.weight || 1;
  if (ev.kind === 'bad') w *= sev;
  if (ev.kind === 'good') w /= sev;
  return w;
}

/** Déclenche un événement (immédiat ou en attente de décision). */
export function trigger(state, ev, rng, ctxIn = null) {
  const ctx = ctxIn || pickContext(state, ev, rng);
  if (ctx === null) return false;
  const t = state.events;
  t.counts[ev.id] = (t.counts[ev.id] || 0) + 1;
  t.cooldowns[ev.id] = state.time.day + (ev.cooldown ?? EVENT_PARAMS.defaultCooldown);
  t.lastDay = state.time.day;
  const title = fill(ev.title, ctx);
  const text = fill(ev.text, ctx);
  if (ev.choices && ev.choices.length) {
    t.uid += 1;
    t.pending.push({
      uid: t.uid,
      id: ev.id,
      title,
      text,
      ctx,
      day: state.time.day,
      botChoice: ev.botChoice ?? 0,
      choices: ev.choices.map((c) => ({ label: fill(c.label, ctx), effects: c.effects || [] })),
    });
  } else {
    applyEffects(state, ev.effects, ctx, rng, title);
    t.history.push({ id: ev.id, day: state.time.day });
    log(state, ev.kind === 'good' ? 'good' : ev.kind === 'bad' ? 'bad' : 'event', `${title} — ${text}`, true);
  }
  if (t.history.length > 200) t.history.splice(0, t.history.length - 200);
  return true;
}

export function daily(state, rng) {
  const t = state.events;
  if (state.status === 'bankrupt') return;
  // 1) Suites programmées (chaînes)
  const due = t.scheduled.filter((x) => x.day <= state.time.day);
  if (due.length) {
    t.scheduled = t.scheduled.filter((x) => x.day > state.time.day);
    for (const x of due) {
      const ev = BY_ID[x.id];
      if (ev) trigger(state, ev, rng, x.ctx || {});
    }
  }
  if (t.pending.length) return;
  // 2) Tirage aléatoire
  const diff = DIFFICULTIES[state.meta.difficulty];
  if (state.time.day - t.lastDay < EVENT_PARAMS.minGapDays) return;
  if (!rng.chance(EVENT_PARAMS.dailyChance * diff.eventFrequency)) return;
  const list = EVENTS.filter((ev) => eligible(state, ev));
  const ev = rng.weighted(list, (x) => weightOf(state, x));
  if (ev) trigger(state, ev, rng);
}

/** Action du joueur : choisir une option d'un événement en attente. */
export function decide(state, uid, choiceIdx, rng) {
  const t = state.events;
  const i = t.pending.findIndex((p) => p.uid === uid);
  if (i < 0) return { ok: false, message: 'Décision introuvable.' };
  const p = t.pending[i];
  const c = p.choices[choiceIdx];
  if (!c) return { ok: false, message: 'Choix invalide.' };
  t.pending.splice(i, 1);
  t.history.push({ id: p.id, day: state.time.day, choice: choiceIdx });
  log(state, 'event', `${p.title} : « ${c.label} ».`);
  applyEffects(state, c.effects, p.ctx, rng, p.title);
  return { ok: true };
}
