// FICHIER GÉNÉRÉ par tools/bundle.js — ne pas modifier à la main.
// Sert uniquement à jouer en ouvrant index.html depuis le disque (file://).
(function () {
"use strict";
const __m = {};
function __def(o, g) { for (const k in g) Object.defineProperty(o, k, { get: g[k], enumerable: true }); }
function __star(o, src) { for (const k in src) if (!(k in o)) Object.defineProperty(o, k, { get: () => src[k], enumerable: true }); }

// ---- src/data/config.js ----
__m["src/data/config.js"] = (function () {
const __exports = {};
__def(__exports, { "CONFIG": () => CONFIG });
// Paramètres généraux du jeu (temps, sauvegarde, interface).
// Les paramètres économiques sont dans les autres fichiers de src/data/.

const CONFIG = {
  /** Version du format de sauvegarde. Incrémenter + ajouter une migration. */
  saveVersion: 1,
  startYear: 2026,
  /** Jour de la semaine du jour 0 (0 = lundi). Le 1/1/2026 est un jeudi. */
  startWeekday: 3,
  /** Durée d'un mois de jeu en secondes réelles à la vitesse ×1. */
  secondsPerMonth: 60,
  /** Vitesses disponibles (multiplicateurs). */
  speeds: [0, 1, 2, 4],
  /** Plafond de jours simulés par image (évite les sauts après un onglet en arrière-plan). */
  maxDaysPerFrame: 2,
  /** Autosauvegarde toutes les N secondes réelles de jeu actif. */
  autosaveSeconds: 30,
  /** Nombre d'emplacements de sauvegarde manuelle. */
  saveSlots: 3,
  /** Taille max du journal d'événements conservé dans l'état. */
  logSize: 150,
  /** Nombre de jours de trésorerie quotidienne conservés (graphique). */
  dailyHistoryDays: 180,
  /** Taille max du journal d'actions (rejeu V2). */
  actionLogMax: 20000,
};
return __exports;
})();

// ---- src/data/difficulty.js ----
__m["src/data/difficulty.js"] = (function () {
const __exports = {};
__def(__exports, { "DIFFICULTIES": () => DIFFICULTIES, "DIFFICULTY_ORDER": () => DIFFICULTY_ORDER });
// Niveaux de difficulté. Montants en centimes.

const DIFFICULTIES = {
  facile: {
    id: 'facile',
    label: 'Facile',
    description: 'Gros capital de départ, événements rares et doux, concurrents tranquilles.',
    startingCapital: 3_500_000, // 35 000 €
    eventFrequency: 0.7,
    eventSeverity: 0.7,
    competitorAggression: 0.7,
    competitorCount: [2, 2],
    taxRigor: 0.5, // probabilité relative des contrôles et sévérité des amendes
    passiveTarget: 200_000, // 2 000 €/mois
    graceDays: 75,
    marketMult: 1.15,
    scoreMult: 0.8,
  },
  normal: {
    id: 'normal',
    label: 'Normal',
    description: "L'expérience prévue : il faut gérer sa trésorerie, mais on pardonne quelques erreurs.",
    startingCapital: 2_000_000, // 20 000 €
    eventFrequency: 1,
    eventSeverity: 1,
    competitorAggression: 1,
    competitorCount: [2, 3],
    taxRigor: 1,
    passiveTarget: 300_000, // 3 000 €/mois
    graceDays: 60,
    marketMult: 1,
    scoreMult: 1,
  },
  realiste: {
    id: 'realiste',
    label: 'Réaliste',
    description: 'Capital modeste, fisc rigoureux, concurrence réelle. La majorité des entreprises ne survivent pas.',
    startingCapital: 1_200_000, // 12 000 €
    eventFrequency: 1.1,
    eventSeverity: 1.15,
    competitorAggression: 1.15,
    competitorCount: [3, 3],
    taxRigor: 1.2,
    passiveTarget: 300_000,
    graceDays: 45,
    marketMult: 0.92,
    scoreMult: 1.25,
  },
  difficile: {
    id: 'difficile',
    label: 'Difficile',
    description: 'Presque rien en poche, des événements durs, des concurrents agressifs. Pour les experts.',
    startingCapital: 600_000, // 6 000 €
    eventFrequency: 1.35,
    eventSeverity: 1.35,
    competitorAggression: 1.35,
    competitorCount: [3, 4],
    taxRigor: 1.5,
    passiveTarget: 350_000, // 3 500 €/mois
    graceDays: 30,
    marketMult: 0.85,
    scoreMult: 1.5,
  },
};

const DIFFICULTY_ORDER = ['facile', 'normal', 'realiste', 'difficile'];
return __exports;
})();

// ---- src/engine/rng.js ----
__m["src/engine/rng.js"] = (function () {
const __exports = {};
__def(__exports, { "hashSeed": () => hashSeed, "createRng": () => createRng });
// Générateur pseudo-aléatoire déterministe (mulberry32).
// Son état tient dans un entier 32 bits : il est sauvegardé dans state.rngState,
// ce qui rend toute partie reproductible à partir de sa seed.

/** Transforme une chaîne (seed saisie par le joueur) en entier 32 bits. */
function hashSeed(str) {
  let h = 2166136261 >>> 0; // FNV-1a
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // mélange final (avalanche) pour éviter les seeds proches
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Crée un générateur. `state` est un entier 32 bits (state.rngState).
 * Après usage, relire `rng.state` pour le sauvegarder.
 */
function createRng(state) {
  const rng = {
    state: state >>> 0,
    /** Flottant uniforme dans [0, 1[. */
    next() {
      rng.state = (rng.state + 0x6d2b79f5) >>> 0;
      let t = rng.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Entier uniforme dans [min, max] (inclus). */
    int(min, max) {
      return min + Math.floor(rng.next() * (max - min + 1));
    },
    /** Flottant uniforme dans [min, max[. */
    range(min, max) {
      return min + rng.next() * (max - min);
    },
    /** Vrai avec la probabilité p. */
    chance(p) {
      return rng.next() < p;
    },
    /** Élément au hasard d'un tableau non vide. */
    pick(arr) {
      return arr[Math.floor(rng.next() * arr.length)];
    },
    /** Élément au hasard selon des poids (fonction ou nom de propriété). */
    weighted(items, weightOf) {
      const w = typeof weightOf === 'function' ? weightOf : (x) => x[weightOf];
      let total = 0;
      for (const it of items) total += Math.max(0, w(it));
      if (total <= 0) return null;
      let r = rng.next() * total;
      for (const it of items) {
        r -= Math.max(0, w(it));
        if (r < 0) return it;
      }
      return items[items.length - 1];
    },
    /** Loi normale (Box-Muller). */
    normal(mean = 0, sd = 1) {
      let u = 0;
      while (u === 0) u = rng.next();
      const v = rng.next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    /** Loi de Poisson (Knuth pour λ petit, approximation normale sinon). */
    poisson(lambda) {
      if (lambda <= 0) return 0;
      if (lambda > 30) return Math.max(0, Math.round(rng.normal(lambda, Math.sqrt(lambda))));
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= rng.next();
      } while (p > L);
      return k - 1;
    },
  };
  return rng;
}
return __exports;
})();

// ---- src/data/economy.js ----
__m["src/data/economy.js"] = (function () {
const __exports = {};
__def(__exports, { "ECONOMY": () => ECONOMY, "CATEGORIES": () => CATEGORIES });
// Paramètres économiques communs à tous les secteurs. Montants en centimes.

const ECONOMY = {
  // Coût de la vie du dirigeant (loyer, nourriture, transport…) par mois. [approx]
  livingCost: 160_000,
  // Prélèvement / rémunération mensuel(le) par défaut du dirigeant.
  defaultDraw: 180_000,
  // Réputation et satisfaction de départ (0-100).
  startReputation: 25,
  startSatisfaction: 60,
  // Vitesse de convergence quotidienne de la réputation vers la satisfaction.
  reputationInertia: 0.006,
  // Facteur marketing : 1 + k × ln(1 + budget / budgetRéf).
  marketingK: 0.35,
  // Poids de l'option « hors marché » dans le partage de la demande.
  outsideOption: 0.55,
  // Attractivité totale des concurrents quand il n'y en a pas encore (phase 2).
  defaultCompetitorAttraction: 2,
  // Conjoncture : marche aléatoire autour de 1.
  economyVolatility: 0.004,
  economyMeanReversion: 0.01,
  economyMin: 0.7,
  economyMax: 1.2,
  // Découvert bancaire.
  overdraftRate: 0.095, // [approx] taux annuel débiteur d'un compte pro
  overdraftStart: 250_000, // 2 500 € autorisés au départ
  overdraftRevenueShare: 0.5, // limite ≈ 50 % du CA mensuel moyen
  overdraftMax: 5_000_000,
  // Durée d'amortissement des investissements (années).
  amortizationYears: 3,
  // Énergie de base mensuelle (électricité/chauffage) hors secteur. [approx]
  energyBase: 6_000,
  // Taux de l'épargne et des crédits (pilotés par la « BCE » du jeu).
  baseRate: 0.0225, // taux directeur simulé de départ
};

/** Libellés des catégories comptables (revenus et dépenses). */
const CATEGORIES = {
  // revenus
  ventes: 'Ventes',
  projets: 'Projets clients',
  maintenance: 'Contrats de maintenance',
  saas: 'Abonnements SaaS',
  chantiers: 'Chantiers',
  abonnements: 'Abonnements élèves',
  stages: 'Stages',
  subvention: 'Subventions',
  autres_revenus: 'Autres revenus',
  // dépenses déductibles
  salaires: 'Salaires (coût employeur)',
  remuneration: 'Rémunération du dirigeant',
  loyer: 'Loyer',
  energie: 'Énergie',
  marketing: 'Marketing',
  stock: 'Achats de stock',
  materiel: 'Matériel et fournitures',
  logistique: 'Logistique',
  logiciels: 'Logiciels et abonnements',
  assurances: 'Assurances',
  comptable: 'Comptable',
  frais_bancaires: 'Frais bancaires et de paiement',
  interets: 'Intérêts',
  amendes: 'Amendes et pénalités',
  evenements: 'Imprévus',
  formation: 'Formations',
  recrutement: 'Recrutement',
  licenciement: 'Indemnités de licenciement',
  deplacements: 'Déplacements',
  creances: 'Créances irrécouvrables',
  investissement: 'Investissements (amortis)',
  autres: 'Autres charges',
  // flux non déductibles
  tva: 'TVA reversée',
  impot: 'Impôt (IPP / ISOC)',
  cotisations: 'Cotisations sociales',
  precompte: 'Précompte professionnel',
  remboursement: 'Remboursement de prêt (capital)',
  prelevement: 'Prélèvements / virements perso',
  dividende: 'Dividendes',
  pret: 'Prêts reçus',
  apport: 'Apports personnels',
  investisseur: 'Levée de fonds',
};
return __exports;
})();

// ---- src/data/world.js ----
__m["src/data/world.js"] = (function () {
const __exports = {};
__def(__exports, { "WEATHER": () => WEATHER });
// Météo belge simplifiée : probabilités par mois (janvier → décembre).

const WINTER = { pluie: 0.42, nuageux: 0.3, froid: 0.22, soleil: 0.06 };
const SPRING = { soleil: 0.3, nuageux: 0.35, pluie: 0.35 };
const SUMMER = { soleil: 0.45, nuageux: 0.25, pluie: 0.22, canicule: 0.08 };
const AUTUMN = { pluie: 0.5, nuageux: 0.35, soleil: 0.12, froid: 0.03 };

const WEATHER = {
  byMonth: [WINTER, WINTER, SPRING, SPRING, SPRING, SUMMER, SUMMER, SUMMER, AUTUMN, AUTUMN, AUTUMN, WINTER],
  labels: { soleil: 'Soleil', nuageux: 'Nuageux', pluie: 'Pluie', froid: 'Froid', canicule: 'Canicule' },
};
return __exports;
})();

// ---- src/engine/calendar.js ----
__m["src/engine/calendar.js"] = (function () {
const __exports = {};
__def(__exports, { "DAYS_PER_MONTH": () => DAYS_PER_MONTH, "MONTHS_PER_YEAR": () => MONTHS_PER_YEAR, "DAYS_PER_YEAR": () => DAYS_PER_YEAR, "MONTH_NAMES": () => MONTH_NAMES, "MONTH_SHORT": () => MONTH_SHORT, "WEEKDAY_NAMES": () => WEEKDAY_NAMES, "dateOf": () => dateOf, "dayOf": () => dayOf, "isWeekend": () => isWeekend, "formatDate": () => formatDate, "formatMonth": () => formatMonth, "monthIndexOf": () => monthIndexOf });
// Calendrier simplifié : 12 mois de 30 jours (année de 360 jours).
// Le jour 0 est le jeudi 1er janvier 2026.

const { CONFIG } = __m["src/data/config.js"];

const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const WEEKDAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

/** Décompose un numéro de jour en date de jeu. */
function dateOf(day) {
  const d = Math.max(0, Math.floor(day));
  const yearIdx = Math.floor(d / DAYS_PER_YEAR);
  const inYear = d - yearIdx * DAYS_PER_YEAR;
  const month = Math.floor(inYear / DAYS_PER_MONTH); // 0..11
  const dom = inYear - month * DAYS_PER_MONTH + 1; // 1..30
  const weekday = (d + CONFIG.startWeekday) % 7; // 0 = lundi
  return {
    year: CONFIG.startYear + yearIdx,
    yearIdx,
    month,
    dom,
    weekday,
    quarter: Math.floor(month / 3), // 0..3
    dayOfYear: inYear,
  };
}

/** Numéro de jour pour (année d'index, mois 0-11, jour 1-30). */
function dayOf(yearIdx, month, dom) {
  return yearIdx * DAYS_PER_YEAR + month * DAYS_PER_MONTH + (dom - 1);
}

function isWeekend(day) {
  return dateOf(day).weekday >= 5;
}

function formatDate(day) {
  const d = dateOf(day);
  return `${d.dom} ${MONTH_NAMES[d.month]} ${d.year}`;
}

function formatMonth(monthIndex) {
  const yearIdx = Math.floor(monthIndex / 12);
  return `${MONTH_SHORT[monthIndex % 12]} ${CONFIG.startYear + yearIdx}`;
}

/** Index absolu du mois (0 = janvier de la première année). */
function monthIndexOf(day) {
  return Math.floor(day / DAYS_PER_MONTH);
}
return __exports;
})();

// ---- src/engine/money.js ----
__m["src/engine/money.js"] = (function () {
const __exports = {};
__def(__exports, { "eur": () => eur, "mul": () => mul, "toEur": () => toEur, "clamp": () => clamp, "sum": () => sum, "annuity": () => annuity });
// Tous les montants du jeu sont des CENTIMES ENTIERS.
// Ces fonctions garantissent qu'aucun flottant ne se glisse dans l'argent.

/** Euros (nombre, éventuellement décimal) → centimes entiers. */
function eur(x) {
  return Math.round(x * 100);
}

/** Centimes × facteur, arrondi au centime. */
function mul(cents, factor) {
  const r = Math.round(cents * factor);
  return r === 0 ? 0 : r; // évite -0
}

/** Centimes → euros (pour les calculs d'affichage uniquement). */
function toEur(cents) {
  return cents / 100;
}

/** Borne un entier. */
function clamp(x, min, max) {
  return x < min ? min : x > max ? max : x;
}

/** Somme de centimes. */
function sum(arr) {
  let s = 0;
  for (const x of arr) s += x;
  return s;
}

/** Mensualité constante d'un prêt (centimes), taux annuel en décimal. */
function annuity(principal, annualRate, months) {
  if (months <= 0) return principal;
  const r = annualRate / 12;
  if (r === 0) return Math.ceil(principal / months);
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -months)));
}
return __exports;
})();

// ---- src/engine/modifiers.js ----
__m["src/engine/modifiers.js"] = (function () {
const __exports = {};
__def(__exports, { "addModifier": () => addModifier, "modMult": () => modMult, "modAdd": () => modAdd, "expireModifiers": () => expireModifiers, "activeModifiers": () => activeModifiers });
// Effets temporaires (ex. « demande ×0,8 pendant 30 jours »).
// state.modifiers = [{ key, mult, add, until, label, source }]

/** Ajoute un modificateur temporaire. days = durée en jours. */
function addModifier(state, { key, mult = 1, add = 0, days = 30, label = '', source = '' }) {
  state.modifiers.push({ key, mult, add, until: state.time.day + Math.max(1, Math.round(days)), label, source });
}

/** Produit des multiplicateurs actifs pour une clé. */
function modMult(state, key) {
  let m = 1;
  for (const x of state.modifiers) if (x.key === key) m *= x.mult;
  return m;
}

/** Somme des ajouts actifs pour une clé. */
function modAdd(state, key) {
  let a = 0;
  for (const x of state.modifiers) if (x.key === key) a += x.add;
  return a;
}

/** Retire les modificateurs expirés (appelé chaque jour). */
function expireModifiers(state) {
  const d = state.time.day;
  if (state.modifiers.some((m) => m.until <= d)) state.modifiers = state.modifiers.filter((m) => m.until > d);
}

/** Libellés des modificateurs actifs (pour le panneau « pourquoi ? »). */
function activeModifiers(state) {
  return state.modifiers.filter((m) => m.label);
}
return __exports;
})();

// ---- src/engine/systems/core.js ----
__m["src/engine/systems/core.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "daily": () => daily, "economyIndex": () => economyIndex });
// Monde : conjoncture économique, météo, taux directeur.

const { ECONOMY } = __m["src/data/economy.js"];
const { WEATHER } = __m["src/data/world.js"];
const { dateOf } = __m["src/engine/calendar.js"];
const { clamp } = __m["src/engine/money.js"];
const { modMult } = __m["src/engine/modifiers.js"];

function init(state, opts, diff, rng) {
  state.world = { economy: 1, economyTrend: 0, weather: 'nuageux', baseRate: ECONOMY.baseRate };
  state.modifiers = [];
  pickWeather(state, rng);
}

function pickWeather(state, rng) {
  const m = dateOf(state.time.day).month;
  const table = WEATHER.byMonth[m];
  state.world.weather = rng.weighted(Object.keys(table), (k) => table[k]);
}

function daily(state, rng) {
  pickWeather(state, rng);
  const w = state.world;
  // Marche aléatoire avec rappel vers 1 (+ tendance imposée par les événements).
  const shock = rng.normal(0, ECONOMY.economyVolatility);
  w.economy += (1 - w.economy) * ECONOMY.economyMeanReversion + shock + w.economyTrend;
  w.economy = clamp(w.economy, ECONOMY.economyMin, ECONOMY.economyMax);
  w.economyTrend *= 0.99;
}

/** Conjoncture effective (avec modificateurs). */
function economyIndex(state) {
  return state.world.economy * modMult(state, 'economy');
}
return __exports;
})();

// ---- src/data/fiscalite.js ----
__m["src/data/fiscalite.js"] = (function () {
const __exports = {};
__def(__exports, { "FISCALITE": () => FISCALITE, "SIMPLIFICATIONS": () => SIMPLIFICATIONS });
// =============================================================================
//  FISCALITÉ BELGE — TOUS les taux, plafonds et seuils du jeu sont ici.
// =============================================================================
//
//  Année de référence : 2026 (revenus 2025-2026). Recherches effectuées en
//  octobre 2026 sur des sources secondaires (caisses sociales, secrétariats
//  sociaux, banques, Test-Achats, Wikifin, SPF Finances quand disponible).
//
//  ⚠️  CHAQUE VALEUR EST « À VÉRIFIER » avant tout usage réel. Le jeu est une
//  simulation pédagogique, pas un outil de calcul fiscal.
//
//  Légende des commentaires :
//    [source]  d'où vient le chiffre
//    [approx]  approximation volontaire faite pour le jeu (non officielle)
//    [incert]  valeur pour laquelle les sources divergent / réforme en cours
//
//  Montants en CENTIMES.
// =============================================================================

const FISCALITE = {
  referenceYear: 2026,

  // ---------------------------------------------------------------------------
  // TVA
  // ---------------------------------------------------------------------------
  tva: {
    // [source] Code TVA : taux normal 21 %, intermédiaire 12 %, réduit 6 %.
    rates: { normal: 0.21, intermediaire: 0.12, reduit: 0.06 },
    // [source] Régime de franchise des petites entreprises : CA annuel < 25 000 €
    // (plafond inchangé depuis 2016 ; proposition parlementaire 2026 de le porter
    // progressivement à 30 000 € — [incert] non adoptée à notre connaissance).
    franchiseThreshold: 2_500_000,
    // [source] Déclaration trimestrielle pour les petites entreprises.
    // [incert] Échéance : le 20 du mois qui suit le trimestre (certaines sources
    // mentionnent le 25 depuis la réforme 2023). Le jeu utilise le 20.
    dueDayOfMonth: 20,
    // Restauration : [source] repas sur place 12 %, boissons alcoolisées 21 %.
    // [incert] L'accord budgétaire 2025-2026 prévoit : repas à emporter 6 % → 12 %,
    // boissons non alcoolisées en horeca 21 % → 12 % ; date d'entrée en vigueur
    // non confirmée. Le jeu applique 12 % sur la nourriture (sur place et à
    // emporter) et 21 % sur la part « boissons ».
    restaurantFood: 0.12,
    restaurantDrinks: 0.21,
    // [source] Rénovation d'un logement privé de plus de 10 ans facturée à un
    // particulier : 6 % (conditions cumulatives). Neuf / professionnels : 21 %.
    renovation: 0.06,
    // [incert] Soutien scolaire : exemption possible (art. 44 §2 Code TVA) pour
    // l'enseignement scolaire ou les leçons particulières données à titre
    // personnel ; un centre commercial non reconnu facture en principe 21 %.
    // Le jeu prend 21 % (cas le moins favorable).
    education: 0.21,
  },

  // ---------------------------------------------------------------------------
  // IPP — impôt des personnes physiques
  // ---------------------------------------------------------------------------
  ipp: {
    // [source] Barème revenus 2025 (exercice d'imposition 2026), brochure
    // « Fisc en poche » Xerius 2025 : 25 % jusqu'à 16 320 €, 40 % jusqu'à
    // 28 800 €, 45 % jusqu'à 49 840 €, 50 % au-delà.
    // [incert] Le gouvernement a gelé l'indexation de certains montants
    // jusqu'en 2030 ; le jeu garde ce barème pour toutes les années.
    brackets: [
      { upTo: 1_632_000, rate: 0.25 },
      { upTo: 2_880_000, rate: 0.4 },
      { upTo: 4_984_000, rate: 0.45 },
      { upTo: Infinity, rate: 0.5 },
    ],
    // [source] Quotité exemptée de base estimée à 10 910 € pour l'exercice 2026
    // (estimation Wolters Kluwer, « calculs personnels » de l'auteur) — [incert].
    // Mécanisme : réduction d'impôt égale à l'impôt calculé sur cette quotité
    // (donc au taux de la 1re tranche).
    quotiteExemptee: 1_091_000,
    // [approx] Additionnels communaux : varient de 0 à ~9 % selon la commune ;
    // moyenne retenue ≈ 7 %.
    centimesAdditionnels: 0.07,
  },

  // ---------------------------------------------------------------------------
  // Cotisations sociales de l'indépendant (INASTI / caisses d'assurances sociales)
  // ---------------------------------------------------------------------------
  social: {
    // [source] 2026 : 20,5 % jusqu'à 75 024,54 € de revenu net imposable,
    // 14,16 % de 75 024,54 € à 110 562,42 €, rien au-delà (SalaireClair, UCM).
    rate1: 0.205,
    ceiling1: 7_502_454,
    rate2: 0.1416,
    ceiling2: 11_056_242,
    // [source] Cotisation minimale à titre principal ≈ 890,42 €/trimestre hors
    // frais de gestion (≈ 917 € frais inclus selon MyFid) — [incert].
    minQuarterly: 89_042,
    // [approx] Frais de gestion de la caisse : 3 % à 4,5 % selon la caisse.
    fraisGestion: 0.035,
    // [approx] Le jeu calcule les provisionnelles sur le minimum les 3 premières
    // années (cas du starter), puis sur le revenu de l'année N-1 ; la
    // régularisation sur le revenu réel arrive au 3e trimestre de l'année N+1
    // (dans la réalité : souvent 2 à 3 ans plus tard).
    regularizationMonth: 8, // septembre (0 = janvier)
  },

  // ---------------------------------------------------------------------------
  // ISOC — impôt des sociétés (SRL)
  // ---------------------------------------------------------------------------
  isoc: {
    // [source] Taux normal 25 % ; taux réduit 20 % sur la première tranche de
    // 100 000 € pour les PME qui remplissent les conditions.
    normalRate: 0.25,
    reducedRate: 0.2,
    reducedBracket: 10_000_000,
    // [incert] Condition de rémunération du dirigeant : au moins 45 000 €
    // (ou le bénéfice imposable s'il est plus bas). L'accord budgétaire de
    // novembre 2025 relève ce seuil à 50 000 € (loi pas encore votée selon BNP
    // Paribas Fortis ; MyFid l'indique déjà applicable). Le jeu utilise 50 000 €.
    minDirectorPay: 5_000_000,
    // [source] Les nouvelles sociétés bénéficient du taux réduit pendant
    // leurs 4 premiers exercices même sans la condition de rémunération ?
    // [incert] (Accountable) — non modélisé : la condition s'applique toujours.
  },

  // ---------------------------------------------------------------------------
  // Dirigeant d'entreprise (SRL)
  // ---------------------------------------------------------------------------
  dirigeant: {
    // [source] Frais forfaitaires : 3 % des revenus nets, plafond 3 200 €
    // (revenus 2026, billy.tech) — [incert].
    fraisForfaitairesRate: 0.03,
    fraisForfaitairesMax: 320_000,
  },

  // ---------------------------------------------------------------------------
  // Dividendes et revenus mobiliers
  // ---------------------------------------------------------------------------
  dividendes: {
    // [source] Précompte mobilier 30 % (taux standard).
    precompte: 0.3,
    // [source] VVPR-bis : 20 % pour les dividendes du 2e exercice, 15 % à partir
    // du 3e (sous conditions d'apport en capital). [incert] passage à 18 %
    // annoncé à partir du 1/7/2026 (source unique, non confirmée).
    vvprbisYear2: 0.2,
    vvprbisYear3: 0.15,
    // [source] Exonération des dividendes d'actions : 833 € par an (revenus
    // 2025 et 2026), récupérable via la déclaration (max 249,90 €).
    exemption: 83_300,
  },

  // ---------------------------------------------------------------------------
  // Employeur
  // ---------------------------------------------------------------------------
  employeur: {
    // [source] Cotisations patronales de base ≈ 25 % du brut (secteur marchand).
    onssRate: 0.25,
    // [approx] Autres charges : pécule de vacances, prime de fin d'année,
    // assurance accidents du travail, médecine du travail, secrétariat social.
    autresCharges: 0.1,
    // [source] RMMMG (revenu minimum mensuel moyen garanti) au 1/4/2026 :
    // 2 189,81 € brut/mois (temps plein, 18 ans et plus).
    rmmmg: 218_981,
    // [source] Réduction « premiers engagements » à partir du 1/7/2026 :
    // 1er travailleur 2 000 €/trimestre (durée illimitée), 2e à 5e : 1 000 €/trim.
    // pendant 12 trimestres (Leforem, Partena).
    firstHireReduction: 200_000,
    nextHiresReduction: 100_000,
    nextHiresQuarters: 12,
    nextHiresMax: 5,
    // [source] Préavis (loi du 3/7/1978, art. 37/2, statut unique) — barème en
    // semaines selon l'ancienneté. [incert] barème reconstitué, à vérifier sur
    // emploi.belgique.be ; plafond de 52 semaines pour les contrats débutant
    // après le 1/6/2026.
    // [moisMinimum, semaines]
    noticeWeeks: [
      [0, 1], [3, 3], [4, 4], [5, 5], [6, 6], [9, 7], [12, 8], [15, 9], [18, 10], [21, 11],
      [24, 12], [36, 13], [48, 15], [60, 18], [72, 21], [84, 24], [96, 27], [108, 30], [120, 33],
    ],
    noticeMaxWeeks: 52,
  },

  // ---------------------------------------------------------------------------
  // Placements
  // ---------------------------------------------------------------------------
  epargne: {
    // [source] Compte d'épargne réglementé : intérêts exonérés jusqu'à 1 020 €
    // par personne (plafond gelé pour 2026), 15 % au-delà (Wikifin, Test-Achats).
    exemptInterest: 102_000,
    taxRate: 0.15,
  },
  tob: {
    // [source] Taxe sur les opérations de bourse : ETF enregistré dans l'EEE
    // (hors Belgique) 0,12 % (max 1 300 €/opération), actions 0,35 %
    // (max 1 600 €/opération). [incert] plafonds de 2018, fonds belges
    // capitalisants à 1,32 %.
    etf: { rate: 0.0012, max: 130_000 },
    actions: { rate: 0.0035, max: 160_000 },
  },
  plusValues: {
    // [source] Taxe sur les plus-values des actifs financiers : 10 % sur les
    // plus-values réalisées depuis le 1/1/2026, exonération de 10 000 €/an
    // (indexée ; report possible de 1 000 €/an non modélisé). Loi adoptée le
    // 3/4/2026, MB 21/4/2026 (Test-Achats, Jubel).
    rate: 0.1,
    exemption: 1_000_000,
  },
  tact: {
    // [source] Taxe annuelle sur les comptes-titres : 0,15 % si la valeur
    // moyenne dépasse 1 000 000 € (plafonnée à 10 % de l'excédent).
    rate: 0.0015,
    threshold: 100_000_000,
  },
  immobilier: {
    // [source] Droits d'enregistrement pour un bien qui n'est pas l'habitation
    // propre : 12,5 % en Wallonie et à Bruxelles, 12 % en Flandre. Le jeu prend 12,5 %.
    droitsEnregistrement: 0.125,
    // [approx] Notaire et frais divers ≈ 2 % du prix.
    fraisNotaire: 0.02,
    // [approx] Précompte immobilier ≈ 1 mois de loyer par an (dépend du revenu
    // cadastral et de la commune).
    precompteMoisLoyer: 1,
    // [approx] IPP sur les loyers d'un particulier : basé sur le revenu
    // cadastral indexé majoré de 40 %, pas sur le loyer réel ; approximé ici à
    // 8 % du loyer brut.
    ippSurLoyer: 0.08,
  },

  // ---------------------------------------------------------------------------
  // Création et frais administratifs
  // ---------------------------------------------------------------------------
  creation: {
    // [approx] Inscription BCE via un guichet d'entreprises ≈ 110 € (montant indexé).
    independant: 11_000,
    // [approx] Constitution d'une SRL : notaire + publication + plan financier
    // ≈ 1 500 € (aucun capital minimum depuis le CSA 2019, mais des capitaux
    // propres « suffisants » sont exigés).
    srl: 150_000,
  },
  // [approx] Honoraires de comptable mensuels moyens (marché, très variables).
  comptable: { independant: 9_000, srl: 22_500 },
};

/** Liste des simplifications affichées dans l'encart « simplifié » du jeu. */
const SIMPLIFICATIONS = [
  'Calendrier de 12 mois de 30 jours ; impôt annuel (IPP/ISOC) exigible le 30 juin de l’année suivante.',
  'Pas de versements anticipés ni de majoration pour absence de versements anticipés.',
  'Cotisations sociales provisoires calculées sur le minimum les 3 premières années, régularisées en septembre de l’année suivante.',
  'Bénéfice de l’indépendant = recettes − charges réelles − amortissements − cotisations sociales (pas de frais forfaitaires).',
  'Les améliorations sont amorties sur 3 ans de façon linéaire.',
  'Coût employeur = brut × 1,35 (ONSS patronal ≈ 25 % + autres charges ≈ 10 %).',
  'Précompte professionnel du dirigeant estimé chaque mois puis régularisé à la fin de l’année.',
  'TVA soutien scolaire à 21 % (exemption possible selon les cas).',
  'Fiscalité immobilière approximée (précompte ≈ 1 mois de loyer, IPP ≈ 8 % du loyer).',
  'Taxe sur les plus-values : 10 % au-delà de 10 000 €/an, sans report d’exonération.',
  'Barèmes 2026 appliqués à toutes les années de jeu (pas d’indexation).',
];
return __exports;
})();

// ---- src/data/sectors/agence.js ----
__m["src/data/sectors/agence.js"] = (function () {
const __exports = {};
__def(__exports, { "AGENCE": () => AGENCE });
// Secteur 1 — Agence web / freelance digital. Montants en centimes.
//
// Mécanique : on vend des HEURES. Les demandes de projets arrivent, le joueur
// fixe son taux horaire, accepte ou refuse ; la capacité (heures/jour) est le
// goulet. Récurrent possible : maintenance, puis SaaS.

const AGENCE = {
  id: 'agence',
  label: 'Agence web',
  icon: 'laptop',
  tagline: 'Sites, e-shops et applis pour les PME belges.',
  description:
    'Tu vends ton temps : chaque projet consomme des heures. Fixe ton taux horaire, choisis tes clients, recrute des développeurs, puis construis du récurrent (maintenance, SaaS) pour ne plus dépendre de tes heures.',
  vatRate: 0.21,
  b2c: false,
  startCostExtra: 150_000, // ordinateur, logiciels, site perso (investissement de départ)

  // Prix
  refRate: 6_500, // taux horaire de référence du marché : 65 €/h HT
  minRate: 2_500,
  maxRate: 20_000,
  elasticity: 1.25,

  // Demande : demandes de projets par jour ouvré pour tout le marché local.
  marketLeads: 1.15,
  seasonality: [1.1, 1.05, 1.05, 1, 1, 0.95, 0.7, 0.55, 1.15, 1.1, 1.05, 0.8],
  leadExpiryDays: 6,
  marketingRef: 50_000, // 500 €/mois = budget marketing « de référence »

  // Capacité
  founderHours: 6, // heures facturables par jour ouvré
  homeSeats: 2, // places de travail sans bureau (fondateur + 1 à distance)

  // Paiement
  paymentDays: 30,
  defaultProb: 0.045, // probabilité d'impayé par facture
  lateProb: 0.2, // probabilité de retard de paiement (15-45 j)

  projectTypes: [
    { id: 'audit', label: 'Audit SEO', hours: [12, 24], budget: 0.95, weight: 3, deadline: 15 },
    { id: 'vitrine', label: 'Site vitrine', hours: [30, 60], budget: 1, weight: 5, deadline: 30 },
    { id: 'identite', label: 'Identité visuelle + site', hours: [50, 90], budget: 1.05, weight: 2, deadline: 40 },
    { id: 'refonte', label: 'Refonte de site', hours: [40, 80], budget: 1, weight: 3, deadline: 40 },
    { id: 'eshop', label: 'Boutique en ligne', hours: [90, 160], budget: 1.1, weight: 3, deadline: 60 },
    { id: 'appweb', label: 'Application web sur mesure', hours: [200, 400], budget: 1.2, weight: 1, deadline: 120, minRep: 40 },
  ],
  clientNames: [
    'Boulangerie Lemaire', 'Garage Peeters', 'Cabinet Dr Maes', 'Asbl Les Coccinelles', 'Brasserie du Coin',
    'Immo Wavre', 'Fleuriste Rosalie', 'Commune de Ciney', 'Avocats Dubois & Lambert', 'Club de tennis de Uccle',
    'Chocolaterie Mertens', 'Kiné Santé Liège', 'Startup Gantoise', 'Hôtel des Ardennes', 'Librairie Pages',
    'Salon Coiff’Hair', 'PME Logistique Anvers', 'Vignoble du Hainaut', 'École de musique Do Ré', 'Cave à bières Houblon',
  ],

  // Récurrent
  maintenance: { signProb: 0.32, fee: [6_000, 20_000], hoursPerMonth: 1.5, churnMonthly: 0.025 },
  saas: {
    devHours: 600,
    defaultPrice: 2_900, // 29 €/mois HT
    minPrice: 900,
    maxPrice: 15_000,
    baseNewPerDay: 0.25,
    churnMonthly: 0.04,
    serverCostPerSub: 150,
    serverCostBase: 5_000,
    supportHoursPerSub: 0.08,
    potential: 2_500,
    elasticity: 1.5,
  },

  roles: {
    developpeur: {
      id: 'developpeur', label: 'Développeur·se', baseSalary: 330_000, skillRange: [30, 85],
      hours: 6.5, desc: 'Produit des heures facturables.',
    },
    designer: {
      id: 'designer', label: 'Designer UX/UI', baseSalary: 300_000, skillRange: [30, 85],
      hours: 5.5, quality: 0.05, desc: 'Produit des heures et améliore la qualité (max 3 comptent).',
    },
    commercial: {
      id: 'commercial', label: 'Commercial·e', baseSalary: 310_000, skillRange: [30, 85],
      leads: 0.28, desc: 'Ramène des demandes de projets (+28 % chacun, rendements décroissants).',
    },
    chef_projet: {
      id: 'chef_projet', label: 'Chef·fe de projet', baseSalary: 390_000, skillRange: [40, 90], max: 2,
      overrun: 0.7, prod: 0.06, desc: 'Réduit les dépassements d’heures et organise l’équipe (+6 % de productivité).',
    },
  },

  fixedCosts: [
    { id: 'logiciels', label: 'Logiciels & outils', amount: 4_500, perHead: 1_500, vat: 0.21, cat: 'logiciels' },
    { id: 'telecom', label: 'Internet & téléphone', amount: 6_000, vat: 0.21, cat: 'logiciels' },
    { id: 'hebergement', label: 'Hébergement', amount: 2_500, vat: 0.21, cat: 'logiciels' },
    { id: 'assurance', label: 'Assurance RC professionnelle', amount: 4_000, vat: 0, cat: 'assurances' },
  ],

  upgrades: [
    // Locaux
    { id: 'coworking', cat: 'locaux', label: 'Espace de coworking', cost: 50_000, rent: 35_000, effects: { seats: 4, leadsMult: 1.03 },
      desc: '5 places de travail, une adresse pro. Loyer 350 €/mois.' },
    { id: 'bureau', cat: 'locaux', label: 'Bureau en centre-ville', cost: 800_000, rent: 150_000, requires: ['coworking'], effects: { seats: 8, leadsMult: 1.1, quality: 0.03 },
      desc: '12 places, salle de réunion pour les clients. Loyer 1 500 €/mois.' },
    { id: 'plateau', cat: 'locaux', label: 'Grand plateau', cost: 2_500_000, rent: 350_000, requires: ['bureau'], effects: { seats: 18, leadsMult: 1.1, motivation: 4 },
      desc: '30 places, cuisine, terrasse. Loyer 3 500 €/mois.' },
    // Matériel
    { id: 'laptops', cat: 'materiel', label: 'Ordinateurs performants', cost: 350_000, effects: { prodMult: 1.08 },
      desc: '+8 % de productivité pour toute l’équipe.' },
    { id: 'suite_creative', cat: 'materiel', label: 'Suite créative', cost: 120_000, monthly: 6_000, effects: { quality: 0.07 },
      desc: 'Qualité +7 %. Abonnement 60 €/mois.' },
    { id: 'cloud', cat: 'materiel', label: 'Infrastructure cloud', cost: 250_000, monthly: 12_000, effects: { maintChurnMult: 0.7 },
      desc: 'Hébergement fiable : moins de résiliations de maintenance. Requis pour le SaaS.' },
    // Process
    { id: 'acompte', cat: 'process', label: 'Acompte de 30 % à la signature', cost: 30_000, effects: { defaultMult: 0.4, deposit: 0.3 },
      desc: 'Moins d’impayés et du cash dès la signature.' },
    { id: 'agile', cat: 'process', label: 'Méthode agile & outil de suivi', cost: 150_000, monthly: 4_000, effects: { overrunMult: 0.6 },
      desc: 'Les dépassements d’heures diminuent fortement.' },
    { id: 'offre_maintenance', cat: 'process', label: 'Offre de maintenance', cost: 80_000, effects: { unlockMaintenance: 1 },
      desc: 'Propose un contrat mensuel après chaque projet : du revenu récurrent.' },
    { id: 'tests_auto', cat: 'process', label: 'Tests automatisés & revue de code', cost: 250_000, requires: ['agile'], effects: { quality: 0.08, overrunMult: 0.85 },
      desc: 'Qualité +8 %, encore moins de dépassements.' },
    // Marque
    { id: 'portfolio', cat: 'marque', label: 'Portfolio en ligne soigné', cost: 120_000, effects: { leadsMult: 1.12, repTarget: 4 },
      desc: 'Plus de demandes, meilleure image.' },
    { id: 'seo_agence', cat: 'marque', label: 'Référencement de l’agence', cost: 250_000, requires: ['portfolio'], effects: { leadsMult: 1.2 },
      desc: '+20 % de demandes de projets.' },
    { id: 'grands_comptes', cat: 'marque', label: 'Références grands comptes', cost: 600_000, requires: ['seo_agence'], minRep: 50, effects: { budgetMult: 1.1, bigProjects: 1 },
      desc: 'Clients prêts à payer +10 %, plus de gros projets.' },
    // Automatisation
    { id: 'composants', cat: 'automatisation', label: 'Bibliothèque de composants', cost: 300_000, effects: { prodMult: 1.12 },
      desc: 'Réutiliser son code : +12 % de productivité.' },
    { id: 'ia_dev', cat: 'automatisation', label: 'Assistants IA de développement', cost: 400_000, monthly: 10_000, requires: ['composants'], effects: { prodMult: 1.15 },
      desc: '+15 % de productivité. Abonnement 100 €/mois.' },
    { id: 'saas', cat: 'automatisation', label: 'Développer un SaaS', cost: 500_000, requires: ['cloud', 'agile'], effects: { unlockSaas: 1 },
      desc: 'Lance un projet interne de 600 h. Une fois en ligne, des abonnés paient chaque mois.' },
    { id: 'saas_growth', cat: 'automatisation', label: 'Moteur de croissance SaaS', cost: 800_000, requires: ['saas'], requiresFlag: 'saasLive', effects: { saasGrowthMult: 1.7 },
      desc: 'Onboarding, parrainage, contenu : +70 % de nouveaux abonnés.' },
  ],
};
return __exports;
})();

// ---- src/engine/sectors/registry.js ----
__m["src/engine/sectors/registry.js"] = (function () {
const __exports = {};
__def(__exports, { "SECTOR_DATA": () => SECTOR_DATA, "sectorData": () => sectorData });
// Registre des DONNÉES de secteur (sans logique, pour éviter les dépendances circulaires).

const { AGENCE } = __m["src/data/sectors/agence.js"];

const SECTOR_DATA = {
  agence: AGENCE,
};

function sectorData(state) {
  const d = SECTOR_DATA[state.meta.sector];
  if (!d) throw new Error(`Secteur inconnu : ${state.meta.sector}`);
  return d;
}
return __exports;
})();

// ---- src/engine/ledger.js ----
__m["src/engine/ledger.js"] = (function () {
const __exports = {};
__def(__exports, { "initLedger": () => initLedger, "resetMonth": () => resetMonth, "resetYear": () => resetYear, "earn": () => earn, "invoice": () => invoice, "processReceivables": () => processReceivables, "spend": () => spend, "pay": () => pay, "receive": () => receive, "amortizationForYear": () => amortizationForYear, "bookValue": () => bookValue, "receivablesTotal": () => receivablesTotal, "personalIn": () => personalIn, "personalOut": () => personalOut });
// Registre comptable : TOUT mouvement d'argent passe par ces fonctions.
// Elles tiennent à jour la trésorerie, la TVA du trimestre, le compte de
// résultat du mois et de l'année (base imposable) et les flux par catégorie
// (utilisés par le post-mortem).

const { mul } = __m["src/engine/money.js"];
const { ECONOMY } = __m["src/data/economy.js"];
const { dateOf } = __m["src/engine/calendar.js"];

/** Catégories qui ne sont PAS des charges déductibles (flux financiers ou impôts). */
const NON_EXPENSE = new Set([
  'tva', 'impot', 'cotisations', 'precompte', 'remboursement', 'prelevement', 'dividende', 'investissement',
]);

function initLedger(state) {
  state.finance = {
    month: emptyPeriod(),
    year: emptyPeriod(),
    totals: { revenue: 0, expenses: 0 },
    vat: { collected: 0, deductible: 0 },
    vatYearTurnover: 0, // CA de l'année civile (franchise TVA)
    receivables: [],
    receivableSeq: 0,
    assets: [], // investissements amortissables
    history: [], // instantanés mensuels
    dailyCash: [],
    overdraftLimit: ECONOMY.overdraftStart,
    overdraftRate: ECONOMY.overdraftRate,
    franchise: false,
  };
}

function emptyPeriod() {
  return { revenue: 0, expenses: 0, byCat: {}, revByCat: {}, outflow: 0, inflow: 0 };
}

function resetMonth(state) {
  state.finance.month = emptyPeriod();
}
function resetYear(state) {
  state.finance.year = emptyPeriod();
}

function addCat(obj, cat, amount) {
  obj[cat] = (obj[cat] || 0) + amount;
}

function recordRevenue(state, ht, cat) {
  const f = state.finance;
  f.month.revenue += ht;
  f.year.revenue += ht;
  f.totals.revenue += ht;
  addCat(f.month.revByCat, cat, ht);
  addCat(f.year.revByCat, cat, ht);
  f.vatYearTurnover += ht;
}

function recordExpense(state, amount, cat) {
  const f = state.finance;
  if (NON_EXPENSE.has(cat)) return;
  f.month.expenses += amount;
  f.year.expenses += amount;
  f.totals.expenses += amount;
}

function recordOut(state, amount, cat) {
  const f = state.finance;
  f.month.outflow += amount;
  addCat(f.month.byCat, cat, amount);
  addCat(f.year.byCat, cat, amount);
}

function vatFor(state, ht, rate) {
  return state.finance.franchise ? 0 : mul(ht, rate);
}

/** Vente encaissée immédiatement. Retourne le montant TTC encaissé. */
function earn(state, ht, vatRate, cat) {
  if (ht <= 0) return 0;
  const vat = vatFor(state, ht, vatRate);
  state.cash += ht + vat;
  state.finance.vat.collected += vat;
  state.finance.month.inflow += ht + vat;
  recordRevenue(state, ht, cat);
  return ht + vat;
}

/**
 * Facture à payer plus tard (créance). Le chiffre d'affaires et la TVA sont
 * dus dès la facturation (règle belge) : la TVA peut donc être due avant
 * l'encaissement !
 */
function invoice(state, ht, vatRate, cat, { dueIn = 30, defaultProb = 0, lateProb = 0, label = '', rng = null } = {}) {
  if (ht <= 0) return null;
  const vat = vatFor(state, ht, vatRate);
  state.finance.vat.collected += vat;
  recordRevenue(state, ht, cat);
  let due = state.time.day + dueIn;
  let willDefault = false;
  if (rng) {
    if (rng.chance(lateProb)) due += rng.int(15, 45);
    willDefault = rng.chance(defaultProb);
  }
  const r = {
    id: ++state.finance.receivableSeq,
    ht,
    vat,
    amount: ht + vat,
    due,
    cat,
    label,
    willDefault,
  };
  state.finance.receivables.push(r);
  return r;
}

/** Encaisse les créances arrivées à échéance (appelé chaque jour). */
function processReceivables(state, onDefault) {
  const f = state.finance;
  const today = state.time.day;
  const keep = [];
  for (const r of f.receivables) {
    if (r.due > today) {
      keep.push(r);
      continue;
    }
    if (r.willDefault) {
      // Impayé : la TVA est récupérée (note de crédit), le HT devient une perte.
      f.vat.collected -= r.vat;
      recordExpense(state, r.ht, 'creances');
      addCat(f.month.byCat, 'creances', r.ht);
      state.stats.badDebts = (state.stats.badDebts || 0) + r.ht;
      if (onDefault) onDefault(r);
    } else {
      state.cash += r.amount;
      f.month.inflow += r.amount;
    }
  }
  f.receivables = keep;
}

/**
 * Achat avec TVA. opts.capex = investissement amorti (pas une charge immédiate).
 * En franchise TVA, la TVA n'est pas déductible : elle devient une charge.
 */
function spend(state, ht, vatRate, cat, opts = {}) {
  if (ht <= 0) return 0;
  const vat = mul(ht, vatRate);
  const total = ht + vat;
  state.cash -= total;
  const deductibleVat = state.finance.franchise ? 0 : vat;
  state.finance.vat.deductible += deductibleVat;
  const cost = ht + (vat - deductibleVat);
  if (opts.capex) {
    const d = dateOf(state.time.day);
    state.finance.assets.push({ label: opts.label || cat, cost, yearIdx: d.yearIdx, years: ECONOMY.amortizationYears });
    recordOut(state, total, 'investissement');
  } else {
    recordExpense(state, cost, cat);
    recordOut(state, total, cat);
  }
  return total;
}

/** Paiement sans TVA (salaires, impôts, remboursements, assurances…). */
function pay(state, amount, cat) {
  if (amount <= 0) return 0;
  state.cash -= amount;
  recordExpense(state, amount, cat);
  recordOut(state, amount, cat);
  return amount;
}

/** Entrée d'argent qui n'est pas un chiffre d'affaires (prêt, apport, subvention). */
function receive(state, amount, cat, { taxable = false } = {}) {
  if (amount <= 0) return 0;
  state.cash += amount;
  state.finance.month.inflow += amount;
  if (taxable) {
    state.finance.month.revenue += amount;
    state.finance.year.revenue += amount;
    addCat(state.finance.month.revByCat, cat, amount);
    addCat(state.finance.year.revByCat, cat, amount);
  }
  return amount;
}

/** Amortissement de l'année (fraction du coût des investissements). */
function amortizationForYear(state, yearIdx) {
  let total = 0;
  for (const a of state.finance.assets) {
    if (yearIdx >= a.yearIdx && yearIdx < a.yearIdx + a.years) total += Math.round(a.cost / a.years);
  }
  return total;
}

/** Valeur nette comptable des investissements (pour le patrimoine). */
function bookValue(state) {
  const y = dateOf(state.time.day).yearIdx;
  let v = 0;
  for (const a of state.finance.assets) {
    const used = Math.max(0, y - a.yearIdx);
    v += Math.max(0, Math.round(a.cost * (1 - used / a.years)));
  }
  return v;
}

/** Total des créances en attente. */
function receivablesTotal(state) {
  let s = 0;
  for (const r of state.finance.receivables) s += r.amount;
  return s;
}

// --- Compte personnel du dirigeant ---------------------------------------

function personalIn(state, amount, cat) {
  if (amount <= 0) return;
  state.personal.cash += amount;
  addCat(state.personal.month, cat, amount);
}

function personalOut(state, amount, cat) {
  if (amount <= 0) return;
  state.personal.cash -= amount;
  addCat(state.personal.month, cat, -amount);
}
return __exports;
})();

// ---- src/engine/log.js ----
__m["src/engine/log.js"] = (function () {
const __exports = {};
__def(__exports, { "log": () => log });
// Journal d'événements lisible par le joueur (stocké dans l'état, borné).
// Chaque entrée a un identifiant croissant : l'interface affiche en
// notification les entrées `toast` qu'elle n'a pas encore vues, sans jamais
// modifier l'état.

const { CONFIG } = __m["src/data/config.js"];

/**
 * Ajoute une entrée au journal.
 * kind : 'info' | 'good' | 'bad' | 'tax' | 'event' | 'staff' | 'market' | 'invest'
 */
function log(state, kind, text, toast = false) {
  state.logSeq = (state.logSeq || 0) + 1;
  state.log.push({ id: state.logSeq, day: state.time.day, kind, text, toast });
  if (state.log.length > CONFIG.logSize) state.log.splice(0, state.log.length - CONFIG.logSize);
}
return __exports;
})();

// ---- src/engine/upgrades.js ----
__m["src/engine/upgrades.js"] = (function () {
const __exports = {};
__def(__exports, { "initUpgrades": () => initUpgrades, "hasUpgrade": () => hasUpgrade, "upgradeList": () => upgradeList, "upgradeEffect": () => upgradeEffect, "canBuyUpgrade": () => canBuyUpgrade, "buyUpgrade": () => buyUpgrade, "payUpgradeMonthly": () => payUpgradeMonthly, "monthlyUpgradeCosts": () => monthlyUpgradeCosts });
// Améliorations (arbre de progression par secteur).
// Effets : une clé se terminant par « Mult » se multiplie, les autres s'additionnent.

const { sectorData } = __m["src/engine/sectors/registry.js"];
const { spend } = __m["src/engine/ledger.js"];
const { log } = __m["src/engine/log.js"];

function initUpgrades(state) {
  state.upgrades = { owned: [] };
}

function hasUpgrade(state, id) {
  return state.upgrades.owned.includes(id);
}

function upgradeList(state) {
  return sectorData(state).upgrades;
}

/** Valeur agrégée d'un effet sur toutes les améliorations possédées. */
function upgradeEffect(state, key) {
  const isMult = key.endsWith('Mult');
  let v = isMult ? 1 : 0;
  for (const u of sectorData(state).upgrades) {
    if (!state.upgrades.owned.includes(u.id) || !u.effects || u.effects[key] === undefined) continue;
    v = isMult ? v * u.effects[key] : v + u.effects[key];
  }
  return v;
}

/** Peut-on acheter cette amélioration ? Retourne { ok, reason }. */
function canBuyUpgrade(state, id) {
  const u = upgradeList(state).find((x) => x.id === id);
  if (!u) return { ok: false, reason: 'Amélioration inconnue.' };
  if (hasUpgrade(state, id)) return { ok: false, reason: 'Déjà acquise.' };
  for (const r of u.requires || []) {
    if (!hasUpgrade(state, r)) {
      const req = upgradeList(state).find((x) => x.id === r);
      return { ok: false, reason: `Nécessite : ${req ? req.label : r}.` };
    }
  }
  if (u.requiresFlag && !state.flags[u.requiresFlag]) return { ok: false, reason: 'Pas encore disponible.' };
  if (u.minRep && state.company.reputation < u.minRep) return { ok: false, reason: `Réputation ${u.minRep} requise.` };
  const total = Math.round(u.cost * 1.21);
  if (state.cash - total < -state.finance.overdraftLimit) return { ok: false, reason: 'Trésorerie insuffisante.' };
  return { ok: true, total };
}

function buyUpgrade(state, id) {
  const c = canBuyUpgrade(state, id);
  if (!c.ok) return c;
  const u = upgradeList(state).find((x) => x.id === id);
  spend(state, u.cost, 0.21, 'investissement', { capex: true, label: u.label });
  state.upgrades.owned.push(id);
  state.stats.upgradesBought = (state.stats.upgradesBought || 0) + 1;
  log(state, 'good', `Amélioration acquise : ${u.label}.`);
  return { ok: true, upgrade: u };
}

/** Loyers et abonnements mensuels liés aux améliorations (payés en fin de mois). */
function payUpgradeMonthly(state) {
  for (const u of sectorData(state).upgrades) {
    if (!hasUpgrade(state, u.id)) continue;
    if (u.rent) spend(state, u.rent, 0, 'loyer'); // loyer pro : en principe sans TVA
    if (u.monthly) spend(state, u.monthly, 0.21, 'logiciels');
  }
}

function monthlyUpgradeCosts(state) {
  let s = 0;
  for (const u of sectorData(state).upgrades) {
    if (!hasUpgrade(state, u.id)) continue;
    s += (u.rent || 0) + Math.round((u.monthly || 0) * 1.21);
  }
  return s;
}
return __exports;
})();

// ---- src/engine/systems/company.js ----
__m["src/engine/systems/company.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "daily": () => daily, "rateCustomer": () => rateCustomer, "changeReputation": () => changeReputation, "monthlyFixedCosts": () => monthlyFixedCosts, "monthEnd": () => monthEnd });
// Entreprise : création, réputation, satisfaction, marketing, charges fixes.

const { ECONOMY } = __m["src/data/economy.js"];
const { FISCALITE } = __m["src/data/fiscalite.js"];
const { sectorData } = __m["src/engine/sectors/registry.js"];
const { spend, receive, initLedger } = __m["src/engine/ledger.js"];
const { initUpgrades, payUpgradeMonthly, upgradeEffect } = __m["src/engine/upgrades.js"];
const { expireModifiers, modAdd } = __m["src/engine/modifiers.js"];
const { clamp } = __m["src/engine/money.js"];

function init(state, opts, diff) {
  const sd = sectorData(state);
  initLedger(state);
  initUpgrades(state);
  state.company = {
    reputation: ECONOMY.startReputation,
    satisfaction: ECONOMY.startSatisfaction,
    quality: 1,
    marketing: 0, // budget mensuel (centimes HT)
    why: [],
    bottleneck: null,
    capacityUse: 0,
    share: 0,
    attraction: 0,
  };
  state.passiveTarget = diff.passiveTarget;
  const capital = diff.startingCapital;
  const apport = Math.round(capital * clamp(opts.apportPct, 0, 1));
  state.personal = {
    cash: capital - apport,
    livingCost: ECONOMY.livingCost,
    draw: ECONOMY.defaultDraw, // prélèvement (indépendant) ou rémunération brute (SRL)
    month: {},
    history: [],
  };
  receive(state, apport, 'apport');
  state.stats.apports = apport;
  // Frais de création et équipement de départ
  const creation = FISCALITE.creation[state.meta.legal] || 0;
  spend(state, creation, state.meta.legal === 'srl' ? 0.21 : 0, 'autres');
  if (sd.startCostExtra) spend(state, sd.startCostExtra, 0.21, 'investissement', { capex: true, label: 'Équipement de départ' });
  state.finance.franchise = !!opts.vatFranchise;
  state.stats.startCapital = capital;
}

/** Budget marketing dépensé chaque jour (1/30 du budget mensuel). */
function dailyMarketing(state) {
  const m = state.company.marketing;
  if (m > 0) spend(state, Math.round(m / 30), 0.21, 'marketing');
}

function daily(state) {
  expireModifiers(state);
  dailyMarketing(state);
  const c = state.company;
  // La réputation converge lentement vers la satisfaction (+ bonus de marque).
  const target = clamp(c.satisfaction + upgradeEffect(state, 'repTarget') + modAdd(state, 'repTarget'), 0, 100);
  c.reputation = clamp(c.reputation + (target - c.reputation) * ECONOMY.reputationInertia, 0, 100);
  // La satisfaction revient doucement vers 60 sans nouvelles interactions.
  c.satisfaction = clamp(c.satisfaction + (60 - c.satisfaction) * 0.002, 0, 100);
}

/** Ajuste la satisfaction vers une note client (0-100). weight = poids de l'avis. */
function rateCustomer(state, score, weight = 0.05) {
  const c = state.company;
  c.satisfaction = clamp(c.satisfaction + (score - c.satisfaction) * weight, 0, 100);
}

function changeReputation(state, delta) {
  state.company.reputation = clamp(state.company.reputation + delta, 0, 100);
}

/** Charges fixes mensuelles du secteur + comptable + énergie + améliorations. */
function monthlyFixedCosts(state) {
  const sd = sectorData(state);
  const heads = state.staff.employees.length + 1;
  const list = [];
  for (const f of sd.fixedCosts) {
    list.push({ label: f.label, amount: f.amount + (f.perHead || 0) * heads, vat: f.vat, cat: f.cat });
  }
  list.push({ label: 'Comptable', amount: FISCALITE.comptable[state.meta.legal], vat: 0.21, cat: 'comptable' });
  return list;
}

function monthEnd(state) {
  for (const f of monthlyFixedCosts(state)) spend(state, f.amount, f.vat, f.cat);
  payUpgradeMonthly(state);
}
return __exports;
})();

// ---- src/engine/demand.js ----
__m["src/engine/demand.js"] = (function () {
const __exports = {};
__def(__exports, { "priceFactor": () => priceFactor, "qualityFactor": () => qualityFactor, "reputationFactor": () => reputationFactor, "marketingFactor": () => marketingFactor, "attractiveness": () => attractiveness, "competitorAttraction": () => competitorAttraction, "playerShare": () => playerShare });
// Modèle de demande commun : attractivité et part de marché.
// Voir docs/DESIGN.md § 4.1.

const { ECONOMY } = __m["src/data/economy.js"];

/** Facteur prix : (prixRéf / prix) ^ élasticité, borné pour éviter les extrêmes. */
function priceFactor(price, refPrice, elasticity) {
  if (price <= 0) return 3;
  const f = Math.pow(refPrice / price, elasticity);
  return Math.max(0.02, Math.min(3, f));
}

function qualityFactor(q) {
  return Math.pow(Math.max(0.1, q), 0.8);
}

function reputationFactor(rep) {
  return 0.5 + Math.max(0, Math.min(100, rep)) / 100;
}

/** Rendements décroissants : 1 + k × ln(1 + budget / référence). */
function marketingFactor(monthlyBudget, ref) {
  return 1 + ECONOMY.marketingK * Math.log(1 + Math.max(0, monthlyBudget) / Math.max(1, ref));
}

/**
 * Attractivité d'un acteur.
 * @returns {{value:number, parts:object}} parts = facteurs pour le « pourquoi ? »
 */
function attractiveness({ price, refPrice, elasticity, quality, reputation, marketing, marketingRef, extra = 1 }) {
  const parts = {
    prix: priceFactor(price, refPrice, elasticity),
    qualite: qualityFactor(quality),
    reputation: reputationFactor(reputation),
    marketing: marketingFactor(marketing, marketingRef),
    autres: extra,
  };
  return { value: parts.prix * parts.qualite * parts.reputation * parts.marketing * parts.autres, parts };
}

/** Somme de l'attractivité des concurrents vivants (ou valeur par défaut). */
function competitorAttraction(state) {
  const list = state.competitors || [];
  if (!list.length) return ECONOMY.defaultCompetitorAttraction;
  let s = 0;
  for (const c of list) if (c.alive) s += c.attraction || 0;
  return s;
}

/** Part du joueur = A / (A + Σ concurrents + hors marché). */
function playerShare(state, playerA) {
  const comp = competitorAttraction(state);
  const total = playerA + comp + ECONOMY.outsideOption;
  return total > 0 ? playerA / total : 0;
}
return __exports;
})();

// ---- src/data/people.js ----
__m["src/data/people.js"] = (function () {
const __exports = {};
__def(__exports, { "FIRST_NAMES": () => FIRST_NAMES, "LAST_NAMES": () => LAST_NAMES, "TRAITS": () => TRAITS, "COMMON_ROLES": () => COMMON_ROLES, "COMPETITOR_NAMES": () => COMPETITOR_NAMES });
// Noms, caractères et rôles communs des employés.

const FIRST_NAMES = [
  'Lucas', 'Emma', 'Noah', 'Louise', 'Arthur', 'Olivia', 'Jules', 'Mila', 'Adam', 'Alice',
  'Liam', 'Léa', 'Victor', 'Lina', 'Nathan', 'Juliette', 'Mohamed', 'Inès', 'Thomas', 'Sarah',
  'Wout', 'Lotte', 'Sem', 'Fien', 'Yasmine', 'Elif', 'Mehdi', 'Kevin', 'Laura', 'Julie',
  'Maxime', 'Manon', 'Robin', 'Chloé', 'Hugo', 'Zoé', 'Bram', 'Nina', 'Amir', 'Camille',
  'Sacha', 'Margaux', 'Ibrahim', 'Charlotte', 'Tom', 'Elena', 'Simon', 'Aya', 'Jasper', 'Nour',
];

const LAST_NAMES = [
  'Peeters', 'Janssens', 'Maes', 'Jacobs', 'Dubois', 'Lambert', 'Dupont', 'Martin', 'Claes', 'Goossens',
  'Wouters', 'De Smet', 'Mertens', 'Willems', 'Leclercq', 'Renard', 'Simon', 'Laurent', 'Lejeune', 'Hermans',
  'El Amrani', 'Benali', 'Yilmaz', 'Nowak', 'Dumont', 'Michel', 'François', 'Lemaire', 'Van Damme', 'Declercq',
  'Wauters', 'Pirlot', 'Delvaux', 'Collignon', 'Fontaine', 'Gilson', 'Mahieu', 'Bastin', 'Diallo', 'Rossi',
];

/**
 * Caractères. Multiplicateurs : prod (productivité), quality (qualité),
 * resign (risque de démission), motivation (bonus de motivation cible),
 * learn (gain de formation).
 */
const TRAITS = {
  fiable: { label: 'Fiable', desc: 'Régulier, rarement absent.', prod: 1.03, quality: 1.02, resign: 0.7, motivation: 4, learn: 1 },
  rapide: { label: 'Rapide', desc: 'Abat beaucoup de travail, parfois au détriment de la finition.', prod: 1.15, quality: 0.94, resign: 1, motivation: 0, learn: 1 },
  perfectionniste: { label: 'Perfectionniste', desc: 'Travail impeccable mais plus lent.', prod: 0.9, quality: 1.12, resign: 1, motivation: 0, learn: 1 },
  raleur: { label: 'Râleur', desc: 'Compétent mais plombe l’ambiance.', prod: 1, quality: 1, resign: 1.3, motivation: -8, learn: 1, teamMorale: -3 },
  ambitieux: { label: 'Ambitieux', desc: 'Progresse vite, part si on ne l’augmente pas.', prod: 1.05, quality: 1, resign: 1.6, motivation: -2, learn: 1.6 },
  loyal: { label: 'Loyal', desc: 'Reste dans les moments difficiles.', prod: 1, quality: 1, resign: 0.35, motivation: 6, learn: 0.9 },
  creatif: { label: 'Créatif', desc: 'Idées originales, qualité en hausse.', prod: 0.97, quality: 1.08, resign: 1.1, motivation: 2, learn: 1.1 },
  distrait: { label: 'Distrait', desc: 'Sympathique mais fait des erreurs.', prod: 0.9, quality: 0.93, resign: 0.9, motivation: 3, learn: 0.9 },
};

/** Rôle commun à tous les secteurs. */
const COMMON_ROLES = {
  gerant: {
    id: 'gerant',
    label: 'Gérant·e',
    baseSalary: 450_000,
    skillRange: [45, 90],
    max: 1,
    desc: 'Dirige l’opérationnel. Indispensable pour te retirer et transformer l’entreprise en revenu passif. +5 % de productivité d’équipe.',
  },
};

const COMPETITOR_NAMES = {
  agence: ['PixelForge', 'WebWallonie', 'Studio Atomium', 'CodeBrabant', 'Digitaal & Co', 'Agence Meuse', 'ByteBrussels', 'Nébuleuse Web'],
  restaurant: ['Fritkot Manneken', 'Chez Raymond', 'La Baraque à Frites', 'Snack Atomium', 'Friterie de la Gare', 'Burger Bruxellois', 'Le Cornet d’Or', 'Frituur Sint-Jan'],
  ecommerce: ['BelgaShop', 'Boutik.be', 'Colis & Cie', 'Webwinkel Plus', 'MegaDeal BE', 'Panier Futé', 'ShopLiège', 'Clic & Gaufre'],
  artisan: ['Plomberie Dumont', 'Élec Services', 'Renov’Pro', 'Techni-Habitat', 'Dépann’Express', 'Installateurs Réunis', 'Maes & Fils', 'Chauffage Lemaire'],
  soutien: ['Cap Réussite', 'Blocus Academy', 'Les Profs du Quartier', 'Studia Plus', 'Remédiation & Co', 'Bulle d’Étude', 'Skolar', 'Objectif CEB'],
};
return __exports;
})();

// ---- src/engine/systems/staff.js ----
__m["src/engine/systems/staff.js"] = (function () {
const __exports = {};
__def(__exports, { "EMPLOYER_FACTOR": () => EMPLOYER_FACTOR, "TRAINING_COST": () => TRAINING_COST, "TRAINING_DAYS": () => TRAINING_DAYS, "JOB_AD_COST": () => JOB_AD_COST, "roles": () => roles, "init": () => init, "makeCandidate": () => makeCandidate, "refreshCandidates": () => refreshCandidates, "seatsAvailable": () => seatsAvailable, "marketSalary": () => marketSalary, "employerCost": () => employerCost, "hireReduction": () => hireReduction, "monthlyPayroll": () => monthlyPayroll, "productivity": () => productivity, "qualityOf": () => qualityOf, "countRole": () => countRole, "hasManager": () => hasManager, "teamBonus": () => teamBonus, "hire": () => hire, "noticeWeeksOf": () => noticeWeeksOf, "dismissalCost": () => dismissalCost, "fire": () => fire, "train": () => train, "raise": () => raise, "postJobAd": () => postJobAd, "daily": () => daily, "monthEnd": () => monthEnd });
// Employés : candidats, recrutement, motivation, formation, démission, licenciement.

const { FIRST_NAMES, LAST_NAMES, TRAITS, COMMON_ROLES } = __m["src/data/people.js"];
const { FISCALITE } = __m["src/data/fiscalite.js"];
const { sectorData } = __m["src/engine/sectors/registry.js"];
const { pay, spend } = __m["src/engine/ledger.js"];
const { log } = __m["src/engine/log.js"];
const { clamp, mul } = __m["src/engine/money.js"];
const { modAdd } = __m["src/engine/modifiers.js"];
const { upgradeEffect } = __m["src/engine/upgrades.js"];
const { DAYS_PER_MONTH } = __m["src/engine/calendar.js"];

const EMP = FISCALITE.employeur;
const EMPLOYER_FACTOR = 1 + EMP.onssRate + EMP.autresCharges;

const TRAINING_COST = 90_000; // 900 € HT
const TRAINING_DAYS = 5;
const JOB_AD_COST = 30_000; // 300 € HT

function roles(state) {
  return { ...sectorData(state).roles, ...COMMON_ROLES };
}

function init(state, opts, diff, rng) {
  state.staff = {
    employees: [],
    candidates: [],
    seq: 0,
    hireCount: 0, // rang d'embauche (réductions « premiers engagements »)
    founder: { active: true, skill: 55, energy: 100 },
    lastWorkload: 0,
  };
  refreshCandidates(state, rng, 4);
}

function makeName(rng) {
  return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
}

/** Génère un candidat pour un rôle donné (ou aléatoire). */
function makeCandidate(state, rng, roleId, opts = {}) {
  const all = roles(state);
  const ids = Object.keys(all);
  const role = all[roleId] || all[rng.pick(ids)];
  const [lo, hi] = role.skillRange;
  const skill = clamp(Math.round(opts.skill ?? rng.range(lo, hi)), 1, 100);
  const trait = opts.trait || rng.pick(Object.keys(TRAITS));
  const raw = role.baseSalary * (0.75 + (skill / 100) * 0.55) * rng.range(0.92, 1.1) * (opts.salaryMult || 1);
  const salary = Math.max(EMP.rmmmg, Math.round(raw / 1000) * 1000);
  state.staff.seq += 1;
  return {
    id: state.staff.seq,
    name: opts.name || makeName(rng),
    role: role.id,
    skill,
    trait,
    salary,
    expires: state.time.day + 45,
  };
}

/** Renouvelle le vivier de candidats. */
function refreshCandidates(state, rng, n = 3) {
  const all = roles(state);
  const ids = Object.keys(all);
  const day = state.time.day;
  state.staff.candidates = state.staff.candidates.filter((c) => c.expires > day);
  for (let i = 0; i < n; i++) {
    // Les rôles « max 1 » (gérant) apparaissent moins souvent.
    const id = rng.weighted(ids, (r) => (all[r].max === 1 ? 0.6 : 1.5));
    state.staff.candidates.push(makeCandidate(state, rng, id));
  }
  if (state.staff.candidates.length > 8) state.staff.candidates.splice(0, state.staff.candidates.length - 8);
}

function seatsAvailable(state) {
  const d = sectorData(state);
  const seats = (d.homeSeats || 99) + upgradeEffect(state, 'seats');
  const used = state.staff.employees.length + (state.staff.founder.active ? 1 : 0);
  return seats - used;
}

/** Salaire de marché pour un rôle et une compétence (référence de motivation). */
function marketSalary(state, roleId, skill) {
  const r = roles(state)[roleId];
  return Math.max(EMP.rmmmg, r.baseSalary * (0.75 + (skill / 100) * 0.55));
}

/** Coût employeur mensuel d'un employé (avant réductions). */
function employerCost(e) {
  return mul(e.salary, EMPLOYER_FACTOR);
}

/** Réduction « premiers engagements » mensuelle pour un employé. */
function hireReduction(state, e) {
  const months = (state.time.day - e.hiredDay) / DAYS_PER_MONTH;
  if (e.hireRank === 1) return Math.round(EMP.firstHireReduction / 3);
  if (e.hireRank <= EMP.nextHiresMax && months < EMP.nextHiresQuarters * 3) return Math.round(EMP.nextHiresReduction / 3);
  return 0;
}

function monthlyPayroll(state) {
  let s = 0;
  for (const e of state.staff.employees) {
    const onss = mul(e.salary, EMP.onssRate);
    s += employerCost(e) - Math.min(onss, hireReduction(state, e));
  }
  return s;
}

/** Productivité d'un employé (≈ 1 pour compétence 50, motivation 70). */
function productivity(state, e) {
  if (state.time.day < (e.absentUntil || 0)) return 0;
  const t = TRAITS[e.trait] || TRAITS.fiable;
  const mot = 0.7 + 0.3 * (e.motivation / 100);
  return (0.5 + e.skill / 100) * mot * t.prod;
}

function qualityOf(e) {
  const t = TRAITS[e.trait] || TRAITS.fiable;
  return (0.6 + e.skill / 125) * t.quality;
}

function countRole(state, roleId) {
  let n = 0;
  for (const e of state.staff.employees) if (e.role === roleId) n++;
  return n;
}

function hasManager(state) {
  return state.staff.employees.some((e) => e.role === 'gerant' && e.skill >= 40);
}

/** Bonus de productivité d'équipe (gérant, chef de projet…). */
function teamBonus(state) {
  let b = 1;
  if (hasManager(state)) b += 0.05;
  return b;
}

// --- Actions --------------------------------------------------------------

function hire(state, candidateId) {
  const idx = state.staff.candidates.findIndex((c) => c.id === candidateId);
  if (idx < 0) return { ok: false, message: 'Candidat introuvable.' };
  const c = state.staff.candidates[idx];
  const role = roles(state)[c.role];
  if (role.max && countRole(state, c.role) >= role.max) return { ok: false, message: `Tu as déjà le maximum pour ce rôle (${role.max}).` };
  if (seatsAvailable(state) <= 0) return { ok: false, message: 'Plus de place : il faut de plus grands locaux.' };
  state.staff.candidates.splice(idx, 1);
  state.staff.hireCount += 1;
  const e = {
    id: c.id,
    name: c.name,
    role: c.role,
    skill: c.skill,
    trait: c.trait,
    salary: c.salary,
    motivation: 70,
    hiredDay: state.time.day,
    hireRank: state.staff.hireCount,
    absentUntil: 0,
  };
  state.staff.employees.push(e);
  state.stats.hires = (state.stats.hires || 0) + 1;
  state.stats.maxEmployees = Math.max(state.stats.maxEmployees || 0, state.staff.employees.length);
  log(state, 'staff', `${e.name} rejoint l'équipe (${role.label}).`);
  return { ok: true };
}

/** Semaines de préavis selon l'ancienneté (barème « statut unique », simplifié). */
function noticeWeeksOf(state, e) {
  const months = (state.time.day - e.hiredDay) / DAYS_PER_MONTH;
  let weeks = 1;
  for (const [m, w] of EMP.noticeWeeks) if (months >= m) weeks = w;
  if (months >= 132) weeks += Math.floor((months - 120) / 12) * 3; // +3 semaines par année au-delà de 10 ans
  return Math.min(weeks, EMP.noticeMaxWeeks);
}

/** Indemnité de préavis (coût employeur) : salaire hebdomadaire × semaines + ONSS. */
function dismissalCost(state, e) {
  return Math.round(((e.salary * 12) / 52) * noticeWeeksOf(state, e) * (1 + EMP.onssRate));
}

function fire(state, employeeId) {
  const idx = state.staff.employees.findIndex((e) => e.id === employeeId);
  if (idx < 0) return { ok: false, message: 'Employé introuvable.' };
  const e = state.staff.employees[idx];
  const cost = dismissalCost(state, e);
  pay(state, cost, 'licenciement');
  state.staff.employees.splice(idx, 1);
  for (const o of state.staff.employees) o.motivation = clamp(o.motivation - 6, 0, 100);
  state.stats.fired = (state.stats.fired || 0) + 1;
  log(state, 'staff', `${e.name} est licencié·e. Indemnité de préavis : ${(cost / 100).toFixed(0)} €.`);
  return { ok: true };
}

function train(state, employeeId) {
  const e = state.staff.employees.find((x) => x.id === employeeId);
  if (!e) return { ok: false, message: 'Employé introuvable.' };
  if (state.time.day < e.absentUntil) return { ok: false, message: 'Déjà en formation ou absent.' };
  if (e.skill >= 100) return { ok: false, message: 'Compétence déjà maximale.' };
  spend(state, TRAINING_COST, 0.21, 'formation');
  const t = TRAITS[e.trait] || TRAITS.fiable;
  e.skill = clamp(Math.round(e.skill + 8 * t.learn), 1, 100);
  e.motivation = clamp(e.motivation + 6, 0, 100);
  e.absentUntil = state.time.day + TRAINING_DAYS;
  state.stats.trainings = (state.stats.trainings || 0) + 1;
  log(state, 'staff', `${e.name} part ${TRAINING_DAYS} jours en formation (+compétence).`);
  return { ok: true };
}

function raise(state, employeeId, pct = 0.05) {
  const e = state.staff.employees.find((x) => x.id === employeeId);
  if (!e) return { ok: false, message: 'Employé introuvable.' };
  e.salary = Math.round((e.salary * (1 + pct)) / 1000) * 1000;
  e.motivation = clamp(e.motivation + 12, 0, 100);
  log(state, 'staff', `${e.name} est augmenté·e (+${Math.round(pct * 100)} %).`);
  return { ok: true };
}

function postJobAd(state, rng, roleId) {
  spend(state, JOB_AD_COST, 0.21, 'recrutement');
  for (let i = 0; i < 3; i++) state.staff.candidates.push(makeCandidate(state, rng, roleId));
  if (state.staff.candidates.length > 8) state.staff.candidates.splice(0, state.staff.candidates.length - 8);
  return { ok: true };
}

// --- Simulation -----------------------------------------------------------

function daily(state, rng) {
  const st = state.staff;
  const workload = st.lastWorkload || 0; // utilisation de la capacité (0..1+)
  const teamMorale = st.employees.reduce((s, e) => s + (TRAITS[e.trait]?.teamMorale || 0), 0);
  const moodMod = modAdd(state, 'motivation') + upgradeEffect(state, 'motivation');
  const unpaid = state.flags.salaryLate ? -25 : 0;
  const leaving = [];
  for (const e of st.employees) {
    const t = TRAITS[e.trait] || TRAITS.fiable;
    const payRatio = e.salary / marketSalary(state, e.role, e.skill);
    let target = 62 + 60 * (payRatio - 1) + t.motivation + teamMorale + moodMod + unpaid;
    if (workload > 1.05) target -= 25 * (workload - 1);
    if (workload < 0.4) target -= 6; // ennui, peur pour son emploi
    target = clamp(target, 0, 100);
    e.motivation = clamp(e.motivation + (target - e.motivation) * 0.02, 0, 100);
    // L'ambitieux veut progresser : sa compétence monte doucement avec le temps.
    if (e.trait === 'ambitieux' && rng.chance(0.004)) e.skill = Math.min(100, e.skill + 1);
    if (e.motivation < 25) {
      const p = 0.006 * ((25 - e.motivation) / 25) * t.resign;
      if (rng.chance(p)) leaving.push(e);
    }
  }
  for (const e of leaving) {
    st.employees = st.employees.filter((x) => x !== e);
    state.stats.resignations = (state.stats.resignations || 0) + 1;
    log(state, 'bad', `${e.name} démissionne (motivation trop basse).`, true);
  }
}

function monthEnd(state, rng) {
  const st = state.staff;
  // Salaires (coût employeur), réduction premiers engagements déduite.
  for (const e of st.employees) {
    const onss = mul(e.salary, EMP.onssRate);
    const cost = employerCost(e) - Math.min(onss, hireReduction(state, e));
    pay(state, cost, 'salaires');
  }
  // Nouveaux candidats spontanés
  refreshCandidates(state, rng, 2);
}
return __exports;
})();

// ---- src/engine/sectors/agence.js ----
__m["src/engine/sectors/agence.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "hoursPerDay": () => hoursPerDay, "quality": () => quality, "backlogHours": () => backlogHours, "refPrice": () => refPrice, "playerAttraction": () => playerAttraction, "leadRate": () => leadRate, "leadAffordable": () => leadAffordable, "acceptLead": () => acceptLead, "declineLead": () => declineLead, "startSaas": () => startSaas, "daily": () => daily, "monthEnd": () => monthEnd, "recurringRevenue": () => recurringRevenue, "kpis": () => kpis, "sceneInfo": () => sceneInfo, "actions": () => actions, "onUpgrade": () => onUpgrade });
// Secteur agence web : leads → projets → heures → factures (+ maintenance, SaaS).

const { AGENCE: D } = __m["src/data/sectors/agence.js"];
const { DIFFICULTIES } = __m["src/data/difficulty.js"];
const { dateOf, isWeekend } = __m["src/engine/calendar.js"];
const { attractiveness, playerShare, priceFactor, marketingFactor, reputationFactor } = __m["src/engine/demand.js"];
const { invoice, earn, spend } = __m["src/engine/ledger.js"];
const { upgradeEffect } = __m["src/engine/upgrades.js"];
const { modMult } = __m["src/engine/modifiers.js"];
const { productivity, qualityOf, countRole, teamBonus } = __m["src/engine/systems/staff.js"];
const { rateCustomer, changeReputation } = __m["src/engine/systems/company.js"];
const { economyIndex } = __m["src/engine/systems/core.js"];
const { log } = __m["src/engine/log.js"];
const { clamp } = __m["src/engine/money.js"];

const WORKDAYS_PER_MONTH = 21;

function init(state) {
  state.sector = {
    rate: D.refRate,
    policy: 'capacite', // 'manuel' | 'capacite' | 'tout'
    leads: [],
    projects: [],
    leadSeq: 0,
    projSeq: 0,
    maint: { contracts: [], seq: 0 },
    saas: { status: 'none', subscribers: 0, price: D.saas.defaultPrice, acc: 0, peak: 0 },
    hours: { avail: 0, used: 0 },
    stats: { projectsDone: 0, hoursBilled: 0, leadsLost: 0, leadsWon: 0, lateProjects: 0 },
  };
}

// --- Calculs -------------------------------------------------------------

/** Heures facturables disponibles par jour ouvré. */
function hoursPerDay(state) {
  const st = state.staff;
  let h = 0;
  if (st.founder.active) h += D.founderHours * (0.6 + st.founder.skill / 140) * (st.founder.energy / 100 * 0.4 + 0.6);
  for (const e of st.employees) {
    const r = D.roles[e.role];
    if (r && r.hours) h += r.hours * productivity(state, e);
  }
  const pm = countRole(state, 'chef_projet') > 0 ? 1 + D.roles.chef_projet.prod : 1;
  return h * teamBonus(state) * pm * upgradeEffect(state, 'prodMult') * modMult(state, 'productivity');
}

/** Qualité perçue du travail (1 ≈ moyenne du marché). */
function quality(state) {
  const st = state.staff;
  let wq = 0;
  let w = 0;
  if (st.founder.active) {
    wq += (0.6 + st.founder.skill / 125) * D.founderHours;
    w += D.founderHours;
  }
  let designers = 0;
  for (const e of st.employees) {
    const r = D.roles[e.role];
    if (!r || !r.hours) continue;
    wq += qualityOf(e) * r.hours;
    w += r.hours;
    if (e.role === 'designer') designers++;
  }
  const base = w > 0 ? wq / w : 0.8;
  const q = base + Math.min(3, designers) * D.roles.designer.quality + upgradeEffect(state, 'quality');
  return clamp(q * modMult(state, 'quality'), 0.3, 2);
}

function backlogHours(state) {
  let s = 0;
  for (const p of state.sector.projects) s += Math.max(0, p.hoursReal - p.done);
  return s;
}

function overrunMult(state) {
  let m = upgradeEffect(state, 'overrunMult');
  if (countRole(state, 'chef_projet') > 0) m *= D.roles.chef_projet.overrun;
  return m;
}

function refPrice(state) {
  return Math.round(D.refRate * modMult(state, 'refPrice'));
}

/** Attractivité du joueur (part des demandes du marché). */
function playerAttraction(state) {
  const credibility = state.meta.legal === 'srl' ? 1.06 : 1; // clients B2B rassurés par une société
  return attractiveness({
    price: state.sector.rate,
    refPrice: refPrice(state),
    elasticity: D.elasticity,
    quality: state.company.quality,
    reputation: state.company.reputation,
    marketing: state.company.marketing,
    marketingRef: D.marketingRef,
    extra: credibility * modMult(state, 'attraction'),
  });
}

function commercialFactor(state) {
  let sum = 0;
  for (const e of state.staff.employees) if (e.role === 'commercial') sum += productivity(state, e);
  return 1 + D.roles.commercial.leads * Math.pow(sum, 0.8);
}

/** Demandes attendues par jour ouvré (avec le détail des facteurs). */
function leadRate(state) {
  const d = dateOf(state.time.day);
  const diff = DIFFICULTIES[state.meta.difficulty];
  const att = playerAttraction(state);
  const share = playerShare(state, att.value);
  const season = D.seasonality[d.month];
  const eco = economyIndex(state);
  const ev = modMult(state, 'demand');
  const brand = upgradeEffect(state, 'leadsMult');
  const sales = commercialFactor(state);
  const lambda = D.marketLeads * diff.marketMult * season * eco * ev * share * brand * sales;
  return { lambda, share, att, season, eco, ev, brand, sales };
}

// --- Leads & projets ----------------------------------------------------------

function newLead(state, rng) {
  const s = state.sector;
  const big = upgradeEffect(state, 'bigProjects') > 0;
  const types = D.projectTypes.filter((t) => !t.minRep || state.company.reputation >= t.minRep || big);
  const t = rng.weighted(types, (x) => x.weight * (big && x.hours[0] >= 90 ? 2 : 1));
  const hours = rng.int(t.hours[0], t.hours[1]);
  const budget = Math.round(
    refPrice(state) * t.budget * upgradeEffect(state, 'budgetMult') * Math.exp(rng.normal(0, 0.18)) * Math.sqrt(economyIndex(state)),
  );
  s.leadSeq += 1;
  return {
    id: s.leadSeq,
    type: t.id,
    label: t.label,
    client: rng.pick(D.clientNames),
    hours,
    budget: Math.round(budget / 100) * 100,
    deadline: t.deadline,
    expires: state.time.day + D.leadExpiryDays,
  };
}

/** Le client accepte-t-il le taux actuel ? */
function leadAffordable(state, lead) {
  return state.sector.rate <= lead.budget;
}

function canAbsorb(state, lead) {
  const cap = Math.max(1, hoursPerDay(state)) * WORKDAYS_PER_MONTH * 1.4;
  return backlogHours(state) + lead.hours <= cap;
}

function acceptLead(state, leadId, rng) {
  const s = state.sector;
  const i = s.leads.findIndex((l) => l.id === leadId);
  if (i < 0) return { ok: false, message: 'Demande introuvable ou expirée.' };
  const lead = s.leads[i];
  s.leads.splice(i, 1);
  if (!leadAffordable(state, lead)) {
    s.stats.leadsLost += 1;
    log(state, 'bad', `${lead.client} trouve ton taux trop élevé et part chez un concurrent.`);
    return { ok: false, message: 'Le client refuse ton taux horaire.' };
  }
  const overrun = 1 + Math.max(0, rng.normal(0.14, 0.14)) * overrunMult(state);
  const price = lead.hours * s.rate;
  s.projSeq += 1;
  const p = {
    id: s.projSeq,
    client: lead.client,
    label: lead.label,
    hoursEst: lead.hours,
    hoursReal: Math.round(lead.hours * overrun * 10) / 10,
    done: 0,
    price,
    deposit: 0,
    start: state.time.day,
    deadlineDay: state.time.day + lead.deadline,
    internal: false,
  };
  const dep = upgradeEffect(state, 'deposit');
  if (dep > 0) {
    p.deposit = Math.round(price * dep);
    invoice(state, p.deposit, D.vatRate, 'projets', { dueIn: 3, label: `Acompte ${p.client}` });
  }
  s.projects.push(p);
  s.stats.leadsWon += 1;
  log(state, 'good', `Projet signé : ${p.label} pour ${p.client} (${lead.hours} h).`);
  return { ok: true };
}

function declineLead(state, leadId) {
  const s = state.sector;
  const i = s.leads.findIndex((l) => l.id === leadId);
  if (i < 0) return { ok: false, message: 'Demande introuvable.' };
  s.leads.splice(i, 1);
  return { ok: true };
}

function completeProject(state, p, rng) {
  const s = state.sector;
  s.projects = s.projects.filter((x) => x !== p);
  if (p.internal) {
    s.saas.status = 'live';
    s.saas.subscribers = 5;
    state.flags.saasLive = true;
    log(state, 'good', 'Ton SaaS est en ligne ! Les premiers abonnés arrivent.', true);
    return;
  }
  const remaining = p.price - p.deposit;
  const defaultP = D.defaultProb * upgradeEffect(state, 'defaultMult') * modMult(state, 'defaultRisk');
  invoice(state, remaining, D.vatRate, 'projets', {
    dueIn: D.paymentDays,
    defaultProb: defaultP,
    lateProb: D.lateProb,
    label: p.client,
    rng,
  });
  const late = Math.max(0, state.time.day - p.deadlineDay);
  if (late > 0) s.stats.lateProjects += 1;
  const q = state.company.quality * rng.range(0.92, 1.08);
  const score = clamp(50 + 75 * (q - 0.85) - 2.5 * late, 0, 100);
  rateCustomer(state, score, 0.15);
  if (score > 70) changeReputation(state, 0.5);
  if (score < 35) changeReputation(state, -1.5);
  s.stats.projectsDone += 1;
  s.stats.hoursBilled += p.hoursEst;
  state.stats.unitsSold = (state.stats.unitsSold || 0) + 1;
  log(state, 'good', `Projet livré : ${p.label} (${p.client})${late ? `, avec ${late} j de retard` : ''}.`);
  // Contrat de maintenance ?
  if (upgradeEffect(state, 'unlockMaintenance') > 0 && rng.chance(D.maintenance.signProb * (score / 70))) {
    const fee = Math.round(rng.range(D.maintenance.fee[0], D.maintenance.fee[1]) / 500) * 500;
    s.maint.seq += 1;
    s.maint.contracts.push({ id: s.maint.seq, client: p.client, fee });
    log(state, 'good', `${p.client} signe un contrat de maintenance (${(fee / 100).toFixed(0)} €/mois).`);
  }
}

/** Démarre le projet interne SaaS (appelé quand l'amélioration est achetée). */
function startSaas(state) {
  const s = state.sector;
  if (s.saas.status !== 'none') return;
  s.saas.status = 'dev';
  s.projSeq += 1;
  s.projects.push({
    id: s.projSeq, client: 'Interne', label: 'Développement du SaaS', hoursEst: D.saas.devHours, hoursReal: D.saas.devHours,
    done: 0, price: 0, deposit: 0, start: state.time.day, deadlineDay: state.time.day + 9999, internal: true,
  });
  log(state, 'info', `Développement du SaaS lancé (${D.saas.devHours} h de travail interne).`);
}

function maintHoursPerDay(state) {
  const s = state.sector;
  return (s.maint.contracts.length * D.maintenance.hoursPerMonth + s.saas.subscribers * D.saas.supportHoursPerSub) / WORKDAYS_PER_MONTH;
}

// --- Simulation quotidienne ------------------------------------------------------

function daily(state, rng) {
  const s = state.sector;
  state.company.quality = quality(state);
  const lr = leadRate(state);
  state.company.share = lr.share;
  state.company.attraction = lr.att.value;
  const weekend = isWeekend(state.time.day);

  // 1) Nouvelles demandes
  if (!weekend) {
    const n = rng.poisson(lr.lambda);
    for (let i = 0; i < n; i++) s.leads.push(newLead(state, rng));
  }
  // 2) Acceptation automatique
  if (s.policy !== 'manuel') {
    for (const lead of [...s.leads]) {
      if (!leadAffordable(state, lead)) continue;
      if (s.policy === 'capacite' && !canAbsorb(state, lead)) continue;
      acceptLead(state, lead.id, rng);
    }
  }
  // 3) Demandes expirées = clients perdus
  const before = s.leads.length;
  s.leads = s.leads.filter((l) => l.expires > state.time.day);
  s.stats.leadsLost += before - s.leads.length;

  // 4) Production
  const cap = hoursPerDay(state);
  let avail = weekend ? 0 : Math.max(0, cap - maintHoursPerDay(state));
  const total = avail;
  const clientProjects = s.projects.filter((p) => !p.internal).sort((a, b) => a.deadlineDay - b.deadlineDay);
  const internal = s.projects.find((p) => p.internal);
  if (internal && avail > 0) {
    const share = clientProjects.length ? 0.3 : 1;
    const h = Math.min(avail * share, internal.hoursReal - internal.done);
    internal.done += h;
    avail -= h;
    if (internal.done >= internal.hoursReal - 1e-6) completeProject(state, internal, rng);
  }
  for (const p of clientProjects) {
    if (avail <= 0) break;
    const h = Math.min(avail, p.hoursReal - p.done);
    p.done += h;
    avail -= h;
    if (p.done >= p.hoursReal - 1e-6) completeProject(state, p, rng);
  }
  if (!weekend) {
    s.hours = { avail: total, used: total - avail };
    state.company.capacityUse = total > 0 ? (total - avail) / total : 1;
  }
  const backlog = backlogHours(state);
  state.staff.lastWorkload = cap > 0 ? Math.min(2, backlog / (cap * WORKDAYS_PER_MONTH)) : 0;

  // 5) SaaS
  if (s.saas.status === 'live') saasDaily(state, rng);

  // 6) Panneau « pourquoi ? »
  state.company.why = [
    { label: 'Part de marché', value: lr.share, kind: 'pct', hint: 'Ta part des demandes face aux concurrents.' },
    { label: 'Prix (taux horaire)', value: lr.att.parts.prix, hint: 'Plus ton taux dépasse 65 €/h, moins on te choisit.' },
    { label: 'Qualité', value: lr.att.parts.qualite, hint: 'Compétence de l’équipe, designers et améliorations.' },
    { label: 'Réputation', value: lr.att.parts.reputation, hint: 'Projets livrés à temps et bien faits.' },
    { label: 'Marketing', value: lr.att.parts.marketing, hint: 'Rendements décroissants : doubler le budget ne double pas les clients.' },
    { label: 'Saison', value: lr.season, hint: 'Été et fin d’année calmes, rentrée chargée.' },
    { label: 'Conjoncture', value: lr.eco, hint: 'Les PME investissent moins en période de crise.' },
    { label: 'Événements', value: lr.ev, hint: 'Effets temporaires en cours.' },
    { label: 'Image de marque', value: lr.brand, hint: 'Portfolio, référencement, locaux.' },
    { label: 'Commerciaux', value: lr.sales, hint: 'Chaque commercial ramène des demandes.' },
  ];
  const affordable = s.leads.filter((l) => leadAffordable(state, l)).length;
  state.company.bottleneck =
    backlog > cap * WORKDAYS_PER_MONTH * 1.2
      ? 'capacite'
      : s.leads.length > 0 && affordable === 0
        ? 'prix'
        : lr.lambda < 0.15
          ? 'demande'
          : null;
  state.company.demandPerDay = lr.lambda;
}

function saasDaily(state, rng) {
  const s = state.sector;
  const c = D.saas;
  const pf = priceFactor(s.saas.price, c.defaultPrice, c.elasticity);
  const mf = marketingFactor(state.company.marketing, D.marketingRef);
  const rf = reputationFactor(state.company.reputation);
  const sat = Math.max(0, 1 - s.saas.subscribers / c.potential);
  const lambda = c.baseNewPerDay * upgradeEffect(state, 'saasGrowthMult') * mf * rf * pf * sat * economyIndex(state) * (1 + s.saas.subscribers / 400);
  const gained = rng.poisson(lambda);
  const churnBoost = state.company.quality < 0.9 ? 1.5 : 1;
  const lost = rng.poisson((s.saas.subscribers * c.churnMonthly * churnBoost * modMult(state, 'saasChurn')) / 30);
  s.saas.subscribers = Math.max(0, s.saas.subscribers + gained - lost);
  s.saas.peak = Math.max(s.saas.peak, s.saas.subscribers);
}

function monthEnd(state, rng) {
  const s = state.sector;
  // Maintenance : facturation + résiliations
  const churn = D.maintenance.churnMonthly * upgradeEffect(state, 'maintChurnMult') * modMult(state, 'maintChurn');
  s.maint.contracts = s.maint.contracts.filter((c) => !rng.chance(churn));
  let maintTotal = 0;
  for (const c of s.maint.contracts) maintTotal += c.fee;
  if (maintTotal > 0) invoice(state, maintTotal, D.vatRate, 'maintenance', { dueIn: 15, defaultProb: 0.01, label: 'Maintenance', rng });
  // SaaS : abonnements payés par carte
  if (s.saas.status === 'live') {
    const mrr = s.saas.subscribers * s.saas.price;
    earn(state, mrr, D.vatRate, 'saas');
    spend(state, D.saas.serverCostBase + s.saas.subscribers * D.saas.serverCostPerSub, 0.21, 'logiciels');
  }
}

/** Revenu récurrent mensuel (maintenance + SaaS), HT. */
function recurringRevenue(state) {
  const s = state.sector;
  let m = 0;
  for (const c of s.maint.contracts) m += c.fee;
  if (s.saas.status === 'live') m += s.saas.subscribers * s.saas.price;
  return m;
}

function kpis(state) {
  const s = state.sector;
  return [
    { label: 'Taux horaire', value: s.rate, fmt: 'eur', suffix: '/h' },
    { label: 'Capacité', value: hoursPerDay(state), fmt: 'num1', suffix: ' h/jour' },
    { label: 'Carnet de commandes', value: backlogHours(state), fmt: 'num0', suffix: ' h' },
    { label: 'Projets en cours', value: s.projects.filter((p) => !p.internal).length, fmt: 'int' },
    { label: 'Projets livrés', value: s.stats.projectsDone, fmt: 'int' },
    { label: 'Récurrent mensuel', value: recurringRevenue(state), fmt: 'eur' },
  ];
}

/** Pour la scène : nombre de « clients » visibles et d'employés au travail. */
function sceneInfo(state) {
  const s = state.sector;
  return {
    activity: Math.min(1, state.company.capacityUse || 0),
    customers: Math.min(6, s.leads.length + s.projects.length),
    workers: state.staff.employees.length + (state.staff.founder.active ? 1 : 0),
  };
}

const actions = {
  setRate(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.rate = clamp(v, D.minRate, D.maxRate);
    return { ok: true };
  },
  setPolicy(state, a) {
    if (!['manuel', 'capacite', 'tout'].includes(a.value)) return { ok: false, message: 'Politique inconnue.' };
    state.sector.policy = a.value;
    return { ok: true };
  },
  acceptLead(state, a, rng) {
    return acceptLead(state, a.id, rng);
  },
  declineLead(state, a) {
    return declineLead(state, a.id);
  },
  setSaasPrice(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.saas.price = clamp(v, D.saas.minPrice, D.saas.maxPrice);
    return { ok: true };
  },
};

/** Appelé après l'achat d'une amélioration de ce secteur. */
function onUpgrade(state, id) {
  if (id === 'saas') startSaas(state);
}
return __exports;
})();

// ---- src/engine/sectors/index.js ----
__m["src/engine/sectors/index.js"] = (function () {
const __exports = {};
__def(__exports, { "SECTOR_MODULES": () => SECTOR_MODULES, "sectorModule": () => sectorModule });
// Registre de la LOGIQUE des secteurs (modules avec init/daily/monthEnd/actions…).

const agence = __m["src/engine/sectors/agence.js"];

const SECTOR_MODULES = {
  agence,
};

function sectorModule(state) {
  const m = SECTOR_MODULES[state.meta.sector];
  if (!m) throw new Error(`Secteur inconnu : ${state.meta.sector}`);
  return m;
}
return __exports;
})();

// ---- src/engine/systems/sector.js ----
__m["src/engine/systems/sector.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "daily": () => daily, "monthEnd": () => monthEnd });
// Délègue au module du secteur choisi.

const { sectorModule } = __m["src/engine/sectors/index.js"];

function init(state, opts, diff, rng) {
  sectorModule(state).init(state, opts, diff, rng);
}

function daily(state, rng) {
  sectorModule(state).daily(state, rng);
}

function monthEnd(state, rng) {
  const m = sectorModule(state);
  if (m.monthEnd) m.monthEnd(state, rng);
}
return __exports;
})();

// ---- src/data/finance.js ----
__m["src/data/finance.js"] = (function () {
const __exports = {};
__def(__exports, { "FINANCE": () => FINANCE });
// Paramètres de financement (banque, investisseurs). Montants en centimes. [approx]
// Les taux sont indicatifs (marché belge 2025-2026 pour un crédit professionnel
// de PME : ≈ 4 à 7 %) et évoluent avec le « taux directeur » du jeu.

const FINANCE = {
  loan: {
    baseSpread: 0.025, // marge de la banque au-dessus du taux directeur
    independantPremium: 0.005, // personne physique : un peu plus cher
    minMonths: 12,
    maxMonths: 84,
    startupMax: { independant: 1_500_000, srl: 2_500_000 }, // prêt de démarrage sans historique
    revenueMultiple: 6, // plafond ≈ 6 mois de CA moyen
    maxTotalDebt: 50_000_000,
    maxDebtServiceShare: 0.35, // mensualités ≤ 35 % du CA mensuel moyen
    earlyRepaymentMonthsOfInterest: 3, // indemnité de remploi (simplifiée)
  },
  investor: {
    // Valorisation pré-money ≈ max(CA annuel × 1, bénéfice annuel × 6)
    revenueMultiple: 1,
    profitMultiple: 6,
    minValuation: 5_000_000,
    stakes: [0.1, 0.15, 0.2, 0.25],
    maxInvestorShare: 0.49,
    expectedYield: 0.05, // dividende annuel attendu (% de l'investissement)
    offerDays: 30,
  },
};
return __exports;
})();

// ---- src/engine/systems/finance.js ----
__m["src/engine/systems/finance.js"] = (function () {
const __exports = {};
__def(__exports, { "daily": () => daily, "endOfDay": () => endOfDay, "avgRevenue": () => avgRevenue, "monthEnd": () => monthEnd, "yearEnd": () => yearEnd });
// Finance : créances, découvert, historique mensuel, trésorerie quotidienne.

const { ECONOMY } = __m["src/data/economy.js"];
const { CONFIG } = __m["src/data/config.js"];
const { processReceivables, pay, resetMonth, resetYear, amortizationForYear, receivablesTotal } = __m["src/engine/ledger.js"];
const { dateOf, monthIndexOf } = __m["src/engine/calendar.js"];
const { log } = __m["src/engine/log.js"];
const { clamp } = __m["src/engine/money.js"];

function daily(state) {
  processReceivables(state, (r) => {
    log(state, 'bad', `Impayé : ${r.label || 'un client'} ne paiera jamais sa facture (${(r.amount / 100).toFixed(0)} €).`, true);
  });
  // Intérêts débiteurs du découvert (calculés chaque jour, année de 360 jours).
  if (state.cash < 0) {
    const interest = Math.round((-state.cash * state.finance.overdraftRate) / 360);
    if (interest > 0) pay(state, interest, 'interets');
  }
}

function endOfDay(state) {
  const dc = state.finance.dailyCash;
  dc.push(state.cash);
  if (dc.length > CONFIG.dailyHistoryDays) dc.splice(0, dc.length - CONFIG.dailyHistoryDays);
}

/** Moyenne du chiffre d'affaires mensuel sur les n derniers mois. */
function avgRevenue(state, n = 3) {
  const h = state.finance.history.slice(-n);
  if (!h.length) return 0;
  return h.reduce((s, x) => s + x.revenue, 0) / h.length;
}

function monthEnd(state) {
  const f = state.finance;
  const d = dateOf(state.time.day);
  const amort = Math.round(amortizationForYear(state, d.yearIdx) / 12);
  const snap = {
    m: monthIndexOf(state.time.day),
    revenue: f.month.revenue,
    expenses: f.month.expenses,
    amort,
    profit: f.month.revenue - f.month.expenses - amort,
    cash: state.cash,
    personal: state.personal.cash,
    receivables: receivablesTotal(state),
    reputation: Math.round(state.company.reputation * 10) / 10,
    share: Math.round(state.company.share * 1000) / 1000,
    employees: state.staff.employees.length,
    byCat: { ...f.month.byCat },
    revByCat: { ...f.month.revByCat },
    inflow: f.month.inflow,
    outflow: f.month.outflow,
  };
  // Les autres systèmes peuvent compléter l'instantané (patrimoine, passif…).
  state.finance.pendingSnapshot = snap;
  f.history.push(snap);
  if (f.history.length > 600) f.history.shift();
  // Limite de découvert : ≈ 50 % du CA mensuel moyen, jamais sous le minimum de départ.
  const avg = avgRevenue(state, 3);
  const credibility = state.meta.legal === 'srl' ? 1 : 0.8;
  f.overdraftLimit = clamp(Math.round(avg * ECONOMY.overdraftRevenueShare * credibility), ECONOMY.overdraftStart, ECONOMY.overdraftMax);
  if (state.flags.overdraftCut) f.overdraftLimit = ECONOMY.overdraftStart;
  resetMonth(state);
}

/** Après le calcul de l'impôt annuel (tax.yearEnd), on remet l'année à zéro. */
function yearEnd(state) {
  resetYear(state);
}
return __exports;
})();

// ---- src/engine/systems/loans.js ----
__m["src/engine/systems/loans.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "totalDebt": () => totalDebt, "monthlyDebtService": () => monthlyDebtService, "loanOffer": () => loanOffer, "requestLoan": () => requestLoan, "repayLoan": () => repayLoan, "monthEnd": () => monthEnd, "valuation": () => valuation, "makeInvestorOffer": () => makeInvestorOffer, "acceptInvestor": () => acceptInvestor, "yearEnd": () => yearEnd });
// Financement : prêts bancaires (annuités), remboursement anticipé, investisseurs (SRL).

const { FINANCE } = __m["src/data/finance.js"];
const { pay, receive } = __m["src/engine/ledger.js"];
const { annuity, clamp } = __m["src/engine/money.js"];
const { log } = __m["src/engine/log.js"];
const { avgRevenue } = __m["src/engine/systems/finance.js"];

const L = FINANCE.loan;

function init(state) {
  state.loans = [];
  state.loanSeq = 0;
  state.ownership = { founder: 1, investors: [] };
  state.offers = { investor: null };
}

function totalDebt(state) {
  return state.loans.reduce((s, l) => s + l.remaining, 0);
}

function monthlyDebtService(state) {
  return state.loans.reduce((s, l) => s + l.payment, 0);
}

function avgProfit(state, n = 6) {
  const h = state.finance.history.slice(-n);
  return h.length ? h.reduce((s, x) => s + x.profit, 0) / h.length : 0;
}

/** Taux proposé par la banque (annuel) et plafond empruntable. */
function loanOffer(state, months = 48) {
  const rep = state.company.reputation;
  const rev = avgRevenue(state, 6);
  const profit = avgProfit(state, 6);
  const debt = totalDebt(state);
  let rate = state.world.baseRate + L.baseSpread;
  if (state.meta.legal === 'independant') rate += L.independantPremium;
  rate += rep < 30 ? 0.02 : rep < 50 ? 0.01 : rep < 70 ? 0.004 : 0;
  if (profit < 0) rate += 0.015;
  rate += (months / 12 - 3) * 0.0015; // les longues durées coûtent un peu plus
  if (state.endgame && state.endgame.distressDays > 0) rate += 0.03;
  rate = clamp(rate, 0.015, 0.16);
  const history = state.finance.history.length;
  let max = history < 6 ? L.startupMax[state.meta.legal] : rev * L.revenueMultiple * (0.6 + rep / 100);
  // Capacité de remboursement : mensualités totales ≤ 35 % du CA mensuel moyen
  const service = monthlyDebtService(state);
  const capacity = Math.max(0, (rev || 200_000) * L.maxDebtServiceShare - service);
  const r = rate / 12;
  const maxFromService = r > 0 ? (capacity * (1 - Math.pow(1 + r, -months))) / r : capacity * months;
  max = Math.min(max, maxFromService, L.maxTotalDebt - debt);
  if (state.endgame && state.endgame.distressDays > 20) max = Math.min(max, rev);
  if (history >= 6 && profit < -rev * 0.3) max = 0; // la banque refuse une activité qui saigne
  return { rate, max: Math.max(0, Math.floor(max / 100_000) * 100_000) };
}

function requestLoan(state, amount, months) {
  months = clamp(Math.round(months), L.minMonths, L.maxMonths);
  amount = Math.round(amount);
  if (!(amount >= 100_000)) return { ok: false, message: 'Montant minimum : 1 000 €.' };
  const offer = loanOffer(state, months);
  if (amount > offer.max) return { ok: false, message: `La banque refuse : maximum ${Math.round(offer.max / 100)} € aujourd'hui.` };
  const payment = annuity(amount, offer.rate, months);
  state.loanSeq += 1;
  state.loans.push({ id: state.loanSeq, principal: amount, remaining: amount, rate: offer.rate, months, monthsLeft: months, payment, startDay: state.time.day });
  receive(state, amount, 'pret');
  state.stats.loansTaken = (state.stats.loansTaken || 0) + 1;
  log(state, 'info', `Prêt accordé : ${Math.round(amount / 100)} € sur ${months} mois à ${(offer.rate * 100).toFixed(2)} % (mensualité ${Math.round(payment / 100)} €).`, true);
  return { ok: true };
}

function repayLoan(state, id) {
  const l = state.loans.find((x) => x.id === id);
  if (!l) return { ok: false, message: 'Prêt introuvable.' };
  const penalty = Math.round(l.remaining * (l.rate / 12) * L.earlyRepaymentMonthsOfInterest);
  if (state.cash - l.remaining - penalty < 0) return { ok: false, message: 'Trésorerie insuffisante pour rembourser ce prêt.' };
  pay(state, l.remaining, 'remboursement');
  pay(state, penalty, 'interets');
  state.loans = state.loans.filter((x) => x !== l);
  state.stats.loansRepaid = (state.stats.loansRepaid || 0) + 1;
  log(state, 'good', `Prêt remboursé par anticipation (indemnité de remploi : ${Math.round(penalty / 100)} €).`);
  return { ok: true };
}

function monthEnd(state) {
  for (const l of state.loans) {
    const interest = Math.round(l.remaining * (l.rate / 12));
    const principal = Math.min(l.remaining, l.payment - interest);
    pay(state, interest, 'interets');
    pay(state, principal, 'remboursement');
    l.remaining -= principal;
    l.monthsLeft -= 1;
  }
  const done = state.loans.filter((l) => l.remaining <= 0 || l.monthsLeft <= 0);
  if (done.length) {
    state.loans = state.loans.filter((l) => !done.includes(l));
    state.stats.loansRepaid = (state.stats.loansRepaid || 0) + done.length;
    log(state, 'good', 'Un prêt est entièrement remboursé.');
  }
  // Offre d'investisseur expirée
  if (state.offers.investor && state.offers.investor.expires <= state.time.day) state.offers.investor = null;
}

// --- Investisseurs (SRL) --------------------------------------------------------

function valuation(state) {
  const I = FINANCE.investor;
  const rev = avgRevenue(state, 12) * 12;
  const profit = avgProfit(state, 12) * 12;
  return Math.max(I.minValuation, rev * I.revenueMultiple, profit * I.profitMultiple);
}

function makeInvestorOffer(state, rng) {
  if (state.meta.legal !== 'srl') return { ok: false, message: 'Seule une société (SRL) peut ouvrir son capital.' };
  const I = FINANCE.investor;
  const investorsShare = 1 - state.ownership.founder;
  const stakes = I.stakes.filter((s) => investorsShare + s <= I.maxInvestorShare);
  if (!stakes.length) return { ok: false, message: 'Tu garderais moins de 51 % : aucun investisseur supplémentaire.' };
  const stake = rng.pick(stakes);
  const v = valuation(state) * (0.8 + state.company.reputation / 250) * rng.range(0.85, 1.15);
  const amount = Math.round((v * stake) / (1 - stake) / 100_000) * 100_000;
  state.offers.investor = { stake, amount, expires: state.time.day + I.offerDays, name: rng.pick(['Wallonie Angels', 'Brussels Seed Club', 'Flanders Ventures', 'Famille Delvaux', 'Mme Peeters, ex-CEO']) };
  return { ok: true };
}

function acceptInvestor(state) {
  const o = state.offers.investor;
  if (!o) return { ok: false, message: 'Aucune offre en cours.' };
  if (o.expires <= state.time.day) return { ok: false, message: 'Offre expirée.' };
  receive(state, o.amount, 'investisseur');
  state.ownership.founder = Math.round(state.ownership.founder * (1 - o.stake) * 10000) / 10000;
  state.ownership.investors.push({ name: o.name, invested: o.amount, day: state.time.day, stake: o.stake });
  state.offers.investor = null;
  state.stats.fundraises = (state.stats.fundraises || 0) + 1;
  log(state, 'good', `${o.name} investit ${Math.round(o.amount / 100)} € contre ${Math.round(o.stake * 100)} % des parts. Tu détiens désormais ${Math.round(state.ownership.founder * 100)} %.`, true);
  return { ok: true };
}

/** Contrepartie : les investisseurs attendent un dividende annuel. */
function yearEnd(state) {
  if (!state.ownership.investors.length) return;
  const expected = state.ownership.investors.reduce((s, i) => s + i.invested, 0) * FINANCE.investor.expectedYield;
  if ((state.stats.dividendsYear || 0) < expected * 0.5) {
    state.company.reputation = Math.max(0, state.company.reputation - 3);
    for (const e of state.staff.employees) e.motivation = Math.max(0, e.motivation - 5);
    log(state, 'bad', 'Tes investisseurs sont mécontents : pas assez de dividendes cette année. Ambiance tendue et rumeurs dans la presse.', true);
  }
  state.stats.dividendsYear = 0;
}
return __exports;
})();

// ---- src/engine/taxmath.js ----
__m["src/engine/taxmath.js"] = (function () {
const __exports = {};
__def(__exports, { "ippTax": () => ippTax, "marginalRate": () => marginalRate, "socialOnIncome": () => socialOnIncome, "socialQuarterly": () => socialQuarterly, "socialAnnualDue": () => socialAnnualDue, "socialBaseFromProfit": () => socialBaseFromProfit, "isocTax": () => isocTax, "reducedRateEligible": () => reducedRateEligible, "directorFlatCosts": () => directorFlatCosts, "directorIpp": () => directorIpp, "monthlyWithholding": () => monthlyWithholding, "dividendRate": () => dividendRate, "dividendExemptionCredit": () => dividendExemptionCredit });
// Calculs fiscaux PURS (aucun état) à partir de src/data/fiscalite.js.
// Tous les montants en centimes.

const { FISCALITE: F } = __m["src/data/fiscalite.js"];

/** Impôt progressif brut sur un montant selon les tranches. */
function progressive(amount, brackets) {
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (amount <= prev) break;
    const slice = Math.min(amount, b.upTo) - prev;
    tax += slice * b.rate;
    prev = b.upTo;
  }
  return tax;
}

/**
 * IPP d'un revenu imposable annuel (centimes).
 * Quotité exemptée = réduction d'impôt calculée sur la quotité au barème.
 * Additionnels communaux appliqués sur l'impôt de l'État.
 */
function ippTax(taxable) {
  const t = Math.max(0, taxable);
  const gross = progressive(t, F.ipp.brackets);
  const reduction = progressive(Math.min(t, F.ipp.quotiteExemptee), F.ipp.brackets);
  const state = Math.max(0, gross - reduction);
  const total = Math.round(state * (1 + F.ipp.centimesAdditionnels));
  return { total, state: Math.round(state), communal: total - Math.round(state), marginal: marginalRate(t) };
}

function marginalRate(taxable) {
  for (const b of F.ipp.brackets) if (taxable <= b.upTo) return b.rate;
  return F.ipp.brackets[F.ipp.brackets.length - 1].rate;
}

/** Cotisations sociales annuelles « théoriques » sur un revenu (sans minimum, sans frais). */
function socialOnIncome(income) {
  const s = F.social;
  const i = Math.max(0, income);
  const a = Math.min(i, s.ceiling1) * s.rate1;
  const b = Math.max(0, Math.min(i, s.ceiling2) - s.ceiling1) * s.rate2;
  return a + b;
}

/** Cotisation trimestrielle (minimum + frais de gestion inclus) pour une base annuelle. */
function socialQuarterly(baseAnnual) {
  const q = Math.max(F.social.minQuarterly, socialOnIncome(baseAnnual) / 4);
  return Math.round(q * (1 + F.social.fraisGestion));
}

/** Cotisations annuelles définitives pour un revenu réel (4 trimestres). */
function socialAnnualDue(income) {
  return socialQuarterly(income) * 4;
}

/**
 * Revenu de référence des cotisations à partir d'un bénéfice « avant cotisations ».
 * Les cotisations sont elles-mêmes déductibles : on résout r = P − c(r) par
 * quelques itérations (convergence rapide, le taux < 21 %).
 */
function socialBaseFromProfit(profitBeforeSocial) {
  let r = Math.max(0, profitBeforeSocial);
  for (let i = 0; i < 6; i++) r = Math.max(0, profitBeforeSocial - socialAnnualDue(r));
  return r;
}

/**
 * ISOC. reducedOk = la société remplit les conditions du taux réduit PME
 * (rémunération du dirigeant suffisante).
 */
function isocTax(taxable, reducedOk) {
  const t = Math.max(0, taxable);
  if (!reducedOk) return Math.round(t * F.isoc.normalRate);
  const low = Math.min(t, F.isoc.reducedBracket);
  return Math.round(low * F.isoc.reducedRate + (t - low) * F.isoc.normalRate);
}

/** Condition de rémunération du dirigeant pour le taux réduit. */
function reducedRateEligible(directorPayYear, taxableProfit) {
  return directorPayYear >= Math.min(F.isoc.minDirectorPay, Math.max(0, taxableProfit));
}

/** Frais forfaitaires du dirigeant d'entreprise. */
function directorFlatCosts(netIncome) {
  return Math.round(Math.min(Math.max(0, netIncome) * F.dirigeant.fraisForfaitairesRate, F.dirigeant.fraisForfaitairesMax));
}

/** IPP estimé d'un dirigeant pour une rémunération brute annuelle. */
function directorIpp(grossAnnual) {
  const social = socialAnnualDue(socialBaseFromProfit(grossAnnual));
  const net = Math.max(0, grossAnnual - social);
  return ippTax(net - directorFlatCosts(net)).total;
}

/** Précompte professionnel mensuel estimé (rémunération mensuelle constante). */
function monthlyWithholding(grossMonthly) {
  return Math.round(directorIpp(grossMonthly * 12) / 12);
}

/**
 * Taux de précompte mobilier sur un dividende de la société selon son ancienneté
 * (VVPR-bis simplifié) : exercice 1 → 30 %, exercice 2 → 20 %, ensuite 15 %.
 */
function dividendRate(companyYearIdx) {
  if (companyYearIdx <= 0) return F.dividendes.precompte;
  if (companyYearIdx === 1) return F.dividendes.vvprbisYear2;
  return F.dividendes.vvprbisYear3;
}

/** Crédit d'impôt pour l'exonération des dividendes (833 € × taux, plafonné). */
function dividendExemptionCredit(dividendsGross, rate) {
  return Math.round(Math.min(dividendsGross, F.dividendes.exemption) * rate);
}
return __exports;
})();

// ---- src/engine/systems/owner.js ----
__m["src/engine/systems/owner.js"] = (function () {
const __exports = {};
__def(__exports, { "transferToOwner": () => transferToOwner, "monthEnd": () => monthEnd, "endOfMonthLiving": () => endOfMonthLiving });
// Le dirigeant : prélèvements (indépendant) ou rémunération (SRL), coût de la vie.
// La fiscalité personnelle détaillée (IPP, cotisations, précompte) est dans tax.js.

const { pay, personalIn, personalOut } = __m["src/engine/ledger.js"];
const { directorIpp } = __m["src/engine/taxmath.js"];
const { log } = __m["src/engine/log.js"];

/**
 * Transfert du compte pro vers le compte perso.
 * Indépendant : simple prélèvement (le bénéfice est taxé à l'IPP de toute façon).
 * SRL : rémunération de dirigeant (charge déductible pour la société), avec
 * précompte professionnel retenu à la source (régularisé en fin d'année par tax.js).
 */
function transferToOwner(state, amount, reason = 'draw') {
  if (amount <= 0) return 0;
  if (state.meta.legal === 'srl') {
    pay(state, amount, 'remuneration');
    personalIn(state, amount, reason === 'draw' ? 'revenu' : 'renflouement');
    // Précompte professionnel retenu à la source (taux moyen estimé sur l'année).
    const annual = Math.max(amount, state.personal.draw) * 12;
    const rate = annual > 0 ? directorIpp(annual) / annual : 0;
    const w = Math.round(amount * rate);
    personalOut(state, w, 'precompte');
    state.tax.year.precompte += w;
    state.tax.year.directorPay += amount;
  } else {
    pay(state, amount, 'prelevement');
    personalIn(state, amount, reason === 'draw' ? 'revenu' : 'renflouement');
  }
  return amount;
}

function monthEnd(state) {
  const p = state.personal;
  // 1) Prélèvement / rémunération du mois (dans la limite de ce qui est disponible).
  const available = Math.max(0, state.cash + state.finance.overdraftLimit * 0.5);
  const draw = Math.min(p.draw, available);
  transferToOwner(state, draw);
  if (draw < p.draw) log(state, 'bad', 'Trésorerie trop juste : ta rémunération du mois a été réduite.');
}

/** Après les impôts du mois : coût de la vie, renflouement si nécessaire. */
function endOfMonthLiving(state) {
  const p = state.personal;
  personalOut(state, p.livingCost, 'vie');
  let taken = 0;
  // Plusieurs passes : en SRL, le précompte retenu réduit le net versé.
  for (let i = 0; i < 4 && p.cash < 0; i++) {
    const need = -p.cash;
    transferToOwner(state, need, 'emergency');
    taken += need;
  }
  if (taken > 0) log(state, 'bad', `Ton compte perso était à sec : ${(taken / 100).toFixed(0)} € pris sur l'entreprise pour vivre.`);
  p.history.push({ cash: p.cash, ...p.month });
  if (p.history.length > 240) p.history.shift();
  p.month = {};
}
return __exports;
})();

// ---- src/engine/systems/tax.js ----
__m["src/engine/systems/tax.js"] = (function () {
const __exports = {};
__def(__exports, { "STARTER_YEARS": () => STARTER_YEARS, "init": () => init, "schedulePayment": () => schedulePayment, "daily": () => daily, "provisionalBase": () => provisionalBase, "quarterlySocial": () => quarterlySocial, "yearResult": () => yearResult, "estimateYearTax": () => estimateYearTax, "yearEnd": () => yearEnd, "quarterEnd": () => quarterEnd, "upcoming": () => upcoming });
// Fiscalité : TVA trimestrielle, cotisations sociales (provisoires + régularisation),
// IPP / ISOC annuels, précompte professionnel, dividendes, échéancier.
// Les taux viennent de src/data/fiscalite.js ; les calculs de src/engine/taxmath.js.

const { FISCALITE: F } = __m["src/data/fiscalite.js"];
const { pay, receive, personalOut, personalIn, amortizationForYear } = __m["src/engine/ledger.js"];
const { dateOf, dayOf, formatDate } = __m["src/engine/calendar.js"];
const { ippTax, isocTax, reducedRateEligible, socialQuarterly, socialAnnualDue, socialBaseFromProfit, directorFlatCosts, dividendExemptionCredit } = __m["src/engine/taxmath.js"];
const { log } = __m["src/engine/log.js"];

const STARTER_YEARS = 3;

function init(state) {
  state.tax = {
    schedule: [], // échéances à venir : { id, kind, label, dueDay, amount, payer: 'company'|'personal' }
    seq: 0,
    social: { chosenBase: 0, lastIncome: null, provisionalFor: {} }, // provisionalFor[année] = provisionnelles appelées pour cette année
    year: { socialPaidCompany: 0, socialPaidPersonal: 0, precompte: 0, dividendsGross: 0, dividendRateMax: 0, directorPay: 0 },
    lossCarry: 0,
    reserves: 0, // bénéfices reportés distribuables (SRL)
    results: [], // résultats annuels
    paidTotals: { tva: 0, impot: 0, cotisations: 0 },
    vatQuarters: [],
  };
}

// --- Échéancier --------------------------------------------------------------

function schedulePayment(state, { kind, label, dueDay, amount, payer = 'company' }) {
  state.tax.seq += 1;
  state.tax.schedule.push({ id: state.tax.seq, kind, label, dueDay, amount, payer });
  state.tax.schedule.sort((a, b) => a.dueDay - b.dueDay);
}

function settle(state, item) {
  const cat = item.kind === 'tva' ? 'tva' : item.kind === 'cotisations' || item.kind === 'regul' ? 'cotisations' : 'impot';
  if (item.amount >= 0) {
    if (item.payer === 'personal') {
      personalOut(state, item.amount, cat);
      if (cat === 'cotisations') state.tax.year.socialPaidPersonal += item.amount;
    } else {
      pay(state, item.amount, cat);
      if (cat === 'cotisations') state.tax.year.socialPaidCompany += item.amount;
    }
    state.tax.paidTotals[cat] = (state.tax.paidTotals[cat] || 0) + item.amount;
    if (item.amount > 0) {
      log(state, 'tax', `${item.label} payé : ${(item.amount / 100).toLocaleString('fr-BE', { maximumFractionDigits: 0 })} €.`, item.amount > 200_000);
      if (item.kind === 'tva') state.stats.vatPaid = (state.stats.vatPaid || 0) + 1;
    }
  } else {
    const refund = -item.amount;
    if (item.payer === 'personal') personalIn(state, refund, 'remboursement');
    else receive(state, refund, 'autres_revenus');
    if (cat === 'cotisations') {
      if (item.payer === 'personal') state.tax.year.socialPaidPersonal -= refund;
      else state.tax.year.socialPaidCompany -= refund;
    }
    log(state, 'good', `${item.label} : remboursement de ${(refund / 100).toLocaleString('fr-BE', { maximumFractionDigits: 0 })} €.`, refund > 100_000);
  }
}

function daily(state) {
  const t = state.tax;
  const today = state.time.day;
  while (t.schedule.length && t.schedule[0].dueDay <= today) settle(state, t.schedule.shift());
  // Franchise TVA : sortie automatique au-delà du seuil.
  const f = state.finance;
  if (f.franchise && f.vatYearTurnover > F.tva.franchiseThreshold) {
    f.franchise = false;
    log(state, 'tax', 'Ton chiffre d’affaires dépasse 25 000 € : tu sors du régime de franchise et dois désormais facturer la TVA.', true);
  }
}

// --- TVA ------------------------------------------------------------------------

function vatDeclaration(state) {
  const f = state.finance;
  const d = dateOf(state.time.day);
  const net = f.vat.collected - f.vat.deductible;
  state.tax.vatQuarters.push({ q: d.quarter, year: d.year, collected: f.vat.collected, deductible: f.vat.deductible, net });
  if (state.tax.vatQuarters.length > 40) state.tax.vatQuarters.shift();
  f.vat.collected = 0;
  f.vat.deductible = 0;
  if (net === 0) return;
  // Échéance : le 20 du mois qui suit le trimestre.
  const nextMonth = d.month + 1;
  const due = nextMonth > 11 ? dayOf(d.yearIdx + 1, 0, F.tva.dueDayOfMonth) : dayOf(d.yearIdx, nextMonth, F.tva.dueDayOfMonth);
  schedulePayment(state, { kind: 'tva', label: `TVA du T${d.quarter + 1} ${d.year}`, dueDay: due, amount: net });
}

// --- Cotisations sociales ----------------------------------------------------------

/** Base annuelle utilisée pour les cotisations provisoires. */
function provisionalBase(state) {
  const yearIdx = dateOf(state.time.day).yearIdx;
  const s = state.tax.social;
  const known = yearIdx >= STARTER_YEARS && s.lastIncome != null ? s.lastIncome : 0;
  return Math.max(known, s.chosenBase || 0);
}

function quarterlySocial(state) {
  return socialQuarterly(provisionalBase(state));
}

function socialProvisional(state) {
  const amount = quarterlySocial(state);
  const d = dateOf(state.time.day);
  // Indépendant : payé par l'entreprise (même patrimoine). SRL : par le dirigeant.
  const payer = state.meta.legal === 'srl' ? 'personal' : 'company';
  const pf = state.tax.social.provisionalFor;
  pf[d.yearIdx] = (pf[d.yearIdx] || 0) + amount;
  schedulePayment(state, { kind: 'cotisations', label: `Cotisations sociales T${d.quarter + 1}`, dueDay: state.time.day + 1, amount, payer });
}

// --- Annuel ---------------------------------------------------------------------------

function annualDue(yearIdx) {
  return dayOf(yearIdx + 1, 5, 30); // 30 juin N+1 (simplifié)
}

function regulDue(yearIdx) {
  return dayOf(yearIdx + 1, F.social.regularizationMonth, 15);
}

/** Résultat fiscal de l'année en cours (estimation possible en cours d'année). */
function yearResult(state, { projectFullYear = false } = {}) {
  const f = state.finance;
  const d = dateOf(state.time.day);
  const t = state.tax;
  const frac = projectFullYear ? Math.max(1, (d.dayOfYear + 1) / 360) : 1;
  const scale = projectFullYear ? 1 / Math.min(1, frac) : 1;
  const revenue = f.year.revenue * scale;
  const expenses = f.year.expenses * scale;
  const amort = amortizationForYear(state, d.yearIdx);
  const operating = Math.round(revenue - expenses - amort);
  if (state.meta.legal === 'srl') {
    const directorPay = t.year.directorPay * scale;
    const taxable = Math.max(0, operating - t.lossCarry);
    const reduced = reducedRateEligible(directorPay, taxable);
    const isoc = isocTax(taxable, reduced);
    // IPP du dirigeant sur sa rémunération
    const socialP = Math.max(t.year.socialPaidPersonal * scale, socialAnnualDue(socialBaseFromProfit(directorPay)));
    const net = Math.max(0, directorPay - socialP);
    const ipp = ippTax(net - directorFlatCosts(net)).total;
    return { legal: 'srl', revenue, expenses, amort, operating, taxable, reduced, isoc, directorPay, ipp, precompte: t.year.precompte * scale, social: socialP };
  }
  const socialPaid = t.year.socialPaidCompany * scale;
  const beforeSocial = operating;
  const taxable = Math.max(0, beforeSocial - socialPaid - t.lossCarry);
  const ipp = ippTax(taxable).total;
  return { legal: 'independant', revenue, expenses, amort, operating, taxable, ipp, social: socialPaid, beforeSocial };
}

/** Impôt estimé pour l'année en cours (projection sur 12 mois) — affiché dans Finances. */
function estimateYearTax(state) {
  const r = yearResult(state, { projectFullYear: true });
  if (r.legal === 'srl') return { company: r.isoc, personal: Math.max(0, r.ipp - r.precompte), result: r };
  const base = socialBaseFromProfit(r.beforeSocial);
  const regul = Math.max(0, socialAnnualDue(base) - r.social);
  return { company: r.ipp + regul, personal: 0, result: r, regul };
}

function yearEnd(state) {
  const t = state.tax;
  const d = dateOf(state.time.day);
  const r = yearResult(state);
  const result = { year: d.year, yearIdx: d.yearIdx, ...r };

  if (r.legal === 'srl') {
    // Perte reportée
    if (r.operating < 0) t.lossCarry += -r.operating;
    else t.lossCarry = Math.max(0, t.lossCarry - r.operating);
    if (r.isoc > 0) schedulePayment(state, { kind: 'impot', label: `ISOC ${d.year}`, dueDay: annualDue(d.yearIdx), amount: r.isoc });
    t.reserves += Math.max(0, r.operating - r.isoc);
    if (r.operating < 0) t.reserves = Math.max(0, t.reserves + r.operating);
    // IPP du dirigeant : solde après précompte et crédit dividendes
    const credit = dividendExemptionCredit(t.year.dividendsGross, t.year.dividendRateMax);
    const balance = r.ipp - t.year.precompte - credit;
    result.dividendCredit = credit;
    result.ippBalance = balance;
    if (balance !== 0) schedulePayment(state, { kind: 'impot', label: `Solde IPP ${d.year}`, dueDay: annualDue(d.yearIdx), amount: balance, payer: 'personal' });
    // Régularisation des cotisations sur la rémunération réelle
    const base = socialBaseFromProfit(r.directorPay);
    const regul = socialAnnualDue(base) - (t.social.provisionalFor[d.yearIdx] || 0);
    result.regul = regul;
    if (Math.abs(regul) > 1000) schedulePayment(state, { kind: 'regul', label: `Régularisation cotisations ${d.year}`, dueDay: regulDue(d.yearIdx), amount: regul, payer: 'personal' });
    t.social.lastIncome = base;
    if (!r.reduced && r.taxable > 0) log(state, 'tax', `ISOC ${d.year} au taux plein (25 %) : ta rémunération (${Math.round(r.directorPay / 100)} €) est sous le seuil requis pour le taux réduit.`, true);
  } else {
    if (r.beforeSocial - r.social < 0) t.lossCarry += -(r.beforeSocial - r.social);
    else t.lossCarry = Math.max(0, t.lossCarry - (r.beforeSocial - r.social));
    const credit = dividendExemptionCredit(t.year.dividendsGross, t.year.dividendRateMax);
    const ipp = r.ipp - credit;
    result.dividendCredit = credit;
    if (ipp !== 0) schedulePayment(state, { kind: 'impot', label: `IPP ${d.year}`, dueDay: annualDue(d.yearIdx), amount: ipp });
    const base = socialBaseFromProfit(r.beforeSocial);
    const regul = socialAnnualDue(base) - (t.social.provisionalFor[d.yearIdx] || 0);
    result.regul = regul;
    if (Math.abs(regul) > 1000) {
      schedulePayment(state, { kind: 'regul', label: `Régularisation cotisations ${d.year}`, dueDay: regulDue(d.yearIdx), amount: regul });
      if (regul > 300_000) log(state, 'tax', `Ta caisse d'assurances sociales calcule une régularisation de ${Math.round(regul / 100)} € pour ${d.year}, payable le ${formatDate(regulDue(d.yearIdx))}. Prévois-la !`, true);
    }
    t.social.lastIncome = base;
  }
  delete t.social.provisionalFor[d.yearIdx - 2];
  t.results.push(result);
  if (t.results.length > 60) t.results.shift();
  t.year = { socialPaidCompany: 0, socialPaidPersonal: 0, precompte: 0, dividendsGross: 0, dividendRateMax: 0, directorPay: 0 };
  state.finance.vatYearTurnover = 0;
  const total = (result.isoc || 0) + Math.max(0, result.ippBalance ?? result.ipp ?? 0);
  log(state, 'tax', `Clôture ${d.year} : résultat ${Math.round(r.operating / 100)} €, impôt calculé ${Math.round(total / 100)} € exigible le ${formatDate(annualDue(d.yearIdx))}.`, true);
}

function quarterEnd(state) {
  if (!state.finance.franchise) vatDeclaration(state);
  else {
    state.finance.vat.collected = 0;
    state.finance.vat.deductible = 0;
  }
  socialProvisional(state);
}

/** Échéances à venir (pour l'interface et les bots). */
function upcoming(state, days = 400) {
  return state.tax.schedule.filter((s) => s.dueDay <= state.time.day + days);
}
return __exports;
})();

// ---- src/engine/systems/living.js ----
__m["src/engine/systems/living.js"] = (function () {
const __exports = {};
__def(__exports, { "monthEnd": () => monthEnd });
// Coût de la vie du dirigeant (après rémunération et impôts du mois).

const { endOfMonthLiving } = __m["src/engine/systems/owner.js"];

function monthEnd(state) {
  endOfMonthLiving(state);
}
return __exports;
})();

// ---- src/data/advice.js ----
__m["src/data/advice.js"] = (function () {
const __exports = {};
__def(__exports, { "ADVICE": () => ADVICE });
// Conseils pédagogiques du post-mortem, par cause de faillite.

const ADVICE = {
  tva: {
    title: 'La TVA du trimestre',
    advice:
      'La TVA que tu factures n’est pas à toi : tu la collectes pour l’État et tu la reverses chaque trimestre. Mets-la de côté dès l’encaissement (un compte séparé est idéal). Regarde « TVA à reverser » dans l’onglet Finances.',
  },
  impot: {
    title: 'L’impôt annuel',
    advice:
      'L’impôt sur le bénéfice arrive des mois après la fin de l’année. Une année rentable crée une grosse facture l’année suivante. Provisionne environ 30 à 40 % du bénéfice (l’estimation est affichée dans Finances).',
  },
  cotisations: {
    title: 'Les cotisations sociales',
    advice:
      'Les cotisations provisoires d’un starter sont basses, puis régularisées sur ton revenu réel : le rattrapage peut être violent. Augmente tes provisionnelles quand ton bénéfice grimpe.',
  },
  rentabilite: {
    title: 'Une activité pas rentable',
    advice:
      'Tes charges dépassaient tes recettes. Vérifie ta marge : prix trop bas, coûts fixes trop élevés ou capacité inutilisée. Le panneau « Pourquoi ? » montre ce qui freine la demande.',
  },
  salaires: {
    title: 'Une masse salariale trop lourde',
    advice:
      'Un salarié coûte environ 1,35 fois son brut. Recrute quand la demande dépasse durablement ta capacité, pas avant, et vérifie que chaque poste rapporte plus qu’il ne coûte.',
  },
  dette: {
    title: 'Le poids de la dette',
    advice:
      'Les mensualités d’un prêt tombent même quand les ventes baissent. Emprunte pour un investissement qui rapporte, avec une mensualité couverte au moins 1,5 fois par ton bénéfice.',
  },
  stock: {
    title: 'Trop d’argent dans le stock',
    advice:
      'Le stock, c’est du cash immobilisé. Commande au rythme des ventes et surveille les ruptures ET les invendus.',
  },
  investissement: {
    title: 'Des investissements trop rapides',
    advice:
      'Une amélioration se rentabilise sur des mois. Garde une réserve de trésorerie (2-3 mois de charges) avant d’investir.',
  },
  imprevus: {
    title: 'Des imprévus non couverts',
    advice:
      'Amendes, pannes et litiges arrivent toujours. Une réserve de sécurité et des process solides (comptable, hygiène, contrats) limitent la casse.',
  },
  prelevements: {
    title: 'Des prélèvements trop élevés',
    advice:
      'Tu t’es payé plus que ce que l’entreprise gagnait. Ajuste ta rémunération au bénéfice réel, surtout les premières années.',
  },
  impayes: {
    title: 'Des clients qui ne paient pas',
    advice:
      'Un chiffre d’affaires non encaissé ne paie pas les factures. Demande un acompte, relance vite et évite de dépendre d’un seul gros client.',
  },
  demande: {
    title: 'Une demande en chute',
    advice:
      'Ton chiffre d’affaires a fortement baissé. Surveille la concurrence (onglet Marché), ta réputation et la saisonnalité, et réduis tes charges dès les premiers signes.',
  },
};
return __exports;
})();

// ---- src/engine/postmortem.js ----
__m["src/engine/postmortem.js"] = (function () {
const __exports = {};
__def(__exports, { "buildPostMortem": () => buildPostMortem });
// Post-mortem pédagogique : pourquoi l'entreprise a-t-elle fait faillite ?
// On regarde les sorties de cash des 4 derniers mois par catégorie, la
// rentabilité et l'évolution de l'activité, puis on classe les causes.

const { CATEGORIES } = __m["src/data/economy.js"];
const { ADVICE } = __m["src/data/advice.js"];

function sumCats(history, n) {
  const out = {};
  for (const h of history.slice(-n)) for (const [k, v] of Object.entries(h.byCat || {})) out[k] = (out[k] || 0) + v;
  return out;
}

function buildPostMortem(state) {
  const h = state.finance.history;
  // On inclut le mois en cours (pas encore dans l'historique).
  const current = { ...state.finance.month, byCat: state.finance.month.byCat };
  const recent = [...h.slice(-3), current];
  const outs = sumCats(recent, 4);
  const revenue = recent.reduce((s, x) => s + (x.revenue || 0), 0);
  const expenses = recent.reduce((s, x) => s + (x.expenses || 0), 0);
  const causes = [];

  const add = (id, weight, detail) => causes.push({ id, weight, detail, ...ADVICE[id] });

  const taxLike = (outs.tva || 0);
  if (taxLike > 0) add('tva', taxLike, `${fmt(taxLike)} de TVA reversée sur la période.`);
  if (outs.impot) add('impot', outs.impot * 1.2, `${fmt(outs.impot)} d'impôt annuel payé.`);
  if (outs.cotisations) add('cotisations', outs.cotisations, `${fmt(outs.cotisations)} de cotisations sociales.`);
  if (revenue < expenses) add('rentabilite', (expenses - revenue) * 1.5, `Charges ${fmt(expenses)} pour ${fmt(revenue)} de CA : l'activité perdait de l'argent.`);
  const payroll = outs.salaires || 0;
  if (payroll > revenue * 0.55 && payroll > 0) add('salaires', payroll * 0.6, `Les salaires représentaient ${Math.round((payroll / Math.max(1, revenue)) * 100)} % du CA.`);
  if (outs.remboursement || outs.interets) add('dette', (outs.remboursement || 0) + (outs.interets || 0), `${fmt((outs.remboursement || 0) + (outs.interets || 0))} de remboursements et intérêts.`);
  if (outs.stock && outs.stock > revenue * 0.5) add('stock', outs.stock * 0.6, `${fmt(outs.stock)} immobilisés dans le stock.`);
  if (outs.investissement) add('investissement', outs.investissement * 0.8, `${fmt(outs.investissement)} investis en améliorations sur la période.`);
  if (outs.amendes || outs.evenements) add('imprevus', (outs.amendes || 0) + (outs.evenements || 0), `${fmt((outs.amendes || 0) + (outs.evenements || 0))} d'amendes et d'imprévus.`);
  if (outs.prelevement || outs.remuneration) {
    const d = (outs.prelevement || 0) + (outs.remuneration || 0);
    if (d > revenue * 0.4) add('prelevements', d * 0.7, `Tu t'es versé ${fmt(d)} alors que l'entreprise ne le permettait pas.`);
  }
  if (state.stats.badDebts > 0) add('impayes', state.stats.badDebts * 0.8, `${fmt(state.stats.badDebts)} de factures jamais payées.`);
  const prev = h.slice(-9, -3);
  if (prev.length >= 3) {
    const a = prev.reduce((s, x) => s + x.revenue, 0) / prev.length;
    const b = revenue / recent.length;
    if (b < a * 0.7) add('demande', (a - b) * 2, `Ton chiffre d'affaires mensuel est passé de ${fmt(a)} à ${fmt(b)}.`);
  }
  if (!causes.length) add('rentabilite', 1, 'Les recettes ne couvraient pas les dépenses.');
  causes.sort((x, y) => y.weight - x.weight);
  const top = causes.slice(0, 3);
  const totalOut = Object.values(outs).reduce((s, v) => s + v, 0);
  return {
    day: state.time.day,
    causes: top,
    outflows: Object.entries(outs)
      .map(([k, v]) => ({ cat: k, label: CATEGORIES[k] || k, amount: v, pct: totalOut ? v / totalOut : 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8),
    revenue,
    expenses,
    legal: state.meta.legal,
    seized: state.endgame.seized || 0,
  };
}

function fmt(c) {
  return `${Math.round(c / 100).toLocaleString('fr-BE')} €`;
}
return __exports;
})();

// ---- src/engine/systems/endgame.js ----
__m["src/engine/systems/endgame.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "daily": () => daily, "goBankrupt": () => goBankrupt });
// Fin de partie : défaut de paiement, faillite (et victoire, cf. passive.js).

const { DIFFICULTIES } = __m["src/data/difficulty.js"];
const { personalOut, receive } = __m["src/engine/ledger.js"];
const { log } = __m["src/engine/log.js"];
const { buildPostMortem } = __m["src/engine/postmortem.js"];

function init(state) {
  state.endgame = { distressDays: 0, maxDistress: 0, postmortem: null, wonDay: null, recoveredFromNegative: 0, wasNegative: false };
}

function daily(state) {
  if (state.status === 'bankrupt') return;
  const eg = state.endgame;
  const limit = -state.finance.overdraftLimit;
  // Indépendant : responsabilité illimitée → le patrimoine perso renfloue d'abord.
  if (state.cash < limit && state.meta.legal === 'independant' && state.personal.cash > 0) {
    const need = Math.min(state.personal.cash, limit - state.cash + 1);
    personalOut(state, need, 'renflouement');
    receive(state, need, 'apport');
    state.stats.apports = (state.stats.apports || 0) + need;
    log(state, 'bad', `Responsabilité illimitée : ${(need / 100).toFixed(0)} € de ton épargne personnelle renflouent l'entreprise.`);
  }
  if (state.cash < 0) eg.wasNegative = true;
  if (state.cash < limit) {
    eg.distressDays += 1;
    eg.maxDistress = Math.max(eg.maxDistress, eg.distressDays);
    state.flags.salaryLate = true;
    if (eg.distressDays === 1) {
      log(state, 'bad', 'Défaut de paiement ! Ta trésorerie dépasse le découvert autorisé. Trouve du cash (prêt, apport, ventes) avant la faillite.', true);
    }
    const grace = DIFFICULTIES[state.meta.difficulty].graceDays;
    if (eg.distressDays >= grace) goBankrupt(state);
  } else {
    if (eg.distressDays > 0) log(state, 'good', 'Tu es sorti du défaut de paiement.');
    eg.distressDays = 0;
    state.flags.salaryLate = false;
    if (eg.wasNegative && state.cash > 0) {
      eg.recoveredFromNegative += 1;
      eg.wasNegative = false;
    }
  }
}

function goBankrupt(state) {
  state.status = 'bankrupt';
  state.endgame.bankruptDay = state.time.day;
  if (state.meta.legal === 'independant') {
    // Les créanciers saisissent le patrimoine personnel (simplifié).
    state.endgame.seized = Math.max(0, state.personal.cash);
    state.personal.cash = Math.min(0, state.personal.cash);
  }
  state.endgame.postmortem = buildPostMortem(state);
  log(state, 'bad', 'Faillite prononcée par le tribunal de l’entreprise.', true);
}
return __exports;
})();

// ---- src/engine/actions.js ----
__m["src/engine/actions.js"] = (function () {
const __exports = {};
__def(__exports, { "registerActions": () => registerActions, "knownActions": () => knownActions, "applyAction": () => applyAction });
// Point d'entrée unique des décisions du joueur.
// Une action est un objet sérialisable { type, ...paramètres }.
// Chaque action réussie est ajoutée à state.actionLog avec le jour courant,
// ce qui permet de rejouer une partie (seed + actions) : voir docs/V2.md.

const { createRng } = __m["src/engine/rng.js"];
const { CONFIG } = __m["src/data/config.js"];

const HANDLERS = {};

/** Enregistre des gestionnaires d'actions : { type: (state, action, rng) => result }. */
function registerActions(map) {
  Object.assign(HANDLERS, map);
}

function knownActions() {
  return Object.keys(HANDLERS);
}

/**
 * Applique une action. Retourne { ok: boolean, message?: string }.
 * N'avance jamais le temps.
 */
function applyAction(state, action) {
  if (!action || typeof action.type !== 'string') return { ok: false, message: 'Action invalide.' };
  const h = HANDLERS[action.type];
  if (!h) return { ok: false, message: `Action inconnue : ${action.type}` };
  if (state.status === 'bankrupt' && !action.allowWhenOver) return { ok: false, message: 'La partie est terminée.' };
  const rng = createRng(state.rngState);
  let res;
  try {
    res = h(state, action, rng) || { ok: true };
  } catch (e) {
    return { ok: false, message: `Erreur : ${e.message}` };
  }
  state.rngState = rng.state;
  if (res.ok) {
    state.actionLog.push({ d: state.time.day, a: action });
    if (state.actionLog.length > CONFIG.actionLogMax) state.actionLog.shift();
  }
  return res;
}

registerActions({
  noop: () => ({ ok: true }),
});
return __exports;
})();

// ---- src/engine/commonActions.js ----
__m["src/engine/commonActions.js"] = (function () {
const __exports = {};
// Actions communes à tous les secteurs. Les actions propres à un secteur
// passent par { type: 'sector', name, ...params }.

const { registerActions } = __m["src/engine/actions.js"];
const { sectorModule } = __m["src/engine/sectors/index.js"];
const { buyUpgrade } = __m["src/engine/upgrades.js"];
const staff = __m["src/engine/systems/staff.js"];
const { personalOut, personalIn, receive, pay } = __m["src/engine/ledger.js"];
const loans = __m["src/engine/systems/loans.js"];
const { dividendRate } = __m["src/engine/taxmath.js"];
const { dateOf } = __m["src/engine/calendar.js"];
const { clamp } = __m["src/engine/money.js"];
const { log } = __m["src/engine/log.js"];

registerActions({
  sector(state, a, rng) {
    const m = sectorModule(state);
    const h = m.actions && m.actions[a.name];
    if (!h) return { ok: false, message: `Action de secteur inconnue : ${a.name}` };
    return h(state, a, rng) || { ok: true };
  },
  setMarketing(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.company.marketing = clamp(v, 0, 5_000_000);
    return { ok: true };
  },
  buyUpgrade(state, a) {
    const r = buyUpgrade(state, a.id);
    if (!r.ok) return { ok: false, message: r.reason };
    const m = sectorModule(state);
    if (m.onUpgrade) m.onUpgrade(state, a.id);
    return { ok: true };
  },
  hire(state, a) {
    return staff.hire(state, a.id);
  },
  fire(state, a) {
    return staff.fire(state, a.id);
  },
  train(state, a) {
    return staff.train(state, a.id);
  },
  raise(state, a) {
    return staff.raise(state, a.id, a.pct || 0.05);
  },
  postJobAd(state, a, rng) {
    return staff.postJobAd(state, rng, a.role);
  },
  setDraw(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.personal.draw = clamp(v, 0, 5_000_000);
    return { ok: true };
  },
  /** Apport personnel : compte perso → compte pro. */
  apport(state, a) {
    const v = Math.round(Number(a.value));
    if (!(v > 0)) return { ok: false, message: 'Montant invalide.' };
    if (v > state.personal.cash) return { ok: false, message: 'Pas assez d’argent sur ton compte personnel.' };
    personalOut(state, v, 'apport');
    receive(state, v, 'apport');
    state.stats.apports = (state.stats.apports || 0) + v;
    log(state, 'info', `Apport personnel de ${(v / 100).toFixed(0)} € dans l'entreprise.`);
    return { ok: true };
  },
  /** Le fondateur se retire de l'opérationnel (nécessite un gérant). */
  retire(state) {
    if (!state.staff.founder.active) return { ok: false, message: 'Tu es déjà retiré·e de l’opérationnel.' };
    if (!staff.hasManager(state)) return { ok: false, message: 'Il faut d’abord recruter un·e gérant·e compétent·e.' };
    state.staff.founder.active = false;
    state.stats.retiredDay = state.time.day;
    log(state, 'good', 'Tu te retires de l’opérationnel : ton gérant dirige désormais l’entreprise.', true);
    return { ok: true };
  },
  requestLoan(state, a) {
    return loans.requestLoan(state, Number(a.amount), Number(a.months));
  },
  repayLoan(state, a) {
    return loans.repayLoan(state, a.id);
  },
  seekInvestor(state, a, rng) {
    if (state.offers.investor) return { ok: false, message: 'Une offre est déjà sur la table.' };
    if ((state.stats.lastInvestorSearch ?? -999) > state.time.day - 90) return { ok: false, message: 'Les investisseurs ne te recevront pas avant 3 mois.' };
    state.stats.lastInvestorSearch = state.time.day;
    return loans.makeInvestorOffer(state, rng);
  },
  acceptInvestor(state) {
    return loans.acceptInvestor(state);
  },
  declineInvestor(state) {
    state.offers.investor = null;
    return { ok: true };
  },
  /** Base annuelle choisie pour les cotisations sociales provisoires (0 = automatique). */
  setSocialBase(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v) || v < 0) return { ok: false, message: 'Valeur invalide.' };
    state.tax.social.chosenBase = Math.min(v, 50_000_000);
    return { ok: true };
  },
  /** Dividende brut décidé par l'assemblée générale (SRL). */
  payDividend(state, a) {
    if (state.meta.legal !== 'srl') return { ok: false, message: 'Seule une société verse des dividendes.' };
    const amount = Math.round(Number(a.amount));
    if (!(amount >= 10_000)) return { ok: false, message: 'Montant minimum : 100 €.' };
    if (amount > state.tax.reserves) return { ok: false, message: 'Pas assez de bénéfices reportés (réserves) : on ne distribue que des bénéfices déjà taxés.' };
    if (amount > state.cash) return { ok: false, message: 'Trésorerie insuffisante (test de liquidité).' };
    const rate = dividendRate(dateOf(state.time.day).yearIdx);
    pay(state, amount, 'dividende');
    state.tax.reserves -= amount;
    const own = state.ownership.founder;
    const mine = Math.round(amount * own);
    const tax = Math.round(mine * rate);
    personalIn(state, mine - tax, 'dividendes');
    state.tax.year.dividendsGross += mine;
    state.tax.year.dividendRateMax = Math.max(state.tax.year.dividendRateMax, rate);
    state.stats.dividendsYear = (state.stats.dividendsYear || 0) + (amount - mine);
    state.stats.dividendsTotal = (state.stats.dividendsTotal || 0) + mine - tax;
    log(state, 'good', `Dividende de ${Math.round(amount / 100)} € brut : tu reçois ${Math.round((mine - tax) / 100)} € net (précompte ${Math.round(rate * 100)} %).`, true);
    return { ok: true };
  },
  unretire(state) {
    if (state.staff.founder.active) return { ok: false, message: 'Tu travailles déjà dans l’entreprise.' };
    if (staff.seatsAvailable(state) <= 0) return { ok: false, message: 'Plus de place dans les locaux.' };
    state.staff.founder.active = true;
    log(state, 'info', 'Tu reprends du service dans l’entreprise.');
    return { ok: true };
  },
});
return __exports;
})();

// ---- src/engine/hooks.js ----
__m["src/engine/hooks.js"] = (function () {
const __exports = {};
__def(__exports, { "SYSTEMS": () => SYSTEMS, "initHooks": () => initHooks });
// Registre ordonné des systèmes du moteur.
// Chaque système peut exposer : init(state, opts, diff, rng), daily(state, rng),
// monthEnd(state, rng), quarterEnd(state, rng), yearEnd(state, rng), endOfDay(state, rng).
// L'ordre du tableau est l'ordre d'exécution (important pour le déterminisme) :
//   monde → entreprise → secteur → équipe → prêts → dirigeant → fiscalité → coût de la vie → finance → fin de partie

const core = __m["src/engine/systems/core.js"];
const company = __m["src/engine/systems/company.js"];
const sector = __m["src/engine/systems/sector.js"];
const staff = __m["src/engine/systems/staff.js"];
const loans = __m["src/engine/systems/loans.js"];
const owner = __m["src/engine/systems/owner.js"];
const tax = __m["src/engine/systems/tax.js"];
const living = __m["src/engine/systems/living.js"];
const finance = __m["src/engine/systems/finance.js"];
const endgame = __m["src/engine/systems/endgame.js"];


const SYSTEMS = [core, company, sector, staff, loans, owner, tax, living, finance, endgame];

function initHooks() {
  return SYSTEMS.filter((s) => s.init).map((s) => s.init);
}
return __exports;
})();

// ---- src/engine/state.js ----
__m["src/engine/state.js"] = (function () {
const __exports = {};
__def(__exports, { "DEFAULT_OPTIONS": () => DEFAULT_OPTIONS, "newGame": () => newGame });
// Création d'une nouvelle partie. L'état produit est un objet JSON pur.

const { CONFIG } = __m["src/data/config.js"];
const { DIFFICULTIES } = __m["src/data/difficulty.js"];
const { hashSeed, createRng } = __m["src/engine/rng.js"];
const { initHooks } = __m["src/engine/hooks.js"];

const DEFAULT_OPTIONS = {
  sector: 'agence',
  legal: 'independant', // 'independant' | 'srl'
  difficulty: 'normal',
  companyName: 'Ma Boîte',
  founderName: 'Alex',
  seed: '',
  vatFranchise: false,
  apportPct: 0.7, // part du capital de départ versée sur le compte pro
  metier: null, // sous-type pour l'artisan
};

/**
 * Crée l'état initial d'une partie.
 * @param {object} opts voir DEFAULT_OPTIONS ; `createdAt` (ISO) et `gameId` sont fournis par l'UI.
 */
function newGame(opts = {}) {
  const o = { ...DEFAULT_OPTIONS, ...opts };
  if (!DIFFICULTIES[o.difficulty]) throw new Error(`Difficulté inconnue : ${o.difficulty}`);
  const seed = o.seed && String(o.seed).trim() ? String(o.seed).trim() : `${o.companyName}|${o.createdAt || ''}`;
  const seedHash = hashSeed(seed);
  const diff = DIFFICULTIES[o.difficulty];

  const state = {
    meta: {
      saveVersion: CONFIG.saveVersion,
      gameId: o.gameId || `g-${seedHash.toString(36)}`,
      seed,
      createdAt: o.createdAt || null,
      sector: o.sector,
      metier: o.metier,
      legal: o.legal,
      difficulty: o.difficulty,
      companyName: String(o.companyName).slice(0, 40) || 'Ma Boîte',
      founderName: String(o.founderName).slice(0, 30) || 'Alex',
    },
    time: { day: 0, frac: 0 },
    rngState: seedHash,
    status: 'playing', // 'playing' | 'won' | 'sandbox' | 'bankrupt'
    cash: 0,
    log: [],
    logSeq: 0,
    actionLog: [],
    flags: {},
    stats: {},
  };

  // Chaque système ajoute sa partie de l'état (voir hooks.js).
  const rng = createRng(state.rngState);
  for (const h of initHooks()) h(state, o, diff, rng);
  state.rngState = rng.state;
  return state;
}
return __exports;
})();

// ---- src/engine/tick.js ----
__m["src/engine/tick.js"] = (function () {
const __exports = {};
__def(__exports, { "isBlocked": () => isBlocked, "tick": () => tick, "advance": () => advance, "stepDay": () => stepDay });
// Boucle de temps du moteur.
//
// tick(state, dtDays, rng) accumule une durée (en jours de jeu, fraction
// possible) et simule chaque JOUR complet. Découper le temps en petits ou
// grands morceaux donne donc exactement le même résultat.

const { createRng } = __m["src/engine/rng.js"];
const { SYSTEMS } = __m["src/engine/hooks.js"];
const { dateOf, DAYS_PER_MONTH } = __m["src/engine/calendar.js"];

/** Nombre maximal de jours simulés par appel (protection). */
const MAX_DAYS_PER_CALL = 3700;
const EPS = 1e-7;

/** Vrai si le moteur attend une décision du joueur (événement à choix). */
function isBlocked(state) {
  return state.status === 'bankrupt' || (state.events && state.events.pending.length > 0);
}

/**
 * Avance le temps de `dtDays` jours de jeu.
 * @returns {object} le même objet state (muté)
 */
function tick(state, dtDays, rng) {
  if (!(dtDays > 0) || isBlocked(state)) return state;
  state.time.frac += dtDays;
  let n = 0;
  // EPS : 10 × 0,1 doit donner exactement 1 jour malgré les arrondis flottants.
  while (state.time.frac >= 1 - EPS && n < MAX_DAYS_PER_CALL) {
    state.time.frac = Math.max(0, state.time.frac - 1);
    stepDay(state, rng);
    n++;
    if (isBlocked(state)) {
      state.time.frac = 0; // le reste du temps est « perdu » : le jeu est en pause
      break;
    }
  }
  state.rngState = rng.state;
  return state;
}

/** Raccourci : crée le rng depuis l'état, avance, réécrit l'état du rng. */
function advance(state, dtDays) {
  const rng = createRng(state.rngState);
  return tick(state, dtDays, rng);
}

/** Simule une journée complète. */
function stepDay(state, rng) {
  for (const s of SYSTEMS) if (s.daily) s.daily(state, rng);

  const d = dateOf(state.time.day);
  if (d.dom === DAYS_PER_MONTH) {
    for (const s of SYSTEMS) if (s.monthEnd) s.monthEnd(state, rng);
    if (d.month % 3 === 2) for (const s of SYSTEMS) if (s.quarterEnd) s.quarterEnd(state, rng);
    if (d.month === 11) for (const s of SYSTEMS) if (s.yearEnd) s.yearEnd(state, rng);
  }
  for (const s of SYSTEMS) if (s.endOfDay) s.endOfDay(state, rng);
  state.time.day += 1;
}
return __exports;
})();

// ---- src/engine/migrations.js ----
__m["src/engine/migrations.js"] = (function () {
const __exports = {};
__def(__exports, { "MIGRATIONS": () => MIGRATIONS, "migrate": () => migrate });
// Migrations du format de sauvegarde.
// MIGRATIONS[v] transforme un état de version v en version v+1.
// Pour changer le format : incrémenter CONFIG.saveVersion et ajouter une entrée.

const { CONFIG } = __m["src/data/config.js"];

const MIGRATIONS = {
  // Exemple de migration (version 0 = prototype sans saveVersion) :
  0: (s) => {
    s.meta = s.meta || {};
    s.meta.saveVersion = 1;
    s.flags = s.flags || {};
    return s;
  },
};

/**
 * Amène un état à la version courante. Lève une erreur si la sauvegarde
 * vient d'une version plus récente que le jeu.
 */
function migrate(state, migrations = MIGRATIONS, target = CONFIG.saveVersion) {
  if (!state || typeof state !== 'object') throw new Error('Sauvegarde vide ou illisible.');
  let v = state.meta && Number.isInteger(state.meta.saveVersion) ? state.meta.saveVersion : 0;
  if (v > target) throw new Error(`Sauvegarde créée par une version plus récente du jeu (v${v}).`);
  while (v < target) {
    const m = migrations[v];
    if (!m) throw new Error(`Aucune migration depuis la version ${v}.`);
    state = m(state);
    v += 1;
    state.meta.saveVersion = v;
  }
  return state;
}
return __exports;
})();

// ---- src/engine/index.js ----
__m["src/engine/index.js"] = (function () {
const __exports = {};
__def(__exports, { "newGame": () => __m["src/engine/state.js"]["newGame"], "DEFAULT_OPTIONS": () => __m["src/engine/state.js"]["DEFAULT_OPTIONS"], "tick": () => __m["src/engine/tick.js"]["tick"], "advance": () => __m["src/engine/tick.js"]["advance"], "stepDay": () => __m["src/engine/tick.js"]["stepDay"], "isBlocked": () => __m["src/engine/tick.js"]["isBlocked"], "applyAction": () => __m["src/engine/actions.js"]["applyAction"], "knownActions": () => __m["src/engine/actions.js"]["knownActions"], "createRng": () => __m["src/engine/rng.js"]["createRng"], "hashSeed": () => __m["src/engine/rng.js"]["hashSeed"], "migrate": () => __m["src/engine/migrations.js"]["migrate"], "calendar": () => __m["src/engine/calendar.js"], "money": () => __m["src/engine/money.js"] });
// API publique du moteur. L'interface et les outils n'importent que ce fichier.
return __exports;
})();

// ---- src/storage/SaveAdapter.js ----
__m["src/storage/SaveAdapter.js"] = (function () {
const __exports = {};
__def(__exports, { "SAVE_FORMAT": () => SAVE_FORMAT, "SaveError": () => SaveError, "SaveAdapter": () => SaveAdapter, "summarize": () => summarize, "wrap": () => wrap, "unwrap": () => unwrap, "SLOTS": () => SLOTS });
// Interface de sauvegarde. Toutes les méthodes renvoient des Promises pour
// qu'un adaptateur distant (cloud, V2) puisse respecter le même contrat.
//
// Une sauvegarde est une « enveloppe » :
//   { format, saveVersion, savedAt, summary, state }
// summary contient de quoi afficher la liste sans charger tout l'état.

const { migrate } = __m["src/engine/migrations.js"];
const { CONFIG } = __m["src/data/config.js"];

const SAVE_FORMAT = 'entrepreneur-tycoon';

class SaveError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'SaveError';
    this.code = code; // 'corrupt' | 'quota' | 'notfound' | 'format' | 'version' | 'unavailable'
  }
}

/** Contrat à implémenter par chaque adaptateur. */
class SaveAdapter {
  /** @returns {Promise<void>} */
  async save(slot, state, savedAt) { throw new Error('non implémenté'); }
  /** @returns {Promise<object>} l'état migré */
  async load(slot) { throw new Error('non implémenté'); }
  /** @returns {Promise<Array<{slot, summary, savedAt, error?}>>} */
  async list() { throw new Error('non implémenté'); }
  /** @returns {Promise<void>} */
  async delete(slot) { throw new Error('non implémenté'); }
  /** @returns {Promise<string>} JSON de l'enveloppe */
  async export(slot) { throw new Error('non implémenté'); }
  /** @returns {Promise<object>} l'état importé (et sauvegardé dans slot) */
  async import(json, slot) { throw new Error('non implémenté'); }
}

/** Résumé affiché dans la liste des sauvegardes. */
function summarize(state) {
  return {
    gameId: state.meta.gameId,
    companyName: state.meta.companyName,
    founderName: state.meta.founderName,
    sector: state.meta.sector,
    legal: state.meta.legal,
    difficulty: state.meta.difficulty,
    day: state.time.day,
    cash: state.cash,
    status: state.status,
  };
}

/** Construit l'enveloppe JSON d'une sauvegarde. */
function wrap(state, savedAt) {
  return {
    format: SAVE_FORMAT,
    saveVersion: state.meta.saveVersion,
    savedAt: savedAt || null,
    summary: summarize(state),
    state,
  };
}

/**
 * Lit une enveloppe (chaîne ou objet), vérifie et migre.
 * Lève SaveError en cas de problème.
 */
function unwrap(raw) {
  let env = raw;
  if (typeof raw === 'string') {
    try {
      env = JSON.parse(raw);
    } catch {
      throw new SaveError('Le fichier de sauvegarde est corrompu (JSON invalide).', 'corrupt');
    }
  }
  if (!env || typeof env !== 'object') throw new SaveError('Sauvegarde vide.', 'corrupt');
  if (env.format !== SAVE_FORMAT || !env.state) {
    throw new SaveError("Ce fichier n'est pas une sauvegarde d'Entrepreneur Tycoon.", 'format');
  }
  const st = env.state;
  if (!st.meta || !st.time || typeof st.time.day !== 'number' || !Number.isFinite(st.cash)) {
    throw new SaveError('La sauvegarde est incomplète ou corrompue.', 'corrupt');
  }
  try {
    return migrate(st);
  } catch (e) {
    throw new SaveError(e.message, 'version');
  }
}

const SLOTS = ['auto', ...Array.from({ length: CONFIG.saveSlots }, (_, i) => String(i + 1))];
return __exports;
})();

// ---- src/storage/LocalStorageAdapter.js ----
__m["src/storage/LocalStorageAdapter.js"] = (function () {
const __exports = {};
__def(__exports, { "LocalStorageAdapter": () => LocalStorageAdapter });
// Sauvegarde dans le localStorage du navigateur.
// Clés : entrepreneur-tycoon:slot:<auto|1|2|3>

const { SaveAdapter, SaveError, wrap, unwrap, SLOTS } = __m["src/storage/SaveAdapter.js"];

const PREFIX = 'entrepreneur-tycoon:slot:';

class LocalStorageAdapter extends SaveAdapter {
  /** @param {Storage} [storage] injectable pour les tests */
  constructor(storage) {
    super();
    this.storage = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
  }

  _check() {
    if (!this.storage) throw new SaveError('Le stockage local est indisponible (navigation privée ?).', 'unavailable');
  }

  _checkSlot(slot) {
    if (!SLOTS.includes(String(slot))) throw new SaveError(`Emplacement inconnu : ${slot}`, 'notfound');
  }

  async save(slot, state, savedAt) {
    this._check();
    this._checkSlot(slot);
    const json = JSON.stringify(wrap(state, savedAt));
    try {
      this.storage.setItem(PREFIX + slot, json);
    } catch (e) {
      throw new SaveError("Espace de stockage plein : supprime une sauvegarde ou exporte-la en fichier.", 'quota');
    }
  }

  async load(slot) {
    this._check();
    this._checkSlot(slot);
    const raw = this.storage.getItem(PREFIX + slot);
    if (raw == null) throw new SaveError('Emplacement vide.', 'notfound');
    return unwrap(raw);
  }

  async list() {
    this._check();
    const out = [];
    for (const slot of SLOTS) {
      const raw = this.storage.getItem(PREFIX + slot);
      if (raw == null) {
        out.push({ slot, empty: true });
        continue;
      }
      try {
        const env = JSON.parse(raw);
        out.push({ slot, summary: env.summary || null, savedAt: env.savedAt || null });
      } catch {
        out.push({ slot, error: 'Sauvegarde corrompue' });
      }
    }
    return out;
  }

  async delete(slot) {
    this._check();
    this._checkSlot(slot);
    this.storage.removeItem(PREFIX + slot);
  }

  async export(slot) {
    this._check();
    this._checkSlot(slot);
    const raw = this.storage.getItem(PREFIX + slot);
    if (raw == null) throw new SaveError('Emplacement vide.', 'notfound');
    unwrap(raw); // vérifie avant d'exporter
    return raw;
  }

  async import(json, slot) {
    const state = unwrap(json);
    await this.save(slot, state, typeof json === 'string' ? JSON.parse(json).savedAt : json.savedAt);
    return state;
  }
}
return __exports;
})();

// ---- src/ui/loop.js ----
__m["src/ui/loop.js"] = (function () {
const __exports = {};
__def(__exports, { "GameLoop": () => GameLoop });
// Boucle temps réel : convertit le temps écoulé en jours de jeu et appelle
// le moteur. Vise ~30 images/s (largement suffisant, économe pour Chromebook).

const { CONFIG } = __m["src/data/config.js"];
const { DAYS_PER_MONTH } = __m["src/engine/calendar.js"];

class GameLoop {
  /**
   * @param {object} p
   * @param {() => number} p.getSpeed multiplicateur courant (0 = pause)
   * @param {(dtDays:number) => void} p.onAdvance
   * @param {(dtSec:number) => void} p.onFrame appelé à chaque image (rendu)
   */
  constructor({ getSpeed, onAdvance, onFrame }) {
    this.getSpeed = getSpeed;
    this.onAdvance = onAdvance;
    this.onFrame = onFrame;
    this.last = 0;
    this.running = false;
    this.frameInterval = 1000 / 30;
    this.acc = 0;
    this._raf = this._raf.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._raf);
  }

  stop() {
    this.running = false;
  }

  _raf(now) {
    if (!this.running) return;
    requestAnimationFrame(this._raf);
    let dtMs = now - this.last;
    if (dtMs < this.frameInterval - 1) return; // limite à ~30 fps
    this.last = now;
    // Onglet en arrière-plan ou machine lente : on plafonne le delta.
    dtMs = Math.min(dtMs, 250);
    const dtSec = dtMs / 1000;
    const speed = this.getSpeed();
    if (speed > 0) {
      const daysPerSec = DAYS_PER_MONTH / CONFIG.secondsPerMonth;
      const dtDays = Math.min(dtSec * daysPerSec * speed, CONFIG.maxDaysPerFrame);
      this.onAdvance(dtDays);
    }
    this.onFrame(dtSec);
  }
}
return __exports;
})();

// ---- src/ui/dom.js ----
__m["src/ui/dom.js"] = (function () {
const __exports = {};
__def(__exports, { "esc": () => esc, "$": () => $, "$$": () => $$, "actBtn": () => actBtn, "uiBtn": () => uiBtn, "help": () => help, "eurInput": () => eurInput, "rangeInput": () => rangeInput, "selectInput": () => selectInput, "bar": () => bar });
// Petits utilitaires DOM.

/** Échappe une chaîne pour l'insérer dans du HTML. */
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

/** Bouton qui déclenche une action moteur (via délégation d'événements). */
function actBtn(label, action, { cls = '', disabled = false, title = '' } = {}) {
  return `<button type="button" class="btn ${cls}" data-act='${esc(JSON.stringify(action))}' ${disabled ? 'disabled' : ''} ${title ? `title="${esc(title)}"` : ''}>${label}</button>`;
}

/** Bouton qui déclenche une commande d'interface (ouvrir une fenêtre…). */
function uiBtn(label, cmd, { cls = '', disabled = false, title = '', arg = '' } = {}) {
  return `<button type="button" class="btn ${cls}" data-ui="${esc(cmd)}" data-arg="${esc(arg)}" ${disabled ? 'disabled' : ''} ${title ? `title="${esc(title)}"` : ''}>${label}</button>`;
}

/** Petite icône « ? » qui ouvre une notion du glossaire. */
function help(term) {
  return `<button type="button" class="help" data-ui="glossary" data-arg="${esc(term)}" aria-label="Explication : ${esc(term)}">?</button>`;
}

/**
 * Champ numérique en euros relié à une action. L'action reçoit value en centimes.
 * action = { type, name? } ; on y ajoute value.
 */
function eurInput(id, cents, action, { min = 0, max = 1e9, step = 1, label = '' } = {}) {
  return `<label class="field"><span>${label}</span><span class="input-eur"><input type="number" id="${esc(id)}" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${Math.round(cents) / 100}" data-input='${esc(JSON.stringify(action))}' data-scale="100"><span>€</span></span></label>`;
}

/** Curseur relié à une action (valeur brute ou multipliée par scale). */
function rangeInput(id, value, action, { min = 0, max = 100, step = 1, scale = 1, label = '', display = '' } = {}) {
  return `<label class="field range"><span>${label} <output for="${esc(id)}">${display}</output></span><input type="range" id="${esc(id)}" min="${min}" max="${max}" step="${step}" value="${value / scale}" data-input='${esc(JSON.stringify(action))}' data-scale="${scale}"></label>`;
}

function selectInput(id, value, options, action, { label = '' } = {}) {
  const opts = options.map((o) => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
  return `<label class="field"><span>${label}</span><select id="${esc(id)}" data-input='${esc(JSON.stringify(action))}' data-raw="1">${opts}</select></label>`;
}

/** Barre de progression accessible. */
function bar(value, max = 1, cls = '') {
  const p = Math.max(0, Math.min(1, max ? value / max : 0));
  return `<span class="bar ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p * 100)}"><span style="width:${(p * 100).toFixed(1)}%"></span></span>`;
}
return __exports;
})();

// ---- src/ui/toast.js ----
__m["src/ui/toast.js"] = (function () {
const __exports = {};
__def(__exports, { "toast": () => toast });
// Notifications non intrusives (coin de l'écran, disparaissent seules).

const { esc } = __m["src/ui/dom.js"];

const MAX = 4;

function toast(text, kind = 'info', ms = 4500) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  const el = document.createElement('div');
  el.className = `toast toast-${kind}`;
  el.innerHTML = esc(text);
  root.appendChild(el);
  while (root.children.length > MAX) root.removeChild(root.firstChild);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 400);
  }, ms);
}
return __exports;
})();

// ---- src/ui/modal.js ----
__m["src/ui/modal.js"] = (function () {
const __exports = {};
__def(__exports, { "openModal": () => openModal, "closeModal": () => closeModal, "isModalOpen": () => isModalOpen, "modalBody": () => modalBody });
// Fenêtres modales accessibles (focus piégé, Échap pour fermer si autorisé).

let current = null;

/**
 * Ouvre une modale.
 * @param {object} o
 * @param {string} o.title
 * @param {string} o.html contenu
 * @param {boolean} [o.closable=true]
 * @param {string} [o.cls]
 * @param {(root:HTMLElement)=>void} [o.onMount]
 * @param {()=>void} [o.onClose]
 */
function openModal({ title, html, closable = true, cls = '', onMount, onClose }) {
  closeModal(true);
  const root = document.getElementById('modal-root');
  const prevFocus = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = 'modal-backdrop';
  wrap.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-head"><h2 id="modal-title" class="pixel-title">${title}</h2>${closable ? '<button type="button" class="btn btn-icon modal-x" aria-label="Fermer">✕</button>' : ''}</div>
      <div class="modal-body">${html}</div>
    </div>`;
  root.appendChild(wrap);
  current = { wrap, closable, onClose, prevFocus };
  if (closable) {
    wrap.querySelector('.modal-x').addEventListener('click', () => closeModal());
    wrap.addEventListener('mousedown', (e) => {
      if (e.target === wrap) closeModal();
    });
  }
  wrap.addEventListener('keydown', trapFocus);
  if (onMount) onMount(wrap.querySelector('.modal'));
  const f = wrap.querySelector('[autofocus], .modal-body button, .modal-body input, .modal-body select, .modal-x');
  if (f) f.focus();
  return wrap.querySelector('.modal');
}

function trapFocus(e) {
  if (e.key !== 'Tab' || !current) return;
  const items = Array.from(current.wrap.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(
    (x) => !x.disabled && x.offsetParent !== null,
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    last.focus();
    e.preventDefault();
  } else if (!e.shiftKey && document.activeElement === last) {
    first.focus();
    e.preventDefault();
  }
}

function closeModal(force = false) {
  if (!current) return false;
  if (!current.closable && !force) return false;
  const c = current;
  current = null;
  c.wrap.remove();
  if (c.onClose) c.onClose();
  if (c.prevFocus && c.prevFocus.focus) c.prevFocus.focus();
  return true;
}

function isModalOpen() {
  return current !== null;
}

function modalBody() {
  return current ? current.wrap.querySelector('.modal-body') : null;
}
return __exports;
})();

// ---- src/ui/format.js ----
__m["src/ui/format.js"] = (function () {
const __exports = {};
__def(__exports, { "eur": () => eur, "eurShort": () => eurShort, "num": () => num, "pct": () => pct, "factor": () => factor, "byFmt": () => byFmt });
// Formatage à la belge : 12 345,67 €

const nf2 = new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('fr-BE', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Intl utilise une espace fine insécable comme séparateur de milliers ; on la
// remplace par une espace insécable classique, mieux supportée par les polices.
function clean(s) {
  return s.replace(/ /g, ' ');
}

/** Centimes → « 12 345,67 € ». opts.decimals = false pour arrondir à l'euro. */
function eur(cents, { decimals = true, sign = false } = {}) {
  if (!Number.isFinite(cents)) return '—';
  const v = cents / 100;
  const s = clean(decimals ? nf2.format(v) : nf0.format(Math.round(v)));
  return `${sign && cents > 0 ? '+' : ''}${s} €`;
}

/** Version courte pour la barre du haut : 12,3 k€ / 1,25 M€. */
function eurShort(cents) {
  if (!Number.isFinite(cents)) return '—';
  const v = cents / 100;
  const a = Math.abs(v);
  if (a >= 1e6) return `${clean(nf1.format(v / 1e6))} M€`;
  if (a >= 1e4) return `${clean(nf1.format(v / 1e3))} k€`;
  return `${clean(nf0.format(Math.round(v)))} €`;
}

function num(x, digits = 0) {
  if (!Number.isFinite(x)) return '—';
  return clean(digits === 1 ? nf1.format(x) : digits === 2 ? nf2.format(x) : nf0.format(x));
}

function pct(x, digits = 0) {
  if (!Number.isFinite(x)) return '—';
  return `${num(x * 100, digits)} %`;
}

/** Multiplicateur lisible : 1,15 → « +15 % », 0,8 → « −20 % ». */
function factor(x) {
  if (!Number.isFinite(x)) return '—';
  const d = Math.round((x - 1) * 100);
  if (d === 0) return '±0 %';
  return `${d > 0 ? '+' : '−'}${Math.abs(d)} %`;
}

/** Formatage générique selon un code (utilisé par les KPI des secteurs). */
function byFmt(value, fmt, suffix = '') {
  switch (fmt) {
    case 'eur':
      return eur(value, { decimals: false }) + suffix;
    case 'eur2':
      return eur(value) + suffix;
    case 'pct':
      return pct(value) + suffix;
    case 'num1':
      return num(value, 1) + suffix;
    case 'int':
    case 'num0':
    default:
      return num(Math.round(value)) + suffix;
  }
}
return __exports;
})();

// ---- src/ui/pixelfont.js ----
__m["src/ui/pixelfont.js"] = (function () {
const __exports = {};
__def(__exports, { "measure": () => measure, "drawText": () => drawText, "pixelTitle": () => pixelTitle, "mountPixelTitles": () => mountPixelTitles });
// Police pixel 5×7 maison (aucun fichier externe), dessinée sur canvas.
// Les titres utilisent cette police ; le texte courant reste en monospace
// système pour la lisibilité. Les accents sont dessinés au-dessus de la lettre.

const { esc } = __m["src/ui/dom.js"];

const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..#..'],
  ',': ['.....', '.....', '.....', '.....', '.....', '..#..', '.#...'],
  ':': ['.....', '..#..', '.....', '.....', '.....', '..#..', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  '€': ['..###', '.#...', '####.', '.#...', '####.', '.#...', '..###'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  "'": ['..#..', '..#..', '.....', '.....', '.....', '.....', '.....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
};

const ACCENTS = {
  acute: ['...#.', '..#..'],
  grave: ['.#...', '..#..'],
  circ: ['..#..', '.#.#.'],
  trema: ['.#.#.', '.....'],
};
const ACCENTED = {
  É: ['E', 'acute'], È: ['E', 'grave'], Ê: ['E', 'circ'], Ë: ['E', 'trema'],
  À: ['A', 'grave'], Â: ['A', 'circ'], Î: ['I', 'circ'], Ï: ['I', 'trema'],
  Ô: ['O', 'circ'], Û: ['U', 'circ'], Ù: ['U', 'grave'], Ü: ['U', 'trema'], Ç: ['C', null],
};

const CW = 6; // largeur de cellule (5 + 1 d'espacement)
const CH = 10; // 2 lignes d'accent + 7 + 1

function glyph(ch) {
  const c = ch.toUpperCase();
  if (G[c]) return { rows: G[c], accent: null };
  if (ACCENTED[c]) {
    const [base, acc] = ACCENTED[c];
    return { rows: G[base], accent: acc ? ACCENTS[acc] : null };
  }
  if (c === '’') return { rows: G["'"], accent: null };
  return { rows: G['?'], accent: null };
}

/** Mesure un texte en pixels de police (avant mise à l'échelle). */
function measure(text) {
  return { w: Math.max(1, text.length * CW - 1), h: CH };
}

/** Dessine un texte sur un contexte 2D à (x, y), taille de pixel `px`. */
function drawText(ctx, text, x, y, color = '#f4f4f4', px = 1, shadow = null) {
  const draw = (ox, oy, col) => {
    ctx.fillStyle = col;
    let cx = x + ox;
    for (const ch of text) {
      const g = glyph(ch);
      if (g.accent) {
        for (let r = 0; r < 2; r++)
          for (let c = 0; c < 5; c++) if (g.accent[r][c] === '#') ctx.fillRect(cx + c * px, y + oy + r * px, px, px);
      }
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 5; c++) if (g.rows[r][c] === '#') ctx.fillRect(cx + c * px, y + oy + (r + 2) * px, px, px);
      cx += CW * px;
    }
  };
  if (shadow) draw(px, px, shadow);
  draw(0, 0, color);
}

/** HTML d'un titre en police pixel (texte accessible inclus). */
function pixelTitle(text, cls = 'h2', scale = 3, color = '') {
  return `<div class="pixel-heading ${esc(cls)}" role="heading" aria-level="${cls === 'logo' || cls === 'h1' ? 1 : 2}"><span class="sr-only">${esc(text)}</span><canvas class="pixel-text" data-text="${esc(text)}" data-scale="${scale}" data-color="${esc(color)}" aria-hidden="true"></canvas></div>`;
}

/** Dessine tous les titres pixel d'un conteneur. */
function mountPixelTitles(root) {
  root.querySelectorAll('canvas.pixel-text').forEach((cv) => {
    const text = cv.dataset.text;
    const m = measure(text);
    cv.width = m.w + 2;
    cv.height = m.h + 1;
    const scale = Number(cv.dataset.scale) || 3;
    cv.style.width = `${(m.w + 2) * scale}px`;
    const ctx = cv.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const col = cv.dataset.color || css.getPropertyValue('--pixel-title').trim() || '#ffcd75';
    const shadow = css.getPropertyValue('--pixel-shadow').trim() || '#5d275d';
    drawText(ctx, text, 0, 0, col, 1, shadow);
  });
}
return __exports;
})();

// ---- src/ui/sprites.js ----
__m["src/ui/sprites.js"] = (function () {
const __exports = {};
__def(__exports, { "PALETTE": () => PALETTE, "SKINS": () => SKINS, "HAIRS": () => HAIRS, "SHIRTS": () => SHIRTS, "PANTS": () => PANTS, "SPRITES": () => SPRITES, "drawSprite": () => drawSprite, "spriteSize": () => spriteSize, "rect": () => rect, "look": () => look });
// Sprites pixel art décrits en chaînes de caractères + palette.
// Chaque caractère = une couleur de la palette ; '.' = transparent.
// Les lettres x (haut), y (bas), z (cheveux), q (peau) sont recolorées à la
// volée pour varier les personnages.

const PALETTE = {
  k: '#1a1c2c', // noir bleuté
  p: '#5d275d', // prune
  r: '#b13e53', // rouge
  R: '#e43b44', // rouge vif
  o: '#ef7d57', // orange
  y: '#ffcd75', // jaune
  F: '#ffe8a0', // frite
  g: '#a7f070', // vert clair
  G: '#38b764', // vert
  T: '#257179', // sarcelle
  n: '#29366f', // marine
  b: '#3b5dc9', // bleu
  c: '#41a6f6', // bleu clair
  C: '#73eff7', // cyan
  w: '#f4f4f4', // blanc
  l: '#94b0c2', // gris clair
  m: '#566c86', // gris
  d: '#333c57', // gris foncé
  s: '#f2c9a0', // peau claire
  S: '#c68863', // peau médium
  D: '#8d5524', // peau foncée
  h: '#4a2c1a', // brun foncé
  B: '#8f563b', // bois
  W: '#c28569', // bois clair
  a: '#e8c170', // blond
};

const SKINS = ['s', 'S', 'D', 's', 'S'];
const HAIRS = ['h', 'k', 'a', 'o', 'h', 'd'];
const SHIRTS = ['b', 'R', 'G', 'o', 'p', 'c', 'T', 'y', 'w'];
const PANTS = ['n', 'd', 'k', 'm', 'B'];

const SPRITES = {
  person0: [
    '..zzz..',
    '.zzzzz.',
    '.zqqqz.',
    '..qqq..',
    '.xxxxx.',
    'x.xxx.x',
    'q.xxx.q',
    '..yyy..',
    '..y.y..',
    '..y.y..',
    '..k.k..',
  ],
  person1: [
    '..zzz..',
    '.zzzzz.',
    '.zqqqz.',
    '..qqq..',
    '.xxxxx.',
    'x.xxx.x',
    'q.xxx.q',
    '..yyy..',
    '.y...y.',
    '.y...y.',
    '.k...k.',
  ],
  // Personnage assis (vu de dos/côté) derrière un bureau
  sitting: ['..zzz..', '.zzzzz.', '.zqqqz.', '..qqq..', '.xxxxx.', 'xxxxxxx', 'q.xxx.q'],
  desk: [
    '....dddddd....',
    '....dCCCCd....',
    '....dCCCCd....',
    '....dddddd....',
    '......dd......',
    'WWWWWWWWWWWWWW',
    'BBBBBBBBBBBBBB',
    '.B..........B.',
    '.B..........B.',
    '.B..........B.',
  ],
  plant: ['..G.G..', '.GgGgG.', 'GgGgGgG', '.GgGgG.', '..GgG..', '..BBB..', '..WWW..', '..BBB..'],
  coin: ['.yyy.', 'yyFyy', 'yFyyy', 'yyyyy', '.yyy.'],
  door: [
    'dddddddd',
    'dBBBBBBd',
    'dBWWWWBd',
    'dBWccWBd',
    'dBWccWBd',
    'dBWWWWBd',
    'dBBBBBBd',
    'dBBBByBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
    'dBBBBBBd',
  ],
  table: ['WWWWWWWWWWWWWWWWWW', 'BBBBBBBBBBBBBBBBBB', '.B..............B.', '.B..............B.', '.B..............B.'],
  poster: ['llllllllll', 'lyyyyyyyyl', 'lyRRyyGGyl', 'lyRRyyGGyl', 'lyyyyyyyyl', 'lyccccccyl', 'llllllllll'],
  coffee: ['.dddd.', '.dlld.', '.dRRd.', '.dddd.', 'mmmmmm', 'mllllm', 'mllllm', 'mmmmmm'],
  server: ['dddddd', 'dGkkkd', 'dddddd', 'dGkkkd', 'dddddd', 'dRkkkd', 'dddddd', 'dddddd'],
};

/** Dessine un sprite. map = remplacements de lettres (ex. { x: 'R' }). */
function drawSprite(ctx, name, x, y, map = null, flip = false) {
  const rows = SPRITES[name];
  if (!rows) return;
  const w = rows[0].length;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < w; c++) {
      let ch = row[flip ? w - 1 - c : c];
      if (ch === '.') continue;
      if (map && map[ch]) ch = map[ch];
      const col = PALETTE[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(x + c, y + r, 1, 1);
    }
  }
}

function spriteSize(name) {
  const rows = SPRITES[name];
  return rows ? { w: rows[0].length, h: rows.length } : { w: 0, h: 0 };
}

/** Rectangle plein en couleur de palette. */
function rect(ctx, x, y, w, h, col) {
  ctx.fillStyle = PALETTE[col] || col;
  ctx.fillRect(x, y, w, h);
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Apparence stable d'une personne à partir d'un identifiant. */
function look(id) {
  const h = hashStr(String(id));
  return { q: SKINS[h % SKINS.length], z: HAIRS[(h >> 3) % HAIRS.length], x: SHIRTS[(h >> 6) % SHIRTS.length], y: PANTS[(h >> 9) % PANTS.length] };
}
return __exports;
})();

// ---- src/ui/sceneDecor.js ----
__m["src/ui/sceneDecor.js"] = (function () {
const __exports = {};
__def(__exports, { "DECOR": () => DECOR });
// Décors de scène par secteur. Chaque décor fournit :
//   background(ctx, state)            décor statique (mis en cache)
//   animate(ctx, state, t, reduced)   éléments animés (travailleurs…)
//   target(state, i) → {x, y}         où vont les clients
//   coinSpot(state) → {x, y}          d'où partent les pièces
//   doorX, doorY                      entrée des clients
//   icon(ctx)                         icône 32×32

const { drawSprite, rect, look } = __m["src/ui/sprites.js"];
const { hasUpgrade } = __m["src/engine/upgrades.js"];

const FY = 62;

// --- Agence web ------------------------------------------------------------------

function agenceDesks(state) {
  const n = state.staff.employees.length + (state.staff.founder.active ? 1 : 0);
  const seats = hasUpgrade(state, 'plateau') ? 12 : hasUpgrade(state, 'bureau') ? 8 : hasUpgrade(state, 'coworking') ? 5 : 2;
  const count = Math.max(2, Math.min(12, Math.max(n, Math.min(seats, n + 1))));
  const out = [];
  for (let i = 0; i < count; i++) {
    const row = i < 6 ? 0 : 1;
    const col = i % 6;
    out.push({ x: 64 + col * 17 - row * 4, y: FY + 8 + row * 20 });
  }
  return out;
}

const agence = {
  wall: 'l',
  floor1: 'm',
  floor2: 'd',
  signColor: 'b',
  doorX: 182,
  doorY: FY + 30,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}`,
  background(b, state) {
    if (hasUpgrade(state, 'coworking')) drawSprite(b, 'poster', 66, 20);
    if (hasUpgrade(state, 'bureau')) {
      drawSprite(b, 'poster', 100, 18);
      drawSprite(b, 'table', 14, FY + 30);
    }
    if (hasUpgrade(state, 'plateau')) drawSprite(b, 'coffee', 150, FY - 8);
    if (hasUpgrade(state, 'cloud') || hasUpgrade(state, 'saas')) drawSprite(b, 'server', 140, FY - 8);
    drawSprite(b, 'plant', 2, FY - 6);
    if (hasUpgrade(state, 'coworking')) drawSprite(b, 'plant', 125, FY - 6);
    for (const d of agenceDesks(state)) drawSprite(b, 'desk', d.x, d.y);
  },
  animate(ctx, state, t, reduced) {
    const desks = agenceDesks(state);
    const people = [];
    if (state.staff.founder.active) people.push('founder');
    for (const e of state.staff.employees) people.push(e.id);
    const act = state.company.capacityUse || 0;
    people.forEach((id, i) => {
      const d = desks[i];
      if (!d) return;
      const bob = !reduced && act > 0.2 && Math.floor(t * 4 + i) % 3 === 0 ? 1 : 0;
      drawSprite(ctx, 'sitting', d.x + 4, d.y - 5 + bob, id === 'founder' ? { x: 'R', y: 'n', z: 'h', q: 's' } : look(id));
      // écran qui scintille quand on travaille
      if (act > 0.1 && !reduced && Math.floor(t * 3 + i * 2) % 4 === 0) rect(ctx, d.x + 5, d.y + 1, 4, 1, 'w');
    });
  },
  target(state, i) {
    if (hasUpgrade(state, 'bureau')) return { x: 24 + (i % 3) * 5, y: FY + 34 };
    return { x: 40 + (i % 4) * 6, y: FY + 40 };
  },
  coinSpot() {
    return { x: 120, y: FY + 6 };
  },
  icon(ctx) {
    rect(ctx, 4, 6, 24, 16, 'd');
    rect(ctx, 6, 8, 20, 12, 'C');
    rect(ctx, 8, 10, 8, 2, 'b');
    rect(ctx, 8, 14, 12, 2, 'w');
    rect(ctx, 2, 22, 28, 4, 'l');
    rect(ctx, 12, 23, 8, 1, 'm');
  },
};

const DECOR = { agence };
return __exports;
})();

// ---- src/ui/scene.js ----
__m["src/ui/scene.js"] = (function () {
const __exports = {};
__def(__exports, { "W": () => W, "H": () => H, "FLOOR_Y": () => FLOOR_Y, "Scene": () => Scene, "drawLogoScene": () => drawLogoScene, "drawSectorIcon": () => drawSectorIcon });
// Scène pixel art animée de l'entreprise (canvas 192×108, agrandi en CSS).
// Le décor dépend du secteur et des améliorations ; les personnages et les
// pièces réagissent à l'activité réelle du moteur.

const { drawSprite, rect, PALETTE, look } = __m["src/ui/sprites.js"];
const { drawText } = __m["src/ui/pixelfont.js"];
const { DECOR } = __m["src/ui/sceneDecor.js"];
const { sectorModule } = __m["src/engine/sectors/index.js"];

const W = 192;
const H = 108;
const FLOOR_Y = 62;

class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;
    this.bg = document.createElement('canvas');
    this.bg.width = W;
    this.bg.height = H;
    this.bgKey = '';
    this.walkers = [];
    this.coins = [];
    this.t = 0;
    this.spawnAcc = 0;
    this.lastInflow = null;
    this.seq = 0;
    this.reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  decor(state) {
    return DECOR[state.meta.sector] || DECOR.agence;
  }

  update(dt, state) {
    this.t += dt;
    const d = this.decor(state);
    const info = sectorModule(state).sceneInfo ? sectorModule(state).sceneInfo(state) : { activity: 0.5, customers: 2 };
    const speedOn = dt > 0;
    // Arrivée de clients proportionnelle à l'activité
    this.spawnAcc += dt * (0.15 + info.customers * 0.18);
    if (speedOn && this.spawnAcc > 1 && this.walkers.length < 7) {
      this.spawnAcc = 0;
      const target = d.target(state, this.seq);
      this.seq++;
      this.walkers.push({ id: `c${this.seq}`, x: d.doorX, y: d.doorY, tx: target.x, ty: target.y, phase: 'in', wait: 1.5 + Math.random() * 2.5, look: look(`c${this.seq}${state.time.day}`) });
    }
    for (const w of this.walkers) {
      const sp = 22 * dt;
      if (w.phase === 'in' || w.phase === 'out') {
        const dx = w.tx - w.x;
        const dy = w.ty - w.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) {
          if (w.phase === 'in') w.phase = 'wait';
          else w.done = true;
        } else {
          w.x += (dx / dist) * Math.min(sp, dist);
          w.y += (dy / dist) * Math.min(sp, dist);
          w.flip = dx < 0;
        }
      } else if (w.phase === 'wait') {
        w.wait -= dt;
        if (w.wait <= 0) {
          w.phase = 'out';
          w.tx = d.doorX;
          w.ty = d.doorY;
        }
      }
    }
    this.walkers = this.walkers.filter((w) => !w.done);
    // Pièces quand de l'argent rentre
    const inflow = state.finance.month.inflow;
    if (this.lastInflow !== null && inflow > this.lastInflow) {
      const n = Math.min(3, 1 + Math.floor((inflow - this.lastInflow) / 100_000));
      for (let i = 0; i < n; i++) {
        const p = d.coinSpot(state);
        this.coins.push({ x: p.x + (Math.random() * 10 - 5), y: p.y, vy: -14 - Math.random() * 6, life: 1.4 });
      }
    }
    this.lastInflow = inflow;
    for (const c of this.coins) {
      c.y += c.vy * dt;
      c.vy += 12 * dt;
      c.life -= dt;
    }
    this.coins = this.coins.filter((c) => c.life > 0);
  }

  draw(state) {
    const ctx = this.ctx;
    const d = this.decor(state);
    const key = `${state.meta.sector}|${state.upgrades.owned.join(',')}|${state.world.weather}|${d.layoutKey ? d.layoutKey(state) : ''}`;
    if (key !== this.bgKey) {
      this.bgKey = key;
      const b = this.bg.getContext('2d');
      b.clearRect(0, 0, W, H);
      drawRoom(b, state, d);
      d.background(b, state);
      drawSign(b, state, d);
    }
    ctx.drawImage(this.bg, 0, 0);
    drawWeather(ctx, state, this.t, this.reduced);
    // Éléments animés du secteur (travailleurs, machines…)
    d.animate(ctx, state, this.t, this.reduced);
    // Clients (triés par profondeur)
    const sorted = [...this.walkers].sort((a, b) => a.y - b.y);
    for (const w of sorted) {
      const moving = w.phase !== 'wait';
      const frame = moving && !this.reduced && Math.floor(this.t * 6) % 2 ? 'person1' : 'person0';
      drawSprite(ctx, frame, Math.round(w.x - 3), Math.round(w.y - 11), w.look, w.flip);
    }
    for (const c of this.coins) {
      ctx.globalAlpha = Math.max(0, Math.min(1, c.life));
      drawSprite(ctx, 'coin', Math.round(c.x), Math.round(c.y));
      ctx.globalAlpha = 1;
    }
    if (state.status === 'bankrupt') {
      ctx.fillStyle = 'rgba(26,28,44,0.6)';
      ctx.fillRect(0, 0, W, H);
      drawText(ctx, 'FERMÉ', 78, 44, PALETTE.R, 1, PALETTE.k);
    }
  }
}

function drawRoom(b, state, d) {
  rect(b, 0, 0, W, FLOOR_Y, d.wall || 'm');
  rect(b, 0, FLOOR_Y - 2, W, 2, 'd');
  // Sol en damier discret
  for (let y = FLOOR_Y; y < H; y += 6)
    for (let x = 0; x < W; x += 6) rect(b, x, y, 6, 6, ((x + y) / 6) % 2 ? d.floor1 || 'W' : d.floor2 || 'B');
  // Fenêtre
  rect(b, 8, 10, 52, 34, 'd');
  rect(b, 10, 12, 48, 30, skyColor(state.world.weather));
  rect(b, 33, 12, 2, 30, 'd');
  rect(b, 10, 26, 48, 2, 'd');
  // Porte
  drawSprite(b, 'door', d.doorX - 4, FLOOR_Y - 16);
}

function drawSign(b, state, d) {
  const name = state.meta.companyName.toUpperCase().slice(0, 18);
  const w = name.length * 6 + 5;
  const x = Math.max(64, Math.min(W - w - 2, d.doorX - w + 8));
  rect(b, x, 2, w, 12, 'k');
  rect(b, x + 1, 3, w - 2, 10, d.signColor || 'n');
  drawText(b, name, x + 3, 3, PALETTE.y, 1);
}

function skyColor(wt) {
  return { soleil: 'c', canicule: 'o', nuageux: 'l', pluie: 'm', froid: 'C' }[wt] || 'c';
}

function drawWeather(ctx, state, t, reduced) {
  const wt = state.world.weather;
  ctx.save();
  ctx.beginPath();
  ctx.rect(10, 12, 48, 30);
  ctx.clip();
  if (wt === 'soleil' || wt === 'canicule') {
    rect(ctx, 44, 15, 8, 8, wt === 'canicule' ? 'R' : 'y');
    rect(ctx, 46, 13, 4, 12, wt === 'canicule' ? 'R' : 'y');
  }
  if (wt === 'nuageux' || wt === 'pluie') {
    const off = reduced ? 0 : Math.floor(t * 3) % 60;
    for (const cx of [4, 30, 56]) {
      const x = ((cx + off) % 60) + 4;
      rect(ctx, x, 16, 14, 5, 'w');
      rect(ctx, x + 3, 13, 8, 4, 'w');
    }
  }
  if (wt === 'pluie') {
    ctx.fillStyle = PALETTE.C;
    for (let i = 0; i < 14; i++) {
      const x = 10 + ((i * 37) % 48);
      const y = 12 + (((reduced ? 0 : t * 40) + i * 11) % 30);
      ctx.fillRect(x, y, 1, 3);
    }
  }
  if (wt === 'froid') {
    ctx.fillStyle = PALETTE.w;
    for (let i = 0; i < 12; i++) {
      const x = 10 + ((i * 29 + (reduced ? 0 : Math.floor(t * 4))) % 48);
      const y = 12 + (((reduced ? 0 : t * 8) + i * 7) % 30);
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();
}

/** Petite scène décorative pour l'écran titre. */
function drawLogoScene(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  rect(ctx, 0, 0, w, h, 'n');
  for (let i = 0; i < 30; i++) rect(ctx, (i * 53) % w, (i * 29) % (h - 50), 1, 1, 'l');
  // Skyline belge : maisons à pignons + Atomium stylisé
  const base = h - 20;
  let x = 0;
  const cols = ['r', 'B', 'o', 'W', 'p', 'T'];
  let i = 0;
  while (x < w) {
    const bw = 18 + ((i * 7) % 10);
    const bh = 26 + ((i * 13) % 26);
    rect(ctx, x, base - bh, bw, bh, cols[i % cols.length]);
    for (let s = 0; s < bw / 2; s += 2) rect(ctx, x + s, base - bh - s / 2 - 1, bw - 2 * s, 2, cols[i % cols.length]);
    for (let wy = base - bh + 6; wy < base - 6; wy += 8)
      for (let wx = x + 3; wx < x + bw - 4; wx += 6) rect(ctx, wx, wy, 3, 4, (wx + wy) % 3 ? 'y' : 'd');
    x += bw;
    i++;
  }
  const ax = Math.floor(w * 0.72);
  const ay = base - 64;
  rect(ctx, ax + 9, ay + 8, 2, 60, 'l');
  for (const [dx, dy] of [[0, 0], [16, 0], [8, 8], [0, 16], [16, 16], [8, 24]]) {
    rect(ctx, ax + dx - 2 + 2, ay + dy, 8, 8, 'l');
    rect(ctx, ax + dx + 1 + 2, ay + dy + 1, 2, 2, 'w');
  }
  rect(ctx, 0, base, w, 20, 'd');
  rect(ctx, 0, base, w, 2, 'm');
  drawSprite(ctx, 'person0', 30, base + 2, { x: 'R', y: 'n', z: 'h', q: 's' });
  drawSprite(ctx, 'coin', 40, base + 4);
  drawSprite(ctx, 'coin', 46, base + 1);
}

/** Icône de secteur (32×32) pour l'écran de création. */
function drawSectorIcon(canvas, sector) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 32, 32);
  const d = DECOR[sector];
  if (d && d.icon) d.icon(ctx);
}
return __exports;
})();

// ---- src/ui/screens/title.js ----
__m["src/ui/screens/title.js"] = (function () {
const __exports = {};
__def(__exports, { "slotLabel": () => slotLabel, "slotSummary": () => slotSummary, "renderTitle": () => renderTitle, "openLoadDialog": () => openLoadDialog });
// Écran titre : nouvelle partie, continuer, charger, importer.

const { esc } = __m["src/ui/dom.js"];
const { eur } = __m["src/ui/format.js"];
const { formatDate } = __m["src/engine/calendar.js"];
const { SECTOR_DATA } = __m["src/engine/sectors/registry.js"];
const { DIFFICULTIES } = __m["src/data/difficulty.js"];
const { pixelTitle, mountPixelTitles } = __m["src/ui/pixelfont.js"];
const { drawLogoScene } = __m["src/ui/scene.js"];

function slotLabel(slot) {
  return slot === 'auto' ? 'Autosauvegarde' : `Emplacement ${slot}`;
}

function slotSummary(s) {
  if (s.empty) return '<span class="muted">Vide</span>';
  if (s.error) return `<span class="bad">${esc(s.error)}</span>`;
  const m = s.summary || {};
  const sector = SECTOR_DATA[m.sector];
  const status = m.status === 'bankrupt' ? ' · <span class="bad">faillite</span>' : m.status === 'won' || m.status === 'sandbox' ? ' · <span class="good">liberté financière</span>' : '';
  return `<strong>${esc(m.companyName || '?')}</strong> — ${esc(sector ? sector.label : m.sector)} · ${esc(DIFFICULTIES[m.difficulty]?.label || '')}<br>
    <span class="muted">${formatDate(m.day || 0)} · trésorerie ${eur(m.cash || 0, { decimals: false })}${status}</span>`;
}

async function renderTitle(app) {
  let slots = [];
  let storageError = '';
  try {
    slots = await app.adapter.list();
  } catch (e) {
    storageError = e.message;
  }
  const auto = slots.find((s) => s.slot === 'auto' && !s.empty && !s.error);
  app.root.innerHTML = `
  <main class="title-screen">
    <canvas id="title-scene" class="title-scene" width="240" height="120" aria-hidden="true"></canvas>
    ${pixelTitle('ENTREPRENEUR TYCOON', 'logo', 4)}
    <p class="subtitle">Belgique — crée ta boîte, survis au fisc, atteins la liberté financière.</p>
    <div class="title-menu">
      ${auto ? `<button class="btn btn-primary" id="btn-continue">▶ Continuer : ${esc(auto.summary?.companyName || '')}</button>` : ''}
      <button class="btn ${auto ? '' : 'btn-primary'}" id="btn-new">✚ Nouvelle partie</button>
      <button class="btn" id="btn-load">📂 Charger / importer</button>
      <button class="btn" id="btn-about">ℹ À propos</button>
    </div>
    ${storageError ? `<p class="bad">${esc(storageError)} Tes parties ne pourront pas être sauvegardées.</p>` : ''}
    <p class="muted small">Raccourcis : Espace = pause · 1/2/3 = vitesse · Échap = fermer</p>
  </main>`;
  mountPixelTitles(app.root);
  drawLogoScene(document.getElementById('title-scene'));
  const cont = document.getElementById('btn-continue');
  if (cont) cont.addEventListener('click', () => app.loadFrom('auto'));
  document.getElementById('btn-new').addEventListener('click', () => app.showNewGame());
  document.getElementById('btn-load').addEventListener('click', () => openLoadDialog(app));
  document.getElementById('btn-about').addEventListener('click', () =>
    app.openModal({
      title: 'À propos',
      html: `<p>Entrepreneur Tycoon (Belgique) est un jeu de gestion pédagogique : trésorerie, TVA, impôts, employés, concurrence et investissements.</p>
      <p>Les règles fiscales sont <strong>simplifiées</strong> et doivent être vérifiées avant tout usage réel (voir l'encart « simplifié » dans l'onglet Finances).</p>
      <p class="muted">Pixel art, police et sons générés par le code. Aucune donnée n'est envoyée : tout est sauvegardé dans ton navigateur.</p>`,
    }),
  );
}

async function openLoadDialog(app, { inGame = false } = {}) {
  const render = async () => {
    let slots = [];
    try {
      slots = await app.adapter.list();
    } catch (e) {
      return `<p class="bad">${esc(e.message)}</p>`;
    }
    return `<ul class="slot-list">${slots
      .map(
        (s) => `<li class="slot">
        <div class="slot-info"><span class="slot-name">${slotLabel(s.slot)}</span><div>${slotSummary(s)}</div></div>
        <div class="slot-actions">
          ${inGame && s.slot !== 'auto' ? `<button class="btn btn-small" data-slot-save="${s.slot}">Sauver ici</button>` : ''}
          ${!s.empty && !s.error ? `<button class="btn btn-small" data-slot-load="${s.slot}">Charger</button>` : ''}
          ${!s.empty && !s.error ? `<button class="btn btn-small" data-slot-export="${s.slot}">Exporter</button>` : ''}
          ${s.slot !== 'auto' ? `<button class="btn btn-small" data-slot-import="${s.slot}">Importer</button>` : ''}
          ${!s.empty ? `<button class="btn btn-small btn-danger" data-slot-delete="${s.slot}">Supprimer</button>` : ''}
        </div></li>`,
      )
      .join('')}</ul>
      <p class="muted small">L'export produit un fichier .json que tu peux réimporter sur un autre ordinateur.</p>`;
  };
  const modal = app.openModal({ title: inGame ? 'Sauvegardes' : 'Charger une partie', html: await render() });
  const refresh = async () => {
    const body = modal.querySelector('.modal-body');
    if (body) body.innerHTML = await render();
  };
  modal.addEventListener('click', async (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.slotSave) {
      await app.saveTo(t.dataset.slotSave);
      refresh();
    } else if (t.dataset.slotLoad) app.loadFrom(t.dataset.slotLoad);
    else if (t.dataset.slotExport) app.exportSlot(t.dataset.slotExport);
    else if (t.dataset.slotImport) app.importFile(t.dataset.slotImport, refresh);
    else if (t.dataset.slotDelete) {
      if (confirm(`Supprimer définitivement « ${slotLabel(t.dataset.slotDelete)} » ?`)) {
        await app.adapter.delete(t.dataset.slotDelete);
        refresh();
      }
    }
  });
}
return __exports;
})();

// ---- src/data/legal.js ----
__m["src/data/legal.js"] = (function () {
const __exports = {};
__def(__exports, { "LEGAL": () => LEGAL });
// Statuts juridiques proposés à la création. Détails chiffrés dans fiscalite.js.

const LEGAL = {
  independant: {
    id: 'independant',
    label: 'Indépendant (personne physique)',
    pros: [
      'Démarrage rapide et bon marché (≈ 110 € d’inscription)',
      'Comptable moins cher (≈ 90 €/mois)',
      'Tu prélèves librement sur le compte pro',
    ],
    cons: [
      'Bénéfice taxé à l’IPP (jusqu’à 50 %)',
      'Responsabilité illimitée : ton patrimoine perso répond des dettes',
      'Moins crédible : crédit plus cher, pas d’investisseurs',
    ],
  },
  srl: {
    id: 'srl',
    label: 'Société (SRL)',
    pros: [
      'Impôt des sociétés : 20 % sur les premiers 100 000 € (sous conditions)',
      'Responsabilité limitée : ton patrimoine perso est protégé',
      'Plus crédible : clients B2B, banques, investisseurs',
    ],
    cons: [
      'Création plus chère (notaire ≈ 1 500 €), comptable ≈ 225 €/mois',
      'Pour sortir l’argent : rémunération (IPP) ou dividendes (précompte)',
      'Rémunération ≥ 50 000 €/an exigée pour le taux réduit',
    ],
  },
};
return __exports;
})();

// ---- src/ui/screens/newgame.js ----
__m["src/ui/screens/newgame.js"] = (function () {
const __exports = {};
__def(__exports, { "renderNewGame": () => renderNewGame });
// Écran de création de partie.

const { esc } = __m["src/ui/dom.js"];
const { eur } = __m["src/ui/format.js"];
const { SECTOR_DATA } = __m["src/engine/sectors/registry.js"];
const { DIFFICULTIES, DIFFICULTY_ORDER } = __m["src/data/difficulty.js"];
const { LEGAL } = __m["src/data/legal.js"];
const { pixelTitle, mountPixelTitles } = __m["src/ui/pixelfont.js"];
const { drawSectorIcon } = __m["src/ui/scene.js"];

function renderNewGame(app) {
  const sectors = Object.values(SECTOR_DATA);
  app.root.innerHTML = `
  <main class="newgame">
    ${pixelTitle('NOUVELLE ENTREPRISE', 'h1', 3)}
    <form id="ng-form" class="ng-form" autocomplete="off">
      <fieldset class="ng-sectors">
        <legend>1. Ton secteur</legend>
        <div class="card-grid">
        ${sectors
          .map(
            (s, i) => `<label class="card pick">
            <input type="radio" name="sector" value="${s.id}" ${i === 0 ? 'checked' : ''}>
            <canvas class="sector-icon" width="32" height="32" data-icon="${s.id}" aria-hidden="true"></canvas>
            <span class="card-title">${esc(s.label)}</span>
            <span class="card-text">${esc(s.tagline)}</span>
          </label>`,
          )
          .join('')}
        </div>
        <p class="ng-desc" id="ng-sector-desc"></p>
        <div id="ng-metier"></div>
      </fieldset>

      <fieldset>
        <legend>2. Ton statut juridique</legend>
        <div class="card-grid two">
        ${Object.values(LEGAL)
          .map(
            (l, i) => `<label class="card pick">
            <input type="radio" name="legal" value="${l.id}" ${i === 0 ? 'checked' : ''}>
            <span class="card-title">${esc(l.label)}</span>
            <ul class="card-list">${l.pros.map((p) => `<li class="good">+ ${esc(p)}</li>`).join('')}${l.cons.map((p) => `<li class="bad">− ${esc(p)}</li>`).join('')}</ul>
          </label>`,
          )
          .join('')}
        </div>
        <label class="check"><input type="checkbox" name="vatFranchise"> Régime de franchise TVA (si CA &lt; 25 000 €/an : pas de TVA facturée ni récupérée)</label>
      </fieldset>

      <fieldset>
        <legend>3. Difficulté</legend>
        <div class="card-grid four">
        ${DIFFICULTY_ORDER.map((id) => {
          const d = DIFFICULTIES[id];
          return `<label class="card pick small">
            <input type="radio" name="difficulty" value="${id}" ${id === 'normal' ? 'checked' : ''}>
            <span class="card-title">${esc(d.label)}</span>
            <span class="card-text">${esc(d.description)}</span>
            <span class="card-text"><strong>${eur(d.startingCapital, { decimals: false })}</strong> de départ · objectif ${eur(d.passiveTarget, { decimals: false })}/mois</span>
          </label>`;
        }).join('')}
        </div>
      </fieldset>

      <fieldset class="ng-names">
        <legend>4. Identité</legend>
        <label class="field"><span>Nom de l'entreprise</span><input name="companyName" maxlength="40" required value="${esc(defaultName())}"></label>
        <label class="field"><span>Ton prénom</span><input name="founderName" maxlength="30" required value="Tom"></label>
        <label class="field"><span>Graine (seed) — optionnel</span><input name="seed" maxlength="40" placeholder="ex : bruxelles2026"></label>
        <label class="field range"><span>Part du capital investie dans l'entreprise <output id="apport-out">70 %</output></span>
          <input type="range" name="apportPct" min="0" max="100" step="5" value="70"></label>
        <p class="muted small">La graine rend la partie reproductible : même graine + mêmes décisions = même partie.</p>
      </fieldset>

      <div class="ng-actions">
        <button type="button" class="btn" id="ng-back">← Retour</button>
        <button type="submit" class="btn btn-primary">Lancer l'entreprise ▶</button>
      </div>
    </form>
  </main>`;
  mountPixelTitles(app.root);
  app.root.querySelectorAll('canvas[data-icon]').forEach((c) => drawSectorIcon(c, c.dataset.icon));
  const form = document.getElementById('ng-form');
  const desc = document.getElementById('ng-sector-desc');
  const metierBox = document.getElementById('ng-metier');
  const updateSector = () => {
    const id = form.sector.value;
    const s = SECTOR_DATA[id];
    desc.textContent = s.description;
    if (s.metiers) {
      metierBox.innerHTML = `<label class="field"><span>Métier</span><select name="metier">${Object.values(s.metiers)
        .map((m) => `<option value="${m.id}">${esc(m.label)}</option>`)
        .join('')}</select></label>`;
    } else metierBox.innerHTML = '';
  };
  form.addEventListener('change', (e) => {
    if (e.target.name === 'sector') updateSector();
  });
  form.apportPct.addEventListener('input', () => {
    document.getElementById('apport-out').textContent = `${form.apportPct.value} %`;
  });
  updateSector();
  document.getElementById('ng-back').addEventListener('click', () => app.showTitle());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const opts = {
      sector: form.sector.value,
      legal: form.legal.value,
      difficulty: form.difficulty.value,
      companyName: form.companyName.value.trim() || 'Ma Boîte',
      founderName: form.founderName.value.trim() || 'Alex',
      seed: form.seed.value.trim(),
      vatFranchise: form.vatFranchise.checked,
      apportPct: Number(form.apportPct.value) / 100,
      metier: form.metier ? form.metier.value : null,
    };
    app.startNewGame(opts);
  });
}

function defaultName() {
  const names = ['Atomium Digital', 'Gaufre & Code', 'Les Frites d’Or', 'Belgian Hustle', 'Manneken Business'];
  return names[Math.floor(Math.random() * names.length)];
}
return __exports;
})();

// ---- src/engine/selectors.js ----
__m["src/engine/selectors.js"] = (function () {
const __exports = {};
__def(__exports, { "debtTotal": () => debtTotal, "investmentsValue": () => investmentsValue, "taxLiabilities": () => taxLiabilities, "netWorth": () => netWorth, "kpis": () => kpis, "lastMonths": () => lastMonths, "passiveIncome": () => passiveIncome });
// Valeurs dérivées de l'état, utilisées par l'interface, le score et les bots.

const { bookValue, receivablesTotal } = __m["src/engine/ledger.js"];
const { sectorModule } = __m["src/engine/sectors/index.js"];

/** Dettes bancaires restantes (capital). */
function debtTotal(state) {
  let d = 0;
  for (const l of state.loans || []) d += l.remaining;
  return d;
}

/** Valeur du portefeuille personnel (placements + immobilier net de crédit). */
function investmentsValue(state) {
  const inv = state.investments;
  if (!inv) return 0;
  let v = inv.savings + inv.etf.value + inv.stocks.value;
  for (const p of inv.realEstate) v += p.value - p.mortgage.remaining;
  return v;
}

/** Dettes fiscales déjà connues mais pas encore payées. */
function taxLiabilities(state) {
  let t = 0;
  if (state.tax) for (const s of state.tax.schedule) if (s.amount > 0) t += s.amount;
  if (state.finance) t += Math.max(0, state.finance.vat.collected - state.finance.vat.deductible);
  return t;
}

/**
 * Patrimoine net du fondateur ≈ part de l'entreprise (trésorerie + créances +
 * stock + actifs − dettes) + compte perso + placements.
 */
function netWorth(state) {
  const ownership = state.ownership ? state.ownership.founder : 1;
  const m = sectorModule(state);
  const stock = m.stockValue ? m.stockValue(state) : 0;
  const business = state.cash + receivablesTotal(state) + stock + bookValue(state) - debtTotal(state) - taxLiabilities(state);
  // SRL : responsabilité limitée (une société en négatif vaut 0 pour le fondateur).
  const share = business > 0 ? Math.round(business * ownership) : state.meta.legal === 'srl' ? 0 : business;
  return share + state.personal.cash + investmentsValue(state);
}

function kpis(state) {
  const m = sectorModule(state);
  return m.kpis ? m.kpis(state) : [];
}

function lastMonths(state, n = 12) {
  return state.finance.history.slice(-n);
}

/**
 * Revenu passif mensuel net (voir docs/DESIGN.md § 11.2). Le détail est
 * calculé chaque fin de mois par passive.js ; on lit le dernier résultat.
 */
function passiveIncome(state) {
  const p = state.passive || { total: 0, avg3: 0, parts: {} };
  return { total: p.avg3 || 0, last: p.total || 0, parts: p.parts || {}, target: state.passiveTarget || 0 };
}
return __exports;
})();

// ---- src/ui/sectorui/agence.js ----
__m["src/ui/sectorui/agence.js"] = (function () {
const __exports = {};
__def(__exports, { "renderSector": () => renderSector });
// Contrôles propres à l'agence web (onglet Entreprise).

const { esc, actBtn, eurInput, selectInput, bar, help } = __m["src/ui/dom.js"];
const { eur, num } = __m["src/ui/format.js"];
const { AGENCE: D } = __m["src/data/sectors/agence.js"];
const { hoursPerDay, backlogHours, leadAffordable, recurringRevenue } = __m["src/engine/sectors/agence.js"];
const { formatDate } = __m["src/engine/calendar.js"];

function renderSector(state) {
  const s = state.sector;
  const cap = hoursPerDay(state);
  const backlog = backlogHours(state);
  const leads = s.leads
    .map((l) => {
      const ok = leadAffordable(state, l);
      return `<li class="row ${ok ? '' : 'dim'}">
        <div class="grow"><strong>${esc(l.label)}</strong> — ${esc(l.client)}<br>
        <span class="muted small">${l.hours} h · budget max ${eur(l.budget, { decimals: false })}/h · prix à ton taux : ${eur(l.hours * s.rate, { decimals: false })} HT · délai ${l.deadline} j · expire le ${formatDate(l.expires)}</span></div>
        ${actBtn('Accepter', { type: 'sector', name: 'acceptLead', id: l.id }, { cls: 'btn-small btn-primary', title: ok ? '' : 'Ton taux dépasse son budget : il refusera.' })}
        ${actBtn('Refuser', { type: 'sector', name: 'declineLead', id: l.id }, { cls: 'btn-small' })}
      </li>`;
    })
    .join('');
  const projects = s.projects
    .map((p) => {
      const late = !p.internal && state.time.day > p.deadlineDay;
      return `<li class="row"><div class="grow"><strong>${esc(p.label)}</strong> — ${esc(p.client)} ${late ? '<span class="bad">(en retard)</span>' : ''}<br>
        ${bar(p.done, p.hoursReal)} <span class="muted small">${num(p.done)} / ${num(p.hoursReal)} h ${p.hoursReal > p.hoursEst * 1.05 ? `(estimé ${p.hoursEst} h : dépassement !)` : ''}${p.internal ? '' : ` · ${eur(p.price, { decimals: false })} HT · échéance ${formatDate(p.deadlineDay)}`}</span></div></li>`;
    })
    .join('');
  const saas = s.saas.status === 'none' ? '' : `
    <h3>SaaS ${help('SaaS')}</h3>
    ${s.saas.status === 'dev' ? '<p>En développement (voir projets).</p>' : `
      <p><strong>${num(s.saas.subscribers)}</strong> abonnés · revenu mensuel ${eur(s.saas.subscribers * s.saas.price, { decimals: false })} HT</p>
      ${eurInput('saas-price', s.saas.price, { type: 'sector', name: 'setSaasPrice' }, { min: D.saas.minPrice / 100, max: D.saas.maxPrice / 100, label: 'Prix de l’abonnement (HT/mois)' })}`}`;
  return `
  <section class="card-block">
    <h3>Ton offre</h3>
    <div class="form-row">
      ${eurInput('rate', s.rate, { type: 'sector', name: 'setRate' }, { min: D.minRate / 100, max: D.maxRate / 100, label: `Taux horaire HT (marché ≈ ${eur(D.refRate, { decimals: false })})` })}
      ${selectInput('policy', s.policy, [
        { value: 'capacite', label: 'Accepter si j’ai la capacité' },
        { value: 'tout', label: 'Tout accepter' },
        { value: 'manuel', label: 'Je décide moi-même' },
      ], { type: 'sector', name: 'setPolicy' }, { label: 'Nouvelles demandes' })}
    </div>
    <p class="muted small">Capacité : ${num(cap, 1)} h facturables/jour ouvré · carnet : ${num(backlog)} h (≈ ${num(backlog / Math.max(1, cap * 21), 1)} mois) · récurrent : ${eur(recurringRevenue(state), { decimals: false })}/mois · ${s.maint.contracts.length} contrat(s) de maintenance.</p>
  </section>
  <section class="card-block">
    <h3>Demandes de projets (${s.leads.length})</h3>
    ${leads ? `<ul class="list">${leads}</ul>` : '<p class="muted">Aucune demande en attente. Le marketing, la réputation et les commerciaux en amènent plus.</p>'}
  </section>
  <section class="card-block">
    <h3>Projets en cours (${s.projects.length})</h3>
    ${projects ? `<ul class="list">${projects}</ul>` : '<p class="muted">Aucun projet en cours.</p>'}
  </section>
  ${saas ? `<section class="card-block">${saas}</section>` : ''}`;
}
return __exports;
})();

// ---- src/ui/sectorui/index.js ----
__m["src/ui/sectorui/index.js"] = (function () {
const __exports = {};
__def(__exports, { "SECTOR_UI": () => SECTOR_UI });
// Interfaces propres à chaque secteur.

const agence = __m["src/ui/sectorui/agence.js"];

const SECTOR_UI = { agence };
return __exports;
})();

// ---- src/ui/panels/entreprise.js ----
__m["src/ui/panels/entreprise.js"] = (function () {
const __exports = {};
__def(__exports, { "renderUpgrades": () => renderUpgrades, "panel": () => panel });
// Onglet Entreprise : contrôles du secteur, marketing, améliorations.

const { esc, actBtn, eurInput, help } = __m["src/ui/dom.js"];
const { eur } = __m["src/ui/format.js"];
const { upgradeList, canBuyUpgrade, hasUpgrade } = __m["src/engine/upgrades.js"];
const { sectorData } = __m["src/engine/sectors/registry.js"];
const { SECTOR_UI } = __m["src/ui/sectorui/index.js"];

const CATS = { locaux: 'Locaux', materiel: 'Matériel', process: 'Process', marque: 'Marque', automatisation: 'Automatisation' };

function renderUpgrades(state) {
  const list = upgradeList(state);
  return Object.entries(CATS)
    .map(([cat, label]) => {
      const items = list.filter((u) => u.cat === cat);
      if (!items.length) return '';
      return `<div class="upg-cat"><h4>${label}</h4><ul class="upg-list">${items
        .map((u) => {
          const owned = hasUpgrade(state, u.id);
          const c = owned ? { ok: false } : canBuyUpgrade(state, u.id);
          const monthly = (u.rent || 0) + (u.monthly || 0);
          return `<li class="upg ${owned ? 'owned' : c.ok ? 'buyable' : 'locked'}">
            <div class="grow"><strong>${esc(u.label)}</strong> <span class="muted small">${eur(u.cost, { decimals: false })} HT${monthly ? ` + ${eur(monthly, { decimals: false })}/mois` : ''}</span><br>
            <span class="small">${esc(u.desc)}</span>${!owned && !c.ok && c.reason ? `<br><span class="small muted">🔒 ${esc(c.reason)}</span>` : ''}</div>
            ${owned ? '<span class="tag good">✔ Acquis</span>' : actBtn('Acheter', { type: 'buyUpgrade', id: u.id }, { cls: 'btn-small', disabled: !c.ok })}
          </li>`;
        })
        .join('')}</ul></div>`;
    })
    .join('');
}

const panel = {
  id: 'entreprise',
  label: 'Entreprise',
  icon: '🏢',
  render(state) {
    const sd = sectorData(state);
    const ui = SECTOR_UI[state.meta.sector];
    return `
    ${ui ? ui.renderSector(state) : ''}
    <section class="card-block">
      <h3>Marketing ${help('Marketing')}</h3>
      ${eurInput('marketing', state.company.marketing, { type: 'setMarketing' }, { min: 0, max: 50000, step: 50, label: `Budget mensuel HT (référence du secteur : ${eur(sd.marketingRef, { decimals: false })})` })}
      <p class="muted small">Dépensé chaque jour. Rendements décroissants : les premiers euros rapportent le plus.</p>
    </section>
    <section class="card-block">
      <h3>Améliorations ${help('Amortissement')}</h3>
      <p class="muted small">Les investissements sont payés tout de suite mais amortis fiscalement sur 3 ans.</p>
      ${renderUpgrades(state)}
    </section>`;
  },
};
return __exports;
})();

// ---- src/ui/panels/finances.js ----
__m["src/ui/panels/finances.js"] = (function () {
const __exports = {};
__def(__exports, { "panel": () => panel });
// Onglet Finances : trésorerie, échéancier fiscal, compte de résultat,
// financement (prêts, investisseurs), rémunération et dividendes.

const { esc, help, eurInput, actBtn } = __m["src/ui/dom.js"];
const { eur, pct } = __m["src/ui/format.js"];
const { CATEGORIES } = __m["src/data/economy.js"];
const { SIMPLIFICATIONS } = __m["src/data/fiscalite.js"];
const { formatMonth, formatDate } = __m["src/engine/calendar.js"];
const { receivablesTotal } = __m["src/engine/ledger.js"];
const { estimateYearTax, quarterlySocial, provisionalBase, STARTER_YEARS } = __m["src/engine/systems/tax.js"];
const { loanOffer, totalDebt, valuation } = __m["src/engine/systems/loans.js"];
const { monthlyWithholding } = __m["src/engine/taxmath.js"];
const { annuity } = __m["src/engine/money.js"];
const { dateOf } = __m["src/engine/calendar.js"];

function catRows(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<tr><td>${esc(CATEGORIES[k] || k)}</td><td class="num">${eur(v, { decimals: false })}</td></tr>`)
    .join('');
}

let loanForm = { amount: 1_000_000, months: 48 };

const panel = {
  id: 'finances',
  label: 'Finances',
  icon: '💶',
  render(state) {
    const f = state.finance;
    const m = f.month;
    const srl = state.meta.legal === 'srl';
    const vatDue = f.vat.collected - f.vat.deductible;
    const est = estimateYearTax(state);
    const sched = state.tax.schedule.slice(0, 8);
    const offer = loanOffer(state, loanForm.months);
    const pay = annuity(Math.min(loanForm.amount, Math.max(offer.max, 0)) || loanForm.amount, offer.rate, loanForm.months);
    const hist = f.history.slice(-6).reverse();
    const yearIdx = dateOf(state.time.day).yearIdx;
    const inv = state.offers.investor;
    return `
    <section class="card-block">
      <h3>Trésorerie ${help('Trésorerie')}</h3>
      <div class="stat-grid">
        <div><span class="muted">Compte pro</span><strong class="${state.cash < 0 ? 'bad' : ''}">${eur(state.cash, { decimals: false })}</strong></div>
        <div><span class="muted">Découvert autorisé ${help('Découvert')}</span><strong>${eur(f.overdraftLimit, { decimals: false })}</strong></div>
        <div><span class="muted">Factures à encaisser ${help('Créance')}</span><strong>${eur(receivablesTotal(state), { decimals: false })}</strong></div>
        <div><span class="muted">TVA du trimestre ${help('TVA')}</span><strong class="${vatDue > 0 ? 'warn' : 'good'}">${vatDue >= 0 ? 'à reverser ' : 'à récupérer '}${eur(Math.abs(vatDue), { decimals: false })}</strong></div>
        <div><span class="muted">Impôt estimé ${dateOf(state.time.day).year} ${help(srl ? 'ISOC' : 'IPP')}</span><strong class="warn">${eur(est.company, { decimals: false })}</strong></div>
        <div><span class="muted">Dettes bancaires</span><strong>${eur(totalDebt(state), { decimals: false })}</strong></div>
      </div>
      ${f.franchise ? '<p class="small">Régime de franchise TVA actif : tu ne factures pas de TVA (et ne la récupères pas).</p>' : ''}
      <p class="small muted">💡 Conseil : garde de côté la TVA du trimestre + l'impôt estimé (${eur(vatDue + est.company, { decimals: false })} au total aujourd'hui).</p>
    </section>

    <section class="card-block">
      <h3>Échéancier</h3>
      ${sched.length ? `<table class="table"><thead><tr><th>Date</th><th>Quoi</th><th class="num">Montant</th><th>Compte</th></tr></thead><tbody>
        ${sched.map((x) => `<tr><td>${formatDate(x.dueDay)}</td><td>${esc(x.label)}</td><td class="num ${x.amount < 0 ? 'good' : 'bad'}">${x.amount < 0 ? 'remb. ' : ''}${eur(Math.abs(x.amount), { decimals: false })}</td><td class="muted small">${x.payer === 'personal' ? 'perso' : 'pro'}</td></tr>`).join('')}
      </tbody></table>` : '<p class="muted">Aucune échéance programmée.</p>'}
      <p class="small muted">La TVA est déclarée chaque trimestre (payée le 20 du mois suivant). L'impôt annuel est calculé au 31 décembre et payé le 30 juin suivant.</p>
    </section>

    <section class="card-block">
      <h3>Toi et ta rémunération ${help(srl ? 'Précompte professionnel' : 'Cotisations sociales')}</h3>
      ${eurInput('draw', state.personal.draw, { type: 'setDraw' }, { min: 0, max: 50000, step: 50, label: srl ? 'Rémunération brute mensuelle (charge de la société)' : 'Prélèvement mensuel (non déductible : ton bénéfice est taxé à l’IPP)' })}
      ${srl ? `<p class="small">Précompte professionnel estimé : ${eur(monthlyWithholding(state.personal.draw), { decimals: false })}/mois. Taux réduit ISOC (20 %) seulement si ta rémunération annuelle ≥ 50 000 € (ou ≥ au bénéfice) ${help('ISOC')}.</p>` : ''}
      <p class="small">Cotisations sociales provisoires : <strong>${eur(quarterlySocial(state), { decimals: false })}/trimestre</strong> (base ${eur(provisionalBase(state), { decimals: false })}/an${yearIdx < STARTER_YEARS ? ', minimum « starter »' : ''}). Payées par ${srl ? 'toi (compte perso)' : 'l’entreprise'}.</p>
      ${!srl && est.regul > 0 ? `<p class="small warn">⚠ Au rythme actuel, régularisation estimée : ${eur(est.regul, { decimals: false })} (payable en septembre de l’année suivante). ${help('Régularisation')}</p>` : ''}
      ${eurInput('socialbase', state.tax.social.chosenBase, { type: 'setSocialBase' }, { min: 0, max: 500000, step: 1000, label: 'Augmenter volontairement la base de mes provisionnelles (€/an, 0 = automatique)' })}
      <p class="muted small">Payer plus de provisionnelles maintenant évite le choc de la régularisation plus tard.</p>
      <p class="small">Compte perso : <strong>${eur(state.personal.cash, { decimals: false })}</strong> · coût de la vie : ${eur(state.personal.livingCost, { decimals: false })}/mois.</p>
      <div class="btns">${[100_000, 500_000, 1_000_000].map((v) => actBtn(`Apport perso ${eur(v, { decimals: false })}`, { type: 'apport', value: v }, { cls: 'btn-small', disabled: state.personal.cash < v })).join('')}</div>
    </section>

    ${srl ? `<section class="card-block">
      <h3>Dividendes ${help('Dividendes')}</h3>
      <p class="small">Bénéfices reportés distribuables : <strong>${eur(state.tax.reserves, { decimals: false })}</strong>. Précompte mobilier cette année : ${pct(yearIdx <= 0 ? 0.3 : yearIdx === 1 ? 0.2 : 0.15)} ${help('VVPR-bis')}. Tu détiens ${pct(state.ownership.founder)} des parts.</p>
      <div class="btns">${[0.25, 0.5, 1].map((p) => {
        const amt = Math.floor(Math.min(state.tax.reserves * p, Math.max(0, state.cash)) / 10_000) * 10_000;
        return actBtn(`Distribuer ${eur(amt, { decimals: false })}`, { type: 'payDividend', amount: amt }, { cls: 'btn-small', disabled: amt < 10_000 });
      }).join('')}</div>
    </section>` : ''}

    <section class="card-block">
      <h3>Financement ${help('Prêt bancaire')}</h3>
      <p class="small">La banque te propose aujourd'hui : jusqu'à <strong>${eur(offer.max, { decimals: false })}</strong> à <strong>${(offer.rate * 100).toFixed(2).replace('.', ',')} %</strong>/an.</p>
      <div class="form-row">
        <label class="field"><span>Montant (€)</span><input type="number" id="loan-amount" min="1000" step="1000" value="${loanForm.amount / 100}"></label>
        <label class="field"><span>Durée (mois)</span><select id="loan-months">${[12, 24, 36, 48, 60, 84].map((n) => `<option ${n === loanForm.months ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <button type="button" class="btn btn-small" data-ui="requestLoan">Demander</button>
      </div>
      <p class="small muted">Mensualité estimée : ${eur(pay, { decimals: false })} · intérêts déductibles, capital non ${help('Mensualité')}</p>
      ${state.loans.length ? `<table class="table"><thead><tr><th>Prêt</th><th class="num">Reste</th><th class="num">Mensualité</th><th class="num">Taux</th><th></th></tr></thead><tbody>
        ${state.loans.map((l) => `<tr><td>${eur(l.principal, { decimals: false })} · ${l.monthsLeft}/${l.months} mois</td><td class="num">${eur(l.remaining, { decimals: false })}</td><td class="num">${eur(l.payment, { decimals: false })}</td><td class="num">${(l.rate * 100).toFixed(2).replace('.', ',')} %</td><td>${actBtn('Rembourser', { type: 'repayLoan', id: l.id }, { cls: 'btn-small', title: 'Remboursement anticipé : indemnité de 3 mois d’intérêts' })}</td></tr>`).join('')}
      </tbody></table>` : ''}
      ${srl ? `<h4>Investisseurs ${help('Business angel')}</h4>
        ${inv ? `<p><strong>${esc(inv.name)}</strong> propose <strong>${eur(inv.amount, { decimals: false })}</strong> contre <strong>${pct(inv.stake)}</strong> des parts (valorisation ${eur(Math.round(inv.amount / inv.stake), { decimals: false })}). Offre valable jusqu'au ${formatDate(inv.expires)}. En échange, ils attendent ≈ 5 %/an de dividendes.</p>
          <div class="btns">${actBtn('Accepter', { type: 'acceptInvestor' }, { cls: 'btn-small btn-primary' })}${actBtn('Refuser', { type: 'declineInvestor' }, { cls: 'btn-small' })}</div>`
          : `<p class="small muted">Valorisation estimée de ta société : ${eur(valuation(state), { decimals: false })}.</p>${actBtn('Chercher un investisseur', { type: 'seekInvestor' }, { cls: 'btn-small' })}`}
        ${state.ownership.investors.length ? `<p class="small">Associés : ${state.ownership.investors.map((i) => `${esc(i.name)} (${pct(i.stake)})`).join(', ')}.</p>` : ''}` : '<p class="small muted">En indépendant, pas d’investisseurs possibles : il faudrait une société.</p>'}
    </section>

    <section class="card-block">
      <h3>Ce mois-ci ${help('Marge')}</h3>
      <table class="table"><tbody>
        <tr><th>Chiffre d'affaires HT</th><td class="num good">${eur(m.revenue, { decimals: false })}</td></tr>
        <tr><th>Charges déductibles</th><td class="num bad">${eur(m.expenses, { decimals: false })}</td></tr>
        <tr><th>Résultat avant impôts</th><td class="num">${eur(m.revenue - m.expenses, { decimals: false })}</td></tr>
      </tbody></table>
      <details><summary>Sorties de trésorerie par catégorie</summary><table class="table"><tbody>${catRows(m.byCat) || '<tr><td class="muted">Rien encore.</td></tr>'}</tbody></table></details>
    </section>

    <section class="card-block">
      <h3>Derniers mois</h3>
      <table class="table"><thead><tr><th>Mois</th><th class="num">CA</th><th class="num">Charges</th><th class="num">Résultat</th><th class="num">Trésorerie</th></tr></thead><tbody>
      ${hist.map((h) => `<tr><td>${formatMonth(h.m)}</td><td class="num">${eur(h.revenue, { decimals: false })}</td><td class="num">${eur(h.expenses, { decimals: false })}</td><td class="num ${h.profit < 0 ? 'bad' : 'good'}">${eur(h.profit, { decimals: false })}</td><td class="num">${eur(h.cash, { decimals: false })}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Pas encore d’historique.</td></tr>'}
      </tbody></table>
    </section>

    ${state.tax.results.length ? `<section class="card-block">
      <h3>Bilans annuels</h3>
      <table class="table"><thead><tr><th>Année</th><th class="num">Résultat</th><th class="num">${srl ? 'ISOC' : 'IPP'}</th><th class="num">Régul. cotis.</th></tr></thead><tbody>
      ${[...state.tax.results].reverse().slice(0, 8).map((r) => `<tr><td>${r.year}</td><td class="num">${eur(r.operating, { decimals: false })}</td><td class="num">${eur(srl ? r.isoc : r.ipp, { decimals: false })}${srl && !r.reduced && r.taxable > 0 ? ' <span class="warn small">(25 %)</span>' : ''}</td><td class="num">${eur(r.regul || 0, { decimals: false })}</td></tr>`).join('')}
      </tbody></table></section>` : ''}

    <section class="card-block">
      <details><summary>⚠ Fiscalité simplifiée — ce que le jeu ne modélise pas exactement</summary>
      <ul class="small">${SIMPLIFICATIONS.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="small muted">Tous les taux sont dans src/data/fiscalite.js avec leur source et la mention « à vérifier ». Ne pas utiliser pour une vraie déclaration.</p></details>
    </section>`;
  },
  mount(el) {
    // Mémorise la saisie du formulaire de prêt (le panneau est re-rendu régulièrement).
    const a = el.querySelector('#loan-amount');
    const mo = el.querySelector('#loan-months');
    if (a) a.addEventListener('input', () => (loanForm.amount = Math.round(Number(a.value) * 100) || 0));
    if (mo) mo.addEventListener('change', () => (loanForm.months = Number(mo.value)));
  },
  ui(cmd, arg, app) {
    if (cmd === 'requestLoan') {
      const a = Math.round(Number(document.getElementById('loan-amount').value) * 100);
      const mo = Number(document.getElementById('loan-months').value);
      loanForm = { amount: a, months: mo };
      app.dispatch({ type: 'requestLoan', amount: a, months: mo });
    }
  },
};
return __exports;
})();

// ---- src/ui/panels/equipe.js ----
__m["src/ui/panels/equipe.js"] = (function () {
const __exports = {};
__def(__exports, { "panel": () => panel });
// Onglet Équipe : employés, candidats, gérant.

const { esc, actBtn, help } = __m["src/ui/dom.js"];
const { eur, num } = __m["src/ui/format.js"];
const { TRAITS } = __m["src/data/people.js"];
const { roles, employerCost, dismissalCost, noticeWeeksOf, seatsAvailable, hasManager, TRAINING_COST, JOB_AD_COST, monthlyPayroll, marketSalary } = __m["src/engine/systems/staff.js"];
const { DAYS_PER_MONTH } = __m["src/engine/calendar.js"];

function motivationLabel(m) {
  if (m >= 75) return '<span class="good">😀 motivé·e</span>';
  if (m >= 50) return '<span>🙂 correct</span>';
  if (m >= 25) return '<span class="warn">😐 démotivé·e</span>';
  return '<span class="bad">😠 au bord du départ</span>';
}

const panel = {
  id: 'equipe',
  label: 'Équipe',
  icon: '👥',
  render(state) {
    const R = roles(state);
    const st = state.staff;
    const emps = st.employees
      .map((e) => {
        const r = R[e.role];
        const months = Math.floor((state.time.day - e.hiredDay) / DAYS_PER_MONTH);
        const absent = state.time.day < e.absentUntil;
        const ratio = e.salary / marketSalary(state, e.role, e.skill);
        return `<li class="row">
          <div class="grow"><strong>${esc(e.name)}</strong> — ${esc(r ? r.label : e.role)} <span class="tag">${esc(TRAITS[e.trait]?.label || e.trait)}</span>${absent ? ' <span class="tag warn">absent·e</span>' : ''}<br>
          <span class="small">Compétence ${e.skill}/100 · ${motivationLabel(e.motivation)} (${num(e.motivation)}) · brut ${eur(e.salary, { decimals: false })} (${ratio >= 1 ? 'au-dessus' : 'en dessous'} du marché) · coût ${eur(employerCost(e), { decimals: false })}/mois · ${months} mois d'ancienneté</span></div>
          <div class="btns">
          ${actBtn('Former', { type: 'train', id: e.id }, { cls: 'btn-small', title: `${eur(TRAINING_COST, { decimals: false })} HT, 5 jours d'absence, +8 compétence` })}
          ${actBtn('Augmenter 5 %', { type: 'raise', id: e.id }, { cls: 'btn-small' })}
          <button type="button" class="btn btn-small btn-danger" data-act='${esc(JSON.stringify({ type: 'fire', id: e.id }))}' data-confirm="${esc(`Licencier ${e.name} ? Préavis de ${noticeWeeksOf(state, e)} semaine(s) payé en indemnité : ${eur(dismissalCost(state, e), { decimals: false })}.`)}">Licencier</button>
          </div></li>`;
      })
      .join('');
    const cands = st.candidates
      .map((c) => {
        const r = R[c.role];
        const t = TRAITS[c.trait];
        return `<li class="row">
          <div class="grow"><strong>${esc(c.name)}</strong> — ${esc(r ? r.label : c.role)} <span class="tag" title="${esc(t?.desc || '')}">${esc(t?.label || c.trait)}</span><br>
          <span class="small">Compétence ${c.skill}/100 · demande ${eur(c.salary, { decimals: false })} brut/mois → coût employeur ≈ ${eur(employerCost(c), { decimals: false })}/mois</span><br>
          <span class="small muted">${esc(r?.desc || '')}</span></div>
          ${actBtn('Embaucher', { type: 'hire', id: c.id }, { cls: 'btn-small btn-primary' })}
        </li>`;
      })
      .join('');
    const roleOpts = Object.values(R)
      .map((r) => actBtn(`Annonce : ${esc(r.label)}`, { type: 'postJobAd', role: r.id }, { cls: 'btn-small', title: `${eur(JOB_AD_COST, { decimals: false })} HT : 3 nouveaux candidats` }))
      .join(' ');
    const f = st.founder;
    return `
    <section class="card-block">
      <h3>Toi, ${esc(state.meta.founderName)}</h3>
      <p>${f.active ? 'Tu travailles dans l’entreprise (ta capacité de travail compte).' : 'Tu t’es retiré·e de l’opérationnel : ton gérant dirige, le bénéfice compte comme revenu passif.'}</p>
      ${f.active
        ? actBtn('Me retirer de l’opérationnel', { type: 'retire' }, { disabled: !hasManager(state), title: hasManager(state) ? '' : 'Recrute d’abord un·e gérant·e (compétence ≥ 40).' })
        : actBtn('Reprendre du service', { type: 'unretire' })}
      <p class="muted small">Places de travail libres : ${Math.max(0, seatsAvailable(state))}. Masse salariale : ${eur(monthlyPayroll(state), { decimals: false })}/mois ${help('Coût employeur')}</p>
    </section>
    <section class="card-block">
      <h3>Employés (${st.employees.length})</h3>
      ${emps ? `<ul class="list">${emps}</ul>` : '<p class="muted">Personne pour l’instant. Recrute quand ta capacité est saturée.</p>'}
    </section>
    <section class="card-block">
      <h3>Candidats ${help('Préavis')}</h3>
      ${cands ? `<ul class="list">${cands}</ul>` : '<p class="muted">Aucun candidat. Publie une annonce ou attends le mois prochain.</p>'}
      <div class="btns wrap">${roleOpts}</div>
    </section>`;
  },
};
return __exports;
})();

// ---- src/ui/panels/evenements.js ----
__m["src/ui/panels/evenements.js"] = (function () {
const __exports = {};
__def(__exports, { "panel": () => panel });
// Onglet Événements : journal complet.

const { esc } = __m["src/ui/dom.js"];
const { formatDate } = __m["src/engine/calendar.js"];

const ICON = { good: '✅', bad: '⚠️', tax: '🧾', event: '🎲', staff: '👤', market: '📈', invest: '💹', info: 'ℹ️' };

const panel = {
  id: 'evenements',
  label: 'Journal',
  icon: '📰',
  render(state) {
    const entries = [...state.log].reverse().slice(0, 120);
    return `<section class="card-block"><h3>Journal de l'entreprise</h3>
      <ul class="journal">${entries.map((e) => `<li class="j-${e.kind}"><span class="j-date">${formatDate(e.day)}</span> ${ICON[e.kind] || ''} ${esc(e.text)}</li>`).join('')}</ul></section>`;
  },
};
return __exports;
})();

// ---- src/ui/panels/index.js ----
__m["src/ui/panels/index.js"] = (function () {
const __exports = {};
__def(__exports, { "PANELS": () => PANELS });
// Liste ordonnée des onglets.

const { panel: entreprise } = __m["src/ui/panels/entreprise.js"];
const { panel: finances } = __m["src/ui/panels/finances.js"];
const { panel: equipe } = __m["src/ui/panels/equipe.js"];
const { panel: evenements } = __m["src/ui/panels/evenements.js"];

const PANELS = [entreprise, finances, equipe, evenements];
return __exports;
})();

// ---- src/ui/audio.js ----
__m["src/ui/audio.js"] = (function () {
const __exports = {};
__def(__exports, { "audio": () => audio });
// Sons chiptune générés par WebAudio (aucun fichier). Désactivés par défaut.

const SOUNDS = {
  click: [[660, 0.03, 'square']],
  coin: [[988, 0.05, 'square'], [1319, 0.09, 'square']],
  good: [[523, 0.06, 'triangle'], [659, 0.06, 'triangle'], [784, 0.1, 'triangle']],
  bad: [[330, 0.09, 'sawtooth'], [247, 0.14, 'sawtooth']],
  event: [[440, 0.06, 'square'], [554, 0.06, 'square']],
  win: [[523, 0.1, 'square'], [659, 0.1, 'square'], [784, 0.1, 'square'], [1047, 0.25, 'square']],
  lose: [[392, 0.15, 'triangle'], [330, 0.15, 'triangle'], [262, 0.35, 'triangle']],
};

class Chiptune {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.lastPlay = 0;
  }

  setEnabled(on) {
    this.enabled = !!on;
    if (this.enabled) this._ensure();
  }

  _ensure() {
    if (this.ctx) return this.ctx;
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return null;
    try {
      this.ctx = new AC();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  play(name) {
    if (!this.enabled) return;
    const ctx = this._ensure();
    const seq = SOUNDS[name];
    if (!ctx || !seq) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    if (now - this.lastPlay < 0.04) return; // évite les rafales
    this.lastPlay = now;
    let t = now;
    for (const [freq, dur, type] of seq) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
      t += dur * 0.9;
    }
  }
}

const audio = new Chiptune();
return __exports;
})();

// ---- src/data/glossary.js ----
__m["src/data/glossary.js"] = (function () {
const __exports = {};
__def(__exports, { "GLOSSARY": () => GLOSSARY });
// Glossaire pédagogique. Clé = terme affiché, valeur = explication simple.

const GLOSSARY = {
  TVA: "Taxe sur la valeur ajoutée. Tu l'ajoutes à tes prix (21 %, 12 % ou 6 % selon le produit), tu la collectes pour l'État et tu récupères celle payée sur tes achats. Chaque trimestre, tu reverses la différence. Ce n'est jamais ton argent : mets-la de côté.",
  'Franchise TVA': "Régime optionnel pour les petites entreprises (CA < 25 000 €/an) : pas de TVA facturée, pas de TVA récupérée, pas de déclarations périodiques. Avantageux si tes clients sont des particuliers, mais tu perds la TVA sur tes achats.",
  HT: "Hors taxes : le prix sans la TVA. C'est ce que tu gagnes vraiment sur une vente.",
  TTC: "Toutes taxes comprises : le prix payé par le client, TVA incluse.",
  "Chiffre d'affaires": "Total des ventes HT sur une période. Ce n'est pas un bénéfice : il faut encore payer toutes les charges.",
  Marge: "Ce qui reste après les coûts. Marge brute = prix de vente − coût direct (ingrédients, stock, matériel). Résultat = chiffre d'affaires − toutes les charges.",
  Trésorerie: "L'argent réellement disponible sur ton compte. Une entreprise rentable peut faire faillite si sa trésorerie tombe à zéro (factures payées en retard, TVA à reverser, impôt…).",
  'Besoin en fonds de roulement': "L'argent bloqué entre le moment où tu paies (stock, salaires) et celui où tes clients te paient. Plus il est grand, plus il te faut de trésorerie.",
  Découvert: "Autorisation de la banque d'avoir un compte négatif jusqu'à une limite. Pratique mais cher (≈ 9,5 %/an dans le jeu). Au-delà de la limite : défaut de paiement.",
  Faillite: "Quand l'entreprise ne peut plus payer ses dettes durablement, le tribunal de l'entreprise prononce la faillite. En indépendant, tes biens personnels peuvent être saisis.",
  IPP: "Impôt des personnes physiques. Progressif : 25 %, 40 %, 45 % puis 50 % par tranches de revenu, après une quotité exemptée. S'ajoutent les additionnels communaux (≈ 7 %).",
  'Quotité exemptée': "Partie de ton revenu sur laquelle tu ne paies pas d'impôt (≈ 10 910 € en 2026, à vérifier). Techniquement, c'est une réduction d'impôt calculée au taux de la première tranche.",
  ISOC: "Impôt des sociétés : 25 %, ou 20 % sur les premiers 100 000 € de bénéfice pour une PME qui paie à son dirigeant au moins 50 000 € par an (seuil 2026 à vérifier).",
  'Cotisations sociales': "L'indépendant paie lui-même sa sécurité sociale (pension, soins de santé, allocations) : ≈ 20,5 % de son revenu, avec un minimum trimestriel. Les cotisations provisoires sont régularisées quand le revenu réel est connu.",
  Régularisation: "Rattrapage des cotisations sociales quand ton revenu réel dépasse celui sur lequel tes provisionnelles étaient calculées. Pour un starter qui réussit, la facture peut être très lourde.",
  'Précompte professionnel': "Avance sur l'IPP retenue chaque mois sur un salaire ou une rémunération de dirigeant, et versée au fisc. Régularisée lors de la déclaration annuelle.",
  'Précompte mobilier': "Impôt retenu à la source sur les dividendes et les intérêts : 30 % en général, 15 % sur certains dividendes de PME (VVPR-bis), 15 % sur les intérêts d'épargne réglementée au-delà de l'exonération.",
  Dividendes: "Part du bénéfice (après ISOC) qu'une société verse à ses actionnaires. Soumis au précompte mobilier. Ils ne sont possibles que si la société a des réserves et de la trésorerie.",
  'VVPR-bis': "Régime belge qui réduit le précompte mobilier sur les dividendes de PME créées depuis 2013 : 20 % puis 15 % à partir du 3e exercice (sous conditions).",
  SRL: "Société à responsabilité limitée. Une personne morale distincte de toi : elle paie l'ISOC et tes biens personnels sont protégés. Plus de formalités et de frais.",
  Indépendant: "Tu exerces en personne physique : démarrage simple, mais le bénéfice est taxé à l'IPP et tu es responsable des dettes sur tout ton patrimoine.",
  Amortissement: "Un investissement (ordinateur, local, machine) n'est pas une charge d'un coup : sa valeur est déduite sur plusieurs années (3 ans dans le jeu). Tu paies tout de suite, mais l'économie d'impôt est étalée.",
  'Coût employeur': "Ce que coûte vraiment un salarié : brut + cotisations patronales (≈ 25 %) + pécule de vacances, prime de fin d'année, assurances… Le jeu utilise brut × 1,35.",
  RMMMG: "Revenu minimum mensuel moyen garanti : le salaire minimum belge (≈ 2 190 € brut/mois depuis avril 2026).",
  Préavis: "Délai (ou indemnité) dû quand on licencie, selon l'ancienneté du travailleur : de 1 semaine au début à plusieurs mois après quelques années.",
  'Premiers engagements': "Réduction de cotisations patronales pour tes premiers salariés : 2 000 €/trimestre pour le 1er, 1 000 €/trimestre pour les 2e à 5e (pendant 3 ans).",
  Réputation: "Ce que le marché pense de toi (0 à 100). Elle suit lentement la satisfaction de tes clients et multiplie ta demande. Elle se gagne en mois et se perd en jours.",
  Élasticité: "À quel point la demande réagit au prix. Élasticité forte : une petite hausse de prix fait fuir beaucoup de clients.",
  Marketing: "Dépenses pour te faire connaître. Rendements décroissants : passer de 0 à 500 € rapporte beaucoup plus que de 5 000 à 5 500 €.",
  'Coût d’acquisition client': "CAC : combien tu dépenses en publicité pour obtenir un client. Si le CAC dépasse la marge d'une commande, chaque vente te fait perdre de l'argent.",
  'Taux de conversion': "Part des visiteurs qui achètent (souvent 1 à 3 % en e-commerce). Il dépend du prix, de la qualité du site et des avis.",
  'Panier moyen': "Montant moyen d'une commande. Augmenter le panier moyen rentabilise chaque visiteur payé.",
  Saisonnalité: "Variation normale de la demande selon la période : été pour les terrasses, Black Friday pour l'e-commerce, examens pour le soutien scolaire.",
  'Part de marché': "Ta part des clients du marché face aux concurrents. Elle dépend de ton attractivité (prix, qualité, réputation, marketing) comparée à la leur.",
  'Prêt bancaire': "Somme empruntée remboursée par mensualités constantes (capital + intérêts). Les intérêts sont une charge déductible, le capital non.",
  Mensualité: "Paiement mensuel fixe d'un prêt. Au début, il contient surtout des intérêts ; à la fin, surtout du capital.",
  'Business angel': "Investisseur privé qui apporte de l'argent contre une part de ta société. Tu n'as rien à rembourser, mais il touche une partie des bénéfices pour toujours.",
  ETF: "Fonds coté qui réplique un indice (ex. : toutes les grandes entreprises du monde). Diversifié et peu cher : le placement de base de la plupart des investisseurs.",
  TOB: "Taxe sur les opérations de bourse, payée à chaque achat et vente : 0,12 % pour la plupart des ETF, 0,35 % pour les actions (plafonnée).",
  'Taxe sur les plus-values': "Depuis 2026, 10 % sur les plus-values réalisées sur les actifs financiers au-delà de 10 000 €/an (simplifié dans le jeu).",
  'Intérêts composés': "Tes gains produisent eux-mêmes des gains. À 7 %/an, un capital double environ tous les 10 ans : le temps est ton meilleur allié.",
  'Revenu passif': "Revenu qui arrive sans que tu travailles : intérêts, dividendes, loyers, ou une entreprise dirigée par un gérant. L'objectif du jeu.",
  'Règle des 4 %': "Convention de la « liberté financière » : on peut retirer environ 4 % par an d'un portefeuille diversifié sans l'épuiser à long terme. 900 000 € investis ≈ 3 000 €/mois.",
  'Liberté financière': "Quand tes revenus passifs couvrent ton train de vie : travailler devient un choix.",
  'Patrimoine net': "Tout ce que tu possèdes (comptes, placements, part de l'entreprise, immobilier) moins tes dettes.",
  'Droits d’enregistrement': "Taxe régionale payée à l'achat d'un bien immobilier : 12,5 % en Wallonie et à Bruxelles (12 % en Flandre) pour un bien qui n'est pas ta résidence.",
  'Précompte immobilier': "Impôt annuel sur un bien immobilier, calculé sur son revenu cadastral (approximé à un mois de loyer par an dans le jeu).",
  AFSCA: "Agence fédérale pour la sécurité de la chaîne alimentaire. Elle contrôle l'hygiène des restaurants et peut infliger des amendes ou fermer un établissement.",
  SaaS: "Software as a Service : un logiciel vendu par abonnement mensuel. Coûteux à développer, mais chaque nouvel abonné ne coûte presque rien : idéal pour le revenu récurrent.",
  'Revenu récurrent': "Revenu qui revient chaque mois sans nouvelle vente (abonnements, contrats de maintenance). Il rend l'entreprise plus prévisible et plus facile à déléguer.",
  Gérant: "Personne qui dirige l'opérationnel à ta place. Indispensable pour que ton entreprise devienne un revenu passif.",
  Créance: "Facture émise mais pas encore payée par le client. Attention : la TVA est due dès la facture, même si le client paie en retard.",
};
return __exports;
})();

// ---- src/ui/glossary.js ----
__m["src/ui/glossary.js"] = (function () {
const __exports = {};
__def(__exports, { "openGlossary": () => openGlossary });
// Glossaire pédagogique (fenêtre modale avec recherche).

const { GLOSSARY } = __m["src/data/glossary.js"];
const { esc } = __m["src/ui/dom.js"];

function openGlossary(app, term) {
  const keys = Object.keys(GLOSSARY).sort((a, b) => a.localeCompare(b, 'fr'));
  const render = (filter) =>
    keys
      .filter((k) => !filter || k.toLowerCase().includes(filter) || GLOSSARY[k].toLowerCase().includes(filter))
      .map((k) => `<dt id="g-${esc(k)}">${esc(k)}</dt><dd>${esc(GLOSSARY[k])}</dd>`)
      .join('');
  const m = app.openModal({
    title: 'Glossaire',
    cls: 'modal-wide',
    html: `<label class="field"><span>Rechercher</span><input type="search" id="g-search" value="" autofocus></label><dl class="glossary">${render('')}</dl>`,
  });
  const input = m.querySelector('#g-search');
  input.addEventListener('input', () => {
    m.querySelector('.glossary').innerHTML = render(input.value.trim().toLowerCase());
  });
  if (term && GLOSSARY[term]) {
    const el = m.querySelector(`[id="g-${CSS.escape(term)}"]`);
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.classList.add('highlight');
      el.nextElementSibling?.classList.add('highlight');
    }
  }
}
return __exports;
})();

// ---- src/data/tutorial.js ----
__m["src/data/tutorial.js"] = (function () {
const __exports = {};
__def(__exports, { "TUTORIAL": () => TUTORIAL });
// Étapes du tutoriel de premier lancement. `tab` = onglet à ouvrir, `target` = sélecteur CSS à mettre en évidence.

const TUTORIAL = [
  { title: 'Bienvenue, entrepreneur !', text: 'Ton objectif : faire grandir ton entreprise, survivre au fisc, puis construire des revenus passifs jusqu’à la liberté financière. Le jeu est en pause : prends ton temps.', target: null },
  { title: 'La barre du haut', text: 'Ta trésorerie (compte pro), ton compte perso, ta réputation et ton revenu passif face à l’objectif. Si la trésorerie passe sous le découvert autorisé, un compte à rebours de faillite démarre.', target: '.topbar' },
  { title: 'Le temps', text: 'Pause, ×1, ×2, ×4. Un mois dure une minute à ×1. Raccourcis : Espace = pause, 1/2/3 = vitesses.', target: '.tb-speed' },
  { title: 'Ton entreprise', text: 'Ici tu fixes tes prix, ton marketing et tu achètes des améliorations. Chaque secteur a ses propres leviers.', target: '#panel', tab: 'entreprise' },
  { title: 'Pourquoi mes ventes ?', text: 'Ce panneau montre chaque facteur qui pousse ta demande vers le haut ou vers le bas, et le goulet d’étranglement actuel.', target: '.why' },
  { title: 'Les finances', text: 'Attention à la TVA du trimestre et aux impôts : ils arrivent après l’encaissement. Les « ? » ouvrent le glossaire.', target: '#panel', tab: 'finances' },
  { title: 'C’est parti !', text: 'Commence petit, surveille ta trésorerie, recrute quand tu es saturé. Bonne chance ! Tu peux revoir ce tutoriel dans le menu ☰.', target: null, tab: 'entreprise' },
];
return __exports;
})();

// ---- src/ui/tutorial.js ----
__m["src/ui/tutorial.js"] = (function () {
const __exports = {};
__def(__exports, { "startTutorial": () => startTutorial });
// Tutoriel court (premier lancement), rejouable depuis le menu.

const { TUTORIAL } = __m["src/data/tutorial.js"];
const { esc } = __m["src/ui/dom.js"];

function startTutorial(app, force) {
  if (!force && app.settings.tutorialDone) return;
  app.setSpeed(0);
  let i = 0;
  const box = document.createElement('div');
  box.className = 'tutorial';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-live', 'polite');
  document.body.appendChild(box);
  let hl = null;
  const finish = () => {
    if (hl) hl.classList.remove('tuto-highlight');
    box.remove();
    app.settings.tutorialDone = true;
    app.saveSettings();
    document.removeEventListener('keydown', onKey, true);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      finish();
    }
  };
  document.addEventListener('keydown', onKey, true);
  const show = () => {
    const step = TUTORIAL[i];
    if (step.tab && app.game) app.game.selectTab(step.tab);
    if (hl) hl.classList.remove('tuto-highlight');
    hl = step.target ? document.querySelector(step.target) : null;
    if (hl) {
      hl.classList.add('tuto-highlight');
      hl.scrollIntoView({ block: 'nearest' });
    }
    box.innerHTML = `<div class="tuto-step">${i + 1}/${TUTORIAL.length}</div><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p>
      <div class="btns"><button type="button" class="btn btn-small" data-t="skip">Passer</button>
      ${i > 0 ? '<button type="button" class="btn btn-small" data-t="prev">← Précédent</button>' : ''}
      <button type="button" class="btn btn-small btn-primary" data-t="next">${i === TUTORIAL.length - 1 ? 'Jouer !' : 'Suivant →'}</button></div>`;
    box.querySelector('[data-t="next"]').focus();
  };
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    if (b.dataset.t === 'skip') return finish();
    if (b.dataset.t === 'prev') i = Math.max(0, i - 1);
    if (b.dataset.t === 'next') {
      if (i === TUTORIAL.length - 1) return finish();
      i++;
    }
    show();
  });
  show();
}
return __exports;
})();

// ---- src/engine/events.js ----
__m["src/engine/events.js"] = (function () {
const __exports = {};
__def(__exports, { "describeEffects": () => describeEffects });
// Moteur d'événements (complété en phase 4).

function describeEffects() {
  return [];
}
return __exports;
})();

// ---- src/ui/decision.js ----
__m["src/ui/decision.js"] = (function () {
const __exports = {};
__def(__exports, { "showDecisionModal": () => showDecisionModal });
// Fenêtre de décision pour les événements à choix (le jeu est en pause).

const { esc } = __m["src/ui/dom.js"];
const { openModal, closeModal } = __m["src/ui/modal.js"];
const { describeEffects } = __m["src/engine/events.js"];

function showDecisionModal(app, onDone) {
  const s = app.state;
  const ev = s.events.pending[0];
  if (!ev) return onDone();
  const choices = ev.choices
    .map((c, i) => {
      const lines = describeEffects(s, c);
      return `<li class="choice"><button type="button" class="btn choice-btn" data-choice="${i}">${esc(c.label)}</button>
        <ul class="effects">${lines.map((l) => `<li class="${l.kind}">${esc(l.text)}</li>`).join('') || '<li class="muted">Aucun effet direct.</li>'}</ul></li>`;
    })
    .join('');
  const m = openModal({
    title: esc(ev.title),
    closable: false,
    cls: 'modal-decision',
    html: `<p class="event-text">${esc(ev.text)}</p><ul class="choices">${choices}</ul>`,
  });
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-choice]');
    if (!b) return;
    const res = app.dispatch({ type: 'decide', uid: ev.uid, choice: Number(b.dataset.choice) });
    if (res.ok) {
      closeModal(true);
      onDone();
    }
  });
}
return __exports;
})();

// ---- src/ui/screens/game.js ----
__m["src/ui/screens/game.js"] = (function () {
const __exports = {};
__def(__exports, { "GameScreen": () => GameScreen });
// Écran de jeu : barre du haut, scène animée, indicateurs, onglets.

const { esc, $ } = __m["src/ui/dom.js"];
const { eur, eurShort, num, byFmt } = __m["src/ui/format.js"];
const { formatDate, dateOf, WEEKDAY_NAMES } = __m["src/engine/calendar.js"];
const { WEATHER } = __m["src/data/world.js"];
const { CONFIG } = __m["src/data/config.js"];
const { kpis } = __m["src/engine/selectors.js"];
const { Scene } = __m["src/ui/scene.js"];
const { PANELS } = __m["src/ui/panels/index.js"];
const { toast } = __m["src/ui/toast.js"];
const { audio } = __m["src/ui/audio.js"];
const { openLoadDialog } = __m["src/ui/screens/title.js"];
const { openGlossary } = __m["src/ui/glossary.js"];
const { startTutorial } = __m["src/ui/tutorial.js"];
const { showDecisionModal } = __m["src/ui/decision.js"];
const { passiveIncome } = __m["src/engine/selectors.js"];
const { isModalOpen, closeModal } = __m["src/ui/modal.js"];
const { DIFFICULTIES } = __m["src/data/difficulty.js"];
const { mountPixelTitles } = __m["src/ui/pixelfont.js"];

const SPEED_LABELS = ['⏸', '×1', '×2', '×4'];
const WEATHER_ICON = { soleil: '☀', nuageux: '☁', pluie: '🌧', froid: '❄', canicule: '🔥' };

class GameScreen {
  constructor(app) {
    this.app = app;
    this.tab = 'entreprise';
    this.panelHtml = '';
    this.sideHtml = '';
    this.refreshAcc = 0;
    this.lastLogId = app.state.logSeq || 0;
    this.scene = null;
    this.decisionOpen = false;
  }

  get state() {
    return this.app.state;
  }

  mount() {
    const s = this.state;
    this.app.root.innerHTML = `
    <div class="game">
      <header class="topbar" aria-label="Indicateurs principaux">
        <div class="tb-company"><span class="tb-name">${esc(s.meta.companyName)}</span><span class="tb-sub muted" id="tb-sub"></span></div>
        <div class="tb-stat" title="Trésorerie du compte professionnel"><span class="tb-label">Trésorerie</span><span id="tb-cash" class="tb-value"></span></div>
        <div class="tb-stat" title="Ton compte personnel"><span class="tb-label">Perso</span><span id="tb-perso" class="tb-value"></span></div>
        <div class="tb-stat" title="Réputation (0-100)"><span class="tb-label">Réputation</span><span id="tb-rep" class="tb-value"></span></div>
        <div class="tb-stat" title="Revenu passif mensuel net / objectif"><span class="tb-label">Revenu passif</span><span id="tb-passive" class="tb-value"></span></div>
        <div class="tb-date"><span id="tb-date"></span><span id="tb-weather" class="muted"></span></div>
        <div class="tb-speed" role="group" aria-label="Vitesse du jeu">
          ${SPEED_LABELS.map((l, i) => `<button type="button" class="btn btn-speed" data-ui="speed" data-arg="${i}" aria-label="${i === 0 ? 'Pause' : `Vitesse ${l}`}">${l}</button>`).join('')}
        </div>
        <button type="button" class="btn btn-icon" data-ui="menu" aria-label="Menu">☰</button>
      </header>
      <div class="game-main">
        <section class="left" aria-label="Ton entreprise">
          <div class="scene-wrap"><canvas id="scene" class="scene" aria-label="Scène animée de ton entreprise"></canvas>
            <div id="alert" class="scene-alert" role="alert" hidden></div></div>
          <div id="side" class="side"></div>
        </section>
        <section class="right" aria-label="Gestion">
          <nav class="tabs" role="tablist">
            ${PANELS.map((p) => `<button type="button" role="tab" class="tab" id="tab-${p.id}" data-ui="tab" data-arg="${p.id}" aria-controls="panel">${p.icon} <span>${p.label}</span></button>`).join('')}
          </nav>
          <div id="panel" class="panel" role="tabpanel" tabindex="-1"></div>
        </section>
      </div>
    </div>`;
    this.scene = new Scene($('#scene'));
    this.root = this.app.root.querySelector('.game');
    this._onClick = (e) => this.onClick(e);
    this._onChange = (e) => this.onChange(e);
    this._onInput = (e) => this.onInput(e);
    this.root.addEventListener('click', this._onClick);
    this.root.addEventListener('change', this._onChange);
    this.root.addEventListener('input', this._onInput);
    this.selectTab(this.tab);
    this.refresh(true);
  }

  unmount() {
    if (this.root) {
      this.root.removeEventListener('click', this._onClick);
      this.root.removeEventListener('change', this._onChange);
      this.root.removeEventListener('input', this._onInput);
    }
  }

  // --- Interactions ----------------------------------------------------------------

  onClick(e) {
    const t = e.target.closest('[data-act], [data-ui]');
    if (!t || t.disabled) return;
    if (t.dataset.act) {
      let action;
      try {
        action = JSON.parse(t.dataset.act);
      } catch {
        return;
      }
      if (t.dataset.confirm && !confirm(t.dataset.confirm)) return;
      const res = this.app.dispatch(action);
      if (res.ok && t.dataset.okmsg) toast(t.dataset.okmsg, 'good');
      return;
    }
    this.uiCommand(t.dataset.ui, t.dataset.arg, t);
  }

  onInput(e) {
    const el = e.target;
    if (el.type === 'range') {
      const out = el.closest('label')?.querySelector('output');
      const fmt = el.dataset.fmt;
      if (out) out.textContent = fmt === 'eur' ? eur(Number(el.value) * Number(el.dataset.scale || 1), { decimals: false }) : fmt === 'pct' ? `${el.value} %` : el.value;
    }
  }

  onChange(e) {
    const el = e.target;
    if (!el.dataset.input) return;
    let action;
    try {
      action = JSON.parse(el.dataset.input);
    } catch {
      return;
    }
    const value = el.dataset.raw ? el.value : Math.round(Number(String(el.value).replace(',', '.')) * Number(el.dataset.scale || 1));
    if (!el.dataset.raw && !Number.isFinite(value)) {
      toast('Valeur invalide.', 'bad');
      return;
    }
    this.app.dispatch({ ...action, value });
  }

  uiCommand(cmd, arg) {
    switch (cmd) {
      case 'tab':
        this.selectTab(arg);
        break;
      case 'speed':
        this.app.setSpeed(Number(arg));
        break;
      case 'menu':
        this.openMenu();
        break;
      case 'glossary':
        openGlossary(this.app, arg);
        break;
      case 'saves':
        openLoadDialog(this.app, { inGame: true });
        break;
      default: {
        const panel = PANELS.find((p) => p.id === this.tab);
        if (panel && panel.ui) panel.ui(cmd, arg, this.app);
      }
    }
  }

  openMenu() {
    const m = this.app.openModal({
      title: 'Menu',
      html: `<div class="menu-list">
        <button class="btn" data-m="saves">💾 Sauvegardes (sauver, charger, exporter)</button>
        <button class="btn" data-m="export">⬇ Exporter la partie en fichier</button>
        <button class="btn" data-m="glossary">📖 Glossaire</button>
        <button class="btn" data-m="tutorial">🎓 Revoir le tutoriel</button>
        <button class="btn" data-m="sound">${this.app.settings.sound ? '🔊 Son : activé' : '🔇 Son : désactivé'}</button>
        <button class="btn" data-m="quit">⏏ Retour au menu principal</button>
      </div>
      <p class="muted small">Partie n° ${esc(this.state.meta.gameId.slice(0, 8))} · graine « ${esc(this.state.meta.seed.slice(0, 30))} » · autosauvegarde toutes les ${CONFIG.autosaveSeconds} s.</p>`,
    });
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]');
      if (!b) return;
      const c = b.dataset.m;
      if (c === 'saves') openLoadDialog(this.app, { inGame: true });
      if (c === 'export') this.app.exportCurrent();
      if (c === 'glossary') openGlossary(this.app);
      if (c === 'tutorial') startTutorial(this.app, true);
      if (c === 'sound') {
        this.app.settings.sound = !this.app.settings.sound;
        audio.setEnabled(this.app.settings.sound);
        this.app.saveSettings();
        b.textContent = this.app.settings.sound ? '🔊 Son : activé' : '🔇 Son : désactivé';
        audio.play('good');
      }
      if (c === 'quit') {
        this.app.autosave().then(() => {
          closeModal(true);
          this.app.showTitle();
        });
      }
    });
  }

  selectTab(id) {
    if (!PANELS.find((p) => p.id === id)) id = PANELS[0].id;
    this.tab = id;
    for (const p of PANELS) {
      const b = $(`#tab-${p.id}`);
      if (b) {
        b.classList.toggle('active', p.id === id);
        b.setAttribute('aria-selected', p.id === id ? 'true' : 'false');
      }
    }
    this.panelHtml = '';
    this.refresh(true);
  }

  startTutorial() {
    startTutorial(this.app, false);
  }

  showDecision() {
    if (this.decisionOpen || isModalOpen()) return;
    this.decisionOpen = true;
    audio.play('event');
    showDecisionModal(this.app, () => {
      this.decisionOpen = false;
      this.refresh(true);
    });
  }

  // --- Rendu ---------------------------------------------------------------------

  frame(dt) {
    const s = this.state;
    const running = this.app.currentSpeed() > 0;
    this.scene.update(running ? dt * Math.max(1, this.app.currentSpeed() / 2) : 0, s);
    this.scene.draw(s);
    this.refreshAcc += dt;
    if (this.refreshAcc >= 0.25) {
      this.refreshAcc = 0;
      this.refresh(false);
    }
    if (s.events && s.events.pending.length && !this.decisionOpen && !isModalOpen()) this.showDecision();
  }

  updateHeader() {
    const s = this.state;
    const cashEl = $('#tb-cash');
    if (!cashEl) return;
    cashEl.textContent = eurShort(s.cash);
    cashEl.className = `tb-value ${s.cash < 0 ? 'bad' : ''}`;
    $('#tb-perso').textContent = eurShort(s.personal.cash);
    $('#tb-rep').textContent = `${num(s.company.reputation)}/100`;
    const p = passiveIncome(s);
    $('#tb-passive').textContent = `${eurShort(p.total)} / ${eurShort(p.target)}`;
    $('#tb-passive').className = `tb-value ${p.total >= p.target ? 'good' : ''}`;
    const d = dateOf(s.time.day);
    $('#tb-date').textContent = `${WEEKDAY_NAMES[d.weekday].slice(0, 3)}. ${formatDate(s.time.day)}`;
    $('#tb-weather').textContent = ` ${WEATHER_ICON[s.world.weather] || ''} ${WEATHER.labels[s.world.weather] || ''}`;
    $('#tb-sub').textContent = s.status === 'sandbox' ? 'Bac à sable' : s.staff.founder.active ? `Dirigé par ${s.meta.founderName}` : 'Géré par ton gérant';
    const idx = this.app.speedIdx;
    this.root.querySelectorAll('.btn-speed').forEach((b, i) => {
      b.classList.toggle('active', i === idx);
      b.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
    });
    const alert = $('#alert');
    const eg = s.endgame;
    if (eg && eg.distressDays > 0) {
      alert.hidden = false;
      alert.textContent = `⚠ Défaut de paiement : faillite dans ${Math.max(0, DIFFICULTIES[s.meta.difficulty].graceDays - eg.distressDays)} jours si rien ne change`;
    } else if (s.events && s.events.pending.length) {
      alert.hidden = false;
      alert.textContent = '⏸ Décision en attente';
    } else alert.hidden = true;
  }

  refresh(force) {
    const s = this.state;
    if (!s || !this.root) return;
    this.updateHeader();
    // Notifications du journal
    for (const e of s.log) {
      if (e.id > this.lastLogId && e.toast) {
        toast(e.text, e.kind === 'good' ? 'good' : e.kind === 'bad' ? 'bad' : 'info');
        if (e.kind === 'good') audio.play('good');
        if (e.kind === 'bad') audio.play('bad');
      }
    }
    this.lastLogId = s.logSeq;
    // Colonne de gauche (indicateurs + pourquoi)
    const side = renderSide(s);
    if (force || side !== this.sideHtml) {
      this.sideHtml = side;
      $('#side').innerHTML = side;
    }
    // Panneau actif (ne pas écraser un champ en cours d'édition)
    const panelEl = $('#panel');
    const active = document.activeElement;
    const editing = active && panelEl.contains(active) && ['INPUT', 'SELECT', 'TEXTAREA'].includes(active.tagName);
    if (editing && !force) return;
    const panel = PANELS.find((p) => p.id === this.tab);
    const html = panel.render(s, this.app);
    if (force || html !== this.panelHtml) {
      const scroll = panelEl.scrollTop;
      const focusId = active && panelEl.contains(active) ? active.id : null;
      this.panelHtml = html;
      panelEl.innerHTML = html;
      mountPixelTitles(panelEl);
      if (panel.mount) panel.mount(panelEl, s, this.app);
      panelEl.scrollTop = scroll;
      if (focusId) {
        const f = document.getElementById(focusId);
        if (f) f.focus();
      }
    } else if (panel.mount && panel.live) panel.mount(panelEl, s, this.app);
  }
}

function renderSide(s) {
  const k = kpis(s);
  const why = (s.company.why || []).filter((w) => w.kind !== 'pct');
  const share = (s.company.why || []).find((w) => w.kind === 'pct');
  const bn = {
    capacite: 'Goulet : ta capacité est saturée — recrute ou augmente tes prix.',
    prix: 'Goulet : tes prix sont trop élevés pour les clients actuels.',
    demande: 'Goulet : pas assez de demande — marketing, réputation, saison.',
    stock: 'Goulet : ruptures de stock — commande plus.',
    personnel: 'Goulet : pas assez de personnel en service.',
    places: 'Goulet : plus de places disponibles dans tes locaux.',
  }[s.company.bottleneck];
  return `
  <div class="kpis">${k.map((x) => `<div class="kpi"><span class="kpi-label">${esc(x.label)}</span><span class="kpi-value">${byFmt(x.value, x.fmt, x.suffix || '')}</span></div>`).join('')}</div>
  <details class="why" open>
    <summary>Pourquoi mes ventes ? <span class="muted">(part de marché ${share ? `${num(share.value * 100)} %` : '—'})</span></summary>
    ${bn ? `<p class="bottleneck">${esc(bn)}</p>` : ''}
    <ul class="why-list">${why
      .map((w) => {
        const d = Math.round((w.value - 1) * 100);
        const cls = d > 2 ? 'good' : d < -2 ? 'bad' : 'muted';
        return `<li title="${esc(w.hint || '')}"><span>${esc(w.label)}</span><span class="${cls}">${d === 0 ? '±0' : d > 0 ? `+${d}` : `−${-d}`} %</span></li>`;
      })
      .join('')}</ul>
    <p class="muted small">Chaque facteur multiplie la demande. Survole un facteur pour l'explication.</p>
  </details>`;
}
return __exports;
})();

// ---- src/engine/score.js ----
__m["src/engine/score.js"] = (function () {
const __exports = {};
__def(__exports, { "SCORE_VERSION": () => SCORE_VERSION, "computeScore": () => computeScore });
// =============================================================================
//  computeScore(state) — fonction PURE (aucun effet de bord), base du futur
//  classement (V2). Toute modification doit rester rétro-compatible ou
//  incrémenter SCORE_VERSION.
//
//  score = arrondi((base + passif + victoire + succès) × multDifficulté × multFaillite)
//    base      = patrimoine net en € / 100          (1 point par 100 € de patrimoine)
//    passif    = revenu passif mensuel net en € × 2
//    victoire  = 5 000 + 25 × max(0, 240 − mois nécessaires pour gagner)  (si gagné)
//    succès    = 50 × nombre de succès débloqués
//    multDifficulté : Facile 0,8 · Normal 1 · Réaliste 1,25 · Difficile 1,5
//    multFaillite   : 0,25 si faillite, sinon 1
//  Le score ne descend jamais sous 0.
// =============================================================================

const { DIFFICULTIES } = __m["src/data/difficulty.js"];
const { netWorth, passiveIncome } = __m["src/engine/selectors.js"];

const SCORE_VERSION = 1;

function computeScore(state) {
  const nw = netWorth(state);
  const base = nw / 10_000; // centimes → € / 100
  const passive = (passiveIncome(state).total / 100) * 2;
  const wonDay = state.endgame && state.endgame.wonDay;
  const victory = wonDay != null ? 5000 + 25 * Math.max(0, 240 - Math.floor(wonDay / 30)) : 0;
  const achievements = 50 * Object.keys((state.achievements && state.achievements.unlocked) || {}).length;
  const diffMult = (DIFFICULTIES[state.meta.difficulty] || DIFFICULTIES.normal).scoreMult;
  const bankruptMult = state.status === 'bankrupt' ? 0.25 : 1;
  const total = Math.max(0, Math.round((base + passive + victory + achievements) * diffMult * bankruptMult));
  return { total, version: SCORE_VERSION, parts: { base: Math.round(base), passive: Math.round(passive), victory, achievements, diffMult, bankruptMult } };
}
return __exports;
})();

// ---- src/ui/screens/end.js ----
__m["src/ui/screens/end.js"] = (function () {
const __exports = {};
__def(__exports, { "renderEnd": () => renderEnd, "PART_LABELS": () => PART_LABELS });
// Écrans de fin : victoire (bilan) et faillite (post-mortem).

const { esc } = __m["src/ui/dom.js"];
const { eur, pct } = __m["src/ui/format.js"];
const { formatDate } = __m["src/engine/calendar.js"];
const { computeScore } = __m["src/engine/score.js"];
const { netWorth, passiveIncome } = __m["src/engine/selectors.js"];
const { pixelTitle, mountPixelTitles } = __m["src/ui/pixelfont.js"];
const { closeModal } = __m["src/ui/modal.js"];

function renderEnd(app) {
  const s = app.state;
  if (s.status === 'bankrupt') return renderPostMortem(app);
  if (s.status === 'won') return renderVictory(app);
}

function renderPostMortem(app) {
  const s = app.state;
  const pm = s.endgame.postmortem || { causes: [], outflows: [] };
  const years = (s.time.day / 360).toFixed(1).replace('.', ',');
  const m = app.openModal({
    title: 'Faillite',
    closable: false,
    cls: 'modal-wide',
    html: `${pixelTitle('POST-MORTEM', 'h2', 3, '#e43b44')}
    <p><strong>${esc(s.meta.companyName)}</strong> a fait faillite le ${formatDate(s.time.day)}, après ${years} an(s) d'activité.</p>
    ${pm.legal === 'independant' && pm.seized > 0 ? `<p class="bad">En tant qu'indépendant (responsabilité illimitée), ${eur(pm.seized, { decimals: false })} de ton épargne personnelle ont été saisis par les créanciers.</p>` : ''}
    ${pm.legal === 'srl' ? '<p class="good">Ta SRL t’a protégé : ton patrimoine personnel n’est pas saisi.</p>' : ''}
    <h3>Les causes principales</h3>
    <ol class="causes">${pm.causes.map((c) => `<li><strong>${esc(c.title)}</strong> — ${esc(c.detail)}<br><span class="advice">💡 ${esc(c.advice)}</span></li>`).join('')}</ol>
    <h3>Où est parti l'argent (4 derniers mois)</h3>
    <table class="table"><tbody>${pm.outflows.map((o) => `<tr><td>${esc(o.label)}</td><td class="num">${eur(o.amount, { decimals: false })}</td><td class="num muted">${pct(o.pct)}</td></tr>`).join('')}</tbody></table>
    <p>Score : <strong>${computeScore(s).total.toLocaleString('fr-BE')}</strong></p>
    <div class="btns"><button class="btn btn-primary" data-e="new">Recommencer</button><button class="btn" data-e="same">Rejouer la même graine</button><button class="btn" data-e="menu">Menu principal</button></div>`,
  });
  mountPixelTitles(m);
  bindEnd(app, m);
}

function renderVictory(app) {
  const s = app.state;
  const p = passiveIncome(s);
  const sc = computeScore(s);
  const years = (s.time.day / 360).toFixed(1).replace('.', ',');
  const m = app.openModal({
    title: 'Liberté financière !',
    closable: false,
    cls: 'modal-wide',
    html: `${pixelTitle('LIBERTÉ FINANCIÈRE !', 'h2', 3, '#a7f070')}
    <p>Félicitations ${esc(s.meta.founderName)} ! Après ${years} an(s), tes revenus passifs atteignent <strong>${eur(p.total, { decimals: false })}/mois</strong> (objectif ${eur(p.target, { decimals: false })}).</p>
    <div class="stat-grid">
      <div><span class="muted">Patrimoine net</span><strong>${eur(netWorth(s), { decimals: false })}</strong></div>
      <div><span class="muted">CA cumulé</span><strong>${eur(s.finance.totals.revenue, { decimals: false })}</strong></div>
      <div><span class="muted">Employés</span><strong>${s.staff.employees.length}</strong></div>
      <div><span class="muted">Succès</span><strong>${Object.keys(s.achievements?.unlocked || {}).length}</strong></div>
    </div>
    <h3>D'où vient ton revenu passif</h3>
    <ul>${Object.entries(p.parts).filter(([, v]) => v).map(([k, v]) => `<li>${esc(PART_LABELS[k] || k)} : ${eur(v, { decimals: false })}/mois</li>`).join('')}</ul>
    <p>Score : <strong>${sc.total.toLocaleString('fr-BE')}</strong></p>
    <div class="btns"><button class="btn btn-primary" data-e="sandbox">Continuer en bac à sable</button><button class="btn" data-e="new">Nouvelle partie</button><button class="btn" data-e="menu">Menu principal</button></div>`,
  });
  mountPixelTitles(m);
  bindEnd(app, m);
}

const PART_LABELS = { epargne: 'Épargne', bourse: 'ETF et actions (règle des 4 %)', immobilier: 'Immobilier locatif', entreprise: 'Entreprise gérée sans toi' };

function bindEnd(app, m) {
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-e]');
    if (!b) return;
    const c = b.dataset.e;
    closeModal(true);
    if (c === 'sandbox') {
      app.dispatch({ type: 'continueSandbox' });
      app.setSpeed(1);
    } else if (c === 'new') app.showNewGame();
    else if (c === 'same') {
      const meta = app.state.meta;
      app.startNewGame({ sector: meta.sector, legal: meta.legal, difficulty: meta.difficulty, companyName: meta.companyName, founderName: meta.founderName, seed: meta.seed, metier: meta.metier });
    } else app.showTitle();
  });
}
return __exports;
})();

// ---- src/ui/app.js ----
__m["src/ui/app.js"] = (function () {
const __exports = {};
__def(__exports, { "App": () => App });
// Application : écrans, boucle temps réel, sauvegardes, raccourcis clavier.
// L'interface ne modifie JAMAIS l'état directement : tout passe par dispatch().

const { newGame, tick, applyAction, createRng } = __m["src/engine/index.js"];
const { CONFIG } = __m["src/data/config.js"];
const { LocalStorageAdapter } = __m["src/storage/LocalStorageAdapter.js"];
const { GameLoop } = __m["src/ui/loop.js"];
const { toast } = __m["src/ui/toast.js"];
const { openModal, closeModal, isModalOpen } = __m["src/ui/modal.js"];
const { renderTitle } = __m["src/ui/screens/title.js"];
const { renderNewGame } = __m["src/ui/screens/newgame.js"];
const { GameScreen } = __m["src/ui/screens/game.js"];
const { renderEnd } = __m["src/ui/screens/end.js"];
const { audio } = __m["src/ui/audio.js"];

const SETTINGS_KEY = 'entrepreneur-tycoon:settings';

function loadSettings() {
  try {
    return { sound: false, tutorialDone: false, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { sound: false, tutorialDone: false };
  }
}

class App {
  constructor(root) {
    this.root = root;
    this.adapter = new LocalStorageAdapter();
    this.settings = loadSettings();
    audio.setEnabled(this.settings.sound);
    this.state = null;
    this.slot = null; // emplacement de la partie en cours
    this.speedIdx = 0;
    this.screen = null;
    this.game = null;
    this.lastAutosave = 0;
    this.loop = new GameLoop({
      getSpeed: () => this.currentSpeed(),
      onAdvance: (dt) => this.advance(dt),
      onFrame: (dt) => this.frame(dt),
    });
    this._bindGlobal();
  }

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      /* stockage indisponible : réglages non mémorisés */
    }
  }

  // --- Écrans ---------------------------------------------------------------

  showTitle() {
    this.stopGame();
    this.screen = 'title';
    renderTitle(this);
  }

  showNewGame() {
    this.screen = 'newgame';
    renderNewGame(this);
  }

  startNewGame(opts) {
    const createdAt = new Date().toISOString();
    const gameId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `g-${Date.now().toString(36)}`;
    this.state = newGame({ ...opts, createdAt, gameId });
    this.slot = 'auto';
    this.enterGame();
    this.autosave();
  }

  enterGame() {
    this.screen = 'game';
    this.speedIdx = 0;
    this.game = new GameScreen(this);
    this.game.mount();
    this.loop.start();
    if (!this.settings.tutorialDone) this.game.startTutorial();
  }

  stopGame() {
    this.loop.stop();
    if (this.game) this.game.unmount();
    this.game = null;
  }

  showEnd() {
    this.speedIdx = 0;
    renderEnd(this);
  }

  // --- Temps ----------------------------------------------------------------

  currentSpeed() {
    if (!this.state || this.screen !== 'game' || isModalOpen()) return 0;
    if (this.state.status === 'bankrupt') return 0;
    return CONFIG.speeds[this.speedIdx];
  }

  setSpeed(idx) {
    this.speedIdx = Math.max(0, Math.min(CONFIG.speeds.length - 1, idx));
    if (this.game) this.game.updateHeader();
  }

  togglePause() {
    if (this.speedIdx === 0) this.setSpeed(this.prevSpeed || 1);
    else {
      this.prevSpeed = this.speedIdx;
      this.setSpeed(0);
    }
  }

  advance(dtDays) {
    const s = this.state;
    const rng = createRng(s.rngState);
    const before = s.status;
    tick(s, dtDays, rng);
    if (s.events && s.events.pending.length && this.game) this.game.showDecision();
    if (before !== s.status) this.onStatusChange(before, s.status);
  }

  frame(dtSec) {
    if (this.game) this.game.frame(dtSec);
    if (this.screen === 'game' && this.currentSpeed() > 0) {
      this.lastAutosave += dtSec;
      if (this.lastAutosave >= CONFIG.autosaveSeconds) {
        this.lastAutosave = 0;
        this.autosave();
      }
    }
  }

  onStatusChange(before, after) {
    if (after === 'bankrupt' || after === 'won') {
      audio.play(after === 'won' ? 'win' : 'lose');
      this.autosave();
      this.showEnd();
    }
  }

  // --- Actions --------------------------------------------------------------

  /** Envoie une action au moteur. Affiche le message d'erreur éventuel. */
  dispatch(action, { quiet = false } = {}) {
    if (!this.state) return { ok: false };
    const res = applyAction(this.state, action);
    if (!res.ok && res.message && !quiet) toast(res.message, 'bad');
    if (res.ok && !quiet) audio.play('click');
    if (this.game) this.game.refresh(true);
    return res;
  }

  // --- Sauvegardes ----------------------------------------------------------

  async autosave() {
    if (!this.state) return;
    try {
      await this.adapter.save('auto', this.state, new Date().toISOString());
      if (this.slot && this.slot !== 'auto') await this.adapter.save(this.slot, this.state, new Date().toISOString());
    } catch (e) {
      toast(`Autosauvegarde impossible : ${e.message}`, 'bad');
    }
  }

  async saveTo(slot) {
    try {
      await this.adapter.save(slot, this.state, new Date().toISOString());
      this.slot = slot;
      toast(`Partie sauvegardée (emplacement ${slot}).`, 'good');
    } catch (e) {
      toast(e.message, 'bad');
    }
  }

  async loadFrom(slot) {
    try {
      this.state = await this.adapter.load(slot);
      this.slot = slot;
      closeModal(true);
      this.stopGame();
      if (this.state.status === 'bankrupt') {
        this.enterGame();
        this.showEnd();
      } else this.enterGame();
      toast('Partie chargée.', 'good');
    } catch (e) {
      toast(`Chargement impossible : ${e.message}`, 'bad');
    }
  }

  async exportSlot(slot) {
    try {
      const json = await this.adapter.export(slot);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      const name = JSON.parse(json).summary?.companyName || 'partie';
      a.href = URL.createObjectURL(blob);
      a.download = `entrepreneur-tycoon-${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 1000);
    } catch (e) {
      toast(e.message, 'bad');
    }
  }

  async exportCurrent() {
    await this.autosave();
    await this.exportSlot('auto');
  }

  importFile(slot, onDone) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        await this.adapter.import(text, slot);
        toast(`Sauvegarde importée dans l'emplacement ${slot}.`, 'good');
        if (onDone) onDone();
      } catch (e) {
        toast(`Import impossible : ${e.message}`, 'bad');
      }
    });
    input.click();
  }

  // --- Événements globaux -----------------------------------------------------

  _bindGlobal() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'Escape') {
        if (closeModal()) e.preventDefault();
        return;
      }
      if (this.screen !== 'game' || typing || isModalOpen()) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePause();
      } else if (e.key === '1') this.setSpeed(1);
      else if (e.key === '2') this.setSpeed(2);
      else if (e.key === '3') this.setSpeed(3);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.screen === 'game') {
        if (this.speedIdx > 0) {
          this.prevSpeed = this.speedIdx;
          this.setSpeed(0);
          this.pausedByHide = true;
        }
        this.autosave();
      }
    });
    window.addEventListener('pagehide', () => {
      if (this.state && this.screen === 'game') {
        try {
          this.adapter.save('auto', this.state, new Date().toISOString());
        } catch {
          /* rien */
        }
      }
    });
  }

  openModal(o) {
    return openModal(o);
  }
}
return __exports;
})();

// ---- src/main.js ----
__m["src/main.js"] = (function () {
const __exports = {};
// Point d'entrée de l'interface.

const { App } = __m["src/ui/app.js"];

function boot() {
  const root = document.getElementById('app');
  try {
    const app = new App(root);
    app.showTitle();
    // Accès console pour le débogage (aucune incidence sur le jeu).
    window.__tycoon = app;
  } catch (e) {
    root.innerHTML = `<p class="boot">Erreur au démarrage : ${String(e.message).replace(/</g, '&lt;')}</p>`;
    throw e;
  }
}

boot();
return __exports;
})();
})();
