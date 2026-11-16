// Ciel atmosphérique dynamique : diffusion de Rayleigh (bleu du ciel) et de Mie (halo du soleil),
// cycle jour/nuit, étoiles, lune, nuages pseudo-volumétriques, lumière du soleil et brume.
// Le modèle de diffusion est adapté de l'exemple « Sky » de Three.js (licence MIT, modèle de Preetham).
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { borner, lissage } from '../noyau/maths.js';

const LUMINOSITE_CIEL = 0.45;   // le modèle de Preetham est trop lumineux pour notre exposition
const TURBIDITE = 4.5, RAYLEIGH = 2.2, MIE = 0.005, G = 0.8;
const BETA_R = [5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5];
const MIE_K = [1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14];

function intensiteSoleil(cosZenith) {
  const coupure = 1.6110731556870734;
  return 1000 * Math.max(0, 1 - Math.exp(-((coupure - Math.acos(borner(cosZenith, -1, 1))) / 1.5)));
}

/** Même calcul que le shader, côté JavaScript : sert à colorer la lumière et la brume. */
function couleurCiel(dx, dy, dz, sol, sortie) {
  const fondu = sol.y >= 0 ? 1 : Math.exp(sol.y);
  const coefR = RAYLEIGH - (1 - fondu);
  const sunE = intensiteSoleil(sol.y);
  const zen = Math.acos(Math.max(0, dy));
  const inv = 1 / (Math.cos(zen) + 0.15 * Math.pow(93.885 - (zen * 180) / Math.PI, -1.253));
  const cosT = dx * sol.x + dy * sol.y + dz * sol.z;
  const rPhase = (3 / (16 * Math.PI)) * (1 + Math.pow(cosT * 0.5 + 0.5, 2));
  const mPhase = (1 / (4 * Math.PI)) * ((1 - G * G) / Math.pow(1 - 2 * G * cosT + G * G, 1.5));
  const melange = borner(Math.pow(1 - sol.y, 5), 0, 1);
  const c = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const bR = BETA_R[i] * coefR, bM = 0.434 * (0.2 * TURBIDITE * 1e-17) * MIE_K[i] * MIE;
    const fex = Math.exp(-(bR * 8400 * inv + bM * 1250 * inv));
    const ratio = (bR * rPhase + bM * mPhase) / (bR + bM);
    let lin = Math.pow(sunE * ratio * (1 - fex), 1.5);
    lin *= 1 + (Math.pow(sunE * ratio * fex, 0.5) - 1) * melange;
    const tex = (lin + 0.1 * fex) * 0.04 + [0, 0.0003, 0.00075][i];
    c[i] = Math.pow(tex, 1 / (1.2 + 1.2 * fondu));
  }
  sortie.setRGB(c[0], c[1], c[2]);
  return sortie;
}

const SHADER_VERTEX = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww;   // toujours au fond de la scène
}`;

const SHADER_FRAGMENT = /* glsl */`
precision highp float;
varying vec3 vDir;
uniform vec3 uSoleil, uLune, uCouleurSoleil, uCouleurZenith, uCouleurHorizon;
uniform float uJour, uCouverture, uSombre, uTemps, uEclair;
uniform sampler2D uBruit;
const float PI = 3.141592653589793;
const float LUMINOSITE_CIEL = ${LUMINOSITE_CIEL};
const vec3 BETA_R = vec3(5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5);
const vec3 MIE_K = vec3(1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14);

float intensiteSoleil(float c) {
  return 1000.0 * max(0.0, 1.0 - exp(-((1.6110731556870734 - acos(clamp(c, -1.0, 1.0))) / 1.5)));
}
vec3 atmosphere(vec3 dir, out vec3 fex) {
  float fondu = 1.0 - clamp(1.0 - exp(uSoleil.y), 0.0, 1.0);
  vec3 bR = BETA_R * (${RAYLEIGH.toFixed(2)} - (1.0 - fondu));
  vec3 bM = 0.434 * (0.2 * ${TURBIDITE.toFixed(2)} * 1e-17) * MIE_K * ${MIE};
  float sunE = intensiteSoleil(uSoleil.y);
  float zen = acos(max(0.0, dir.y));
  float inv = 1.0 / (cos(zen) + 0.15 * pow(93.885 - degrees(zen), -1.253));
  fex = exp(-(bR * 8400.0 * inv + bM * 1250.0 * inv));
  float cosT = dot(dir, uSoleil);
  float rPhase = (3.0 / (16.0 * PI)) * (1.0 + pow(cosT * 0.5 + 0.5, 2.0));
  float g = ${G};
  float mPhase = (1.0 / (4.0 * PI)) * ((1.0 - g * g) / pow(1.0 - 2.0 * g * cosT + g * g, 1.5));
  vec3 ratio = (bR * rPhase + bM * mPhase) / (bR + bM);
  vec3 lin = pow(sunE * ratio * (1.0 - fex), vec3(1.5));
  lin *= mix(vec3(1.0), pow(sunE * ratio * fex, vec3(0.5)), clamp(pow(1.0 - uSoleil.y, 5.0), 0.0, 1.0));
  vec3 l0 = 0.1 * fex;
  float disque = smoothstep(0.99985, 0.99995, cosT);
  l0 += sunE * 19000.0 * fex * disque;
  vec3 tex = (lin + l0) * 0.04 + vec3(0.0, 0.0003, 0.00075);
  return min(pow(max(tex, vec3(0.0)), vec3(1.0 / (1.2 + 1.2 * fondu))), vec3(60.0));
}
float hachage(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float densiteNuage(vec2 p) {
  float n = texture2D(uBruit, p * 0.55).r * 0.62 + texture2D(uBruit, p * 1.7 + 0.31).g * 0.28 + texture2D(uBruit, p * 5.1).b * 0.10;
  float seuil = 1.0 - uCouverture;
  return smoothstep(seuil, seuil + 0.26, n);
}
void main() {
  vec3 dir = normalize(vDir);
  vec3 fex;
  vec3 col = atmosphere(vec3(dir.x, max(dir.y, 0.0), dir.z), fex) * uJour * LUMINOSITE_CIEL;
  // Nuit : dégradé bleu sombre, étoiles, lune
  float nuit = 1.0 - uJour;
  vec3 cNuit = mix(vec3(0.010, 0.016, 0.030), vec3(0.002, 0.004, 0.012), clamp(dir.y * 1.4, 0.0, 1.0));
  col += cNuit * nuit;
  if (nuit > 0.01 && dir.y > 0.0) {
    vec3 c = floor(dir * 170.0);
    float h = hachage(c);
    vec3 f = fract(dir * 170.0) - 0.5;
    float etoile = step(0.9965, h) * smoothstep(0.35, 0.0, length(f)) * (0.5 + 0.5 * sin(uTemps * 2.0 + h * 90.0));
    col += vec3(0.9, 0.95, 1.0) * etoile * 1.6 * nuit * smoothstep(0.0, 0.25, dir.y);
  }
  float cl = dot(dir, uLune);
  col += vec3(0.85, 0.9, 1.0) * (smoothstep(0.9993, 0.9996, cl) * 2.2 + pow(max(cl, 0.0), 300.0) * 0.12) * nuit;
  // Nuages : plusieurs tranches superposées, éclairées en direction du soleil
  if (dir.y > 0.012) {
    float dens = 0.0, lum = 0.0;
    vec2 vent = vec2(uTemps * 0.0045, uTemps * 0.0021);
    vec3 versLumiere = uJour > 0.5 ? uSoleil : uLune;
    for (int i = 0; i < PAS_NUAGES; i++) {
      float alt = 1.0 + float(i) * 0.07;
      vec2 p = dir.xz / (dir.y + 0.09) * alt * 0.13 + vent * alt;
      float d = densiteNuage(p);
      float dL = densiteNuage(p + versLumiere.xz * 0.035);
      lum += d * exp(-dL * 2.2);
      dens += d;
    }
    dens /= float(PAS_NUAGES); lum /= max(float(PAS_NUAGES) * dens, 0.001) ;
    float alpha = (1.0 - exp(-dens * 3.2)) * smoothstep(0.012, 0.16, dir.y);
    float versSoleil = pow(max(dot(dir, versLumiere), 0.0), 6.0);
    vec3 eclaire = uCouleurSoleil * (0.55 + 0.9 * versSoleil);
    vec3 ombre = uCouleurZenith * 0.75 + uCouleurHorizon * 0.25;
    vec3 cNuage = mix(ombre, eclaire + ombre * 0.4, clamp(lum, 0.0, 1.0)) * mix(1.0, 0.42, uSombre);
    cNuage += vec3(0.7, 0.75, 1.0) * uEclair * 2.5;
    col = mix(col, cNuage, alpha);
  }
  // Sous l'horizon : on prolonge la couleur de la brume
  col = mix(col, uCouleurHorizon, smoothstep(0.0, -0.08, dir.y));
  gl_FragColor = vec4(col, 1.0);
}`;

export class Ciel {
  constructor(scene, ombres, texBruit) {
    this.scene = scene; this.ombres = ombres;
    this.heure = CONFIG.temps.heureDepart;
    this.jourNumero = 1;
    this.dirSoleil = new THREE.Vector3(0, 1, 0);
    this.dirLune = new THREE.Vector3(0, -1, 0);
    this.dirLumiere = new THREE.Vector3(0, 1, 0);   // vers l'astre qui éclaire (soleil ou lune)
    this.couleurSoleil = new THREE.Color(); this.couleurBrume = new THREE.Color();
    this.couleurZenith = new THREE.Color(); this.couleurHorizon = new THREE.Color();
    this.couleurLumiere = new THREE.Color();
    this.jour = 1;            // 1 en plein jour, 0 en pleine nuit
    this.exposition = 1;
    this.eclair = 0;          // flash d'orage (réglé par la météo)
    this.uniformes = {
      uSoleil: { value: this.dirSoleil }, uLune: { value: this.dirLune },
      uCouleurSoleil: { value: new THREE.Color() }, uCouleurZenith: { value: this.couleurZenith },
      uCouleurHorizon: { value: this.couleurHorizon },
      uJour: { value: 1 }, uCouverture: { value: 0.35 }, uSombre: { value: 0 }, uTemps: { value: 0 },
      uEclair: { value: 0 }, uBruit: { value: texBruit },
    };
    this.materiau = new THREE.ShaderMaterial({
      vertexShader: SHADER_VERTEX, fragmentShader: SHADER_FRAGMENT, uniforms: this.uniformes,
      defines: { PAS_NUAGES: 2 }, side: THREE.BackSide, depthWrite: false, depthTest: true, fog: false,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), this.materiau);
    this.dome.scale.setScalar(2000); this.dome.frustumCulled = false; this.dome.renderOrder = 1000;   // dessiné après les objets opaques : moins de pixels calculés
    scene.add(this.dome);
    this.hemisphere = new THREE.HemisphereLight(0xffffff, 0x554433, 1);
    scene.add(this.hemisphere);
    scene.fog = new THREE.FogExp2(0xaabbcc, 0.001);
    this._tmp = new THREE.Vector3(); this._c = new THREE.Color();
  }

  reglerQualite(q) { this.materiau.defines.PAS_NUAGES = q.nuagesPas; this.materiau.needsUpdate = true; }

  /** Avance l'horloge et recalcule soleil, couleurs et lumières. */
  mettreAJour(dt, camera, meteo, tempsReel) {
    this.heure += (dt * 24) / (CONFIG.temps.dureeJourMinutes * 60);
    if (this.heure >= 24) { this.heure -= 24; this.jourNumero++; }
    const a = ((this.heure - 6) / 24) * Math.PI * 2, incl = 0.6;
    this.dirSoleil.set(Math.cos(a), Math.sin(a) * Math.cos(incl), Math.sin(a) * Math.sin(incl)).normalize();
    this.dirLune.copy(this.dirSoleil).multiplyScalar(-1).applyAxisAngle(this._tmp.set(1, 0, 0), 0.25).normalize();
    const sy = this.dirSoleil.y;
    this.jour = lissage(-0.14, 0.06, sy);
    const couvert = meteo ? meteo.couverture : 0.35, sombre = meteo ? meteo.sombre : 0;

    // Couleurs du ciel calculées côté JS (zénith, horizon) pour la lumière ambiante et la brume
    const s = this.dirSoleil;
    couleurCiel(0, 1, 0, s, this.couleurZenith).multiplyScalar(this.jour * LUMINOSITE_CIEL);
    const hx = -s.z, hz = s.x, hl = Math.hypot(hx, hz) || 1;   // horizon, perpendiculaire au soleil
    couleurCiel((hx / hl) * 0.995, 0.1, (hz / hl) * 0.995, s, this.couleurHorizon).multiplyScalar(this.jour * LUMINOSITE_CIEL);
    this._c.setRGB(0.010, 0.016, 0.030).multiplyScalar(1 - this.jour);
    this.couleurHorizon.add(this._c); this.couleurZenith.add(this._c.multiplyScalar(0.6));
    // Temps couvert : tout tire vers le gris
    const gris = (this.couleurHorizon.r + this.couleurHorizon.g + this.couleurHorizon.b) / 3;
    this._c.setRGB(gris, gris * 1.02, gris * 1.06).multiplyScalar(1 - sombre * 0.72);
    this.couleurHorizon.lerp(this._c, borner(couvert * 1.1 - 0.3, 0, 0.9));
    this.couleurZenith.lerp(this._c, borner(couvert * 1.1 - 0.3, 0, 0.9));

    // Couleur du soleil : filtrée par l'atmosphère (rouge au lever et au coucher)
    const zen = Math.acos(Math.max(0, sy));
    const inv = 1 / (Math.cos(zen) + 0.15 * Math.pow(93.885 - (zen * 180) / Math.PI, -1.253));
    const c = this.couleurSoleil;
    c.setRGB(1, 1, 1);
    const comp = ['r', 'g', 'b'];
    for (let i = 0; i < 3; i++) {
      const bM = 0.434 * (0.2 * TURBIDITE * 1e-17) * MIE_K[i] * MIE;
      c[comp[i]] = Math.exp(-(BETA_R[i] * RAYLEIGH * 8400 * inv * 2.2 + bM * 1250 * inv));
    }
    const forceSoleil = lissage(-0.03, 0.12, sy) * (1 - borner(couvert * 1.25 - 0.45, 0, 0.92));
    this.uniformes.uCouleurSoleil.value.copy(c).multiplyScalar(1.6 * lissage(-0.08, 0.1, sy) + 0.06 * (1 - this.jour));

    // Astre actif : soleil le jour, lune la nuit (fondu à zéro au changement)
    const forceLune = lissage(0.02, 0.2, this.dirLune.y) * (1 - this.jour) * (1 - couvert * 0.7);
    if (forceSoleil * 4.2 >= forceLune * 0.22) {
      this.dirLumiere.copy(this.dirSoleil);
      this.couleurLumiere.copy(c); this.intensiteLumiere = forceSoleil * 4.2;
    } else {
      this.dirLumiere.copy(this.dirLune);
      this.couleurLumiere.setRGB(0.55, 0.68, 1.0); this.intensiteLumiere = forceLune * 0.22;
    }
    this._tmp.copy(this.dirLumiere).multiplyScalar(-1);
    this.ombres.mettreAJour(this._tmp, this.couleurLumiere, this.intensiteLumiere);

    // Lumière ambiante (ciel + rebond du sol)
    this.hemisphere.color.copy(this.couleurZenith).lerp(this.couleurHorizon, 0.45);
    // le sol renvoie une lumière verdâtre (rebond sur la végétation)
    this.hemisphere.groundColor.copy(this.couleurHorizon).multiplyScalar(0.22).add(this._c.setRGB(0.035, 0.06, 0.02).multiplyScalar(this.jour));
    this.hemisphere.intensity = 4.6 + this.eclair * 14;
    if (this.eclair > 0) this.hemisphere.color.lerp(this._c.setRGB(0.8, 0.85, 1), Math.min(1, this.eclair));

    // Brume : couleur de l'horizon
    this.couleurBrume.copy(this.couleurHorizon);
    this.scene.fog.color.copy(this.couleurBrume);
    // exposition automatique : l'œil s'adapte au crépuscule, à la nuit et au temps couvert
    this.exposition = 1.0 + (1 - lissage(0.0, 0.4, sy)) * 1.1 + (1 - this.jour) * 1.3 + sombre * 0.35;

    const u = this.uniformes;
    u.uJour.value = this.jour; u.uCouverture.value = couvert; u.uSombre.value = sombre;
    u.uTemps.value = tempsReel; u.uEclair.value = this.eclair;
    this.dome.position.copy(camera.position);
  }

  /** Texte lisible de l'heure, ex. « 07 h 15 ». */
  texteHeure() {
    const h = Math.floor(this.heure), m = Math.floor((this.heure - h) * 60);
    return String(h).padStart(2, '0') + ' h ' + String(m).padStart(2, '0');
  }
}
