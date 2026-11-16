// Outils mathématiques : hasard reproductible, bruit, petites fonctions utiles.

/** Générateur pseudo-aléatoire reproductible (mulberry32). Renvoie une fonction → [0,1). */
export function creerAlea(graine) {
  let a = graine >>> 0;
  return function alea() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const borner = (v, min, max) => (v < min ? min : v > max ? max : v);
export const melanger = (a, b, t) => a + (b - a) * t;
/** Transition douce entre 0 et 1 quand v passe de a à b (fonctionne aussi si a > b). */
export function lissage(a, b, v) {
  const t = borner((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
/** Rapproche `actuel` de `cible` indépendamment du nombre d'images par seconde. */
export const amortir = (actuel, cible, raideur, dt) => actuel + (cible - actuel) * (1 - Math.exp(-raideur * dt));
/** Plus petite différence entre deux angles (radians), dans [-π, π]. */
export function ecartAngle(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export const fract = (v) => v - Math.floor(v);
/** Hachage rapide de deux entiers → [0,1). */
export function hacher(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Bruit simplex 2D (algorithme public de Ken Perlin / Stefan Gustavson). */
export class Bruit {
  constructor(graine) {
    const alea = creerAlea(graine);
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(alea() * (i + 1));
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  /** Valeur dans [-1, 1]. */
  bruit2(x, y) {
    const F2 = 0.3660254037844386, G2 = 0.21132486540518713;
    const perm = this.perm;
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0;
    let tt = 0.5 - x0 * x0 - y0 * y0;
    if (tt > 0) { tt *= tt; n += tt * tt * grad(perm[ii + perm[jj]], x0, y0); }
    tt = 0.5 - x1 * x1 - y1 * y1;
    if (tt > 0) { tt *= tt; n += tt * tt * grad(perm[ii + i1 + perm[jj + j1]], x1, y1); }
    tt = 0.5 - x2 * x2 - y2 * y2;
    if (tt > 0) { tt *= tt; n += tt * tt * grad(perm[ii + 1 + perm[jj + 1]], x2, y2); }
    return 70 * n;
  }

  /** Bruit fractal : somme de plusieurs octaves. Valeur ≈ [-1, 1]. */
  fbm(x, y, octaves = 4, lacunarite = 2, gain = 0.5) {
    let somme = 0, amp = 1, total = 0;
    for (let o = 0; o < octaves; o++) {
      somme += this.bruit2(x, y) * amp;
      total += amp; amp *= gain; x *= lacunarite; y *= lacunarite;
    }
    return somme / total;
  }

  /** Bruit « en crêtes » (montagnes). Valeur dans [0, 1]. */
  crete(x, y, octaves = 4) {
    let somme = 0, amp = 1, total = 0;
    for (let o = 0; o < octaves; o++) {
      const n = 1 - Math.abs(this.bruit2(x, y));
      somme += n * n * amp; total += amp; amp *= 0.5; x *= 2.1; y *= 2.1;
    }
    return somme / total;
  }
}

function grad(h, x, y) {
  switch (h & 7) {
    case 0: return x + y; case 1: return x - y; case 2: return -x + y; case 3: return -x - y;
    case 4: return x; case 5: return -x; case 6: return y; default: return -y;
  }
}

/** Bruit de valeur périodique (se répète sans raccord) : utile pour les textures. */
export function bruitPeriodique(x, y, periode, graine) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const m = (n) => ((n % periode) + periode) % periode;
  const a = hacher(m(xi) + graine * 131, m(yi) + graine * 17);
  const b = hacher(m(xi + 1) + graine * 131, m(yi) + graine * 17);
  const c = hacher(m(xi) + graine * 131, m(yi + 1) + graine * 17);
  const d = hacher(m(xi + 1) + graine * 131, m(yi + 1) + graine * 17);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Bruit fractal périodique dans [0,1]. `frequence` = nombre de cellules sur la largeur. */
export function fbmPeriodique(u, v, frequence, octaves, graine) {
  let somme = 0, amp = 1, total = 0, f = frequence;
  for (let o = 0; o < octaves; o++) {
    somme += bruitPeriodique(u * f, v * f, f, graine + o * 7) * amp;
    total += amp; amp *= 0.5; f *= 2;
  }
  return somme / total;
}
