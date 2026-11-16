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
