// Améliorations (arbre de progression par secteur).
// Effets : une clé se terminant par « Mult » se multiplie, les autres s'additionnent.

import { sectorData } from './sectors/registry.js';
import { spend } from './ledger.js';
import { log } from './log.js';

export function initUpgrades(state) {
  state.upgrades = { owned: [] };
}

export function hasUpgrade(state, id) {
  return state.upgrades.owned.includes(id);
}

export function upgradeList(state) {
  return sectorData(state).upgrades;
}

/** Valeur agrégée d'un effet sur toutes les améliorations possédées. */
export function upgradeEffect(state, key) {
  const isMult = key.endsWith('Mult');
  let v = isMult ? 1 : 0;
  for (const u of sectorData(state).upgrades) {
    if (!state.upgrades.owned.includes(u.id) || !u.effects || u.effects[key] === undefined) continue;
    v = isMult ? v * u.effects[key] : v + u.effects[key];
  }
  return v;
}

/** Peut-on acheter cette amélioration ? Retourne { ok, reason }. */
export function canBuyUpgrade(state, id) {
  const u = upgradeList(state).find((x) => x.id === id);
  if (!u) return { ok: false, reason: 'Amélioration inconnue.' };
  if (hasUpgrade(state, id)) return { ok: false, reason: 'Déjà acquise.' };
  for (const r of u.requires || []) {
    if (!hasUpgrade(state, r)) {
      const req = upgradeList(state).find((x) => x.id === r);
      return { ok: false, reason: `Nécessite : ${req ? req.label : r}.` };
    }
  }
  if (u.requiresFlag && !state.flags[u.requiresFlag]) return { ok: false, reason: 'Pas encore disponible.' };
  if (u.minRep && state.company.reputation < u.minRep) return { ok: false, reason: `Réputation ${u.minRep} requise.` };
  const total = Math.round(u.cost * 1.21);
  if (state.cash - total < -state.finance.overdraftLimit) return { ok: false, reason: 'Trésorerie insuffisante.' };
  return { ok: true, total };
}

export function buyUpgrade(state, id) {
  const c = canBuyUpgrade(state, id);
  if (!c.ok) return c;
  const u = upgradeList(state).find((x) => x.id === id);
  spend(state, u.cost, 0.21, 'investissement', { capex: true, label: u.label });
  state.upgrades.owned.push(id);
  state.stats.upgradesBought = (state.stats.upgradesBought || 0) + 1;
  log(state, 'good', `Amélioration acquise : ${u.label}.`);
  return { ok: true, upgrade: u };
}

/** Loyers et abonnements mensuels liés aux améliorations (payés en fin de mois). */
export function payUpgradeMonthly(state) {
  for (const u of sectorData(state).upgrades) {
    if (!hasUpgrade(state, u.id)) continue;
    if (u.rent) spend(state, u.rent, 0, 'loyer'); // loyer pro : en principe sans TVA
    if (u.monthly) spend(state, u.monthly, 0.21, 'logiciels');
  }
}

export function monthlyUpgradeCosts(state) {
  let s = 0;
  for (const u of sectorData(state).upgrades) {
    if (!hasUpgrade(state, u.id)) continue;
    s += (u.rent || 0) + Math.round((u.monthly || 0) * 1.21);
  }
  return s;
}
