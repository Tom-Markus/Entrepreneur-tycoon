// Secteur friterie : affluence (jour, météo, saison), stock périssable, capacité de
// service, files d'attente, hygiène et contrôles AFSCA.

import { RESTAURANT as D } from '../../data/sectors/restaurant.js';
import { FISCALITE } from '../../data/fiscalite.js';
import { dateOf } from '../calendar.js';
import { earn, spend, pay } from '../ledger.js';
import { upgradeEffect } from '../upgrades.js';
import { modMult } from '../modifiers.js';
import { productivity, qualityOf } from '../systems/staff.js';
import { rateCustomer, changeReputation } from '../systems/company.js';
import { htFromTtc, diffOf, playerMarket, baseWhy, prodMod } from './common.js';
import { log } from '../log.js';
import { clamp } from '../money.js';

export const mainRole = 'vendeur';

/** Taux de TVA moyen d'un ticket (nourriture + boissons). */
export function blendedVat() {
  return (1 - D.drinksShare) * FISCALITE.tva.restaurantFood + D.drinksShare * FISCALITE.tva.restaurantDrinks;
}

export function init(state) {
  state.sector = {
    price: D.refPrice,
    ingredient: 2,
    stockDays: 1.3,
    cleaning: 15_000, // budget nettoyage mensuel HT
    hygiene: 80,
    lots: [{ qty: 60, exp: D.shelfLife }],
    pending: 0,
    recent: [], // demande des 7 derniers jours
    closedUntil: -1,
    today: { demand: 0, served: 0, lostQueue: 0, lostStock: 0, capacity: 0 },
    stats: { served: 0, lost: 0, wasted: 0, wastedMonth: 0, bestDay: 0, afscaOk: 0 },
  };
}

function ingredient(state) {
  return D.ingredients.find((i) => i.level === state.sector.ingredient) || D.ingredients[1];
}

export function unitCost(state) {
  return Math.round(ingredient(state).cost * modMult(state, 'unitCost'));
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
  return D.marketClients * marketMult(state) * diffOf(state).marketMult * 30 * htFromTtc(state, D.refPrice, blendedVat());
}

export function stockQty(state) {
  return state.sector.lots.reduce((s, l) => s + l.qty, 0);
}

export function stockValue(state) {
  return stockQty(state) * ingredient(state).cost;
}

export function quality(state) {
  const s = state.sector;
  let q = ingredient(state).quality;
  let cooks = 0;
  for (const e of state.staff.employees) {
    if (e.role === 'cuisinier') {
      q += D.roles.cuisinier.quality * (qualityOf(e) - 0.8);
      cooks++;
    }
  }
  if (!cooks && !state.staff.founder.active) q -= 0.1; // personne en cuisine qui maîtrise
  q += upgradeEffect(state, 'quality');
  q *= 0.82 + 0.0018 * s.hygiene;
  return clamp(q * modMult(state, 'quality'), 0.3, 2);
}

/** Capacités de cuisine et de comptoir (clients/jour). */
export function capacities(state) {
  const f = state.staff.founder;
  let kitchen = f.active ? D.founderKitchen * (f.energy / 100 * 0.3 + 0.7) : 0;
  let counter = f.active ? D.founderCounter * (f.energy / 100 * 0.3 + 0.7) : 0;
  for (const e of state.staff.employees) {
    const r = D.roles[e.role];
    if (!r) continue;
    const p = productivity(state, e);
    if (r.kitchen) kitchen += r.kitchen * p;
    if (r.counter) counter += r.counter * p;
  }
  kitchen = (kitchen + upgradeEffect(state, 'kitchen')) * upgradeEffect(state, 'kitchenMult');
  counter = (counter + upgradeEffect(state, 'counter')) * upgradeEffect(state, 'counterMult');
  const m = modMult(state, 'capacity') * prodMod(state);
  return { kitchen: kitchen * m, counter: counter * m, total: Math.min(kitchen, counter) * m };
}

/** Clients attendus (λ) pour un jour donné, avec le détail des facteurs. */
export function expectedClients(state, day = state.time.day, weatherOverride = null) {
  const d = dateOf(day);
  const m = playerMarket(state, D, state.sector.price, D.refPrice, 1 + upgradeEffect(state, 'attraction'));
  const wName = weatherOverride || state.world.weather;
  let weather = D.weather[wName] ?? 1;
  if (wName === 'soleil') weather += upgradeEffect(state, 'sunBonus');
  if (wName === 'pluie') {
    const protect = Math.min(1, upgradeEffect(state, 'rainProtect') + (state.flags.delivery ? 0.5 : 0));
    weather = 1 - (1 - weather) * (1 - protect);
  }
  const delivery = state.flags.delivery ? 1.1 : 1;
  const lambda =
    D.marketClients * marketMult(state) * diffOf(state).marketMult * D.weekday[d.weekday] * weather * D.seasonality[d.month] * m.eco * m.ev * m.share * delivery;
  return { lambda, m, weekday: D.weekday[d.weekday], weather, season: D.seasonality[d.month], location: marketMult(state), delivery };
}

function consume(state, n) {
  let left = n;
  for (const l of state.sector.lots) {
    if (left <= 0) break;
    const t = Math.min(l.qty, left);
    l.qty -= t;
    left -= t;
  }
  state.sector.lots = state.sector.lots.filter((l) => l.qty > 0);
  return n - left;
}

export function daily(state, rng) {
  const s = state.sector;
  const day = state.time.day;
  state.company.quality = quality(state);
  // Livraison du matin
  if (s.pending > 0) {
    s.lots.push({ qty: s.pending, exp: day + D.shelfLife + upgradeEffect(state, 'shelfLife') });
    s.pending = 0;
  }
  const ex = expectedClients(state);
  const caps = capacities(state);
  const closed = s.closedUntil > day;
  const demand = closed ? 0 : rng.poisson(ex.lambda);
  const capacity = Math.floor(caps.total);
  const canServe = Math.min(demand, capacity);
  const served = consume(state, canServe);
  const lostQueue = Math.max(0, demand - capacity);
  const lostStock = canServe - served;
  s.today = { demand, served, lostQueue, lostStock, capacity, closed };
  s.recent.push(demand);
  if (s.recent.length > 7) s.recent.shift();
  s.stats.served += served;
  s.stats.lost += lostQueue + lostStock;
  s.stats.bestDay = Math.max(s.stats.bestDay, served);
  state.stats.unitsSold = (state.stats.unitsSold || 0) + served;

  // Chiffre d'affaires
  if (served > 0) {
    const vat = blendedVat();
    const ttc = served * s.price;
    earn(state, htFromTtc(state, ttc, vat), vat, 'ventes');
    if (state.flags.delivery) {
      const deliveredShare = 0.1 / 1.1;
      spend(state, Math.round(htFromTtc(state, ttc, vat) * deliveredShare * D.deliveryCommission), 0.21, 'logistique');
    }
  }
  // Satisfaction
  if (demand > 0) {
    const valueForMoney = D.refPrice / s.price;
    let score = 50 + 70 * (state.company.quality - 0.85) + 25 * (valueForMoney - 1);
    score -= 45 * (lostQueue / demand) + 30 * (lostStock / demand);
    rateCustomer(state, clamp(score, 0, 100), 0.03);
  }
  // Hygiène
  let regen = s.cleaning / 30 / 400 + upgradeEffect(state, 'hygieneRegen');
  for (const e of state.staff.employees) if (e.role === 'plongeur') regen += D.roles.plongeur.hygiene * productivity(state, e);
  s.hygiene = clamp(s.hygiene - 0.35 - served / 220 + regen, 0, 100);
  // Péremption
  const expired = s.lots.filter((l) => l.exp <= day + 1);
  const waste = expired.reduce((t, l) => t + l.qty, 0);
  if (waste > 0) {
    s.lots = s.lots.filter((l) => l.exp > day + 1);
    s.stats.wasted += waste;
    s.stats.wastedMonth += waste;
  }
  // Commande pour demain
  let forecast;
  if (upgradeEffect(state, 'forecast') > 0) forecast = expectedClients(state, day + 1).lambda * 1.05;
  else {
    // moyenne récente corrigée du jour de la semaine de demain
    const avg = s.recent.reduce((a, b) => a + b, 0) / Math.max(1, s.recent.length);
    const meanWd = D.weekday.reduce((a, b) => a + b, 0) / 7;
    forecast = (avg * D.weekday[dateOf(day + 1).weekday]) / meanWd;
  }
  forecast = Math.min(forecast, capacity * 1.1);
  const keep = s.lots.filter((l) => l.exp > day + 2).reduce((t, l) => t + l.qty, 0);
  const order = Math.max(0, Math.round(forecast * s.stockDays - keep));
  if (order > 0 && !closed) {
    s.pending = order;
    spend(state, order * unitCost(state), D.purchaseVat, 'stock');
  }
  // Énergie et nettoyage (au prorata quotidien)
  spend(state, Math.round((D.energyBase * modMult(state, 'energy')) / 30), 0.21, 'energie');
  if (s.cleaning > 0) spend(state, Math.round(s.cleaning / 30), 0.21, 'materiel');

  state.company.capacityUse = capacity > 0 ? served / capacity : 1;
  state.staff.lastWorkload = capacity > 0 ? demand / capacity : 0;
  state.company.demandPerDay = ex.lambda;
  state.company.why = [
    ...baseWhy(ex.m, `Ticket moyen ${(s.price / 100).toFixed(2).replace('.', ',')} € (marché 11,50 €).`),
    { label: 'Jour de la semaine', value: ex.weekday, hint: 'Vendredi et samedi sont les meilleurs jours.' },
    { label: 'Météo', value: ex.weather, hint: 'Soleil + terrasse = foule ; la pluie fait fuir.' },
    { label: 'Saison', value: ex.season, hint: 'L’été est la haute saison.' },
    { label: 'Emplacement', value: ex.location, hint: 'Place du marché, 2e établissement.' },
  ];
  state.company.bottleneck = closed
    ? 'ferme'
    : lostStock > demand * 0.08
      ? 'stock'
      : lostQueue > demand * 0.08
        ? 'personnel'
        : ex.m.share < 0.12
          ? 'demande'
          : null;
}

export function monthEnd(state) {
  const s = state.sector;
  if (s.stats.wastedMonth > 0) log(state, 'info', `Gaspillage du mois : ${s.stats.wastedMonth} portions jetées (${Math.round((s.stats.wastedMonth * ingredient(state).cost) / 100)} €).`);
  s.stats.wastedMonth = 0;
}

/** Contrôle de l'AFSCA (appelé par l'événement). */
function afsca(state) {
  const s = state.sector;
  const score = s.hygiene + upgradeEffect(state, 'afscaBonus');
  if (score >= 75) {
    changeReputation(state, 2);
    s.stats.afscaOk += 1;
    state.stats.afscaOk = (state.stats.afscaOk || 0) + 1;
    log(state, 'good', `Contrôle AFSCA réussi (hygiène ${Math.round(s.hygiene)}/100) : smiley affiché en vitrine !`, true);
  } else if (score >= 55) {
    pay(state, 40_000, 'amendes');
    log(state, 'bad', `AFSCA : avertissement et amende de 400 € (hygiène ${Math.round(s.hygiene)}/100).`, true);
  } else if (score >= 35) {
    pay(state, 150_000, 'amendes');
    changeReputation(state, -4);
    log(state, 'bad', `AFSCA : infractions constatées, amende de 1 500 € (hygiène ${Math.round(s.hygiene)}/100).`, true);
  } else {
    pay(state, 300_000, 'amendes');
    changeReputation(state, -10);
    s.closedUntil = state.time.day + 5;
    log(state, 'bad', `AFSCA : fermeture administrative de 5 jours et amende de 3 000 € (hygiène ${Math.round(s.hygiene)}/100) !`, true);
  }
}

export function eventOp(state, e) {
  const s = state.sector;
  switch (e.op) {
    case 'afsca':
      afsca(state);
      break;
    case 'stockLoss':
      for (const l of s.lots) l.qty = Math.floor(l.qty * (1 - e.pct));
      s.lots = s.lots.filter((l) => l.qty > 0);
      break;
    case 'close':
      s.closedUntil = Math.max(s.closedUntil, state.time.day + e.days);
      break;
    case 'hygiene':
      s.hygiene = clamp(s.hygiene + e.v, 0, 100);
      break;
    case 'heatwave':
      s.hygiene = clamp(s.hygiene - 8, 0, 100);
      break;
    default:
      break;
  }
}

export function kpis(state) {
  const s = state.sector;
  const caps = capacities(state);
  const avg = s.recent.length ? s.recent.reduce((a, b) => a + b, 0) / s.recent.length : 0;
  return [
    { label: 'Ticket moyen TTC', value: s.price, fmt: 'eur2' },
    { label: 'Clients/jour (moy. 7 j)', value: avg, fmt: 'num0' },
    { label: 'Capacité/jour', value: caps.total, fmt: 'num0' },
    { label: 'Stock (portions)', value: stockQty(state), fmt: 'int' },
    { label: 'Hygiène', value: s.hygiene, fmt: 'num0', suffix: '/100' },
    { label: 'Servis hier', value: s.today.served, fmt: 'int' },
  ];
}

export function sceneInfo(state) {
  const t = state.sector.today;
  return { activity: Math.min(1, t.capacity ? t.served / t.capacity : 0), customers: Math.min(8, Math.round(t.served / 12)), queue: t.lostQueue > 0 };
}

export const actions = {
  setPrice(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.price = clamp(v, D.minPrice, D.maxPrice);
    return { ok: true };
  },
  setIngredient(state, a) {
    const lvl = Number(a.value);
    if (![1, 2, 3].includes(lvl)) return { ok: false, message: 'Niveau inconnu.' };
    state.sector.ingredient = lvl;
    return { ok: true };
  },
  setStockDays(state, a) {
    const v = Number(a.value) / 100;
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.stockDays = clamp(v, 0.5, 4);
    return { ok: true };
  },
  setCleaning(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.cleaning = clamp(v, 0, 500_000);
    return { ok: true };
  },
};
