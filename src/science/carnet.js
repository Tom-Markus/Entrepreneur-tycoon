// Carnet de bord : fiches d'espèces débloquées par l'observation, comportements à documenter.
// Observer = avoir l'animal dans le champ de la caméra, assez près, pendant quelques secondes.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { FICHES, FLORE_FICHES, OBSERVATIONS, SEUILS } from './fiches.js';
import { ESPECES_FLORE } from '../monde/vegetation.js';

const E = CONFIG.ecosysteme, J = CONFIG.joueur;
const _v = new THREE.Vector3();

export class Carnet {
  constructor(jeu) { this.jeu = jeu; this.reinitialiser(); }

  reinitialiser() {
    this.temps = {};          // espèce → secondes d'observation
    this.sections = {};       // espèce → nombre de sections débloquées
    this.photos = {};         // espèce → photographiée
    this.valides = {};        // comportement → validé
    this.progres = {};        // comportement → secondes en cours
    this.flore = {};          // plante → secondes passées à proximité
    this.enCours = null;      // { espece, titre, ratio } affiché par l'interface
    this.tFlore = 0;
  }
  exporter() { return { temps: this.temps, sections: this.sections, photos: this.photos, valides: this.valides, flore: this.flore }; }
  importer(d) { this.reinitialiser(); Object.assign(this, { temps: d.temps || {}, sections: d.sections || {}, photos: d.photos || {}, valides: d.valides || {}, flore: d.flore || {} }); }

  get nbValides() { return Object.keys(this.valides).length; }
  get nbSections() { let n = 0; for (const k in this.sections) n += this.sections[k]; return n; }
  sectionsFlore(id) { const t = this.flore[id] || 0; return t > 45 ? 3 : t > 18 ? 2 : t > 4 ? 1 : 0; }

  /** L'animal est-il visible à l'écran et à portée d'observation ? */
  _observable(o, camera, portee) {
    if (o.distJoueur > portee * Math.min(1.8, 0.55 + o.def.longueur / 8) || o.anime === false) return false;
    _v.set(o.x, o.y + o.def.longueur * 0.12, o.z).project(camera);
    return _v.z < 1 && Math.abs(_v.x) < 0.9 && Math.abs(_v.y) < 0.9;
  }

  _debloquer(espece, n) {
    const avant = this.sections[espece] || 0;
    if (n <= avant) return;
    this.sections[espece] = n;
    const jeu = this.jeu, f = FICHES[espece];
    jeu.joueur.grandir((n - avant) * J.croissanceParFiche);
    jeu.ui.notifier(avant === 0 ? 'Nouvelle espèce : ' + f.nom : 'Carnet complété : ' + f.nom + ' (' + n + '/6)', 'carnet');
    jeu.audio.carillon();
  }

  _valider(obs) {
    if (this.valides[obs.id]) return;
    this.valides[obs.id] = true;
    const jeu = this.jeu;
    jeu.joueur.grandir(J.croissanceParObservation);
    let extra = '';
    if (this.nbValides % 2 === 0) { jeu.joueur.points++; extra = ' · +1 point de compétence'; }
    jeu.ui.annoncer('Observation validée : ' + obs.titre, obs.texte + extra);
    jeu.audio.carillon();
    jeu.sauvegarder();
  }

  /** Événements liés au joueur lui-même (première chasse…). */
  signalerAction(action) { for (const o of OBSERVATIONS) if (o.action === action) this._valider(o); }

  mettreAJour(dt, camera) {
    const jeu = this.jeu;
    this.enCours = null;
    let meilleur = 1e9;
    const vus = this._vus || (this._vus = {});
    for (const k in vus) vus[k] = false;
    const traiter = (o) => {
      if (!FICHES[o.espece] || !this._observable(o, camera, E.porteeObservation)) return;
      // fiche de l'espèce
      const t = (this.temps[o.espece] = (this.temps[o.espece] || 0) + dt * (o.vivant ? 1 : 0.5));
      let n = 0; while (n < SEUILS.length && t >= SEUILS[n]) n++;
      this._debloquer(o.espece, n);
      // comportement en cours
      for (const obs of OBSERVATIONS) {
        if (!obs.etat || obs.etat !== o.comportement || this.valides[obs.id] || (obs.especes && !obs.especes.includes(o.espece))) continue;
        if (!vus[obs.id]) { vus[obs.id] = true; this.progres[obs.id] = (this.progres[obs.id] || 0) + dt; }
        if (o.distJoueur < meilleur) { meilleur = o.distJoueur; this.enCours = { espece: FICHES[o.espece].nom, titre: obs.titre, ratio: Math.min(1, this.progres[obs.id] / E.tempsObservation) }; }
        if (this.progres[obs.id] >= E.tempsObservation) this._valider(obs);
      }
    };
    for (const a of jeu.ecosysteme.animaux) traiter(a);
    for (const o of jeu.faune.observables) traiter(o);
    for (const obs of OBSERVATIONS) if (obs.etat && !vus[obs.id] && this.progres[obs.id] > 0) this.progres[obs.id] = Math.max(0, this.progres[obs.id] - dt * 0.5);
    // La fiche de l'Allosaurus se remplit aussi en vivant sa vie
    this.temps.allosaurus = (this.temps.allosaurus || 0) + dt * 0.12;
    let n = 0; while (n < SEUILS.length && this.temps.allosaurus >= SEUILS[n]) n++;
    this._debloquer('allosaurus', n);
    // Flore : on apprend à connaître les plantes en les côtoyant
    this.tFlore += dt;
    if (this.tFlore > 1) {
      this.tFlore = 0;
      const c = jeu.joueur.creature, masque = jeu.vegetation.especesIci(c.x, c.z);
      ESPECES_FLORE.forEach((esp, i) => {
        if (!(masque & (1 << i)) || !FLORE_FICHES[esp.id]) return;
        const avant = this.sectionsFlore(esp.id);
        this.flore[esp.id] = (this.flore[esp.id] || 0) + 1;
        if (this.sectionsFlore(esp.id) > avant && avant === 0) jeu.ui.notifier('Nouvelle plante : ' + FLORE_FICHES[esp.id].nom, 'carnet');
      });
    }
  }

  /** Mode photo : toute espèce présente dans le cadre voit sa fiche validée. Renvoie les noms. */
  photographier(camera) {
    const jeu = this.jeu, noms = [];
    const traiter = (o) => {
      if (!FICHES[o.espece] || !this._observable(o, camera, 170)) return;
      if (!this.photos[o.espece]) { this.photos[o.espece] = true; noms.push(FICHES[o.espece].nom); }
      this.temps[o.espece] = Math.max(this.temps[o.espece] || 0, SEUILS[SEUILS.length - 1]);
      this._debloquer(o.espece, SEUILS.length);
      for (const obs of OBSERVATIONS) if (obs.etat && obs.etat === o.comportement && (!obs.especes || obs.especes.includes(o.espece))) this._valider(obs);
    };
    for (const a of jeu.ecosysteme.animaux) traiter(a);
    for (const o of jeu.faune.observables) traiter(o);
    return noms;
  }
}
