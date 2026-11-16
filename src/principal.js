// =============================================================================
//  ALLOSAURE — point d'entrée
//  Architecture (résumé) :
//   noyau/      maths, entrées clavier/souris/manette, sauvegarde, qualité + benchmark
//   rendu/      textures procédurales, ombres en cascade, post-traitement
//   monde/      terrain, ciel, météo, eau, végétation, particules, empreintes
//   creatures/  espèces (données), constructeur de maillages, animation IK, IA, petite faune
//   joueur/     Allosaurus du joueur, caméra, vision olfactive, mode photo
//   science/    fiches et carnet de bord
//   audio/      sons et musique synthétisés
//   interface/  HUD et menus (HTML/CSS)
//  Ce fichier crée tous les systèmes, puis fait tourner la boucle de jeu :
//  entrées → logique (joueur, IA, monde) → caméra → rendu → interface.
// =============================================================================
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Entrees } from './noyau/entrees.js';
import { Sauvegarde } from './noyau/sauvegarde.js';
import { Qualite } from './noyau/qualite.js';
import { creerTextureBruit, creerNormaleEau, creerTexturesPeau, creerAtlasFeuillage, creerTextureEmpreinte, creerTextureParticule } from './rendu/textures.js';
import { Ombres, OmbresSimples } from './rendu/ombres.js';
import { Post } from './rendu/post.js';
import { Terrain, LIEUX } from './monde/terrain.js';
import { Ciel } from './monde/ciel.js';
import { Meteo } from './monde/meteo.js';
import { Eau } from './monde/eau.js';
import { Vegetation } from './monde/vegetation.js';
import { Particules, Ambiance } from './monde/particules.js';
import { Empreintes } from './monde/empreintes.js';
import { BanqueCreatures } from './creatures/creature.js';
import { Ecosysteme } from './creatures/ia.js';
import { Faune } from './creatures/faune.js';
import { Joueur } from './joueur/joueur.js';
import { CameraJeu } from './joueur/camera.js';
import { Odorat } from './joueur/odorat.js';
import { ModePhoto } from './joueur/photo.js';
import { Carnet } from './science/carnet.js';
import { Progression } from './joueur/progression.js';
import { Audio } from './audio/audio.js';
import { Interface } from './interface/interface.js';

const parametres = new URLSearchParams(location.search);
const attendre = () => new Promise((r) => setTimeout(r, 30));   // laisse le navigateur afficher le texte de chargement

const jeu = {
  etat: 'chargement',          // 'titre' | 'jeu' | 'pause' | 'carnet' | 'photo'
  temps: 0, tempsReel: 0, emplacement: -1, minuteries: [], tSauvegarde: 0, cinematique: false,
  infosRendu: { appels: 0, triangles: 0 },
  frustum: new THREE.Frustum(),
  reglages: Sauvegarde.lireReglages(),
};
const _mat = new THREE.Matrix4(), _v = new THREE.Vector3(), _pousseurs = [], _couleurParticules = new THREE.Color();
const _pj = { x: 0, y: 0, z: 0, rayon: 1 }, _pa = [{ x: 0, y: 0, z: 0, rayon: 1 }, { x: 0, y: 0, z: 0, rayon: 1 }, { x: 0, y: 0, z: 0, rayon: 1 }];

// ------------------------------------------------------------ CRÉATION -------
async function demarrer() {
  const canvas = document.getElementById('jeu');
  const ui = (jeu.ui = new Interface(jeu));
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, depth: false });
  } catch (e) {
    ui.chargement('Votre navigateur ne prend pas en charge WebGL 2, indispensable au jeu.');
    return;
  }
  jeu.renderer = renderer;
  renderer.toneMapping = THREE.NoToneMapping;       // le tone mapping ACES est fait dans le post-traitement
  renderer.info.autoReset = false;
  const scene = (jeu.scene = new THREE.Scene());
  const camera = (jeu.camera = new THREE.PerspectiveCamera(CONFIG.camera.champVision, innerWidth / innerHeight, CONFIG.camera.proche, CONFIG.camera.lointain));
  camera.layers.enable(1);                          // couche 1 : petits détails (absents des reflets)
  jeu.entrees = new Entrees(canvas);
  jeu.audio = new Audio();

  ui.chargement('Textures procédurales…'); await attendre();
  const texBruit = creerTextureBruit(), atlas = creerAtlasFeuillage();
  jeu.ombres = new Ombres(scene, camera, renderer);
  jeu.post = new Post(renderer);
  ui.chargement('Relief, rivière et biomes…'); await attendre();
  jeu.terrain = new Terrain(scene, jeu.ombres, texBruit);
  ui.chargement('Atmosphère…'); await attendre();
  jeu.ciel = new Ciel(scene, jeu.ombres, texBruit);
  jeu.meteo = new Meteo(scene, jeu.ciel);
  jeu.eau = new Eau(scene, jeu.terrain, texBruit, creerNormaleEau());
  ui.chargement('Forêts de conifères, fougères et cycadales…'); await attendre();
  jeu.vegetation = new Vegetation(scene, jeu.terrain, jeu.ombres, atlas);
  const texParticule = creerTextureParticule();
  jeu.particules = new Particules(scene, texParticule);
  jeu.ombresSimples = new OmbresSimples(scene, jeu.terrain, texParticule);
  jeu.ambiance = new Ambiance(scene);
  jeu.empreintes = new Empreintes(scene, jeu.terrain, creerTextureEmpreinte());
  ui.chargement('Faune du Jurassique…'); await attendre();
  jeu.banque = new BanqueCreatures(jeu.ombres, creerTexturesPeau(), atlas);
  jeu.cameraJeu = new CameraJeu(camera, jeu.entrees, jeu.terrain);
  jeu.carnet = new Carnet(jeu);
  jeu.joueur = new Joueur(jeu);
  jeu.ecosysteme = new Ecosysteme(jeu);
  jeu.faune = new Faune(jeu);
  jeu.progression = new Progression(jeu);
  jeu.odorat = new Odorat(jeu);
  jeu.photo = new ModePhoto(jeu);
  jeu.qualite = new Qualite(jeu);
  ui.preparerCarte();
  jeu.meteo.surEclair = (d) => jeu.audio.tonnerre(d);

  // Réglages enregistrés
  const r = jeu.reglages;
  if (r.volumes) Object.assign(jeu.audio.volumes, r.volumes);
  if (r.touches) Object.assign(jeu.entrees.touches, r.touches);
  if (r.sensibilite) jeu.cameraJeu.sensibilite = r.sensibilite;
  jeu.cameraJeu.inverserY = !!r.inverserY;
  if (r.dynamique !== undefined) jeu.qualite.dynamique = r.dynamique;
  const forcee = parametres.get('qualite');
  jeu.qualite.appliquer(CONFIG.qualite.niveaux[forcee] ? forcee : r.qualite || 'moyen');

  ui.chargement('Derniers préparatifs…'); await attendre();
  jeu.cameraJeu.mettreAJour(0.016, jeu.joueur, 0);
  jeu.terrain.toutCharger(camera.position);
  brancherEvenements();
  jeu.etat = 'titre';
  ui.montrerTitre(true);
  ui.finChargement();
  let precedent = performance.now();
  renderer.setAnimationLoop((t) => { const dt = Math.min(0.1, (t - precedent) / 1000); precedent = t; boucle(dt); });
  // Premier lancement : test de performance automatique de 3 secondes
  if (!r.qualite && !forcee && !parametres.has('test')) jeu.mesurerPerformances();
  if (parametres.has('test')) { window.__jeu = jeu; jeu.nouvellePartie(-1); jeu.ui.etapeTuto = -1; }
}

function brancherEvenements() {
  const e = jeu.entrees;
  addEventListener('resize', jeu.redimensionner);
  e.surPause = () => {
    if (jeu.etat === 'jeu') jeu.mettreEnPause();
    else if (jeu.etat === 'pause') jeu.reprendre();
    else if (jeu.etat === 'carnet') jeu.ui.fermerCarnet();
    else if (jeu.etat === 'photo') jeu.photo.sortir();
  };
  // Le pointeur est capturé pendant le jeu ; s'il est relâché (Échap), on met en pause.
  jeu.renderer.domElement.addEventListener('click', () => { if (jeu.etat === 'jeu') e.verrouiller(); jeu.audio.demarrer(); });
  e.surVerrou = (verrouille) => { if (!verrouille && jeu.etat === 'jeu' && !parametres.has('test')) jeu.mettreEnPause(); };
  addEventListener('keydown', (ev) => {
    if (jeu.etat !== 'photo') return;
    if (ev.code === 'Enter') jeu.photo.capturer();
    if (ev.code === 'KeyH') document.getElementById('photo').classList.toggle('cache');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && jeu.etat === 'jeu') { jeu.sauvegarder(); jeu.mettreEnPause(); } });
  addEventListener('beforeunload', () => jeu.sauvegarder());
}

// ------------------------------------------------------- GESTION DE PARTIE ---
jeu.redimensionner = () => {
  const q = jeu.qualite.reglages, pr = Math.min(devicePixelRatio || 1, q.pixelRatioMax);
  jeu.renderer.setPixelRatio(pr);
  jeu.renderer.setSize(innerWidth, innerHeight);
  jeu.camera.aspect = innerWidth / innerHeight; jeu.camera.updateProjectionMatrix();
  jeu.ombres.redimensionner();
  const k = pr * q.echelle * (jeu.qualite.dynamique ? jeu.qualite.echelleDyn : 1);
  jeu.post.redimensionner(innerWidth * k, innerHeight * k);
};

jeu.enregistrerReglages = () => {
  const r = jeu.reglages;
  Object.assign(r, { qualite: jeu.qualite.niveau, dynamique: jeu.qualite.dynamique, volumes: jeu.audio.volumes, touches: jeu.entrees.touches,
    sensibilite: jeu.cameraJeu.sensibilite, inverserY: jeu.cameraJeu.inverserY });
  Sauvegarde.ecrireReglages(r);
};

jeu.mesurerPerformances = (fin) => {
  jeu.qualite.appliquer('moyen');
  jeu.ui.montrerMesure(true);
  jeu.qualite.lancerBenchmark((niveau, fps) => {
    jeu.ui.montrerMesure(false);
    jeu.qualite.appliquer(niveau);
    jeu.enregistrerReglages();
    jeu.ui.notifier(`Qualité « ${CONFIG.qualite.niveaux[niveau].nom} » choisie (${Math.round(fps)} images/s mesurées). Modifiable dans les options.`);
    if (fin) fin();
  });
};

jeu.planifier = (delai, fonction) => jeu.minuteries.push({ t: delai, fonction });

jeu.sauvegarder = () => {
  if (jeu.emplacement < 0 || !jeu.joueur || jeu.etat === 'titre' || jeu.etat === 'chargement') return;
  const j = jeu.joueur;
  Sauvegarde.ecrire(jeu.emplacement, {
    version: 1,
    resume: { stade: j.infosStade.nom, jour: jeu.ciel.jourNumero, fiches: jeu.carnet.nbSections, date: Date.now() },
    joueur: j.exporter(), carnet: jeu.carnet.exporter(), progression: jeu.progression.exporter(), heure: jeu.ciel.heure, jourNumero: jeu.ciel.jourNumero, meteo: jeu.meteo.type,
  });
};

function entrerEnJeu() {
  jeu.etat = 'jeu'; jeu.cameraJeu.mode = 'suivi'; jeu.cameraJeu.init = false; jeu.cameraJeu.lacet = jeu.joueur.creature.cap + 0.5;
  jeu.ui.montrerTitre(false);
  jeu.audio.demarrer();
  jeu.entrees.verrouiller();
  jeu.terrain.toutCharger(jeu.joueur.creature.groupe.position);
}

jeu.nouvellePartie = (emplacement) => {
  jeu.emplacement = emplacement;
  jeu.joueur.reinitialiser(); jeu.carnet.reinitialiser(); jeu.progression.reinitialiser();
  jeu.ciel.heure = CONFIG.temps.heureDepart; jeu.ciel.jourNumero = 1; jeu.meteo.forcer('clair');
  entrerEnJeu();
  jeu.ui.annoncer('Jurassique supérieur', 'Il y a environ 150 millions d\'années');
  if (!jeu.reglages.tutorielFait) jeu.ui.demarrerTutoriel();
  jeu.sauvegarder();
};

jeu.chargerPartie = (emplacement) => {
  const d = Sauvegarde.lire(emplacement);
  if (!d) return;
  jeu.emplacement = emplacement;
  jeu.joueur.importer(d.joueur); jeu.carnet.importer(d.carnet || {}); jeu.progression.importer(d.progression);
  jeu.ciel.heure = d.heure || CONFIG.temps.heureDepart; jeu.ciel.jourNumero = d.jourNumero || 1; jeu.meteo.forcer(d.meteo || 'clair');
  entrerEnJeu();
};

jeu.mettreEnPause = () => { if (jeu.etat !== 'jeu') return; jeu.etat = 'pause'; jeu.entrees.liberer(); jeu.ui.montrerPause(true); jeu.audio.pause(true); jeu.sauvegarder(); };
jeu.reprendre = () => { jeu.etat = 'jeu'; jeu.ui.montrerPause(false); jeu.audio.pause(false); jeu.entrees.verrouiller(); };
jeu.retourTitre = () => {
  jeu.etat = 'titre'; jeu.cameraJeu.mode = 'titre'; jeu.emplacement = -1; jeu.cinematique = false; document.body.classList.remove('cine');
  jeu.ui.montrerPause(false); jeu.ui.montrerTitre(true); jeu.audio.pause(false);
};

// --------------------------------------------------- ÉVÉNEMENT : PIED POSÉ ---
// Appelé par l'animation à chaque pas : empreinte, poussière, éclaboussure, son, tremblement.
jeu.surPas = (x, y, z, creature, patte) => {
  const jc = jeu.joueur.creature, d = Math.hypot(x - jc.x, z - jc.z);
  if (d > 90) return;
  const estJoueur = creature === jc;
  const masse = estJoueur ? jeu.joueur.masse : creature.def.masse * Math.pow(creature.echelle, 3);
  const dansEau = jeu.terrain.hauteur(x, z) < -0.03;
  let mou = 0;
  if (dansEau) {
    jeu.eau.ajouterOnde(x, z, Math.min(1, 0.2 + masse / 4000), jeu.tempsReel);
    if (d < 50 && masse > 15) jeu.particules.emettre('eclaboussure', x, 0.05, z, masse > 500 ? 6 : 3, Math.min(1.6, 0.4 + masse / 3000));
  } else if (masse > 15) {
    mou = jeu.empreintes.poser(x, z, creature.cap, patte.P.longueurDoigt * 2.7 * creature.echelle, jeu.temps);
    const rapide = Math.abs(creature.vitesse) > creature.marche * 1.4;
    if (mou > 0.55 && jeu.terrain.boue(x, z) > 0.4) { if (rapide && d < 40) jeu.particules.emettre('boue', x, y + 0.05, z, 3, Math.min(1.5, masse / 1500 + 0.4)); }
    else if ((rapide || masse > 3000) && d < 60 && jeu.meteo.pluie < 0.4) jeu.particules.emettre('poussiere', x, y + 0.05, z, 2, Math.min(1.6, 0.35 + masse / 6000));
  }
  if (d < 70 && (masse > 15 || d < 12)) jeu.audio.pas(estJoueur ? null : creature.groupe.position, masse, mou, dansEau);
  // les géants font trembler le sol
  if (masse > 2500 && d < 50) jeu.cameraJeu.secouer((1 - d / 50) * Math.min(1, masse / 25000) * 0.6 + 0.04);
  else if (estJoueur && masse > 900) jeu.cameraJeu.secouer(0.035);
};

// ------------------------------------------------------------------ BOUCLE ---
function boucle(dtReel) {
  const e = jeu.entrees, j = jeu.joueur, cam = jeu.camera;
  jeu.tempsReel += dtReel;
  e.lireManette();

  // Raccourcis globaux
  if (jeu.etat === 'jeu') {
    if (e.vientDe('carnet')) jeu.ui.ouvrirCarnet();
    else if (e.vientDe('photo')) jeu.photo.entrer();
    else if (e.vientDe('odorat')) jeu.odorat.basculer();
    else if (e.vientDe('carte')) jeu.ui.basculerCarte();
    else if (e.vientDe('cinematique')) { jeu.cinematique = !jeu.cinematique; jeu.cameraJeu.mode = jeu.cinematique ? 'cinematique' : 'suivi'; document.body.classList.toggle('cine', jeu.cinematique); }
  } else if (jeu.etat === 'carnet' && e.vientDe('carnet')) jeu.ui.fermerCarnet();
  else if (jeu.etat === 'photo' && e.vientDe('photo')) jeu.photo.sortir();

  // Le monde ne vit que pendant le jeu (et, au ralenti, derrière l'écran-titre)
  const actif = jeu.etat === 'jeu' || jeu.etat === 'titre';
  const dt = actif ? dtReel : 0;
  if (actif) {
    jeu.temps += dt;
    for (let i = jeu.minuteries.length - 1; i >= 0; i--) { const m = jeu.minuteries[i]; m.t -= dt; if (m.t <= 0) { jeu.minuteries.splice(i, 1); m.fonction(); } }
    if (jeu.etat === 'jeu') j.mettreAJour(dt, dtReel); else j.creature.mettreAJour(dt, jeu.terrain);
    jeu.ecosysteme.mettreAJour(dt);
    jeu.faune.mettreAJour(dt, jeu.temps);
    jeu.meteo.mettreAJour(dt, dtReel, cam);
    if (jeu.etat === 'jeu') {
      jeu.carnet.mettreAJour(dt, cam);
      jeu.progression.mettreAJour(dt);
      jeu.tSauvegarde += dt;
      if (jeu.tSauvegarde > CONFIG.sauvegarde.intervalleAuto) { jeu.tSauvegarde = 0; jeu.sauvegarder(); }
    }
  }
  // Caméra
  if (jeu.photo.actif) jeu.photo.mettreAJour(dtReel); else if (jeu.etat !== 'pause' && jeu.etat !== 'carnet') jeu.cameraJeu.mettreAJour(dtReel, j, jeu.tempsReel);
  cam.updateMatrixWorld();
  jeu.frustum.setFromProjectionMatrix(_mat.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));

  // Ciel et lumière (l'horloge s'accélère pendant le sommeil)
  jeu.ciel.mettreAJour(dt * (j.repos ? CONFIG.temps.acceleReposer : 1), cam, jeu.meteo, jeu.tempsReel);

  // Monde
  jeu.terrain.uniformes.uPluie.value = jeu.meteo.pluie; jeu.terrain.uniformes.uJour.value = jeu.ciel.jour;
  jeu.terrain.mettreAJour(cam.position, jeu.temps);
  // animaux qui écartent la végétation : le joueur + les plus proches
  const jc = j.creature;
  _pj.x = jc.x; _pj.y = jc.y + 0.5; _pj.z = jc.z; _pj.rayon = 1.2 + jc.echelle * 1.6;
  _pousseurs.length = 0; _pousseurs.push(_pj);
  for (let i = 0; i < jeu.ecosysteme.pousseurs.length; i++) { const a = jeu.ecosysteme.pousseurs[i], p = _pa[i]; p.x = a.x; p.y = a.y + 0.5; p.z = a.z; p.rayon = 0.8 + a.def.rayon * a.c.echelle * 1.8; _pousseurs.push(p); }
  jeu.vegetation.mettreAJour(dt, jeu.temps, cam, jeu.frustum, _pousseurs, jeu.meteo, jeu.ciel);
  jeu.banque.uCiel.value.copy(jeu.ciel.couleurHorizon);
  jeu.eau.mettreAJour(jeu.tempsReel, jeu.ciel, jeu.meteo);
  const hEcran = jeu.post.hauteur;
  // lumière reçue par les particules : un peu de soleil + la lumière du ciel
  const cl = jeu.ciel.couleurLumiere, kl = jeu.ciel.intensiteLumiere * 0.2, ch = jeu.ciel.couleurHorizon;
  _couleurParticules.setRGB(cl.r * kl + ch.r, cl.g * kl + ch.g, cl.b * kl + ch.b);
  jeu.particules.mettreAJour(dt, hEcran, _couleurParticules);
  const humidite = Math.max(0, 1 - Math.max(0, jeu.terrain.hauteur(jc.x, jc.z)) / 4);
  jeu.ambiance.mettreAJour(jeu.tempsReel, hEcran, jeu.ciel, jeu.meteo, humidite);
  jeu.empreintes.mettreAJour(jeu.temps);
  jeu.ecosysteme.visibles[0] = jc;
  jeu.ombresSimples.mettreAJour(jeu.ecosysteme.visibles, jeu.ciel.jour);
  jeu.odorat.mettreAJour(dtReel, jeu.tempsReel, innerHeight * (jeu.renderer.getPixelRatio()));
  jeu.audio.mettreAJour(dtReel, cam, { vent: jeu.meteo.vent, pluie: jeu.meteo.pluie, jour: jeu.ciel.jour, eau: humidite * humidite, foret: jeu.vegetation.densiteArbres(jc.x, jc.z) });

  jeu.rendre();
  jeu.ui.mettreAJour(dtReel);
  jeu.qualite.mettreAJour(dtReel);
  e.finImage();
}

// ------------------------------------------------------------------- RENDU ---
jeu.rendre = () => {
  const r = jeu.renderer, cam = jeu.camera, post = jeu.post, ciel = jeu.ciel;
  r.info.reset();
  // position du soleil à l'écran (pour les rayons)
  _v.copy(ciel.dirSoleil).multiplyScalar(1000).add(cam.position).project(cam);
  const devant = _v.z < 1 && Math.abs(_v.x) < 1.6 && Math.abs(_v.y) < 1.6;
  post.soleilUV.set(_v.x * 0.5 + 0.5, _v.y * 0.5 + 0.5);
  post.forceRayons = devant ? Math.min(1, Math.max(0, ciel.dirSoleil.y * 6 + 0.25)) * (1 - jeu.meteo.sombre) * (0.25 + 0.5 * Math.min(1, jeu.meteo.brumeMatin * 2 + 0.35)) : 0;
  post.couleurSoleil.copy(ciel.couleurSoleil).multiplyScalar(1.1);
  post.exposition = ciel.exposition; post.odorat = jeu.odorat.intensite;
  if (!jeu.photo.actif) {
    // légère profondeur de champ : marquée en mode cinématique, discrète sinon
    post.dofFocus = jeu.cameraJeu.distance; post.dofForce = jeu.cinematique ? 0.9 : jeu.etat === 'titre' ? 0.6 : 0.3; post.filtre = 0;
  }
  jeu.eau.rendreReflet(r, jeu.scene, cam, post.largeur, post.hauteur);
  post.rendre(jeu.scene, cam, jeu.tempsReel);
  if (jeu.odorat.intensite > 0.02) { r.autoClear = false; r.setRenderTarget(null); r.render(jeu.odorat.scene, cam); r.autoClear = true; }
  jeu.infosRendu.appels = r.info.render.calls; jeu.infosRendu.triangles = r.info.render.triangles;
};

demarrer().catch((err) => { console.error(err); const c = document.getElementById('chargement-texte'); if (c) c.textContent = 'Erreur au démarrage : ' + err.message; });
