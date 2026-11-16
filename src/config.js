// =============================================================================
//  CONFIGURATION UNIQUE DU JEU
//  Tous les réglages (vitesses, masses, distances, durées…) sont regroupés ici.
//  Modifier une valeur puis relancer le jeu suffit pour voir l'effet.
//  Unités : mètres, secondes, kilogrammes, sauf mention contraire.
// =============================================================================

export const CONFIG = {
  // --------------------------------------------------------------- MONDE ----
  monde: {
    graine: 150_000_000,      // graine du générateur aléatoire (même monde à chaque partie)
    taille: 2048,             // côté du monde carré (2048 m → ≈ 4,2 km²)
    resolution: 1025,         // nombre de points de la grille de hauteurs (1 point tous les 2 m)
    tailleChunk: 128,         // côté d'un morceau de terrain chargé à la demande
    niveauEau: 0,             // altitude de la surface de l'eau (lac, rivière, marais, mer)
    penteMax: 0.95,           // pente (tangente) au-delà de laquelle on ne peut plus grimper
    limiteNage: 930,          // distance au centre au-delà de laquelle l'océan repousse le joueur
  },

  // ---------------------------------------------------------------- TEMPS ---
  temps: {
    dureeJourMinutes: 24,     // durée réelle d'un cycle jour/nuit complet
    heureDepart: 8.4,         // heure de début d'une nouvelle partie (matin)
    acceleReposer: 12,        // accélération de l'horloge quand le dinosaure dort
  },

  // ---------------------------------------------------------------- MÉTÉO ---
  meteo: {
    dureeMin: 150, dureeMax: 420,   // durée d'un type de temps (secondes réelles)
    probaPluie: 0.22, probaOrage: 0.10, probaNuageux: 0.28, // le reste : ciel clair
    brumeMatinDebut: 4.5, brumeMatinFin: 8.5, // heures du brouillard matinal
    densiteBrumeBase: 0.0017,       // brume de distance par temps clair
    densiteBrumeMatin: 0.0048,      // brouillard matinal
    densiteBrumePluie: 0.0042,
    intervalleEclairMin: 5, intervalleEclairMax: 16,
  },

  // --------------------------------------------------------------- JOUEUR ---
  joueur: {
    // Les trois stades de croissance de l'Allosaurus.
    // echelle : taille par rapport à l'adulte (adulte ≈ 8,5 m de long).
    stades: [
      { id: 'juvenile',  nom: 'Juvénile',  echelleMin: 0.30, echelleMax: 0.52, croissance: 0,
        marche: 1.6, trot: 4.2, course: 8.2, virage: 3.4, acceleration: 9, masse: 90,
        morsure: 9, queue: 5, sante: 60 },
      { id: 'subadulte', nom: 'Subadulte', echelleMin: 0.56, echelleMax: 0.80, croissance: 120,
        marche: 2.0, trot: 5.0, course: 9.6, virage: 2.6, acceleration: 7, masse: 600,
        morsure: 22, queue: 14, sante: 120 },
      { id: 'adulte',    nom: 'Adulte',    echelleMin: 0.86, echelleMax: 1.00, croissance: 340,
        marche: 2.3, trot: 5.4, course: 9.2, virage: 1.9, acceleration: 5, masse: 1700,
        morsure: 42, queue: 26, sante: 200 },
    ],
    croissanceMax: 600,        // points de croissance pour atteindre la taille maximale
    // Besoins vitaux : points perdus par seconde (sur 100). Pression volontairement faible.
    faimParSeconde: 0.055,
    soifParSeconde: 0.075,
    energieParSeconde: 0.035,
    energieReposParSeconde: 2.6,   // récupération par seconde réelle en dormant
    santeRegenParSeconde: 0.55,    // régénération si faim et soif > 30
    santePerteBesoin: 0.25,        // perte de santé par seconde si un besoin est à zéro
    santePlancherBesoin: 25,       // la faim/soif ne fait jamais descendre la santé sous ce seuil
    // Souffle (sprint)
    souffleMax: 100, souffleCourse: 11, souffleRegen: 9, souffleEsquive: 16,
    // Actions
    dureeMorsure: 0.55, dureeQueue: 0.8, dureeRugir: 1.9, dureeEsquive: 0.45,
    vitesseEsquive: 9, reposEntreAttaques: 0.25,
    porteeMorsure: 1.5,        // × échelle du joueur, à partir de la tête
    porteeQueue: 4.2,          // × échelle, autour de l'arrière du corps
    boireParSeconde: 14, mangerParSeconde: 9,
    rayonRugissement: 70,      // les petits animaux dans ce rayon prennent la fuite
    vitesseNage: 0.5,          // multiplicateur de vitesse dans l'eau profonde
    // Croissance
    croissanceParViande: 0.55, // points par unité de nourriture mangée
    croissanceParObservation: 12,
    croissanceParFiche: 4,
    croissanceParSeconde: 0.03,
    // Territoire
    rayonMarque: 130, marquesMax: 12, coutMarque: 6,
  },

  // --------------------------------------------------------------- CAMÉRA ---
  camera: {
    champVision: 58,           // degrés
    distance: 9,               // × échelle du dinosaure (+ 2 m)
    hauteurCible: 2.3,         // × échelle : point regardé (au-dessus des hanches)
    sensibilite: 0.0024, sensibiliteManette: 2.4,
    lissage: 7,                // plus grand = caméra plus nerveuse
    angleMin: -0.45, angleMax: 1.25,
    proche: 0.25, lointain: 2600,
    vitessePhoto: 9,           // vitesse de la caméra libre (mode photo)
  },

  // ------------------------------------------------------------ ÉCOSYSTÈME --
  ecosysteme: {
    // Population : nombre de groupes × taille du groupe.
    populations: [
      { espece: 'stegosaurus',   groupes: 2, taille: 4 },
      { espece: 'diplodocus',    groupes: 1, taille: 5 },
      { espece: 'brachiosaurus', groupes: 1, taille: 3 },
      { espece: 'dryosaurus',    groupes: 3, taille: 7 },
      { espece: 'ceratosaurus',  groupes: 2, taille: 1 },
      { espece: 'compsognathus', groupes: 3, taille: 4 },
      { espece: 'allosaurus',    groupes: 1, taille: 1 },   // un rival adulte
    ],
    rhamphorhynchus: 10, poissons: 70, libellules: 36,
    distanceAnimation: 260,    // au-delà, les animaux ne sont plus animés ni affichés
    distanceIAComplete: 320,   // au-delà, l'IA tourne au ralenti
    dureeCarcasse: 420,        // secondes avant qu'une carcasse disparaisse
    delaiReapparition: 90,
    intervalleCarcasseNaturelle: 300, // une carcasse « naturelle » apparaît régulièrement
    soifTroupeau: [300, 480],  // secondes entre deux abreuvages (minimum, variation)
    dureeAbreuvage: 26,
    porteeObservation: 95,     // distance max. pour documenter un comportement
    tempsObservation: 4,       // secondes d'observation continue pour valider
  },

  // ------------------------------------------------------------ VÉGÉTATION --
  vegetation: {
    tailleCellule: 64,         // la flore est rangée par cases de 64 m
    masseRenversement: 500,    // masse minimale (kg) pour renverser un petit arbre
    vitesseRenversement: 3.5,  // vitesse minimale (m/s)
  },

  // ---------------------------------------------------------------- AUDIO ---
  audio: { general: 0.8, nature: 0.8, musique: 0.45 },

  // ------------------------------------------------------------- QUALITÉ ----
  // Chaque niveau active ou coupe des effets. « Moyen » vise 30 images/s sur Chromebook.
  qualite: {
    niveaux: {
      bas: {
        nom: 'Bas', echelle: 0.6, pixelRatioMax: 1, msaa: 0,
        cascades: 0, tailleOmbre: 512, porteeOmbre: 60, frequenceOmbres: 2,
        bloom: false, ao: false, dof: false, rayons: false, reflets: false,
        nuagesPas: 1, distanceVue: 420, densiteVegetation: 0.4, porteeProche: 0.6,
        particules: 0.4, normalesTerrain: false, caustiques: false,
      },
      moyen: {
        nom: 'Moyen', echelle: 0.8, pixelRatioMax: 1, msaa: 2,
        cascades: 2, tailleOmbre: 1024, porteeOmbre: 90, frequenceOmbres: 2,
        bloom: true, ao: false, dof: false, rayons: true, reflets: true, refletsEco: true,
        nuagesPas: 2, distanceVue: 620, densiteVegetation: 0.65, porteeProche: 0.8,
        particules: 0.7, normalesTerrain: true, caustiques: true,
      },
      eleve: {
        nom: 'Élevé', echelle: 1, pixelRatioMax: 1.25, msaa: 4,
        cascades: 3, tailleOmbre: 1024, porteeOmbre: 150, frequenceOmbres: 1,
        bloom: true, ao: true, dof: true, rayons: true, reflets: true,
        nuagesPas: 4, distanceVue: 850, densiteVegetation: 0.85, porteeProche: 1,
        particules: 1, normalesTerrain: true, caustiques: true,
      },
      ultra: {
        nom: 'Ultra', echelle: 1, pixelRatioMax: 2, msaa: 4,
        cascades: 3, tailleOmbre: 2048, porteeOmbre: 220, frequenceOmbres: 1,
        bloom: true, ao: true, dof: true, rayons: true, reflets: true,
        nuagesPas: 6, distanceVue: 1100, densiteVegetation: 1, porteeProche: 1.25,
        particules: 1.4, normalesTerrain: true, caustiques: true,
      },
    },
    ordre: ['bas', 'moyen', 'eleve', 'ultra'],
    dureeBenchmark: 3,           // secondes, au premier lancement
    // Résolution dynamique : on réduit la résolution si les images/s chutent.
    fpsCible: 30, echelleDynMin: 0.55, pasEchelleDyn: 0.05,
  },

  // -------------------------------------------------------------- SAUVEGARDE -
  sauvegarde: { emplacements: 3, intervalleAuto: 60, prefixe: 'allosaure_jurassique_' },
};

// Touches par défaut (codes physiques : identiques en AZERTY et QWERTY).
// « Souris0 » = clic gauche, « Souris2 » = clic droit.
export const TOUCHES_DEFAUT = {
  avancer: ['KeyW', 'ArrowUp'], reculer: ['KeyS', 'ArrowDown'],
  gauche: ['KeyA', 'ArrowLeft'], droite: ['KeyD', 'ArrowRight'],
  sprint: ['ShiftLeft'], allure: ['Tab'], esquive: ['Space'],
  morsure: ['Souris0'], queue: ['Souris2', 'KeyF'],
  rugir: ['KeyR'], interagir: ['KeyE'], reposer: ['KeyX'],
  odorat: ['KeyV'], photo: ['KeyP'], carnet: ['KeyJ'],
  marquer: ['KeyT'], nid: ['KeyN'], cinematique: ['KeyC'],
};

export const NOMS_ACTIONS = {
  avancer: 'Avancer', reculer: 'Reculer', gauche: 'Gauche', droite: 'Droite',
  sprint: 'Courir', allure: 'Marche lente / petite foulée', esquive: 'Esquiver', morsure: 'Mordre', queue: 'Coup de queue',
  rugir: 'Rugir', interagir: 'Boire / manger', reposer: 'Se reposer / dormir',
  odorat: 'Vision olfactive', photo: 'Mode photo', carnet: 'Carnet de bord',
  marquer: 'Marquer le territoire', nid: 'Établir le nid', cinematique: 'Caméra cinématique',
};
