#!/usr/bin/env node
// Trace annuelle d'une partie jouée par un bot (outil d'équilibrage).
// Usage : node tools/trace.js <secteur> <difficulté> <stratégie> <statut> [seed] [années]

import { newGame, advance } from '../src/engine/index.js';
import { monthly, decide } from './bots.js';
import { SECTOR_BOTS } from './botSectors.js';
import { passiveIncome } from '../src/engine/selectors.js';

const [sector = 'agence', difficulty = 'normal', strategy = 'optimale', legal = 'independant', seed = '1', years = '10'] = process.argv.slice(2);
const s = newGame({ sector, difficulty, legal, seed: `sim-${seed}`, companyName: 'Bot', founderName: 'Bot' });
let r = 0.42;
const rnd = () => (r = ((r * 9301 + 49297) % 233280) / 233280);
const e = (c) => String(Math.round(c / 100)).padStart(8);
console.log('an      CA   résultat   trésor.    perso  placem.  empl  part  rép   passif  impôts  cotis.  marketing');
for (let m = 1; m <= Number(years) * 12 && s.status !== 'bankrupt'; m++) {
  advance(s, 30);
  decide(s, strategy, rnd);
  while (s.time.day % 30 !== 0 && s.status !== 'bankrupt') {
    advance(s, 30 - (s.time.day % 30));
    decide(s, strategy, rnd);
  }
  if (s.status === 'won') s.status = 'sandbox';
  monthly(s, strategy, SECTOR_BOTS[sector]);
  if (m % 12 === 0 || s.status === 'bankrupt') {
    const h = s.finance.history.slice(-12);
    const sum = (k) => h.reduce((a, x) => a + (x[k] || 0), 0);
    const cat = (k) => h.reduce((a, x) => a + ((x.byCat || {})[k] || 0), 0);
    const inv = s.investments.etf.value + s.investments.stocks.value + s.investments.savings;
    console.log(
      `${String(m / 12).slice(0, 4).padStart(3)} ${e(sum('revenue'))} ${e(sum('profit'))} ${e(s.cash)} ${e(s.personal.cash)} ${e(inv)} ${String(s.staff.employees.length).padStart(5)} ${s.company.share.toFixed(2)} ${String(Math.round(s.company.reputation)).padStart(4)} ${e(passiveIncome(s).total)} ${e(cat('impot'))} ${e(cat('cotisations'))} ${e(cat('marketing'))}`,
    );
  }
}
console.log(s.status, s.endgame.wonDay != null ? `gagné en ${(s.endgame.wonDay / 360).toFixed(1)} ans` : '', s.endgame.postmortem ? s.endgame.postmortem.causes.map((c) => c.id).join(',') : '');
