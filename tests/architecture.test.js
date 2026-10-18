// Vérifie la séparation stricte des couches (voir docs/DESIGN.md § 2.1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { buildBundle } from '../tools/bundle.js';

function files(dir) {
  const out = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

const FORBIDDEN = [/\bdocument\./, /\bwindow\./, /Math\.random/, /Date\.now/, /new Date\(/, /localStorage/, /performance\.now/];

test('engine et data : aucune dépendance au navigateur ni au temps réel', () => {
  for (const f of [...files('src/engine'), ...files('src/data')]) {
    const src = stripComments(readFileSync(f, 'utf8'));
    for (const re of FORBIDDEN) assert.ok(!re.test(src), `${f} utilise ${re}`);
    assert.ok(!/from\s+['"][^'"]*\/(ui|storage)\//.test(src), `${f} importe ui/ ou storage/`);
  }
});

test('data : n’importe pas le moteur', () => {
  for (const f of files('src/data')) {
    const src = readFileSync(f, 'utf8');
    assert.ok(!/from\s+['"][^'"]*engine\//.test(src), `${f} importe engine/`);
  }
});

test('le bundle file:// est à jour (node tools/bundle.js)', () => {
  const current = readFileSync('dist/tycoon.bundle.js', 'utf8');
  assert.equal(current, buildBundle(), 'Lance : node tools/bundle.js');
});
