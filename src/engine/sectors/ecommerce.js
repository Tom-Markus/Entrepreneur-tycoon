// Secteur e-commerce : trafic (organique + payant), conversion, catalogue,
// stock acheté à l'avance avec délai fournisseur, préparation des commandes,
// logistique, retours, pics saisonniers (Black Friday, fêtes).

import { ECOMMERCE as D } from '../../data/sectors/ecommerce.js';
import { dateOf } from '../calendar.js';
import { earn, spend, refund } from '../ledger.js';
import { upgradeEffect } from '../upgrades.js';
import { modMult } from '../modifiers.js';
import { productivity, countRole } from '../systems/staff.js';
import { rateCustomer } from '../systems/company.js';
import { priceFactor, reputationFactor } from '../demand.js';
import { htFromTtc, diffOf, playerMarket, baseWhy, prodMod } from './common.js';
import { priceLevel } from '../systems/core.js';
import { log } from '../log.js';
import { clamp } from '../money.js';

export const mainRole = 'logisticien';
const P = Object.fromEntries(D.products.map((p) => [p.id, p]));

export function init(state) {
  const prices = {};
  const stock = {};
  for (const p of D.products) {
    prices[p.id] = p.ref;
    stock[p.id] = 0;
  }
  stock.gourde = 60;
  stock.lampe = 40;
  state.sector = {
    listed: ['gourde', 'lampe'],
    prices,
    stock,
    pos: [], // commandes fournisseur en cours : { id, qty, arrive }
    reorder: true,
    coverDays: 30,
    sales: {}, // ventes quotidiennes récentes par produit (14 jours)
    backlog: 0,
    returnsQ: [],
    today: { visitors: 0, paid: 0, organic: 0, orders: 0, lostStock: 0, shipped: 0, conversion: 0 },
    stats: { orders: 0, returns: 0, lostStock: 0, bestDay: 0, revenueOrders: 0 },
  };
}

export function slots(state) {
  return D.startSlots + upgradeEffect(state, 'slots');
}

/** Prix relatif moyen du catalogue (1 = prix de référence). */
export function priceIndex(state) {
  const s = state.sector;
  if (!s.listed.length) return 1;
  let t = 0;
  for (const id of s.listed) t += s.prices[id] / (P[id].ref * priceLevel(state));
  return t / s.listed.length / (1 + upgradeEffect(state, 'priceTolerance'));
}

export function refPrice() {
  return 1;
}

export function marketValue(state) {
  return D.organicVisitors * diffOf(state).marketMult * 30 * D.baseConversion * 3_400 * 2;
}

export function stockValue(state) {
  let v = 0;
  const lvl = priceLevel(state);
  for (const p of D.products) v += Math.round((state.sector.stock[p.id] || 0) * p.cost * lvl);
  for (const po of state.sector.pos) v += Math.round(po.qty * P[po.id].cost * lvl);
  return v;
}

export function quality(state) {
  let q = 0.92 + upgradeEffect(state, 'conv') * 0.6;
  for (const e of state.staff.employees) if (e.role === 'service_client') q += 0.04 * productivity(state, e);
  return clamp(q * modMult(state, 'quality'), 0.3, 2);
}

/** Coût par clic effectif (centimes). */
export function cpc(state) {
  const d = dateOf(state.time.day);
  const mk = Math.min(2, countRole(state, 'marketeur'));
  const comp = state.competitors.filter((c) => c.alive);
  const pressure = comp.length ? 0.8 + (0.2 * comp.reduce((s, c) => s + c.mkt, 0)) / comp.length : 1;
  return D.cpc * D.cpcSeason[d.month] * (1 - D.roles.marketeur.cpcCut * mk) * modMult(state, 'cpc') * pressure;
}

function blackFriday(day) {
  const d = dateOf(day);
  const b = D.blackFriday;
  return d.month === b.month && d.dom >= b.from && d.dom <= b.to ? b.mult : 1;
}

export function orderCapacity(state) {
  let c = state.staff.founder.active ? D.founderOrders : 0;
  for (const e of state.staff.employees) if (e.role === 'logisticien') c += D.roles.logisticien.orders * productivity(state, e);
  return (c * upgradeEffect(state, 'ordersMult') + upgradeEffect(state, 'ordersAdd')) * modMult(state, 'capacity') * prodMod(state);
}

/** Trafic et conversion attendus aujourd'hui. */
export function funnel(state) {
  const d = dateOf(state.time.day);
  const m = playerMarket(state, D, priceIndex(state), 1, 1);
  const season = D.seasonality[d.month] * blackFriday(state.time.day);
  const repeat = 1 + upgradeEffect(state, 'repeat');
  const organic = D.organicVisitors * diffOf(state).marketMult * m.share * upgradeEffect(state, 'organicMult') * m.eco * repeat;
  // Plus on achète de clics, plus ils coûtent cher (rendements décroissants)
  const raw = state.company.marketing > 0 ? state.company.marketing / 30 / cpc(state) : 0;
  const paid = raw / (1 + raw / D.cpcSaturation);
  const mpShare = upgradeEffect(state, 'marketplace') > 0 ? 0.6 : 0;
  const visitors = (organic + paid) * (1 + mpShare);
  // visiteurs « équivalents organiques » (les visiteurs payés convertissent moins bien)
  const effective = (organic + paid * D.paidConversion) * (1 + mpShare);
  const mk = Math.min(2, countRole(state, 'marketeur'));
  const convBoost = 1 + upgradeEffect(state, 'conv') + D.roles.marketeur.conv * mk;
  const pf = priceFactor(priceIndex(state) * modMult(state, 'priceCut'), 1, D.elasticity);
  const conversion = D.baseConversion * pf * convBoost * reputationFactor(state.company.reputation) * season * m.ev;
  return { m, organic, paid, visitors, effective, conversion, season, pf, convBoost, mpShare };
}

function productWeights(state) {
  const d = dateOf(state.time.day);
  const s = state.sector;
  return s.listed.map((id) => {
    const p = P[id];
    const seas = p.season && p.season[d.month] ? p.season[d.month] : 1;
    return { id, w: p.weight * seas * priceFactor(s.prices[id], p.ref * priceLevel(state), D.elasticity) };
  });
}

function avgDailySales(state, id) {
  const arr = state.sector.sales[id] || [];
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function placeOrder(state, id, qty) {
  const p = P[id];
  const q = Math.max(0, Math.round(qty));
  if (!q) return 0;
  const lead = Math.round(D.leadTime * modMult(state, 'delivery'));
  state.sector.pos.push({ id, qty: q, arrive: state.time.day + lead });
  spend(state, Math.round(q * p.cost * priceLevel(state) * modMult(state, 'unitCost')), p.vat, 'stock');
  return q;
}

function autoReorder(state) {
  const s = state.sector;
  const d = dateOf(state.time.day);
  for (const id of s.listed) {
    const p = P[id];
    let avg = avgDailySales(state, id);
    if (!(s.sales[id] || []).length) avg = 2;
    if (upgradeEffect(state, 'smartReorder') > 0) {
      const next = (d.month + 1) % 12;
      const seas = (p.season && p.season[next]) || 1;
      avg = Math.max(avg, avg * seas * (D.seasonality[next] / D.seasonality[d.month]));
    }
    const inbound = s.pos.filter((x) => x.id === id).reduce((t, x) => t + x.qty, 0);
    const position = (s.stock[id] || 0) + inbound;
    const rop = avg * (D.leadTime + 5);
    if (position < rop) placeOrder(state, id, Math.max(15, avg * s.coverDays));
  }
}

export function daily(state, rng) {
  const s = state.sector;
  const day = state.time.day;
  state.company.quality = quality(state);
  // Réceptions fournisseur
  const arrived = s.pos.filter((x) => x.arrive <= day);
  if (arrived.length) {
    for (const po of arrived) s.stock[po.id] = (s.stock[po.id] || 0) + po.qty;
    s.pos = s.pos.filter((x) => x.arrive > day);
  }
  const f = funnel(state);
  const orders = rng.poisson(f.effective * f.conversion);
  const weights = productWeights(state);
  let sold = 0;
  let lostStock = 0;
  const soldBy = {};
  const vatBy = {};
  for (let i = 0; i < orders; i++) {
    let pick = rng.weighted(weights, 'w');
    if (!pick) break;
    if ((s.stock[pick.id] || 0) <= 0) {
      const alt = weights.filter((w) => (s.stock[w.id] || 0) > 0);
      if (!alt.length || rng.chance(0.6)) {
        lostStock++;
        continue;
      }
      pick = rng.weighted(alt, 'w');
    }
    s.stock[pick.id] -= 1;
    soldBy[pick.id] = (soldBy[pick.id] || 0) + 1;
    sold++;
    const p = P[pick.id];
    // Une commande contient en moyenne plusieurs articles (le stock n'en suit qu'un, simplification)
    const ttc = Math.round(s.prices[pick.id] * modMult(state, 'priceCut') * D.itemsPerOrder);
    vatBy[p.vat] = (vatBy[p.vat] || 0) + ttc;
  }
  // Encaissement (paiement à la commande)
  let htTotal = 0;
  let ttcTotal = 0;
  for (const [rate, ttc] of Object.entries(vatBy)) {
    const ht = htFromTtc(state, ttc, Number(rate));
    htTotal += ht;
    ttcTotal += ttc;
    earn(state, ht, Number(rate), 'ventes');
  }
  // Frais de paiement (services financiers : pas de TVA)
  if (sold) spend(state, Math.round(ttcTotal * D.paymentPct + sold * D.paymentFixed), 0, 'frais_bancaires');
  if (f.mpShare > 0 && htTotal > 0) spend(state, Math.round(htTotal * (f.mpShare / (1 + f.mpShare)) * 0.15), 0.21, 'marketing');
  for (const id of s.listed) {
    const arr = (s.sales[id] = s.sales[id] || []);
    arr.push(soldBy[id] || 0);
    if (arr.length > 14) arr.shift();
  }
  // Préparation et expédition
  s.backlog += sold;
  const cap = orderCapacity(state);
  const shipped = Math.min(s.backlog, Math.floor(cap));
  s.backlog -= shipped;
  if (shipped > 0) {
    const avgShip = s.listed.reduce((t, id) => t + P[id].ship, 0) / Math.max(1, s.listed.length);
    const shipCut = Math.min(0.4, upgradeEffect(state, 'shipCut'));
    spend(state, Math.round(shipped * (avgShip + D.packing) * (1 - shipCut)), 0.21, 'logistique');
  }
  // Retours (programmés)
  const svc = state.staff.employees.filter((e) => e.role === 'service_client').reduce((t, e) => t + productivity(state, e), 0);
  const retMult = upgradeEffect(state, 'returnsMult') * modMult(state, 'returns') * Math.max(0.4, 1 - D.roles.service_client.returnsCut * svc);
  for (const [id, n] of Object.entries(soldBy)) {
    const p = P[id];
    for (let i = 0; i < n; i++) {
      if (rng.chance(p.returns * retMult)) s.returnsQ.push({ day: day + D.returnDelay, id, ttc: Math.round(s.prices[id] * D.itemsPerOrder), vat: p.vat });
    }
  }
  const dueReturns = s.returnsQ.filter((r) => r.day <= day);
  if (dueReturns.length) {
    s.returnsQ = s.returnsQ.filter((r) => r.day > day);
    for (const r of dueReturns) {
      refund(state, htFromTtc(state, r.ttc, r.vat), r.vat, 'ventes');
      if (rng.chance(D.returnResellable)) s.stock[r.id] = (s.stock[r.id] || 0) + 1;
      s.stats.returns++;
    }
  }
  // Stockage
  const sv = stockValue(state);
  if (sv > 0) spend(state, Math.round((sv * D.storageMonthlyPct * (1 - Math.min(0.6, upgradeEffect(state, 'storageCut')))) / 30), 0.21, 'logistique');
  if (s.reorder) autoReorder(state);

  // Satisfaction
  if (orders > 0) {
    const delay = s.backlog / Math.max(1, cap);
    const score = 58 + 35 * (f.pf - 1) + 6 * svc - 25 * Math.min(2, delay) - 25 * (lostStock / orders) + 30 * (state.company.quality - 0.92);
    rateCustomer(state, clamp(score, 0, 100), 0.02);
  }
  s.today = { visitors: Math.round(f.visitors), paid: Math.round(f.paid), organic: Math.round(f.organic), orders, sold, lostStock, shipped, conversion: f.conversion };
  s.stats.orders += sold;
  s.stats.lostStock += lostStock;
  s.stats.bestDay = Math.max(s.stats.bestDay, sold);
  state.stats.unitsSold = (state.stats.unitsSold || 0) + sold;
  state.company.capacityUse = cap > 0 ? Math.min(1, (shipped + s.backlog) / cap) : 1;
  state.staff.lastWorkload = cap > 0 ? (sold + s.backlog) / cap : 0;
  state.company.demandPerDay = f.visitors * f.conversion;
  state.company.why = [
    ...baseWhy(f.m, 'Prix moyen de ton catalogue face au marché (les clients comparent beaucoup en ligne).'),
    { label: 'Saison / Black Friday', value: f.season, hint: 'Novembre-décembre explosent, février est mou.' },
    { label: 'Conversion (photos, avis…)', value: f.convBoost, hint: 'Améliorations et marketeurs.' },
    { label: 'Trafic payant', value: 1 + f.paid / Math.max(1, f.organic + f.paid), hint: 'Part des visiteurs achetés en publicité.' },
  ];
  state.company.bottleneck = lostStock > orders * 0.1 ? 'stock' : s.backlog > cap ? 'personnel' : f.visitors < 80 ? 'demande' : null;
}

export function monthEnd(state) {
  const s = state.sector;
  for (const id of s.listed) {
    if ((s.stock[id] || 0) === 0 && !s.pos.some((x) => x.id === id)) log(state, 'bad', `Rupture de stock : ${P[id].label}. Pense à commander !`);
  }
}

export function eventOp(state, e) {
  const s = state.sector;
  if (e.op === 'delayOrders') for (const po of s.pos) po.arrive += e.days;
  if (e.op === 'stockLoss') for (const id of Object.keys(s.stock)) s.stock[id] = Math.floor(s.stock[id] * (1 - e.pct));
}

export function kpis(state) {
  const t = state.sector.today;
  const paidOrders = t.visitors > 0 ? (t.orders * t.paid) / t.visitors : 0;
  const cac = paidOrders > 0 ? state.company.marketing / 30 / paidOrders : 0;
  return [
    { label: 'Visiteurs/jour', value: t.visitors, fmt: 'int' },
    { label: 'Conversion', value: t.conversion, fmt: 'pct' },
    { label: 'Commandes hier', value: t.orders, fmt: 'int' },
    { label: 'Coût d’acquisition', value: cac, fmt: 'eur2' },
    { label: 'Valeur du stock', value: stockValue(state), fmt: 'eur' },
    { label: 'À expédier', value: state.sector.backlog, fmt: 'int' },
  ];
}

export function sceneInfo(state) {
  const t = state.sector.today;
  return { activity: Math.min(1, t.shipped / 30), customers: Math.min(6, Math.round(t.shipped / 8)), parcels: Math.min(10, t.shipped) };
}

export const actions = {
  setProductPrice(state, a) {
    const p = P[a.id];
    const v = Math.round(Number(a.value));
    if (!p || !Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.prices[a.id] = clamp(v, Math.round(p.cost * 0.8), Math.round(p.ref * 3 * priceLevel(state)));
    return { ok: true };
  },
  listProduct(state, a) {
    const s = state.sector;
    if (!P[a.id]) return { ok: false, message: 'Produit inconnu.' };
    if (s.listed.includes(a.id)) return { ok: false, message: 'Déjà au catalogue.' };
    if (s.listed.length >= slots(state)) return { ok: false, message: 'Catalogue plein : améliore ta boutique pour référencer plus de produits.' };
    s.listed.push(a.id);
    return { ok: true };
  },
  unlistProduct(state, a) {
    const s = state.sector;
    if (!s.listed.includes(a.id)) return { ok: false, message: 'Pas au catalogue.' };
    s.listed = s.listed.filter((x) => x !== a.id);
    return { ok: true };
  },
  orderStock(state, a) {
    if (!P[a.id]) return { ok: false, message: 'Produit inconnu.' };
    const q = Math.round(Number(a.qty));
    if (!(q > 0 && q <= 5000)) return { ok: false, message: 'Quantité invalide.' };
    const cost = Math.round(q * P[a.id].cost * 1.21);
    if (state.cash - cost < -state.finance.overdraftLimit) return { ok: false, message: 'Trésorerie insuffisante pour cette commande.' };
    placeOrder(state, a.id, q);
    return { ok: true };
  },
  setReorder(state, a) {
    state.sector.reorder = a.value === true || a.value === 'true' || a.value === 'on';
    return { ok: true };
  },
  setCoverDays(state, a) {
    const v = Number(a.value);
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.coverDays = clamp(Math.round(v), 7, 90);
    return { ok: true };
  },
};
