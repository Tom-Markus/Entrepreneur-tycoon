import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, applyAction, computeScore, createRng } from '../src/engine/index.js';
import { run } from './helpers.js';
import { tradeFees, propertyQuote, monthEnd as invMonthEnd, yearEnd as invYearEnd } from '../src/engine/systems/investments.js';
import { computePassive, monthEnd as passiveMonthEnd } from '../src/engine/systems/passive.js';
import { checkAchievements } from '../src/engine/systems/achievements.js';
import { INVESTMENTS } from '../src/data/investments.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';

const clone = (s) => JSON.parse(JSON.stringify(s));

test('bourse : TOB plafonnée + courtage, plus-value réalisée', () => {
  // ETF : 0,12 % plafonné à 1 300 € ; courtage 0,1 % (min 1 €)
  assert.equal(tradeFees('etf', 100_000), 120 + 100);
  assert.equal(tradeFees('etf', 200_000_000), 130_000 + 200_000);
  const s = newGame({ seed: 'b' });
  s.personal.cash = 10_000_000;
  assert.ok(applyAction(s, { type: 'buyAsset', kind: 'etf', amount: 5_000_000 }).ok);
  assert.equal(s.investments.etf.value, 5_000_000);
  assert.ok(s.personal.cash < 5_000_000);
  s.investments.etf.value = 6_000_000; // +20 %
  assert.ok(applyAction(s, { type: 'sellAsset', kind: 'etf', amount: 3_000_000 }).ok);
  assert.equal(s.investments.year.gains, 500_000);
  assert.equal(s.investments.etf.basis, 2_500_000);
  assert.equal(applyAction(s, { type: 'buyAsset', kind: 'etf', amount: 1e12 }).ok, false);
});

test('plus-values taxées à 10 % au-delà de 10 000 €', () => {
  const s = newGame({ seed: 'pv' });
  s.personal.cash = 0;
  s.investments.year.gains = 3_000_000;
  invYearEnd(s);
  assert.equal(s.personal.cash, -200_000);
});

test('immobilier : droits d’enregistrement, crédit et loyers', () => {
  const s = newGame({ seed: 'im' });
  const item = INVESTMENTS.realEstate.catalog[0];
  const q = propertyQuote(s, item, 0.2);
  assert.equal(q.fees, Math.round(item.price * 0.145));
  assert.equal(q.loan, Math.round(item.price * 0.8));
  s.personal.cash = q.cash - 1;
  assert.equal(applyAction(s, { type: 'buyProperty', id: item.id, downPct: 0.2 }).ok, false);
  s.personal.cash = q.cash + 10_000_000;
  s.personal.history = [{ revenu: 500_000 }];
  assert.ok(applyAction(s, { type: 'buyProperty', id: item.id, downPct: 0.2 }).ok);
  const p = s.investments.realEstate[0];
  s.time.day += 40;
  const before = p.mortgage.remaining;
  invMonthEnd(s, createRng(1));
  assert.ok(p.mortgage.remaining < before);
});

test('revenu passif : 4 % de la bourse, entreprise seulement sans le fondateur', () => {
  const s = newGame({ seed: 'pa' });
  s.investments.etf.value = 120_000_000;
  const p = computePassive(s);
  assert.ok(Math.abs(p.parts.bourse - Math.round((120_000_000 * 0.04 * 0.95) / 12)) <= 1);
  assert.equal(p.parts.entreprise, 0);
  s.finance.history = Array.from({ length: 6 }, (_, i) => ({ m: i, profit: 1_000_000, revenue: 3_000_000 }));
  s.staff.employees.push({ id: 1, name: 'G', role: 'gerant', skill: 70, trait: 'fiable', salary: 400_000, motivation: 70, hiredDay: 0, hireRank: 1, absentUntil: 0 });
  assert.equal(computePassive(s).parts.entreprise, 0, 'le fondateur travaille encore');
  assert.ok(applyAction(s, { type: 'retire' }).ok);
  assert.ok(computePassive(s).parts.entreprise > 0);
});

test('victoire après 3 mois au-dessus de l’objectif, puis bac à sable', () => {
  const s = newGame({ seed: 'win', difficulty: 'facile' });
  s.investments.etf.value = 1_000_000_000;
  for (let i = 0; i < 3; i++) passiveMonthEnd(s);
  assert.equal(s.status, 'won');
  assert.ok(s.endgame.wonDay != null);
  assert.equal(applyAction(s, { type: 'continueSandbox' }).ok, true);
  assert.equal(s.status, 'sandbox');
  run(s, 30);
  assert.equal(s.status, 'sandbox');
});

test('succès : au moins 30, identifiants uniques, déblocage', () => {
  assert.ok(ACHIEVEMENTS.length >= 30);
  assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
  const s = newGame({ seed: 'ach' });
  run(s, 400);
  assert.ok(s.achievements.unlocked.premiere_vente != null);
  assert.ok(s.achievements.unlocked.annee_1 != null);
  // tous les check() doivent tourner sans erreur sur un état quelconque
  for (const a of ACHIEVEMENTS) assert.equal(typeof a.check(s), 'boolean', a.id);
  checkAchievements(s);
});

test('computeScore est pure et augmente avec le patrimoine', () => {
  const s = newGame({ seed: 'score' });
  run(s, 200);
  const c = clone(s);
  const a = computeScore(s);
  assert.deepEqual(clone(s), c, 'computeScore ne doit rien modifier');
  s.personal.cash += 10_000_000;
  assert.ok(computeScore(s).total > a.total);
  s.status = 'bankrupt';
  assert.ok(computeScore(s).total < a.total + 1000);
});
