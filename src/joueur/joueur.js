// Le joueur : un Allosaurus. Déplacements avec inertie, besoins vitaux légers,
// actions (mordre, coup de queue, esquive, rugir), croissance en trois stades, territoire et nid.
import * as THREE from 'three';
import { CONFIG } from '../config.js';
import { amortir, borner, ecartAngle, melanger } from '../noyau/maths.js';
import { VARIANTES_ALLOSAURUS } from '../creatures/especes.js';
import { LIEUX, BIOME } from '../monde/terrain.js';

const J = CONFIG.joueur;

export const COMPETENCES = [
  { id: 'odorat', nom: 'Flair affûté', effet: 'Portée de la vision olfactive +50 %' },
  { id: 'endurance', nom: 'Souffle long', effet: 'La course fatigue 30 % moins vite' },
  { id: 'machoires', nom: 'Mâchoires puissantes', effet: 'Morsure +30 %' },
  { id: 'discret', nom: 'Pas feutrés', effet: 'Les proies vous repèrent de 30 % moins loin' },
  { id: 'metabolisme', nom: 'Métabolisme lent', effet: 'Faim et soif −25 %' },
  { id: 'cuir', nom: 'Cuir épais', effet: 'Dégâts reçus −25 %' },
  { id: 'voix', nom: 'Voix profonde', effet: 'Portée du rugissement +50 %' },
  { id: 'nageur', nom: 'Bon nageur', effet: 'Vitesse de nage +60 %' },
];

export class Joueur {
  constructor(jeu) {
    this.jeu = jeu;
    this.creature = null;
    this.nidMaille = null;
    this._tete = new THREE.Vector3();
    this.reinitialiser();
  }

  reinitialiser() {
    this.croissance = 0; this.stade = 0;
    this.sante = J.stades[0].sante; this.faim = 80; this.soif = 80; this.energie = 90; this.souffle = J.souffleMax;
    this.points = 0; this.competences = {}; this.marques = []; this.nid = null;
    this.vx = 0; this.vz = 0; this.exVx = 0; this.exVz = 0;
    this.repos = false; this.marcheLente = false; this.invulnerable = 0;
    this.attente = 0; this.tRugir = 0; this.impact = null; this.inconscient = 0;
    this.enTerritoire = false; this.interaction = null; this.tMessageMer = 0;
    this.nageAvant = false;
    this._creerCreature(LIEUX.depart.x, LIEUX.depart.z, 2.4);
    this._majNid();
  }

  // ---------------------------------------------------------- SAUVEGARDE ----
  exporter() {
    const c = this.creature;
    return { x: c.x, z: c.z, cap: c.cap, croissance: this.croissance, sante: this.sante, faim: this.faim, soif: this.soif,
      energie: this.energie, points: this.points, competences: this.competences, marques: this.marques, nid: this.nid, boue: c.boue };
  }
  importer(d) {
    this.reinitialiser();
    Object.assign(this, { croissance: d.croissance, sante: d.sante, faim: d.faim, soif: d.soif, energie: d.energie,
      points: d.points || 0, competences: d.competences || {}, marques: d.marques || [], nid: d.nid || null });
    this.stade = this._stadePour(this.croissance);
    this._creerCreature(d.x, d.z, d.cap || 0);
    this.creature.boue = d.boue || 0;
    this._majNid();
  }

  // ------------------------------------------------------------ CROISSANCE --
  get infosStade() { return J.stades[this.stade]; }
  _stadePour(cr) { let s = 0; for (let i = 0; i < J.stades.length; i++) if (cr >= J.stades[i].croissance) s = i; return s; }
  _echelle() {
    const st = J.stades[this.stade], suiv = J.stades[this.stade + 1];
    const fin = suiv ? suiv.croissance : J.croissanceMax;
    return melanger(st.echelleMin, st.echelleMax, borner((this.croissance - st.croissance) / (fin - st.croissance), 0, 1));
  }
  /** Progression (0..1) vers le stade suivant. */
  get progression() {
    const st = J.stades[this.stade], suiv = J.stades[this.stade + 1];
    return borner((this.croissance - st.croissance) / ((suiv ? suiv.croissance : J.croissanceMax) - st.croissance), 0, 1);
  }

  _creerCreature(x, z, cap) {
    const jeu = this.jeu, id = J.stades[this.stade].id;
    let boue = 0;
    if (this.creature) { boue = this.creature.boue; jeu.scene.remove(this.creature.groupe); jeu.banque.liberer(this.creature); }
    const c = jeu.banque.creer('allosaurus', this._echelle(), id, VARIANTES_ALLOSAURUS[id]);
    c.placer(x, z, cap); c.boue = boue;
    c.surPas = jeu.surPas; c.estJoueur = true;
    jeu.scene.add(c.groupe);
    this.creature = c;
    this._appliquerStade();
  }
  _appliquerStade() {
    const st = this.infosStade, c = this.creature;
    c.marche = st.marche; c.course = st.course;
    this.santeMax = st.sante;
    this.masse = st.masse * Math.pow(c.echelle / st.echelleMax, 3);
  }

  /** Ajoute des points de croissance ; change de stade si le seuil est franchi. */
  grandir(pointsGagnes) {
    if (this.croissance >= J.croissanceMax) return;
    this.croissance = Math.min(J.croissanceMax, this.croissance + pointsGagnes);
    const nouveau = this._stadePour(this.croissance);
    if (nouveau !== this.stade) {
      this.stade = nouveau;
      const c = this.creature;
      this._creerCreature(c.x, c.z, c.cap);
      this.sante = this.santeMax; this.points++;
      this.jeu.ui.annoncer('Vous êtes désormais ' + this.infosStade.nom.toLowerCase(), 'Nouveau stade de croissance · +1 point de compétence');
      this.jeu.audio.jouerVoix('allosaurus', 'appel', null, this.creature.echelle);
      this.jeu.sauvegarder();
    } else {
      this.creature.echelle = this._echelle();
      this._appliquerStade();
    }
  }
  a(competence) { return !!this.competences[competence]; }
  apprendre(id) { if (this.points > 0 && !this.competences[id]) { this.competences[id] = true; this.points--; return true; } return false; }

  // ----------------------------------------------------------- TERRITOIRE ---
  _majNid() {
    const jeu = this.jeu;
    if (!this.nidMaille) {
      // Nid : simple cuvette de terre bordée de débris végétaux
      const geo = new THREE.TorusGeometry(1.5, 0.38, 6, 18).rotateX(Math.PI / 2);
      this.nidMaille = new THREE.Mesh(geo, jeu.ombres.enregistrer(new THREE.MeshStandardMaterial({ color: 0x3a2c1c, roughness: 1 })));
      this.nidMaille.scale.y = 0.55; this.nidMaille.receiveShadow = true;
      jeu.scene.add(this.nidMaille);
    }
    this.nidMaille.visible = !!this.nid;
    if (this.nid) this.nidMaille.position.set(this.nid.x, jeu.terrain.hauteur(this.nid.x, this.nid.z) + 0.05, this.nid.z);
  }
  dansTerritoire(x, z) {
    for (const m of this.marques) if ((m.x - x) * (m.x - x) + (m.z - z) * (m.z - z) < J.rayonMarque * J.rayonMarque) return true;
    return false;
  }

  /** Reçoit des dégâts (sauf pendant une esquive). */
  blesser(q, sens = 1) {
    if (this.invulnerable > 0 || this.inconscient > 0) return;
    this.sante -= q * (this.a('cuir') ? 0.75 : 1);
    this.creature.declencher('touche', 0.4, sens);
    this.jeu.cameraJeu.secouer(0.6);
    this.jeu.ui.flashDegats();
    this.repos = false;
    if (this.sante <= 0) this._perdreConnaissance();
  }
  _perdreConnaissance() {
    // Jamais punitif : on se réveille au nid (ou au point de départ), simplement affaibli.
    this.inconscient = 3.5; this.sante = 0;
    this.creature.pose = 'couche';
    this.jeu.ui.fondu(true);
    this.jeu.ui.annoncer('Vous perdez connaissance…', 'Vous vous réveillerez en lieu sûr.');
  }
  _reveil() {
    const p = this.nid || LIEUX.depart;
    this.creature.placer(p.x + 2, p.z + 2, 0);
    this.creature.pose = 'debout';
    this.sante = this.santeMax * 0.6; this.faim = Math.max(this.faim, 45); this.soif = Math.max(this.soif, 45); this.energie = Math.max(this.energie, 50);
    this.vx = this.vz = 0; this.creature.vitesse = 0;
    this.jeu.ui.fondu(false);
    this.jeu.cameraJeu.init = false;
  }

  // ========================================================= MISE À JOUR ====
  mettreAJour(dt, dtReel) {
    const jeu = this.jeu, e = jeu.entrees, c = this.creature, st = this.infosStade, T = jeu.terrain, s = c.echelle;
    this.invulnerable = Math.max(0, this.invulnerable - dtReel);
    this.attente = Math.max(0, this.attente - dtReel); this.tRugir = Math.max(0, this.tRugir - dtReel);
    if (this.inconscient > 0) {
      this.inconscient -= dtReel;
      if (this.inconscient <= 0) this._reveil();
      c.vitesse = 0; c.vitAng = 0; c.mettreAJour(dtReel, T);
      return;
    }

    // ------------------------------------------------------- direction ----
    const cam = jeu.cameraJeu;
    let ix = (e.actif('droite') ? 1 : 0) - (e.actif('gauche') ? 1 : 0) + e.axeX;
    let iz = (e.actif('avancer') ? 1 : 0) - (e.actif('reculer') ? 1 : 0) - e.axeY;
    if (jeu.etat !== 'jeu') { ix = 0; iz = 0; }
    const force = Math.min(1, Math.hypot(ix, iz));
    const veutBouger = force > 0.1;
    if (e.vientDe('allure')) { this.marcheLente = !this.marcheLente; jeu.ui.notifier(this.marcheLente ? 'Allure : marche lente' : 'Allure : petite foulée'); }
    if (e.vientDe('reposer') && jeu.etat === 'jeu') this._basculerRepos();
    if (this.repos && (veutBouger || e.vientDe('morsure'))) this._basculerRepos();

    // ------------------------------------------------------- interaction ---
    this._interagir(dt, e, veutBouger);
    const occupe = this.repos || this.interaction !== null;

    // ------------------------------------------------------- vitesse -------
    const profondeur = -T.hauteur(c.x, c.z);
    const dansEau = c.nage;
    let vCible = 0;
    const sprint = e.actif('sprint') && veutBouger && this.souffle > 1 && !dansEau;
    if (veutBouger && !occupe) {
      vCible = sprint ? st.course : (this.marcheLente || force < 0.55 ? st.marche : st.trot);
      vCible *= Math.sqrt(s / st.echelleMax);                    // un animal plus petit a une foulée plus courte
      if (dansEau) vCible = st.marche * J.vitesseNage * (this.a('nageur') ? 1.6 : 1) * 1.6;
      else if (profondeur > 0.15) vCible *= melanger(1, 0.55, borner(profondeur / (c.hanche * s * 0.8), 0, 1));   // patauger ralentit
      if (this.energie < 12) vCible *= 0.75;
    }
    let capCible = c.cap;
    if (veutBouger && !occupe) {
      const dx = cam.avantX * iz - cam.avantZ * ix, dz = cam.avantZ * iz + cam.avantX * ix;
      capCible = Math.atan2(dx, dz);
    }
    const ecart = ecartAngle(c.cap, capCible);
    if (Math.abs(ecart) > 1.3) vCible *= 0.35;                   // demi-tour : on ralentit pour pivoter
    const virage = st.virage * (1 - 0.3 * borner(c.vitesse / st.course, 0, 1));
    const rot = borner(ecart, -virage * dt, virage * dt);
    c.cap += rot; c.vitAng = dt > 0 ? rot / dt : 0;
    const acc = (vCible > c.vitesse ? st.acceleration : st.acceleration * 1.7) * dt;
    c.vitesse += borner(vCible - c.vitesse, -acc, acc);

    // ------------------------------------------------------- actions -------
    if (jeu.etat === 'jeu' && !occupe) {
      if (e.vientDe('esquive') && this.souffle >= J.souffleEsquive && this.attente <= 0 && !dansEau) {
        // esquive : bond de côté (selon la direction tenue) ou vers l'arrière
        const cote = ix > 0.3 ? -1 : ix < -0.3 ? 1 : 0;
        const fx = Math.sin(c.cap), fz = Math.cos(c.cap);
        if (cote !== 0) { this.exVx = fz * cote * J.vitesseEsquive; this.exVz = -fx * cote * J.vitesseEsquive; }
        else { this.exVx = -fx * J.vitesseEsquive * 0.8; this.exVz = -fz * J.vitesseEsquive * 0.8; }
        this.souffle -= J.souffleEsquive; this.invulnerable = J.dureeEsquive; this.attente = J.dureeEsquive + 0.1;
        c.declencher('esquive', J.dureeEsquive, cote || 1);
        jeu.particules.emettre('poussiere', c.x, c.y + 0.1, c.z, 8, s * 1.5);
      } else if (e.vientDe('morsure') && this.attente <= 0) {
        c.declencher('morsure', J.dureeMorsure);
        this.attente = J.dureeMorsure + J.reposEntreAttaques;
        this.impact = { type: 'morsure', t: J.dureeMorsure * 0.48 };
      } else if (e.vientDe('queue') && this.attente <= 0) {
        const sens = Math.random() < 0.5 ? 1 : -1;
        c.declencher('queue', J.dureeQueue, sens);
        this.attente = J.dureeQueue + J.reposEntreAttaques;
        this.impact = { type: 'queue', t: J.dureeQueue * 0.45 };
      } else if (e.vientDe('rugir') && this.tRugir <= 0) {
        c.declencher('rugir', J.dureeRugir);
        this.tRugir = 4; this.attente = 0.6;
        jeu.audio.jouerVoix('allosaurus', 'rugir', null, s);
        jeu.ecosysteme.rugissement(c.x, c.z, J.rayonRugissement * (this.a('voix') ? 1.5 : 1) * (0.5 + s * 0.5));
      } else if (e.vientDe('marquer')) this._marquer();
      else if (e.vientDe('nid')) this._etablirNid();
    }
    if (this.impact) {
      this.impact.t -= dtReel;
      if (this.impact.t <= 0) { this._frapper(this.impact.type); this.impact = null; }
    }

    // ------------------------------------------------------- déplacement ---
    this.exVx *= Math.exp(-dt * 5); this.exVz *= Math.exp(-dt * 5);
    const fx = Math.sin(c.cap), fz = Math.cos(c.cap);
    const depX = (fx * c.vitesse + this.exVx) * dt, depZ = (fz * c.vitesse + this.exVz) * dt;
    this._deplacer(depX, depZ, T);
    jeu.vegetation.resoudreCollision(c, def(c).rayon * s, this.masse, Math.abs(c.vitesse), fx, fz);
    if (jeu.vegetation.dernierRenverse) { jeu.vegetation.dernierRenverse = null; jeu.audio.craquement(); jeu.cameraJeu.secouer(0.15); c.vitesse *= 0.8; }
    jeu.ecosysteme.collisionsJoueur(c, def(c).rayon * s, this.masse);
    // limite du monde : l'océan
    const dCentre = Math.hypot(c.x, c.z);
    if (dCentre > CONFIG.monde.limiteNage) {
      const k = CONFIG.monde.limiteNage / dCentre; c.x *= k; c.z *= k;
      if (this.tMessageMer <= 0) { jeu.ui.notifier('L\'océan est trop vaste : mieux vaut regagner la côte.'); this.tMessageMer = 8; }
    }
    this.tMessageMer -= dtReel;

    // ------------------------------------------------------- besoins -------
    const meta = this.a('metabolisme') ? 0.75 : 1;
    const effort = borner(Math.abs(c.vitesse) / st.course, 0, 1);
    this.faim = Math.max(0, this.faim - J.faimParSeconde * meta * (1 + effort * 0.6) * dt);
    this.soif = Math.max(0, this.soif - J.soifParSeconde * meta * (1 + effort * 0.8) * dt);
    if (this.repos) this.energie = Math.min(100, this.energie + J.energieReposParSeconde * dt * (this.nid && Math.hypot(c.x - this.nid.x, c.z - this.nid.z) < 6 ? 1.5 : 1));
    else this.energie = Math.max(0, this.energie - J.energieParSeconde * (1 + effort + (dansEau ? 1.5 : 0)) * dt);
    if (sprint && c.vitesse > st.trot) this.souffle = Math.max(0, this.souffle - J.souffleCourse * (this.a('endurance') ? 0.7 : 1) * dt);
    else this.souffle = Math.min(J.souffleMax, this.souffle + J.souffleRegen * (this.enTerritoire ? 1.3 : 1) * (this.energie < 12 ? 0.5 : 1) * dt);
    if (this.faim <= 0 || this.soif <= 0) { if (this.sante > this.santeMax * J.santePlancherBesoin / 100) this.sante -= J.santePerteBesoin * dt; }
    else if (this.faim > 30 && this.soif > 30) this.sante = Math.min(this.santeMax, this.sante + J.santeRegenParSeconde * (this.repos ? 3 : 1) * dt);
    c.effort = amortir(c.effort, Math.max(1 - this.souffle / J.souffleMax, effort * 0.6), 2, dt);
    c.blessure = borner(1 - this.sante / this.santeMax, 0, 1);
    this.grandir(J.croissanceParSeconde * dt);
    this.enTerritoire = this.dansTerritoire(c.x, c.z);

    // Boue : s'accumule dans les marais, part dans l'eau et sous la pluie
    if (T.boue(c.x, c.z) > 0.5 && Math.abs(c.vitesse) > 0.5 && profondeur < 0.4) c.boue = Math.min(1, c.boue + dt * 0.05);
    if (profondeur > c.hanche * s * 0.5) c.boue = Math.max(0, c.boue - dt * 0.25);
    c.boue = Math.max(0, c.boue - jeu.meteo.pluie * dt * 0.02);

    // Entrée / sortie de l'eau : éclaboussures
    if (dansEau !== this.nageAvant) { jeu.particules.emettre('eclaboussure', c.x, 0.1, c.z, 14, s + 0.5); jeu.eau.ajouterOnde(c.x, c.z, 0.9, jeu.tempsReel); jeu.audio.plouf(1); this.nageAvant = dansEau; }
    if (dansEau && Math.abs(c.vitesse) > 0.3 && Math.random() < dt * 2.5) jeu.eau.ajouterOnde(c.x, c.z, 0.45, jeu.tempsReel);

    c.mettreAJour(dt, T);
  }

  /** Avance en respectant les pentes trop raides (on glisse le long de l'obstacle). */
  _deplacer(dx, dz, T) {
    const c = this.creature;
    if (dx === 0 && dz === 0) return;
    const h0 = T.hauteur(c.x, c.z), pas = Math.hypot(dx, dz), sonde = Math.max(pas, 0.6);
    const raide = (ax, az) => {
      const l = Math.hypot(ax, az) || 1;
      return (T.hauteur(c.x + (ax / l) * sonde, c.z + (az / l) * sonde) - h0) / sonde > CONFIG.monde.penteMax;
    };
    if (!raide(dx, dz)) { c.x += dx; c.z += dz; }
    else if (!raide(dx, 0) && Math.abs(dx) > 1e-5) { c.x += dx; c.vitesse *= 0.9; }
    else if (!raide(0, dz) && Math.abs(dz) > 1e-5) { c.z += dz; c.vitesse *= 0.9; }
    else c.vitesse *= 0.5;
  }

  _basculerRepos() {
    this.repos = !this.repos;
    this.creature.pose = this.repos ? 'couche' : 'debout';
    if (this.repos) { this.jeu.ui.notifier('Vous vous reposez. Le temps s\'accélère. (' + this.jeu.entrees.nomAction('reposer') + ' pour vous relever)'); this.jeu.sauvegarder(); }
  }

  /** Boire ou manger tant que la touche d'interaction est maintenue. */
  _interagir(dt, e, veutBouger) {
    const jeu = this.jeu, c = this.creature, T = jeu.terrain, s = c.echelle;
    this.contexte = null;
    c.positionTete(this._tete);
    const carcasse = jeu.ecosysteme.carcasseProche(c.x, c.z, 2.2 * s + 1.5);
    const fx = Math.sin(c.cap), fz = Math.cos(c.cap), portee = 1.6 * s + 0.6;
    const eauDevant = T.hauteur(c.x + fx * portee, c.z + fz * portee) < 0.02 || T.hauteur(c.x, c.z) < 0.02;
    if (carcasse && this.faim < 99) this.contexte = { type: 'manger', texte: 'Manger', carcasse };
    else if (eauDevant && !c.nage) this.contexte = T.eauSalee(c.x + fx * portee, c.z + fz * portee) ? { type: 'sale', texte: 'Eau salée : imbuvable' } : (this.soif < 99 ? { type: 'boire', texte: 'Boire' } : null);
    const actif = e.actif('interagir') && this.contexte && this.contexte.type !== 'sale' && !veutBouger && jeu.etat === 'jeu' && !this.repos;
    if (actif) {
      this.interaction = this.contexte.type;
      c.teteBas = true; c.mache = true;
      if (c.baisse > 0.55 || this.contexte.type === 'manger') {
        if (this.contexte.type === 'boire') {
          this.soif = Math.min(100, this.soif + J.boireParSeconde * dt);
          if (Math.random() < dt * 1.5) jeu.eau.ajouterOnde(this._tete.x, this._tete.z, 0.25, jeu.tempsReel);
          jeu.carnet.signalerAction('boire');
        } else {
          const q = Math.min(J.mangerParSeconde * dt, this.contexte.carcasse.viande);
          this.contexte.carcasse.viande -= q;
          this.faim = Math.min(100, this.faim + q * (0.9 / Math.max(0.35, s)));
          this.grandir(q * J.croissanceParViande);
        }
      }
    } else { this.interaction = null; c.teteBas = false; c.mache = false; }
  }

  _frapper(type) {
    const jeu = this.jeu, c = this.creature, st = this.infosStade, s = c.echelle;
    const k = Math.pow(s / st.echelleMax, 2);
    if (type === 'morsure') {
      c.positionTete(this._tete);
      const degats = st.morsure * k * (this.a('machoires') ? 1.3 : 1);
      const touche = jeu.ecosysteme.frapper(this._tete.x, this._tete.z, J.porteeMorsure * s, degats, c, 'morsure');
      jeu.audio.claquement(s);
      if (!touche && c.nage === false && jeu.terrain.hauteur(this._tete.x, this._tete.z) < -0.15) {
        // pêche : un banc de poissons à portée de mâchoires ?
        if (jeu.ecosysteme.pecher(this._tete.x, this._tete.z, 2.5 * s + 1)) {
          this.faim = Math.min(100, this.faim + 9 / Math.max(0.4, s)); this.grandir(3);
          jeu.ui.notifier('Poisson attrapé'); jeu.particules.emettre('eclaboussure', this._tete.x, 0.1, this._tete.z, 10, 1);
          jeu.audio.plouf(0.6);
        }
      }
    } else {
      const ax = c.x - Math.sin(c.cap) * 2.4 * s, az = c.z - Math.cos(c.cap) * 2.4 * s;
      jeu.ecosysteme.frapper(ax, az, J.porteeQueue * s * 0.6, st.queue * k, c, 'queue');
      jeu.audio.sifflement();
    }
  }

  _marquer() {
    const c = this.creature;
    if (this.energie < J.coutMarque + 2) { this.jeu.ui.notifier('Trop fatigué pour marquer le territoire.'); return; }
    if (c.nage) return;
    this.energie -= J.coutMarque;
    this.marques.push({ x: Math.round(c.x), z: Math.round(c.z) });
    if (this.marques.length > J.marquesMax) this.marques.shift();
    c.declencher('rugir', 1.2);
    this.jeu.audio.jouerVoix('allosaurus', 'grogne', null, c.echelle);
    this.jeu.particules.emettre('poussiere', c.x, c.y + 0.1, c.z, 10, c.echelle * 2);
    this.jeu.ui.notifier('Territoire marqué (' + this.marques.length + '/' + J.marquesMax + '). Vous y récupérez votre souffle plus vite.');
    this.jeu.sauvegarder();
  }

  _etablirNid() {
    const c = this.creature, T = this.jeu.terrain;
    if (c.nage || T.hauteur(c.x, c.z) < 0.4 || T.pente(c.x, c.z) > 0.3) { this.jeu.ui.notifier('Il faut un sol sec et plat pour établir le nid.'); return; }
    if (this.marques.length && !this.dansTerritoire(c.x, c.z)) { this.jeu.ui.notifier('Le nid doit se trouver dans votre territoire.'); return; }
    this.nid = { x: Math.round(c.x), z: Math.round(c.z) };
    this._majNid();
    this.jeu.ui.notifier('Nid établi ici. Vous vous y réveillerez et vous y reposerez mieux.');
    this.jeu.sauvegarder();
  }
}

const def = (c) => c.def;
