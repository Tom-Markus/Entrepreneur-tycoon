// Post-traitement : la scène est d'abord rendue dans une image « HDR » (grande plage de luminosité),
// puis une série de passes plein écran ajoute : halo lumineux (bloom), occlusion ambiante,
// rayons du soleil (god rays), profondeur de champ, tone mapping ACES, étalonnage, vignette, grain.
// Chaque effet peut être coupé selon le niveau de qualité.
import * as THREE from 'three';

const VERT = /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const PROFONDEUR = /* glsl */`
uniform float uProche, uLointain;
float profLineaire(float d) { float z = d * 2.0 - 1.0; return 2.0 * uProche * uLointain / (uLointain + uProche - z * (uLointain - uProche)); }`;

const FRAG_SEUIL = /* glsl */`
varying vec2 vUv; uniform sampler2D tScene; uniform vec2 uTexel; uniform float uSeuil;
void main() {
  vec3 c = (texture2D(tScene, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tScene, vUv + uTexel * vec2(1.0, -1.0)).rgb
          + texture2D(tScene, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tScene, vUv + uTexel * vec2(1.0, 1.0)).rgb) * 0.25;
  float l = max(c.r, max(c.g, c.b));
  if (!(l < 1.0e4)) { c = vec3(0.0); l = 0.0; }      // garde-fou : valeur aberrante → pas de halo
  c *= max(0.0, l - uSeuil) / max(l, 1e-4);
  gl_FragColor = vec4(min(c, vec3(24.0)), 1.0);
}`;
const FRAG_REDUIRE = /* glsl */`
varying vec2 vUv; uniform sampler2D tSource; uniform vec2 uTexel;
void main() {
  gl_FragColor = (texture2D(tSource, vUv + uTexel * vec2(-1.0, -1.0)) + texture2D(tSource, vUv + uTexel * vec2(1.0, -1.0))
                + texture2D(tSource, vUv + uTexel * vec2(-1.0, 1.0)) + texture2D(tSource, vUv + uTexel * vec2(1.0, 1.0))) * 0.25;
}`;
const FRAG_AGRANDIR = /* glsl */`
varying vec2 vUv; uniform sampler2D tBas, tHaut; uniform vec2 uTexel;
void main() {
  vec4 b = (texture2D(tBas, vUv + uTexel * vec2(-1.0, -1.0)) + texture2D(tBas, vUv + uTexel * vec2(1.0, -1.0))
          + texture2D(tBas, vUv + uTexel * vec2(-1.0, 1.0)) + texture2D(tBas, vUv + uTexel * vec2(1.0, 1.0))) * 0.25;
  gl_FragColor = texture2D(tHaut, vUv) + b;
}`;
const FRAG_RAYONS = /* glsl */`
varying vec2 vUv; uniform sampler2D tProfondeur; uniform vec2 uSoleilUV; uniform float uAspect;
void main() {
  const int N = NB_RAYONS;
  vec2 delta = (vUv - uSoleilUV) / float(N) * 0.92;
  vec2 uv = vUv; float acc = 0.0, poids = 1.0, total = 0.0;
  for (int i = 0; i < N; i++) {
    uv -= delta;
    acc += step(0.99999, texture2D(tProfondeur, uv).r) * poids;   // 1 si on voit le ciel
    total += poids; poids *= 0.95;
  }
  float halo = pow(max(0.0, 1.0 - length((vUv - uSoleilUV) * vec2(uAspect, 1.0)) * 0.8), 2.5);
  gl_FragColor = vec4(acc / total * halo);
}`;
const FRAG_AO = /* glsl */`
varying vec2 vUv; uniform sampler2D tProfondeur; uniform vec2 uTexel; uniform float uEchelleProj;
${PROFONDEUR}
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  float brut = texture2D(tProfondeur, vUv).r;
  if (brut >= 0.99999) { gl_FragColor = vec4(1.0); return; }
  float d0 = profLineaire(brut);
  float rayon = 0.9 * uEchelleProj / d0;            // rayon d'environ 0,9 m, en coordonnées d'écran
  float a0 = ign(gl_FragCoord.xy) * 6.2831853, occ = 0.0;
  for (int i = 0; i < PAIRES; i++) {
    float a = a0 + float(i) * 3.14159265 / float(PAIRES);
    vec2 o = vec2(cos(a) * uTexel.x / uTexel.y, sin(a)) * rayon * (0.35 + 0.65 * float(i + 1) / float(PAIRES));
    // paire symétrique : sur une surface plane la moyenne vaut d0 → aucune occlusion parasite
    float moy = (profLineaire(texture2D(tProfondeur, vUv + o).r) + profLineaire(texture2D(tProfondeur, vUv - o).r)) * 0.5;
    float diff = d0 - moy;
    occ += smoothstep(0.02, 0.35, diff) * (1.0 - smoothstep(0.8, 1.8, diff));
  }
  gl_FragColor = vec4(1.0 - occ / float(PAIRES) * 0.9);
}`;

const FRAG_FINAL = /* glsl */`
varying vec2 vUv;
uniform sampler2D tScene, tProfondeur, tBloom, tAO, tRayons;
uniform vec2 uTexel;
uniform vec3 uCouleurSoleil;
uniform float uExposition, uBloom, uRayons, uOdorat, uTemps, uDofForce, uDofFocus, uVignette, uGrain, uFiltre, uNettete;
${PROFONDEUR}
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  vec3 col = min(texture2D(tScene, vUv).rgb, vec3(80.0));
  #ifdef NETTETE
  {
    // accentuation : on renforce l'écart entre le pixel et la moyenne de ses voisins (détails plus nets)
    vec3 voisins = (texture2D(tScene, vUv + vec2(uTexel.x, 0.0)).rgb + texture2D(tScene, vUv - vec2(uTexel.x, 0.0)).rgb
                  + texture2D(tScene, vUv + vec2(0.0, uTexel.y)).rgb + texture2D(tScene, vUv - vec2(0.0, uTexel.y)).rgb) * 0.25;
    col = max(col + (col - min(voisins, vec3(80.0))) * uNettete, vec3(0.0));
  }
  #endif
  #ifdef DOF
  {
    float z = profLineaire(texture2D(tProfondeur, vUv).r);
    float coc = uDofForce * clamp(abs(z - uDofFocus) / (uDofFocus * 1.6 + 2.0) - 0.12, 0.0, 1.0);
    if (coc > 0.02) {
      float a0 = ign(gl_FragCoord.xy) * 6.2831853; vec3 somme = col; float n = 1.0;
      for (int i = 0; i < 8; i++) {
        float a = a0 + float(i) * 2.399963; float r = sqrt((float(i) + 0.5) / 8.0) * coc * 7.0;
        somme += texture2D(tScene, vUv + vec2(cos(a), sin(a)) * r * uTexel).rgb; n += 1.0;
      }
      col = somme / n;
    }
  }
  #endif
  #ifdef AO
    float ao = (texture2D(tAO, vUv + uTexel * vec2(1.0, 1.0)).r + texture2D(tAO, vUv + uTexel * vec2(-1.0, 1.0)).r
              + texture2D(tAO, vUv + uTexel * vec2(1.0, -1.0)).r + texture2D(tAO, vUv + uTexel * vec2(-1.0, -1.0)).r) * 0.25;
    col *= ao;
  #endif
  #ifdef BLOOM
    col += texture2D(tBloom, vUv).rgb * uBloom;
  #endif
  #ifdef RAYONS
    col += uCouleurSoleil * texture2D(tRayons, vUv).r * uRayons;
  #endif
  // Vision olfactive : le monde se désature et bleuit, les odeurs (dessinées ensuite) ressortent
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(col, vec3(l) * vec3(0.7, 0.82, 1.0), uOdorat * 0.82);
  col = aces(col * uExposition);
  col = pow(col, vec3(1.0 / 2.2));
  // Étalonnage « documentaire » : ombres légèrement froides, hautes lumières chaudes
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, 1.16);
  col += mix(vec3(-0.012, 0.0, 0.016), vec3(0.016, 0.006, -0.014), lum);
  col = (col - 0.5) * 1.1 + 0.5;
  // Filtres du mode photo
  if (uFiltre > 0.5) {
    float g = dot(col, vec3(0.299, 0.587, 0.114));
    if (uFiltre < 1.5) col = vec3(g) * vec3(1.07, 0.92, 0.72);                 // sépia
    else if (uFiltre < 2.5) col = vec3(smoothstep(0.02, 0.98, g));               // noir et blanc
    else if (uFiltre < 3.5) col *= vec3(1.08, 1.0, 0.86);                        // chaud
    else if (uFiltre < 4.5) col *= vec3(0.88, 0.98, 1.1);                        // froid
    else col = mix(vec3(g), col, 0.45) * vec3(1.03, 1.0, 0.9) + 0.03;            // pellicule ancienne
  }
  vec2 c = vUv - 0.5;
  col *= 1.0 - dot(c, c) * (uVignette + uOdorat * 0.5 + (uFiltre > 4.5 ? 0.8 : 0.0));
  col += (ign(gl_FragCoord.xy + fract(uTemps) * 61.0) - 0.5) * (uGrain + (uFiltre > 4.5 ? 0.06 : 0.0));
  gl_FragColor = vec4(col, 1.0);
}`;

export class Post {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    this.plein = new THREE.Mesh(geo, null);
    this.plein.frustumCulled = false;
    this.scene.add(this.plein);
    const mat = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
    this.matSeuil = mat(FRAG_SEUIL, { tScene: { value: null }, uTexel: { value: new THREE.Vector2() }, uSeuil: { value: 1.05 } });
    this.matReduire = mat(FRAG_REDUIRE, { tSource: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.matAgrandir = mat(FRAG_AGRANDIR, { tBas: { value: null }, tHaut: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.matRayons = mat(FRAG_RAYONS, { tProfondeur: { value: null }, uSoleilUV: { value: new THREE.Vector2() }, uAspect: { value: 1 } });
    this.matAO = mat(FRAG_AO, { tProfondeur: { value: null }, uTexel: { value: new THREE.Vector2() }, uEchelleProj: { value: 1 }, uProche: { value: 0.25 }, uLointain: { value: 2600 } });
    this.matFinal = mat(FRAG_FINAL, {
      tScene: { value: null }, tProfondeur: { value: null }, tBloom: { value: null }, tAO: { value: null }, tRayons: { value: null },
      uTexel: { value: new THREE.Vector2() }, uCouleurSoleil: { value: new THREE.Color() },
      uExposition: { value: 1 }, uBloom: { value: 0.12 }, uRayons: { value: 0 }, uOdorat: { value: 0 }, uTemps: { value: 0 },
      uDofForce: { value: 0 }, uDofFocus: { value: 10 }, uVignette: { value: 0.55 }, uGrain: { value: 0.018 }, uFiltre: { value: 0 }, uNettete: { value: 0 },
      uProche: { value: 0.25 }, uLointain: { value: 2600 },
    });
    this.matAO.defines = { PAIRES: 4 }; this.matRayons.defines = { NB_RAYONS: 20 };
    this.q = { bloom: true, ao: false, dof: false, rayons: true, msaa: 0 };
    this.largeur = 0; this.hauteur = 0;
    this.cibleScene = null; this.bloomBas = []; this.bloomHaut = []; this.cibleAO = null; this.cibleRayons = null;
    // Paramètres pilotés par le jeu
    this.exposition = 1; this.odorat = 0; this.filtre = 0; this.dofForce = 0; this.dofFocus = 10;
    this.soleilUV = new THREE.Vector2(); this.forceRayons = 0; this.couleurSoleil = new THREE.Color();
  }

  reglerQualite(q) {
    this.q = { bloom: q.bloom, ao: q.ao, dof: q.dof, rayons: q.rayons, msaa: q.msaa };
    const d = {};
    if (q.bloom) d.BLOOM = 1; if (q.ao) d.AO = 1; if (q.dof) d.DOF = 1; if (q.rayons) d.RAYONS = 1; if (q.nettete > 0) d.NETTETE = 1;
    this.matFinal.uniforms.uNettete.value = q.nettete || 0;
    this.matAO.defines = { PAIRES: q.aoFin ? 8 : 4 }; this.matAO.needsUpdate = true;
    this.matRayons.defines = { NB_RAYONS: q.rayonsFin ? 40 : 20 }; this.matRayons.needsUpdate = true;
    this.matFinal.defines = d; this.matFinal.needsUpdate = true;
    const l = this.largeur, h = this.hauteur;
    this.largeur = 0;
    if (l) this.redimensionner(l, h);
  }

  /** (Re)crée les images intermédiaires à la bonne taille (en pixels réels). */
  redimensionner(l, h) {
    l = Math.max(32, Math.floor(l)); h = Math.max(32, Math.floor(h));
    if (l === this.largeur && h === this.hauteur) return;
    this.largeur = l; this.hauteur = h;
    const liberer = (c) => c && c.dispose();
    liberer(this.cibleScene); this.bloomBas.forEach(liberer); this.bloomHaut.forEach(liberer); liberer(this.cibleAO); liberer(this.cibleRayons);
    const profondeur = new THREE.DepthTexture(l, h);
    profondeur.type = THREE.UnsignedIntType;
    this.cibleScene = new THREE.WebGLRenderTarget(l, h, { type: THREE.HalfFloatType, samples: this.q.msaa, depthTexture: profondeur });
    const cible = (div, type = THREE.HalfFloatType) => new THREE.WebGLRenderTarget(Math.max(4, l >> div), Math.max(4, h >> div), { type, depthBuffer: false });
    this.bloomBas = []; this.bloomHaut = [];
    if (this.q.bloom) {
      for (let i = 1; i <= 4; i++) this.bloomBas.push(cible(i));
      for (let i = 1; i <= 3; i++) this.bloomHaut.push(cible(i));
    }
    this.cibleAO = this.q.ao ? cible(1, THREE.UnsignedByteType) : null;
    this.cibleRayons = this.q.rayons ? cible(2, THREE.UnsignedByteType) : null;
  }

  _passe(materiau, cible) {
    this.plein.material = materiau;
    this.renderer.setRenderTarget(cible);
    this.renderer.render(this.scene, this.camera);
  }

  /** Rend la scène puis applique toute la chaîne d'effets. */
  rendre(scene, camera, temps) {
    const r = this.renderer, S = this.cibleScene;
    r.setRenderTarget(S);
    r.render(scene, camera);
    const f = this.matFinal.uniforms;
    f.tScene.value = S.texture; f.tProfondeur.value = S.depthTexture;
    f.uTexel.value.set(1 / this.largeur, 1 / this.hauteur);
    f.uProche.value = camera.near; f.uLointain.value = camera.far;
    if (this.q.bloom) {
      const B = this.bloomBas, H = this.bloomHaut;
      this.matSeuil.uniforms.tScene.value = S.texture;
      this.matSeuil.uniforms.uTexel.value.set(0.5 / this.largeur, 0.5 / this.hauteur);
      this._passe(this.matSeuil, B[0]);
      for (let i = 1; i < B.length; i++) {
        this.matReduire.uniforms.tSource.value = B[i - 1].texture;
        this.matReduire.uniforms.uTexel.value.set(0.5 / B[i - 1].width, 0.5 / B[i - 1].height);
        this._passe(this.matReduire, B[i]);
      }
      let bas = B[B.length - 1];
      for (let i = H.length - 1; i >= 0; i--) {
        const u = this.matAgrandir.uniforms;
        u.tBas.value = bas.texture; u.tHaut.value = B[i].texture; u.uTexel.value.set(0.5 / bas.width, 0.5 / bas.height);
        this._passe(this.matAgrandir, H[i]);
        bas = H[i];
      }
      f.tBloom.value = H[0].texture;
    }
    if (this.q.ao) {
      const u = this.matAO.uniforms;
      u.tProfondeur.value = S.depthTexture; u.uTexel.value.set(1 / this.largeur, 1 / this.hauteur);
      u.uEchelleProj.value = camera.projectionMatrix.elements[5] * 0.5;
      u.uProche.value = camera.near; u.uLointain.value = camera.far;
      this._passe(this.matAO, this.cibleAO);
      f.tAO.value = this.cibleAO.texture;
    }
    if (this.q.rayons && this.forceRayons > 0.01) {
      const u = this.matRayons.uniforms;
      u.tProfondeur.value = S.depthTexture; u.uSoleilUV.value.copy(this.soleilUV); u.uAspect.value = this.largeur / this.hauteur;
      this._passe(this.matRayons, this.cibleRayons);
      f.tRayons.value = this.cibleRayons.texture; f.uRayons.value = this.forceRayons;
    } else f.uRayons.value = 0;
    if (this.q.rayons) f.tRayons.value = this.cibleRayons.texture;
    f.uCouleurSoleil.value.copy(this.couleurSoleil);
    f.uExposition.value = this.exposition; f.uOdorat.value = this.odorat; f.uTemps.value = temps;
    f.uFiltre.value = this.filtre; f.uDofForce.value = this.dofForce; f.uDofFocus.value = this.dofFocus;
    this._passe(this.matFinal, null);
  }
}
