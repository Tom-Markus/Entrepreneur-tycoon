// Fabrique de créatures : à partir d'une description chiffrée (colonne vertébrale, pattes, tête),
// on construit un maillage « peau » attaché à un squelette (skinning).
// Repère : +Z vers l'avant (tête), +Y vers le haut, +X vers la gauche de l'animal. Unités : mètres.
import * as THREE from 'three';
import { Bruit } from '../noyau/maths.js';
import { TUILES, NB_TUILES } from '../rendu/textures.js';

const bruitMotif = new Bruit(2024);

/** Accumulateur de sommets avec poids d'os. */
export class MaillageOs {
  constructor() {
    this.pos = []; this.nor = []; this.uv = []; this.col = []; this.si = []; this.sw = []; this.haut = [];
    this.idx = []; this.idxFil = [];        // triangles de peau / triangles de filaments
    this.os = []; this.indexOs = {};
  }
  get n() { return this.pos.length / 3; }
  ajouterOs(nom, parent, x, y, z) {
    this.indexOs[nom] = this.os.length;
    this.os.push({ nom, parent, x, y, z });
    return this.os.length - 1;
  }
  sommet(x, y, z, nx, ny, nz, u, v, c, o1, w1, o2 = 0, w2 = 0) {
    this.pos.push(x, y, z); this.nor.push(nx, ny, nz); this.uv.push(u, v); this.col.push(c[0], c[1], c[2]);
    this.si.push(o1, o2, 0, 0); this.sw.push(w1, w2, 0, 0);
    return this.n - 1;
  }
  /** Triangle à faces plates (sommets dupliqués, normale calculée). */
  triangle(a, b, c, couleur, os, cible = this.idx, vers = null) {
    if (vers) {   // oriente la face vers l'extérieur
      const wx = b[0] - a[0], wy = b[1] - a[1], wz = b[2] - a[2], zx = c[0] - a[0], zy = c[1] - a[1], zz = c[2] - a[2];
      if ((wy * zz - wz * zy) * vers[0] + (wz * zx - wx * zz) * vers[1] + (wx * zy - wy * zx) * vers[2] < 0) { const t = b; b = c; c = t; }
    }
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i = this.n;
    if (l < 1e-9) { nx = 0; ny = 1; nz = 0; }            // triangle dégénéré : normale par défaut
    for (const p of [a, b, c]) this.sommet(p[0], p[1], p[2], nx, ny, nz, (p[0] + p[1] * 0.7) * 2, (p[2] + p[1] * 0.3) * 2, p[3] || couleur, os, 1);
    cible.push(i, i + 1, i + 2);
  }
  /** Cône (corne, griffe, dent, pique) : base, direction, longueur, rayon. */
  cone(b, d, longueur, rayon, couleur, os, cotes = 4, couleurPointe = null) {
    const l = Math.hypot(d[0], d[1], d[2]) || 1, ax = [d[0] / l, d[1] / l, d[2] / l];
    let u = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let s = [ax[1] * u[2] - ax[2] * u[1], ax[2] * u[0] - ax[0] * u[2], ax[0] * u[1] - ax[1] * u[0]];
    const sl = Math.hypot(s[0], s[1], s[2]); s = [s[0] / sl, s[1] / sl, s[2] / sl];
    u = [s[1] * ax[2] - s[2] * ax[1], s[2] * ax[0] - s[0] * ax[2], s[0] * ax[1] - s[1] * ax[0]];
    const pointe = [b[0] + ax[0] * longueur, b[1] + ax[1] * longueur, b[2] + ax[2] * longueur, couleurPointe || couleur];
    for (let k = 0; k < cotes; k++) {
      const a0 = (k / cotes) * Math.PI * 2, a1 = ((k + 1) / cotes) * Math.PI * 2;
      const p0 = [b[0] + (s[0] * Math.cos(a0) + u[0] * Math.sin(a0)) * rayon, b[1] + (s[1] * Math.cos(a0) + u[1] * Math.sin(a0)) * rayon, b[2] + (s[2] * Math.cos(a0) + u[2] * Math.sin(a0)) * rayon];
      const p1 = [b[0] + (s[0] * Math.cos(a1) + u[0] * Math.sin(a1)) * rayon, b[1] + (s[1] * Math.cos(a1) + u[1] * Math.sin(a1)) * rayon, b[2] + (s[2] * Math.cos(a1) + u[2] * Math.sin(a1)) * rayon];
      this.triangle(p0, p1, pointe, couleur, os, this.idx, [(p0[0] + p1[0]) / 2 - b[0], (p0[1] + p1[1]) / 2 - b[1], (p0[2] + p1[2]) / 2 - b[2]]);
    }
  }

  /**
   * Tube à section elliptique passant par une liste de stations.
   * station = { c:[x,y,z], rx, ryH, ryB, os:[o1,w1,o2,w2], u }  (ryH : rayon vers le « haut » de la section, ryB vers le bas)
   * couleur(u, v, a) → [r,v,b] ; v = 0 ventre … 1 dos.
   */
  tube(stations, cotes, couleur, grain, crete = 0) {
    const base = this.n, l = cotes + 1;
    let longueur = 0;
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i], p = stations[Math.max(0, i - 1)].c, q = stations[Math.min(stations.length - 1, i + 1)].c;
      let ty = q[1] - p[1], tz = q[2] - p[2], tx = q[0] - p[0];
      const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      // axe « haut » de la section : T × X
      let ux = 0, uy = tz, uz = -ty;
      const ul = Math.hypot(uy, uz) || 1; uy /= ul; uz /= ul;
      if (i > 0) longueur += Math.hypot(s.c[0] - p[0], s.c[1] - p[1], s.c[2] - p[2]);
      const rMoy = (s.rx + (s.ryH + s.ryB) / 2) / 2;
      for (let k = 0; k <= cotes; k++) {
        const a = -Math.PI / 2 + (k / cotes) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const ry = sa >= 0 ? s.ryH : s.ryB;
        // crete > 0 : section en « poire » (dos étroit, ventre large), comme une vraie cage thoracique
        const etroit = sa > 0 ? 1 - crete * sa * sa : 1 + crete * 0.18 * sa * sa;
        const x = s.c[0] + ca * s.rx * etroit, y = s.c[1] + uy * sa * ry, z = s.c[2] + uz * sa * ry;
        let nx = ca / Math.max(s.rx, 1e-4), nu = sa / Math.max(ry, 1e-4);
        const nl = Math.hypot(nx, nu) || 1; nx /= nl; nu /= nl;
        const c = couleur(s.u, (sa + 1) / 2, a, s);
        this.sommet(x, y, z, nx, uy * nu, uz * nu, longueur * grain, (k / cotes) * rMoy * 6.283 * grain, c, s.os[0], s.os[1], s.os[2], s.os[3]);
      }
    }
    for (let i = 0; i < stations.length - 1; i++) for (let k = 0; k < cotes; k++) {
      const v = base + i * l + k;
      this.idx.push(v, v + 1, v + l, v + 1, v + l + 1, v + l);
    }
  }

  geometrie(hauteurRef) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.si, 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.sw, 4));
    const h = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) h[i] = this.pos[i * 3 + 1] / hauteurRef;
    g.setAttribute('aHauteur', new THREE.BufferAttribute(h, 1));
    g.setIndex(this.idx.concat(this.idxFil));
    g.addGroup(0, this.idx.length, 0);
    if (this.idxFil.length) g.addGroup(this.idx.length, this.idxFil.length, 1);
    return g;
  }
}

/** Interpolation de Catmull-Rom entre des stations de contrôle (formes plus rondes). */
function interpoler(ctrl, i, t, cle) {
  const a = ctrl[Math.max(0, i - 1)][cle], b = ctrl[i][cle], c = ctrl[i + 1][cle], d = ctrl[Math.min(ctrl.length - 1, i + 2)][cle];
  const v = 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  return cle === 'x' || cle === 'y' || cle === 'z' ? v : Math.max(v, Math.min(b, c) * 0.6);
}

/**
 * Transforme des stations de contrôle {x,y,z,rx,ryH,ryB} en stations fines avec poids d'os.
 * osSegments[i] = os qui porte le segment i (entre contrôle i et i+1).
 */
function affiner(ctrl, osSegments, sub, osAvant = -1, gonfle = null) {
  const res = [], n = ctrl.length - 1;
  for (let i = 0; i < n; i++) {
    const dernier = i === n - 1;
    for (let k = 0; k < sub + (dernier ? 1 : 0); k++) {
      const t = k / sub, g = gonfle ? 1 + gonfle[i] * Math.sin(Math.PI * t) : 1;
      let o2 = osSegments[i], w2 = 0;
      if (t < 0.5) { const prec = i > 0 ? osSegments[i - 1] : osAvant; if (prec >= 0) { o2 = prec; w2 = 0.5 - t; } }
      else if (i < n - 1) { o2 = osSegments[i + 1]; w2 = t - 0.5; }
      res.push({
        c: [interpoler(ctrl, i, t, 'x'), interpoler(ctrl, i, t, 'y'), interpoler(ctrl, i, t, 'z')],
        rx: interpoler(ctrl, i, t, 'rx') * g, ryH: interpoler(ctrl, i, t, 'ryH') * g, ryB: interpoler(ctrl, i, t, 'ryB') * g,
        os: [osSegments[i], 1 - w2, o2, w2], u: (i + t) / n, seg: i + t,
      });
    }
  }
  return res;
}

const GABARITS_TETE = {
  theropode: {
    crane: [[-0.05, -0.10, 0.13, 0.20, 0.10], [0.12, -0.12, 0.19, 0.30, 0.04], [0.38, -0.12, 0.17, 0.27, 0.035], [0.68, -0.10, 0.13, 0.21, 0.03], [0.9, -0.07, 0.09, 0.14, 0.025], [1.0, -0.05, 0.03, 0.05, 0.01]],
    machoire: [[0.08, -0.13, 0.15, 0.02, 0.10], [0.35, -0.14, 0.15, 0.02, 0.12], [0.65, -0.12, 0.11, 0.02, 0.09], [0.88, -0.09, 0.07, 0.015, 0.06], [0.97, -0.07, 0.02, 0.01, 0.02]],
  },
  ornithopode: {
    crane: [[-0.05, -0.1, 0.2, 0.28, 0.12], [0.2, -0.12, 0.26, 0.36, 0.05], [0.5, -0.12, 0.22, 0.3, 0.04], [0.8, -0.12, 0.13, 0.17, 0.04], [1, -0.13, 0.05, 0.06, 0.02]],
    machoire: [[0.1, -0.14, 0.2, 0.02, 0.12], [0.5, -0.15, 0.17, 0.02, 0.1], [0.85, -0.15, 0.09, 0.02, 0.06], [0.97, -0.15, 0.03, 0.01, 0.02]],
  },
  sauropode: {
    crane: [[-0.1, -0.05, 0.3, 0.3, 0.25], [0.25, -0.1, 0.34, 0.36, 0.06], [0.6, -0.12, 0.3, 0.26, 0.05], [0.9, -0.12, 0.24, 0.14, 0.04], [1, -0.12, 0.1, 0.05, 0.02]],
    machoire: [[0.15, -0.13, 0.28, 0.02, 0.12], [0.6, -0.14, 0.27, 0.02, 0.1], [0.9, -0.14, 0.2, 0.02, 0.06], [0.99, -0.14, 0.06, 0.01, 0.02]],
  },
  stegosaure: {
    crane: [[-0.1, -0.05, 0.22, 0.22, 0.18], [0.25, -0.08, 0.24, 0.26, 0.05], [0.6, -0.1, 0.17, 0.18, 0.04], [0.9, -0.11, 0.09, 0.09, 0.03], [1, -0.11, 0.03, 0.03, 0.01]],
    machoire: [[0.15, -0.11, 0.2, 0.02, 0.1], [0.6, -0.12, 0.14, 0.02, 0.08], [0.92, -0.12, 0.06, 0.01, 0.04], [0.99, -0.12, 0.02, 0.01, 0.01]],
  },
};
const BOUCHE = [0.2, 0.06, 0.055], OEIL = [0.012, 0.01, 0.008], DENT = [0.42, 0.39, 0.3], GRIFFE = [0.03, 0.026, 0.022];

/**
 * Construit la géométrie et la liste d'os d'un dinosaure.
 * @param def      description de l'espèce (voir especes.js)
 * @param variante { tete, pattes, filaments, contraste } : ajustements (stades de croissance)
 */
export function construireCreature(def, variante = {}) {
  const m = new MaillageOs();
  const kTete = variante.tete || 1, kPattes = variante.pattes || 1, contraste = variante.contraste || 1;
  const grain = def.grainPeau || 2, cotes = def.cotes || 10;
  const hHanche = def.avant[0][2];
  // Les teintes des espèces sont assombries : une peau réelle ne renvoie que 10 à 20 % de la lumière.
  const couleur = (u, v, a, s) => {
    const c = def.motif(u, v, bruitMotif.bruit2(u * 23 + Math.cos(a) * 1.3, v * 3 + Math.sin(a) * 2.1), contraste, a);
    return [c[0] * 0.42, c[1] * 0.42, c[2] * 0.42];
  };

  // ----- Os de la colonne -----
  const A = def.avant, Q = def.queue;
  m.ajouterOs('bassin', null, 0, A[0][2], A[0][1]);
  for (let i = 1; i < A.length; i++) m.ajouterOs(A[i][0], A[i - 1][0], 0, A[i][2], A[i][1]);
  const stQ = [[A[0][1], A[0][2], A[0][3], A[0][4]], ...Q];
  for (let k = 1; k <= Q.length; k++) m.ajouterOs('queue' + k, k === 1 ? 'bassin' : 'queue' + (k - 1), 0, stQ[k - 1][1], stQ[k - 1][0]);
  const O = m.indexOs;

  // ----- Corps : un seul tube du bout de la queue à la base du crâne -----
  const ctrl = [], osSeg = [];
  for (let k = Q.length; k >= 1; k--) { ctrl.push({ x: 0, y: stQ[k][1], z: stQ[k][0], rx: stQ[k][2], ryH: stQ[k][3], ryB: stQ[k][3] }); osSeg.push(O['queue' + k]); }
  for (let i = 0; i < A.length; i++) {
    ctrl.push({ x: 0, y: A[i][2], z: A[i][1], rx: A[i][3], ryH: A[i][4], ryB: A[i][4] * (A[i][5] || 1) });
    if (i < A.length - 1) osSeg.push(O[A[i][0]]);
  }
  const corps = affiner(ctrl, osSeg, def.sub || 4);
  m.tube(corps, cotes, couleur, grain, def.crete === undefined ? 0.3 : def.crete);
  const nbQ = Q.length, nbCtrl = ctrl.length - 1;

  /** Point du dos (ligne médiane supérieure) pour une abscisse `seg` le long des contrôles. */
  const dos = (seg) => {
    let best = corps[0];
    for (const s of corps) if (Math.abs(s.seg - seg) < Math.abs(best.seg - seg)) best = s;
    const i = corps.indexOf(best), p = corps[Math.max(0, i - 1)].c, q = corps[Math.min(corps.length - 1, i + 1)].c;
    let ty = q[1] - p[1], tz = q[2] - p[2]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
    return { p: [0, best.c[1] + tz * best.ryH, best.c[2] - ty * best.ryH], haut: [0, tz, -ty], avant: [0, ty, tz], os: best.os[0], rx: best.rx, u: best.u, st: best };
  };

  // ----- Tête -----
  const T = def.tete, gab = GABARITS_TETE[T.gabarit], L = T.L * kTete;
  const pivot = A[A.length - 1], pz = pivot[1], py = pivot[2];
  const lf = T.l || 1, hf = T.h || 1;
  m.ajouterOs('machoire', 'tete', 0, py + gab.machoire[0][1] * L * hf, pz + gab.machoire[0][0] * L);
  const stTete = (tab, os, dessus) => tab.map((s, i) => ({
    c: [0, py + s[1] * L * hf, pz + s[0] * L], rx: s[2] * L * lf, ryH: s[3] * L * hf, ryB: s[4] * L * hf, os: [os, 1, 0, 0], u: 0.96 + 0.04 * (i / tab.length),
  }));
  const coulCrane = (u, v, a, s) => (Math.sin(a) < -0.92 ? BOUCHE : couleur(u, Math.max(v, 0.3), a, s));
  const coulMach = (u, v, a, s) => (Math.sin(a) > 0.92 ? BOUCHE : couleur(u, v * 0.6, a, s));
  m.tube(stTete(gab.crane, O.tete), cotes, coulCrane, grain);
  m.tube(stTete(gab.machoire, O.machoire), cotes, coulMach, grain);
  const surCrane = (t) => {      // interpolation linéaire dans le gabarit
    const c = gab.crane; let i = 0;
    while (i < c.length - 2 && c[i + 1][0] < t) i++;
    const f = (t - c[i][0]) / (c[i + 1][0] - c[i][0]), mix = (k) => c[i][k] + (c[i + 1][k] - c[i][k]) * f;
    return { z: pz + t * L, y: py + mix(1) * L * hf, rx: mix(2) * L * lf, ryH: mix(3) * L * hf, ryB: mix(4) * L * hf };
  };
  // Yeux
  { const e = surCrane(T.oeilT || 0.3), r = 0.036 * L * (T.oeil || 1);
    for (const c of [-1, 1]) {
      const b = [c * e.rx * 0.84, e.y + e.ryH * 0.58, e.z];
      m.cone(b, [c, 0, 0], r * 0.9, r, [0.16, 0.09, 0.02], O.tete, 8, OEIL);   // iris ambré, pupille sombre
    } }
  // Dents (carnivores)
  if (T.dents) {
    for (let i = 0; i < T.dents; i++) {
      const t = 0.3 + (i / (T.dents - 1)) * 0.66, e = surCrane(t), lon = L * (0.035 + 0.03 * Math.sin(i * 2.4) ** 2);
      for (const c of [-1, 1]) {
        m.cone([c * e.rx * 0.8, e.y - e.ryB * 0.6, e.z], [0, -1, 0], lon, lon * 0.3, DENT, O.tete, 3);
        if (t < 0.93) m.cone([c * e.rx * 0.66, e.y - e.ryB - L * 0.012, e.z - L * 0.02], [0, 1, 0], lon * 0.75, lon * 0.26, DENT, O.machoire, 3);
      }
    }
  }
  // Ornements crâniens
  const teinteCrete = [0.16, 0.05, 0.03];
  if (T.cretes === 'allosaurus') {
    const e = surCrane(0.37);
    for (const c of [-1, 1]) m.cone([c * e.rx * 0.5, e.y + e.ryH * 0.86, e.z], [c * 0.25, 1, -0.2], L * 0.11 * (variante.cretes || 1), L * 0.05, couleur(0.97, 1, 1.5), O.tete, 4, teinteCrete);
  } else if (T.cretes === 'ceratosaurus') {
    const e = surCrane(0.76);
    m.cone([0, e.y + e.ryH * 0.8, e.z], [0, 1, -0.15], L * 0.2, L * 0.06, couleur(0.97, 1, 1.5), O.tete, 4, [0.2, 0.17, 0.11]);
    const f = surCrane(0.36);
    for (const c of [-1, 1]) m.cone([c * f.rx * 0.5, f.y + f.ryH * 0.86, f.z], [c * 0.3, 1, -0.1], L * 0.09, L * 0.045, couleur(0.97, 1, 1.5), O.tete, 4, teinteCrete);
  }

  // ----- Pattes -----
  const infos = { pattes: [], rayonCorps: def.rayon, hanche: hHanche };
  const construirePatte = (P, noms, parent, genou, k) => {
    for (const cote of [1, -1]) {
      const suf = cote > 0 ? 'G' : 'D';
      // points d'articulation ; kPattes allonge les segments sous la hanche (juvéniles)
      const pts = P.pts.map((p, i) => [cote * P.x, i === 0 ? p[1] : p[1], p[0]]);
      let par = parent;
      const ids = [];
      for (let i = 0; i < 4; i++) { ids.push(m.ajouterOs(noms[i] + suf, par, pts[i][0], pts[i][1], pts[i][2])); par = noms[i] + suf; }
      const ctrlP = pts.map((p, i) => ({ x: p[0], y: p[1], z: p[2], rx: P.r[i][0] * k, ryH: P.r[i][1] * k, ryB: P.r[i][1] * k }));
      const st = affiner(ctrlP, [ids[0], ids[1], ids[2]], 5, m.indexOs[parent], [0.42, 0.2, 0.04]);
      const coulPatte = (u, v, a, s) => couleur(0.5, 0.62 - s.u * 0.22, a + cote);
      m.tube(st, Math.min(12, Math.max(6, Math.round(cotes * 0.6))), coulPatte, grain);
      // Doigts et griffes
      const D = P.doigts, pied = pts[3];
      for (let d = 0; d < D.n; d++) {
        const ang = D.n === 1 ? 0 : (d / (D.n - 1) - 0.5) * (D.ecart || 0.85) + cote * 0.08;
        const dx = Math.sin(ang), dz = Math.cos(ang);
        const cD = [
          { x: pied[0], y: pied[1], z: pied[2], rx: D.r, ryH: D.r, ryB: D.r },
          { x: pied[0] + dx * D.l * 0.55, y: D.r * 0.95, z: pied[2] + dz * D.l * 0.55, rx: D.r * 0.85, ryH: D.r * 0.8, ryB: D.r * 0.8 },
          { x: pied[0] + dx * D.l, y: D.r * 0.6, z: pied[2] + dz * D.l, rx: D.r * 0.5, ryH: D.r * 0.5, ryB: D.r * 0.5 },
        ];
        m.tube(affiner(cD, [ids[3], ids[3]], 2, -1), 7, (u, v, a) => couleur(0.5, 0.4, a), grain);
        m.cone([pied[0] + dx * D.l, D.r * 0.6, pied[2] + dz * D.l], [dx, -0.35, dz], D.l * (D.griffe || 0.4), D.r * 0.5, GRIFFE, ids[3], 3);
      }
      const l1 = dist(pts[0], pts[1]), l2 = dist(pts[1], pts[2]), l3 = dist(pts[2], pts[3]);
      infos.pattes.push({ cote, avant: parent !== 'bassin', noms: noms.map((n) => n + suf), parent, pts, l1, l2, l3, genou, longueurDoigt: D.l });
    }
  };
  construirePatte(def.patteArr, ['cuisse', 'tibia', 'meta', 'pied'], 'bassin', 1, 1);
  if (def.type === 'quadrupede') construirePatte(def.patteAv, ['bras', 'avantbras', 'main', 'paume'], 'torse', -1, 1);
  else if (def.bras) {
    const P = def.bras;
    for (const cote of [1, -1]) {
      const suf = cote > 0 ? 'G' : 'D';
      const pts = P.pts.map((p) => [cote * P.x, p[1], p[0]]);
      const o1 = m.ajouterOs('bras' + suf, 'torse', pts[0][0], pts[0][1], pts[0][2]);
      const o2 = m.ajouterOs('avantbras' + suf, 'bras' + suf, pts[1][0], pts[1][1], pts[1][2]);
      const ctrlP = pts.map((p, i) => ({ x: p[0], y: p[1], z: p[2], rx: P.r[i], ryH: P.r[i] * 1.15, ryB: P.r[i] * 1.15 }));
      m.tube(affiner(ctrlP, [o1, o2], 3, O.torse), 8, (u, v, a) => couleur(0.5, 0.5, a), grain);
      for (let g = 0; g < (P.griffes || 3); g++) {
        m.cone([pts[2][0], pts[2][1], pts[2][2]], [cote * (g - 1) * 0.5, -0.8, 0.6], P.r[2] * 3.2, P.r[2] * 0.6, GRIFFE, o2, 3);
      }
    }
  }

  // ----- Ornements du dos -----
  const orn = def.ornements;
  if (orn === 'plaques') {
    // Stegosaurus : 17 plaques alternées sur deux rangées + 4 piques caudales (« thagomizer »)
    for (let i = 0; i < 17; i++) {
      const seg = nbQ - 3.2 + (i / 16) * (nbCtrl - 1.2 - (nbQ - 3.2)), d = dos(seg);
      const taille = (0.22 + 0.62 * Math.pow(Math.sin(Math.PI * (1 - i / 16) * 0.92 + 0.12), 1.4)), cote = i % 2 ? 1 : -1;
      const larg = taille * 0.78, ep = 0.035, x0 = cote * d.rx * 0.16, incl = cote * 0.16;
      const B = [x0, d.p[1] - 0.06, d.p[2]];
      const cBase = couleur(d.u, 1, 1.5), cHaut = [0.2, 0.07, 0.03];
      const av = [B[0], B[1] + d.avant[1] * larg / 2, B[2] + d.avant[2] * larg / 2, cBase], ar = [B[0], B[1] - d.avant[1] * larg / 2, B[2] - d.avant[2] * larg / 2, cBase];
      const ht = [B[0] + incl * taille, B[1] + d.haut[1] * taille, B[2] + d.haut[2] * taille, cHaut];
      const mid = (s) => [B[0] + incl * taille * 0.4 + s * ep, B[1] + d.haut[1] * taille * 0.42, B[2] + d.haut[2] * taille * 0.42, [0.14, 0.09, 0.045]];
      m.triangle(av, mid(1), ht, cBase, d.os, m.idx, [1, 0, 0]); m.triangle(ht, mid(1), ar, cBase, d.os, m.idx, [1, 0, 0]);
      m.triangle(ht, mid(-1), av, cBase, d.os, m.idx, [-1, 0, 0]); m.triangle(ar, mid(-1), ht, cBase, d.os, m.idx, [-1, 0, 0]);
    }
    for (let i = 0; i < 4; i++) {
      const d = dos(0.55 + (i >> 1) * 0.55), cote = i % 2 ? 1 : -1;
      m.cone([cote * d.rx * 0.5, d.p[1] - d.st.ryH * 0.5, d.p[2]], [cote * 1, 0.42, -0.35], 0.78, 0.075, [0.14, 0.12, 0.08], d.os, 5, [0.3, 0.27, 0.2]);
    }
  } else if (orn === 'epinesDos' || orn === 'osteodermes') {
    const pas = orn === 'epinesDos' ? 0.32 : 0.4, h = orn === 'epinesDos' ? 0.17 : 0.075 * (def.longueur / 6);
    for (let seg = 0.8; seg < nbCtrl - 0.6; seg += pas) {
      const d = dos(seg);
      m.cone([0, d.p[1] - h * 0.3, d.p[2]], d.haut, h * (0.7 + 0.5 * Math.sin(seg * 9) ** 2), h * 0.42, couleur(d.u, 1, 1.5), d.os, 3);
    }
  }
  // ----- Protofilaments (frange discrète) -----
  const F = variante.filaments !== undefined ? variante.filaments : def.filaments;
  if (F) {
    const u0 = (TUILES.filament + 0.03) / NB_TUILES, u1 = (TUILES.filament + 0.97) / NB_TUILES, blanc = [0.42, 0.38, 0.3];
    for (let r = 0; r < F.rangs; r++) {
      const lat = F.rangs === 1 ? 0 : (r - (F.rangs - 1) / 2) * 0.55;       // décalage angulaire du rang
      let prec = -1, bascule = 0;
      for (const s of corps) {
        if (s.seg < nbQ - (F.queue || 2.5) || s.seg > nbCtrl - 0.4) continue;
        const d = dos(s.seg), hF = F.hauteur * (0.7 + 0.3 * Math.sin(s.seg * 5.1 + r));
        const bx = Math.sin(lat) * s.rx * 0.98, by = s.c[1] + d.haut[1] * Math.cos(lat) * s.ryH * 0.96, bz = s.c[2] + d.haut[2] * Math.cos(lat) * s.ryH * 0.96;
        const hx = Math.sin(lat) * hF, hy = d.haut[1] * Math.cos(lat) * hF - d.avant[1] * hF * 0.5, hz = d.haut[2] * Math.cos(lat) * hF - d.avant[2] * hF * 0.5;
        const uu = bascule++ % 2 ? u1 : u0;
        const a = m.sommet(bx, by, bz, Math.sin(lat), Math.cos(lat), 0, uu, 0.02, blanc, s.os[0], s.os[1], s.os[2], s.os[3]);
        m.sommet(bx + hx, by + hy, bz + hz, Math.sin(lat), Math.cos(lat), 0, uu, 0.95, blanc, s.os[0], s.os[1], s.os[2], s.os[3]);
        if (prec >= 0) m.idxFil.push(prec, a, prec + 1, prec + 1, a, a + 1);
        prec = a;
      }
    }
  }

  // Repères utiles à l'animation
  infos.os = m.os; infos.indexOs = m.indexOs;
  infos.nomsAvant = A.map((a) => a[0]); infos.nbQueue = Q.length;
  infos.longueurTete = L;
  infos.museau = [0, py + gab.crane[gab.crane.length - 1][1] * L * hf, pz + L];   // bout du museau (repère de l'os « tête »)
  return { geometrie: m.geometrie(hHanche), infos };
}

function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

/** Crée un squelette Three.js (os en pose de repos, sans rotation) à partir de la liste d'os. */
export function creerSquelette(listeOs) {
  const os = [], parNom = {};
  for (const d of listeOs) {
    const b = new THREE.Bone(); b.name = d.nom;
    const p = d.parent ? listeOs.find((o) => o.nom === d.parent) : null;
    b.position.set(d.x - (p ? p.x : 0), d.y - (p ? p.y : 0), d.z - (p ? p.z : 0));
    b.userData.repos = b.position.clone();
    if (p) parNom[d.parent].add(b);
    os.push(b); parNom[d.nom] = b;
  }
  os[0].updateMatrixWorld(true);
  return { squelette: new THREE.Skeleton(os), parNom, racine: os[0] };
}
