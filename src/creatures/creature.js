// Une créature = un maillage + un squelette + une animation 100 % procédurale.
// Aucune animation enregistrée : à chaque image, on calcule où poser les pieds sur le terrain
// (cinématique inverse), comment balancer le bassin, la queue, le cou, et comment respirer.
import * as THREE from 'three';
import { borner, amortir, lissage, fract, melanger } from '../noyau/maths.js';
import { construireCreature, creerSquelette } from './constructeur.js';
import { ESPECES } from './especes.js';

// Objets temporaires réutilisés (aucune allocation pendant le jeu)
const _qB = new THREE.Quaternion(), _qT = new THREE.Quaternion(), _qf = new THREE.Quaternion(), _qt = new THREE.Quaternion();
const _qm = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qi = new THREE.Quaternion(), _e = new THREE.Euler();
const _H = new THREE.Vector3(), _F = new THREE.Vector3(), _A = new THREE.Vector3(), _K = new THREE.Vector3();
const _d = new THREE.Vector3(), _p = new THREE.Vector3(), _v = new THREE.Vector3(), _pT = new THREE.Vector3(), _pB = new THREE.Vector3();
const X = new THREE.Vector3(1, 0, 0);

/** Garde en mémoire les géométries (une par espèce/variante) et fabrique les matériaux de peau. */
export class BanqueCreatures {
  constructor(ombres, texPeau, atlas) {
    this.ombres = ombres; this.texPeau = texPeau; this.modeles = {};
    this.matFilaments = ombres.enregistrer(new THREE.MeshLambertMaterial({ map: atlas, alphaTest: 0.35, side: THREE.DoubleSide }));
  }

  modele(id, nomVariante = '', variante = {}) {
    const cle = id + '/' + nomVariante;
    if (!this.modeles[cle]) this.modeles[cle] = construireCreature(ESPECES[id], variante);
    return this.modeles[cle];
  }

  materiauPeau() {
    const u = { uBoue: { value: 0 }, uBlessure: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: this.texPeau.detail, normalMap: this.texPeau.normale, roughness: 0.72, metalness: 0 });
    mat.normalScale.set(0.85, 0.85);
    mat.userData.cle = 'peau';
    mat.userData.uniformes = u;
    mat.userData.surCompilation = (shader) => {
      shader.uniforms.uBoue = u.uBoue; shader.uniforms.uBlessure = u.uBlessure;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aHauteur;\nvarying float vHauteur;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHauteur = aHauteur;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vHauteur;\nuniform float uBoue, uBlessure;')
        .replace('#include <map_fragment>', `#include <map_fragment>
          float nb = texture2D(map, vMapUv * 0.13).r;
          // Boue qui s'accumule sur le bas du corps
          float boue = uBoue * smoothstep(0.8, 0.1, vHauteur + (nb - 0.75) * 0.9);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.05, 0.032), clamp(boue, 0.0, 0.92));
          // Blessures : fines griffures sombres sur les flancs (sobres, sans effusion)
          float griffure = uBlessure * smoothstep(0.9, 0.93, fract(vMapUv.x * 0.31 + nb * 1.4)) * smoothstep(0.35, 0.8, vHauteur) * step(vHauteur, 1.2);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.15, 0.022, 0.016), griffure * 0.8);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.45, clamp(boue, 0.0, 1.0) * 0.5);');
    };
    return this.ombres.enregistrer(mat);
  }

  creer(id, echelle = 1, nomVariante = '', variante = {}) {
    return new Creature(ESPECES[id], this.modele(id, nomVariante, variante), this.materiauPeau(), this.matFilaments, echelle);
  }

  liberer(creature) { this.ombres.materiaux.delete(creature.matPeau); creature.matPeau.dispose(); }
}

export class Creature {
  constructor(def, modele, matPeau, matFilaments, echelle) {
    this.def = def; this.infos = modele.infos; this.matPeau = matPeau;
    this.uniformes = matPeau.userData.uniformes;
    this.groupe = new THREE.Group();
    const { squelette, parNom, racine } = creerSquelette(this.infos.os);
    const geo = modele.geometrie;
    this.maille = new THREE.SkinnedMesh(geo, geo.groups.length > 1 ? [matPeau, matFilaments] : matPeau);
    this.maille.add(racine); this.maille.bind(squelette);
    this.maille.castShadow = true; this.maille.receiveShadow = true;
    if (!geo.boundingSphere) geo.computeBoundingSphere();
    this.maille.boundingSphere = geo.boundingSphere.clone();
    this.maille.boundingSphere.radius *= 1.3;
    this.groupe.add(this.maille);
    this.os = parNom;

    // --- État piloté par le joueur ou l'IA ---
    this.x = 0; this.z = 0; this.y = 0; this.cap = 0;
    this.vitesse = 0; this.vitAng = 0; this.echelle = echelle;
    this.marche = def.marche; this.course = def.course;     // vitesses de référence (pour choisir la démarche)
    this.pose = 'debout';        // 'debout' | 'couche' | 'mort'
    this.teteBas = false;        // tête au sol (boire, manger, brouter)
    this.teteHaut = false;       // tête levée (broutage en hauteur, alerte)
    this.mache = false;          // mouvement de mastication
    this.regard = null;          // direction (cap, radians) vers laquelle tourner la tête, ou null
    this.action = null; this.tAction = 0; this.dureeAction = 1; this.sensAction = 1;
    this.effort = 0;             // 0 repos … 1 essoufflé (rythme de la respiration)
    this.nage = false;
    this.surPas = null;          // rappel(x, y, z, creature) à chaque pied posé

    // --- Variables internes d'animation ---
    this.phase = Math.random(); this.couche = 0; this.baisse = 0; this.leve = 0;
    this.tangage = 0; this.roulis = 0; this.inertie = 0; this.lacetTete = 0; this.bouche = 0;
    this.solY = null; this.tRespire = Math.random() * 6; this.fige = false; this.accel = 0; this.vPrec = 0;
    this.teteMonde = new THREE.Vector3();

    const I = this.infos, O = this.os;
    this.avant = I.nomsAvant.map((n) => O[n]);
    this.cou = this.avant.filter((b) => b.name.startsWith('cou'));
    this.queue = []; for (let k = 1; k <= I.nbQueue; k++) this.queue.push(O['queue' + k]);
    this.museauLocal = new THREE.Vector3(I.museau[0] - 0, I.museau[1] - O.tete.userData.repos.y, I.museau[2]);
    // position du museau dans le repère de l'os « tête » (pose de repos = axes du monde)
    { let b = O.tete; const p = new THREE.Vector3(); while (b && b.isBone) { p.add(b.userData.repos); b = b.parent; }
      this.museauLocal.set(I.museau[0] - p.x, I.museau[1] - p.y, I.museau[2] - p.z); }
    this.hanche = I.hanche;
    this.pattes = I.pattes.map((P, i) => {
      const os = P.noms.map((n) => O[n]);
      return {
        P, os, parentAvant: P.avant, cote: P.cote,
        emboiture: os[0].userData.repos.clone(),
        d0: os[1].userData.repos.clone().normalize(), d1: os[2].userData.repos.clone().normalize(), d2: os[3].userData.repos.clone().normalize(),
        neutre: new THREE.Vector3(P.pts[3][0], 0, P.pts[3][2]), piedY: P.pts[3][1],
        wx: 0, wy: 0, wz: 0, dx: 0, dy: 0, dz: 0, appui: true, init: false, s: 0,
      };
    });
    this.quadrupede = def.type === 'quadrupede';
    this.epauleZ = this.quadrupede ? I.pattes[2].pts[0][2] : def.longueur * 0.22;
    this.placer(0, 0, 0);
  }

  /** Téléporte la créature (les pieds seront replacés à la prochaine image). */
  placer(x, z, cap) {
    this.x = x; this.z = z; this.cap = cap; this.solY = null;
    for (const p of this.pattes) p.init = false;
  }

  /** Lance une action ponctuelle : 'morsure' | 'queue' | 'rugir' | 'touche' | 'esquive'. */
  declencher(type, duree, sens = 1) { this.action = type; this.tAction = 0; this.dureeAction = duree; this.sensAction = sens; }

  /** Position du bout du museau dans le monde (valeur de l'image précédente). */
  positionTete(sortie) { return sortie.copy(this.museauLocal).applyMatrix4(this.os.tete.matrixWorld); }

  set boue(v) { this.uniformes.uBoue.value = v; }
  get boue() { return this.uniformes.uBoue.value; }
  set blessure(v) { this.uniformes.uBlessure.value = v; }

  // ============================================================ ANIMATION ====
  mettreAJour(dt, terrain) {
    const s = this.echelle, def = this.def, O = this.os;
    const cosC = Math.cos(this.cap), sinC = Math.sin(this.cap);
    const v = this.vitesse, av = Math.abs(v);
    const allure = borner((av - this.marche) / Math.max(0.1, this.course - this.marche), 0, 1);
    const mort = this.pose === 'mort';

    // --- Hauteur du sol sous le corps (ou flottaison) ---
    const hSol = terrain.hauteur(this.x, this.z);
    const profNage = this.hanche * s * 0.8;
    this.nage = hSol < -profNage && !mort;
    const cibleY = this.nage ? -profNage : hSol;
    this.solY = this.solY === null ? cibleY : amortir(this.solY, cibleY, 14, dt);
    this.y = this.solY;
    const g = this.groupe;
    g.position.set(this.x, this.solY, this.z); g.rotation.y = this.cap; g.scale.setScalar(s);
    if (this.fige) return;     // carcasse déjà posée : plus rien à calculer

    // --- Action en cours (enveloppe 0 → 1 → 0) ---
    let env = 0, tA = 0;
    if (this.action) {
      this.tAction += dt; tA = this.tAction / this.dureeAction;
      if (tA >= 1) { this.action = null; tA = 0; } else env = Math.sin(Math.PI * tA);
    }
    const act = this.action;

    // --- Cycle de marche ---
    const jambe = this.hanche * s;
    const foulee = jambe * (this.quadrupede ? 1.15 + 1.0 * allure : 1.35 + 1.9 * allure);
    let cadence = av / foulee;
    const duty = this.quadrupede ? melanger(0.7, 0.5, allure) : melanger(0.64, 0.4, allure);
    // À l'arrêt : petits pas de replacement si un pied est mal placé ou si l'animal pivote
    let erreur = 0, enVol = false;
    for (const p of this.pattes) { if (!p.appui) enVol = true; if (p.err > erreur) erreur = p.err; }
    if (av < 0.12 * s + 0.05) {
      const besoin = Math.abs(this.vitAng) > 0.25 || erreur > jambe * 0.22 || enVol;
      cadence = besoin && this.couche < 0.3 ? 0.9 / Math.sqrt(Math.max(0.3, s * this.hanche * 0.5)) : 0;
    }
    this.phase = fract(this.phase + cadence * dt);
    const ph = this.phase * Math.PI * 2;

    // --- Posture générale ---
    this.couche = amortir(this.couche, this.pose !== 'debout' ? 1 : 0, mort ? 2.2 : 1.6, dt);
    const fwdX = sinC, fwdZ = cosC;
    const lon = this.epauleZ * s;
    let pente = 0;
    if (!this.nage) pente = Math.atan2(terrain.hauteur(this.x + fwdX * lon, this.z + fwdZ * lon) - terrain.hauteur(this.x - fwdX * lon * 0.3, this.z - fwdZ * lon * 0.3), lon * 1.3);
    this.accel = amortir(this.accel, (v - this.vPrec) / Math.max(dt, 0.001), 4, dt); this.vPrec = v;
    const cibleTangage = -pente * (this.quadrupede ? 1 : 0.55) + allure * 0.07 * (this.quadrupede ? 0 : 1) + borner(this.accel * 0.012, -0.08, 0.1);
    this.tangage = amortir(this.tangage, cibleTangage, 5, dt);
    this.inertie = amortir(this.inertie, borner(this.vitAng, -1.6, 1.6), 3, dt);
    const cibleRoulis = borner(-this.vitAng * av * 0.035, -0.22, 0.22);
    this.roulis = amortir(this.roulis, cibleRoulis, 5, dt);

    // Tête : baisser jusqu'au sol (boucle de contrôle sur la hauteur réelle du museau)
    this.positionTete(this.teteMonde);
    if ((this.teteBas || this.pose === 'couche') && !mort) {
      const solTete = Math.max(terrain.hauteur(this.teteMonde.x, this.teteMonde.z), 0);
      const marge = this.pose === 'couche' ? 0.12 * s * def.tete.L * 3 : 0.1 * s * def.tete.L;
      if (this.teteMonde.y > solTete + marge) this.baisse = Math.min(1, this.baisse + dt * 0.7); else this.baisse = Math.max(0, this.baisse - dt * 0.4);
    } else this.baisse = mort ? amortir(this.baisse, 0.75, 2, dt) : Math.max(0, this.baisse - dt * 1.1);
    this.leve = amortir(this.leve, this.teteHaut ? 1 : 0, 2, dt);

    const bip = this.quadrupede ? 0 : 1;
    const rebond = this.quadrupede ? 0.012 : 0.022;
    const bob = -Math.cos(ph * 2) * jambe / s * rebond * (0.4 + 1.8 * allure) * Math.min(1, av * 2);
    const lateral = Math.cos(ph - duty * Math.PI) * 0.035 * this.hanche * (1 - allure * 0.5) * Math.min(1, av * 2) * (this.quadrupede ? 0.6 : 1);
    const lacetBassin = Math.sin(ph - duty * Math.PI) * (0.05 + 0.05 * allure) * Math.min(1, av * 2);
    const hCouche = melanger(1, def.hauteurCouche || 0.35, this.couche);
    let roulis = this.roulis + lateral * 0.5, tang = this.tangage + this.baisse * (def.corpsBas || 0) * bip * (1 - this.couche);
    let avance = 0, lacetCorps = lacetBassin, yBassin = this.hanche * hCouche + bob;
    if (mort) { roulis = this.couche * 1.4; yBassin = melanger(this.hanche, def.rayon * 0.75 / 1, this.couche); tang = 0; }
    if (act === 'morsure') { avance = env * 0.16 * this.hanche; tang += env * 0.1 * bip; }
    else if (act === 'queue') lacetCorps += Math.sin(tA * Math.PI * 2) * 0.5 * this.sensAction;
    else if (act === 'touche') { roulis += env * 0.16 * this.sensAction; yBassin -= env * 0.05 * this.hanche; }
    else if (act === 'esquive') { roulis += env * 0.3 * this.sensAction; yBassin -= env * 0.12 * this.hanche; }
    else if (act === 'rugir') tang -= env * 0.07 * bip;

    const bassin = O.bassin;
    bassin.position.set(lateral, yBassin, avance);
    bassin.rotation.set(tang, lacetCorps, roulis);
    _qB.copy(bassin.quaternion); _pB.copy(bassin.position);

    // --- Colonne : dos, torse, cou, tête ---
    this.tRespire += dt * melanger(1.5, 5.5, this.effort) / Math.pow(Math.max(0.3, def.longueur * s), 0.3);
    const souffle = mort ? 0 : Math.sin(this.tRespire) * melanger(0.012, 0.03, this.effort);
    const nCou = this.cou.length;
    // regard : rotation de la tête vers une direction du monde
    let cibleLacet = 0;
    if (this.regard !== null && !mort) { let d = this.regard - this.cap; d = Math.atan2(Math.sin(d), Math.cos(d)); cibleLacet = borner(d, -1.25, 1.25); }
    this.lacetTete = amortir(this.lacetTete, cibleLacet - this.inertie * 0.0, 4, dt);
    const tirer = this.mache && this.baisse > 0.5 ? Math.sin(this.tRespire * 3.1) * 0.035 : 0;
    let cibleBouche = 0;
    for (let i = 1; i < this.avant.length; i++) {
      const b = this.avant[i], nom = b.name;
      if (nom === 'dos') { b.rotation.set(-tang * 0.12 * bip, -lacetCorps * 0.4, -lateral * 0.3); b.scale.set(1 + souffle, 1 + souffle, 1); }
      else if (nom === 'torse') { b.rotation.set(-tang * 0.1 * bip, -lacetCorps * 0.5, 0); b.scale.set(1 + souffle * 0.6, 1 + souffle * 0.6, 1); }
      else if (nom === 'tete') {
        let px = this.baisse * 0.3 - this.leve * 0.1 + Math.sin(ph * 2 + 0.6) * 0.02 * allure;
        if (act === 'morsure') px += -env * 0.2 + (tA > 0.5 ? 0.15 : 0);
        if (act === 'rugir') px -= env * 0.28;
        b.rotation.set(px, this.lacetTete / (nCou + 1), this.lacetTete * 0.15);
      } else {
        // os du cou : se partagent la flexion
        let px = (this.baisse * (def.couBas || 0.8) - this.leve * 0.5 - this.tangage * 0.6 * bip) / nCou + tirer;
        px += Math.sin(ph * 2 - i * 0.5) * 0.012 * allure;
        if (this.couche > 0 && !mort) px += this.couche * 0.06;
        if (act === 'morsure') px += env * 0.22;
        if (act === 'rugir') px -= env * 0.16;
        b.rotation.set(px, this.lacetTete / (nCou + 1), 0);
      }
    }
    if (act === 'morsure') cibleBouche = tA < 0.5 ? 1 : 0;
    else if (act === 'rugir') cibleBouche = env * (0.75 + 0.1 * Math.sin(this.tRespire * 20));
    else if (this.mache) cibleBouche = 0.12 + 0.12 * Math.sin(this.tRespire * 4);
    else if (this.effort > 0.6) cibleBouche = 0.1 + 0.05 * Math.sin(this.tRespire);
    this.bouche = amortir(this.bouche, cibleBouche, 22, dt);
    O.machoire.rotation.x = this.bouche * 0.62;

    // --- Queue : contrepoids, ondulation, inertie dans les virages ---
    const nq = this.queue.length;
    for (let i = 0; i < nq; i++) {
      const w = 0.5 + i / nq;
      let lacet = (-this.inertie * 0.22 + Math.sin(ph - 0.5 - i * 0.55) * (0.025 + 0.05 * allure) * Math.min(1, av + 0.2)) * w;
      lacet += Math.sin(this.tRespire * 0.37 + i * 0.6) * 0.012 * w;       // vie au repos
      let px = -tang * (i === 0 ? 0.75 : 0.25 / nq) + Math.sin(ph * 2 - i * 0.45) * 0.01 * allure + this.couche * 0.05;
      if (act === 'queue') lacet += -this.sensAction * Math.sin(tA * Math.PI * 2 - i * 0.35) * (0.3 + 0.12 * i) * env;
      if (mort) { lacet = 0.1 * w; px = 0.04; }
      this.queue[i].rotation.set(px, lacet, 0);
    }

    // --- Bras des bipèdes ---
    if (O.brasG && !this.quadrupede) {
      const bal = Math.sin(ph) * 0.12 * allure;
      O.brasG.rotation.x = bal + (act === 'morsure' ? -env * 0.4 : 0); O.brasD.rotation.x = -bal + (act === 'morsure' ? -env * 0.4 : 0);
    }

    // --- Pattes : placement des pieds puis cinématique inverse ---
    // orientation et position (repère du groupe) du torse, parent des pattes avant
    _qT.copy(_qB).multiply(this.avant[1].quaternion);
    _pT.copy(this.avant[1].userData.repos).applyQuaternion(_qB).add(_pB);
    _p.copy(this.avant[2].userData.repos).applyQuaternion(_qT); _pT.add(_p);
    _qT.multiply(this.avant[2].quaternion);

    const ecart = this.quadrupede ? 0.92 : melanger(1, 0.5, Math.min(1, av / (this.marche * s + 0.01)));
    const lever = jambe * (0.1 + 0.16 * allure);
    for (let i = 0; i < this.pattes.length; i++) {
      const p = this.pattes[i];
      // point neutre du pied dans le monde
      const nx = p.neutre.x * ecart * s, nz = p.neutre.z * s;
      const neutreX = this.x + nx * cosC + nz * sinC, neutreZ = this.z - nx * sinC + nz * cosC;
      if (!p.init) { p.wx = neutreX; p.wz = neutreZ; p.wy = terrain.hauteur(neutreX, neutreZ); p.appui = true; p.init = true; }
      // déphasage de la patte dans le cycle
      let dec = p.cote > 0 ? 0 : 0.5;
      if (p.parentAvant) dec += melanger(0.25, 0.5, allure);
      const pl = fract(this.phase + dec);
      p.err = Math.hypot(p.wx - neutreX, p.wz - neutreZ);
      if (mort || this.nage) {
        // pattes pendantes (carcasse) ou pagayage (nage)
        const cyc = this.nage ? Math.sin(ph + dec * 6.283) : 0;
        _F.set(p.neutre.x, p.piedY + this.hanche * (mort ? 0.25 : 0.2) + (this.nage ? Math.cos(ph + dec * 6.283) * 0.12 * this.hanche : 0), p.neutre.z + cyc * 0.3 * this.hanche);
        if (mort) _F.set(p.neutre.x * 0.6 + (p.cote > 0 ? 0 : 0), this.hanche * 0.3, p.neutre.z + this.hanche * 0.25);
        p.init = false; p.s = 0.5;
      } else {
        if (pl < duty && cadence > 0) {
          if (!p.appui) {            // le pied vient de se poser
            p.appui = true; p.wy = terrain.hauteur(p.wx, p.wz);
            if (this.surPas) this.surPas(p.wx, p.wy, p.wz, this, p);
          }
          p.s = 0;
        } else if (cadence > 0) {
          if (p.appui) { p.appui = false; p.dx = p.wx; p.dy = p.wy; p.dz = p.wz; }
          const sw = (pl - duty) / (1 - duty);
          // où poser le pied : sous la hanche au milieu du prochain appui
          const tRestant = ((1 - sw) * (1 - duty) + duty * 0.5) / cadence;
          const cx = neutreX + fwdX * v * tRestant, cz = neutreZ + fwdZ * v * tRestant;
          const e = sw * sw * (3 - 2 * sw);
          p.wx = melanger(p.dx, cx, e); p.wz = melanger(p.dz, cz, e);
          p.wy = melanger(p.dy, terrain.hauteur(cx, cz), e) + Math.sin(Math.PI * sw) * lever;
          p.s = sw;
        }
        if (p.err > jambe * 2.2) p.init = false;   // téléportation : on repart du point neutre
        // pied → repère du groupe
        const ddx = p.wx - this.x, ddz = p.wz - this.z;
        _F.set((ddx * cosC - ddz * sinC) / s, (p.wy - this.solY) / s + p.piedY, (ddx * sinC + ddz * cosC) / s);
      }
      // --- IK ---
      const parentQ = p.parentAvant ? _qT : _qB, parentP = p.parentAvant ? _pT : _pB;
      _H.copy(p.emboiture).applyQuaternion(parentQ).add(parentP);
      // métatarse : incliné selon la phase (déroulé du pied, puis repli pendant le vol)
      let delta = 0;
      if (!mort && !this.nage) {
        delta = p.s > 0 ? melanger(0.4, 0, p.s) - 0.75 * Math.sin(Math.PI * p.s) : 0.4 * lissage(duty * 0.55, duty, fract(this.phase + (p.cote > 0 ? 0 : 0.5) + (p.parentAvant ? melanger(0.25, 0.5, allure) : 0))) * Math.min(1, av);
        delta *= (p.parentAvant ? 0.5 : 1) * (0.5 + 0.5 * allure + (this.quadrupede ? 0 : 0.3));
      }
      const cy = Math.cos(delta), sy = Math.sin(delta);
      const my = -p.d2.y, mz = -p.d2.z;
      _A.set(_F.x - p.d2.x * p.P.l3, _F.y + (my * cy - mz * sy) * p.P.l3, _F.z + (my * sy + mz * cy) * p.P.l3);
      // deux os (fémur + tibia) de la hanche H à la cheville A
      _d.subVectors(_A, _H);
      let dist = _d.length();
      const a = p.P.l1, b = p.P.l2, max = (a + b) * 0.995, min = Math.abs(a - b) + 0.02;
      if (dist > max) { _d.multiplyScalar(max / dist); dist = max; _A.addVectors(_H, _d); }
      else if (dist < min) { _d.multiplyScalar(min / Math.max(dist, 1e-4)); dist = min; _A.addVectors(_H, _d); }
      _d.multiplyScalar(1 / dist);
      const cosH = borner((a * a + dist * dist - b * b) / (2 * a * dist), -1, 1), sinH = Math.sqrt(1 - cosH * cosH);
      // direction de pliage (genou vers l'avant, coude vers l'arrière)
      _v.set(p.cote * 0.12, 0.15, p.P.genou);
      _v.addScaledVector(_d, -_v.dot(_d)).normalize();
      _K.copy(_H).addScaledVector(_d, a * cosH).addScaledVector(_v, a * sinH);
      // rotations des os à partir des directions voulues
      _v.subVectors(_K, _H).normalize(); _qf.setFromUnitVectors(p.d0, _v);
      _v.subVectors(_A, _K).normalize(); _qt.setFromUnitVectors(p.d1, _v);
      _v.subVectors(_F, _A).normalize(); _qm.setFromUnitVectors(p.d2, _v);
      const orteils = p.s > 0 ? Math.sin(Math.PI * p.s) * 0.7 : (mort ? 0.5 : 0);   // à plat en appui, pointés vers le bas en vol
      _qp.setFromAxisAngle(X, orteils + (this.nage ? 0.6 : 0));
      p.os[0].quaternion.copy(_qi.copy(parentQ).invert()).multiply(_qf);
      p.os[1].quaternion.copy(_qi.copy(_qf).invert()).multiply(_qt);
      p.os[2].quaternion.copy(_qi.copy(_qt).invert()).multiply(_qm);
      p.os[3].quaternion.copy(_qi.copy(_qm).invert()).multiply(_qp);
    }
    if (mort && this.couche > 0.98) this.fige = true;
  }
}
