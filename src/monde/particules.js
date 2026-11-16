// Particules : (1) réserve de particules ponctuelles (poussière, éclaboussures, boue),
// (2) particules d'ambiance calculées par la carte graphique (pollen, poussières, insectes).
// Aucune allocation pendant le jeu : les tableaux sont créés une fois puis recyclés.
import * as THREE from 'three';

const MAX = 480;

const VERT = /* glsl */`
attribute vec4 aCouleur; attribute float aTaille;
varying vec4 vCouleur;
void main() {
  vCouleur = aCouleur;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aTaille * uEchelle / max(-mv.z, 0.1);
}`;
const FRAG = /* glsl */`
varying vec4 vCouleur; uniform sampler2D uTex; uniform vec3 uLumiere;
void main() {
  float a = texture2D(uTex, gl_PointCoord).a * vCouleur.a;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vCouleur.rgb * uLumiere, a);
}`;

export class Particules {
  constructor(scene, texParticule) {
    this.n = 0;
    this.pos = new Float32Array(MAX * 3); this.vit = new Float32Array(MAX * 3);
    this.couleur = new Float32Array(MAX * 4); this.taille = new Float32Array(MAX);
    this.vie = new Float32Array(MAX); this.duree = new Float32Array(MAX);
    this.gravite = new Float32Array(MAX); this.alpha0 = new Float32Array(MAX); this.croit = new Float32Array(MAX);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aCouleur', new THREE.BufferAttribute(this.couleur, 4).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('aTaille', new THREE.BufferAttribute(this.taille, 1).setUsage(THREE.DynamicDrawUsage));
    this.uniformes = { uTex: { value: texParticule }, uEchelle: { value: 600 }, uLumiere: { value: new THREE.Color(1, 1, 1) } };
    const mat = new THREE.ShaderMaterial({
      vertexShader: 'uniform float uEchelle;\n' + VERT, fragmentShader: FRAG, uniforms: this.uniformes,
      transparent: true, depthWrite: false,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false; this.points.renderOrder = 8; this.points.layers.set(1);
    scene.add(this.points);
    this.geo = geo;
  }

  /** Émet `n` particules. type : 'poussiere' | 'eclaboussure' | 'boue' | 'souffle'. */
  emettre(type, x, y, z, n, force = 1) {
    for (let k = 0; k < n && this.n < MAX; k++) {
      const i = this.n++, a = Math.random() * Math.PI * 2, r = Math.random();
      this.pos[i * 3] = x + Math.cos(a) * r * 0.4 * force; this.pos[i * 3 + 1] = y + Math.random() * 0.2; this.pos[i * 3 + 2] = z + Math.sin(a) * r * 0.4 * force;
      let vh = 0.6, vv = 0.8, g = -0.3, d = 1.6, t = 0.5, c = [0.3, 0.25, 0.18], al = 0.16, croit = 1.2;
      if (type === 'eclaboussure') { vh = 2.2; vv = 3.6; g = 9.8; d = 0.9; t = 0.16; c = [0.85, 0.92, 0.95]; al = 0.7; croit = 0; }
      else if (type === 'boue') { vh = 1.6; vv = 2.6; g = 9.8; d = 0.8; t = 0.14; c = [0.16, 0.11, 0.07]; al = 0.9; croit = 0; }
      else if (type === 'souffle') { vh = 0.3; vv = 0.5; g = -0.2; d = 1.4; t = 0.4; c = [0.9, 0.9, 0.9]; al = 0.16; croit = 2.2; }
      this.vit[i * 3] = Math.cos(a) * vh * r * force; this.vit[i * 3 + 1] = vv * (0.4 + Math.random() * 0.6) * force; this.vit[i * 3 + 2] = Math.sin(a) * vh * r * force;
      this.gravite[i] = g; this.duree[i] = d * (0.7 + Math.random() * 0.6); this.vie[i] = 0;
      this.taille[i] = t * (0.7 + Math.random() * 0.6) * (croit ? force : 1); this.alpha0[i] = al; this.croit[i] = croit;
      this.couleur[i * 4] = c[0]; this.couleur[i * 4 + 1] = c[1]; this.couleur[i * 4 + 2] = c[2]; this.couleur[i * 4 + 3] = al;
    }
  }

  mettreAJour(dt, hauteurEcran, lumiere) {
    const P = this.pos, V = this.vit;
    for (let i = 0; i < this.n; i++) {
      this.vie[i] += dt;
      if (this.vie[i] >= this.duree[i]) {       // on remplace la particule morte par la dernière
        const d = --this.n;
        if (i !== d) {
          for (let k = 0; k < 3; k++) { P[i * 3 + k] = P[d * 3 + k]; V[i * 3 + k] = V[d * 3 + k]; }
          for (let k = 0; k < 4; k++) this.couleur[i * 4 + k] = this.couleur[d * 4 + k];
          this.taille[i] = this.taille[d]; this.vie[i] = this.vie[d]; this.duree[i] = this.duree[d];
          this.gravite[i] = this.gravite[d]; this.alpha0[i] = this.alpha0[d]; this.croit[i] = this.croit[d];
        }
        i--; continue;
      }
      V[i * 3 + 1] -= this.gravite[i] * dt;
      P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
      this.taille[i] += this.croit[i] * dt * 0.5;
      this.couleur[i * 4 + 3] = this.alpha0[i] * (1 - this.vie[i] / this.duree[i]);
    }
    this.geo.setDrawRange(0, this.n);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.aCouleur.needsUpdate = true; this.geo.attributes.aTaille.needsUpdate = true;
    this.uniformes.uEchelle.value = hauteurEcran;
    this.uniformes.uLumiere.value.copy(lumiere);
  }
}

// ---------------------------------------------------------------- AMBIANCE --
const VERT_AMB = /* glsl */`
uniform float uTemps, uEchelle, uInsecte; uniform vec3 uBoite;
varying float vAlpha;
void main() {
  vec3 base = position * uBoite;
  float ph = position.x * 91.0 + position.z * 37.0;
  // dérive lente (pollen) ou vol nerveux (insectes)
  vec3 mouv = mix(
    vec3(sin(uTemps * 0.21 + ph), sin(uTemps * 0.13 + ph * 1.7) * 0.5 - uTemps * 0.02, cos(uTemps * 0.17 + ph * 0.6)) * 0.9 + vec3(uTemps * 0.25, 0.0, uTemps * 0.1),
    vec3(sin(uTemps * 2.3 + ph) + sin(uTemps * 5.1 + ph * 2.0) * 0.4, sin(uTemps * 3.1 + ph * 1.3) * 0.6, cos(uTemps * 2.7 + ph * 0.7) + cos(uTemps * 4.3 + ph) * 0.4) * 1.3,
    uInsecte);
  vec3 p = base + mouv;
  p = cameraPosition + (fract((p - cameraPosition) / uBoite) - 0.5) * uBoite;   // la boîte suit la caméra
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float d = -mv.z;
  gl_PointSize = mix(0.028, 0.05, uInsecte) * uEchelle / max(d, 0.3);
  vAlpha = smoothstep(0.6, 2.5, d) * (1.0 - smoothstep(uBoite.x * 0.3, uBoite.x * 0.5, d));
}`;
const FRAG_AMB = /* glsl */`
uniform vec3 uCouleur; uniform float uOpacite; varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.1, length(c)) * vAlpha * uOpacite;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uCouleur, a);
}`;

/** Pollen/poussières en suspension et petits insectes volants autour de la caméra. */
export class Ambiance {
  constructor(scene) {
    this.scene = scene;
    this.pollen = this._creer(700, new THREE.Vector3(34, 12, 34), 0);
    this.insectes = this._creer(160, new THREE.Vector3(26, 6, 26), 1);
  }
  _creer(n, boite, insecte) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) pos[i] = Math.random();
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT_AMB, fragmentShader: FRAG_AMB, transparent: true, depthWrite: false,
      uniforms: { uTemps: { value: 0 }, uEchelle: { value: 600 }, uInsecte: { value: insecte }, uBoite: { value: boite },
        uCouleur: { value: new THREE.Color() }, uOpacite: { value: 1 } },
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false; pts.renderOrder = 7; pts.layers.set(1);
    this.scene.add(pts);
    return pts;
  }
  reglerQualite(q) {
    this.pollen.geometry.setDrawRange(0, Math.floor(700 * Math.min(1, q.particules)));
    this.insectes.geometry.setDrawRange(0, Math.floor(160 * Math.min(1, q.particules)));
  }
  mettreAJour(temps, hauteurEcran, ciel, meteo, humidite) {
    let u = this.pollen.material.uniforms;
    u.uTemps.value = temps; u.uEchelle.value = hauteurEcran;
    u.uCouleur.value.copy(ciel.couleurLumiere).multiplyScalar(ciel.intensiteLumiere * 0.22).add(ciel.couleurHorizon);
    u.uOpacite.value = 0.3 * ciel.jour * (1 - meteo.pluie);
    this.pollen.visible = u.uOpacite.value > 0.02;
    u = this.insectes.material.uniforms;
    u.uTemps.value = temps; u.uEchelle.value = hauteurEcran;
    u.uCouleur.value.setRGB(0.03, 0.025, 0.02).add(ciel.couleurHorizon).multiplyScalar(0.25);
    // les insectes sortent surtout près de l'eau, à l'aube et au crépuscule
    u.uOpacite.value = (0.25 + humidite * 0.75) * (1 - meteo.pluie) * (0.35 + 0.65 * ciel.jour);
    this.insectes.visible = u.uOpacite.value > 0.05;
  }
}
