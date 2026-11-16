// Écosystème : troupeaux d'herbivores, prédateurs solitaires, petits charognards, carcasses.
// Chaque animal suit une « machine à états » très simple (brouter, boire, fuir, dormir, chasser…).
// Pour ménager le processeur, les animaux réfléchissent à tour de rôle (quelques fois par seconde)
// et ceux qui sont loin du joueur ne sont ni animés ni affichés.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { borner, ecartAngle, creerAlea } from '../noyau/maths.js';
import { ESPECES } from './especes.js';
import { LIEUX, BIOME } from '../monde/terrain.js';

const E = CONFIG.ecosysteme;
const _sphere = new THREE.Sphere(), _v = new THREE.Vector3();

// Zones de vie de chaque groupe : [x, z, rayon du domaine]
const DOMAINES = {
  stegosaurus: [[-120, 330, 170], [140, -60, 150]],
  diplodocus: [[-330, 120, 200]],
  brachiosaurus: [[60, 150, 220]],
  dryosaurus: [[-180, 200, 150], [-30, 420, 160], [-420, 330, 140]],
  ceratosaurus: [[330, 330, 240], [-80, -130, 220]],
  compsognathus: [[-260, 30, 130], [220, 420, 150], [-520, 420, 130]],
  allosaurus: [[330, -130, 260]],
};

class Animal {
  constructor(creature, def, troupeau) {
    this.c = creature; this.def = def; this.troupeau = troupeau;
    this.sante = def.sante; this.vivant = true;
    this.cibleX = 0; this.cibleZ = 0; this.vVoulue = 0; this.arret = 1.5;
    this.comportement = 'marche';   // ce que le carnet scientifique peut observer
    this.tPense = Math.random(); this.tPause = 0; this.decX = 0; this.decZ = 0;
    this.distJoueur = 1e9; this.anime = false; this.tAttaque = 0; this.bloque = 0;
    this.espece = def.id;
  }
  get x() { return this.c.x; } get z() { return this.c.z; } get y() { return this.c.y; }
}

export class Ecosysteme {
  constructor(jeu) {
    this.jeu = jeu;
    this.animaux = []; this.troupeaux = []; this.carcasses = [];
    this.alea = creerAlea(CONFIG.monde.graine + 5);
    this.tCarcasseNaturelle = 60; this.image = 0;
    this.pousseurs = [];
    this._peupler();
  }

  // --------------------------------------------------------- PEUPLEMENT ----
  _pointValide(x, z, rayon, profondeur = 0) {
    const T = this.jeu.terrain;
    for (let i = 0; i < 40; i++) {
      const a = this.alea() * Math.PI * 2, r = Math.sqrt(this.alea()) * rayon;
      const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      if (T.praticable(px, pz, profondeur)) return { x: px, z: pz };
    }
    return { x, z };
  }

  _peupler() {
    const jeu = this.jeu;
    for (const pop of E.populations) {
      const def = ESPECES[pop.espece];
      for (let g = 0; g < pop.groupes; g++) {
        const d = DOMAINES[pop.espece][g % DOMAINES[pop.espece].length];
        const centre = this._pointValide(d[0], d[1], 60);
        const tr = {
          def, membres: [], domX: d[0], domZ: d[1], domR: d[2], ancreX: centre.x, ancreZ: centre.z,
          etat: 'calme', t: 20 + this.alea() * 60, soif: this.alea() * E.soifTroupeau[0] * 0.9, tEtat: 0,
          menaceX: 0, menaceZ: 0, irrite: 0, faim: 40 + this.alea() * 60, proie: null, carcasse: null, eau: null, tPense: this.alea(),
          nicheur: pop.espece === 'dryosaurus' && g === 0, nid: null, cx: centre.x, cz: centre.z, agresse: false, tRugir: 0, tMenace: 0,
        };
        for (let i = 0; i < pop.taille; i++) {
          // tailles variées : quelques jeunes dans les troupeaux
          const ech = def.role === 'troupeau' && i >= pop.taille - 2 && pop.taille > 3 ? 0.55 + this.alea() * 0.2 : 0.88 + this.alea() * 0.14;
          const c = jeu.banque.creer(pop.espece, ech);
          const p = this._pointValide(centre.x, centre.z, 8 + def.rayon * 8);
          c.placer(p.x, p.z, this.alea() * 6.28);
          c.surPas = jeu.surPas;
          c.groupe.visible = false;
          jeu.scene.add(c.groupe);
          const a = new Animal(c, def, tr);
          const ang = this.alea() * 6.28, r = (2 + this.alea() * 5) * (1 + def.rayon * 2.2);
          a.decX = Math.cos(ang) * r; a.decZ = Math.sin(ang) * r;
          a.cibleX = p.x; a.cibleZ = p.z;
          tr.membres.push(a); this.animaux.push(a);
        }
        if (tr.nicheur) this._creerNid(tr);
        this.troupeaux.push(tr);
      }
    }
  }

  /** Site de nidification des Dryosaurus : quelques œufs dans une cuvette. */
  _creerNid(tr) {
    const jeu = this.jeu, p = this._pointValide(tr.ancreX, tr.ancreZ, 25);
    tr.nid = p;
    const y = jeu.terrain.hauteur(p.x, p.z);
    const mat = jeu.ombres.enregistrer(new THREE.MeshStandardMaterial({ color: 0xcfc6ae, roughness: 0.8 }));
    const oeufs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 8, 6).scale(1, 1.35, 1), mat, 16);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 16; i++) {
      const nid = i < 8 ? 0 : 1, a = (i % 8) / 8 * 6.28, r = 0.22;
      m.makeTranslation(p.x + (nid ? 2.6 : 0) + Math.cos(a) * r, y + 0.05, p.z + (nid ? 1.4 : 0) + Math.sin(a) * r);
      oeufs.setMatrixAt(i, m);
    }
    oeufs.castShadow = true;
    jeu.scene.add(oeufs);
    const bord = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.14, 5, 12).rotateX(Math.PI / 2), jeu.ombres.enregistrer(new THREE.MeshStandardMaterial({ color: 0x3d2f1e, roughness: 1 })));
    bord.position.set(p.x, y, p.z); jeu.scene.add(bord);
    const bord2 = bord.clone(); bord2.position.set(p.x + 2.6, y, p.z + 1.4); jeu.scene.add(bord2);
    tr.membres[0].couveur = { x: p.x + 0.9, z: p.z }; tr.membres[1].couveur = { x: p.x + 3.5, z: p.z + 1.4 };
  }

  // ------------------------------------------------------------ REQUÊTES ----
  carcasseProche(x, z, rayon) {
    for (const k of this.carcasses) if (k.viande > 0 && Math.hypot(k.x - x, k.z - z) < rayon + k.rayon) return k;
    return null;
  }

  /** Coup porté en (x, z). Renvoie true si un animal est touché. */
  frapper(x, z, rayon, degats, source, type) {
    let touche = false;
    for (const a of this.animaux) {
      if (!a.vivant || a.c === source) continue;
      const r = a.def.rayon * a.c.echelle * 1.6;
      if (Math.hypot(a.x - x, a.z - z) > rayon + r) continue;
      this.blesser(a, degats * (a.def.geant ? 0.15 : 1), source);
      touche = true;
    }
    if (touche) {
      this.jeu.audio.impact(0.7);
      this.jeu.cameraJeu.secouer(0.25);
      this.jeu.particules.emettre('poussiere', x, this.jeu.terrain.hauteur(x, z) + 0.8, z, 5, 1);
    }
    return touche;
  }

  blesser(a, q, source) {
    if (!a.vivant) return;
    const jeu = this.jeu, tr = a.troupeau, parJoueur = source && source.estJoueur;
    a.sante -= q;
    a.c.declencher('touche', 0.35, Math.random() < 0.5 ? 1 : -1);
    a.c.blessure = borner(1 - a.sante / a.def.sante, 0, 1);
    tr.irrite = 45;
    if (source) { tr.menaceX = source.x; tr.menaceZ = source.z; }
    if (parJoueur) tr.agresse = true;
    if (a.sante <= 0) { this._mourir(a, parJoueur); return; }
    jeu.audio.jouerVoix(a.espece, 'cri', a, a.c.echelle);
    if (a.def.fuit || a.def.role === 'charognard' || (a.def.role === 'predateur' && a.sante < a.def.sante * 0.35)) this._fuir(tr, tr.menaceX, tr.menaceZ);
    else if (a.def.role === 'predateur' && parJoueur) { tr.etat = 'combat'; tr.tEtat = 0; }
  }

  _mourir(a, parJoueur) {
    const jeu = this.jeu, tr = a.troupeau;
    a.vivant = false; a.c.pose = 'mort'; a.c.vitesse = 0; a.c.vitAng = 0; a.comportement = 'carcasse';
    a.c.teteBas = false; a.c.mache = false; a.c.regard = null;
    tr.membres.splice(tr.membres.indexOf(a), 1);
    this.carcasses.push({ x: a.x, z: a.z, viande: a.def.viande * Math.pow(a.c.echelle, 3), viandeMax: a.def.viande, t: 0, animal: a, rayon: a.def.rayon * a.c.echelle, espece: a.espece });
    jeu.audio.impact(1);
    if (parJoueur) { jeu.carnet.signalerAction('chasse'); jeu.ui.notifier('Proie abattue. Maintenez ' + jeu.entrees.nomAction('interagir') + ' pour manger.'); }
    if (a.def.fuit) this._fuir(tr, a.x, a.z);
  }

  _fuir(tr, mx, mz) {
    if (!tr.membres.length) return;
    const T = this.jeu.terrain;
    tr.etat = 'fuite'; tr.tEtat = 0; tr.menaceX = mx; tr.menaceZ = mz;
    // direction opposée à la menace ; on cherche un cap dégagé
    const base = Math.atan2(tr.cx - mx, tr.cz - mz);
    let meilleur = base;
    for (const d of [0, 0.5, -0.5, 1, -1, 1.6, -1.6]) {
      const a = base + d;
      if (T.praticable(tr.cx + Math.sin(a) * 45, tr.cz + Math.cos(a) * 45) && T.praticable(tr.cx + Math.sin(a) * 100, tr.cz + Math.cos(a) * 100)) { meilleur = a; break; }
    }
    tr.ancreX = tr.cx + Math.sin(meilleur) * 130; tr.ancreZ = tr.cz + Math.cos(meilleur) * 130;
  }

  /** Le rugissement du joueur effraie les animaux craintifs et alerte les autres. */
  rugissement(x, z, rayon) {
    for (const tr of this.troupeaux) {
      if (!tr.membres.length || Math.hypot(tr.cx - x, tr.cz - z) > rayon) continue;
      if (tr.def.fuit || tr.def.role === 'charognard') this._fuir(tr, x, z);
      else { tr.irrite = Math.max(tr.irrite, 8); tr.menaceX = x; tr.menaceZ = z; }
    }
  }

  /** Empêche le joueur de traverser les animaux (les plus légers sont repoussés). */
  collisionsJoueur(c, rayon, masse) {
    for (const a of this.animaux) {
      if (!a.vivant || a.distJoueur > 12) continue;
      const min = rayon + a.def.rayon * a.c.echelle, dx = c.x - a.x, dz = c.z - a.z, d2 = dx * dx + dz * dz;
      if (d2 >= min * min || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), part = a.def.masse * Math.pow(a.c.echelle, 3) / (masse + a.def.masse * Math.pow(a.c.echelle, 3)), rec = min - d;
      c.x += (dx / d) * rec * part; c.z += (dz / d) * rec * part;
      a.c.x -= (dx / d) * rec * (1 - part); a.c.z -= (dz / d) * rec * (1 - part);
    }
  }

  pecher(x, z, rayon) { return this.jeu.faune.pecher(x, z, rayon); }

  // ============================================================ MISE À JOUR ==
  mettreAJour(dt) {
    const jeu = this.jeu, jc = jeu.joueur.creature, T = jeu.terrain;
    this.image++;
    this.pousseurs.length = 0;
    // --- Troupeaux : décisions de groupe (à tour de rôle) ---
    for (const tr of this.troupeaux) {
      tr.tPense -= dt; tr.tEtat += dt; tr.irrite = Math.max(0, tr.irrite - dt);
      if (tr.tPense > 0 || !tr.membres.length) continue;
      tr.tPense = 0.5;
      let sx = 0, sz = 0;
      for (const m of tr.membres) { sx += m.x; sz += m.z; }
      tr.cx = sx / tr.membres.length; tr.cz = sz / tr.membres.length;
      if (tr.def.role === 'predateur') this._penserPredateur(tr); else this._penserTroupeau(tr);
    }
    // --- Animaux ---
    const lointain = this.image % 8;
    for (let i = 0; i < this.animaux.length; i++) {
      const a = this.animaux[i], c = a.c;
      const d = Math.hypot(a.x - jc.x, a.z - jc.z);
      a.distJoueur = d;
      const proche = d < E.distanceAnimation + a.def.longueur;
      if (c.groupe.visible !== proche) c.groupe.visible = proche;
      if (!a.vivant) { if (proche && !c.fige) c.mettreAJour(dt, T); continue; }
      let pas = dt;
      if (d > E.distanceIAComplete) { if (i % 8 !== lointain) continue; pas = dt * 8; }
      a.tPense -= pas;
      if (a.tPense <= 0) { a.tPense = 0.3 + Math.random() * 0.3; this._penserAnimal(a); }
      this._deplacer(a, pas, d);
      if (proche) {
        // animation : toujours pour les animaux proches, une image sur deux au-delà de 120 m, jamais hors champ
        _sphere.center.set(a.x, c.y + a.def.longueur * 0.2, a.z); _sphere.radius = a.def.longueur * c.echelle * 0.8;
        const visible = d < 30 || jeu.frustum.intersectsSphere(_sphere);
        if (visible && (d < 120 || (this.image + i) % 2 === 0)) c.mettreAJour(d < 120 ? dt : dt * 2, T);
        else { c.groupe.position.set(c.x, c.solY === null ? T.hauteur(c.x, c.z) : c.solY, c.z); c.groupe.rotation.y = c.cap; }
        if (d < 40 && this.pousseurs.length < 3) this.pousseurs.push(a);
        a.anime = visible;
      } else a.anime = false;
    }
    this._gererCarcasses(dt);
  }

  // ----------------------------------------------------------- TROUPEAUX ----
  _menacePour(tr) {
    // Renvoie la menace la plus proche {x, z, d} : le joueur ou un prédateur en chasse.
    const jeu = this.jeu, j = jeu.joueur, jc = j.creature, def = tr.def;
    let rayon = def.detection * (j.a('discret') ? 0.7 : 1) * (Math.abs(jc.vitesse) > j.infosStade.trot * 1.1 ? 1.3 : j.marcheLente ? 0.65 : 1) * (jeu.ciel.jour < 0.3 ? 0.7 : 1);
    if (j.repos) rayon *= 0.4;
    // un petit juvénile n'inquiète pas les grands herbivores
    const joueurInquiete = def.fuit || def.role === 'charognard' || tr.agresse || j.stade >= 1;
    let meilleure = null;
    const dj = Math.hypot(tr.cx - jc.x, tr.cz - jc.z);
    if (joueurInquiete && dj < rayon * 1.6) meilleure = { x: jc.x, z: jc.z, d: dj, rayon };
    for (const p of this.troupeaux) {
      if (p.def.role !== 'predateur' || p === tr || !p.membres.length || (p.etat !== 'chasse' && p.etat !== 'combat')) continue;
      if (def.geant) continue;
      const d = Math.hypot(tr.cx - p.cx, tr.cz - p.cz);
      if (d < def.detection * 1.5 && (!meilleure || d < meilleure.d)) meilleure = { x: p.cx, z: p.cz, d, rayon: def.detection };
    }
    return meilleure;
  }

  _nouvelleAncre(tr, rayon) {
    // nouvelle zone de broutage : à courte distance du groupe, sans quitter son domaine
    const dehors = Math.hypot(tr.cx - tr.domX, tr.cz - tr.domZ) > tr.domR;
    const predateur = tr.def.role === 'predateur';
    let p;
    if (tr.nid) p = this._pointValide(tr.nid.x, tr.nid.z, 45, 0.1);
    else if (dehors || predateur) p = this._pointValide(tr.domX, tr.domZ, rayon || tr.domR, 0.1);
    else p = this._pointValide(tr.cx, tr.cz, 75, tr.def.geant ? 0.6 : 0.1);
    tr.ancreX = p.x; tr.ancreZ = p.z; tr.t = 80 + Math.random() * 90;
  }

  _penserTroupeau(tr) {
    const jeu = this.jeu, def = tr.def, T = jeu.terrain, nuit = jeu.ciel.jour < 0.22;
    const menace = this._menacePour(tr);
    tr.menace = menace;
    // Fuite coordonnée
    if ((def.fuit || def.role === 'charognard') && menace && menace.d < menace.rayon && tr.etat !== 'fuite') {
      this._fuir(tr, menace.x, menace.z);
      jeu.audio.jouerVoix(def.id, 'alerte', tr.membres[0], 1);
    }
    if (tr.etat === 'fuite') {
      const dm = Math.hypot(tr.cx - tr.menaceX, tr.cz - tr.menaceZ);
      const arrive = Math.hypot(tr.cx - tr.ancreX, tr.cz - tr.ancreZ) < 25;
      if (tr.tEtat > 22 || (dm > def.detection * 2.4 && tr.tEtat > 4)) { tr.etat = 'calme'; tr.ancreX = tr.cx; tr.ancreZ = tr.cz; tr.t = 30; }
      else if (arrive) this._fuir(tr, tr.menaceX, tr.menaceZ);
      return;
    }
    if (nuit && def.diurne) { if (tr.etat !== 'dormir') { tr.etat = 'dormir'; tr.tEtat = 0; } return; }
    if (tr.etat === 'dormir') tr.etat = 'calme';
    // Charognards : attirés par les carcasses libres
    if (def.role === 'charognard' && tr.etat === 'calme') {
      let cible = null, dMin = 200;
      for (const k of this.carcasses) {
        const d = Math.hypot(k.x - tr.cx, k.z - tr.cz);
        if (k.viande > 0 && d < dMin && !this._grosPres(k.x, k.z, 9)) { dMin = d; cible = k; }
      }
      tr.carcasse = cible;
      if (cible) { tr.ancreX = cible.x; tr.ancreZ = cible.z; }
    }
    // Abreuvage
    if (tr.etat === 'calme') {
      tr.soif += 0.5;
      if (tr.soif > E.soifTroupeau[0] + (tr.domR % 7) * (E.soifTroupeau[1] - E.soifTroupeau[0]) / 7 && !tr.carcasse) {
        const eau = T.eauLaPlusProche(tr.cx, tr.cz);
        if (eau && Math.hypot(eau.x - tr.cx, eau.z - tr.cz) < 480) { tr.etat = 'boire'; tr.eau = eau; tr.ancreX = eau.x; tr.ancreZ = eau.z; tr.tEtat = 0; tr.tBoit = 0; }
        else tr.soif = 0;
      }
      tr.t -= 0.5;
      if (tr.t <= 0 && !tr.carcasse) this._nouvelleAncre(tr);
    } else if (tr.etat === 'boire') {
      if (Math.hypot(tr.cx - tr.eau.x, tr.cz - tr.eau.z) < 12 + def.rayon * 6) tr.tBoit += 0.5;
      if (tr.tBoit > E.dureeAbreuvage || tr.tEtat > 240) { tr.etat = 'calme'; tr.soif = 0; this._nouvelleAncre(tr); }
    }
  }

  _grosPres(x, z, rayon) {
    const jc = this.jeu.joueur.creature;
    if (Math.hypot(jc.x - x, jc.z - z) < rayon) return true;
    for (const a of this.animaux) if (a.vivant && a.def.role === 'predateur' && Math.hypot(a.x - x, a.z - z) < rayon) return true;
    return false;
  }

  // ----------------------------------------------------------- PRÉDATEURS ---
  _penserPredateur(tr) {
    const jeu = this.jeu, a = tr.membres[0], def = tr.def, j = jeu.joueur, jc = j.creature;
    const dj = Math.hypot(a.x - jc.x, a.z - jc.z);
    const heure = jeu.ciel.heure;
    tr.faim += 0.5 * 0.28;
    tr.tRugir -= 0.5;
    const plusGros = j.masse > def.masse * Math.pow(a.c.echelle, 3) * 1.25;
    // Réaction au joueur
    if (tr.etat === 'combat') {
      if (dj > 45 || tr.tEtat > 22 || a.sante < def.sante * 0.35) { tr.etat = a.sante < def.sante * 0.35 ? 'fuite' : 'patrouille'; tr.tEtat = 0; tr.agresse = false; if (tr.etat === 'fuite') this._fuir(tr, jc.x, jc.z); }
      return;
    }
    if (tr.etat === 'fuite') { if (tr.tEtat > 14) { tr.etat = 'patrouille'; this._nouvelleAncre(tr); } return; }
    if (j.inconscient <= 0 && dj < (tr.etat === 'mange' ? 13 : 16) && tr.etat !== 'chasse') {
      if (plusGros && tr.etat !== 'mange') { this._fuir(tr, jc.x, jc.z); return; }
      if (tr.etat !== 'menace') { tr.etat = 'menace'; tr.tEtat = 0; tr.tMenace = 0; }
    }
    if (tr.etat === 'menace') {
      tr.tMenace += 0.5;
      if (tr.tRugir <= 0) { a.c.declencher('rugir', 1.6); jeu.audio.jouerVoix(def.id, 'rugir', a, a.c.echelle); tr.tRugir = 4.5; }
      if (dj > 24) { tr.etat = tr.carcasse && tr.carcasse.viande > 0 ? 'mange' : 'patrouille'; tr.tEtat = 0; }
      else if (tr.tMenace > 6 && dj < 9 && !plusGros) { tr.etat = 'combat'; tr.tEtat = 0; }
      return;
    }
    const actif = def.id === 'ceratosaurus' ? !(heure > 11 && heure < 15) && !(heure > 0.5 && heure < 4) : jeu.ciel.jour > 0.22;
    if (tr.etat === 'mange') {
      if (!tr.carcasse || tr.carcasse.viande <= 0 || tr.tEtat > 60) { tr.etat = 'patrouille'; tr.faim = 0; tr.carcasse = null; this._nouvelleAncre(tr); }
      else if (Math.hypot(a.x - tr.carcasse.x, a.z - tr.carcasse.z) < tr.carcasse.rayon + def.rayon + 1.2) tr.carcasse.viande -= 0.9;
      return;
    }
    if (tr.etat === 'chasse') {
      const p = tr.proie;
      if (!p || !p.vivant) {
        const k = this.carcasses.find((q) => q.animal === p);
        if (k) { tr.etat = 'mange'; tr.carcasse = k; tr.tEtat = 0; } else { tr.etat = 'patrouille'; this._nouvelleAncre(tr); }
      } else if (tr.tEtat > 28) { tr.etat = 'repos'; tr.tEtat = 0; tr.faim = 60; tr.proie = null; }
      return;
    }
    if (!actif) { if (tr.etat !== 'dormir') { tr.etat = 'dormir'; tr.tEtat = 0; } return; }
    if (tr.etat === 'dormir') tr.etat = 'patrouille';
    if (tr.etat === 'repos') { if (tr.tEtat > 30) tr.etat = 'patrouille'; return; }
    if (tr.etat !== 'patrouille' && tr.etat !== 'boire') { tr.etat = 'patrouille'; this._nouvelleAncre(tr); }
    // Faim : carcasse à proximité, sinon chasse
    if (tr.faim > 100) {
      let k = null, dk = 220;
      for (const q of this.carcasses) { const d = Math.hypot(q.x - a.x, q.z - a.z); if (q.viande > 0 && d < dk) { dk = d; k = q; } }
      if (k) { tr.etat = 'mange'; tr.carcasse = k; tr.tEtat = -40; tr.ancreX = k.x; tr.ancreZ = k.z; return; }
      let proie = null, dp = 260;
      for (const q of this.animaux) {
        if (!q.vivant || (q.espece !== 'dryosaurus' && q.espece !== 'compsognathus')) continue;
        const d = Math.hypot(q.x - a.x, q.z - a.z);
        if (d < dp) { dp = d; proie = q; }
      }
      if (proie) { tr.etat = 'chasse'; tr.proie = proie; tr.tEtat = 0; return; }
      tr.faim = 70;
    }
    tr.t -= 0.5;
    if (tr.t <= 0 || Math.hypot(a.x - tr.ancreX, a.z - tr.ancreZ) < 6) this._nouvelleAncre(tr);
  }

  // ------------------------------------------------------------- INDIVIDUS ---
  _penserAnimal(a) {
    const jeu = this.jeu, tr = a.troupeau, def = a.def, c = a.c, etat = tr.etat, jc = jeu.joueur.creature;
    c.teteBas = false; c.mache = false; c.teteHaut = false; c.regard = null;
    if (c.pose === 'couche' && etat !== 'dormir' && !(a.couveur && etat === 'calme')) c.pose = 'debout';
    a.arret = 1.2 + def.rayon * 1.5;
    const marche = def.marche * Math.sqrt(c.echelle), course = def.course * Math.sqrt(c.echelle);

    if (def.role === 'predateur') {
      if (etat === 'chasse' && tr.proie) {
        const d = Math.hypot(tr.proie.x - a.x, tr.proie.z - a.z);
        a.cibleX = tr.proie.x; a.cibleZ = tr.proie.z; a.arret = 0.5;
        a.vVoulue = d < 55 ? course : marche * 1.3;            // approche lente puis charge
        a.comportement = 'chasse'; c.regard = Math.atan2(tr.proie.x - a.x, tr.proie.z - a.z);
        if (d < def.rayon * c.echelle + tr.proie.def.rayon + 1.3 && a.tAttaque <= 0) {
          c.declencher('morsure', 0.5); a.tAttaque = 1.2;
          this.blesser(tr.proie, def.degats * 2.5, c);
        }
      } else if (etat === 'combat' || etat === 'menace') {
        const d = a.distJoueur;
        a.cibleX = jc.x; a.cibleZ = jc.z; c.regard = Math.atan2(jc.x - a.x, jc.z - a.z);
        a.comportement = 'menace';
        if (etat === 'menace') { a.vVoulue = 0; this._tournerVers(a, c.regard); c.teteHaut = true; }
        else {
          a.vVoulue = course * 0.85; a.arret = def.rayon * c.echelle + jc.def.rayon * jc.echelle + 0.6;
          if (d < a.arret + 1.2 && a.tAttaque <= 0) {
            c.declencher('morsure', 0.55); a.tAttaque = 1.7;
            jeu.planifier(0.25, () => { if (a.vivant && a.distJoueur < a.arret + 1.6) { jeu.joueur.blesser(def.degats, 1); jeu.audio.impact(0.8); } });
          }
        }
      } else if (etat === 'mange' && tr.carcasse) {
        a.cibleX = tr.carcasse.x; a.cibleZ = tr.carcasse.z; a.vVoulue = marche * 1.2; a.arret = tr.carcasse.rayon + def.rayon * c.echelle + 0.4;
        if (Math.hypot(a.x - a.cibleX, a.z - a.cibleZ) < a.arret + 1) { c.teteBas = true; c.mache = true; a.comportement = 'charogne'; } else a.comportement = 'marche';
      } else if (etat === 'dormir' || etat === 'repos') { a.vVoulue = 0; c.pose = 'couche'; a.comportement = 'dort'; }
      else { a.cibleX = tr.ancreX; a.cibleZ = tr.ancreZ; a.vVoulue = etat === 'fuite' ? course : marche; a.comportement = etat === 'fuite' ? 'fuit' : 'marche'; }
      return;
    }

    // --- Herbivores et charognards ---
    if (etat === 'fuite') {
      a.cibleX = tr.ancreX + a.decX; a.cibleZ = tr.ancreZ + a.decZ; a.vVoulue = course * (0.85 + (a.decX % 1) * 0.1); a.arret = 3;
      a.comportement = 'fuit'; return;
    }
    // Défense individuelle (Stegosaurus, sauropodes) : faire face avec la queue
    if (def.defend) {
      let mx = null, mz = 0, dm = 1e9;
      if ((tr.agresse || tr.irrite > 0 || jeu.joueur.stade >= 1) && a.distJoueur < 11 + def.rayon * 3) { mx = jc.x; mz = jc.z; dm = a.distJoueur; }
      for (const p of this.animaux) if (p.vivant && p.def.role === 'predateur' && (p.troupeau.etat === 'chasse' || p.troupeau.etat === 'combat')) {
        const d = Math.hypot(p.x - a.x, p.z - a.z); if (d < 12 && d < dm) { mx = p.x; mz = p.z; dm = d; }
      }
      if (mx !== null && (tr.agresse || tr.irrite > 0 || dm < 6 + def.rayon * 2.5)) {
        a.vVoulue = 0; a.comportement = 'defend';
        // présenter la queue à la menace
        this._tournerVers(a, Math.atan2(a.x - mx, a.z - mz));
        c.regard = Math.atan2(mx - a.x, mz - a.z);
        const portee = def.longueur * c.echelle * 0.5 + 1.5;
        if (dm < portee && a.tAttaque <= 0) {
          c.declencher('queue', 0.9, Math.random() < 0.5 ? 1 : -1); a.tAttaque = 2.6;
          jeu.audio.sifflement();
          jeu.planifier(0.4, () => {
            if (!a.vivant) return;
            if (a.distJoueur < portee + 0.8) { jeu.joueur.blesser(def.degats, 1); jeu.audio.impact(1); }
            for (const p of this.animaux) if (p.vivant && p.def.role === 'predateur' && Math.hypot(p.x - a.x, p.z - a.z) < portee) this.blesser(p, def.degats, c);
          });
        }
        return;
      }
    }
    if (etat === 'dormir') {
      // un veilleur reste debout pendant que le troupeau dort
      const veilleur = tr.membres[0] === a && tr.membres.length > 2;
      a.vVoulue = 0;
      if (veilleur) { a.comportement = 'alerte'; c.teteHaut = true; c.regard = c.cap + Math.sin(jeu.temps * 0.2) * 1.2; }
      else { c.pose = 'couche'; a.comportement = 'dort'; }
      return;
    }
    // Individu trop proche d'un gros animal : petit écart (surtout les Compsognathus)
    if (def.role === 'charognard' && a.distJoueur < 6) { a.cibleX = a.x + (a.x - jc.x) * 3; a.cibleZ = a.z + (a.z - jc.z) * 3; a.vVoulue = course; a.comportement = 'fuit'; return; }
    if (tr.menace && tr.menace.d < tr.menace.rayon * 1.6 && !def.geant && !def.defend) {
      a.vVoulue = 0; a.comportement = 'alerte'; c.teteHaut = true; c.regard = Math.atan2(tr.menace.x - a.x, tr.menace.z - a.z); return;
    }
    if (a.couveur && etat === 'calme') {
      a.cibleX = a.couveur.x; a.cibleZ = a.couveur.z; a.vVoulue = marche; a.arret = 0.6;
      if (Math.hypot(a.x - a.cibleX, a.z - a.cibleZ) < 1.2) { c.pose = 'couche'; a.vVoulue = 0; a.comportement = 'couve'; } else a.comportement = 'marche';
      return;
    }
    a.cibleX = tr.ancreX + a.decX * (etat === 'boire' ? 0.5 : 1); a.cibleZ = tr.ancreZ + a.decZ * (etat === 'boire' ? 0.5 : 1);
    const d = Math.hypot(a.x - a.cibleX, a.z - a.cibleZ);
    a.vVoulue = d > 40 ? marche * 1.6 : marche;
    if (def.role === 'charognard') a.vVoulue = d > 6 ? course * 0.6 : marche;
    if (etat === 'boire') {
      // s'avancer jusqu'à la berge
      const T = jeu.terrain;
      if (d < a.arret + 4 || T.hauteur(a.x + Math.sin(c.cap) * (def.longueur * 0.3 * c.echelle + 0.5), a.z + Math.cos(c.cap) * (def.longueur * 0.3 * c.echelle + 0.5)) < 0.05) {
        a.vVoulue = 0; c.teteBas = true; c.mache = true; a.comportement = 'boit';
      } else a.comportement = 'marche';
      return;
    }
    if (d < a.arret + 1.5) {
      a.vVoulue = 0; a.tPause -= 0.45;
      if (tr.carcasse && def.role === 'charognard') { c.teteBas = true; c.mache = true; a.comportement = 'charogne'; tr.carcasse.viande -= 0.05; }
      else if (a.tPause > 0 && a.tPause < 3) { c.teteHaut = true; c.regard = c.cap + Math.sin(a.tPause * 2 + a.decX) * 1.1; a.comportement = 'alerte'; }   // coup d'œil alentour
      else {
        if (def.broutHaut) c.teteHaut = true; else c.teteBas = true;
        c.mache = true; a.comportement = def.role === 'charognard' ? 'fouille' : 'broute';
      }
      if (a.tPause < -6 - Math.abs(a.decX) % 9) {
        // petit déplacement vers une autre touffe
        const ang = Math.random() * 6.28, r = (2 + Math.random() * 6) * (1 + def.rayon * 2.2);
        a.decX = Math.cos(ang) * r; a.decZ = Math.sin(ang) * r; a.tPause = 3;
      }
    } else a.comportement = 'marche';
  }

  _tournerVers(a, cap) { a.capVoulu = cap; }

  /** Avance vers la cible en tournant progressivement ; évite l'eau profonde et les pentes. */
  _deplacer(a, dt, distJoueur) {
    const c = a.c, def = a.def, T = this.jeu.terrain;
    a.tAttaque = Math.max(0, a.tAttaque - dt);
    const dx = a.cibleX - a.x, dz = a.cibleZ - a.z, d = Math.hypot(dx, dz);
    let vCible = d > a.arret ? a.vVoulue : 0;
    let capCible = d > 0.3 && vCible > 0 ? Math.atan2(dx, dz) : c.cap;
    if (vCible === 0 && a.capVoulu !== undefined && a.vVoulue === 0) capCible = a.capVoulu;
    if (a.vVoulue > 0) a.capVoulu = undefined;
    const virage = 2.6 / Math.sqrt(Math.max(0.5, def.longueur * c.echelle / 3));
    const ecart = ecartAngle(c.cap, capCible);
    if (Math.abs(ecart) > 1.2) vCible *= 0.4;
    const rot = borner(ecart, -virage * dt, virage * dt);
    c.cap += rot; c.vitAng = rot / Math.max(dt, 1e-4);
    const acc = (def.course * 0.9) * dt;
    c.vitesse += borner(vCible - c.vitesse, -acc * 2, acc);
    if (c.vitesse > 0.01) {
      const nx = c.x + Math.sin(c.cap) * c.vitesse * dt, nz = c.z + Math.cos(c.cap) * c.vitesse * dt;
      const sonde = Math.max(1.5, def.rayon * 2);
      const px = c.x + Math.sin(c.cap) * sonde, pz = c.z + Math.cos(c.cap) * sonde;
      const profMax = def.geant ? 1.2 : def.rayon * 0.5 + 0.15;
      if (T.hauteur(px, pz) > -profMax && T.pente(px, pz) < 0.85) { c.x = nx; c.z = nz; a.bloque = 0; }
      else {
        // obstacle : on s'arrête, on pivote, et le groupe choisira une autre destination
        c.vitesse *= 0.5; a.bloque += dt; c.cap += dt * 1.5;
        if (a.bloque > 1.5) { a.decX = -a.decX; a.decZ = -a.decZ; a.bloque = 0; if (a.troupeau.etat === 'calme') a.troupeau.t = 0; }
      }
      if (distJoueur < 130) this.jeu.vegetation.resoudreCollision(c, def.rayon * c.echelle, def.masse, c.vitesse, Math.sin(c.cap), Math.cos(c.cap));
    }
    c.effort = borner(c.vitesse / def.course, 0, 1);
    // séparation simple entre membres du même groupe
    const m = a.troupeau.membres;
    for (let i = 0; i < m.length; i++) {
      const b = m[i]; if (b === a) continue;
      const ex = c.x - b.c.x, ez = c.z - b.c.z, min = (def.rayon * c.echelle + b.def.rayon * b.c.echelle) * 1.15, e2 = ex * ex + ez * ez;
      if (e2 < min * min && e2 > 1e-4) { const e = Math.sqrt(e2), k = (min - e) * 0.5 / e; c.x += ex * k; c.z += ez * k; }
    }
  }

  // ------------------------------------------------------------- CARCASSES ---
  _gererCarcasses(dt) {
    const jeu = this.jeu, jc = jeu.joueur.creature;
    for (let i = this.carcasses.length - 1; i >= 0; i--) {
      const k = this.carcasses[i];
      k.t += dt;
      const loin = Math.hypot(k.x - jc.x, k.z - jc.z) > 140;
      if ((k.t > E.dureeCarcasse || k.viande <= 0) && (loin || k.t > E.dureeCarcasse * 2)) {
        // la carcasse disparaît ; l'animal « renaît » plus tard dans son domaine
        this.carcasses.splice(i, 1);
        const a = k.animal, tr = a.troupeau;
        a.c.groupe.visible = false;
        jeu.planifier(E.delaiReapparition, () => {
          const p = this._pointValide(tr.membres.length ? tr.cx : tr.domX, tr.membres.length ? tr.cz : tr.domZ, 40);
          if (Math.hypot(p.x - jeu.joueur.creature.x, p.z - jeu.joueur.creature.z) < 120) { p.x = tr.domX; p.z = tr.domZ; }
          a.vivant = true; a.sante = a.def.sante; a.c.pose = 'debout'; a.c.fige = false; a.c.couche = 0; a.c.blessure = 0;
          a.c.placer(p.x, p.z, 0); a.comportement = 'marche';
          if (!tr.membres.length) { tr.etat = tr.def.role === 'predateur' ? 'patrouille' : 'calme'; tr.agresse = false; tr.ancreX = p.x; tr.ancreZ = p.z; }
          tr.membres.push(a);
        });
      }
    }
    // Carcasse « naturelle » : un animal mort de vieillesse, pour que le joueur trouve toujours à manger
    this.tCarcasseNaturelle -= dt;
    if (this.tCarcasseNaturelle <= 0) {
      this.tCarcasseNaturelle = E.intervalleCarcasseNaturelle;
      if (this.carcasses.length < 2) {
        const candidats = this.animaux.filter((a) => a.vivant && a.espece === 'dryosaurus' && a.distJoueur > 120 && a.distJoueur < 500 && !a.couveur);
        if (candidats.length) this._mourir(candidats[Math.floor(Math.random() * candidats.length)], false);
      }
    }
  }
}
