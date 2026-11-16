// Lumière du soleil + ombres en cascade (CSM = « Cascaded Shadow Maps »).
// Principe : on découpe la vue en 1 à 3 tranches ; chaque tranche a sa propre
// carte d'ombre, ce qui donne des ombres nettes de près et correctes au loin.
// On s'appuie sur le module CSM fourni avec Three.js (licence MIT).
import * as THREE from 'three';
import { CSM } from 'three/addons/csm/CSM.js';

export class Ombres {
  constructor(scene, camera, renderer) {
    this.scene = scene; this.camera = camera; this.renderer = renderer;
    this.materiaux = new Set();   // tous les matériaux éclairés du jeu
    this.csm = null;
    this.version = 0;
    this.frequence = 1;           // 1 = ombres recalculées à chaque image, 2 = une image sur deux
    this.compteur = 0;
    this.direction = new THREE.Vector3(-0.5, -1, -0.3).normalize();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;   // ombres douces
    renderer.shadowMap.autoUpdate = false;
    this.configurer(2, 1024, 90, 1);
  }

  /** (Re)crée les cascades. nbCascades = 0 coupe complètement les ombres. */
  configurer(nbCascades, taille, portee, frequence) {
    if (this.csm) { this.csm.remove(); this.csm.dispose(); }
    this.actives = nbCascades > 0;
    this.frequence = frequence;
    this.csm = new CSM({
      camera: this.camera, parent: this.scene,
      cascades: Math.max(1, nbCascades), maxFar: portee, mode: 'practical',
      shadowMapSize: taille, shadowBias: -0.00025,
      lightDirection: this.direction.clone(), lightIntensity: 1,
      lightNear: 1, lightFar: 900, lightMargin: 120,
    });
    for (const l of this.csm.lights) {
      l.castShadow = this.actives;
      l.shadow.normalBias = 0.06;
    }
    this.version++;
    for (const m of this.materiaux) this._appliquer(m);
    this.renderer.shadowMap.needsUpdate = true;
  }

  /**
   * Enregistre un matériau éclairé. Si le matériau a besoin de modifier son shader,
   * il fournit `userData.surCompilation(shader)` et une clé unique `userData.cle`.
   */
  enregistrer(materiau) {
    this.materiaux.add(materiau);
    this._appliquer(materiau);
    return materiau;
  }

  _appliquer(materiau) {
    const perso = materiau.userData.surCompilation;
    this.csm.setupMaterial(materiau);
    const csmCompilation = materiau.onBeforeCompile;
    materiau.onBeforeCompile = (shader, renderer) => {
      csmCompilation(shader);
      if (perso) perso(shader, renderer);
    };
    const cle = (materiau.userData.cle || 'std') + '_v' + this.version;
    materiau.customProgramCacheKey = () => cle;
    materiau.needsUpdate = true;
  }

  redimensionner() { this.csm.updateFrustums(); }

  /** À appeler à chaque image, après le déplacement de la caméra. */
  mettreAJour(direction, couleur, intensite) {
    this.direction.copy(direction);
    for (const l of this.csm.lights) { l.color.copy(couleur); l.intensity = intensite; }
    this.compteur++;
    if (this.compteur % this.frequence === 0) {
      this.csm.lightDirection.copy(direction);
      this.camera.updateMatrixWorld();
      this.csm.update();
      if (this.actives) this.renderer.shadowMap.needsUpdate = true;
    }
  }
}

/**
 * Ombres simplifiées pour le niveau « Bas » : un disque sombre et flou sous chaque animal.
 * Presque gratuit (une seule commande de dessin) et les animaux ne semblent plus flotter.
 */
export class OmbresSimples {
  constructor(scene, terrain, texture) {
    this.terrain = terrain; this.max = 48;
    const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ map: texture, color: 0x000000, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -3 });
    this.maille = new THREE.InstancedMesh(geo, mat, this.max);
    this.maille.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.maille.frustumCulled = false; this.maille.renderOrder = 1; this.maille.visible = false;
    scene.add(this.maille);
    this.actives = false;
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(); this._axe = new THREE.Vector3(0, 1, 0);
  }

  /** creatures : liste d'objets Creature visibles (joueur compris). jour : 0 la nuit … 1 en plein jour. */
  mettreAJour(creatures, jour) {
    this.maille.visible = this.actives && jour > 0.15;
    if (!this.maille.visible) return;
    let n = 0;
    for (let i = 0; i < creatures.length && n < this.max; i++) {
      const c = creatures[i], sol = this.terrain.hauteur(c.x, c.z);
      if (sol < -0.05) continue;                     // pas d'ombre sur l'eau
      const L = c.def.longueur * c.echelle;
      this._q.setFromAxisAngle(this._axe, c.cap);
      this._m.compose(this._p.set(c.x, sol + 0.05, c.z), this._q, this._s.set(c.def.rayon * c.echelle * 3.2 + 0.25, 1, L * 0.62 + 0.3));
      this.maille.setMatrixAt(n++, this._m);
    }
    this.maille.count = n; this.maille.instanceMatrix.needsUpdate = true;
    this.maille.material.opacity = 0.5 * Math.min(1, jour);
  }
}
