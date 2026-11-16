// Végétation : placement par biome, affichage par « instancing » (une seule commande de dessin
// par espèce pour des milliers de plantes), deux niveaux de détail, tri par cases de 64 m
// (seules les cases visibles sont envoyées à la carte graphique), vent, plantes qui s'écartent
// au passage des animaux, collisions avec les troncs et petits arbres renversables.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { creerAlea, hacher } from '../noyau/maths.js';
import { BIOME } from './terrain.js';
import { FLORE } from './flore.js';

const V = CONFIG.vegetation, TC = V.tailleCellule, DEMI = CONFIG.monde.taille / 2, NC = CONFIG.monde.taille / TC;
const B = BIOME;

// espacement : pas de la grille de semis (m). proba : chance de pousser par biome.
// proche / loin : distances d'affichage du modèle détaillé puis simplifié. rayon : collision du tronc.
export const ESPECES_FLORE = [
  { id: 'sequoia', nom: 'Conifère géant', espacement: 14, proche: 150, loin: 1200, capProche: 260, capLoin: 2600, rayon: 0.95, ombre: true,
    echelle: [0.65, 1.25], proba: { [B.FORET_CONIFERES]: 0.5, [B.FORET_HUMIDE]: 0.05 } },
  { id: 'araucaria', nom: 'Araucaria', espacement: 13, proche: 150, loin: 1200, capProche: 260, capLoin: 2200, rayon: 0.55, ombre: true,
    echelle: [0.7, 1.2], proba: { [B.FORET_CONIFERES]: 0.3, [B.FORET_HUMIDE]: 0.07, [B.PLAINE]: 0.012, [B.ROCAILLE]: 0.03 } },
  { id: 'ginkgo', nom: 'Ginkgo', espacement: 11, proche: 120, loin: 700, capProche: 220, capLoin: 1500, rayon: 0.5, ombre: true,
    echelle: [0.6, 1.25], proba: { [B.FORET_HUMIDE]: 0.42, [B.RIVE]: 0.2, [B.PLAINE]: 0.025, [B.FORET_CONIFERES]: 0.06, [B.MARAIS]: 0.05 } },
  { id: 'fougereArbo', nom: 'Fougère arborescente', espacement: 8, proche: 95, loin: 420, capProche: 340, capLoin: 1800, rayon: 0.24, ombre: true, renversable: 0.85,
    echelle: [0.5, 1.3], proba: { [B.FORET_HUMIDE]: 0.5, [B.RIVE]: 0.4, [B.FORET_CONIFERES]: 0.1, [B.MARAIS]: 0.16, [B.PLAINE]: 0.015 } },
  { id: 'cycas', nom: 'Cycadale', espacement: 7, proche: 85, loin: 320, capProche: 420, capLoin: 1800, rayon: 0.3, ombre: true, renversable: 9,
    echelle: [0.7, 1.5], proba: { [B.PLAINE]: 0.09, [B.FORET_HUMIDE]: 0.3, [B.RIVE]: 0.2, [B.FORET_CONIFERES]: 0.12, [B.PLAGE]: 0.025, [B.ROCAILLE]: 0.04 } },
  { id: 'fougere', nom: 'Fougère', espacement: 2.3, proche: 55, loin: 150, capProche: 4200, capLoin: 9000, rayon: 0, ombre: false, detail: true,
    echelle: [0.7, 1.9], proba: { [B.PLAINE]: 0.6, [B.FORET_HUMIDE]: 0.75, [B.FORET_CONIFERES]: 0.55, [B.RIVE]: 0.5, [B.MARAIS]: 0.12, [B.ROCAILLE]: 0.06 } },
  { id: 'prele', nom: 'Prêle géante', espacement: 3, proche: 60, loin: 190, capProche: 1500, capLoin: 3500, rayon: 0, ombre: false, detail: true, humide: true,
    echelle: [0.6, 1.3], proba: { [B.MARAIS]: 0.5, [B.RIVE]: 0.42 } },
  { id: 'troncMort', nom: 'Tronc mort', espacement: 24, proche: 110, loin: 300, capProche: 80, capLoin: 200, rayon: 0, ombre: true,
    echelle: [0.7, 1.3], proba: { [B.FORET_HUMIDE]: 0.14, [B.FORET_CONIFERES]: 0.14, [B.RIVE]: 0.05, [B.PLAGE]: 0.03 } },
  { id: 'rocher', nom: 'Rocher', espacement: 12, proche: 120, loin: 600, capProche: 220, capLoin: 900, rayon: 1, ombre: true, roche: true,
    echelle: [0.5, 2.6], proba: { [B.ROCAILLE]: 0.3, [B.PLAGE]: 0.03, [B.PLAINE]: 0.014, [B.FORET_CONIFERES]: 0.04, [B.FORET_HUMIDE]: 0.02 } },
];

const NB_POUSSEURS = 4;

export class Vegetation {
  constructor(scene, terrain, ombres, atlas) {
    this.scene = scene; this.terrain = terrain; this.ombres = ombres; this.atlas = atlas;
    this.densite = 0.65; this.facteurProche = 0.8; this.distanceVue = 620;
    this.collisionneurs = [];                    // par case : troncs et rochers solides
    this.masques = new Uint16Array(NC * NC);     // par case : quelles espèces sont présentes
    for (let i = 0; i < NC * NC; i++) this.collisionneurs.push([]);
    this.chutes = [];                            // arbres en train de tomber
    this.pousseurs = [];
    for (let i = 0; i < NB_POUSSEURS; i++) this.pousseurs.push(new THREE.Vector4(0, -999, 0, 1));
    this.uniformes = {
      uTemps: { value: 0 }, uVentForce: { value: 0.4 }, uPousseurs: { value: this.pousseurs },
      uRosee: { value: 0 }, uTranslucide: { value: new THREE.Color() },
    };
    this.materiauxFeuillage = [];
    this._semer();
    this._creerMailles();
    this._sphere = new THREE.Sphere(); this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion();
    this._axe = new THREE.Vector3(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3(); this._q2 = new THREE.Quaternion();
    this.compteur = 0;
  }

  // ------------------------------------------------------------- SEMIS -----
  _semer() {
    const T = this.terrain, m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
    ESPECES_FLORE.forEach((esp, indice) => {
      const alea = creerAlea(5000 + indice * 97), listes = [];
      for (let i = 0; i < NC * NC; i++) listes.push([]);
      const pas = esp.espacement, n = Math.floor(CONFIG.monde.taille / pas);
      for (let j = 1; j < n - 1; j++) for (let i = 1; i < n - 1; i++) {
        const x = -DEMI + (i + alea()) * pas, z = -DEMI + (j + alea()) * pas, tirage = alea(), a1 = alea(), a2 = alea();
        const proba = esp.proba[T.biome(x, z)];
        if (!proba) continue;
        // bosquets : le bruit regroupe les plantes en taches plutôt qu'en semis uniforme
        const bosquet = 0.45 + 1.1 * Math.max(0, T.bruit2.bruit2(x * 0.012 + indice * 31, z * 0.012 - indice * 17) + 0.35);
        if (tirage > proba * bosquet) continue;
        const h = T.hauteur(x, z);
        if (h < (esp.humide ? -0.25 : 0.25) || (esp.humide && h > 1.6)) continue;
        if (!esp.roche && T.pente(x, z) > 0.75) continue;
        if (Math.hypot(x + 235, z - 40) < 9 && esp.rayon > 0) continue;   // clairière de départ
        const ech = esp.echelle[0] + a1 * a1 * (esp.echelle[1] - esp.echelle[0]) + (esp.roche && a1 > 0.93 ? 2.5 : 0);
        listes[this._case(x, z)].push(x, h, z, a2 * Math.PI * 2, ech);
      }
      // Mélange de chaque case : réduire la densité retire alors des plantes au hasard
      for (const l of listes) {
        for (let i = l.length / 5 - 1; i > 0; i--) {
          const j = Math.floor(alea() * (i + 1));
          for (let k = 0; k < 5; k++) { const t = l[i * 5 + k]; l[i * 5 + k] = l[j * 5 + k]; l[j * 5 + k] = t; }
        }
      }
      // Tableau unique de matrices, rangé case par case
      let total = 0;
      for (const l of listes) total += l.length / 5;
      esp.matrices = new Float32Array(total * 16);
      esp.debut = new Uint32Array(NC * NC); esp.nombre = new Uint16Array(NC * NC);
      esp.indice = indice; esp.total = total;
      let k = 0;
      for (let c = 0; c < NC * NC; c++) {
        const l = listes[c];
        esp.debut[c] = k; esp.nombre[c] = l.length / 5;
        if (l.length) this.masques[c] |= 1 << indice;
        for (let i = 0; i < l.length; i += 5) {
          const penche = esp.rayon > 0 && !esp.roche ? 0.05 : esp.roche ? 0.5 : 0.12;
          e.set((hacher(k, 1) - 0.5) * penche, l[i + 3], (hacher(k, 2) - 0.5) * penche, 'YXZ');
          q.setFromEuler(e);
          const ey = esp.roche ? l[i + 4] * (0.6 + hacher(k, 3) * 0.6) : l[i + 4] * (0.9 + hacher(k, 3) * 0.25);
          m.compose(p.set(l[i], l[i + 1] - (esp.roche ? l[i + 4] * 0.25 : 0), l[i + 2]), q, s.set(l[i + 4], ey, l[i + 4]));
          m.toArray(esp.matrices, k * 16);
          if (esp.rayon > 0) {
            this.collisionneurs[c].push({
              x: l[i], z: l[i + 2], y: l[i + 1], r: esp.rayon * l[i + 4], espece: esp, instance: k, angle: l[i + 3], echelle: l[i + 4],
              petit: !!esp.renversable && l[i + 4] < esp.renversable, tombe: false,
            });
          }
          k++;
        }
      }
    });
  }

  _case(x, z) {
    const cx = Math.min(NC - 1, Math.max(0, Math.floor((x + DEMI) / TC))), cz = Math.min(NC - 1, Math.max(0, Math.floor((z + DEMI) / TC)));
    return cz * NC + cx;
  }

  // ------------------------------------------------------------ MATÉRIAUX --
  _materiauFeuillage(esp) {
    const mat = new THREE.MeshLambertMaterial({ map: this.atlas, alphaTest: 0.42, side: THREE.DoubleSide, vertexColors: true });
    this.materiauxFeuillage.push(mat);
    const portee = { value: esp.loin };
    esp.uPortee = portee;
    mat.userData.cle = 'feuillage';
    mat.userData.surCompilation = (shader) => {
      Object.assign(shader.uniforms, this.uniformes, { uPortee: portee });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>
          attribute float aVent;
          uniform float uTemps, uVentForce, uPortee;
          uniform vec4 uPousseurs[${NB_POUSSEURS}];
          varying vec3 vTeinte; varying float vDistCam;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 origine = instanceMatrix[3].xyz;
          float ph = origine.x * 0.31 + origine.z * 0.27;
          float rafale = sin(uTemps * 0.7 + origine.x * 0.05 + origine.z * 0.04) * 0.5 + 0.5;
          float amp = aVent * uVentForce * (0.3 + 0.7 * rafale);
          transformed.x += sin(uTemps * 1.7 + ph + position.y * 0.4) * amp * 0.55;
          transformed.z += cos(uTemps * 1.3 + ph * 1.3 + position.y * 0.3) * amp * 0.45;
          transformed.y -= abs(sin(uTemps * 1.7 + ph)) * amp * 0.12;
          // Les plantes s'écartent au passage des animaux
          vec3 pm = (instanceMatrix * vec4(transformed, 1.0)).xyz;
          for (int i = 0; i < ${NB_POUSSEURS}; i++) {
            vec3 d = pm - uPousseurs[i].xyz;
            float dist = length(d.xz);
            float f = (1.0 - smoothstep(uPousseurs[i].w * 0.35, uPousseurs[i].w, dist)) * aVent * step(abs(d.y), 4.0 * uPousseurs[i].w);
            vec3 dep = vec3(d.x / max(dist, 0.05) * f * 0.9, -f * 0.45, d.z / max(dist, 0.05) * f * 0.9);
            transformed += dep * mat3(instanceMatrix);
          }
          // Apparition progressive à la limite de la distance d'affichage
          vDistCam = distance(origine, cameraPosition);
          transformed *= 1.0 - smoothstep(uPortee * 0.84, uPortee, vDistCam);
          float al = fract(sin(dot(origine.xz, vec2(12.9898, 78.233))) * 43758.5453);
          vTeinte = vec3(0.82 + al * 0.36, 0.86 + fract(al * 7.0) * 0.28, 0.8 + fract(al * 13.0) * 0.3);`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vTeinte;\nvarying float vDistCam;\nuniform float uRosee;\nuniform vec3 uTranslucide;')
        .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb *= vTeinte;\n// de loin, les feuilles deviennent plus fines que les pixels : on renforce leur opacité pour garder des arbres touffus\ndiffuseColor.a = clamp(diffuseColor.a * (1.0 + vDistCam * 0.03), 0.0, 1.0);')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += diffuseColor.rgb * uTranslucide;      // lumière traversant les feuilles
          float eclat = step(0.9988, fract(sin(dot(floor(vMapUv * vec2(1800.0, 440.0)), vec2(12.9898, 78.233))) * 43758.5453));
          totalEmissiveRadiance += vec3(dot(uTranslucide, vec3(0.33))) * eclat * uRosee * 5.0;  // gouttes de rosée qui scintillent`);
    };
    return this.ombres.enregistrer(mat);
  }

  _creerMailles() {
    const matProfondeur = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.atlas, alphaTest: 0.42, side: THREE.DoubleSide });
    const matRoche = this.ombres.enregistrer(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }));
    for (const esp of ESPECES_FLORE) {
      const mat = esp.roche ? matRoche : this._materiauFeuillage(esp);
      const creer = (simple, capacite) => {
        const maille = new THREE.InstancedMesh(FLORE[esp.id](simple), mat, Math.min(capacite, Math.max(1, esp.total)));
        maille.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        maille.frustumCulled = false; maille.count = 0;
        maille.castShadow = esp.ombre; maille.receiveShadow = true;
        if (!esp.roche) maille.customDepthMaterial = matProfondeur;
        if (esp.detail) maille.layers.set(1);     // petites plantes : absentes des reflets
        this.scene.add(maille);
        return maille;
      };
      esp.mailleProche = creer(false, esp.capProche);
      esp.mailleLoin = creer(true, esp.capLoin);
    }
  }

  reglerQualite(q) {
    this.densite = q.densiteVegetation; this.facteurProche = q.porteeProche; this.distanceVue = q.distanceVue;
    // avec l'anticrénelage, les bords des feuilles sont adoucis (« alpha to coverage »)
    for (const m of this.materiauxFeuillage) { m.alphaToCoverage = q.msaa > 0; m.alphaTest = q.msaa > 0 ? 0.3 : 0.42; }
    for (const esp of ESPECES_FLORE) {
      esp.mailleLoin.castShadow = esp.ombre && q.cascades >= 3;
      if (esp.uPortee) esp.uPortee.value = Math.min(esp.loin * (esp.detail ? q.porteeProche : 1), q.distanceVue);
    }
  }

  // --------------------------------------------------------- MISE À JOUR ----
  /**
   * @param pousseurs tableau d'objets {x, y, z, rayon} (animaux proches qui écartent les plantes)
   */
  mettreAJour(dt, temps, camera, frustum, pousseurs, meteo, ciel) {
    const u = this.uniformes;
    u.uTemps.value = temps; u.uVentForce.value = 0.25 + meteo.vent * 0.9; u.uRosee.value = meteo.rosee * ciel.jour;
    u.uTranslucide.value.copy(ciel.couleurLumiere).multiplyScalar(ciel.intensiteLumiere * 0.05);
    for (let i = 0; i < NB_POUSSEURS; i++) {
      const p = pousseurs[i];
      if (p) this.pousseurs[i].set(p.x, p.y, p.z, p.rayon); else this.pousseurs[i].set(0, -999, 0, 1);
    }
    this._animerChutes(dt);
    if (this.compteur++ % 3 !== 0) return;        // le tri des cases n'est refait qu'une image sur trois
    const cx = camera.position.x, cz = camera.position.z, demiDiag = TC * 0.71;
    for (const esp of ESPECES_FLORE) { esp.nP = 0; esp.nL = 0; }
    const c0x = Math.max(0, Math.floor((cx - this.distanceVue + DEMI) / TC)), c1x = Math.min(NC - 1, Math.floor((cx + this.distanceVue + DEMI) / TC));
    const c0z = Math.max(0, Math.floor((cz - this.distanceVue + DEMI) / TC)), c1z = Math.min(NC - 1, Math.floor((cz + this.distanceVue + DEMI) / TC));
    const sph = this._sphere;
    for (let z = c0z; z <= c1z; z++) for (let x = c0x; x <= c1x; x++) {
      const c = z * NC + x;
      if (!this.masques[c]) continue;
      const mx = -DEMI + (x + 0.5) * TC, mz = -DEMI + (z + 0.5) * TC;
      const d = Math.hypot(mx - cx, mz - cz);
      if (d > this.distanceVue + demiDiag) continue;
      sph.center.set(mx, this.terrain.hauteur(mx, mz) + 12, mz); sph.radius = demiDiag + 26;
      if (d > 70 && !frustum.intersectsSphere(sph)) continue;
      for (const esp of ESPECES_FLORE) {
        const nb = esp.nombre[c];
        if (!nb) continue;
        const proche = esp.proche * this.facteurProche;
        const loin = Math.min(esp.loin * (esp.detail ? this.facteurProche : 1), this.distanceVue);
        if (d - demiDiag > loin) continue;
        // la densité ne réduit que les plantes sans collision (sinon on heurterait des troncs invisibles)
        const n = esp.rayon > 0 ? nb : Math.max(1, Math.round(nb * this.densite));
        const src = esp.matrices, deb = esp.debut[c] * 16;
        const P = esp.mailleProche, L = esp.mailleLoin;
        if (d + demiDiag < proche) esp.nP = copier(src, deb, n, P, esp.nP);
        else if (d - demiDiag > proche && d + demiDiag < loin) esp.nL = copier(src, deb, n, L, esp.nL);
        else {
          // case à cheval sur une limite : on trie plante par plante
          const p2 = proche * proche, l2 = loin * loin;
          for (let i = 0; i < n; i++) {
            const o = deb + i * 16, dx = src[o + 12] - cx, dz = src[o + 14] - cz, dd = dx * dx + dz * dz;
            if (dd < p2) esp.nP = copier(src, o, 1, P, esp.nP);
            else if (dd < l2) esp.nL = copier(src, o, 1, L, esp.nL);
          }
        }
      }
    }
    for (const esp of ESPECES_FLORE) {
      esp.mailleProche.count = esp.nP; esp.mailleLoin.count = esp.nL;
      esp.mailleProche.instanceMatrix.needsUpdate = true; esp.mailleLoin.instanceMatrix.needsUpdate = true;
      esp.mailleProche.visible = esp.nP > 0; esp.mailleLoin.visible = esp.nL > 0;
    }
  }

  // ------------------------------------------------------------ COLLISIONS --
  /**
   * Repousse l'entité {x, z} hors des troncs et rochers. Renvoie true s'il y a eu contact.
   * Si `masse` et `vitesse` sont suffisantes, les petits arbres sont renversés.
   */
  resoudreCollision(ent, rayon, masse = 0, vitesse = 0, dirX = 0, dirZ = 1) {
    let touche = false;
    const x0 = Math.floor((ent.x - rayon - 3 + DEMI) / TC), x1 = Math.floor((ent.x + rayon + 3 + DEMI) / TC);
    const z0 = Math.floor((ent.z - rayon - 3 + DEMI) / TC), z1 = Math.floor((ent.z + rayon + 3 + DEMI) / TC);
    for (let cz = z0; cz <= z1; cz++) for (let cx = x0; cx <= x1; cx++) {
      if (cx < 0 || cz < 0 || cx >= NC || cz >= NC) continue;
      const liste = this.collisionneurs[cz * NC + cx];
      for (let i = 0; i < liste.length; i++) {
        const c = liste[i];
        if (c.tombe) continue;
        const dx = ent.x - c.x, dz = ent.z - c.z, min = rayon + c.r, d2 = dx * dx + dz * dz;
        if (d2 >= min * min) continue;
        if (c.petit && masse >= V.masseRenversement && vitesse >= V.vitesseRenversement) {
          c.tombe = true;
          this.chutes.push({ c, t: 0, dx: dirX, dz: dirZ });
          this.dernierRenverse = c;
          continue;
        }
        const d = Math.sqrt(d2) || 0.001;
        ent.x = c.x + (dx / d) * min; ent.z = c.z + (dz / d) * min;
        touche = true;
      }
    }
    return touche;
  }

  _animerChutes(dt) {
    for (let i = this.chutes.length - 1; i >= 0; i--) {
      const ch = this.chutes[i], c = ch.c;
      ch.t += dt;
      const t = Math.min(1, ch.t / 1.1), angle = t * t * 1.48;           // accélère comme une vraie chute
      this._axe.set(ch.dz, 0, -ch.dx).normalize();
      this._q.setFromAxisAngle(this._axe, angle);
      this._q2.setFromAxisAngle(this._s.set(0, 1, 0), c.angle);
      this._q.multiply(this._q2);
      this._m.compose(this._p.set(c.x, c.y, c.z), this._q, this._s.setScalar(c.echelle));
      this._m.toArray(c.espece.matrices, c.instance * 16);
      this.compteur = 0;                                                  // force le rafraîchissement
      if (t >= 1) this.chutes.splice(i, 1);
    }
  }

  /** Masque des espèces végétales présentes dans la case (pour le carnet). */
  especesIci(x, z) { return this.masques[this._case(x, z)]; }
  /** Densité d'arbres autour du point (0..1), pour l'ambiance sonore. */
  densiteArbres(x, z) { return Math.min(1, this.collisionneurs[this._case(x, z)].length / 30); }
}

/** Copie n matrices dans le tampon d'une maille instanciée (sans dépasser sa capacité). */
function copier(src, debut, n, maille, deja) {
  const dst = maille.instanceMatrix.array, cap = maille.instanceMatrix.count;
  if (deja + n > cap) n = cap - deja;
  const o = deja * 16, fin = n * 16;
  for (let i = 0; i < fin; i++) dst[o + i] = src[debut + i];
  return deja + n;
}
