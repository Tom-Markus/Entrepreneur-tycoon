// Surface de l'eau (lac, rivière, marais, mer) : une seule nappe au niveau 0.
// Le shader lit la carte des hauteurs du terrain pour connaître la profondeur :
// couleur selon la profondeur, transparence près des berges, écume, reflets du ciel,
// ondulations concentriques au passage des animaux. Reflet « planaire » réel en qualité élevée.
import * as THREE from 'three';

const NB_ONDES = 8;

const VERTEX = /* glsl */`
varying vec3 vPos;
void main() {
  vec4 m = modelMatrix * vec4(position, 1.0);
  vPos = m.xyz;
  gl_Position = projectionMatrix * viewMatrix * m;
}`;

const FRAGMENT = /* glsl */`
precision highp float;
varying vec3 vPos;
uniform sampler2D uNormales, uBruit, uHauteurs, uReflet;
uniform float uTemps, uEch, uDec, uPluie, uDensiteBrume, uVent;
uniform vec3 uSoleil, uCouleurSoleil, uZenith, uHorizon, uBrume;
uniform vec4 uOndes[${NB_ONDES}];
uniform mat4 uMatriceReflet;
void main() {
  float prof = -texture2D(uHauteurs, vPos.xz * uEch + uDec).r;
  if (prof < -0.03) discard;                       // terre ferme : rien à dessiner
  float mer = smoothstep(560.0, 780.0, length(vPos.xz));
  vec2 p = vPos.xz;
  // Vaguelettes : deux couches de normales qui défilent en sens contraires
  vec2 n1 = texture2D(uNormales, p * 0.045 + uTemps * vec2(0.012, 0.008)).xy * 2.0 - 1.0;
  vec2 n2 = texture2D(uNormales, p * 0.11 - uTemps * vec2(0.010, 0.017)).xy * 2.0 - 1.0;
  vec2 n3 = texture2D(uNormales, p * 0.65 + uTemps * vec2(0.09, -0.07)).xy * 2.0 - 1.0;
  vec2 nxy = (n1 + n2) * mix(0.16, 0.6, mer) * (0.6 + uVent * 0.8) + n3 * uPluie * 0.7;
  // Ondes concentriques (pas des animaux, éclaboussures)
  for (int i = 0; i < ${NB_ONDES}; i++) {
    vec4 o = uOndes[i];
    float age = uTemps - o.z;
    if (age > 0.0 && age < 4.0) {
      vec2 dv = p - o.xy; float r = length(dv); float front = age * 2.3;
      float w = sin((r - front) * 5.5) * exp(-abs(r - front) * 1.5) * o.w * (1.0 - age / 4.0);
      nxy += dv / max(r, 0.05) * w;
    }
  }
  vec3 N = normalize(vec3(nxy.x, 1.0, nxy.y));
  vec3 V = normalize(cameraPosition - vPos);
  float fres = 0.05 + 0.95 * pow(1.0 - max(dot(N, V), 0.0), 4.0);     // eau calme et sombre : très réfléchissante
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 ciel = mix(uHorizon, uZenith, pow(clamp(R.y, 0.0, 1.0), 0.55));
  #ifdef REFLETS
    vec4 pr = uMatriceReflet * vec4(vPos, 1.0);
    ciel = texture2D(uReflet, pr.xy / pr.w + N.xz * 0.035).rgb;
  #endif
  float rs = max(dot(R, uSoleil), 0.0);
  float spec = pow(rs, 420.0) * 7.0 + pow(rs, 48.0) * 0.22;
  // Couleur du volume d'eau : tanins verdâtres en eau douce, bleu-vert en mer
  vec3 clair = mix(vec3(0.06, 0.11, 0.06), vec3(0.04, 0.19, 0.21), mer);
  vec3 sombre = mix(vec3(0.006, 0.02, 0.014), vec3(0.006, 0.035, 0.075), mer);
  vec3 lumiere = uHorizon * 1.25 + uCouleurSoleil * 0.22;
  vec3 corps = mix(clair, sombre, 1.0 - exp(-prof * 0.5)) * lumiere;
  float opacite = smoothstep(0.0, 0.14, prof) * (0.22 + 0.78 * (1.0 - exp(-prof * 1.3)));
  vec3 col = mix(corps, ciel, fres) + uCouleurSoleil * spec;
  float alpha = mix(opacite, 1.0, fres * smoothstep(0.0, 0.1, prof));
  // Écume le long des berges (plus marquée en mer, où elle avance par vagues)
  float bande = smoothstep(0.45, 0.0, prof);
  float bruitE = texture2D(uBruit, p * 0.17 + uTemps * 0.02).g;
  float vague = 0.5 + 0.5 * sin(prof * 9.0 - uTemps * 1.5 + bruitE * 6.0);
  float ecume = bande * smoothstep(0.5, 0.78, bruitE + vague * 0.4 * mer + bande * 0.22) * mix(0.3, 1.0, mer);
  col = mix(col, lumiere * 0.85 + uCouleurSoleil * 0.2, ecume);
  alpha = max(alpha, ecume * 0.9);
  float dc = length(cameraPosition - vPos);
  col = mix(col, uBrume, 1.0 - exp(-uDensiteBrume * uDensiteBrume * dc * dc));
  gl_FragColor = vec4(col, alpha);
}`;

export class Eau {
  constructor(scene, terrain, texBruit, texNormaleEau) {
    this.scene = scene;
    this.ondes = [];
    for (let i = 0; i < NB_ONDES; i++) this.ondes.push(new THREE.Vector4(0, 0, -100, 0));
    this.prochaineOnde = 0;
    this.matriceReflet = new THREE.Matrix4();
    this.uniformes = {
      uNormales: { value: texNormaleEau }, uBruit: { value: texBruit }, uHauteurs: { value: terrain.texHauteurs },
      uReflet: { value: null }, uTemps: { value: 0 }, uEch: { value: terrain.echelleUV }, uDec: { value: terrain.decalageUV },
      uPluie: { value: 0 }, uDensiteBrume: { value: 0.001 }, uVent: { value: 0.4 },
      uSoleil: { value: new THREE.Vector3(0, 1, 0) }, uCouleurSoleil: { value: new THREE.Color() },
      uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uBrume: { value: new THREE.Color() },
      uOndes: { value: this.ondes }, uMatriceReflet: { value: this.matriceReflet },
    };
    this.materiau = new THREE.ShaderMaterial({
      vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms: this.uniformes, defines: {},
      transparent: true, depthWrite: false,
    });
    const geo = new THREE.PlaneGeometry(3400, 3400).rotateX(-Math.PI / 2);
    this.maille = new THREE.Mesh(geo, this.materiau);
    this.maille.renderOrder = 5;
    scene.add(this.maille);
    // Reflet planaire
    this.reflets = false;
    this.cible = null;
    this.camReflet = new THREE.PerspectiveCamera();
    this._v = new THREE.Vector3(); this._cible = new THREE.Vector3(); this._q = new THREE.Vector4();
    this._plan = new THREE.Plane(); this._clip = new THREE.Vector4(); this._rot = new THREE.Matrix4();
  }

  reglerQualite(q) {
    this.reflets = q.reflets; this.eco = !!q.refletsEco; this.pleins = !!q.refletsPleins; this.imageReflet = 0;
    this.materiau.defines = q.reflets ? { REFLETS: 1 } : {};
    this.materiau.needsUpdate = true;
    if (q.reflets && !this.cible) {
      this.cible = new THREE.WebGLRenderTarget(512, 288, { type: THREE.HalfFloatType, depthBuffer: true });
      this.uniformes.uReflet.value = this.cible.texture;
    }
  }

  /** Déclenche une onde circulaire à la surface (pas, éclaboussure). */
  ajouterOnde(x, z, amplitude, temps) {
    this.ondes[this.prochaineOnde].set(x, z, temps, amplitude);
    this.prochaineOnde = (this.prochaineOnde + 1) % NB_ONDES;
  }

  mettreAJour(temps, ciel, meteo) {
    const u = this.uniformes;
    u.uTemps.value = temps;
    u.uSoleil.value.copy(ciel.dirLumiere);
    u.uCouleurSoleil.value.copy(ciel.couleurLumiere).multiplyScalar(ciel.intensiteLumiere);
    u.uZenith.value.copy(ciel.couleurZenith); u.uHorizon.value.copy(ciel.couleurHorizon);
    u.uBrume.value.copy(ciel.couleurBrume); u.uDensiteBrume.value = this.scene.fog.density;
    u.uPluie.value = meteo.pluie; u.uVent.value = meteo.vent;
  }

  /** Rend la scène « à l'envers » dans une texture (caméra miroir sous la surface). */
  rendreReflet(renderer, scene, camera, largeur, hauteur) {
    if (!this.reflets || camera.position.y < 0.05) return;
    // mode économique : image trois fois plus petite, recalculée une image sur trois
    if (this.eco && this.imageReflet++ % 3 !== 0) return;
    const div = this.eco ? 3 : this.pleins ? 1 : 2;
    const l = Math.max(64, Math.floor(largeur / div)), h = Math.max(64, Math.floor(hauteur / div));
    if (this.cible.width !== l || this.cible.height !== h) this.cible.setSize(l, h);
    const cam = this.camReflet, n = this._v.set(0, 1, 0);
    cam.position.set(camera.position.x, -camera.position.y, camera.position.z);
    this._rot.extractRotation(camera.matrixWorld);
    this._cible.set(0, 0, -1).applyMatrix4(this._rot).add(camera.position);
    this._cible.y = -this._cible.y;
    cam.up.set(0, 1, 0).applyMatrix4(this._rot); cam.up.y = -cam.up.y;
    cam.lookAt(this._cible);
    cam.near = camera.near; cam.far = camera.far;
    cam.updateMatrixWorld();
    cam.projectionMatrix.copy(camera.projectionMatrix);
    cam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    this.matriceReflet.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    // Plan de coupe oblique : on ne rend que ce qui est au-dessus de l'eau (technique d'E. Lengyel)
    this._plan.setFromNormalAndCoplanarPoint(n, this._cible.set(0, 0.02, 0)).applyMatrix4(cam.matrixWorldInverse);
    const c = this._clip.set(this._plan.normal.x, this._plan.normal.y, this._plan.normal.z, this._plan.constant);
    const pm = cam.projectionMatrix.elements, q = this._q;
    q.x = (Math.sign(c.x) + pm[8]) / pm[0]; q.y = (Math.sign(c.y) + pm[9]) / pm[5];
    q.z = -1; q.w = (1 + pm[10]) / pm[14];
    c.multiplyScalar(2 / c.dot(q));
    pm[2] = c.x; pm[6] = c.y; pm[10] = c.z + 1 - 0.003; pm[14] = c.w;
    this.maille.visible = false;
    const ancienne = renderer.getRenderTarget();
    renderer.setRenderTarget(this.cible);
    renderer.clear();
    renderer.render(scene, cam);
    renderer.setRenderTarget(ancienne);
    this.maille.visible = true;
  }
}
