import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, advance, applyAction, createRng } from '../src/engine/index.js';
import { run } from './helpers.js';
import { EVENTS } from '../src/data/events.js';
import { trigger, describeEffects, eventById } from '../src/engine/events.js';
import { SECTOR_DATA } from '../src/engine/sectors/registry.js';
import { monthEnd as compMonthEnd } from '../src/engine/systems/competitors.js';

const KNOWN = new Set(['cash', 'personal', 'rep', 'sat', 'mod', 'motivation', 'loseEmployee', 'employeeSkill', 'employeeRaise', 'employeeAbsent', 'salaryIndex', 'candidate', 'fixedCost', 'chain', 'flag', 'flagYear', 'flagUntil', 'economyTrend', 'baseRate', 'competitorPromo', 'competitorBankrupt', 'newCompetitor', 'investorOffer', 'founderEnergy', 'stat', 'sector', 'chance', 'log']);

function walk(effects, fn) {
  for (const e of effects || []) {
    fn(e);
    if (e.t === 'chance') {
      walk(e.success, fn);
      walk(e.fail, fn);
    }
  }
}

test('au moins 60 événements, identifiants uniques, effets connus, chaînes valides', () => {
  assert.ok(EVENTS.length >= 60, `${EVENTS.length} événements`);
  const ids = new Set(EVENTS.map((e) => e.id));
  assert.equal(ids.size, EVENTS.length);
  for (const ev of EVENTS) {
    assert.ok(ev.title && ev.text, ev.id);
    assert.ok(ev.effects || ev.choices, `${ev.id} sans effets`);
    const check = (e) => {
      assert.ok(KNOWN.has(e.t), `${ev.id} : effet inconnu ${e.t}`);
      if (e.t === 'chain') assert.ok(ids.has(e.id), `${ev.id} : chaîne vers ${e.id} inexistante`);
    };
    walk(ev.effects, check);
    for (const c of ev.choices || []) {
      assert.ok(c.label, ev.id);
      walk(c.effects, check);
    }
  }
});

test('chaque événement se déclenche et chaque choix s’applique sans erreur (tous secteurs)', () => {
  for (const sector of Object.keys(SECTOR_DATA)) {
    for (const legal of ['independant', 'srl']) {
      for (const ev of EVENTS) {
        if (ev.sectors && !ev.sectors.includes(sector)) continue;
        const nChoices = ev.choices ? ev.choices.length : 1;
        for (let c = 0; c < nChoices; c++) {
          const s = newGame({ seed: `ev-${ev.id}-${c}`, sector, legal });
          run(s, 60);
          s.staff.candidates.push({ id: 900, name: 'X', role: Object.keys(SECTOR_DATA[sector].roles)[0], skill: 60, trait: 'fiable', salary: 300_000, expires: 9999 });
          applyAction(s, { type: 'hire', id: 900 });
          const rng = createRng(42);
          trigger(s, ev, rng);
          if (s.events.pending.length) {
            const p = s.events.pending[0];
            assert.ok(describeEffects(s, p.choices[c], p.ctx).length >= 0);
            const r = applyAction(s, { type: 'decide', uid: p.uid, choice: c });
            assert.ok(r.ok, `${ev.id} choix ${c} : ${r.message}`);
          }
          run(s, 100);
          assert.ok(Number.isInteger(s.cash), `${ev.id} : trésorerie non entière`);
          assert.ok(Number.isFinite(s.company.reputation));
          JSON.stringify(s);
        }
      }
    }
  }
});

test('les choix affichent leurs conséquences (montants, probabilités)', () => {
  const s = newGame({ seed: 'desc' });
  const ev = eventById('controle_fiscal');
  const lines = describeEffects(s, ev.choices[1], {});
  assert.ok(lines.some((l) => /%/.test(l.text)));
  assert.ok(lines.some((l) => /€/.test(l.text)));
});

test('un événement à choix met le temps en pause jusqu’à la décision', () => {
  const s = newGame({ seed: 'pause' });
  trigger(s, eventById('avis_negatif'), createRng(1));
  const d = s.time.day;
  advance(s, 10);
  assert.equal(s.time.day, d);
  applyAction(s, { type: 'decide', uid: s.events.pending[0].uid, choice: 1 });
  advance(s, 3);
  assert.equal(s.time.day, d + 3);
});

test('cooldown : pas de répétition immédiate', () => {
  const s = newGame({ seed: 'cd', difficulty: 'facile' });
  s.personal.cash = 1e10; // l'indépendant ne peut pas faire faillite dans ce test
  run(s, 6 * 360);
  const byId = {};
  for (const h of s.events.history) (byId[h.id] = byId[h.id] || []).push(h.day);
  for (const [id, days] of Object.entries(byId)) {
    const ev = eventById(id);
    for (let i = 1; i < days.length; i++) assert.ok(days[i] - days[i - 1] >= Math.min(ev.cooldown ?? 360, 360) || ev.chainOnly, `${id} répété trop vite`);
  }
  assert.ok(s.events.history.length > 20, 'trop peu d’événements en 6 ans');
});

test('concurrents : le bas prix baisse ses prix face à un joueur dominant', () => {
  const s = newGame({ seed: 'comp' });
  const low = s.competitors.find((c) => c.strategy === 'lowcost') || s.competitors[0];
  low.strategy = 'lowcost';
  const p0 = low.priceIdx;
  s.company.share = 0.6;
  low.share = 0.1;
  const rng = createRng(3);
  for (let i = 0; i < 6; i++) compMonthEnd(s, rng);
  assert.ok(low.priceIdx < p0);
});

test('concurrents : faillite puis nouvel entrant', () => {
  const s = newGame({ seed: 'compbk' });
  const c = s.competitors[0];
  c.cash = -1e12;
  const rng = createRng(5);
  compMonthEnd(s, rng);
  assert.equal(c.alive, false);
  assert.ok(s.compRespawnDay != null);
  s.time.day = s.compRespawnDay;
  compMonthEnd(s, rng);
  assert.ok(s.competitors.filter((x) => x.alive).length >= 2);
});
