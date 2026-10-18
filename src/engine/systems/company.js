// Entreprise : création, réputation, satisfaction, marketing, charges fixes.

import { ECONOMY } from '../../data/economy.js';
import { FISCALITE } from '../../data/fiscalite.js';
import { sectorData } from '../sectors/registry.js';
import { spend, receive, initLedger } from '../ledger.js';
import { initUpgrades, payUpgradeMonthly, upgradeEffect } from '../upgrades.js';
import { expireModifiers, modAdd } from '../modifiers.js';
import { clamp } from '../money.js';
import { priceLevel } from './core.js';

export function init(state, opts, diff) {
  const sd = sectorData(state);
  initLedger(state);
  initUpgrades(state);
  state.company = {
    reputation: ECONOMY.startReputation,
    satisfaction: ECONOMY.startSatisfaction,
    quality: 1,
    marketing: 0, // budget mensuel (centimes HT)
    why: [],
    bottleneck: null,
    capacityUse: 0,
    share: 0,
    attraction: 0,
  };
  state.passiveTarget = diff.passiveTarget;
  const capital = diff.startingCapital;
  const apport = Math.round(capital * clamp(opts.apportPct, 0, 1));
  state.personal = {
    cash: capital - apport,
    livingCost: ECONOMY.livingCost,
    draw: ECONOMY.defaultDraw, // prélèvement (indépendant) ou rémunération brute (SRL)
    month: {},
    history: [],
  };
  receive(state, apport, 'apport');
  state.stats.apports = apport;
  // Frais de création et équipement de départ
  const creation = FISCALITE.creation[state.meta.legal] || 0;
  spend(state, creation, state.meta.legal === 'srl' ? 0.21 : 0, 'autres');
  if (sd.startCostExtra) spend(state, sd.startCostExtra, 0.21, 'investissement', { capex: true, label: 'Équipement de départ' });
  // Si l'apport ne couvre pas l'équipement + une petite réserve, la banque finance la différence
  // (prêt de démarrage, accordé par loans.init).
  const safety = 300_000;
  if (state.cash < safety) state.flags.starterLoan = Math.ceil((safety - state.cash) / 100_000) * 100_000;
  state.finance.franchise = !!opts.vatFranchise;
  state.stats.startCapital = capital;
}

/** Budget marketing dépensé chaque jour (1/30 du budget mensuel). */
function dailyMarketing(state) {
  const m = state.company.marketing;
  if (m > 0) spend(state, Math.round(m / 30), 0.21, 'marketing');
}

export function daily(state) {
  expireModifiers(state);
  dailyMarketing(state);
  const c = state.company;
  // La réputation converge lentement vers la satisfaction (+ bonus de marque).
  const target = clamp(c.satisfaction + upgradeEffect(state, 'repTarget') + modAdd(state, 'repTarget'), 0, 100);
  c.reputation = clamp(c.reputation + (target - c.reputation) * ECONOMY.reputationInertia, 0, 100);
  // La satisfaction revient doucement vers 60 sans nouvelles interactions.
  c.satisfaction = clamp(c.satisfaction + (60 - c.satisfaction) * 0.002, 0, 100);
}

/** Ajuste la satisfaction vers une note client (0-100). weight = poids de l'avis. */
export function rateCustomer(state, score, weight = 0.05) {
  const c = state.company;
  c.satisfaction = clamp(c.satisfaction + (score - c.satisfaction) * weight, 0, 100);
}

export function changeReputation(state, delta) {
  state.company.reputation = clamp(state.company.reputation + delta, 0, 100);
}

/** Charges fixes mensuelles du secteur + comptable + énergie + améliorations. */
export function monthlyFixedCosts(state) {
  const sd = sectorData(state);
  const heads = state.staff.employees.length + 1;
  const lvl = priceLevel(state);
  const list = [];
  for (const f of sd.fixedCosts) {
    list.push({ label: f.label, amount: Math.round((f.amount + (f.perHead || 0) * heads) * lvl), vat: f.vat, cat: f.cat });
  }
  list.push({ label: 'Comptable', amount: Math.round(FISCALITE.comptable[state.meta.legal] * lvl), vat: 0.21, cat: 'comptable' });
  return list;
}

export function monthEnd(state) {
  for (const f of monthlyFixedCosts(state)) spend(state, f.amount, f.vat, f.cat);
  // Hausses de charges fixes dues aux événements (assurance, indexation du loyer…)
  if (state.company.extraFixed > 0) spend(state, state.company.extraFixed, 0, 'autres');
  payUpgradeMonthly(state);
}
