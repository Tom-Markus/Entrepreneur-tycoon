// Fuzz : des actions aléatoires (valides ou non) ne doivent jamais casser les invariants.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, applyAction, advance, createRng } from '../src/engine/index.js';
import { SECTOR_DATA } from '../src/engine/sectors/registry.js';
import { INVESTMENTS } from '../src/data/investments.js';

function randomAction(s, r) {
  const sd = SECTOR_DATA[s.meta.sector];
  const ups = sd.upgrades;
  const cand = s.staff.candidates[0];
  const emp = s.staff.employees[0];
  const list = [
    () => ({ type: 'setMarketing', value: r.int(-1000, 300_000) }),
    () => ({ type: 'buyUpgrade', id: r.pick(ups).id }),
    () => (cand ? { type: 'hire', id: cand.id } : { type: 'noop' }),
    () => (emp ? { type: r.pick(['fire', 'train', 'raise']), id: emp.id } : { type: 'noop' }),
    () => ({ type: 'setDraw', value: r.int(0, 900_000) }),
    () => ({ type: 'requestLoan', amount: r.int(0, 5_000_000), months: r.int(6, 100) }),
    () => ({ type: 'apport', value: r.int(-100, 500_000) }),
    () => ({ type: 'buyAsset', kind: r.pick(['etf', 'stocks', 'gold']), amount: r.int(0, 2_000_000) }),
    () => ({ type: 'sellAsset', kind: r.pick(['etf', 'stocks']), amount: r.int(0, 2_000_000) }),
    () => ({ type: 'deposit', amount: r.int(0, 1_000_000) }),
    () => ({ type: 'buyProperty', id: r.pick(INVESTMENTS.realEstate.catalog).id, downPct: r.pick([0, 0.2, 1, 2]) }),
    () => ({ type: 'payDividend', amount: r.int(0, 2_000_000) }),
    () => ({ type: 'setSocialBase', value: r.int(-5, 10_000_000) }),
    () => ({ type: 'retire' }),
    () => ({ type: 'unretire' }),
    () => ({ type: 'sector', name: r.pick(['setRate', 'setPrice', 'setPolicy', 'setIngredient', 'setStockDays', 'setCleaning', 'setProductPrice', 'listProduct', 'orderStock', 'setGroupSize', 'setMargin', 'setCoverDays', 'nope']), value: r.pick([r.int(-10, 50_000), 'abc', 'tout', NaN, 3]), id: r.pick(['gourde', 'casque', 'x']), qty: r.int(-5, 300) }),
  ];
  return r.pick(list)();
}

test('fuzz : 5 secteurs × 2 statuts, actions aléatoires, invariants respectés', () => {
  for (const sector of Object.keys(SECTOR_DATA)) {
    for (const legal of ['independant', 'srl']) {
      const s = newGame({ seed: `fuzz-${sector}-${legal}`, sector, legal, difficulty: 'normal' });
      const r = createRng(1234);
      for (let i = 0; i < 400 && s.status !== 'bankrupt'; i++) {
        applyAction(s, randomAction(s, r));
        while (s.events.pending.length) applyAction(s, { type: 'decide', uid: s.events.pending[0].uid, choice: r.int(0, s.events.pending[0].choices.length - 1) });
        advance(s, r.int(1, 6));
        assert.ok(Number.isInteger(s.cash), `${sector}/${legal} : trésorerie non entière`);
        assert.ok(Number.isInteger(s.personal.cash), `${sector}/${legal} : compte perso non entier`);
        assert.ok(Number.isFinite(s.company.reputation) && s.company.reputation >= 0 && s.company.reputation <= 100);
        for (const e of s.staff.employees) assert.ok(e.motivation >= 0 && e.motivation <= 100 && e.skill >= 1 && e.skill <= 100);
        assert.ok(s.investments.etf.value >= 0 && s.investments.savings >= 0);
      }
      JSON.parse(JSON.stringify(s));
    }
  }
});
