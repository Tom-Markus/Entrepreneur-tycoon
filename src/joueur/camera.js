// Caméra à la troisième personne : orbite fluide autour du dinosaure, évite le sol,
// tremble légèrement sous les pas des géants, et propose un mode cinématique automatique.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { amortir, borner } from '../noyau/maths.js';

const C = CONFIG.camera;

export class CameraJeu {
  constructor(camera, entrees, terrain) {
    this.camera = camera; this.entrees = entrees; this.terrain = terrain;
    this.lacet = 2.6; this.tangage = 0.22; this.zoom = 1;
    this.mode = 'titre';              // 'suivi' | 'cinematique' | 'titre' | 'libre' (mode photo)
    this.cible = new THREE.Vector3(); this.distance = 8; this.secousse = 0;
    this.sensibilite = 1; this.inverserY = false;
    this.tCine = 0; this.init = false;
    this._v = new THREE.Vector3();
  }

  secouer(force) { this.secousse = Math.min(1.2, this.secousse + force); }

  mettreAJour(dt, joueur, tempsReel) {
    const cam = this.camera, e = this.entrees, T = this.terrain;
    if (this.mode === 'libre') return;       // le mode photo pilote lui-même la caméra
    const s = joueur.creature.echelle;
    let distCible = (C.distance * s + 2) * this.zoom, hauteur = C.hauteurCible * s, fov = C.champVision, raideur = C.lissage;
    if (this.mode === 'suivi') {
      const sens = C.sensibilite * this.sensibilite;
      this.lacet -= e.sourisX * sens + e.camX * C.sensibiliteManette * this.sensibilite * dt;
      this.tangage += (e.sourisY * sens + e.camY * C.sensibiliteManette * this.sensibilite * dt) * (this.inverserY ? -1 : 1);
      this.zoom = borner(this.zoom + e.molette * 0.08, 0.55, 2.2);
      fov += borner(joueur.creature.vitesse / 12, 0, 1) * 5;
    } else if (this.mode === 'cinematique') {
      this.tCine += dt;
      this.lacet += dt * 0.11; this.tangage = 0.16 + Math.sin(this.tCine * 0.13) * 0.14;
      distCible *= 1.5 + Math.sin(this.tCine * 0.07) * 0.4; fov = 40; raideur = 2.5;
    } else {                                 // écran-titre : lent survol du paysage
      this.tCine += dt;
      this.lacet += dt * 0.035; this.tangage = 0.2; distCible = 26 + s * 6; hauteur = 3.2; fov = 46; raideur = 2;
    }
    this.tangage = borner(this.tangage, C.angleMin, C.angleMax);
    // point regardé (lissé) : au-dessus des hanches
    const c = joueur.creature;
    this._v.set(c.x, c.y + hauteur, c.z);
    if (!this.init) { this.cible.copy(this._v); this.distance = distCible; this.init = true; }
    this.cible.x = amortir(this.cible.x, this._v.x, raideur * 2.2, dt);
    this.cible.z = amortir(this.cible.z, this._v.z, raideur * 2.2, dt);
    this.cible.y = amortir(this.cible.y, this._v.y, raideur, dt);
    // direction caméra → cible
    const cp = Math.cos(this.tangage), dx = Math.sin(this.lacet) * cp, dy = -Math.sin(this.tangage), dz = Math.cos(this.lacet) * cp;
    // le relief ne doit pas s'intercaler : on raccourcit la distance si nécessaire
    let dMax = distCible;
    for (let i = 1; i <= 6; i++) {
      const d = (distCible * i) / 6, px = this.cible.x - dx * d, pz = this.cible.z - dz * d, py = this.cible.y - dy * d;
      const sol = Math.max(T.hauteur(px, pz), 0) + 0.35;
      if (py < sol) { dMax = Math.max(1.5 * s + 0.6, d - distCible / 6); break; }
    }
    this.distance = dMax < this.distance ? amortir(this.distance, dMax, 18, dt) : amortir(this.distance, dMax, 2.5, dt);
    cam.position.set(this.cible.x - dx * this.distance, this.cible.y - dy * this.distance, this.cible.z - dz * this.distance);
    const sol = Math.max(T.hauteur(cam.position.x, cam.position.z), 0) + 0.3;
    if (cam.position.y < sol) cam.position.y = sol;
    cam.lookAt(this.cible);
    // tremblement
    if (this.secousse > 0.001) {
      const f = this.secousse * 0.06;
      cam.position.x += Math.sin(tempsReel * 71) * f; cam.position.y += Math.sin(tempsReel * 93 + 1) * f;
      cam.rotation.z += Math.sin(tempsReel * 57) * f * 0.12;
      this.secousse *= Math.exp(-dt * 6);
    }
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = amortir(cam.fov, fov, 3, dt); cam.updateProjectionMatrix(); }
  }

  /** Direction horizontale « devant la caméra » (pour des commandes relatives à la vue). */
  get avantX() { return Math.sin(this.lacet); }
  get avantZ() { return Math.cos(this.lacet); }
}
