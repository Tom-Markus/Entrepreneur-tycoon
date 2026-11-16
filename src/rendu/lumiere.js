// Informations de lumière partagées par plusieurs shaders (feuillage, peau).
// Mises à jour une fois par image dans principal.js.
import * as THREE from 'three';

export const LUMIERE = {
  /** Direction vers l'astre qui éclaire, dans le repère de la caméra. */
  uSoleilVue: { value: new THREE.Vector3(0, 1, 0) },
  /** Couleur × intensité de la lumière directe. */
  uSoleilCouleur: { value: new THREE.Color(1, 1, 1) },
};
