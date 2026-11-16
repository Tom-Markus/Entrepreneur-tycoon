// Mode photo : le temps s'arrête, la caméra devient libre, on règle le cadrage,
// la mise au point et un filtre, puis on enregistre l'image (PNG).
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { borner } from '../noyau/maths.js';

export const FILTRES = ['Naturel', 'Sépia', 'Noir et blanc', 'Chaud', 'Froid', 'Pellicule ancienne'];

export class ModePhoto {
  constructor(jeu) {
    this.jeu = jeu; this.actif = false;
    this.lacet = 0; this.tangage = 0; this.roulis = 0;
    this.champ = 50; this.focus = 12; this.flou = 0.5; this.filtre = 0;
    this._e = new THREE.Euler(0, 0, 0, 'YXZ'); this._v = new THREE.Vector3();
  }

  entrer() {
    const jeu = this.jeu, cam = jeu.camera;
    this.actif = true; jeu.etat = 'photo'; jeu.cameraJeu.mode = 'libre';
    this._e.setFromQuaternion(cam.quaternion, 'YXZ');
    this.lacet = this._e.y; this.tangage = this._e.x; this.roulis = 0;
    this.champ = cam.fov; this.focus = jeu.cameraJeu.distance;
    jeu.entrees.liberer(); jeu.entrees.glisser = false;
    jeu.ui.montrerPhoto(true);
  }

  sortir() {
    const jeu = this.jeu;
    this.actif = false; jeu.etat = 'jeu'; jeu.cameraJeu.mode = 'suivi';
    jeu.camera.fov = CONFIG.camera.champVision; jeu.camera.updateProjectionMatrix();
    jeu.post.filtre = 0; jeu.post.dofForce = 0;
    jeu.ui.montrerPhoto(false);
    jeu.entrees.verrouiller();
  }

  mettreAJour(dtReel) {
    const jeu = this.jeu, e = jeu.entrees, cam = jeu.camera;
    // regarder : clic maintenu + déplacement de la souris, ou stick droit
    e.glisser = e.enfoncees.has('Souris0') || e.enfoncees.has('Souris2');
    this.lacet -= e.sourisX * 0.003 + e.camX * dtReel * 1.8;
    this.tangage = borner(this.tangage - e.sourisY * 0.003 - e.camY * dtReel * 1.8, -1.5, 1.5);
    this.focus = borner(this.focus * (1 + e.molette * 0.08), 0.5, 300);
    this._e.set(this.tangage, this.lacet, this.roulis, 'YXZ');
    cam.quaternion.setFromEuler(this._e);
    const v = CONFIG.camera.vitessePhoto * (e.actif('sprint') ? 3 : 1) * dtReel;
    const av = (e.actif('avancer') ? 1 : 0) - (e.actif('reculer') ? 1 : 0) - e.axeY, lat = (e.actif('droite') ? 1 : 0) - (e.actif('gauche') ? 1 : 0) + e.axeX;
    const haut = (e.actif('esquive') ? 1 : 0) - (e.enfoncees.has('KeyC') ? 1 : 0);
    this._v.set(lat, 0, -av).applyQuaternion(cam.quaternion).multiplyScalar(v);
    cam.position.add(this._v); cam.position.y += haut * v;
    const sol = Math.max(jeu.terrain.hauteur(cam.position.x, cam.position.z), 0) + 0.2;
    if (cam.position.y < sol) cam.position.y = sol;
    // on reste à proximité du dinosaure
    const c = jeu.joueur.creature; this._v.set(cam.position.x - c.x, 0, cam.position.z - c.z);
    if (this._v.length() > 120) { this._v.setLength(120); cam.position.x = c.x + this._v.x; cam.position.z = c.z + this._v.z; }
    if (Math.abs(cam.fov - this.champ) > 0.01) { cam.fov = this.champ; cam.updateProjectionMatrix(); }
    jeu.post.filtre = this.filtre; jeu.post.dofForce = this.flou; jeu.post.dofFocus = this.focus;
  }

  /** Enregistre l'image affichée (à appeler juste après le rendu). */
  capturer() {
    const jeu = this.jeu;
    const noms = jeu.carnet.photographier(jeu.camera);
    jeu.rendre();                                    // rendu immédiat : le canvas contient l'image à cet instant
    jeu.renderer.domElement.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a'), d = new Date();
      const p = (n) => String(n).padStart(2, '0');
      a.download = `allosaure-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.png`;
      a.href = URL.createObjectURL(blob); a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
    jeu.audio.declic();
    jeu.ui.flashPhoto();
    jeu.ui.notifier(noms.length ? 'Photo enregistrée · fiche validée : ' + noms.join(', ') : 'Photo enregistrée', 'photo');
  }
}
