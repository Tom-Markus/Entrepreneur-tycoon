import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, advance, applyAction } from '../src/engine/index.js';
import { run } from './helpers.js';
import { earn, spend, invoice, processReceivables, amortizationForYear } from '../src/engine/ledger.js';
import { hoursPerDay, backlogHours } from '../src/engine/sectors/agence.js';
import { attractiveness, priceFactor, marketingFactor } from '../src/engine/demand.js';
import { createRng } from '../src/engine/rng.js';

const clone = (s) => JSON.parse(JSON.stringify(s));

test('ledger : TVA collectée et déductible, montants entiers', () => {
  const s = newGame({ seed: 'led' });
  const vat0 = { ...s.finance.vat };
  const cash0 = s.cash;
  earn(s, 10_000, 0.21, 'ventes');
  assert.equal(s.cash, cash0 + 12_100);
  assert.equal(s.finance.vat.collected - vat0.collected, 2_100);
  spend(s, 5_000, 0.21, 'materiel');
  assert.equal(s.finance.vat.deductible - vat0.deductible, 1_050);
  assert.ok(Number.isInteger(s.cash));
});

test('ledger : franchise TVA → pas de TVA collectée, TVA d’achat = charge', () => {
  const s = newGame({ seed: 'fr', vatFranchise: true });
  const v = { ...s.finance.vat };
  const exp = s.finance.month.expenses;
  earn(s, 10_000, 0.21, 'ventes');
  spend(s, 1_000, 0.21, 'materiel');
  assert.equal(s.finance.vat.collected, v.collected);
  assert.equal(s.finance.vat.deductible, v.deductible);
  assert.equal(s.finance.month.expenses - exp, 1_210);
});

test('créances : TVA due à la facture, encaissement à l’échéance, impayé récupère la TVA', () => {
  const s = newGame({ seed: 'inv' });
  const rng = createRng(1);
  const c0 = s.cash;
  const v0 = s.finance.vat.collected;
  invoice(s, 100_000, 0.21, 'projets', { dueIn: 10 });
  assert.equal(s.finance.vat.collected - v0, 21_000);
  assert.equal(s.cash, c0);
  s.time.day += 10;
  processReceivables(s);
  assert.equal(s.cash, c0 + 121_000);
  const r = invoice(s, 50_000, 0.21, 'projets', { dueIn: 0, defaultProb: 1, rng });
  assert.ok(r.willDefault);
  const v1 = s.finance.vat.collected;
  processReceivables(s);
  assert.equal(v1 - s.finance.vat.collected, 10_500);
});

test('amortissement linéaire sur 3 ans', () => {
  const s = newGame({ seed: 'am' });
  s.finance.assets = [];
  spend(s, 300_000, 0.21, 'investissement', { capex: true, label: 'x' });
  assert.equal(amortizationForYear(s, 0), 100_000);
  assert.equal(amortizationForYear(s, 2), 100_000);
  assert.equal(amortizationForYear(s, 3), 0);
});

test('demande : prix plus élevé → moins attractif ; marketing à rendements décroissants', () => {
  assert.ok(priceFactor(8000, 6500, 1.25) < 1);
  assert.ok(priceFactor(5000, 6500, 1.25) > 1);
  const m1 = marketingFactor(50_000, 50_000) - 1;
  const m2 = marketingFactor(100_000, 50_000) - marketingFactor(50_000, 50_000);
  assert.ok(m2 < m1);
  const a = attractiveness({ price: 100, refPrice: 100, elasticity: 1.5, quality: 1, reputation: 50, marketing: 0, marketingRef: 1 });
  assert.ok(Math.abs(a.value - 1) < 1e-9);
});

test('agence : des projets sont signés, livrés et facturés', () => {
  const s = newGame({ seed: 'agence-1' });
  run(s, 180);
  assert.ok(s.sector.stats.leadsWon > 0, 'aucun projet signé');
  assert.ok(s.sector.stats.projectsDone > 0, 'aucun projet livré');
  assert.ok(s.finance.totals.revenue > 0);
  assert.ok(s.finance.history.length === 6);
});

test('agence : un taux exorbitant fait fuir les clients', () => {
  const a = newGame({ seed: 'rate' });
  const b = newGame({ seed: 'rate' });
  applyAction(b, { type: 'sector', name: 'setRate', value: 20_000 });
  run(a, 120);
  run(b, 120);
  assert.ok(b.sector.stats.leadsWon < a.sector.stats.leadsWon);
});

test('recruter un développeur augmente la capacité', () => {
  const s = newGame({ seed: 'hire' });
  const before = hoursPerDay(s);
  s.staff.candidates.push({ id: 999, name: 'Test', role: 'developpeur', skill: 60, trait: 'fiable', salary: 330_000, expires: 9999 });
  const r = applyAction(s, { type: 'hire', id: 999 });
  assert.ok(r.ok, r.message);
  assert.ok(hoursPerDay(s) > before);
  assert.ok(backlogHours(s) >= 0);
});

test('licenciement : indemnité de préavis payée', () => {
  const s = newGame({ seed: 'fire' });
  s.staff.candidates.push({ id: 999, name: 'Test', role: 'developpeur', skill: 60, trait: 'fiable', salary: 330_000, expires: 9999 });
  applyAction(s, { type: 'hire', id: 999 });
  run(s, 400);
  const cash = s.cash;
  const r = applyAction(s, { type: 'fire', id: 999 });
  assert.ok(r.ok);
  assert.ok(s.cash < cash);
});

test('faillite si la trésorerie reste sous le découvert au-delà du délai de grâce', () => {
  const s = newGame({ seed: 'bk', difficulty: 'difficile', legal: 'srl' });
  s.cash = -10_000_000;
  run(s, 40);
  assert.equal(s.status, 'bankrupt');
  assert.ok(s.endgame.postmortem.causes.length > 0);
  const day = s.time.day;
  advance(s, 10);
  assert.equal(s.time.day, day, 'le temps ne doit plus avancer après la faillite');
});

test('indépendant : l’épargne perso renfloue l’entreprise (responsabilité illimitée)', () => {
  const s = newGame({ seed: 'ind', legal: 'independant' });
  s.personal.cash = 5_000_000;
  s.cash = -1_000_000;
  advance(s, 1);
  assert.ok(s.cash >= -s.finance.overdraftLimit);
  assert.ok(s.personal.cash < 5_000_000);
});

test('déterminisme : même seed + mêmes actions = même état', () => {
  const play = () => {
    const s = newGame({ seed: 'det', difficulty: 'realiste' });
    run(s, 45);
    applyAction(s, { type: 'sector', name: 'setRate', value: 7_500 });
    applyAction(s, { type: 'setMarketing', value: 30_000 });
    run(s, 400);
    return clone(s);
  };
  assert.deepEqual(play(), play());
});

test('rejeu : seed + journal d’actions reproduit la partie', () => {
  const s = newGame({ seed: 'replay' });
  advance(s, 20);
  applyAction(s, { type: 'setMarketing', value: 40_000 });
  advance(s, 33);
  applyAction(s, { type: 'sector', name: 'setRate', value: 7_000 });
  advance(s, 100);
  // rejeu
  const r = newGame({ seed: 'replay' });
  const actions = [...s.actionLog];
  while (r.time.day < s.time.day) {
    for (const x of actions.filter((x) => x.d === r.time.day)) applyAction(r, x.a);
    advance(r, 1);
  }
  assert.equal(r.cash, s.cash);
  assert.equal(r.rngState, s.rngState);
});

test('action invalide refusée sans effet', () => {
  const s = newGame({ seed: 'bad' });
  const c = clone(s);
  assert.equal(applyAction(s, { type: 'nope' }).ok, false);
  assert.equal(applyAction(s, { type: 'setMarketing', value: 'abc' }).ok, false);
  assert.equal(applyAction(s, null).ok, false);
  assert.deepEqual(clone(s), c);
});
