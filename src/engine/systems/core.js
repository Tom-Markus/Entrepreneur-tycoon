// Monde : conjoncture économique, météo, taux directeur.

import { ECONOMY } from '../../data/economy.js';
import { WEATHER } from '../../data/world.js';
import { dateOf } from '../calendar.js';
import { clamp } from '../money.js';
import { modMult } from '../modifiers.js';
import { log } from '../log.js';

export function init(state, opts, diff, rng) {
  state.world = { economy: 1, economyTrend: 0, weather: 'nuageux', baseRate: ECONOMY.baseRate, priceLevel: 1, inflation: [] };
  state.modifiers = [];
  pickWeather(state, rng);
}

function pickWeather(state, rng) {
  const m = dateOf(state.time.day).month;
  const table = WEATHER.byMonth[m];
  state.world.weather = rng.weighted(Object.keys(table), (k) => table[k]);
}

export function daily(state, rng) {
  pickWeather(state, rng);
  const w = state.world;
  // Marche aléatoire avec rappel vers 1 (+ tendance imposée par les événements).
  const shock = rng.normal(0, ECONOMY.economyVolatility);
  w.economy += (1 - w.economy) * ECONOMY.economyMeanReversion + shock + w.economyTrend;
  w.economy = clamp(w.economy, ECONOMY.economyMin, ECONOMY.economyMax);
  w.economyTrend *= 0.99;
}

/**
 * Inflation annuelle : le niveau général des prix monte (prix de référence du
 * marché, coûts d'achat, loyers) et les salaires sont indexés automatiquement
 * (spécificité belge), sauf « saut d'index ».
 */
export function yearEnd(state, rng) {
  const w = state.world;
  const infl = Math.max(0, ECONOMY.inflation + rng.normal(0, ECONOMY.inflationVol));
  w.priceLevel = Math.round(w.priceLevel * (1 + infl) * 10000) / 10000;
  w.inflation.push(Math.round(infl * 1000) / 1000);
  if (w.inflation.length > 60) w.inflation.shift();
  log(state, 'info', `Inflation ${(infl * 100).toFixed(1).replace('.', ',')} % : les prix du marché, les coûts et les salaires (indexation automatique) augmentent. Pense à revoir tes prix !`, true);
  const year = Math.floor(state.time.day / 360);
  if (state.flags.skipIndexYear === year) return;
  for (const e of state.staff.employees) e.salary = Math.round((e.salary * (1 + infl)) / 100) * 100;
  state.personal.livingCost = Math.round(state.personal.livingCost * (1 + infl));
}

/** Niveau général des prix (1 = 2026). */
export function priceLevel(state) {
  return (state.world && state.world.priceLevel) || 1;
}

/** Conjoncture effective (avec modificateurs). */
export function economyIndex(state) {
  return state.world.economy * modMult(state, 'economy');
}
