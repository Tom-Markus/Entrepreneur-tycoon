// Concurrents IA : stratégies, ajustements mensuels, promos, faillites, nouveaux entrants.

import { STRATEGIES, COMPETITOR_PARAMS as P } from '../../data/competitors.js';
import { COMPETITOR_NAMES } from '../../data/people.js';
import { DIFFICULTIES } from '../../data/difficulty.js';
import { sectorData } from '../sectors/registry.js';
import { sectorModule } from '../sectors/index.js';
import { attractiveness } from '../demand.js';
import { ECONOMY } from '../../data/economy.js';
import { clamp } from '../money.js';
import { log } from '../log.js';

function aggression(state) {
  return DIFFICULTIES[state.meta.difficulty].competitorAggression;
}

function marketValue(state) {
  const m = sectorModule(state);
  return m.marketValue ? m.marketValue(state) : 3_000_000;
}

function makeCompetitor(state, rng, strategyId, used) {
  const names = COMPETITOR_NAMES[state.meta.sector] || COMPETITOR_NAMES.agence;
  const free = names.filter((n) => !used.includes(n));
  const st = STRATEGIES[strategyId];
  state.compSeq = (state.compSeq || 0) + 1;
  return {
    id: state.compSeq,
    name: rng.pick(free.length ? free : names),
    strategy: strategyId,
    priceIdx: st.priceIdx * rng.range(0.95, 1.05),
    quality: st.quality * rng.range(0.92, 1.08),
    reputation: clamp(st.rep + rng.range(-8, 8), 10, 90),
    mkt: st.mkt * rng.range(0.8, 1.2),
    cash: Math.round(marketValue(state) * 0.3 * P.startCashMonths),
    alive: true,
    attraction: 1,
    share: 0,
    promoUntil: -1,
    born: state.time.day,
  };
}

export function init(state, opts, diff, rng) {
  const [lo, hi] = diff.competitorCount;
  const n = rng.int(lo, hi);
  const ids = Object.keys(STRATEGIES);
  // stratégies distinctes autant que possible
  const order = [...ids].sort(() => rng.next() - 0.5);
  state.competitors = [];
  for (let i = 0; i < n; i++) {
    state.competitors.push(makeCompetitor(state, rng, order[i % order.length], state.competitors.map((c) => c.name)));
  }
  state.compRespawnDay = null;
  updateAttraction(state);
}

/** Prix « relatif » du joueur (1 = prix de référence du marché). */
export function playerPriceIndex(state) {
  const m = sectorModule(state);
  return m.priceIndex ? m.priceIndex(state) : 1;
}

export function updateAttraction(state) {
  const sd = sectorData(state);
  const day = state.time.day;
  for (const c of state.competitors) {
    if (!c.alive) {
      c.attraction = 0;
      continue;
    }
    const promo = c.promoUntil > day ? P.promoDiscount : 1;
    c.attraction = attractiveness({
      price: c.priceIdx * promo,
      refPrice: 1,
      elasticity: sd.elasticity,
      quality: c.quality,
      reputation: c.reputation,
      marketing: c.mkt,
      marketingRef: 1,
    }).value;
  }
  // parts de marché observables (joueur inclus)
  const pa = state.company.attraction || 0;
  const total = pa + state.competitors.reduce((s, c) => s + c.attraction, 0) + ECONOMY.outsideOption;
  for (const c of state.competitors) c.share = total > 0 ? c.attraction / total : 0;
}

export function daily(state) {
  // Fin de promo → recalcul
  const day = state.time.day;
  if (state.competitors.some((c) => c.promoUntil === day)) updateAttraction(state);
}

export function monthEnd(state, rng) {
  const a = aggression(state);
  const pShare = state.company.share || 0;
  const pIdx = playerPriceIndex(state);
  const mv = marketValue(state);
  for (const c of state.competitors) {
    if (!c.alive) continue;
    const st = STRATEGIES[c.strategy];
    // Ajustements selon la stratégie
    if (c.strategy === 'lowcost') {
      const target = pShare > c.share ? st.priceIdx - 0.06 * a : st.priceIdx;
      c.priceIdx += (target - c.priceIdx) * 0.25;
      c.priceIdx = clamp(c.priceIdx, 0.62, 1);
    } else if (c.strategy === 'premium') {
      c.quality = Math.min(1.5, c.quality + 0.004 * a);
      c.priceIdx += (st.priceIdx - c.priceIdx) * 0.2;
    } else if (c.strategy === 'marketing') {
      c.mkt += (st.mkt * a * (pShare > 0.3 ? 1.4 : 1) - c.mkt) * 0.3;
    } else if (c.strategy === 'suiveur') {
      c.priceIdx += (pIdx * 0.97 - c.priceIdx) * 0.3;
      c.quality += ((state.company.quality || 1) * 0.97 - c.quality) * 0.15;
    }
    // Réactions à un joueur dominant : les concurrents investissent pour reprendre des clients
    if (pShare > 0.3) {
      const pressure = (pShare - 0.3) * a;
      c.mkt = Math.min(6, c.mkt * (1 + 0.25 * pressure));
      c.quality = Math.min(1.5, c.quality + 0.04 * pressure);
      c.reputation = Math.min(95, c.reputation + 4 * pressure);
    }
    // Promotions
    if (c.promoUntil < state.time.day && rng.chance(st.promoChance * a)) {
      c.promoUntil = state.time.day + P.promoDays;
      log(state, 'market', `${c.name} lance une promotion agressive (−${Math.round((1 - P.promoDiscount) * 100)} % pendant ${P.promoDays} jours).`);
    }
    // Réputation : suit la qualité
    c.reputation = clamp(c.reputation + (50 + (c.quality - 1) * 60 - c.reputation) * 0.05 + rng.normal(0, 1.2), 5, 95);
    // Résultat financier simulé
    const revenue = c.share * mv * c.priceIdx;
    const margin = st.margin + (c.priceIdx - st.priceIdx) * 0.6;
    const fixed = mv * 0.03 + c.mkt * sectorData(state).marketingRef;
    c.cash += Math.round(revenue * margin - fixed + rng.normal(0, mv * 0.01));
    c.lastRevenue = Math.round(revenue);
    if (c.cash < mv * P.bankruptCashMonths * 0.3) {
      c.alive = false;
      c.deadDay = state.time.day;
      state.stats.competitorsBankrupt = (state.stats.competitorsBankrupt || 0) + 1;
      log(state, 'market', `${c.name} fait faillite ! Ses clients cherchent un nouveau fournisseur.`, true);
      if (state.compRespawnDay == null) state.compRespawnDay = state.time.day + rng.int(P.respawnDays[0], P.respawnDays[1]);
    }
  }
  // Nouvel entrant : un marché dominé et rentable attire de nouveaux acteurs
  const alive = state.competitors.filter((c) => c.alive).length;
  if (pShare > 0.45 && alive < 5 && rng.chance(0.06 * a)) spawnCompetitor(state, rng);
  const min = DIFFICULTIES[state.meta.difficulty].competitorCount[0];
  if (state.compRespawnDay != null && state.time.day >= state.compRespawnDay && alive < min + 1) {
    spawnCompetitor(state, rng);
    state.compRespawnDay = alive + 1 < min ? state.time.day + rng.int(P.respawnDays[0], P.respawnDays[1]) : null;
  }
  // Nettoyage des concurrents morts depuis longtemps
  state.competitors = state.competitors.filter((c) => c.alive || state.time.day - c.deadDay < 360);
  updateAttraction(state);
}

export function spawnCompetitor(state, rng, strategyId) {
  const id = strategyId || rng.pick(Object.keys(STRATEGIES));
  const c = makeCompetitor(state, rng, id, state.competitors.map((x) => x.name));
  state.competitors.push(c);
  log(state, 'market', `Nouveau concurrent : ${c.name} (${STRATEGIES[id].label.toLowerCase()}) s'installe sur ton marché.`, true);
  updateAttraction(state);
  return c;
}
