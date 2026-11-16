// Géométries procédurales de la flore du Jurassique supérieur.
// Aucune graminée (herbe) ni plante à fleurs : elles n'existaient pas encore.
// Chaque plante est fabriquée à partir de deux briques : des « tubes » (troncs, branches)
// et des « cartes » (bandes souples portant une image de fronde ou de rameau).
import * as THREE from 'three';
import { creerAlea, Bruit } from '../noyau/maths.js';
import { TUILES, NB_TUILES } from '../rendu/textures.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

class Fabrique {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.vent = []; this.idx = []; this.col = []; }
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
   */
  carte(x, y, z, dx, dy, dz, longueur, largeur, segments, courbure, tuile, vent0, vent1, angleAxe = null) {
    const u0 = (tuile + 0.02) / NB_TUILES, u1 = (tuile + 0.98) / NB_TUILES, base = this.n;
    let sx, sz;                                    // axe de largeur, horizontal
    if (angleAxe !== null) { sx = Math.cos(angleAxe); sz = Math.sin(angleAxe); }
    else { const l = Math.hypot(dx, dz) || 1; sx = -dz / l; sz = dx / l; }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const px = x + dx * longueur * t, py = y + dy * longueur * t - courbure * longueur * t * t, pz = z + dz * longueur * t;
      // tangente → normale de la bande, tirée vers le haut pour un éclairage doux
      const ty = dy - 2 * courbure * t;
      let nx = -(sz * ty), ny = sz * dx - sx * dz, nz = sx * ty;
      if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
      ny += 0.7; const nl = Math.hypot(nx, ny, nz);
      const w = largeur * 0.5;
      for (const cote of [-1, 1]) {
        this.pos.push(px + sx * w * cote, py, pz + sz * w * cote);
        this.nor.push(nx / nl, ny / nl, nz / nl);
        this.uv.push(cote < 0 ? u0 : u1, 0.01 + 0.98 * t);
        this.vent.push(vent0 + (vent1 - vent0) * t);
      }
    }
    for (let i = 0; i < segments; i++) { const v = base + i * 2; this.idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
  }

  geometrie() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aVent', new THREE.Float32BufferAttribute(this.vent, 1));
    if (this.col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
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

// Chaque fonction renvoie la géométrie d'une espèce. simple = true → version allégée (vue de loin).
export const FLORE = {
  /** Fougère arborescente (Cyathéales) : stipe fibreux et couronne de grandes frondes. */
  fougereArbo(simple) {
    const f = new Fabrique(), alea = creerAlea(11), h = 4.4;
    f.tube([{ x: 0, y: -0.3, z: 0, r: 0.24 }, { x: 0.05, y: h * 0.5, z: 0.03, r: 0.18, vent: 0.03 }, { x: 0.1, y: h, z: 0, r: 0.15, vent: 0.1 }], simple ? 4 : 6);
    couronne(f, alea, h, simple ? 7 : 13, 0.7, 2.7, 1.05, simple ? 2 : 4, 0.85, TUILES.fougere, 0.5);
    if (!simple) couronne(f, alea, h - 0.15, 5, -0.9, 1.5, 0.8, 2, 0.25, TUILES.fougereMorte, 0.3);
    return f.geometrie();
  },
  /** Cycadale / Bennettitale : tronc trapu, feuilles raides. */
  cycas(simple) {
    const f = new Fabrique(), alea = creerAlea(12);
    f.tube([{ x: 0, y: -0.2, z: 0, r: 0.26 }, { x: 0, y: 0.45, z: 0, r: 0.32 }, { x: 0, y: 0.95, z: 0, r: 0.2, vent: 0.02 }], simple ? 4 : 6);
    couronne(f, alea, 0.95, simple ? 8 : 15, 0.75, 1.75, 0.52, simple ? 2 : 3, 0.55, TUILES.cycas, 0.28);
    if (!simple) couronne(f, alea, 1.0, 5, 1.25, 1.2, 0.42, 2, 0.15, TUILES.cycas, 0.2);
    return f.geometrie();
  },
  /** Ginkgo : arbre à feuilles en éventail, déjà très répandu au Jurassique. */
  ginkgo(simple) {
    const f = new Fabrique(), alea = creerAlea(13), h = 11.5;
    f.tube([{ x: 0, y: -0.4, z: 0, r: 0.4 }, { x: 0.1, y: h * 0.35, z: 0.05, r: 0.3, vent: 0.01 }, { x: -0.1, y: h * 0.7, z: 0.1, r: 0.2, vent: 0.04 }, { x: 0, y: h, z: 0, r: 0.07, vent: 0.1 }], simple ? 4 : 6);
    const nb = simple ? 6 : 9;
    for (let i = 0; i < nb; i++) {
      const t = 0.38 + (i / nb) * 0.6, y = h * t, a = i * 2.4 + alea(), lon = 4.4 * (1.15 - t) + 1.2;
      const dx = Math.cos(a), dz = Math.sin(a), ex = dx * lon, ey = lon * 0.45, ez = dz * lon;
      if (!simple) f.tube([{ x: 0, y, z: 0, r: 0.11, vent: 0.03 }, { x: ex * 0.6, y: y + ey * 0.5, z: ez * 0.6, r: 0.07, vent: 0.1 }, { x: ex, y: y + ey, z: ez, r: 0.03, vent: 0.2 }], 3);
      const cartes = simple ? 2 : 5;
      for (let k = 0; k < cartes; k++) {
        const s = 0.35 + (k / cartes) * 0.7, b = a + (alea() - 0.5) * 2.2, e = 0.3 + alea() * 0.7;
        f.carte(ex * s, y + ey * s - 0.5, ez * s, Math.cos(b) * Math.cos(e), Math.sin(e), Math.sin(b) * Math.cos(e),
          simple ? 3.4 : 2.5, simple ? 2.6 : 1.9, 1, 0.1, TUILES.ginkgo, 0.15, 0.4);
      }
    }
    return f.geometrie();
  },
  /** Araucaria : long fût nu, branches en verticilles redressées à leur extrémité. */
  araucaria(simple) {
    const f = new Fabrique(), alea = creerAlea(14), h = 26;
    f.tube([{ x: 0, y: -0.5, z: 0, r: 0.6 }, { x: 0, y: h * 0.4, z: 0, r: 0.45, vent: 0.005 }, { x: 0.1, y: h * 0.8, z: 0, r: 0.28, vent: 0.03 }, { x: 0, y: h, z: 0, r: 0.08, vent: 0.07 }], simple ? 5 : 7);
    const etages = simple ? 3 : 7;
    for (let e = 0; e < etages; e++) {
      const t = 0.56 + (e / (etages - 1)) * 0.42, y = h * t, lon = 6.2 - (t - 0.56) * 8.5, nb = simple ? 4 : 6;
      for (let i = 0; i < nb; i++) {
        const a = (i / nb) * Math.PI * 2 + e * 0.9 + alea() * 0.3;
        f.carte(0, y, 0, Math.cos(a) * 0.98, -0.18, Math.sin(a) * 0.98, lon, simple ? 2.8 : 2.0, simple ? 1 : 3, simple ? -0.2 : -0.32, TUILES.conifere, 0.06, 0.3);
      }
    }
    couronne(f, alea, h - 0.3, 4, 1.0, 2.6, 1.6, 2, 0.1, TUILES.conifere, 0.2);
    return f.geometrie();
  },
  /** Grand conifère conique de type séquoia (Cupressacées primitives). */
  sequoia(simple) {
    const f = new Fabrique(), alea = creerAlea(15), h = 34;
    f.tube([{ x: 0, y: -0.6, z: 0, r: 1.05 }, { x: 0, y: 2.5, z: 0, r: 0.8 }, { x: 0, y: h * 0.5, z: 0, r: 0.5, vent: 0.01 }, { x: 0, y: h, z: 0, r: 0.06, vent: 0.06 }], simple ? 4 : 8);
    const etages = simple ? 5 : 12;
    for (let e = 0; e < etages; e++) {
      const t = 0.24 + (e / (etages - 1)) * 0.74, y = h * t, lon = 6.8 * Math.pow(1 - t, 0.7) + 1.3, nb = simple ? 3 : 5;
      for (let i = 0; i < nb; i++) {
        const a = (i / nb) * Math.PI * 2 + e * 1.3 + alea() * 0.4;
        f.carte(0, y, 0, Math.cos(a) * 0.96, -0.26, Math.sin(a) * 0.96, lon, simple ? 4.6 : 2.7, simple ? 1 : 2, simple ? 0.12 : 0.22, TUILES.conifere, 0.04, 0.26);
      }
    }
    return f.geometrie();
  },
  /** Fougère basse : c'est elle qui tapisse le sol, à la place de l'herbe. */
  fougere(simple) {
    const f = new Fabrique(), alea = creerAlea(16);
    couronne(f, alea, 0, simple ? 4 : 8, 0.85, 0.98, simple ? 0.5 : 0.4, simple ? 2 : 3, 1.0, TUILES.fougere, 0.6);
    return f.geometrie();
  },
  /** Prêle géante (Equisetum) : tiges segmentées des milieux humides. */
  prele(simple) {
    const f = new Fabrique(), nb = simple ? 2 : 3;
    for (let i = 0; i < nb; i++) f.carte(0, -0.1, 0, 0.03 * i, 1, 0.02, 2.1, 1.25, 1, 0, TUILES.prele, 0.1, 0.5, (i / nb) * Math.PI);
    return f.geometrie();
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
