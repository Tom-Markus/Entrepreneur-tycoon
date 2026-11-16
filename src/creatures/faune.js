// Petite faune : ptérosaures (Rhamphorhynchus), poissons et libellules.
// Chacun de ces groupes est dessiné en une seule commande (instancing) et suit des
// trajectoires simples : vol plané en cercles, pêche en rase-mottes, bancs, vol stationnaire.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG } from '../config.js';
import { LIEUX } from '../monde/terrain.js';

const E = CONFIG.ecosysteme;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
const _e = new THREE.Euler(), _m2 = new THREE.Matrix4(), _zero = new THREE.Matrix4().makeScale(0, 0, 0);

/** Colore uniformément une géométrie (couleurs par sommet). */
function teinter(geo, r, v, b) {
  const n = geo.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = r; c[i * 3 + 1] = v; c[i * 3 + 2] = b; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo.toNonIndexed();
}

function geometrieCorpsPtero() {
  // corps fuselé, long museau denté, longue queue terminée par un losange (caractéristique du genre)
  const corps = teinter(new THREE.SphereGeometry(1, 8, 6).scale(0.07, 0.065, 0.19), 0.13, 0.1, 0.08);
  const tete = teinter(new THREE.ConeGeometry(0.035, 0.2, 6).rotateX(Math.PI / 2).translate(0, 0.02, 0.3), 0.16, 0.12, 0.08);
  const queue = teinter(new THREE.CylinderGeometry(0.006, 0.014, 0.5, 4).rotateX(Math.PI / 2).translate(0, 0, -0.42), 0.12, 0.09, 0.07);
  const losange = teinter(new THREE.CircleGeometry(0.06, 4).rotateY(Math.PI / 2).scale(1, 0.8, 1.4).translate(0, 0, -0.7), 0.28, 0.12, 0.08);
  return mergeGeometries([corps, tete, queue, losange]);
}

function geometrieAile() {
  // membrane tendue entre le bras, le très long quatrième doigt et le flanc (aile gauche, vers +X)
  const P = { e: [0, 0, 0.06], c: [0.4, 0, 0.14], p: [0.92, 0, -0.04], m: [0.4, 0, -0.2], f: [0, 0, -0.2] };
  const tri = [P.e, P.c, P.m, P.e, P.m, P.f, P.c, P.p, P.m];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tri.flat(), 3));
  g.computeVertexNormals();
  const n = tri.length, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { c[i * 3] = 0.2; c[i * 3 + 1] = 0.13; c[i * 3 + 2] = 0.09; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

export class Faune {
  constructor(jeu) {
    this.jeu = jeu;
    const mat = jeu.ombres.enregistrer(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    const T = jeu.terrain;
    const creer = (geo, n) => { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); jeu.scene.add(m); return m; };

    // ---- Rhamphorhynchus ----
    const nP = E.rhamphorhynchus;
    this.corpsP = creer(geometrieCorpsPtero(), nP);
    this.aileG = creer(geometrieAile(), nP);
    this.aileD = creer(geometrieAile().scale(-1, 1, 1), nP);
    this.pteros = [];
    for (let i = 0; i < nP; i++) {
      const surLac = i < nP * 0.6;
      this.pteros.push({
        espece: 'rhamphorhynchus', x: 0, y: 30, z: 0, comportement: 'vol', vivant: true, anime: true, distJoueur: 1e9,
        cx: surLac ? LIEUX.lac.x : -640, cz: surLac ? LIEUX.lac.z : 620, rayon: 50 + Math.random() * 90, angle: Math.random() * 6.28,
        alt: 14 + Math.random() * 26, sens: Math.random() < 0.5 ? 1 : -1, vit: 9 + Math.random() * 3, t: Math.random() * 30, tPeche: 20 + Math.random() * 60,
        etat: 'vol', perchoir: null, cap: 0, y0: 0, def: { longueur: 1.2, rayon: 0.3 }, c: { echelle: 1 },
      });
    }

    // ---- Poissons : quelques bancs dans le lac, la rivière et près de la côte ----
    const geoPoisson = mergeGeometries([
      teinter(new THREE.SphereGeometry(1, 6, 5).scale(0.045, 0.085, 0.22), 0.3, 0.32, 0.28),
      teinter(new THREE.ConeGeometry(0.07, 0.12, 4).rotateX(-Math.PI / 2).scale(0.3, 1, 1).translate(0, 0, -0.26), 0.22, 0.24, 0.2),
    ]);
    this.maillePoissons = creer(geoPoisson, E.poissons);
    this.bancs = [];
    const centres = [[LIEUX.lac.x, LIEUX.lac.z], [LIEUX.lac.x + 70, LIEUX.lac.z - 40], [LIEUX.lac.x - 60, LIEUX.lac.z + 50], [-480, 120], [-560, 380], [-700, 600], [150, -330]];
    for (const [x, z] of centres) {
      // on décale le centre jusqu'à trouver assez de fond
      let bx = x, bz = z;
      for (let k = 0; k < 30 && T.hauteur(bx, bz) > -1.2; k++) { bx = x + (Math.random() - 0.5) * 60; bz = z + (Math.random() - 0.5) * 60; }
      if (T.hauteur(bx, bz) < -0.8) this.bancs.push({ espece: 'poisson', x: bx, z: bz, y: -0.6, ox: bx, oz: bz, t: Math.random() * 100, comportement: 'nage', vivant: true, anime: true, distJoueur: 1e9, vides: 0, def: { longueur: 3, rayon: 2 }, c: { echelle: 1 } });
    }
    this.poissons = [];
    for (let i = 0; i < E.poissons; i++) this.poissons.push({ banc: this.bancs[i % Math.max(1, this.bancs.length)], a: Math.random() * 6.28, r: 0.6 + Math.random() * 3, v: 0.5 + Math.random() * 0.6, h: Math.random(), cache: 0 });

    // ---- Libellules : près des berges d'eau douce ----
    const geoLib = mergeGeometries([
      teinter(new THREE.CylinderGeometry(0.006, 0.004, 0.11, 4).rotateX(Math.PI / 2), 0.1, 0.25, 0.3),
      teinter(new THREE.PlaneGeometry(0.2, 0.03).rotateX(-Math.PI / 2).translate(0, 0.005, 0.025), 0.75, 0.8, 0.8),
      teinter(new THREE.PlaneGeometry(0.17, 0.028).rotateX(-Math.PI / 2).translate(0, 0.005, -0.005), 0.75, 0.8, 0.8),
    ]);
    this.mailleLib = creer(geoLib, E.libellules);
    this.libellules = [];
    const eaux = T.pointsEau;
    for (let i = 0; i < E.libellules && eaux.length; i++) {
      const p = eaux[Math.floor(Math.random() * eaux.length)];
      this.libellules.push({ espece: 'libellule', hx: p.x, hz: p.z, x: p.x, y: 1, z: p.z, tx: p.x, ty: 1, tz: p.z, t: Math.random() * 2, cap: 0, comportement: 'vol', vivant: true, anime: true, distJoueur: 1e9, def: { longueur: 0.4, rayon: 0.2 }, c: { echelle: 1 } });
    }
    this.mailleLib.count = this.libellules.length;
    this.observables = [...this.pteros, ...this.bancs];
    if (this.libellules.length) this.observables.push(this.libellules[0], this.libellules[Math.floor(this.libellules.length / 2)]);
  }

  /** Le joueur tente d'attraper un poisson : vrai si un banc est à portée. */
  pecher(x, z, rayon) {
    for (const b of this.bancs) {
      if (Math.hypot(b.x - x, b.z - z) < rayon + 3 && b.vides < 6) {
        b.vides += 2; b.ox = b.x; b.oz = b.z;
        this.jeu.planifier(120, () => { b.vides = Math.max(0, b.vides - 2); });
        return true;
      }
    }
    return false;
  }

  mettreAJour(dt, temps) {
    const jeu = this.jeu, T = jeu.terrain, jc = jeu.joueur.creature, nuit = jeu.ciel.jour < 0.2;
    // ---------------- Rhamphorhynchus ----------------
    for (let i = 0; i < this.pteros.length; i++) {
      const p = this.pteros[i];
      p.t += dt; p.tPeche -= dt;
      let battement = 0, roulis = 0, tangage = 0;
      if (nuit && p.etat !== 'perche') {
        // la nuit : se poser sur la berge
        if (!p.perchoir) { const e = T.eauLaPlusProche(p.cx + Math.cos(i) * 120, p.cz + Math.sin(i) * 120) || { x: p.cx, z: p.cz }; p.perchoir = { x: e.x + Math.cos(i * 2.1) * 6, z: e.z + Math.sin(i * 2.1) * 6 }; }
        const dx = p.perchoir.x - p.x, dz = p.perchoir.z - p.z, d = Math.hypot(dx, dz), sol = Math.max(0, T.hauteur(p.perchoir.x, p.perchoir.z)) + 0.12;
        if (d < 1.5 && p.y < sol + 1) { p.etat = 'perche'; p.x = p.perchoir.x; p.z = p.perchoir.z; p.y = sol; }
        else { const v = Math.min(p.vit, d * 0.8 + 1) * dt / Math.max(d, 0.01); p.x += dx * v; p.z += dz * v; p.y += (sol + Math.min(20, d * 0.3) - p.y) * Math.min(1, dt * 1.2); p.cap = Math.atan2(dx, dz); battement = Math.sin(p.t * 11) * 0.55; }
        p.comportement = 'vol';
      } else if (p.etat === 'perche') {
        p.comportement = 'dort'; battement = -1.25;       // ailes repliées
        if (!nuit) { p.etat = 'vol'; p.perchoir = null; p.angle = Math.atan2(p.z - p.cz, p.x - p.cx); }
      } else {
        // vol en cercles ; de temps en temps, descente en rase-mottes pour pêcher
        if (p.tPeche <= 0 && p.etat === 'vol') { p.etat = 'peche'; p.tEtat = 0; }
        let altCible = p.alt + Math.sin(p.t * 0.21 + i) * 5;
        if (p.etat === 'peche') {
          p.tEtat += dt; altCible = 0.45; p.comportement = 'peche';
          if (p.tEtat > 9) { p.etat = 'vol'; p.tPeche = 35 + Math.random() * 70; }
          if (p.y < 0.8 && !p.touche && T.hauteur(p.x, p.z) < -0.2) { p.touche = true; jeu.eau.ajouterOnde(p.x, p.z, 0.5, jeu.tempsReel); if (p.distJoueur < 90) jeu.particules.emettre('eclaboussure', p.x, 0.1, p.z, 6, 0.6); }
        } else { p.comportement = 'vol'; p.touche = false; }
        p.angle += (p.sens * p.vit * dt) / p.rayon;
        const nx = p.cx + Math.cos(p.angle) * p.rayon, nz = p.cz + Math.sin(p.angle) * p.rayon;
        p.cap = Math.atan2(nx - p.x, nz - p.z);
        const yAvant = p.y;
        p.x = nx; p.z = nz;
        p.y += (Math.max(altCible, Math.max(0, T.hauteur(nx, nz)) + 0.4) - p.y) * Math.min(1, dt * 0.55);
        tangage = -(p.y - yAvant) / Math.max(dt, 1e-3) * 0.06;
        const plane = Math.sin(p.t * 0.5 + i * 1.7) > 0.25 && p.etat === 'vol';     // alterne battements et vol plané
        battement = plane ? 0.12 : Math.sin(p.t * 10) * 0.6;
        roulis = -p.sens * 0.35;
      }
      p.distJoueur = Math.hypot(p.x - jc.x, p.z - jc.z);
      _e.set(tangage, p.cap, roulis, 'YXZ'); _q.setFromEuler(_e);
      _m.compose(_p.set(p.x, p.y, p.z), _q, _s.set(1, 1, 1));
      this.corpsP.setMatrixAt(i, _m);
      _m2.makeRotationZ(battement).setPosition(0.05, 0.02, 0); this.aileG.setMatrixAt(i, _m2.premultiply(_m));
      _m2.makeRotationZ(-battement).setPosition(-0.05, 0.02, 0); this.aileD.setMatrixAt(i, _m2.premultiply(_m));
    }
    this.corpsP.instanceMatrix.needsUpdate = this.aileG.instanceMatrix.needsUpdate = this.aileD.instanceMatrix.needsUpdate = true;

    // ---------------- Poissons ----------------
    for (const b of this.bancs) {
      b.t += dt;
      // le banc dérive lentement autour de son point d'origine, en restant en eau assez profonde
      const nx = b.ox + Math.sin(b.t * 0.05) * 14, nz = b.oz + Math.cos(b.t * 0.037) * 14;
      if (T.hauteur(nx, nz) < -0.9) { b.x = nx; b.z = nz; }
      b.distJoueur = Math.hypot(b.x - jc.x, b.z - jc.z);
      b.y = -0.5;
    }
    for (let i = 0; i < this.poissons.length; i++) {
      const f = this.poissons[i], b = f.banc;
      if (!b || b.distJoueur > 160 || i % 10 < b.vides) { this.maillePoissons.setMatrixAt(i, _zero); continue; }
      f.a += (f.v * dt) / f.r * 1.4;
      const x = b.x + Math.cos(f.a) * f.r, z = b.z + Math.sin(f.a) * f.r * 0.7;
      const fond = T.hauteur(x, z), y = Math.max(fond + 0.15, -0.35 - f.h * 1.3);
      if (y > -0.12) { this.maillePoissons.setMatrixAt(i, _zero); continue; }
      _e.set(0, -f.a + Math.sin(temps * 9 + i) * 0.25, 0); _q.setFromEuler(_e);
      _m.compose(_p.set(x, y, z), _q, _s.setScalar(0.7 + f.h * 0.8));
      this.maillePoissons.setMatrixAt(i, _m);
    }
    this.maillePoissons.instanceMatrix.needsUpdate = true;

    // ---------------- Libellules ----------------
    const actives = jeu.ciel.jour > 0.4 && jeu.meteo.pluie < 0.3;
    this.mailleLib.visible = actives;
    if (actives) {
      for (let i = 0; i < this.libellules.length; i++) {
        const l = this.libellules[i];
        l.t -= dt;
        if (l.t <= 0) {       // nouveau point de vol stationnaire
          l.t = 0.6 + Math.random() * 2.2;
          l.tx = l.hx + (Math.random() - 0.5) * 14; l.tz = l.hz + (Math.random() - 0.5) * 14;
          l.ty = Math.max(0, T.hauteur(l.tx, l.tz)) + 0.4 + Math.random() * 1.6;
          l.cap = Math.atan2(l.tx - l.x, l.tz - l.z);
        }
        const k = Math.min(1, dt * 5);
        l.x += (l.tx - l.x) * k; l.y += (l.ty - l.y) * k; l.z += (l.tz - l.z) * k;
        l.distJoueur = Math.hypot(l.x - jc.x, l.z - jc.z);
        _e.set(0, l.cap, Math.sin(temps * 70 + i) * 0.25); _q.setFromEuler(_e);
        _m.compose(_p.set(l.x, l.y + Math.sin(temps * 3 + i) * 0.04, l.z), _q, _s.set(1, 1, 1));
        this.mailleLib.setMatrixAt(i, _m);
      }
      this.mailleLib.instanceMatrix.needsUpdate = true;
    }
  }
}
