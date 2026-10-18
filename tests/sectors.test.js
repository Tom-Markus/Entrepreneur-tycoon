import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, applyAction, createRng } from '../src/engine/index.js';
import { run } from './helpers.js';
import { SECTOR_DATA } from '../src/engine/sectors/registry.js';
import * as restaurant from '../src/engine/sectors/restaurant.js';
import * as ecommerce from '../src/engine/sectors/ecommerce.js';
import * as artisan from '../src/engine/sectors/artisan.js';
import * as soutien from '../src/engine/sectors/soutien.js';
import { dateOf } from '../src/engine/calendar.js';

const hire = (s, role, skill = 60) => {
  s.staff.candidates.push({ id: 9000 + s.staff.employees.length, name: 'T', role, skill, trait: 'fiable', salary: 250_000, expires: 99999 });
  return applyAction(s, { type: 'hire', id: 9000 + s.staff.employees.length });
};

test('chaque secteur tourne 2 ans sans valeur invalide', () => {
  for (const sector of Object.keys(SECTOR_DATA)) {
    for (const metier of sector === 'artisan' ? ['plombier', 'electricien'] : [null]) {
      const s = newGame({ seed: `s2-${sector}`, sector, metier, difficulty: 'facile' });
      s.personal.cash = 5_000_000;
      run(s, 720);
      assert.ok(Number.isInteger(s.cash), `${sector} : trésorerie non entière`);
      assert.ok(Number.isFinite(s.company.reputation) && Number.isFinite(s.company.quality), sector);
      assert.ok(s.finance.totals.revenue > 0, `${sector} : aucun chiffre d'affaires`);
      for (const h of s.finance.history) assert.ok(Number.isFinite(h.profit), sector);
    }
  }
});

test('friterie : fermée le lundi, stock périssable, prix élevé = moins de clients', () => {
  const s = newGame({ seed: 'fr1', sector: 'restaurant' });
  let mondaySales = 0;
  for (let i = 0; i < 30; i++) {
    run(s, 1);
    const d = dateOf(s.time.day - 1);
    if (d.weekday === 0) mondaySales += s.sector.today.served;
  }
  assert.equal(mondaySales, 0);
  // gaspillage : on commande beaucoup trop
  applyAction(s, { type: 'sector', name: 'setStockDays', value: 400 });
  run(s, 30);
  assert.ok(s.sector.stats.wasted > 0, 'des portions doivent périmer');
  const a = newGame({ seed: 'fr2', sector: 'restaurant' });
  const b = newGame({ seed: 'fr2', sector: 'restaurant' });
  applyAction(b, { type: 'sector', name: 'setPrice', value: 2_500 });
  assert.ok(restaurant.expectedClients(b).lambda < restaurant.expectedClients(a).lambda);
});

test('friterie : contrôle AFSCA avec hygiène désastreuse → fermeture', () => {
  const s = newGame({ seed: 'afsca', sector: 'restaurant' });
  s.sector.hygiene = 10;
  restaurant.eventOp(s, { op: 'afsca' });
  assert.ok(s.sector.closedUntil > s.time.day);
  run(s, 2);
  assert.equal(s.sector.today.served, 0);
});

test('e-commerce : ventes, réassort avec délai, retours remboursés', () => {
  const s = newGame({ seed: 'ec', sector: 'ecommerce' });
  applyAction(s, { type: 'setMarketing', value: 150_000 });
  run(s, 60);
  assert.ok(s.sector.stats.orders > 0);
  assert.ok(s.sector.stats.returns >= 0);
  assert.ok(s.sector.pos.every((p) => p.arrive >= s.time.day));
  // commande manuelle : payée tout de suite, arrive après le délai
  const cash = s.cash;
  assert.ok(applyAction(s, { type: 'sector', name: 'orderStock', id: 'jeu', qty: 10 }).ok);
  assert.ok(s.cash < cash);
  const po = s.sector.pos.find((p) => p.id === 'jeu');
  assert.ok(po.arrive > s.time.day + 5);
  // catalogue limité
  for (const p of ['yoga', 'chocolat', 'bijou']) applyAction(s, { type: 'sector', name: 'listProduct', id: p });
  assert.ok(s.sector.listed.length <= ecommerce.slots(s));
});

test('artisan : prix élevé → moins de devis acceptés ; camionnettes limitent les équipes', () => {
  const s = newGame({ seed: 'art', sector: 'artisan', metier: 'electricien' });
  run(s, 200);
  assert.ok(s.sector.stats.jobsDone > 0);
  const base = artisan.workforce(s);
  hire(s, 'ouvrier', 60);
  const two = artisan.workforce(s);
  hire(s, 'ouvrier', 60);
  const three = artisan.workforce(s);
  assert.ok(two - base > three - two, 'le 3e ouvrier sans camionnette est moins efficace');
  const cheap = newGame({ seed: 'art2', sector: 'artisan' });
  const pricey = newGame({ seed: 'art2', sector: 'artisan' });
  applyAction(pricey, { type: 'sector', name: 'setRate', value: 12_000 });
  run(cheap, 300);
  run(pricey, 300);
  const rate = (x) => x.sector.stats.won / Math.max(1, x.sector.stats.won + x.sector.stats.lost);
  assert.ok(rate(pricey) < rate(cheap));
});

test('soutien : petits groupes = meilleure réussite mais moins de places ; départs fin juin', () => {
  const s = newGame({ seed: 'sc', sector: 'soutien' });
  applyAction(s, { type: 'sector', name: 'setGroupSize', value: 4 });
  const small = { succ: soutien.expectedSuccess(s), cap: soutien.capacity(s).teach };
  applyAction(s, { type: 'sector', name: 'setGroupSize', value: 10 });
  const big = { succ: soutien.expectedSuccess(s), cap: soutien.capacity(s).teach };
  assert.ok(small.succ > big.succ && small.cap < big.cap);
  applyAction(s, { type: 'sector', name: 'setGroupSize', value: 6 });
  run(s, 5 * 30 + 29); // jusqu'au 30 juin
  const before = s.sector.students;
  run(s, 1);
  assert.ok(s.sector.lastSuccess != null, 'session de juin');
  assert.ok(s.sector.students < before * 0.7, 'départ massif en fin d’année');
});
