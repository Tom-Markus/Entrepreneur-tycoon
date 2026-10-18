#!/usr/bin/env node
// Mini-bundler maison (sans dépendance) : transforme les modules ES de src/
// en un seul script classique dist/tycoon.bundle.js, utilisé uniquement quand
// on ouvre index.html directement depuis le disque (file://), car les
// navigateurs y bloquent les modules ES.
//
// Il ne gère que le sous-ensemble de syntaxe utilisé dans ce projet :
//   import { a, b as c } from './x.js';      import * as ns from './x.js';   import './x.js';
//   export function / class / const / let     export { a, b as c };
//   export { a } from './x.js';               export * as ns from './x.js';
//
// Usage : node tools/bundle.js          (écrit le bundle)
//         node tools/bundle.js --check  (code 1 si le bundle n'est pas à jour)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = 'src/main.js';
const OUT = 'dist/tycoon.bundle.js';

function rel(p) {
  return relative(ROOT, p).split('\\').join('/');
}

function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) throw new Error(`Import non relatif interdit : ${spec} dans ${fromFile}`);
  return rel(resolve(ROOT, dirname(fromFile), spec));
}

const IMPORT_RE = /import\s*(?:\{([^}]*)\}|\*\s+as\s+(\w+))\s*from\s*['"]([^'"]+)['"]\s*;?/g;
const BARE_IMPORT_RE = /import\s*['"]([^'"]+)['"]\s*;?/g;
const EXPORT_FROM_RE = /export\s*(?:\{([^}]*)\}|\*\s+as\s+(\w+)|\*)\s*from\s*['"]([^'"]+)['"]\s*;?/g;
const EXPORT_LIST_RE = /export\s*\{([^}]*)\}\s*;?/g;
const EXPORT_DECL_RE = /export\s+(async\s+function\*?|function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g;

function parseNames(list) {
  return list
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.split(/\s+as\s+/);
      return { local: m[0].trim(), exported: (m[1] || m[0]).trim() };
    });
}

function transform(file, src) {
  const deps = [];
  const getters = [];
  let code = src;

  code = code.replace(EXPORT_FROM_RE, (_, list, nsName, spec) => {
    const dep = resolveSpec(file, spec);
    deps.push(dep);
    const ref = `__m[${JSON.stringify(dep)}]`;
    if (list) {
      for (const n of parseNames(list)) getters.push(`${JSON.stringify(n.exported)}: () => ${ref}[${JSON.stringify(n.local)}]`);
      return '';
    }
    if (nsName) {
      getters.push(`${JSON.stringify(nsName)}: () => ${ref}`);
      return '';
    }
    return `__star(__exports, ${ref});`;
  });

  code = code.replace(IMPORT_RE, (_, list, nsName, spec) => {
    const dep = resolveSpec(file, spec);
    deps.push(dep);
    const ref = `__m[${JSON.stringify(dep)}]`;
    if (nsName) return `const ${nsName} = ${ref};`;
    const parts = parseNames(list).map((n) => (n.local === n.exported ? n.local : `${n.local}: ${n.exported}`));
    return `const { ${parts.join(', ')} } = ${ref};`;
  });

  code = code.replace(BARE_IMPORT_RE, (_, spec) => {
    deps.push(resolveSpec(file, spec));
    return '';
  });

  code = code.replace(EXPORT_LIST_RE, (_, list) => {
    for (const n of parseNames(list)) getters.push(`${JSON.stringify(n.exported)}: () => ${n.local}`);
    return '';
  });

  code = code.replace(EXPORT_DECL_RE, (_, kind, name) => {
    getters.push(`${JSON.stringify(name)}: () => ${name}`);
    return `${kind} ${name}`;
  });

  if (/\bexport\s+default\b/.test(code)) throw new Error(`export default non supporté (${file})`);
  if (/(\bawait\s+|[=(,]\s*)import\s*\(/.test(code)) throw new Error(`import() dynamique non supporté (${file})`);
  if (/import\.meta/.test(code)) throw new Error(`import.meta non supporté (${file})`);

  return { deps, getters, code };
}

export function buildBundle() {
  const modules = new Map();
  const order = [];
  const visiting = new Set();

  function visit(file) {
    if (modules.has(file)) return;
    if (visiting.has(file)) throw new Error(`Dépendance circulaire détectée autour de ${file}`);
    visiting.add(file);
    const abs = join(ROOT, file);
    if (!existsSync(abs)) throw new Error(`Fichier introuvable : ${file}`);
    const t = transform(file, readFileSync(abs, 'utf8'));
    for (const d of t.deps) visit(d);
    visiting.delete(file);
    modules.set(file, t);
    order.push(file);
  }
  visit(ENTRY);

  let out = '';
  out += '// FICHIER GÉNÉRÉ par tools/bundle.js — ne pas modifier à la main.\n';
  out += '// Sert uniquement à jouer en ouvrant index.html depuis le disque (file://).\n';
  out += '(function () {\n"use strict";\n';
  out += 'const __m = {};\n';
  out += 'function __def(o, g) { for (const k in g) Object.defineProperty(o, k, { get: g[k], enumerable: true }); }\n';
  out += 'function __star(o, src) { for (const k in src) if (!(k in o)) Object.defineProperty(o, k, { get: () => src[k], enumerable: true }); }\n';
  for (const file of order) {
    const t = modules.get(file);
    out += `\n// ---- ${file} ----\n`;
    out += `__m[${JSON.stringify(file)}] = (function () {\nconst __exports = {};\n`;
    if (t.getters.length) out += `__def(__exports, { ${t.getters.join(', ')} });\n`;
    out += t.code.trim() + '\n';
    out += 'return __exports;\n})();\n';
  }
  out += '})();\n';
  return out;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const bundle = buildBundle();
  const outPath = join(ROOT, OUT);
  if (process.argv.includes('--check')) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '';
    if (current !== bundle) {
      console.error(`${OUT} n'est pas à jour : lance "node tools/bundle.js".`);
      process.exit(1);
    }
    console.log(`${OUT} est à jour.`);
  } else {
    writeFileSync(outPath, bundle);
    console.log(`${OUT} écrit (${(bundle.length / 1024).toFixed(1)} Ko).`);
  }
}
