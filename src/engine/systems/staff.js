// Employés : candidats, recrutement, motivation, formation, démission, licenciement.

import { FIRST_NAMES, LAST_NAMES, TRAITS, COMMON_ROLES } from '../../data/people.js';
import { FISCALITE } from '../../data/fiscalite.js';
import { sectorData } from '../sectors/registry.js';
import { pay, spend } from '../ledger.js';
import { log } from '../log.js';
import { clamp, mul } from '../money.js';
import { modAdd } from '../modifiers.js';
import { upgradeEffect } from '../upgrades.js';
import { DAYS_PER_MONTH } from '../calendar.js';

const EMP = FISCALITE.employeur;
export const EMPLOYER_FACTOR = 1 + EMP.onssRate + EMP.autresCharges;

export const TRAINING_COST = 90_000; // 900 € HT
export const TRAINING_DAYS = 5;
export const JOB_AD_COST = 30_000; // 300 € HT

export function roles(state) {
  return { ...sectorData(state).roles, ...COMMON_ROLES };
}

export function init(state, opts, diff, rng) {
  state.staff = {
    employees: [],
    candidates: [],
    seq: 0,
    hireCount: 0, // rang d'embauche (réductions « premiers engagements »)
    founder: { active: true, skill: 55, energy: 100 },
    lastWorkload: 0,
  };
  refreshCandidates(state, rng, 4);
}

function makeName(rng) {
  return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
}

/** Génère un candidat pour un rôle donné (ou aléatoire). */
export function makeCandidate(state, rng, roleId, opts = {}) {
  const all = roles(state);
  const ids = Object.keys(all);
  const role = all[roleId] || all[rng.pick(ids)];
  const [lo, hi] = role.skillRange;
  const skill = clamp(Math.round(opts.skill ?? rng.range(lo, hi)), 1, 100);
  const trait = opts.trait || rng.pick(Object.keys(TRAITS));
  const raw = role.baseSalary * (0.75 + (skill / 100) * 0.55) * rng.range(0.92, 1.1) * (opts.salaryMult || 1);
  const salary = Math.max(EMP.rmmmg, Math.round(raw / 1000) * 1000);
  state.staff.seq += 1;
  return {
    id: state.staff.seq,
    name: opts.name || makeName(rng),
    role: role.id,
    skill,
    trait,
    salary,
    expires: state.time.day + 45,
  };
}

/** Renouvelle le vivier de candidats. */
export function refreshCandidates(state, rng, n = 3) {
  const all = roles(state);
  const ids = Object.keys(all);
  const day = state.time.day;
  state.staff.candidates = state.staff.candidates.filter((c) => c.expires > day);
  for (let i = 0; i < n; i++) {
    // Les rôles « max 1 » (gérant) apparaissent moins souvent.
    const id = rng.weighted(ids, (r) => (all[r].max === 1 ? 0.6 : 1.5));
    state.staff.candidates.push(makeCandidate(state, rng, id));
  }
  if (state.staff.candidates.length > 8) state.staff.candidates.splice(0, state.staff.candidates.length - 8);
}

export function seatsAvailable(state) {
  const d = sectorData(state);
  const seats = (d.homeSeats || 99) + upgradeEffect(state, d.staffSeatKey || 'seats');
  const used = state.staff.employees.length + (state.staff.founder.active ? 1 : 0);
  return seats - used;
}

/** Salaire de marché pour un rôle et une compétence (référence de motivation). */
export function marketSalary(state, roleId, skill) {
  const r = roles(state)[roleId];
  return Math.max(EMP.rmmmg, r.baseSalary * (0.75 + (skill / 100) * 0.55));
}

/** Coût employeur mensuel d'un employé (avant réductions). */
export function employerCost(e) {
  return mul(e.salary, EMPLOYER_FACTOR);
}

/** Réduction « premiers engagements » mensuelle pour un employé. */
export function hireReduction(state, e) {
  const months = (state.time.day - e.hiredDay) / DAYS_PER_MONTH;
  if (e.hireRank === 1) return Math.round(EMP.firstHireReduction / 3);
  if (e.hireRank <= EMP.nextHiresMax && months < EMP.nextHiresQuarters * 3) return Math.round(EMP.nextHiresReduction / 3);
  return 0;
}

export function monthlyPayroll(state) {
  let s = 0;
  for (const e of state.staff.employees) {
    const onss = mul(e.salary, EMP.onssRate);
    s += employerCost(e) - Math.min(onss, hireReduction(state, e));
  }
  return s;
}

/** Productivité d'un employé (≈ 1 pour compétence 50, motivation 70). */
export function productivity(state, e) {
  if (state.time.day < (e.absentUntil || 0)) return 0;
  const t = TRAITS[e.trait] || TRAITS.fiable;
  const mot = 0.7 + 0.3 * (e.motivation / 100);
  return (0.5 + e.skill / 100) * mot * t.prod;
}

export function qualityOf(e) {
  const t = TRAITS[e.trait] || TRAITS.fiable;
  return (0.6 + e.skill / 125) * t.quality;
}

export function countRole(state, roleId) {
  let n = 0;
  for (const e of state.staff.employees) if (e.role === roleId) n++;
  return n;
}

export function hasManager(state) {
  return state.staff.employees.some((e) => e.role === 'gerant' && e.skill >= 40);
}

/** Bonus de productivité d'équipe (gérant, chef de projet…). */
export function teamBonus(state) {
  let b = 1;
  if (hasManager(state)) b += 0.05;
  return b;
}

// --- Actions --------------------------------------------------------------

export function hire(state, candidateId) {
  const idx = state.staff.candidates.findIndex((c) => c.id === candidateId);
  if (idx < 0) return { ok: false, message: 'Candidat introuvable.' };
  const c = state.staff.candidates[idx];
  const role = roles(state)[c.role];
  if (role.max && countRole(state, c.role) >= role.max) return { ok: false, message: `Tu as déjà le maximum pour ce rôle (${role.max}).` };
  if (seatsAvailable(state) <= 0) return { ok: false, message: 'Plus de place : il faut de plus grands locaux.' };
  state.staff.candidates.splice(idx, 1);
  state.staff.hireCount += 1;
  const e = {
    id: c.id,
    name: c.name,
    role: c.role,
    skill: c.skill,
    trait: c.trait,
    salary: c.salary,
    motivation: 70,
    hiredDay: state.time.day,
    hireRank: state.staff.hireCount,
    absentUntil: 0,
  };
  state.staff.employees.push(e);
  state.stats.hires = (state.stats.hires || 0) + 1;
  state.stats.maxEmployees = Math.max(state.stats.maxEmployees || 0, state.staff.employees.length);
  log(state, 'staff', `${e.name} rejoint l'équipe (${role.label}).`);
  return { ok: true };
}

/** Semaines de préavis selon l'ancienneté (barème « statut unique », simplifié). */
export function noticeWeeksOf(state, e) {
  const months = (state.time.day - e.hiredDay) / DAYS_PER_MONTH;
  let weeks = 1;
  for (const [m, w] of EMP.noticeWeeks) if (months >= m) weeks = w;
  if (months >= 132) weeks += Math.floor((months - 120) / 12) * 3; // +3 semaines par année au-delà de 10 ans
  return Math.min(weeks, EMP.noticeMaxWeeks);
}

/** Indemnité de préavis (coût employeur) : salaire hebdomadaire × semaines + ONSS. */
export function dismissalCost(state, e) {
  return Math.round(((e.salary * 12) / 52) * noticeWeeksOf(state, e) * (1 + EMP.onssRate));
}

export function fire(state, employeeId) {
  const idx = state.staff.employees.findIndex((e) => e.id === employeeId);
  if (idx < 0) return { ok: false, message: 'Employé introuvable.' };
  const e = state.staff.employees[idx];
  const cost = dismissalCost(state, e);
  pay(state, cost, 'licenciement');
  state.staff.employees.splice(idx, 1);
  for (const o of state.staff.employees) o.motivation = clamp(o.motivation - 6, 0, 100);
  state.stats.fired = (state.stats.fired || 0) + 1;
  log(state, 'staff', `${e.name} est licencié·e. Indemnité de préavis : ${(cost / 100).toFixed(0)} €.`);
  return { ok: true };
}

export function train(state, employeeId) {
  const e = state.staff.employees.find((x) => x.id === employeeId);
  if (!e) return { ok: false, message: 'Employé introuvable.' };
  if (state.time.day < e.absentUntil) return { ok: false, message: 'Déjà en formation ou absent.' };
  if (e.skill >= 100) return { ok: false, message: 'Compétence déjà maximale.' };
  spend(state, TRAINING_COST, 0.21, 'formation');
  const t = TRAITS[e.trait] || TRAITS.fiable;
  e.skill = clamp(Math.round(e.skill + 8 * t.learn), 1, 100);
  e.motivation = clamp(e.motivation + 6, 0, 100);
  e.absentUntil = state.time.day + TRAINING_DAYS;
  state.stats.trainings = (state.stats.trainings || 0) + 1;
  log(state, 'staff', `${e.name} part ${TRAINING_DAYS} jours en formation (+compétence).`);
  return { ok: true };
}

export function raise(state, employeeId, pct = 0.05) {
  const e = state.staff.employees.find((x) => x.id === employeeId);
  if (!e) return { ok: false, message: 'Employé introuvable.' };
  e.salary = Math.round((e.salary * (1 + pct)) / 1000) * 1000;
  e.motivation = clamp(e.motivation + 12, 0, 100);
  log(state, 'staff', `${e.name} est augmenté·e (+${Math.round(pct * 100)} %).`);
  return { ok: true };
}

export function postJobAd(state, rng, roleId) {
  spend(state, JOB_AD_COST, 0.21, 'recrutement');
  for (let i = 0; i < 3; i++) state.staff.candidates.push(makeCandidate(state, rng, roleId));
  if (state.staff.candidates.length > 8) state.staff.candidates.splice(0, state.staff.candidates.length - 8);
  return { ok: true };
}

// --- Simulation -----------------------------------------------------------

export function daily(state, rng) {
  const st = state.staff;
  const workload = st.lastWorkload || 0; // utilisation de la capacité (0..1+)
  const teamMorale = st.employees.reduce((s, e) => s + (TRAITS[e.trait]?.teamMorale || 0), 0);
  const moodMod = modAdd(state, 'motivation') + upgradeEffect(state, 'motivation');
  const unpaid = state.flags.salaryLate ? -25 : 0;
  const leaving = [];
  for (const e of st.employees) {
    const t = TRAITS[e.trait] || TRAITS.fiable;
    const payRatio = e.salary / marketSalary(state, e.role, e.skill);
    let target = 62 + 60 * (payRatio - 1) + t.motivation + teamMorale + moodMod + unpaid;
    if (workload > 1.05) target -= 25 * (workload - 1);
    if (workload < 0.4) target -= 6; // ennui, peur pour son emploi
    target = clamp(target, 0, 100);
    e.motivation = clamp(e.motivation + (target - e.motivation) * 0.02, 0, 100);
    // L'ambitieux veut progresser : sa compétence monte doucement avec le temps.
    if (e.trait === 'ambitieux' && rng.chance(0.004)) e.skill = Math.min(100, e.skill + 1);
    if (e.motivation < 25) {
      const p = 0.006 * ((25 - e.motivation) / 25) * t.resign;
      if (rng.chance(p)) leaving.push(e);
    }
  }
  for (const e of leaving) {
    st.employees = st.employees.filter((x) => x !== e);
    state.stats.resignations = (state.stats.resignations || 0) + 1;
    log(state, 'bad', `${e.name} démissionne (motivation trop basse).`, true);
  }
}

export function monthEnd(state, rng) {
  const st = state.staff;
  // Salaires (coût employeur), réduction premiers engagements déduite.
  for (const e of st.employees) {
    const onss = mul(e.salary, EMP.onssRate);
    const cost = employerCost(e) - Math.min(onss, hireReduction(state, e));
    pay(state, cost, 'salaires');
  }
  // Nouveaux candidats spontanés
  refreshCandidates(state, rng, 2);
}
