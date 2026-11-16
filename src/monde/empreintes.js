// Empreintes de pas : de petits décalques posés sur les sols meubles (boue, sable, berges).
// Réserve fixe de 96 empreintes recyclées en boucle : la plus ancienne est remplacée.
import * as THREE from 'three';

const MAX = 96, DUREE = 90;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _n = new THREE.Vector3(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const HAUT = new THREE.Vector3(0, 1, 0);

export class Empreintes {
  constructor(scene, terrain, texture) {
    this.terrain = terrain; this.suivante = 0;
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    this.naissance = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 2).fill(-999), 2);
    geo.setAttribute('aNaissance', this.naissance);
    this.materiau = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
      uniforms: { uTex: { value: texture }, uTemps: { value: 0 } },
      vertexShader: /* glsl */`
        attribute vec2 aNaissance; uniform float uTemps; varying vec2 vUv; varying float vA;
        void main() { vUv = uv; vA = clamp(1.0 - (uTemps - aNaissance.x) / ${DUREE}.0, 0.0, 1.0) * aNaissance.y;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uTex; varying vec2 vUv; varying float vA;
        void main() { float a = texture2D(uTex, vUv).a * vA; if (a < 0.02) discard; gl_FragColor = vec4(0.012, 0.009, 0.006, a * 0.75); }`,
    });
    this.maille = new THREE.InstancedMesh(geo, this.materiau, MAX);
    this.maille.frustumCulled = false; this.maille.renderOrder = 2; this.maille.layers.set(1);
    _m.makeScale(0, 0, 0);
    for (let i = 0; i < MAX; i++) this.maille.setMatrixAt(i, _m);
    scene.add(this.maille);
  }

  /** Pose une empreinte si le sol est assez meuble. Renvoie la « mollesse » du sol (0..1). */
  poser(x, z, cap, taille, temps) {
    const T = this.terrain, h = T.hauteur(x, z);
    if (h < -0.05) return 0;
    const mou = Math.max(T.boue(x, z), T.sable(x, z) * 0.8, h < 1.0 ? 0.6 : 0, 0.18 - T.roche(x, z));
    if (mou < 0.25) return mou;
    T.normale(x, z, _n);
    _q.setFromUnitVectors(HAUT, _n); _q2.setFromAxisAngle(HAUT, cap + Math.PI); _q.multiply(_q2);
    _m.compose(_p.set(x, h + 0.03, z), _q, _s.set(taille, 1, taille));
    const i = this.suivante; this.suivante = (i + 1) % MAX;
    this.maille.setMatrixAt(i, _m); this.maille.instanceMatrix.needsUpdate = true;
    this.naissance.setXY(i, temps, Math.min(1, mou * 1.3)); this.naissance.needsUpdate = true;
    return mou;
  }

  mettreAJour(temps) { this.materiau.uniforms.uTemps.value = temps; }
}
