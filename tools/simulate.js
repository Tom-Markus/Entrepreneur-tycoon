#!/usr/bin/env node
// Simulation headless : joue des centaines de parties avec des bots et sort
// des statistiques (faillites, victoires, délai, scores) par secteur,
// difficulté et stratégie.
//
// Usage : node tools/simulate.js [--games 40] [--years 20] [--sectors agence,restaurant]
//                                [--difficulties normal,realiste] [--strategies optimale,passive]
//                                [--legal independant|srl|mix] [--json]

import { newGame, advance } from '../src/engine/index.js';
import { computeScore } from '../src/engine/score.js';
import { SECTOR_DATA } from '../src/engine/sectors/registry.js';
import { DIFFICULTY_ORDER } from '../src/data/difficulty.js';
import { STRATEGIES, monthly, decide } from './bots.js';
import { SECTOR_BOTS } from './botSectors.js';

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

const GAMES = Number(arg('games', 30));
const YEARS = Number(arg('years', 20));
const SECTORS = arg('sectors', Object.keys(SECTOR_DATA).join(',')).split(',');
const DIFFS = arg('difficulties', DIFFICULTY_ORDER.join(',')).split(',');
const STRATS = arg('strategies', STRATEGIES.join(',')).split(',');
const LEGAL = arg('legal', 'mix');
const JSON_OUT = process.argv.includes('--json');

/** Petit générateur pour les choix aléatoires des bots (indépendant du moteur). */
function botRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function playGame({ sector, difficulty, strategy, seed, legal, years = YEARS }) {
  const state = newGame({ sector, difficulty, legal, seed: `sim-${seed}`, companyName: 'Bot SA', founderName: 'Bot', metier: null });
  const adapter = SECTOR_BOTS[sector];
  const r = botRng(seed * 7919 + 13);
  const days = years * 360;
  while (state.time.day < days && state.status !== 'bankrupt') {
    advance(state, 30);
    decide(state, strategy, r);
    // l'événement peut avoir bloqué le temps : on finit le mois
    while (state.time.day % 30 !== 0 && state.status !== 'bankrupt') {
      advance(state, 30 - (state.time.day % 30));
      decide(state, strategy, r);
    }
    if (state.status === 'won') state.status = 'sandbox';
    monthly(state, strategy, adapter);
  }
  const won = state.endgame.wonDay != null;
  return {
    bankrupt: state.status === 'bankrupt',
    won,
    wonYears: won ? state.endgame.wonDay / 360 : null,
    bankruptYears: state.status === 'bankrupt' ? state.endgame.bankruptDay / 360 : null,
    score: computeScore(state).total,
    revenue: state.finance.totals.revenue,
    employees: state.staff.employees.length,
    causes: state.endgame.postmortem ? state.endgame.postmortem.causes.map((c) => c.id) : [],
  };
}

function median(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

function pct(x) {
  return `${(x * 100).toFixed(0)} %`.padStart(5);
}

export function runAll() {
  const rows = [];
  const t0 = Date.now();
  for (const sector of SECTORS) {
    for (const difficulty of DIFFS) {
      for (const strategy of STRATS) {
        const res = [];
        for (let g = 0; g < GAMES; g++) {
          const legal = LEGAL === 'mix' ? (g % 2 ? 'srl' : 'independant') : LEGAL;
          res.push(playGame({ sector, difficulty, strategy, seed: g + 1, legal }));
        }
        const won = res.filter((x) => x.won);
        const bk = res.filter((x) => x.bankrupt);
        const causes = {};
        for (const r of bk) for (const c of r.causes.slice(0, 1)) causes[c] = (causes[c] || 0) + 1;
        rows.push({
          sector,
          difficulty,
          strategy,
          games: res.length,
          winRate: won.length / res.length,
          bankruptRate: bk.length / res.length,
          medianWinYears: median(won.map((x) => x.wonYears)),
          medianBankruptYears: median(bk.map((x) => x.bankruptYears)),
          medianScore: median(res.map((x) => x.score)),
          p90Score: [...res.map((x) => x.score)].sort((a, b) => a - b)[Math.floor(res.length * 0.9)] || 0,
          topCause: Object.entries(causes).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
        });
      }
    }
  }
  return { rows, seconds: (Date.now() - t0) / 1000 };
}

const isMain = process.argv[1] && process.argv[1].endsWith('simulate.js');
if (isMain) {
  const { rows, seconds } = runAll();
  if (JSON_OUT) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    console.log(`Simulation : ${GAMES} parties × ${YEARS} ans max par combinaison (${seconds.toFixed(1)} s)\n`);
    console.log('secteur      difficulté  stratégie   victoires faillites  an.victoire an.faillite  score méd.  score p90  cause n°1');
    for (const r of rows) {
      console.log(
        `${r.sector.padEnd(12)} ${r.difficulty.padEnd(11)} ${r.strategy.padEnd(11)} ${pct(r.winRate)}     ${pct(r.bankruptRate)}     ${(r.medianWinYears?.toFixed(1) ?? '-').padStart(6)}      ${(r.medianBankruptYears?.toFixed(1) ?? '-').padStart(6)}   ${String(r.medianScore).padStart(9)}  ${String(r.p90Score).padStart(9)}  ${r.topCause}`,
      );
    }
  }
}
