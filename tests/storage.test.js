import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryAdapter } from '../src/storage/MemoryAdapter.js';
import { SaveError, wrap } from '../src/storage/SaveAdapter.js';
import { migrate } from '../src/engine/migrations.js';
import { newGame, advance } from '../src/engine/index.js';
import { CONFIG } from '../src/data/config.js';

test('save / load / list / delete', async () => {
  const ad = new MemoryAdapter();
  const s = newGame({ seed: 'save', companyName: 'Frites & Co' });
  advance(s, 12);
  await ad.save('1', s, '2026-01-01T00:00:00Z');
  const back = await ad.load('1');
  assert.deepEqual(back, JSON.parse(JSON.stringify(s)));
  const list = await ad.list();
  assert.equal(list.find((x) => x.slot === '1').summary.companyName, 'Frites & Co');
  assert.ok(list.find((x) => x.slot === '2').empty);
  await ad.delete('1');
  await assert.rejects(ad.load('1'), (e) => e instanceof SaveError && e.code === 'notfound');
});

test('export / import', async () => {
  const ad = new MemoryAdapter();
  const s = newGame({ seed: 'exp' });
  await ad.save('2', s);
  const json = await ad.export('2');
  const imported = await ad.import(json, '3');
  assert.equal(imported.meta.gameId, s.meta.gameId);
  assert.ok(await ad.load('3'));
});

test('sauvegarde corrompue → erreur claire', async () => {
  const ad = new MemoryAdapter();
  ad.storage.setItem('entrepreneur-tycoon:slot:1', '{pas du json');
  await assert.rejects(ad.load('1'), (e) => e.code === 'corrupt');
  const list = await ad.list();
  assert.ok(list.find((x) => x.slot === '1').error);
  await assert.rejects(ad.import('{"format":"autre"}', '2'), (e) => e.code === 'format');
  await assert.rejects(ad.import(JSON.stringify({ format: 'entrepreneur-tycoon', state: { meta: {} } }), '2'), (e) => e.code === 'corrupt');
});

test('quota dépassé → SaveError quota', async () => {
  const ad = new MemoryAdapter(100);
  await assert.rejects(ad.save('1', newGame({ seed: 'q' })), (e) => e.code === 'quota');
});

test('emplacement inconnu refusé', async () => {
  const ad = new MemoryAdapter();
  await assert.rejects(ad.save('9', newGame({ seed: 'q' })), (e) => e.code === 'notfound');
});

test('migrations en chaîne', () => {
  const old = { meta: {}, time: { day: 3 }, cash: 0 };
  const m = migrate(old);
  assert.equal(m.meta.saveVersion, CONFIG.saveVersion);
  const custom = { 0: (s) => ({ ...s, a: 1 }), 1: (s) => ({ ...s, b: s.a + 1 }) };
  const r = migrate({ meta: { saveVersion: 0 } }, custom, 2);
  assert.equal(r.b, 2);
  assert.equal(r.meta.saveVersion, 2);
  assert.throws(() => migrate({ meta: { saveVersion: 99 } }), /plus récente/);
});

test('enveloppe contient un résumé', () => {
  const s = newGame({ seed: 'w' });
  const env = wrap(s, 'x');
  assert.equal(env.format, 'entrepreneur-tycoon');
  assert.equal(env.summary.gameId, s.meta.gameId);
});
