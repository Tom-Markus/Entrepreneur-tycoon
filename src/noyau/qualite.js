// Qualité graphique : quatre niveaux, test de performance automatique au premier lancement,
// et résolution dynamique (on réduit un peu la netteté si les images/s chutent).
import { CONFIG } from '../config.js';
import { borner } from './maths.js';

const Q = CONFIG.qualite;

export class Qualite {
  constructor(jeu) {
    this.jeu = jeu; this.niveau = 'moyen';
    this.dynamique = true; this.echelleDyn = 1;
    this.fps = 60; this.cumul = 0; this.images = 0; this.tMesure = 0; this.tStable = 0;
    this.mesure = null;       // benchmark en cours
  }
  get reglages() { return Q.niveaux[this.niveau]; }

  /** Applique un niveau à tous les systèmes du jeu. */
  appliquer(niveau) {
    const jeu = this.jeu;
    this.niveau = niveau; this.echelleDyn = 1;
    const q = this.reglages;
    jeu.terrain.reglerQualite(q); jeu.ciel.reglerQualite(q); jeu.eau.reglerQualite(q);
    jeu.vegetation.reglerQualite(q); jeu.ambiance.reglerQualite(q);
    jeu.post.reglerQualite(q);
    jeu.ombres.configurer(q.cascades, q.tailleOmbre, q.porteeOmbre, q.frequenceOmbres);
    jeu.redimensionner();
  }

  /** Lance le test de 3 secondes ; `fin(niveau)` est appelé avec le niveau recommandé. */
  lancerBenchmark(fin) { this.mesure = { t: 0, images: 0, fin }; }

  /** À appeler à chaque image avec la durée réelle de l'image. */
  mettreAJour(dtReel) {
    this.cumul += dtReel; this.images++;
    if (this.cumul >= 0.5) { this.fps = this.images / this.cumul; this.cumul = 0; this.images = 0; }
    if (this.mesure) {
      const m = this.mesure;
      m.t += dtReel;
      if (m.t > 1) m.images++;                       // la 1re seconde (compilation des shaders) est ignorée
      if (m.t >= Q.dureeBenchmark) {
        const fps = m.images / (m.t - 1);
        this.mesure = null;
        // mesuré en « Moyen » : on monte si la marge est large, on descend si c'est trop juste
        m.fin(fps >= 100 ? 'ultra' : fps >= 58 ? 'eleve' : fps >= 29 ? 'moyen' : 'bas', fps);
      }
      return;
    }
    if (!this.dynamique) return;
    this.tMesure += dtReel;
    if (this.tMesure < 1.5) return;
    this.tMesure = 0;
    const avant = this.echelleDyn;
    if (this.fps < Q.fpsCible - 3) { this.echelleDyn = borner(this.echelleDyn - Q.pasEchelleDyn * (this.fps < Q.fpsCible - 10 ? 2 : 1), Q.echelleDynMin, 1); this.tStable = 0; }
    else if (this.fps > Q.fpsCible + 12) { this.tStable += 1.5; if (this.tStable > 4) this.echelleDyn = borner(this.echelleDyn + Q.pasEchelleDyn, Q.echelleDynMin, 1); }
    if (this.echelleDyn !== avant) this.jeu.redimensionner();
  }
}
