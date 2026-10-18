import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, hashSeed } from '../src/engine/rng.js';
import { eur, mul, annuity } from '../src/engine/money.js';
import { dateOf, dayOf, DAYS_PER_YEAR } from '../src/engine/calendar.js';
import { newGame, advance, tick } from '../src/engine/index.js';

test('rng : même seed → même suite', () => {
  const a = createRng(hashSeed('abc'));
  const b = createRng(hashSeed('abc'));
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
  const c = createRng(hashSeed('abd'));
  assert.notEqual(createRng(hashSeed('abc')).next(), c.next());
});

test('rng : bornes et distributions', () => {
  const r = createRng(42);
  for (let i = 0; i < 1000; i++) {
    const x = r.next();
    assert.ok(x >= 0 && x < 1);
    const n = r.int(3, 7);
    assert.ok(n >= 3 && n <= 7 && Number.isInteger(n));
  }
  let s = 0;
  for (let i = 0; i < 5000; i++) s += r.poisson(3);
  assert.ok(Math.abs(s / 5000 - 3) < 0.15);
  assert.equal(r.weighted([{ w: 0 }, { w: 0 }], 'w'), null);
});

test('money : centimes entiers', () => {
  assert.equal(eur(12.345), 1235);
  assert.equal(mul(1001, 0.21), 210);
  assert.ok(Number.isInteger(mul(333, 1 / 3)));
  // mensualité 10 000 € à 6 % sur 12 mois ≈ 860,66 €
  assert.equal(annuity(1_000_000, 0.06, 12), 86066);
  assert.equal(annuity(120_000, 0, 12), 10000);
});

test('calendrier : 12 mois de 30 jours, 1/1/2026 jeudi', () => {
  const d0 = dateOf(0);
  assert.equal(d0.year, 2026);
  assert.equal(d0.month, 0);
  assert.equal(d0.dom, 1);
  assert.equal(d0.weekday, 3);
  const d = dateOf(DAYS_PER_YEAR + 45);
  assert.equal(d.year, 2027);
  assert.equal(d.month, 1);
  assert.equal(d.dom, 16);
  assert.equal(dayOf(1, 1, 16), DAYS_PER_YEAR + 45);
});

test('tick : découper le temps ne change rien', () => {
  const a = newGame({ seed: 's1' });
  const b = newGame({ seed: 's1' });
  advance(a, 40);
  for (let i = 0; i < 400; i++) advance(b, 0.1);
  assert.equal(a.time.day, 40);
  assert.equal(b.time.day, 40);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
});

test('tick : dt négatif ou NaN ignoré', () => {
  const s = newGame({ seed: 'x' });
  tick(s, -5, createRng(1));
  tick(s, NaN, createRng(1));
  assert.equal(s.time.day, 0);
});

test('état sérialisable', () => {
  const s = newGame({ seed: 'ser' });
  advance(s, 10);
  const copy = JSON.parse(JSON.stringify(s));
  assert.deepEqual(copy, s);
});
