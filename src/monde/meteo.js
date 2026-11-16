// Météo : ciel clair, nuageux, pluie, orage, brouillard matinal.
// Les valeurs (couverture nuageuse, pluie, vent…) glissent doucement d'un temps à l'autre.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { amortir, lissage } from '../noyau/maths.js';

const C = CONFIG.meteo;
const TYPES = {
  clair:   { nom: 'Ciel clair', couverture: 0.34, sombre: 0.0, pluie: 0, vent: 0.35 },
  nuageux: { nom: 'Nuageux',    couverture: 0.62, sombre: 0.25, pluie: 0, vent: 0.5 },
  pluie:   { nom: 'Pluie',      couverture: 0.86, sombre: 0.6, pluie: 0.7, vent: 0.7 },
  orage:   { nom: 'Orage',      couverture: 0.95, sombre: 0.85, pluie: 1, vent: 1 },
};
const NB_GOUTTES = 1400;

export class Meteo {
  constructor(scene, ciel) {
    this.scene = scene; this.ciel = ciel;
    this.type = 'clair'; this.minuterie = 200;
    this.couverture = 0.34; this.sombre = 0; this.pluie = 0; this.vent = 0.35;
    this.brumeMatin = 0; this.rosee = 0; this.humiditeJour = 0.8;
    this.prochainEclair = 8; this.dureeFlash = 0;
    this.surEclair = null;   // rappel (distance) → son du tonnerre
    this._creerPluie(); this._creerEclair();
  }

  get nom() { return this.brumeMatin > 0.45 && this.pluie < 0.1 ? 'Brouillard matinal' : TYPES[this.type].nom; }

  _creerPluie() {
    const pos = new Float32Array(NB_GOUTTES * 6), bout = new Float32Array(NB_GOUTTES * 2);
    for (let i = 0; i < NB_GOUTTES; i++) {
      const x = Math.random(), y = Math.random(), z = Math.random();
      pos.set([x, y, z, x, y, z], i * 6); bout[i * 2] = 0; bout[i * 2 + 1] = 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aBout', new THREE.BufferAttribute(bout, 1));
    this.matPluie = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uTemps: { value: 0 }, uOpacite: { value: 0 }, uVent: { value: 0.5 }, uCouleur: { value: new THREE.Color() } },
      vertexShader: /* glsl */`
        attribute float aBout; uniform float uTemps, uVent;
        void main() {
          vec3 boite = vec3(36.0, 26.0, 36.0);
          vec3 p = position * boite;
          p.y -= uTemps * (19.0 + position.x * 7.0);
          p.x += uTemps * uVent * 4.0;
          p = cameraPosition + (fract((p - cameraPosition) / boite) - 0.5) * boite;
          p += aBout * vec3(uVent * 0.16, 0.75, 0.0);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: 'uniform float uOpacite; uniform vec3 uCouleur; void main(){ gl_FragColor = vec4(uCouleur, uOpacite); }',
    });
    this.lignesPluie = new THREE.LineSegments(geo, this.matPluie);
    this.lignesPluie.frustumCulled = false; this.lignesPluie.renderOrder = 9; this.lignesPluie.layers.set(1);
    this.scene.add(this.lignesPluie);
  }

  _creerEclair() {
    this.posEclair = new Float32Array(22 * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.posEclair, 3));
    this.eclair = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: new THREE.Color(14, 15, 20), fog: false }));
    this.eclair.frustumCulled = false; this.eclair.visible = false;
    this.scene.add(this.eclair);
  }

  _changer() {
    const r = Math.random();
    if (r < C.probaOrage) this.type = 'orage';
    else if (r < C.probaOrage + C.probaPluie) this.type = 'pluie';
    else if (r < C.probaOrage + C.probaPluie + C.probaNuageux) this.type = 'nuageux';
    else this.type = 'clair';
    this.minuterie = C.dureeMin + Math.random() * (C.dureeMax - C.dureeMin);
  }

  /** Force un type de temps (utilisé par les tests et les options de débogage). */
  forcer(type) { if (TYPES[type]) { this.type = type; this.minuterie = 300; } }

  mettreAJour(dt, dtReel, camera) {
    this.minuterie -= dt;
    if (this.minuterie <= 0) this._changer();
    const t = TYPES[this.type], k = 0.12;
    this.couverture = amortir(this.couverture, t.couverture, k, dt);
    this.sombre = amortir(this.sombre, t.sombre, k, dt);
    this.pluie = amortir(this.pluie, t.pluie, k, dt);
    this.vent = amortir(this.vent, t.vent, k, dt);
    // Brouillard matinal et rosée
    const h = this.ciel.heure;
    if (h < 0.05) this.humiditeJour = 0.45 + Math.random() * 0.55;
    const matin = lissage(C.brumeMatinDebut, C.brumeMatinDebut + 1, h) * (1 - lissage(C.brumeMatinFin - 1.2, C.brumeMatinFin, h));
    this.brumeMatin = matin * this.humiditeJour * (1 - this.pluie);
    this.rosee = lissage(4, 6, h) * (1 - lissage(8.5, 10.5, h));
    this.scene.fog.density = C.densiteBrumeBase + this.brumeMatin * C.densiteBrumeMatin + this.pluie * C.densiteBrumePluie;
    // Pluie
    this.lignesPluie.visible = this.pluie > 0.03;
    const u = this.matPluie.uniforms;
    u.uTemps.value += dtReel; u.uOpacite.value = this.pluie * 0.33; u.uVent.value = this.vent;
    u.uCouleur.value.copy(this.ciel.couleurHorizon).multiplyScalar(1.5).addScalar(0.04);
    // Éclairs
    if (this.type === 'orage' && this.pluie > 0.6) {
      this.prochainEclair -= dtReel;
      if (this.prochainEclair <= 0) {
        this.prochainEclair = C.intervalleEclairMin + Math.random() * (C.intervalleEclairMax - C.intervalleEclairMin);
        this._foudre(camera);
      }
    }
    if (this.dureeFlash > 0) {
      this.dureeFlash -= dtReel;
      const f = this.dureeFlash;
      this.ciel.eclair = f > 0.28 ? 1 : f > 0.2 ? 0.15 : f > 0.12 ? 0.8 : Math.max(0, f / 0.12) * 0.5;
      this.eclair.visible = f > 0.2;
    } else { this.ciel.eclair = 0; this.eclair.visible = false; }
  }

  _foudre(camera) {
    const a = Math.random() * Math.PI * 2, d = 250 + Math.random() * 650;
    let x = camera.position.x + Math.cos(a) * d, z = camera.position.z + Math.sin(a) * d, y = 420;
    const P = this.posEclair;
    for (let i = 0; i < 22; i++) {
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
      x += (Math.random() - 0.5) * 34; z += (Math.random() - 0.5) * 34; y -= 20;
    }
    this.eclair.geometry.attributes.position.needsUpdate = true;
    this.dureeFlash = 0.36;
    if (this.surEclair) this.surEclair(d);
  }
}
