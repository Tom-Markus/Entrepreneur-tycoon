import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, advance, applyAction } from '../src/engine/index.js';
import { run } from './helpers.js';
import { ippTax, socialQuarterly, isocTax, reducedRateEligible, dividendRate, socialBaseFromProfit, socialAnnualDue } from '../src/engine/taxmath.js';
import { FISCALITE } from '../src/data/fiscalite.js';
import { earn } from '../src/engine/ledger.js';
import { dayOf } from '../src/engine/calendar.js';
import { loanOffer } from '../src/engine/systems/loans.js';

test('IPP : barème progressif, quotité exemptée, additionnels', () => {
  assert.equal(ippTax(0).total, 0);
  assert.equal(ippTax(1_000_000).total, 0); // sous la quotité exemptée
  // 30 000 € : 4 080 + 4 992 + 540 − 2 727,50 = 6 884,50 × 1,07 = 7 366,42
  assert.equal(ippTax(3_000_000).total, 736_642);
  assert.equal(ippTax(10_000_000).marginal, 0.5);
  // monotone
  let prev = -1;
  for (let x = 0; x < 20_000_000; x += 500_000) {
    const t = ippTax(x).total;
    assert.ok(t >= prev);
    prev = t;
  }
});

test('cotisations sociales : minimum trimestriel et plafonds', () => {
  const min = Math.round(FISCALITE.social.minQuarterly * (1 + FISCALITE.social.fraisGestion));
  assert.equal(socialQuarterly(0), min);
  // au-delà du 2e plafond, la cotisation n'augmente plus
  assert.equal(socialQuarterly(20_000_000), socialQuarterly(30_000_000));
  // base = bénéfice − cotisations (point fixe)
  const p = 6_000_000;
  const b = socialBaseFromProfit(p);
  assert.ok(Math.abs(b + socialAnnualDue(b) - p) < 5_000);
});

test('ISOC : taux réduit seulement si rémunération suffisante', () => {
  assert.equal(isocTax(10_000_000, true), 2_000_000);
  assert.equal(isocTax(10_000_000, false), 2_500_000);
  assert.equal(isocTax(15_000_000, true), 2_000_000 + 1_250_000);
  assert.ok(reducedRateEligible(5_000_000, 20_000_000));
  assert.ok(!reducedRateEligible(2_000_000, 20_000_000));
  assert.ok(reducedRateEligible(2_000_000, 1_500_000)); // rémunération ≥ bénéfice
});

test('dividendes : VVPR-bis simplifié', () => {
  assert.equal(dividendRate(0), 0.3);
  assert.equal(dividendRate(1), 0.2);
  assert.equal(dividendRate(5), 0.15);
});

test('TVA : déclarée au trimestre, payée le 20 du mois suivant', () => {
  const s = newGame({ seed: 'vat', legal: 'srl' });
  s.sector.policy = 'manuel';
  s.sector.leads = [];
  earn(s, 1_000_000, 0.21, 'ventes');
  run(s, 90); // fin du T1
  const item = s.tax.schedule.find((x) => x.kind === 'tva');
  assert.ok(item, 'TVA programmée');
  assert.equal(item.dueDay, dayOf(0, 3, 20));
  const cash = s.cash;
  run(s, item.dueDay - s.time.day + 1);
  assert.ok(!s.tax.schedule.includes(item));
  assert.ok(s.cash < cash);
  assert.equal(s.finance.vat.collected >= 0, true);
});

test('indépendant : IPP annuel programmé au 30 juin et régularisation sociale', () => {
  const s = newGame({ seed: 'ipp', legal: 'independant' });
  run(s, 360);
  const r = s.tax.results[0];
  assert.ok(r && r.operating > 0);
  const ipp = s.tax.schedule.find((x) => x.label.startsWith('IPP'));
  assert.ok(ipp);
  assert.equal(ipp.dueDay, dayOf(1, 5, 30));
  const regul = s.tax.schedule.find((x) => x.kind === 'regul');
  assert.ok(regul && regul.amount > 0, 'un starter rentable doit être régularisé');
});

test('SRL : ISOC au taux plein si rémunération trop basse, précompte retenu', () => {
  const s = newGame({ seed: 'isoc', legal: 'srl' });
  run(s, 360);
  const r = s.tax.results[0];
  assert.equal(r.legal, 'srl');
  assert.ok(r.directorPay > 0);
  if (r.taxable > 0 && r.directorPay < 5_000_000) assert.equal(r.reduced, false);
  assert.ok(s.tax.schedule.some((x) => x.label.startsWith('ISOC')) || r.isoc === 0);
});

test('prêt : plafond, mensualités, remboursement', () => {
  const s = newGame({ seed: 'loan', legal: 'srl' });
  const o = loanOffer(s, 36);
  assert.ok(o.max > 0 && o.rate > 0);
  assert.equal(applyAction(s, { type: 'requestLoan', amount: o.max + 1_000_000, months: 36 }).ok, false);
  const cash = s.cash;
  assert.ok(applyAction(s, { type: 'requestLoan', amount: 1_000_000, months: 36 }).ok);
  assert.equal(s.cash, cash + 1_000_000);
  const l = s.loans[0];
  run(s, 60);
  assert.ok(l.remaining < 1_000_000);
  assert.equal(l.monthsLeft, 34);
});

test('dividendes : seulement avec des réserves, précompte retenu', () => {
  const s = newGame({ seed: 'div', legal: 'srl' });
  assert.equal(applyAction(s, { type: 'payDividend', amount: 100_000 }).ok, false);
  s.tax.reserves = 1_000_000;
  s.time.day = 800; // 3e exercice → 15 %
  const p = s.personal.cash;
  assert.ok(applyAction(s, { type: 'payDividend', amount: 1_000_000 }).ok);
  assert.equal(s.personal.cash - p, 850_000);
  assert.equal(applyAction(newGame({ seed: 'x' }), { type: 'payDividend', amount: 100_000 }).ok, false);
});

test('investisseur : SRL uniquement, dilution', () => {
  const ind = newGame({ seed: 'inv1', legal: 'independant' });
  assert.equal(applyAction(ind, { type: 'seekInvestor' }).ok, false);
  const s = newGame({ seed: 'inv2', legal: 'srl' });
  assert.ok(applyAction(s, { type: 'seekInvestor' }).ok);
  const o = s.offers.investor;
  const cash = s.cash;
  assert.ok(applyAction(s, { type: 'acceptInvestor' }).ok);
  assert.equal(s.cash, cash + o.amount);
  assert.ok(Math.abs(s.ownership.founder - (1 - o.stake)) < 1e-6);
});

test('franchise TVA : sortie au-delà de 25 000 €', () => {
  const s = newGame({ seed: 'fr2', vatFranchise: true });
  earn(s, 2_600_000, 0.21, 'ventes');
  advance(s, 1);
  assert.equal(s.finance.franchise, false);
});
