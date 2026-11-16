// Géométries procédurales de la flore du Jurassique supérieur.
// Aucune graminée (herbe) ni plante à fleurs : elles n'existaient pas encore.
// Chaque plante est fabriquée à partir de deux briques : des « tubes » (troncs, branches)
// et des « cartes » (bandes souples portant une image de fronde ou de rameau).
import * as THREE from 'three';
import { creerAlea, Bruit } from '../noyau/maths.js';
import { TUILES, NB_TUILES } from '../rendu/textures.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

class Fabrique {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.vent = []; this.idx = []; this.col = []; this.feuille = []; }
  get n() { return this.pos.length / 3; }

  /** Tronc ou branche : anneaux de `cotes` côtés le long d'une liste de points {x,y,z,r,vent}. */
  tube(points, cotes, tuile = TUILES.ecorce) {
    const u0 = (tuile + 0.03) / NB_TUILES, u1 = (tuile + 0.97) / NB_TUILES, base = this.n;
    const axe = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < points.length; i++) {
      const p = points[i], q = points[Math.min(i + 1, points.length - 1)], o = points[Math.max(i - 1, 0)];
      axe.set(q.x - o.x, q.y - o.y, q.z - o.z).normalize();
      a.set(1, 0, 0); if (Math.abs(axe.x) > 0.9) a.set(0, 0, 1);
      b.crossVectors(axe, a).normalize(); a.crossVectors(b, axe).normalize();
      for (let k = 0; k <= cotes; k++) {
        const ang = (k / cotes) * Math.PI * 2, c = Math.cos(ang), s = Math.sin(ang);
        const nx = a.x * c + b.x * s, ny = a.y * c + b.y * s, nz = a.z * c + b.z * s;
        this.pos.push(p.x + nx * p.r, p.y + ny * p.r, p.z + nz * p.r);
        this.nor.push(nx, ny, nz);
        this.uv.push(u0 + (u1 - u0) * (k / cotes), i % 2 ? 0.98 : 0.02);   // la texture d'écorce se replie en miroir
        this.vent.push(p.vent || 0);
        const t = p.teinte === undefined ? 1 : p.teinte;
        this.col.push(t, t, t); this.feuille.push(0);
      }
    }
    const l = cotes + 1;
    for (let i = 0; i < points.length - 1; i++) for (let k = 0; k < cotes; k++) {
      const v = base + i * l + k;
      this.idx.push(v, v + 1, v + l, v + 1, v + l + 1, v + l);
    }
  }

  /**
   * Carte de feuillage : bande partant de (x,y,z) dans la direction (dx,dy,dz),
   * qui s'affaisse (courbure > 0) ou se redresse (courbure < 0) vers son extrémité.
   * roulis : rotation de la bande autour de son axe (π/2 = bande verticale) ; deux cartes
   * croisées (roulis 0 et π/2) donnent une branche qui a du volume sous tous les angles.
   */
  carte(x, y, z, dx, dy, dz, longueur, largeur, segments, courbure, tuile, vent0, vent1, angleAxe = null, roulis = 0) {
    const u0 = (tuile + 0.02) / NB_TUILES, u1 = (tuile + 0.98) / NB_TUILES, base = this.n;
    let sx, sy = 0, sz;                            // axe de largeur
    if (angleAxe !== null) { sx = Math.cos(angleAxe); sz = Math.sin(angleAxe); }
    else { const l = Math.hypot(dx, dz) || 1; sx = -dz / l; sz = dx / l; }
    if (roulis) {
      // second axe perpendiculaire à la direction et à l'axe horizontal
      const vx = dy * sz, vy = dz * sx - dx * sz, vz = -dy * sx, c = Math.cos(roulis), s = Math.sin(roulis);
      sx = sx * c + vx * s; sy = vy * s; sz = sz * c + vz * s;
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const px = x + dx * longueur * t, py = y + dy * longueur * t - courbure * longueur * t * t, pz = z + dz * longueur * t;
      const w = largeur * 0.5;
      for (const cote of [-1, 1]) {
        this.pos.push(px + sx * w * cote, py + sy * w * cote, pz + sz * w * cote);
        this.nor.push(0, 1, 0);
        this.uv.push(cote < 0 ? u0 : u1, 0.01 + 0.98 * t);
        this.vent.push(vent0 + (vent1 - vent0) * t);
        this.col.push(1, 1, 1); this.feuille.push(1);
      }
    }
    for (let i = 0; i < segments; i++) { const v = base + i * 2; this.idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
  }

  /**
   * Finition : les feuilles reçoivent des normales « gonflées » (vers l'extérieur de la couronne
   * et vers le haut) pour un éclairage doux, et s'assombrissent près du tronc (ombre propre).
   */
  geometrie(ombreInterieure = 0.5) {
    let rMax = 0.001;
    for (let i = 0; i < this.n; i++) if (this.feuille[i]) rMax = Math.max(rMax, Math.hypot(this.pos[i * 3], this.pos[i * 3 + 2]));
    for (let i = 0; i < this.n; i++) {
      if (!this.feuille[i]) continue;
      const x = this.pos[i * 3], z = this.pos[i * 3 + 2], r = Math.hypot(x, z), k = r / rMax;
      let nx = x, ny = 0.55 * rMax + r * 0.35, nz = z; const l = Math.hypot(nx, ny, nz) || 1;
      this.nor[i * 3] = nx / l; this.nor[i * 3 + 1] = ny / l; this.nor[i * 3 + 2] = nz / l;
      const lum = 1 - ombreInterieure + ombreInterieure * Math.min(1, k * 1.25);
      this.col[i * 3] = lum; this.col[i * 3 + 1] = lum; this.col[i * 3 + 2] = lum;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aVent', new THREE.Float32BufferAttribute(this.vent, 1));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    return g;
  }
}

/** Couronne de frondes rayonnantes. */
function couronne(f, alea, y, n, elevation, longueur, largeur, segments, courbure, tuile, vent) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + alea() * 0.5, e = elevation + (alea() - 0.5) * 0.3;
    f.carte(0, y, 0, Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e),
      longueur * (0.85 + alea() * 0.3), largeur, segments, courbure * (0.8 + alea() * 0.4), tuile, vent * 0.25, vent);
  }
}

/** Branche de conifère : une carte à plat + une carte de chant, pour avoir du volume. */
function branche(f, y, a, pente, longueur, largeur, segments, courbure, vent, croisee) {
  const c = Math.cos(pente), dx = Math.cos(a) * c, dy = Math.sin(pente), dz = Math.sin(a) * c;
  f.carte(0, y, 0, dx, dy, dz, longueur, largeur, segments, courbure, TUILES.conifere, vent * 0.2, vent);
  if (croisee) f.carte(0, y, 0, dx, dy, dz, longueur, largeur * 0.8, segments, courbure, TUILES.conifere, vent * 0.2, vent, null, Math.PI / 2);
}

// Chaque fonction renvoie la géométrie d'une espèce. simple = true → version allégée (vue de loin).
export const FLORE = {
  /** Fougère arborescente (Cyathéales) : stipe fibreux et couronne de grandes frondes. */
  fougereArbo(simple) {
    const f = new Fabrique(), alea = creerAlea(11), h = 4.6;
    f.tube([{ x: 0, y: -0.3, z: 0, r: 0.27, teinte: 0.6 }, { x: 0.06, y: h * 0.5, z: 0.04, r: 0.19, vent: 0.03, teinte: 0.8 }, { x: 0.12, y: h, z: 0, r: 0.16, vent: 0.1 }], simple ? 4 : 7);
    couronne(f, alea, h, simple ? 8 : 12, 0.55, 3.1, 1.25, simple ? 2 : 5, 0.8, TUILES.fougere, 0.5);
    if (!simple) {
      couronne(f, alea, h + 0.05, 7, 1.05, 2.2, 1.0, 4, 0.55, TUILES.fougere, 0.4);        // jeunes frondes dressées
      couronne(f, alea, h - 0.2, 7, -1.0, 1.7, 0.85, 2, 0.2, TUILES.fougereMorte, 0.3);     // jupe de frondes mortes
    }
    return f.geometrie(0.35);
  },
  /** Cycadale / Bennettitale : tronc trapu, feuilles raides. */
  cycas(simple) {
    const f = new Fabrique(), alea = creerAlea(12);
    f.tube([{ x: 0, y: -0.2, z: 0, r: 0.28, teinte: 0.6 }, { x: 0, y: 0.5, z: 0, r: 0.35, teinte: 0.85 }, { x: 0, y: 1.05, z: 0, r: 0.2, vent: 0.02 }], simple ? 4 : 7);
    couronne(f, alea, 1.05, simple ? 9 : 16, 0.6, 2.0, 0.6, simple ? 2 : 4, 0.6, TUILES.cycas, 0.28);
    if (!simple) couronne(f, alea, 1.1, 9, 1.15, 1.5, 0.48, 3, 0.25, TUILES.cycas, 0.2);
    return f.geometrie(0.4);
  },
  /** Ginkgo : grand arbre à feuilles en éventail, large couronne. */
  ginkgo(simple) {
    const f = new Fabrique(), alea = creerAlea(13), h = 14;
    f.tube([{ x: 0, y: -0.5, z: 0, r: 0.55, teinte: 0.55 }, { x: 0.15, y: h * 0.3, z: 0.1, r: 0.4, vent: 0.01, teinte: 0.8 }, { x: -0.15, y: h * 0.62, z: 0.15, r: 0.26, vent: 0.04 }, { x: 0, y: h * 0.95, z: 0, r: 0.08, vent: 0.1 }], simple ? 4 : 7);
    const nb = simple ? 7 : 12;
    for (let i = 0; i < nb; i++) {
      const t = 0.3 + (i / nb) * 0.66, y = h * t, a = i * 2.4 + alea(), lon = 6.2 * (1.12 - t) + 2.2;
      const dx = Math.cos(a), dz = Math.sin(a), ex = dx * lon, ey = lon * 0.4, ez = dz * lon;
      if (!simple) f.tube([{ x: 0, y, z: 0, r: 0.15, vent: 0.03, teinte: 0.8 }, { x: ex * 0.55, y: y + ey * 0.45, z: ez * 0.55, r: 0.09, vent: 0.1 }, { x: ex, y: y + ey, z: ez, r: 0.03, vent: 0.2 }], 4);
      // bouquets de feuilles : petites cartes orientées dans tous les sens le long de la branche
      const cartes = simple ? 2 : 7;
      for (let k = 0; k < cartes; k++) {
        const s = 0.3 + (k / cartes) * 0.78, b = a + (alea() - 0.5) * 2.6, e = (alea() - 0.25) * 1.1;
        f.carte(ex * s + (alea() - 0.5), y + ey * s - 0.6, ez * s + (alea() - 0.5), Math.cos(b) * Math.cos(e), Math.sin(e), Math.sin(b) * Math.cos(e),
          simple ? 4.6 : 3.1, simple ? 3.8 : 2.5, 1, 0.12, TUILES.ginkgo, 0.15, 0.4, null, simple ? 0 : alea() * 3.14);
      }
    }
    if (!simple) for (let k = 0; k < 8; k++) {      // cime
      const b = k * 0.8 + alea(), e = 0.5 + alea() * 0.8;
      f.carte(0, h * 0.86, 0, Math.cos(b) * Math.cos(e), Math.sin(e), Math.sin(b) * Math.cos(e), 3, 2.4, 1, 0.1, TUILES.ginkgo, 0.2, 0.45, null, alea() * 3.14);
    }
    return f.geometrie(0.55);
  },
  /** Araucaria : long fût nu, branches en verticilles redressées à leur extrémité. */
  araucaria(simple) {
    const f = new Fabrique(), alea = creerAlea(14), h = 27;
    f.tube([{ x: 0, y: -0.5, z: 0, r: 0.7, teinte: 0.55 }, { x: 0, y: h * 0.4, z: 0, r: 0.48, vent: 0.005, teinte: 0.85 }, { x: 0.1, y: h * 0.8, z: 0, r: 0.28, vent: 0.03 }, { x: 0, y: h, z: 0, r: 0.08, vent: 0.07 }], simple ? 5 : 8);
    const etages = simple ? 3 : 9;
    for (let e = 0; e < etages; e++) {
      const t = 0.5 + (e / (etages - 1)) * 0.48, y = h * t, lon = 7.6 - (t - 0.5) * 10, nb = simple ? 4 : 6;
      for (let i = 0; i < nb; i++) {
        const a = (i / nb) * Math.PI * 2 + e * 0.9 + alea() * 0.3;
        branche(f, y, a, -0.2 + alea() * 0.1, lon * (0.85 + alea() * 0.3), simple ? 3.2 : 2.3, simple ? 1 : 4, simple ? -0.2 : -0.34, 0.3, !simple);
      }
    }
    couronne(f, alea, h - 0.3, simple ? 4 : 7, 0.9, 3.2, 1.9, 2, 0.1, TUILES.conifere, 0.2);
    return f.geometrie(0.6);
  },
  /** Grand conifère conique de type séquoia (Cupressacées primitives). */
  sequoia(simple) {
    const f = new Fabrique(), alea = creerAlea(15), h = 36;
    f.tube([{ x: 0, y: -0.6, z: 0, r: 1.25, teinte: 0.5 }, { x: 0, y: 2.5, z: 0, r: 0.9, teinte: 0.75 }, { x: 0, y: h * 0.5, z: 0, r: 0.52, vent: 0.01 }, { x: 0, y: h, z: 0, r: 0.06, vent: 0.06 }], simple ? 4 : 9);
    const etages = simple ? 5 : 14;
    for (let e = 0; e < etages; e++) {
      const t = 0.2 + (e / (etages - 1)) * 0.79, y = h * t, lon = 8.2 * Math.pow(1 - t, 0.75) + 1.4, nb = simple ? 3 : 5;
      for (let i = 0; i < nb; i++) {
        const a = (i / nb) * Math.PI * 2 + e * 1.3 + alea() * 0.5;
        branche(f, y + (alea() - 0.5) * 0.8, a, -0.3 + alea() * 0.12, lon * (0.8 + alea() * 0.35), simple ? 5 : 3.0, simple ? 1 : 3, simple ? 0.12 : 0.2, 0.26, !simple);
      }
    }
    return f.geometrie(0.6);
  },
  /** Fougère basse : c'est elle qui tapisse le sol, à la place de l'herbe. */
  fougere(simple) {
    const f = new Fabrique(), alea = creerAlea(16);
    couronne(f, alea, 0, simple ? 4 : 7, 0.8, 1.15, simple ? 0.6 : 0.48, simple ? 2 : 3, 0.95, TUILES.fougere, 0.6);
    if (!simple) couronne(f, alea, 0.02, 4, 1.2, 0.8, 0.4, 2, 0.4, TUILES.fougere, 0.5);
    return f.geometrie(0.45);
  },
  /** Prêle géante (Equisetum) : tiges segmentées des milieux humides. */
  prele(simple) {
    const f = new Fabrique(), nb = simple ? 2 : 3;
    for (let i = 0; i < nb; i++) f.carte(0, -0.1, 0, 0.03 * i, 1, 0.02, 2.1, 1.25, 1, 0, TUILES.prele, 0.1, 0.5, (i / nb) * Math.PI);
    return f.geometrie(0.15);
  },
  /** Tronc mort couché. */
  troncMort(simple) {
    const f = new Fabrique();
    f.tube([{ x: -3.2, y: 0.3, z: 0, r: 0.38 }, { x: 0, y: 0.36, z: 0.1, r: 0.34 }, { x: 3.4, y: 0.28, z: -0.1, r: 0.22 }], simple ? 4 : 7);
    return f.geometrie();
  },
  /** Rocher : sphère déformée, mousse sur le dessus (couleurs par sommet). */
  rocher(simple) {
    let g = new THREE.IcosahedronGeometry(1, simple ? 1 : 2);
    g.deleteAttribute('uv'); g.deleteAttribute('normal');
    g = mergeVertices(g);   // sommets partagés → ombrage lisse
    const b = new Bruit(99), P = g.attributes.position, couleurs = [];
    for (let i = 0; i < P.count; i++) {
      let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
      const d = 1 + b.bruit2(x * 1.3 + z, y * 1.3 - z) * 0.28 + b.bruit2(x * 3.1, z * 3.1 + y * 2.0) * 0.1;
      x *= d; y *= d * 0.72; z *= d;
      P.setXYZ(i, x, y, z);
      const mousse = Math.max(0, Math.min(1, (y - 0.25) * 2.2 + b.bruit2(x * 2, z * 2) * 0.5));
      const gris = 0.2 + b.bruit2(x * 4 + 7, z * 4 + y * 3) * 0.05;
      couleurs.push(gris * (1 - mousse) + 0.05 * mousse, gris * 0.95 * (1 - mousse) + 0.09 * mousse, gris * 0.86 * (1 - mousse) + 0.03 * mousse);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(couleurs, 3));
    g.computeVertexNormals();
    return g;
  },
};
