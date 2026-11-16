// Description chiffrée des espèces : forme du corps, couleurs, capacités.
// Les dimensions sont celles de l'adulte, en mètres, d'après les reconstitutions récentes
// (posture horizontale, queue en balancier). Les couleurs sont des hypothèses plausibles :
// camouflage et contre-ombrage (dos sombre, ventre clair), comme chez beaucoup d'animaux actuels.
import { lissage } from '../noyau/maths.js';

const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Dégradé ventre → flanc → dos (contre-ombrage). */
function contreOmbrage(ventre, flanc, dos, v) {
  return v < 0.45 ? mix3(ventre, flanc, lissage(0.1, 0.45, v)) : mix3(flanc, dos, lissage(0.45, 0.82, v));
}
const moucheter = (c, n, f) => [c[0] * (1 + n * f), c[1] * (1 + n * f), c[2] * (1 + n * f)];

// colonne « avant » : [nom de l'os, z, y, demi-largeur, demi-hauteur]   (du bassin vers la tête)
// colonne « queue » : [z, y, demi-largeur, demi-hauteur]                 (du bassin vers la pointe)
// pattes : pts = articulations [z, y] (hanche, genou, cheville, base des doigts) ; r = rayons [latéral, avant-arrière]
const ALLOSAURUS = {
  id: 'allosaurus', nom: 'Allosaurus', type: 'bipede', longueur: 8.5, masse: 1700, rayon: 0.75,
  queue: [[-0.9, 2.02, 0.34, 0.48], [-1.8, 1.98, 0.22, 0.33], [-2.7, 1.94, 0.15, 0.23], [-3.5, 1.9, 0.10, 0.15], [-4.2, 1.87, 0.06, 0.09], [-4.9, 1.85, 0.02, 0.03]],
  avant: [['bassin', 0, 2.05, 0.40, 0.56], ['dos', 0.75, 2.07, 0.47, 0.62, 1.14], ['torse', 1.5, 2.02, 0.44, 0.60, 1.16], ['cou1', 2.15, 2.1, 0.27, 0.36], ['cou2', 2.56, 2.33, 0.21, 0.28], ['cou3', 2.92, 2.56, 0.18, 0.24], ['tete', 3.22, 2.72, 0.17, 0.22]],
  tete: { gabarit: 'theropode', L: 0.88, dents: 10, cretes: 'allosaurus', h: 1.45, l: 1.1 },
  patteArr: { x: 0.34, pts: [[0, 1.95], [0.45, 1.2], [-0.25, 0.62], [0.05, 0.1]], r: [[0.25, 0.5], [0.17, 0.27], [0.085, 0.11], [0.09, 0.08]], doigts: { n: 3, l: 0.38, r: 0.07, ecart: 0.75 } },
  bras: { x: 0.3, pts: [[1.75, 1.55], [1.65, 1.2], [1.95, 1.02]], r: [0.085, 0.06, 0.04], griffes: 3 },
  ornements: null, filaments: null, grainPeau: 5, cotes: 20, sub: 5,
  motif(u, v, n, k) {
    const dos = [0.105, 0.08, 0.042], flanc = [0.21, 0.16, 0.085], ventre = [0.44, 0.39, 0.27];
    let c = contreOmbrage(ventre, flanc, dos, v);
    // rayures discrètes, limitées au dos et à la queue (camouflage en sous-bois)
    const bande = lissage(0.35, 0.9, Math.sin(u * 74 + n * 0.9)) * lissage(0.5, 0.88, v) * 0.22 * k;
    c = mix3(c, [0.04, 0.034, 0.02], bande);
    return moucheter(c, n, 0.14);
  },
  marche: 2.2, course: 9, sante: 200, degats: 30, viande: 320, detection: 70, role: 'predateur', diurne: true,
  corpsBas: 0.42, couBas: 1.1, hauteurCouche: 0.3, voix: 70,
};

/** Dérive une espèce d'une autre en changeant l'échelle (k) et l'épaisseur (e). */
function deriver(base, k, e, surcharge) {
  const s = (v) => v * k;
  const d = {
    ...base,
    queue: base.queue.map((q) => [s(q[0]), s(q[1]), s(q[2]) * e, s(q[3]) * e]),
    avant: base.avant.map((a) => [a[0], s(a[1]), s(a[2]), s(a[3]) * e, s(a[4]) * e, a[5] || 1]),
    tete: { ...base.tete, L: s(base.tete.L) },
    patteArr: { x: s(base.patteArr.x) * e, pts: base.patteArr.pts.map((p) => [s(p[0]), s(p[1])]), r: base.patteArr.r.map((r) => [s(r[0]) * e, s(r[1]) * e]),
      doigts: { n: 3, l: s(base.patteArr.doigts.l), r: s(base.patteArr.doigts.r) * e, ecart: 0.75 } },
    bras: { x: s(base.bras.x) * e, pts: base.bras.pts.map((p) => [s(p[0]), s(p[1])]), r: base.bras.r.map((r) => s(r) * e), griffes: base.bras.griffes },
    longueur: base.longueur * k, rayon: base.rayon * k * e,
  };
  return Object.assign(d, surcharge);
}

export const ESPECES = {
  allosaurus: ALLOSAURUS,

  ceratosaurus: deriver(ALLOSAURUS, 0.72, 1.05, {
    id: 'ceratosaurus', nom: 'Ceratosaurus', masse: 650, ornements: 'osteodermes',
    tete: { gabarit: 'theropode', L: 0.68, dents: 9, cretes: 'ceratosaurus', h: 1.55, l: 1.1 },
    motif(u, v, n) {
      const dos = [0.17, 0.055, 0.035], flanc = [0.33, 0.15, 0.08], ventre = [0.52, 0.45, 0.33];
      let c = contreOmbrage(ventre, flanc, dos, v);
      const anneau = lissage(0.3, 0.8, Math.sin(u * 60)) * lissage(0.55, 0.2, u) * lissage(0.3, 0.6, v) * 0.6;
      c = mix3(c, [0.05, 0.02, 0.015], anneau);
      return moucheter(c, n, 0.16);
    },
    marche: 2.0, course: 9.4, sante: 110, degats: 17, viande: 150, detection: 60, voix: 110,
  }),

  compsognathus: deriver(ALLOSAURUS, 0.13, 0.82, {
    id: 'compsognathus', nom: 'Compsognathus', masse: 3, cotes: 10, sub: 3, grainPeau: 14,
    tete: { gabarit: 'theropode', L: 0.09, dents: 0, cretes: null, h: 1.0, oeil: 1.7 },
    filaments: { rangs: 3, hauteur: 0.035, queue: 3.5 },
    motif(u, v, n) {
      const dos = [0.17, 0.09, 0.04], flanc = [0.36, 0.22, 0.1], ventre = [0.55, 0.5, 0.38];
      let c = contreOmbrage(ventre, flanc, dos, v);
      c = mix3(c, [0.06, 0.035, 0.02], lissage(0.4, 0.9, Math.sin(u * 70)) * lissage(0.5, 0.15, u) * 0.6);
      return moucheter(c, n, 0.2);
    },
    marche: 1.3, course: 7.5, sante: 8, degats: 1, viande: 10, detection: 22, role: 'charognard', voix: 1900,
    rayon: 0.16,
  }),

  dryosaurus: {
    id: 'dryosaurus', nom: 'Dryosaurus', type: 'bipede', longueur: 3.4, masse: 90, rayon: 0.32, cotes: 12, sub: 4, grainPeau: 8,
    queue: [[-0.35, 1.0, 0.14, 0.2], [-0.75, 0.99, 0.1, 0.15], [-1.15, 0.98, 0.07, 0.1], [-1.55, 0.97, 0.045, 0.06], [-1.95, 0.96, 0.02, 0.03]],
    avant: [['bassin', 0, 1.02, 0.19, 0.26], ['dos', 0.35, 1.03, 0.22, 0.28, 1.12], ['torse', 0.7, 1.0, 0.19, 0.25, 1.1], ['cou1', 0.95, 1.05, 0.09, 0.11], ['cou2', 1.1, 1.2, 0.065, 0.075], ['tete', 1.2, 1.33, 0.06, 0.07]],
    tete: { gabarit: 'ornithopode', L: 0.26, oeil: 1.5 },
    patteArr: { x: 0.15, pts: [[0, 0.98], [0.2, 0.58], [-0.12, 0.3], [0.02, 0.05]], r: [[0.09, 0.17], [0.055, 0.07], [0.03, 0.035], [0.035, 0.03]], doigts: { n: 3, l: 0.16, r: 0.025 } },
    bras: { x: 0.14, pts: [[0.78, 0.82], [0.74, 0.62], [0.84, 0.5]], r: [0.035, 0.026, 0.018], griffes: 3 },
    ornements: null, filaments: { rangs: 1, hauteur: 0.05, queue: 2 },
    motif(u, v, n) {
      const dos = [0.085, 0.125, 0.055], flanc = [0.22, 0.25, 0.1], ventre = [0.5, 0.48, 0.33];
      let c = contreOmbrage(ventre, flanc, dos, v);
      c = mix3(c, [0.45, 0.43, 0.25], lissage(0.08, 0.0, Math.abs(v - 0.5)) * 0.55);   // bande latérale claire
      return moucheter(c, n, 0.15);
    },
    marche: 1.6, course: 11.5, sante: 35, degats: 0, viande: 70, detection: 55, role: 'troupeau', diurne: true, fuit: true,
    corpsBas: 0.5, couBas: 1.0, hauteurCouche: 0.32, voix: 900,
  },

  stegosaurus: {
    id: 'stegosaurus', nom: 'Stegosaurus', type: 'quadrupede', longueur: 7.5, masse: 4000, rayon: 1.15, grainPeau: 4, cotes: 18, sub: 4, crete: 0.22,
    queue: [[-0.7, 2.2, 0.42, 0.52], [-1.4, 2.05, 0.3, 0.38], [-2.1, 1.9, 0.2, 0.26], [-2.8, 1.8, 0.12, 0.16], [-3.4, 1.75, 0.07, 0.09], [-3.9, 1.72, 0.03, 0.04]],
    avant: [['bassin', 0, 2.25, 0.62, 0.72], ['dos', 0.8, 2.2, 0.74, 0.8, 1.12], ['torse', 1.6, 1.85, 0.62, 0.68, 1.1], ['cou1', 2.3, 1.5, 0.3, 0.36], ['cou2', 2.75, 1.3, 0.18, 0.2], ['tete', 3.1, 1.2, 0.11, 0.12]],
    tete: { gabarit: 'stegosaure', L: 0.45 },
    patteArr: { x: 0.5, pts: [[0, 2.0], [0.25, 1.2], [-0.05, 0.5], [0.05, 0.12]], r: [[0.26, 0.4], [0.2, 0.24], [0.14, 0.16], [0.17, 0.17]], doigts: { n: 3, l: 0.18, r: 0.07, griffe: 0.25 } },
    patteAv: { x: 0.52, pts: [[1.7, 1.5], [1.55, 0.85], [1.7, 0.35], [1.72, 0.1]], r: [[0.2, 0.26], [0.15, 0.18], [0.12, 0.13], [0.14, 0.14]], doigts: { n: 3, l: 0.14, r: 0.06, griffe: 0.25 } },
    ornements: 'plaques', filaments: null,
    motif(u, v, n) {
      const dos = [0.1, 0.115, 0.065], flanc = [0.21, 0.22, 0.13], ventre = [0.42, 0.4, 0.3];
      const c = contreOmbrage(ventre, flanc, dos, v);
      return moucheter(c, n, 0.24);
    },
    marche: 1.1, course: 3.8, sante: 420, degats: 28, viande: 420, detection: 26, role: 'troupeau', diurne: true, fuit: false, defend: true,
    couBas: 0.5, hauteurCouche: 0.4, voix: 60,
  },

  diplodocus: {
    id: 'diplodocus', nom: 'Diplodocus', type: 'quadrupede', longueur: 24, masse: 13000, rayon: 1.7, grainPeau: 3.4, cotes: 18, sub: 4, crete: 0.18,
    queue: [[-1.2, 3.3, 0.6, 0.75], [-2.6, 3.2, 0.42, 0.52], [-4.2, 3.0, 0.28, 0.34], [-6, 2.8, 0.18, 0.22], [-8, 2.6, 0.11, 0.13], [-10, 2.45, 0.06, 0.07], [-12, 2.35, 0.035, 0.04], [-13.6, 2.3, 0.015, 0.02]],
    avant: [['bassin', 0, 3.35, 0.85, 1.0], ['dos', 1.3, 3.4, 0.98, 1.1, 1.15], ['torse', 2.7, 3.2, 0.88, 1.0, 1.12], ['cou1', 3.8, 3.3, 0.42, 0.5], ['cou2', 5.0, 3.7, 0.3, 0.34], ['cou3', 6.2, 4.1, 0.24, 0.27], ['cou4', 7.4, 4.45, 0.2, 0.22], ['cou5', 8.6, 4.7, 0.17, 0.19], ['tete', 9.6, 4.85, 0.14, 0.15]],
    tete: { gabarit: 'sauropode', L: 0.6, h: 0.8 },
    patteArr: { x: 0.7, pts: [[0, 3.0], [0.25, 1.75], [0, 0.6], [0.05, 0.15]], r: [[0.4, 0.55], [0.3, 0.34], [0.24, 0.26], [0.28, 0.28]], doigts: { n: 3, l: 0.22, r: 0.1, griffe: 0.3 } },
    patteAv: { x: 0.65, pts: [[2.9, 2.7], [2.8, 1.55], [2.9, 0.5], [2.92, 0.14]], r: [[0.3, 0.36], [0.24, 0.27], [0.2, 0.21], [0.22, 0.22]], doigts: { n: 3, l: 0.16, r: 0.09, griffe: 0.25 } },
    ornements: 'epinesDos', filaments: null,
    motif(u, v, n) {
      const dos = [0.14, 0.13, 0.11], flanc = [0.28, 0.25, 0.2], ventre = [0.48, 0.45, 0.38];
      let c = contreOmbrage(ventre, flanc, dos, v);
      c = mix3(c, [0.4, 0.37, 0.3], lissage(0.07, 0.0, Math.abs(v - 0.52)) * 0.4);
      return moucheter(c, n, 0.2);
    },
    marche: 1.3, course: 3.2, sante: 1500, degats: 40, viande: 1300, detection: 30, role: 'troupeau', diurne: true, fuit: false, defend: true, geant: true,
    couBas: 0.62, hauteurCouche: 0.5, voix: 38,
  },

  brachiosaurus: {
    id: 'brachiosaurus', nom: 'Brachiosaurus', type: 'quadrupede', longueur: 22, masse: 35000, rayon: 2.2, grainPeau: 3, cotes: 18, sub: 4, crete: 0.18,
    queue: [[-1.0, 3.9, 0.75, 0.9], [-2.2, 3.6, 0.5, 0.6], [-3.5, 3.3, 0.32, 0.38], [-4.8, 3.05, 0.18, 0.22], [-6.0, 2.9, 0.09, 0.1], [-7.0, 2.82, 0.03, 0.04]],
    avant: [['bassin', 0, 4.1, 1.1, 1.25], ['dos', 1.5, 4.5, 1.28, 1.4, 1.12], ['torse', 3.0, 4.9, 1.14, 1.3, 1.1], ['cou1', 4.1, 5.6, 0.6, 0.7], ['cou2', 5.0, 7.0, 0.45, 0.5], ['cou3', 5.8, 8.5, 0.37, 0.4], ['cou4', 6.5, 10.0, 0.31, 0.33], ['cou5', 7.1, 11.4, 0.26, 0.28], ['tete', 7.5, 12.4, 0.2, 0.22]],
    tete: { gabarit: 'sauropode', L: 0.75, h: 1.25 },
    patteArr: { x: 0.9, pts: [[0, 3.7], [0.3, 2.1], [0.05, 0.7], [0.1, 0.18]], r: [[0.5, 0.65], [0.36, 0.4], [0.28, 0.3], [0.33, 0.33]], doigts: { n: 3, l: 0.25, r: 0.12, griffe: 0.3 } },
    patteAv: { x: 0.85, pts: [[3.2, 4.5], [3.1, 2.6], [3.2, 0.8], [3.22, 0.2]], r: [[0.4, 0.45], [0.3, 0.33], [0.25, 0.26], [0.27, 0.27]], doigts: { n: 3, l: 0.18, r: 0.11, griffe: 0.25 } },
    ornements: null, filaments: null,
    motif(u, v, n) {
      const dos = [0.18, 0.15, 0.1], flanc = [0.34, 0.28, 0.19], ventre = [0.5, 0.45, 0.36];
      let c = contreOmbrage(ventre, flanc, dos, v);
      c = mix3(c, [0.1, 0.08, 0.055], lissage(0.05, 0.4, n) * lissage(0.25, 0.6, v) * 0.45);   // taches réticulées
      return moucheter(c, n, 0.1);
    },
    marche: 1.2, course: 2.8, sante: 2200, degats: 45, viande: 1600, detection: 30, role: 'troupeau', diurne: true, fuit: false, defend: true, geant: true, broutHaut: true,
    couBas: 0.5, hauteurCouche: 0.5, voix: 30,
  },
};

// Variantes de l'Allosaurus selon le stade de croissance (voir config.joueur.stades)
export const VARIANTES_ALLOSAURUS = {
  juvenile: { tete: 1.12, contraste: 1.9, cretes: 0.45, filaments: { rangs: 3, hauteur: 0.16, queue: 3 } },
  subadulte: { tete: 1.05, contraste: 1.3, cretes: 0.8, filaments: { rangs: 1, hauteur: 0.12, queue: 2 } },
  adulte: { tete: 1, contraste: 1, cretes: 1, filaments: null },
};
