// Vision olfactive : le monde se désature et les odeurs apparaissent sous forme de volutes colorées.
// Orange = proies, rouge = prédateurs, vert = carcasses, bleu = eau douce.
// Les volutes sont dessinées par-dessus l'image finale (elles traversent le décor, comme une odeur).
import * as THREE from 'three';
import { amortir } from '../noyau/maths.js';

const MAX = 420, BOUFFEES = 6;
const COULEURS = { proie: [1.0, 0.62, 0.15], predateur: [1.0, 0.16, 0.1], carcasse: [0.35, 1.0, 0.3], eau: [0.25, 0.65, 1.0] };

export class Odorat {
  constructor(jeu) {
    this.jeu = jeu; this.actif = false; this.intensite = 0;
    this.scene = new THREE.Scene();
    this.pos = new Float32Array(MAX * 3); this.coul = new Float32Array(MAX * 4); this.taille = new Float32Array(MAX);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aCouleur', new THREE.BufferAttribute(this.coul, 4).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aTaille', new THREE.BufferAttribute(this.taille, 1).setUsage(THREE.DynamicDrawUsage));
    this.materiau = new THREE.ShaderMaterial({
      transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uEchelle: { value: 600 }, uIntensite: { value: 0 } },
      vertexShader: /* glsl */`
        attribute vec4 aCouleur; attribute float aTaille; uniform float uEchelle; varying vec4 vC;
        void main() { vC = aCouleur; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
          gl_PointSize = max(5.0, aTaille * uEchelle / max(-mv.z, 0.5)); }`,
      fragmentShader: /* glsl */`
        varying vec4 vC; uniform float uIntensite;
        void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC.rgb * a * a * vC.a * uIntensite, 1.0); }`,
    });
    this.points = new THREE.Points(geo, this.materiau);
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    this.geo = geo; this.n = 0;
    this.eauProche = null;
  }

  basculer() { this.actif = !this.actif; this.jeu.audio.souffleNez(); }

  _volute(x, y, z, type, taille, temps, graine) {
    const c = COULEURS[type], vent = this.jeu.meteo.vent;
    for (let j = 0; j < BOUFFEES && this.n < MAX; j++) {
      const ph = (temps * 0.22 + j / BOUFFEES + graine) % 1, i = this.n++;
      this.pos[i * 3] = x + ph * vent * 5 + Math.sin(ph * 9 + graine * 40) * 0.4;
      this.pos[i * 3 + 1] = y + 0.4 + ph * (2.5 + taille * 1.5);
      this.pos[i * 3 + 2] = z + ph * vent * 2 + Math.cos(ph * 7 + graine * 23) * 0.4;
      this.coul[i * 4] = c[0]; this.coul[i * 4 + 1] = c[1]; this.coul[i * 4 + 2] = c[2]; this.coul[i * 4 + 3] = Math.sin(Math.PI * ph) * 0.8;
      this.taille[i] = (0.5 + ph * 1.1) * (0.7 + taille * 0.5);
    }
  }

  mettreAJour(dt, temps, hauteurEcran) {
    const jeu = this.jeu;
    this.intensite = amortir(this.intensite, this.actif ? 1 : 0, 5, dt);
    this.materiau.uniforms.uIntensite.value = this.intensite; this.materiau.uniforms.uEchelle.value = hauteurEcran;
    this.n = 0;
    if (this.intensite < 0.02) { this.geo.setDrawRange(0, 0); return; }
    const jc = jeu.joueur.creature, portee = 150 * (jeu.joueur.a('odorat') ? 1.5 : 1);
    for (let k = 0; k < jeu.ecosysteme.animaux.length; k++) {
      const a = jeu.ecosysteme.animaux[k];
      if (!a.vivant || a.distJoueur > portee) continue;
      this._volute(a.x, a.y + a.def.avant[0][2] * a.c.echelle, a.z, a.def.role === 'predateur' ? 'predateur' : 'proie', a.def.rayon, temps, k * 0.137);
    }
    for (const k of jeu.ecosysteme.carcasses) if (k.viande > 0 && Math.hypot(k.x - jc.x, k.z - jc.z) < portee * 1.6) this._volute(k.x, jeu.terrain.hauteur(k.x, k.z) + 0.5, k.z, 'carcasse', 1.6, temps, 0.5);
    // eau douce la plus proche : une traînée bleue indique la direction
    const eau = jeu.terrain.eauLaPlusProche(jc.x, jc.z);
    this.eauProche = eau;
    if (eau) {
      const d = Math.hypot(eau.x - jc.x, eau.z - jc.z);
      this._volute(eau.x, 0.2, eau.z, 'eau', 2, temps, 0.3);
      if (d > 25) for (let i = 1; i <= 4; i++) this._volute(jc.x + (eau.x - jc.x) * Math.min(1, (i * 9) / d), jc.y + 0.5, jc.z + (eau.z - jc.z) * Math.min(1, (i * 9) / d), 'eau', 0.3, temps, i * 0.21);
    }
    this.geo.setDrawRange(0, this.n);
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aCouleur.needsUpdate = true; this.geo.attributes.aTaille.needsUpdate = true;
  }
}
