// Monde : conjoncture économique, météo, taux directeur.

import { ECONOMY } from '../../data/economy.js';
import { WEATHER } from '../../data/world.js';
import { dateOf } from '../calendar.js';
import { clamp } from '../money.js';
import { modMult } from '../modifiers.js';

export function init(state, opts, diff, rng) {
  state.world = { economy: 1, economyTrend: 0, weather: 'nuageux', baseRate: ECONOMY.baseRate };
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

/** Conjoncture effective (avec modificateurs). */
export function economyIndex(state) {
  return state.world.economy * modMult(state, 'economy');
}
