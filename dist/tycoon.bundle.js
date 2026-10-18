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
  retours: 'Remboursements (retours)',
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
  marketLeads: 1.9,
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

// ---- src/data/sectors/restaurant.js ----
__m["src/data/sectors/restaurant.js"] = (function () {
const __exports = {};
__def(__exports, { "RESTAURANT": () => RESTAURANT });
// Secteur 2 — Friterie / snack. Montants en centimes.
//
// Mécanique : du PÉRISSABLE et de l'affluence. Les clients dépendent du jour,
// de la météo, de la saison et de l'emplacement ; le stock (portions) se
// périme en 4 jours ; la capacité dépend du personnel en service ; l'hygiène
// est contrôlée par l'AFSCA.

const RESTAURANT = {
  id: 'restaurant',
  label: 'Friterie / snack',
  icon: 'fries',
  tagline: 'Frites, fricadelles et sauce andalouse.',
  description:
    'Tu gères un commerce de bouche : achète tes portions chaque jour (elles se périment en 4 jours), adapte-toi à la météo et au week-end, évite les files d’attente avec assez de personnel, et garde une cuisine impeccable pour l’AFSCA.',
  b2c: true,
  // TVA : nourriture 12 %, boissons 21 % (25 % du ticket) → taux moyen (voir fiscalite.js)
  drinksShare: 0.25,
  purchaseVat: 0.06, // achats de denrées alimentaires
  startCostExtra: 600_000, // friteuses, frigo, comptoir
  homeSeats: 4, // personnes qui tiennent derrière le comptoir au départ
  staffSeatKey: 'staffSeats',

  refPrice: 1_150, // ticket moyen de référence TTC : 11,50 €
  minPrice: 500,
  maxPrice: 3_000,
  elasticity: 1.6,
  marketingRef: 40_000,

  marketClients: 260, // clients potentiels par jour dans le quartier (tous acteurs confondus)
  weekday: [0, 0.8, 0.95, 0.95, 1.35, 1.45, 1.0], // fermé le lundi (jour de repos classique)
  seasonality: [0.9, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.1, 1, 0.95, 0.95, 1.05],
  weather: { soleil: 1.1, nuageux: 1, pluie: 0.85, froid: 1.05, canicule: 0.85 },

  ingredients: [
    { level: 1, label: 'Standard (surgelé)', cost: 260, quality: 0.88 },
    { level: 2, label: 'Bonne (patates fraîches, sauces maison)', cost: 330, quality: 1.04 },
    { level: 3, label: 'Premium (Bintje locale, bœuf belge)', cost: 430, quality: 1.2 },
  ],
  shelfLife: 4, // jours
  founderKitchen: 45, // portions/jour que le fondateur prépare
  founderCounter: 45, // clients/jour qu'il sert
  wasteCostPerPortion: 0,
  energyBase: 45_000, // friteuses : énergie mensuelle de base
  deliveryCommission: 0.3,

  roles: {
    cuisinier: { id: 'cuisinier', label: 'Cuisinier·ère', baseSalary: 260_000, skillRange: [25, 85], kitchen: 85, quality: 0.04,
      desc: 'Prépare ≈ 85 portions/jour et améliore la qualité.' },
    vendeur: { id: 'vendeur', label: 'Vendeur·se au comptoir', baseSalary: 235_000, skillRange: [20, 80], counter: 80,
      desc: 'Sert ≈ 80 clients/jour : moins de files d’attente.' },
    plongeur: { id: 'plongeur', label: 'Commis / plongeur', baseSalary: 220_000, skillRange: [15, 60], hygiene: 0.6, kitchen: 25,
      desc: 'Nettoyage et aide en cuisine : l’hygiène remonte plus vite.' },
  },

  fixedCosts: [
    { id: 'loyer', label: 'Loyer (rue secondaire)', amount: 110_000, vat: 0, cat: 'loyer' },
    { id: 'assurance', label: 'Assurances (RC, incendie)', amount: 9_000, vat: 0, cat: 'assurances' },
    { id: 'caisse', label: 'Caisse enregistreuse & terminal', amount: 4_500, vat: 0.21, cat: 'logiciels' },
    { id: 'divers', label: 'Emballages, sauces, divers', amount: 18_000, perHead: 2_000, vat: 0.21, cat: 'materiel' },
  ],

  upgrades: [
    { id: 'salle', cat: 'locaux', label: 'Petite salle (12 places)', cost: 600_000, rent: 25_000, effects: { attraction: 0.06, counter: 20, staffSeats: 2 },
      desc: 'Les clients peuvent s’asseoir : +6 % d’attractivité.' },
    { id: 'terrasse', cat: 'locaux', label: 'Terrasse', cost: 350_000, rent: 8_000, effects: { sunBonus: 0.15 },
      desc: '+15 % de clients les jours de soleil (taxe communale de terrasse incluse).' },
    { id: 'place', cat: 'locaux', label: 'Déménager sur la place du marché', cost: 2_500_000, rent: 140_000, requires: ['salle'], effects: { marketMult: 1.5, staffSeats: 3 },
      desc: 'Emplacement n°1 : +50 % de clients potentiels. Loyer +1 400 €/mois.' },
    { id: 'second', cat: 'locaux', label: 'Ouvrir un 2e établissement', cost: 6_000_000, rent: 160_000, requires: ['place'], minRep: 60, effects: { marketMult: 1.75, kitchen: 60, counter: 60, staffSeats: 6 },
      desc: 'Un autre quartier : +75 % de marché. Il faudra du personnel en plus.' },
    { id: 'friteuse', cat: 'materiel', label: 'Friteuses professionnelles', cost: 450_000, effects: { kitchenMult: 1.35, quality: 0.04 },
      desc: '+35 % de capacité de cuisine, frites plus croustillantes.' },
    { id: 'chambre_froide', cat: 'materiel', label: 'Chambre froide', cost: 550_000, effects: { shelfLife: 2 },
      desc: 'Les portions se conservent 2 jours de plus : moins de gaspillage.' },
    { id: 'cuisine_inox', cat: 'materiel', label: 'Cuisine inox aux normes', cost: 900_000, effects: { hygieneRegen: 0.8, quality: 0.03 },
      desc: 'Hygiène bien plus facile à maintenir (AFSCA).' },
    { id: 'double_cuisson', cat: 'process', label: 'Double cuisson à la belge', cost: 80_000, effects: { quality: 0.07 },
      desc: 'Le secret des vraies frites belges : qualité +7 %.' },
    { id: 'haccp', cat: 'process', label: 'Plan HACCP et formation hygiène', cost: 120_000, effects: { hygieneRegen: 0.5, afscaBonus: 10 },
      desc: 'Procédures d’hygiène : contrôles AFSCA bien plus sereins.' },
    { id: 'prevision', cat: 'process', label: 'Logiciel de prévision des stocks', cost: 200_000, monthly: 3_000, effects: { forecast: 1 },
      desc: 'Commande selon la météo et le jour : moins de ruptures et de gaspillage.' },
    { id: 'enseigne', cat: 'marque', label: 'Enseigne lumineuse et déco rétro', cost: 250_000, effects: { attraction: 0.08, repTarget: 3 },
      desc: 'On te remarque de loin : +8 % d’attractivité.' },
    { id: 'sauce_maison', cat: 'marque', label: 'Sauce maison signature', cost: 150_000, requires: ['double_cuisson'], effects: { repTarget: 6, quality: 0.04 },
      desc: 'Les clients viennent de loin pour ta sauce.' },
    { id: 'caisse_auto', cat: 'automatisation', label: 'Bornes de commande', cost: 1_200_000, monthly: 6_000, requires: ['salle'], effects: { counterMult: 1.5 },
      desc: '+50 % de capacité au comptoir sans personnel en plus.' },
    { id: 'click_collect', cat: 'automatisation', label: 'Click & collect', cost: 300_000, monthly: 2_500, effects: { rainProtect: 0.6, attraction: 0.04 },
      desc: 'Commande en ligne : la pluie fait moins fuir les clients.' },
  ],
};
return __exports;
})();

// ---- src/data/sectors/ecommerce.js ----
__m["src/data/sectors/ecommerce.js"] = (function () {
const __exports = {};
__def(__exports, { "ECOMMERCE": () => ECOMMERCE });
// Secteur 3 — E-commerce. Montants en centimes.
//
// Mécanique : on ACHÈTE du trafic (publicité) et du stock à l'avance.
// Marge = prix − coût d'achat − logistique − frais de paiement − retours ;
// rentable seulement si le coût d'acquisition client reste sous la marge.

const ECOMMERCE = {
  id: 'ecommerce',
  label: 'E-commerce',
  icon: 'box',
  tagline: 'Une boutique en ligne qui livre toute la Belgique.',
  description:
    'Tu achètes ton stock à l’avance (livré en ≈ 12 jours), tu paies la publicité au clic et tu vis de ta marge. Surveille le coût d’acquisition client, les ruptures, les retours et les pics du Black Friday et des fêtes.',
  b2c: true,
  vatRate: 0.21,
  startCostExtra: 250_000, // site, photos, premier matériel d'emballage
  homeSeats: 2,

  elasticity: 2.0,
  marketingRef: 100_000, // budget pub mensuel de référence
  organicVisitors: 650, // visiteurs organiques/jour sur le marché (partagés)
  baseConversion: 0.024,
  cpc: 45, // coût par clic de base : 0,45 €
  cpcSeason: [0.9, 0.85, 0.9, 0.95, 1, 1, 0.95, 0.95, 1, 1.05, 1.45, 1.3],
  seasonality: [1.1, 0.8, 0.9, 0.95, 1, 0.95, 0.9, 0.9, 1, 1.05, 1.5, 1.6],
  blackFriday: { month: 10, from: 23, to: 28, mult: 2.4 },
  packing: 80, // emballage par commande
  paymentPct: 0.014,
  paymentFixed: 25,
  returnDelay: 12,
  returnResellable: 0.7,
  leadTime: 12, // délai fournisseur (jours)
  storageMonthlyPct: 0.02, // coût de stockage mensuel (% de la valeur du stock)
  founderOrders: 45, // commandes préparées/jour par le fondateur
  startSlots: 2,

  products: [
    { id: 'gourde', label: 'Gourde isotherme', cost: 700, ref: 2_490, weight: 1.2, returns: 0.04, ship: 420, vat: 0.21 },
    { id: 'yoga', label: 'Tapis de yoga', cost: 900, ref: 2_990, weight: 1, returns: 0.05, ship: 520, vat: 0.21 },
    { id: 'lampe', label: 'Lampe déco LED', cost: 1_100, ref: 3_490, weight: 1, returns: 0.06, ship: 480, vat: 0.21 },
    { id: 'chocolat', label: 'Coffret de pralines belges', cost: 800, ref: 2_490, weight: 1.1, returns: 0.01, ship: 450, vat: 0.06, season: { 11: 2.5, 1: 1.6, 3: 1.4 } },
    { id: 'bijou', label: 'Bracelet artisanal', cost: 600, ref: 2_990, weight: 0.8, returns: 0.07, ship: 300, vat: 0.21 },
    { id: 'jeu', label: 'Jeu de société', cost: 1_400, ref: 3_990, weight: 0.9, returns: 0.03, ship: 550, vat: 0.21, season: { 11: 2, 10: 1.3 } },
    { id: 'casque', label: 'Casque audio Bluetooth', cost: 1_800, ref: 5_990, weight: 0.9, returns: 0.09, ship: 520, vat: 0.21 },
    { id: 'sac', label: 'Sac à dos urbain', cost: 1_600, ref: 5_490, weight: 0.8, returns: 0.08, ship: 600, vat: 0.21, season: { 7: 1.6, 8: 1.4 } },
  ],

  roles: {
    logisticien: { id: 'logisticien', label: 'Logisticien·ne', baseSalary: 240_000, skillRange: [20, 80], orders: 70,
      desc: 'Prépare ≈ 70 commandes/jour.' },
    marketeur: { id: 'marketeur', label: 'Marketeur·se digital', baseSalary: 340_000, skillRange: [30, 90], cpcCut: 0.1, conv: 0.06,
      desc: 'Optimise les campagnes : coût par clic −10 %, conversion +6 % (max 2 comptent).' },
    service_client: { id: 'service_client', label: 'Service client', baseSalary: 245_000, skillRange: [20, 80], returnsCut: 0.2, sat: 6,
      desc: 'Moins de retours (−20 %) et des clients plus satisfaits.' },
  },

  fixedCosts: [
    { id: 'shop', label: 'Plateforme e-commerce', amount: 7_900, vat: 0.21, cat: 'logiciels' },
    { id: 'assurance', label: 'Assurance RC', amount: 3_500, vat: 0, cat: 'assurances' },
    { id: 'telecom', label: 'Internet & outils', amount: 5_000, perHead: 1_500, vat: 0.21, cat: 'logiciels' },
  ],

  upgrades: [
    { id: 'garage', cat: 'locaux', label: 'Garage de stockage', cost: 100_000, rent: 25_000, effects: { seats: 2, storageCut: 0.3 },
      desc: 'Plus de place pour le stock et 2 postes de travail.' },
    { id: 'entrepot', cat: 'locaux', label: 'Petit entrepôt', cost: 900_000, rent: 120_000, requires: ['garage'], effects: { seats: 6, ordersMult: 1.25, storageCut: 0.3 },
      desc: 'Préparation plus rapide (+25 %) et 6 postes de plus.' },
    { id: 'logistique_3pl', cat: 'locaux', label: 'Logisticien externe (3PL)', cost: 1_500_000, monthly: 40_000, requires: ['entrepot'], effects: { ordersAdd: 300, shipCut: 0.15, seats: 4 },
      desc: 'Un prestataire prépare 300 commandes/jour et négocie les transporteurs (−15 %).' },
    { id: 'imprimante', cat: 'materiel', label: 'Imprimante d’étiquettes & scanner', cost: 60_000, effects: { ordersMult: 1.15 },
      desc: '+15 % de commandes préparées par jour.' },
    { id: 'photo', cat: 'materiel', label: 'Studio photo produits', cost: 250_000, effects: { conv: 0.12 },
      desc: 'De belles photos : conversion +12 %.' },
    { id: 'slots1', cat: 'process', label: 'Élargir le catalogue (+2 produits)', cost: 200_000, effects: { slots: 2 },
      desc: 'Référencer 2 produits de plus.' },
    { id: 'slots2', cat: 'process', label: 'Catalogue complet (+4 produits)', cost: 600_000, requires: ['slots1'], effects: { slots: 4 },
      desc: 'Référencer tout le catalogue.' },
    { id: 'transporteurs', cat: 'process', label: 'Contrat transporteur négocié', cost: 150_000, effects: { shipCut: 0.15 },
      desc: '−15 % sur les frais d’expédition.' },
    { id: 'retours', cat: 'process', label: 'Guide des tailles & FAQ', cost: 80_000, effects: { returnsMult: 0.75 },
      desc: '−25 % de retours.' },
    { id: 'seo', cat: 'marque', label: 'Référencement naturel (SEO)', cost: 300_000, effects: { organicMult: 1.4 },
      desc: '+40 % de visiteurs gratuits.' },
    { id: 'avis', cat: 'marque', label: 'Widget d’avis clients vérifiés', cost: 120_000, monthly: 2_500, effects: { conv: 0.08, repTarget: 3 },
      desc: 'La preuve sociale rassure : conversion +8 %.' },
    { id: 'marque_propre', cat: 'marque', label: 'Ta propre marque', cost: 1_500_000, requires: ['seo'], minRep: 55, effects: { priceTolerance: 0.15, organicMult: 1.2 },
      desc: 'Les clients acceptent des prix 15 % plus élevés.' },
    { id: 'emailing', cat: 'automatisation', label: 'Emailing et fidélisation', cost: 250_000, monthly: 4_000, effects: { repeat: 0.15 },
      desc: '+15 % de commandes de clients fidèles (sans pub).' },
    { id: 'marketplace', cat: 'automatisation', label: 'Vendre aussi sur une marketplace', cost: 400_000, effects: { marketplace: 1 },
      desc: 'Beaucoup plus de visiteurs, mais 15 % de commission sur ces ventes.' },
    { id: 'reassort_auto', cat: 'automatisation', label: 'Réassort automatique intelligent', cost: 350_000, monthly: 3_000, effects: { smartReorder: 1 },
      desc: 'Les commandes fournisseur anticipent saisons et pics.' },
  ],
};
return __exports;
})();

// ---- src/data/sectors/artisan.js ----
__m["src/data/sectors/artisan.js"] = (function () {
const __exports = {};
__def(__exports, { "ARTISAN": () => ARTISAN });
// Secteur 4 — Artisan du bâtiment (plombier-chauffagiste ou électricien). Montants en centimes.
//
// Mécanique : des DEVIS et un PLANNING. Les demandes arrivent selon le
// bouche-à-oreille et la saison ; chaque devis est accepté ou non ; les
// chantiers occupent des ouvriers (une camionnette par équipe de deux) ;
// matériel acheté au démarrage, paiement à la fin.

const PLOMBIER_JOBS = [
  { id: 'depannage', label: 'Dépannage (fuite, débouchage)', days: 0.4, materials: 3_500, weight: 5, urgent: true, payNow: true, renoShare: 0.7 },
  { id: 'entretien', label: 'Entretien de chaudière', days: 0.3, materials: 1_500, weight: 3, payNow: true, renoShare: 0.8, season: { 8: 1.5, 9: 1.7, 10: 1.5 } },
  { id: 'chauffe_eau', label: 'Remplacement de chauffe-eau', days: 1, materials: 65_000, weight: 2, renoShare: 0.8 },
  { id: 'chaudiere', label: 'Installation de chaudière', days: 2, materials: 280_000, weight: 1.5, renoShare: 0.75, season: { 0: 1.8, 1: 1.5, 9: 1.4, 10: 1.7, 11: 1.9 } },
  { id: 'sdb', label: 'Rénovation de salle de bain', days: 8, materials: 450_000, weight: 1, renoShare: 0.85 },
  { id: 'pac', label: 'Pompe à chaleur', days: 3, materials: 900_000, weight: 0.8, renoShare: 0.8, requires: 'certif' },
];

const ELEC_JOBS = [
  { id: 'depannage', label: 'Dépannage électrique', days: 0.4, materials: 2_000, weight: 5, urgent: true, payNow: true, renoShare: 0.7 },
  { id: 'conformite', label: 'Mise en conformité (RGIE)', days: 2.5, materials: 60_000, weight: 2, renoShare: 0.85 },
  { id: 'borne', label: 'Borne de recharge', days: 1, materials: 110_000, weight: 1.5, renoShare: 0.6, trend: 0.15 },
  { id: 'renovation', label: 'Rénovation électrique complète', days: 9, materials: 380_000, weight: 0.9, renoShare: 0.85 },
  { id: 'domotique', label: 'Installation domotique', days: 4, materials: 200_000, weight: 0.8, renoShare: 0.6, requires: 'formation' },
  { id: 'photovoltaique', label: 'Panneaux photovoltaïques', days: 3, materials: 600_000, weight: 1, renoShare: 0.7, requires: 'certif', season: { 3: 1.4, 4: 1.5, 5: 1.4 } },
];

const ARTISAN = {
  id: 'artisan',
  label: 'Artisan du bâtiment',
  icon: 'wrench',
  tagline: 'Plombier-chauffagiste ou électricien.',
  description:
    'Chaque demande devient un devis : prix trop haut, le client refuse ; trop bas, tu travailles pour rien. Planifie tes ouvriers (une camionnette par équipe de deux), achète le matériel au démarrage et fais tourner le bouche-à-oreille. TVA à 6 % pour la rénovation de logements de plus de 10 ans.',
  b2c: false,
  startCostExtra: 450_000, // acompte sur une camionnette d'occasion, outillage
  homeSeats: 4,
  metiers: {
    plombier: { id: 'plombier', label: 'Plombier-chauffagiste', jobs: PLOMBIER_JOBS, seasonality: [1.35, 1.25, 1, 0.9, 0.85, 0.8, 0.8, 0.85, 1, 1.1, 1.25, 1.4] },
    electricien: { id: 'electricien', label: 'Électricien', jobs: ELEC_JOBS, seasonality: [1, 1, 1.05, 1.05, 1, 0.95, 0.85, 0.85, 1.05, 1.05, 1, 0.95] },
  },

  refRate: 5_500, // 55 €/h HT
  minRate: 2_500,
  maxRate: 15_000,
  refMargin: 0.2,
  hoursPerDay: 8,
  billableRatio: 0.72, // part du temps réellement facturable (trajets, devis, administratif)
  elasticity: 1.4,
  marketingRef: 40_000,
  marketLeads: 3.4, // demandes/jour ouvré sur le marché local
  weekendLeads: 0.35, // part des dépannages le week-end
  baseAccept: 0.62,
  urgentFee: 4_500, // forfait de déplacement des dépannages
  travelPerDay: 2_500, // carburant + usure par jour de chantier
  paymentDays: 30,
  defaultProb: 0.035,
  lateProb: 0.2,
  vanMonthly: 30_000, // assurance, carburant fixe, entretien par camionnette
  maintenanceContract: { fee: 1_400, signProb: 0.45, churnMonthly: 0.02, daysPerMonth: 0.03 },
  womDecayMonthly: 0.03,

  roles: {
    ouvrier: { id: 'ouvrier', label: 'Ouvrier·ère qualifié·e', baseSalary: 290_000, skillRange: [30, 85], speed: 1,
      desc: 'Une journée de chantier par jour ouvré (selon la compétence).' },
    apprenti: { id: 'apprenti', label: 'Apprenti·e', baseSalary: 175_000, skillRange: [12, 40], speed: 0.55,
      desc: 'Moins rapide, mais bon marché et progresse vite.' },
    planificateur: { id: 'planificateur', label: 'Secrétariat & planning', baseSalary: 250_000, skillRange: [25, 80], max: 2, accept: 0.08,
      desc: 'Répond vite aux clients : +8 % de devis acceptés, chantiers mieux organisés.' },
  },

  fixedCosts: [
    { id: 'assurance', label: 'Assurance RC & décennale', amount: 14_000, vat: 0, cat: 'assurances' },
    { id: 'telecom', label: 'Téléphone & logiciel de facturation', amount: 6_000, vat: 0.21, cat: 'logiciels' },
    { id: 'vehicule', label: 'Camionnette (assurance, entretien)', amount: 30_000, vat: 0.21, cat: 'deplacements' },
    { id: 'outils', label: 'Petit outillage & EPI', amount: 5_000, perHead: 2_500, vat: 0.21, cat: 'materiel' },
  ],

  upgrades: [
    { id: 'atelier', cat: 'locaux', label: 'Atelier-dépôt', cost: 400_000, rent: 60_000, effects: { seats: 4, materialCut: 0.08 },
      desc: 'Stocker le matériel acheté en gros : −8 % sur les matériaux, 4 places de plus.' },
    { id: 'depot', cat: 'locaux', label: 'Grand dépôt et bureau', cost: 1_500_000, rent: 150_000, requires: ['atelier'], effects: { seats: 10, speedMult: 1.05 },
      desc: '10 places de plus, logistique plus fluide.' },
    { id: 'camionnette2', cat: 'materiel', label: '2e camionnette', cost: 2_800_000, monthly: 30_000, effects: { vans: 1 },
      desc: 'Une équipe de plus sur la route (2 ouvriers par camionnette).' },
    { id: 'camionnette3', cat: 'materiel', label: '3e et 4e camionnettes', cost: 5_200_000, monthly: 60_000, requires: ['camionnette2'], effects: { vans: 2 },
      desc: 'Deux équipes de plus.' },
    { id: 'outillage', cat: 'materiel', label: 'Outillage professionnel', cost: 350_000, effects: { speedMult: 1.12, quality: 0.04 },
      desc: 'Chantiers 12 % plus rapides.' },
    { id: 'camera', cat: 'materiel', label: 'Caméra thermique & détecteurs', cost: 180_000, effects: { quality: 0.06 },
      desc: 'Diagnostics précis : moins de malfaçons.' },
    { id: 'devis_logiciel', cat: 'process', label: 'Logiciel de devis en ligne', cost: 120_000, monthly: 3_500, effects: { accept: 0.08 },
      desc: 'Devis envoyés le jour même : +8 % d’acceptation.' },
    { id: 'planning', cat: 'process', label: 'Planification optimisée', cost: 200_000, effects: { speedMult: 1.08, travelCut: 0.15 },
      desc: 'Moins de trajets inutiles.' },
    { id: 'certif', cat: 'process', label: 'Certification « installateur agréé primes »', cost: 300_000, minRep: 40, effects: { unlock: 1, repTarget: 4 },
      desc: 'Débloque pompes à chaleur / photovoltaïque et rassure les clients.' },
    { id: 'formation', cat: 'process', label: 'Formation domotique', cost: 150_000, effects: { unlock: 1 },
      desc: 'Débloque les chantiers domotiques (électricien).' },
    { id: 'site_avis', cat: 'marque', label: 'Site web + avis Google', cost: 150_000, effects: { leadsMult: 1.18 },
      desc: '+18 % de demandes.' },
    { id: 'lettrage', cat: 'marque', label: 'Lettrage des véhicules', cost: 80_000, effects: { leadsMult: 1.08, repTarget: 2 },
      desc: 'Ta camionnette devient une pub roulante.' },
    { id: 'contrats', cat: 'automatisation', label: 'Contrats d’entretien annuels', cost: 120_000, effects: { contracts: 1 },
      desc: 'Revenu récurrent : les clients paient un abonnement d’entretien.' },
    { id: 'stock_camion', cat: 'automatisation', label: 'Stock embarqué dans les camionnettes', cost: 250_000, effects: { travelCut: 0.3, speedMult: 1.05 },
      desc: 'Moins d’allers-retours au fournisseur.' },
  ],
};
return __exports;
})();

// ---- src/data/sectors/soutien.js ----
__m["src/data/sectors/soutien.js"] = (function () {
const __exports = {};
__def(__exports, { "SOUTIEN": () => SOUTIEN });
// Secteur 5 — Centre de soutien scolaire. Montants en centimes.
//
// Mécanique : le RYTHME SCOLAIRE (Fédération Wallonie-Bruxelles). Les élèves
// s'inscrivent à la rentrée et avant les examens, partent en fin d'année ; la
// réputation dépend des RÉSULTATS aux sessions de janvier et de juin ; la
// taille des groupes arbitre entre capacité et réussite.

const SOUTIEN = {
  id: 'soutien',
  label: 'Soutien scolaire',
  icon: 'book',
  tagline: 'Remédiation, blocus et stages pour élèves du secondaire.',
  description:
    'Les élèves paient un abonnement mensuel. Ils arrivent à la rentrée et avant les examens, et partent en été. Tes résultats aux sessions de janvier et juin font ta réputation : petits groupes et bons profs = réussite, mais coût élevé.',
  b2c: true,
  vatRate: 0.21, // voir fiscalite.js : exemption possible selon les cas, le jeu prend 21 %
  startCostExtra: 300_000, // tableaux, tables, manuels
  homeSeats: 4, // enseignants (temps partiel) dans le local de départ
  staffSeatKey: 'staffSeats',

  refPrice: 17_500, // abonnement mensuel de référence TTC : 175 €
  minPrice: 5_000,
  maxPrice: 50_000,
  elasticity: 1.5,
  marketingRef: 40_000,

  // Nouvelles familles qui cherchent un soutien, par mois, sur le marché local
  marketPool: 140,
  seasonality: [1.1, 0.8, 0.9, 1, 1.4, 1.1, 0.25, 0.7, 2.2, 1.2, 1.1, 1.3],
  churnMonthly: 0.06,
  yearEndChurn: 0.6, // départ massif fin juin
  examMonths: [0, 5], // sessions de fin janvier et fin juin
  groupSize: { min: 3, max: 12, default: 6 },
  slotsPerTeacher: 5, // groupes par enseignant (le nombre d'élèves = groupes × taille)
  founderSlots: 5,
  baseSeats: 30, // places dans le local de départ
  materialPerStudent: 400, // fournitures/mois
  stage: { price: 18_000, month: [6, 7], pool: 70 }, // stages d'été (si amélioration)

  roles: {
    etudiant: { id: 'etudiant', label: 'Étudiant·e jobiste', baseSalary: 120_000, skillRange: [25, 65], slots: 3, teach: true,
      desc: 'Temps partiel, bon marché, résultats moyens (3 groupes).' },
    enseignant: { id: 'enseignant', label: 'Enseignant·e diplômé·e', baseSalary: 230_000, skillRange: [50, 90], slots: 5, teach: true,
      desc: 'Mi-temps, cher mais efficace (5 groupes).' },
    coordinateur: { id: 'coordinateur', label: 'Coordinateur·rice pédagogique', baseSalary: 320_000, skillRange: [45, 90], max: 1, success: 0.05,
      desc: 'Suivi des élèves et lien avec les parents : +5 points de réussite, moins de départs.' },
  },

  fixedCosts: [
    { id: 'loyer', label: 'Loyer (local de quartier)', amount: 85_000, vat: 0, cat: 'loyer' },
    { id: 'assurance', label: 'Assurance RC & accidents', amount: 5_500, vat: 0, cat: 'assurances' },
    { id: 'logiciel', label: 'Plateforme d’inscription & suivi', amount: 4_000, perHead: 800, vat: 0.21, cat: 'logiciels' },
  ],

  upgrades: [
    { id: 'salle2', cat: 'locaux', label: 'Deuxième salle de cours', cost: 400_000, rent: 45_000, effects: { seats: 25, staffSeats: 4 },
      desc: '+25 élèves possibles.' },
    { id: 'centre', cat: 'locaux', label: 'Centre en centre-ville', cost: 2_200_000, rent: 180_000, requires: ['salle2'], effects: { seats: 90, staffSeats: 12, attraction: 0.1 },
      desc: '+90 élèves, adresse prestigieuse.' },
    { id: 'antenne', cat: 'locaux', label: 'Antenne dans une 2e ville', cost: 3_500_000, rent: 150_000, requires: ['centre'], minRep: 60, effects: { seats: 80, staffSeats: 10, marketMult: 1.7 },
      desc: '+70 % de marché.' },
    { id: 'tableaux', cat: 'materiel', label: 'Tableaux interactifs', cost: 300_000, effects: { success: 0.03, attraction: 0.03 },
      desc: 'Cours plus vivants : +3 points de réussite.' },
    { id: 'tablettes', cat: 'materiel', label: 'Tablettes et exerciseurs', cost: 450_000, monthly: 3_000, effects: { success: 0.03 },
      desc: 'Entraînement personnalisé.' },
    { id: 'methode', cat: 'process', label: 'Méthode de remédiation éprouvée', cost: 250_000, effects: { success: 0.05 },
      desc: '+5 points de réussite aux examens.' },
    { id: 'suivi_parents', cat: 'process', label: 'Bulletin de suivi pour les parents', cost: 120_000, effects: { churnMult: 0.75, repTarget: 3 },
      desc: '−25 % de désinscriptions en cours d’année.' },
    { id: 'stages', cat: 'process', label: 'Stages de vacances', cost: 200_000, effects: { stages: 1 },
      desc: 'Remplis l’été avec des stages intensifs (juillet-août).' },
    { id: 'blocus', cat: 'process', label: 'Sessions « blocus » avant examens', cost: 150_000, effects: { examBoost: 0.4 },
      desc: '+40 % d’inscriptions en décembre et en mai.' },
    { id: 'flyers', cat: 'marque', label: 'Partenariat avec les associations de parents', cost: 100_000, effects: { attraction: 0.06 },
      desc: 'Bouche-à-oreille des parents : +6 % d’attractivité.' },
    { id: 'temoignages', cat: 'marque', label: 'Site avec témoignages et taux de réussite', cost: 220_000, effects: { attraction: 0.08, resultsVisible: 1 },
      desc: 'Tes bons résultats attirent encore plus d’élèves.' },
    { id: 'en_ligne', cat: 'automatisation', label: 'Cours en ligne hybrides', cost: 900_000, monthly: 8_000, effects: { seats: 40, marketMult: 1.25, slotsMult: 1.2 },
      desc: '+40 places virtuelles, +25 % de marché, profs plus efficaces.' },
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
const { RESTAURANT } = __m["src/data/sectors/restaurant.js"];
const { ECOMMERCE } = __m["src/data/sectors/ecommerce.js"];
const { ARTISAN } = __m["src/data/sectors/artisan.js"];
const { SOUTIEN } = __m["src/data/sectors/soutien.js"];

const SECTOR_DATA = {
  agence: AGENCE,
  restaurant: RESTAURANT,
  ecommerce: ECOMMERCE,
  artisan: ARTISAN,
  soutien: SOUTIEN,
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
__def(__exports, { "initLedger": () => initLedger, "resetMonth": () => resetMonth, "resetYear": () => resetYear, "earn": () => earn, "invoice": () => invoice, "processReceivables": () => processReceivables, "refund": () => refund, "spend": () => spend, "pay": () => pay, "receive": () => receive, "amortizationForYear": () => amortizationForYear, "bookValue": () => bookValue, "receivablesTotal": () => receivablesTotal, "personalIn": () => personalIn, "personalOut": () => personalOut });
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

/** Remboursement d'une vente (retour produit) : CA et TVA collectée diminuent. */
function refund(state, ht, vatRate, cat) {
  if (ht <= 0) return 0;
  const vat = vatFor(state, ht, vatRate);
  const f = state.finance;
  state.cash -= ht + vat;
  f.vat.collected -= vat;
  f.month.revenue -= ht;
  f.year.revenue -= ht;
  f.totals.revenue -= ht;
  f.month.revByCat[cat] = (f.month.revByCat[cat] || 0) - ht;
  f.year.revByCat[cat] = (f.year.revByCat[cat] || 0) - ht;
  recordOut(state, ht + vat, 'retours');
  return ht + vat;
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
__def(__exports, { "initUpgrades": () => initUpgrades, "hasUpgrade": () => hasUpgrade, "upgradeList": () => upgradeList, "upgradeEffect": () => upgradeEffect, "canBuyUpgrade": () => canBuyUpgrade, "upgradeCost": () => upgradeCost, "buyUpgrade": () => buyUpgrade, "payUpgradeMonthly": () => payUpgradeMonthly, "monthlyUpgradeCosts": () => monthlyUpgradeCosts });
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
  const total = Math.round(upgradeCost(state, u) * 1.21);
  if (state.cash - total < -state.finance.overdraftLimit) return { ok: false, reason: 'Trésorerie insuffisante.' };
  return { ok: true, total };
}

/** Prix HT d'une amélioration (remise d'événement éventuelle). */
function upgradeCost(state, u) {
  const d = state.flags.upgradeDiscount;
  if (d && d.until > state.time.day && d.cat === u.cat) return Math.round(u.cost * (1 - d.pct));
  return u.cost;
}

function buyUpgrade(state, id) {
  const c = canBuyUpgrade(state, id);
  if (!c.ok) return c;
  const u = upgradeList(state).find((x) => x.id === id);
  const cost = upgradeCost(state, u);
  if (cost < u.cost) state.flags.upgradeDiscount = null;
  spend(state, cost, 0.21, 'investissement', { capex: true, label: u.label });
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
  // Hausses de charges fixes dues aux événements (assurance, indexation du loyer…)
  if (state.company.extraFixed > 0) spend(state, state.company.extraFixed, 0, 'autres');
  payUpgradeMonthly(state);
}
return __exports;
})();

// ---- src/data/competitors.js ----
__m["src/data/competitors.js"] = (function () {
const __exports = {};
__def(__exports, { "STRATEGIES": () => STRATEGIES, "COMPETITOR_PARAMS": () => COMPETITOR_PARAMS });
// Stratégies des concurrents IA.
// priceIdx = prix / prix de référence ; mkt = budget marketing en multiple du budget de référence.

const STRATEGIES = {
  lowcost: {
    id: 'lowcost', label: 'Bas prix', desc: 'Casse les prix, qualité moyenne. Baisse encore ses prix si tu lui prends des clients.',
    priceIdx: 0.8, quality: 0.85, mkt: 0.8, rep: 40, margin: 0.18, promoChance: 0.06,
  },
  premium: {
    id: 'premium', label: 'Premium', desc: 'Cher mais excellent, soigne sa réputation.',
    priceIdx: 1.3, quality: 1.25, mkt: 1, rep: 55, margin: 0.32, promoChance: 0.02,
  },
  marketing: {
    id: 'marketing', label: 'Agressif en marketing', desc: 'Gros budget publicitaire et promotions fréquentes.',
    priceIdx: 0.98, quality: 0.95, mkt: 3, rep: 45, margin: 0.2, promoChance: 0.16,
  },
  suiveur: {
    id: 'suiveur', label: 'Suiveur', desc: 'Copie tes prix et ta qualité avec un temps de retard.',
    priceIdx: 1, quality: 1, mkt: 1.2, rep: 45, margin: 0.22, promoChance: 0.05,
  },
};

const COMPETITOR_PARAMS = {
  startCashMonths: 6, // trésorerie de départ en mois de CA estimé
  bankruptCashMonths: -3, // faillite sous -3 mois de CA
  respawnDays: [150, 400], // délai avant l'arrivée d'un nouvel entrant
  promoDays: 14,
  promoDiscount: 0.82,
};
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
  const seats = (d.homeSeats || 99) + upgradeEffect(state, d.staffSeatKey || 'seats');
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
__def(__exports, { "mainRole": () => mainRole, "init": () => init, "hoursPerDay": () => hoursPerDay, "quality": () => quality, "backlogHours": () => backlogHours, "refPrice": () => refPrice, "playerAttraction": () => playerAttraction, "leadRate": () => leadRate, "leadAffordable": () => leadAffordable, "acceptLead": () => acceptLead, "declineLead": () => declineLead, "startSaas": () => startSaas, "daily": () => daily, "monthEnd": () => monthEnd, "marketValue": () => marketValue, "priceIndex": () => priceIndex, "recurringRevenue": () => recurringRevenue, "kpis": () => kpis, "sceneInfo": () => sceneInfo, "eventOp": () => eventOp, "actions": () => actions, "onUpgrade": () => onUpgrade });
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

const mainRole = 'developpeur';

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
      : s.leads.length >= 2 && affordable === 0 && s.rate > refPrice(state)
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

/** Valeur mensuelle approximative du marché local (pour les concurrents). */
function marketValue(state) {
  const diff = DIFFICULTIES[state.meta.difficulty];
  return D.marketLeads * diff.marketMult * WORKDAYS_PER_MONTH * 70 * refPrice(state) * economyIndex(state);
}

/** Prix du joueur relatif au marché (1 = prix de référence). */
function priceIndex(state) {
  return state.sector.rate / refPrice(state);
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

/** Opérations d'événements propres à l'agence. */
function eventOp(state, e) {
  const s = state.sector;
  if (e.op === 'bigProject') {
    s.projSeq += 1;
    const rate = Math.round(s.rate * (e.rateMult || 1));
    s.projects.push({
      id: s.projSeq, client: 'Marché public', label: 'Portail communal', hoursEst: e.hours, hoursReal: Math.round(e.hours * 1.1),
      done: 0, price: e.hours * rate, deposit: 0, start: state.time.day, deadlineDay: state.time.day + 150, internal: false,
    });
  } else if (e.op === 'scopeCreep') {
    const p = s.projects.find((x) => !x.internal);
    if (p) {
      p.hoursReal += Math.round(p.hoursEst * e.pct);
      if (e.paid) p.price += Math.round(p.hoursEst * e.pct * s.rate);
    }
  } else if (e.op === 'saasBoost') {
    if (s.saas.status === 'live') s.saas.subscribers += e.n;
  }
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

// ---- src/engine/sectors/common.js ----
__m["src/engine/sectors/common.js"] = (function () {
const __exports = {};
__def(__exports, { "htFromTtc": () => htFromTtc, "diffOf": () => diffOf, "playerMarket": () => playerMarket, "baseWhy": () => baseWhy, "prodMod": () => prodMod });
// Briques communes aux secteurs.

const { DIFFICULTIES } = __m["src/data/difficulty.js"];
const { attractiveness, playerShare } = __m["src/engine/demand.js"];
const { modMult } = __m["src/engine/modifiers.js"];
const { economyIndex } = __m["src/engine/systems/core.js"];

/** HT à partir d'un prix TTC (B2C). En franchise TVA, HT = TTC. */
function htFromTtc(state, ttc, vatRate) {
  if (state.finance.franchise) return ttc;
  return Math.round(ttc / (1 + vatRate));
}

function diffOf(state) {
  return DIFFICULTIES[state.meta.difficulty];
}

/** Attractivité + part de marché du joueur pour un prix donné. */
function playerMarket(state, D, price, ref, extra = 1) {
  const att = attractiveness({
    price,
    refPrice: ref,
    elasticity: D.elasticity,
    quality: state.company.quality,
    reputation: state.company.reputation,
    marketing: state.company.marketing,
    marketingRef: D.marketingRef,
    extra: extra * modMult(state, 'attraction'),
  });
  const share = playerShare(state, att.value);
  state.company.share = share;
  state.company.attraction = att.value;
  return { att, share, eco: economyIndex(state), ev: modMult(state, 'demand') };
}

/** Lignes du panneau « pourquoi ? » communes. */
function baseWhy(m, priceHint) {
  return [
    { label: 'Part de marché', value: m.share, kind: 'pct' },
    { label: 'Prix', value: m.att.parts.prix, hint: priceHint },
    { label: 'Qualité', value: m.att.parts.qualite, hint: 'Qualité perçue face au marché.' },
    { label: 'Réputation', value: m.att.parts.reputation, hint: 'Satisfaction accumulée des clients.' },
    { label: 'Marketing', value: m.att.parts.marketing, hint: 'Rendements décroissants.' },
    { label: 'Conjoncture', value: m.eco, hint: 'Indice économique général.' },
    { label: 'Événements', value: m.ev, hint: 'Effets temporaires en cours.' },
  ];
}

/** Productivité globale (événements). */
function prodMod(state) {
  return modMult(state, 'productivity');
}
return __exports;
})();

// ---- src/engine/sectors/restaurant.js ----
__m["src/engine/sectors/restaurant.js"] = (function () {
const __exports = {};
__def(__exports, { "mainRole": () => mainRole, "blendedVat": () => blendedVat, "init": () => init, "unitCost": () => unitCost, "refPrice": () => refPrice, "priceIndex": () => priceIndex, "marketValue": () => marketValue, "stockQty": () => stockQty, "stockValue": () => stockValue, "quality": () => quality, "capacities": () => capacities, "expectedClients": () => expectedClients, "daily": () => daily, "monthEnd": () => monthEnd, "eventOp": () => eventOp, "kpis": () => kpis, "sceneInfo": () => sceneInfo, "actions": () => actions });
// Secteur friterie : affluence (jour, météo, saison), stock périssable, capacité de
// service, files d'attente, hygiène et contrôles AFSCA.

const { RESTAURANT: D } = __m["src/data/sectors/restaurant.js"];
const { FISCALITE } = __m["src/data/fiscalite.js"];
const { dateOf } = __m["src/engine/calendar.js"];
const { earn, spend, pay } = __m["src/engine/ledger.js"];
const { upgradeEffect } = __m["src/engine/upgrades.js"];
const { modMult } = __m["src/engine/modifiers.js"];
const { productivity, qualityOf } = __m["src/engine/systems/staff.js"];
const { rateCustomer, changeReputation } = __m["src/engine/systems/company.js"];
const { htFromTtc, diffOf, playerMarket, baseWhy, prodMod } = __m["src/engine/sectors/common.js"];
const { log } = __m["src/engine/log.js"];
const { clamp } = __m["src/engine/money.js"];

const mainRole = 'vendeur';

/** Taux de TVA moyen d'un ticket (nourriture + boissons). */
function blendedVat() {
  return (1 - D.drinksShare) * FISCALITE.tva.restaurantFood + D.drinksShare * FISCALITE.tva.restaurantDrinks;
}

function init(state) {
  state.sector = {
    price: D.refPrice,
    ingredient: 2,
    stockDays: 1.3,
    cleaning: 15_000, // budget nettoyage mensuel HT
    hygiene: 80,
    lots: [{ qty: 60, exp: D.shelfLife }],
    pending: 0,
    recent: [], // demande des 7 derniers jours
    closedUntil: -1,
    today: { demand: 0, served: 0, lostQueue: 0, lostStock: 0, capacity: 0 },
    stats: { served: 0, lost: 0, wasted: 0, wastedMonth: 0, bestDay: 0, afscaOk: 0 },
  };
}

function ingredient(state) {
  return D.ingredients.find((i) => i.level === state.sector.ingredient) || D.ingredients[1];
}

function unitCost(state) {
  return Math.round(ingredient(state).cost * modMult(state, 'unitCost'));
}

function refPrice() {
  return D.refPrice;
}

function priceIndex(state) {
  return state.sector.price / D.refPrice;
}

function marketMult(state) {
  return upgradeEffect(state, 'marketMult') || 1;
}

function marketValue(state) {
  return D.marketClients * marketMult(state) * diffOf(state).marketMult * 30 * htFromTtc(state, D.refPrice, blendedVat());
}

function stockQty(state) {
  return state.sector.lots.reduce((s, l) => s + l.qty, 0);
}

function stockValue(state) {
  return stockQty(state) * ingredient(state).cost;
}

function quality(state) {
  const s = state.sector;
  let q = ingredient(state).quality;
  let cooks = 0;
  for (const e of state.staff.employees) {
    if (e.role === 'cuisinier') {
      q += D.roles.cuisinier.quality * (qualityOf(e) - 0.8);
      cooks++;
    }
  }
  if (!cooks && !state.staff.founder.active) q -= 0.1; // personne en cuisine qui maîtrise
  q += upgradeEffect(state, 'quality');
  q *= 0.82 + 0.0018 * s.hygiene;
  return clamp(q * modMult(state, 'quality'), 0.3, 2);
}

/** Capacités de cuisine et de comptoir (clients/jour). */
function capacities(state) {
  const f = state.staff.founder;
  let kitchen = f.active ? D.founderKitchen * (f.energy / 100 * 0.3 + 0.7) : 0;
  let counter = f.active ? D.founderCounter * (f.energy / 100 * 0.3 + 0.7) : 0;
  for (const e of state.staff.employees) {
    const r = D.roles[e.role];
    if (!r) continue;
    const p = productivity(state, e);
    if (r.kitchen) kitchen += r.kitchen * p;
    if (r.counter) counter += r.counter * p;
  }
  kitchen = (kitchen + upgradeEffect(state, 'kitchen')) * upgradeEffect(state, 'kitchenMult');
  counter = (counter + upgradeEffect(state, 'counter')) * upgradeEffect(state, 'counterMult');
  const m = modMult(state, 'capacity') * prodMod(state);
  return { kitchen: kitchen * m, counter: counter * m, total: Math.min(kitchen, counter) * m };
}

/** Clients attendus (λ) pour un jour donné, avec le détail des facteurs. */
function expectedClients(state, day = state.time.day, weatherOverride = null) {
  const d = dateOf(day);
  const m = playerMarket(state, D, state.sector.price, D.refPrice, 1 + upgradeEffect(state, 'attraction'));
  const wName = weatherOverride || state.world.weather;
  let weather = D.weather[wName] ?? 1;
  if (wName === 'soleil') weather += upgradeEffect(state, 'sunBonus');
  if (wName === 'pluie') {
    const protect = Math.min(1, upgradeEffect(state, 'rainProtect') + (state.flags.delivery ? 0.5 : 0));
    weather = 1 - (1 - weather) * (1 - protect);
  }
  const delivery = state.flags.delivery ? 1.1 : 1;
  const lambda =
    D.marketClients * marketMult(state) * diffOf(state).marketMult * D.weekday[d.weekday] * weather * D.seasonality[d.month] * m.eco * m.ev * m.share * delivery;
  return { lambda, m, weekday: D.weekday[d.weekday], weather, season: D.seasonality[d.month], location: marketMult(state), delivery };
}

function consume(state, n) {
  let left = n;
  for (const l of state.sector.lots) {
    if (left <= 0) break;
    const t = Math.min(l.qty, left);
    l.qty -= t;
    left -= t;
  }
  state.sector.lots = state.sector.lots.filter((l) => l.qty > 0);
  return n - left;
}

function daily(state, rng) {
  const s = state.sector;
  const day = state.time.day;
  state.company.quality = quality(state);
  // Livraison du matin
  if (s.pending > 0) {
    s.lots.push({ qty: s.pending, exp: day + D.shelfLife + upgradeEffect(state, 'shelfLife') });
    s.pending = 0;
  }
  const ex = expectedClients(state);
  const caps = capacities(state);
  const closed = s.closedUntil > day;
  const demand = closed ? 0 : rng.poisson(ex.lambda);
  const capacity = Math.floor(caps.total);
  const canServe = Math.min(demand, capacity);
  const served = consume(state, canServe);
  const lostQueue = Math.max(0, demand - capacity);
  const lostStock = canServe - served;
  s.today = { demand, served, lostQueue, lostStock, capacity, closed };
  s.recent.push(demand);
  if (s.recent.length > 7) s.recent.shift();
  s.stats.served += served;
  s.stats.lost += lostQueue + lostStock;
  s.stats.bestDay = Math.max(s.stats.bestDay, served);
  state.stats.unitsSold = (state.stats.unitsSold || 0) + served;

  // Chiffre d'affaires
  if (served > 0) {
    const vat = blendedVat();
    const ttc = served * s.price;
    earn(state, htFromTtc(state, ttc, vat), vat, 'ventes');
    if (state.flags.delivery) {
      const deliveredShare = 0.1 / 1.1;
      spend(state, Math.round(htFromTtc(state, ttc, vat) * deliveredShare * D.deliveryCommission), 0.21, 'logistique');
    }
  }
  // Satisfaction
  if (demand > 0) {
    const valueForMoney = D.refPrice / s.price;
    let score = 50 + 70 * (state.company.quality - 0.85) + 25 * (valueForMoney - 1);
    score -= 45 * (lostQueue / demand) + 30 * (lostStock / demand);
    rateCustomer(state, clamp(score, 0, 100), 0.03);
  }
  // Hygiène
  let regen = s.cleaning / 30 / 400 + upgradeEffect(state, 'hygieneRegen');
  for (const e of state.staff.employees) if (e.role === 'plongeur') regen += D.roles.plongeur.hygiene * productivity(state, e);
  s.hygiene = clamp(s.hygiene - 0.35 - served / 220 + regen, 0, 100);
  // Péremption
  const expired = s.lots.filter((l) => l.exp <= day + 1);
  const waste = expired.reduce((t, l) => t + l.qty, 0);
  if (waste > 0) {
    s.lots = s.lots.filter((l) => l.exp > day + 1);
    s.stats.wasted += waste;
    s.stats.wastedMonth += waste;
  }
  // Commande pour demain
  let forecast;
  if (upgradeEffect(state, 'forecast') > 0) forecast = expectedClients(state, day + 1).lambda * 1.05;
  else {
    // moyenne récente corrigée du jour de la semaine de demain
    const avg = s.recent.reduce((a, b) => a + b, 0) / Math.max(1, s.recent.length);
    const meanWd = D.weekday.reduce((a, b) => a + b, 0) / 7;
    forecast = (avg * D.weekday[dateOf(day + 1).weekday]) / meanWd;
  }
  forecast = Math.min(forecast, capacity * 1.1);
  const keep = s.lots.filter((l) => l.exp > day + 2).reduce((t, l) => t + l.qty, 0);
  const order = Math.max(0, Math.round(forecast * s.stockDays - keep));
  if (order > 0 && !closed) {
    s.pending = order;
    spend(state, order * unitCost(state), D.purchaseVat, 'stock');
  }
  // Énergie et nettoyage (au prorata quotidien)
  spend(state, Math.round((D.energyBase * modMult(state, 'energy')) / 30), 0.21, 'energie');
  if (s.cleaning > 0) spend(state, Math.round(s.cleaning / 30), 0.21, 'materiel');

  state.company.capacityUse = capacity > 0 ? served / capacity : 1;
  state.staff.lastWorkload = capacity > 0 ? demand / capacity : 0;
  state.company.demandPerDay = ex.lambda;
  state.company.why = [
    ...baseWhy(ex.m, `Ticket moyen ${(s.price / 100).toFixed(2).replace('.', ',')} € (marché 11,50 €).`),
    { label: 'Jour de la semaine', value: ex.weekday, hint: 'Vendredi et samedi sont les meilleurs jours.' },
    { label: 'Météo', value: ex.weather, hint: 'Soleil + terrasse = foule ; la pluie fait fuir.' },
    { label: 'Saison', value: ex.season, hint: 'L’été est la haute saison.' },
    { label: 'Emplacement', value: ex.location, hint: 'Place du marché, 2e établissement.' },
  ];
  state.company.bottleneck = closed
    ? 'ferme'
    : lostStock > demand * 0.08
      ? 'stock'
      : lostQueue > demand * 0.08
        ? 'personnel'
        : ex.m.share < 0.12
          ? 'demande'
          : null;
}

function monthEnd(state) {
  const s = state.sector;
  if (s.stats.wastedMonth > 0) log(state, 'info', `Gaspillage du mois : ${s.stats.wastedMonth} portions jetées (${Math.round((s.stats.wastedMonth * ingredient(state).cost) / 100)} €).`);
  s.stats.wastedMonth = 0;
}

/** Contrôle de l'AFSCA (appelé par l'événement). */
function afsca(state) {
  const s = state.sector;
  const score = s.hygiene + upgradeEffect(state, 'afscaBonus');
  if (score >= 75) {
    changeReputation(state, 2);
    s.stats.afscaOk += 1;
    state.stats.afscaOk = (state.stats.afscaOk || 0) + 1;
    log(state, 'good', `Contrôle AFSCA réussi (hygiène ${Math.round(s.hygiene)}/100) : smiley affiché en vitrine !`, true);
  } else if (score >= 55) {
    pay(state, 40_000, 'amendes');
    log(state, 'bad', `AFSCA : avertissement et amende de 400 € (hygiène ${Math.round(s.hygiene)}/100).`, true);
  } else if (score >= 35) {
    pay(state, 150_000, 'amendes');
    changeReputation(state, -4);
    log(state, 'bad', `AFSCA : infractions constatées, amende de 1 500 € (hygiène ${Math.round(s.hygiene)}/100).`, true);
  } else {
    pay(state, 300_000, 'amendes');
    changeReputation(state, -10);
    s.closedUntil = state.time.day + 5;
    log(state, 'bad', `AFSCA : fermeture administrative de 5 jours et amende de 3 000 € (hygiène ${Math.round(s.hygiene)}/100) !`, true);
  }
}

function eventOp(state, e) {
  const s = state.sector;
  switch (e.op) {
    case 'afsca':
      afsca(state);
      break;
    case 'stockLoss':
      for (const l of s.lots) l.qty = Math.floor(l.qty * (1 - e.pct));
      s.lots = s.lots.filter((l) => l.qty > 0);
      break;
    case 'close':
      s.closedUntil = Math.max(s.closedUntil, state.time.day + e.days);
      break;
    case 'hygiene':
      s.hygiene = clamp(s.hygiene + e.v, 0, 100);
      break;
    case 'heatwave':
      s.hygiene = clamp(s.hygiene - 8, 0, 100);
      break;
    default:
      break;
  }
}

function kpis(state) {
  const s = state.sector;
  const caps = capacities(state);
  const avg = s.recent.length ? s.recent.reduce((a, b) => a + b, 0) / s.recent.length : 0;
  return [
    { label: 'Ticket moyen TTC', value: s.price, fmt: 'eur2' },
    { label: 'Clients/jour (moy. 7 j)', value: avg, fmt: 'num0' },
    { label: 'Capacité/jour', value: caps.total, fmt: 'num0' },
    { label: 'Stock (portions)', value: stockQty(state), fmt: 'int' },
    { label: 'Hygiène', value: s.hygiene, fmt: 'num0', suffix: '/100' },
    { label: 'Servis hier', value: s.today.served, fmt: 'int' },
  ];
}

function sceneInfo(state) {
  const t = state.sector.today;
  return { activity: Math.min(1, t.capacity ? t.served / t.capacity : 0), customers: Math.min(8, Math.round(t.served / 12)), queue: t.lostQueue > 0 };
}

const actions = {
  setPrice(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.price = clamp(v, D.minPrice, D.maxPrice);
    return { ok: true };
  },
  setIngredient(state, a) {
    const lvl = Number(a.value);
    if (![1, 2, 3].includes(lvl)) return { ok: false, message: 'Niveau inconnu.' };
    state.sector.ingredient = lvl;
    return { ok: true };
  },
  setStockDays(state, a) {
    const v = Number(a.value) / 100;
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.stockDays = clamp(v, 0.5, 4);
    return { ok: true };
  },
  setCleaning(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.cleaning = clamp(v, 0, 500_000);
    return { ok: true };
  },
};
return __exports;
})();

// ---- src/engine/sectors/ecommerce.js ----
__m["src/engine/sectors/ecommerce.js"] = (function () {
const __exports = {};
__def(__exports, { "mainRole": () => mainRole, "init": () => init, "slots": () => slots, "priceIndex": () => priceIndex, "refPrice": () => refPrice, "marketValue": () => marketValue, "stockValue": () => stockValue, "quality": () => quality, "cpc": () => cpc, "orderCapacity": () => orderCapacity, "funnel": () => funnel, "daily": () => daily, "monthEnd": () => monthEnd, "eventOp": () => eventOp, "kpis": () => kpis, "sceneInfo": () => sceneInfo, "actions": () => actions });
// Secteur e-commerce : trafic (organique + payant), conversion, catalogue,
// stock acheté à l'avance avec délai fournisseur, préparation des commandes,
// logistique, retours, pics saisonniers (Black Friday, fêtes).

const { ECOMMERCE: D } = __m["src/data/sectors/ecommerce.js"];
const { dateOf } = __m["src/engine/calendar.js"];
const { earn, spend, refund } = __m["src/engine/ledger.js"];
const { upgradeEffect } = __m["src/engine/upgrades.js"];
const { modMult } = __m["src/engine/modifiers.js"];
const { productivity, countRole } = __m["src/engine/systems/staff.js"];
const { rateCustomer } = __m["src/engine/systems/company.js"];
const { priceFactor, reputationFactor } = __m["src/engine/demand.js"];
const { htFromTtc, diffOf, playerMarket, baseWhy, prodMod } = __m["src/engine/sectors/common.js"];
const { log } = __m["src/engine/log.js"];
const { clamp } = __m["src/engine/money.js"];

const mainRole = 'logisticien';
const P = Object.fromEntries(D.products.map((p) => [p.id, p]));

function init(state) {
  const prices = {};
  const stock = {};
  for (const p of D.products) {
    prices[p.id] = p.ref;
    stock[p.id] = 0;
  }
  stock.gourde = 60;
  stock.lampe = 40;
  state.sector = {
    listed: ['gourde', 'lampe'],
    prices,
    stock,
    pos: [], // commandes fournisseur en cours : { id, qty, arrive }
    reorder: true,
    coverDays: 30,
    sales: {}, // ventes quotidiennes récentes par produit (14 jours)
    backlog: 0,
    returnsQ: [],
    today: { visitors: 0, paid: 0, organic: 0, orders: 0, lostStock: 0, shipped: 0, conversion: 0 },
    stats: { orders: 0, returns: 0, lostStock: 0, bestDay: 0, revenueOrders: 0 },
  };
}

function slots(state) {
  return D.startSlots + upgradeEffect(state, 'slots');
}

/** Prix relatif moyen du catalogue (1 = prix de référence). */
function priceIndex(state) {
  const s = state.sector;
  if (!s.listed.length) return 1;
  let t = 0;
  for (const id of s.listed) t += s.prices[id] / P[id].ref;
  return t / s.listed.length / (1 + upgradeEffect(state, 'priceTolerance'));
}

function refPrice() {
  return 1;
}

function marketValue(state) {
  return D.organicVisitors * diffOf(state).marketMult * 30 * D.baseConversion * 3_400 * 2;
}

function stockValue(state) {
  let v = 0;
  for (const p of D.products) v += (state.sector.stock[p.id] || 0) * p.cost;
  for (const po of state.sector.pos) v += po.qty * P[po.id].cost;
  return v;
}

function quality(state) {
  let q = 0.92 + upgradeEffect(state, 'conv') * 0.6;
  for (const e of state.staff.employees) if (e.role === 'service_client') q += 0.04 * productivity(state, e);
  return clamp(q * modMult(state, 'quality'), 0.3, 2);
}

/** Coût par clic effectif (centimes). */
function cpc(state) {
  const d = dateOf(state.time.day);
  const mk = Math.min(2, countRole(state, 'marketeur'));
  const comp = state.competitors.filter((c) => c.alive);
  const pressure = comp.length ? 0.8 + (0.2 * comp.reduce((s, c) => s + c.mkt, 0)) / comp.length : 1;
  return D.cpc * D.cpcSeason[d.month] * (1 - D.roles.marketeur.cpcCut * mk) * modMult(state, 'cpc') * pressure;
}

function blackFriday(day) {
  const d = dateOf(day);
  const b = D.blackFriday;
  return d.month === b.month && d.dom >= b.from && d.dom <= b.to ? b.mult : 1;
}

function orderCapacity(state) {
  let c = state.staff.founder.active ? D.founderOrders : 0;
  for (const e of state.staff.employees) if (e.role === 'logisticien') c += D.roles.logisticien.orders * productivity(state, e);
  return (c * upgradeEffect(state, 'ordersMult') + upgradeEffect(state, 'ordersAdd')) * modMult(state, 'capacity') * prodMod(state);
}

/** Trafic et conversion attendus aujourd'hui. */
function funnel(state) {
  const d = dateOf(state.time.day);
  const m = playerMarket(state, D, priceIndex(state), 1, 1);
  const season = D.seasonality[d.month] * blackFriday(state.time.day);
  const repeat = 1 + upgradeEffect(state, 'repeat');
  const organic = D.organicVisitors * diffOf(state).marketMult * m.share * upgradeEffect(state, 'organicMult') * m.eco * repeat;
  const paid = state.company.marketing > 0 ? state.company.marketing / 30 / cpc(state) : 0;
  const mpShare = upgradeEffect(state, 'marketplace') > 0 ? 0.6 : 0;
  const visitors = (organic + paid) * (1 + mpShare);
  const mk = Math.min(2, countRole(state, 'marketeur'));
  const convBoost = 1 + upgradeEffect(state, 'conv') + D.roles.marketeur.conv * mk;
  const pf = priceFactor(priceIndex(state) * modMult(state, 'priceCut'), 1, D.elasticity);
  const conversion = D.baseConversion * pf * convBoost * reputationFactor(state.company.reputation) * season * m.ev;
  return { m, organic, paid, visitors, conversion, season, pf, convBoost, mpShare };
}

function productWeights(state) {
  const d = dateOf(state.time.day);
  const s = state.sector;
  return s.listed.map((id) => {
    const p = P[id];
    const seas = p.season && p.season[d.month] ? p.season[d.month] : 1;
    return { id, w: p.weight * seas * priceFactor(s.prices[id], p.ref, D.elasticity) };
  });
}

function avgDailySales(state, id) {
  const arr = state.sector.sales[id] || [];
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function placeOrder(state, id, qty) {
  const p = P[id];
  const q = Math.max(0, Math.round(qty));
  if (!q) return 0;
  const lead = Math.round(D.leadTime * modMult(state, 'delivery'));
  state.sector.pos.push({ id, qty: q, arrive: state.time.day + lead });
  spend(state, Math.round(q * p.cost * modMult(state, 'unitCost')), p.vat, 'stock');
  return q;
}

function autoReorder(state) {
  const s = state.sector;
  const d = dateOf(state.time.day);
  for (const id of s.listed) {
    const p = P[id];
    let avg = avgDailySales(state, id);
    if (!(s.sales[id] || []).length) avg = 2;
    if (upgradeEffect(state, 'smartReorder') > 0) {
      const next = (d.month + 1) % 12;
      const seas = (p.season && p.season[next]) || 1;
      avg = Math.max(avg, avg * seas * (D.seasonality[next] / D.seasonality[d.month]));
    }
    const inbound = s.pos.filter((x) => x.id === id).reduce((t, x) => t + x.qty, 0);
    const position = (s.stock[id] || 0) + inbound;
    const rop = avg * (D.leadTime + 5);
    if (position < rop) placeOrder(state, id, Math.max(15, avg * s.coverDays));
  }
}

function daily(state, rng) {
  const s = state.sector;
  const day = state.time.day;
  state.company.quality = quality(state);
  // Réceptions fournisseur
  const arrived = s.pos.filter((x) => x.arrive <= day);
  if (arrived.length) {
    for (const po of arrived) s.stock[po.id] = (s.stock[po.id] || 0) + po.qty;
    s.pos = s.pos.filter((x) => x.arrive > day);
  }
  const f = funnel(state);
  const orders = rng.poisson(f.visitors * f.conversion);
  const weights = productWeights(state);
  let sold = 0;
  let lostStock = 0;
  const soldBy = {};
  const vatBy = {};
  for (let i = 0; i < orders; i++) {
    let pick = rng.weighted(weights, 'w');
    if (!pick) break;
    if ((s.stock[pick.id] || 0) <= 0) {
      const alt = weights.filter((w) => (s.stock[w.id] || 0) > 0);
      if (!alt.length || rng.chance(0.6)) {
        lostStock++;
        continue;
      }
      pick = rng.weighted(alt, 'w');
    }
    s.stock[pick.id] -= 1;
    soldBy[pick.id] = (soldBy[pick.id] || 0) + 1;
    sold++;
    const p = P[pick.id];
    const ttc = Math.round(s.prices[pick.id] * modMult(state, 'priceCut'));
    vatBy[p.vat] = (vatBy[p.vat] || 0) + ttc;
  }
  // Encaissement (paiement à la commande)
  let htTotal = 0;
  let ttcTotal = 0;
  for (const [rate, ttc] of Object.entries(vatBy)) {
    const ht = htFromTtc(state, ttc, Number(rate));
    htTotal += ht;
    ttcTotal += ttc;
    earn(state, ht, Number(rate), 'ventes');
  }
  // Frais de paiement (services financiers : pas de TVA)
  if (sold) spend(state, Math.round(ttcTotal * D.paymentPct + sold * D.paymentFixed), 0, 'frais_bancaires');
  if (f.mpShare > 0 && htTotal > 0) spend(state, Math.round(htTotal * (f.mpShare / (1 + f.mpShare)) * 0.15), 0.21, 'marketing');
  for (const id of s.listed) {
    const arr = (s.sales[id] = s.sales[id] || []);
    arr.push(soldBy[id] || 0);
    if (arr.length > 14) arr.shift();
  }
  // Préparation et expédition
  s.backlog += sold;
  const cap = orderCapacity(state);
  const shipped = Math.min(s.backlog, Math.floor(cap));
  s.backlog -= shipped;
  if (shipped > 0) {
    const avgShip = s.listed.reduce((t, id) => t + P[id].ship, 0) / Math.max(1, s.listed.length);
    const shipCut = Math.min(0.4, upgradeEffect(state, 'shipCut'));
    spend(state, Math.round(shipped * (avgShip + D.packing) * (1 - shipCut)), 0.21, 'logistique');
  }
  // Retours (programmés)
  const svc = state.staff.employees.filter((e) => e.role === 'service_client').reduce((t, e) => t + productivity(state, e), 0);
  const retMult = upgradeEffect(state, 'returnsMult') * modMult(state, 'returns') * Math.max(0.4, 1 - D.roles.service_client.returnsCut * svc);
  for (const [id, n] of Object.entries(soldBy)) {
    const p = P[id];
    for (let i = 0; i < n; i++) {
      if (rng.chance(p.returns * retMult)) s.returnsQ.push({ day: day + D.returnDelay, id, ttc: s.prices[id], vat: p.vat });
    }
  }
  const dueReturns = s.returnsQ.filter((r) => r.day <= day);
  if (dueReturns.length) {
    s.returnsQ = s.returnsQ.filter((r) => r.day > day);
    for (const r of dueReturns) {
      refund(state, htFromTtc(state, r.ttc, r.vat), r.vat, 'ventes');
      if (rng.chance(D.returnResellable)) s.stock[r.id] = (s.stock[r.id] || 0) + 1;
      s.stats.returns++;
    }
  }
  // Stockage
  const sv = stockValue(state);
  if (sv > 0) spend(state, Math.round((sv * D.storageMonthlyPct * (1 - Math.min(0.6, upgradeEffect(state, 'storageCut')))) / 30), 0.21, 'logistique');
  if (s.reorder) autoReorder(state);

  // Satisfaction
  if (orders > 0) {
    const delay = s.backlog / Math.max(1, cap);
    const score = 58 + 35 * (f.pf - 1) + 6 * svc - 25 * Math.min(2, delay) - 25 * (lostStock / orders) + 30 * (state.company.quality - 0.92);
    rateCustomer(state, clamp(score, 0, 100), 0.02);
  }
  s.today = { visitors: Math.round(f.visitors), paid: Math.round(f.paid), organic: Math.round(f.organic), orders, sold, lostStock, shipped, conversion: f.conversion };
  s.stats.orders += sold;
  s.stats.lostStock += lostStock;
  s.stats.bestDay = Math.max(s.stats.bestDay, sold);
  state.stats.unitsSold = (state.stats.unitsSold || 0) + sold;
  state.company.capacityUse = cap > 0 ? Math.min(1, (shipped + s.backlog) / cap) : 1;
  state.staff.lastWorkload = cap > 0 ? (sold + s.backlog) / cap : 0;
  state.company.demandPerDay = f.visitors * f.conversion;
  state.company.why = [
    ...baseWhy(f.m, 'Prix moyen de ton catalogue face au marché (les clients comparent beaucoup en ligne).'),
    { label: 'Saison / Black Friday', value: f.season, hint: 'Novembre-décembre explosent, février est mou.' },
    { label: 'Conversion (photos, avis…)', value: f.convBoost, hint: 'Améliorations et marketeurs.' },
    { label: 'Trafic payant', value: 1 + f.paid / Math.max(1, f.organic + f.paid), hint: 'Part des visiteurs achetés en publicité.' },
  ];
  state.company.bottleneck = lostStock > orders * 0.1 ? 'stock' : s.backlog > cap ? 'personnel' : f.visitors < 80 ? 'demande' : null;
}

function monthEnd(state) {
  const s = state.sector;
  for (const id of s.listed) {
    if ((s.stock[id] || 0) === 0 && !s.pos.some((x) => x.id === id)) log(state, 'bad', `Rupture de stock : ${P[id].label}. Pense à commander !`);
  }
}

function eventOp(state, e) {
  const s = state.sector;
  if (e.op === 'delayOrders') for (const po of s.pos) po.arrive += e.days;
  if (e.op === 'stockLoss') for (const id of Object.keys(s.stock)) s.stock[id] = Math.floor(s.stock[id] * (1 - e.pct));
}

function kpis(state) {
  const t = state.sector.today;
  const paidOrders = t.visitors > 0 ? (t.orders * t.paid) / t.visitors : 0;
  const cac = paidOrders > 0 ? state.company.marketing / 30 / paidOrders : 0;
  return [
    { label: 'Visiteurs/jour', value: t.visitors, fmt: 'int' },
    { label: 'Conversion', value: t.conversion, fmt: 'pct' },
    { label: 'Commandes hier', value: t.orders, fmt: 'int' },
    { label: 'Coût d’acquisition', value: cac, fmt: 'eur2' },
    { label: 'Valeur du stock', value: stockValue(state), fmt: 'eur' },
    { label: 'À expédier', value: state.sector.backlog, fmt: 'int' },
  ];
}

function sceneInfo(state) {
  const t = state.sector.today;
  return { activity: Math.min(1, t.shipped / 30), customers: Math.min(6, Math.round(t.shipped / 8)), parcels: Math.min(10, t.shipped) };
}

const actions = {
  setProductPrice(state, a) {
    const p = P[a.id];
    const v = Math.round(Number(a.value));
    if (!p || !Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.prices[a.id] = clamp(v, Math.round(p.cost * 0.8), p.ref * 3);
    return { ok: true };
  },
  listProduct(state, a) {
    const s = state.sector;
    if (!P[a.id]) return { ok: false, message: 'Produit inconnu.' };
    if (s.listed.includes(a.id)) return { ok: false, message: 'Déjà au catalogue.' };
    if (s.listed.length >= slots(state)) return { ok: false, message: 'Catalogue plein : améliore ta boutique pour référencer plus de produits.' };
    s.listed.push(a.id);
    return { ok: true };
  },
  unlistProduct(state, a) {
    const s = state.sector;
    if (!s.listed.includes(a.id)) return { ok: false, message: 'Pas au catalogue.' };
    s.listed = s.listed.filter((x) => x !== a.id);
    return { ok: true };
  },
  orderStock(state, a) {
    if (!P[a.id]) return { ok: false, message: 'Produit inconnu.' };
    const q = Math.round(Number(a.qty));
    if (!(q > 0 && q <= 5000)) return { ok: false, message: 'Quantité invalide.' };
    const cost = Math.round(q * P[a.id].cost * 1.21);
    if (state.cash - cost < -state.finance.overdraftLimit) return { ok: false, message: 'Trésorerie insuffisante pour cette commande.' };
    placeOrder(state, a.id, q);
    return { ok: true };
  },
  setReorder(state, a) {
    state.sector.reorder = a.value === true || a.value === 'true' || a.value === 'on';
    return { ok: true };
  },
  setCoverDays(state, a) {
    const v = Number(a.value);
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.coverDays = clamp(Math.round(v), 7, 90);
    return { ok: true };
  },
};
return __exports;
})();

// ---- src/engine/sectors/artisan.js ----
__m["src/engine/sectors/artisan.js"] = (function () {
const __exports = {};
__def(__exports, { "vans": () => vans, "mainRole": () => mainRole, "metier": () => metier, "init": () => init, "refPrice": () => refPrice, "priceIndex": () => priceIndex, "marketValue": () => marketValue, "workforce": () => workforce, "quality": () => quality, "backlogDays": () => backlogDays, "leadRate": () => leadRate, "daily": () => daily, "monthEnd": () => monthEnd, "eventOp": () => eventOp, "kpis": () => kpis, "sceneInfo": () => sceneInfo, "actions": () => actions });
// Secteur artisan : demandes → devis → planning des ouvriers → chantier → facture.
// Camionnettes, matériel, déplacements, bouche-à-oreille, contrats d'entretien.

const { ARTISAN: D } = __m["src/data/sectors/artisan.js"];
const { FISCALITE } = __m["src/data/fiscalite.js"];
const { dateOf, isWeekend } = __m["src/engine/calendar.js"];
const { earn, invoice, spend } = __m["src/engine/ledger.js"];
const { upgradeEffect, hasUpgrade } = __m["src/engine/upgrades.js"];
const { modMult } = __m["src/engine/modifiers.js"];
const { productivity, qualityOf, countRole } = __m["src/engine/systems/staff.js"];
const { rateCustomer, changeReputation } = __m["src/engine/systems/company.js"];
const { diffOf, playerMarket, baseWhy, prodMod } = __m["src/engine/sectors/common.js"];
const { log } = __m["src/engine/log.js"];
const { clamp } = __m["src/engine/money.js"];

const mainRole = 'ouvrier';

function metier(state) {
  return D.metiers[state.meta.metier] || D.metiers.plombier;
}

function init(state) {
  if (!D.metiers[state.meta.metier]) state.meta.metier = 'plombier';
  state.sector = {
    rate: D.refRate,
    margin: D.refMargin,
    policy: 'capacite',
    quotes: [], // devis en attente de réponse
    jobs: [], // chantiers acceptés (file)
    seq: 0,
    wom: 0, // stock de bouche-à-oreille
    contracts: 0,
    today: { capacity: 0, used: 0, leads: 0 },
    stats: { jobsDone: 0, quotes: 0, won: 0, lost: 0, malfacons: 0 },
  };
}

function refPrice() {
  return D.refRate;
}

function priceIndex(state) {
  return (state.sector.rate / D.refRate) * (0.85 + 0.15 * ((1 + state.sector.margin) / (1 + D.refMargin)));
}

function marketValue(state) {
  return D.marketLeads * diffOf(state).marketMult * 21 * 1.6 * D.hoursPerDay * D.refRate * 0.85;
}

function vans(state) {
  return 1 + upgradeEffect(state, 'vans');
}

/** Jours-homme disponibles par jour ouvré. */
function workforce(state) {
  const f = state.staff.founder;
  const workers = [];
  if (f.active) workers.push(1 * (0.7 + 0.3 * f.energy / 100) * (0.6 + f.skill / 140));
  for (const e of state.staff.employees) {
    const r = D.roles[e.role];
    if (r && r.speed) workers.push(r.speed * productivity(state, e));
  }
  workers.sort((a, b) => b - a);
  const seatsOnRoad = vans(state) * 2;
  let total = 0;
  workers.forEach((w, i) => (total += i < seatsOnRoad ? w : w * 0.5));
  const pm = countRole(state, 'planificateur') > 0 ? 1.05 : 1;
  return total * D.billableRatio * upgradeEffect(state, 'speedMult') * pm * modMult(state, 'capacity') * prodMod(state);
}

function quality(state) {
  let wq = 0;
  let n = 0;
  if (state.staff.founder.active) {
    wq += 0.6 + state.staff.founder.skill / 125;
    n++;
  }
  for (const e of state.staff.employees) {
    if (D.roles[e.role] && D.roles[e.role].speed) {
      wq += qualityOf(e);
      n++;
    }
  }
  const q = (n ? wq / n : 0.8) + upgradeEffect(state, 'quality');
  return clamp(q * modMult(state, 'quality'), 0.3, 2);
}

function backlogDays(state) {
  return state.sector.jobs.reduce((s, j) => s + Math.max(0, j.daysTotal - j.daysDone), 0);
}

function availableJobs(state) {
  return metier(state).jobs.filter((j) => !j.requires || hasUpgrade(state, j.requires));
}

function jobValue(state, t, rate = state.sector.rate, margin = state.sector.margin) {
  const labor = t.days * D.hoursPerDay * rate;
  const mat = t.materials * modMult(state, 'materialCost') * (1 + margin);
  return Math.round(labor + mat + (t.urgent ? D.urgentFee : 0));
}

function womFactor(state) {
  return 1 + 0.35 * Math.log(1 + state.sector.wom / 8);
}

function leadRate(state) {
  const d = dateOf(state.time.day);
  const m = playerMarket(state, D, priceIndex(state) * D.refRate, D.refRate, 1);
  const season = metier(state).seasonality[d.month];
  const brand = upgradeEffect(state, 'leadsMult');
  const wom = womFactor(state);
  const lambda = D.marketLeads * diffOf(state).marketMult * season * m.eco * m.ev * m.share * brand * wom;
  return { lambda, m, season, brand, wom };
}

function acceptProb(state, t, price) {
  const ref = jobValue(state, t, D.refRate, D.refMargin);
  const plan = Math.min(2, countRole(state, 'planificateur')) * D.roles.planificateur.accept;
  let p = D.baseAccept * Math.pow(ref / price, 1.3) * (0.7 + state.company.reputation / 170) * (1 + plan + upgradeEffect(state, 'accept'));
  if (t.urgent) p = Math.min(0.95, p * 1.3);
  return clamp(p, 0.04, 0.95);
}

function newQuote(state, rng) {
  const s = state.sector;
  const d = dateOf(state.time.day);
  const list = availableJobs(state);
  const years = state.time.day / 360;
  const t = rng.weighted(list, (j) => j.weight * ((j.season && j.season[d.month]) || 1) * (1 + (j.trend || 0) * years));
  const price = jobValue(state, t);
  s.seq += 1;
  return {
    id: s.seq,
    type: t.id,
    label: t.label,
    price,
    vat: rng.chance(t.renoShare) ? FISCALITE.tva.renovation : FISCALITE.tva.rates.normal,
    decide: state.time.day + (t.urgent ? 0 : rng.int(2, 5)),
    p: acceptProb(state, t, price),
  };
}

function startJob(state, q) {
  const t = metier(state).jobs.find((j) => j.id === q.type);
  state.sector.jobs.push({
    id: q.id, type: q.type, label: q.label, price: q.price, vat: q.vat, daysTotal: t.days, daysDone: 0,
    materials: Math.round(t.materials * modMult(state, 'materialCost') * (1 - upgradeEffect(state, 'materialCut'))),
    matPaid: false, payNow: !!t.payNow, urgent: !!t.urgent, payDelay: q.payDelay || D.paymentDays,
  });
  if (t.urgent) state.sector.jobs.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
}

function finishJob(state, j, rng) {
  const s = state.sector;
  s.jobs = s.jobs.filter((x) => x !== j);
  if (j.payNow) earn(state, j.price, j.vat, 'chantiers');
  else invoice(state, j.price, j.vat, 'chantiers', { dueIn: j.payDelay, defaultProb: D.defaultProb * modMult(state, 'defaultRisk'), lateProb: D.lateProb, label: j.label, rng });
  const q = state.company.quality * rng.range(0.9, 1.1);
  const score = clamp(50 + 80 * (q - 0.85), 0, 100);
  rateCustomer(state, score, 0.08);
  if (score > 65) s.wom += 1;
  if (rng.chance(Math.max(0, 1.05 - q) * 0.25)) {
    s.stats.malfacons++;
    changeReputation(state, -1.5);
    s.wom = Math.max(0, s.wom - 3);
    log(state, 'bad', `Malfaçon signalée sur « ${j.label} » : il faudra repasser.`);
    s.jobs.push({ ...j, id: ++s.seq, label: `Reprise : ${j.label}`, price: 0, daysTotal: j.daysTotal * 0.25, daysDone: 0, materials: 0, matPaid: true, payNow: true });
  }
  if (j.type === 'entretien' && upgradeEffect(state, 'contracts') > 0 && rng.chance(D.maintenanceContract.signProb)) s.contracts++;
  s.stats.jobsDone++;
  state.stats.unitsSold = (state.stats.unitsSold || 0) + 1;
}

function daily(state, rng) {
  const s = state.sector;
  const day = state.time.day;
  const weekend = isWeekend(day);
  state.company.quality = quality(state);
  const lr = leadRate(state);
  // Nouvelles demandes → devis
  const n = rng.poisson(lr.lambda * (weekend ? D.weekendLeads : 1));
  const cap = workforce(state);
  for (let i = 0; i < n; i++) {
    const q = newQuote(state, rng);
    if (weekend && !metier(state).jobs.find((j) => j.id === q.type).urgent) continue;
    if (s.policy === 'capacite' && backlogDays(state) > Math.max(1, cap) * 25 && !metier(state).jobs.find((j) => j.id === q.type).urgent) {
      s.stats.lost++;
      continue;
    }
    s.quotes.push(q);
    s.stats.quotes++;
  }
  // Réponses des clients
  const due = s.quotes.filter((q) => q.decide <= day);
  s.quotes = s.quotes.filter((q) => q.decide > day);
  for (const q of due) {
    if (rng.chance(q.p)) {
      startJob(state, q);
      s.stats.won++;
    } else s.stats.lost++;
  }
  // Chantiers (jours ouvrés ; dépannages aussi le week-end, à capacité réduite)
  let pool = weekend ? cap * 0.25 : cap;
  const total = pool;
  for (const j of [...s.jobs]) {
    if (pool <= 0) break;
    if (weekend && !j.urgent) continue;
    if (!j.matPaid) {
      if (j.materials > 0) spend(state, j.materials, 0.21, 'materiel');
      j.matPaid = true;
    }
    const w = Math.min(pool, j.daysTotal - j.daysDone, Math.max(1, j.daysTotal * 0.5) + 1);
    j.daysDone += w;
    pool -= w;
    spend(state, Math.round(w * D.travelPerDay * (1 - Math.min(0.5, upgradeEffect(state, 'travelCut')))), 0.21, 'deplacements');
    if (j.daysDone >= j.daysTotal - 1e-6) finishJob(state, j, rng);
  }
  const used = total - pool;
  s.today = { capacity: total, used, leads: n };
  state.company.capacityUse = total > 0 ? used / total : 1;
  const backlog = backlogDays(state);
  state.staff.lastWorkload = cap > 0 ? Math.min(2, backlog / (cap * 21)) : 0;
  state.company.demandPerDay = lr.lambda;
  state.company.why = [
    ...baseWhy(lr.m, 'Ton taux horaire et ta marge sur matériel face aux autres artisans.'),
    { label: 'Saison', value: lr.season, hint: metier(state).id === 'plombier' ? 'L’hiver, les chaudières tombent en panne.' : 'Activité assez régulière.' },
    { label: 'Bouche-à-oreille', value: lr.wom, hint: 'Chaque chantier réussi te ramène des clients.' },
    { label: 'Visibilité', value: lr.brand, hint: 'Site, avis Google, lettrage des camionnettes.' },
  ];
  state.company.bottleneck = backlog > cap * 25 ? 'capacite' : lr.lambda < 0.4 ? 'demande' : null;
}

function monthEnd(state, rng) {
  const s = state.sector;
  s.wom *= 1 - D.womDecayMonthly;
  if (s.contracts > 0) {
    s.contracts = Math.max(0, s.contracts - Math.round(s.contracts * D.maintenanceContract.churnMonthly * rng.range(0.5, 1.5)));
    invoice(state, s.contracts * D.maintenanceContract.fee, FISCALITE.tva.renovation, 'chantiers', { dueIn: 10, defaultProb: 0.01, label: 'Contrats d’entretien', rng });
  }
}

function eventOp(state, e) {
  const s = state.sector;
  if (e.op === 'coldwave' && metier(state).id === 'plombier') {
    state.modifiers.push({ key: 'demand', mult: 1.4, add: 0, until: state.time.day + 10, label: 'Chaudières en panne', source: 'Vague de froid' });
  }
  if (e.op === 'bigJob') {
    s.seq += 1;
    const price = Math.round(e.days * D.hoursPerDay * s.rate * (e.valueMult || 1) + e.days * 30_000);
    s.jobs.push({ id: s.seq, type: 'gros', label: 'Gros chantier (promoteur)', price, vat: FISCALITE.tva.rates.normal, daysTotal: e.days, daysDone: 0, materials: e.days * 22_000, matPaid: false, payNow: false, urgent: false, payDelay: e.payDelay || 60 });
  }
}

function kpis(state) {
  const s = state.sector;
  const rate = s.stats.quotes ? s.stats.won / Math.max(1, s.stats.won + s.stats.lost) : 0;
  return [
    { label: 'Taux horaire', value: s.rate, fmt: 'eur', suffix: '/h' },
    { label: 'Équipe (j-homme/jour)', value: workforce(state), fmt: 'num1' },
    { label: 'Carnet (jours-homme)', value: backlogDays(state), fmt: 'num1' },
    { label: 'Devis acceptés', value: rate, fmt: 'pct' },
    { label: 'Chantiers réalisés', value: s.stats.jobsDone, fmt: 'int' },
    { label: 'Contrats d’entretien', value: s.contracts, fmt: 'int' },
  ];
}

function sceneInfo(state) {
  return { activity: state.company.capacityUse || 0, customers: Math.min(4, state.sector.quotes.length), vans: vans(state), jobs: state.sector.jobs.length };
}

const actions = {
  setRate(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.rate = clamp(v, D.minRate, D.maxRate);
    return { ok: true };
  },
  setMargin(state, a) {
    const v = Number(a.value) / 100;
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.margin = clamp(v, 0, 0.6);
    return { ok: true };
  },
  setPolicy(state, a) {
    if (!['capacite', 'tout'].includes(a.value)) return { ok: false, message: 'Politique inconnue.' };
    state.sector.policy = a.value;
    return { ok: true };
  },
};
return __exports;
})();

// ---- src/engine/sectors/soutien.js ----
__m["src/engine/sectors/soutien.js"] = (function () {
const __exports = {};
__def(__exports, { "mainRole": () => mainRole, "init": () => init, "refPrice": () => refPrice, "priceIndex": () => priceIndex, "marketValue": () => marketValue, "capacity": () => capacity, "expectedSuccess": () => expectedSuccess, "quality": () => quality, "enrollmentRate": () => enrollmentRate, "daily": () => daily, "monthEnd": () => monthEnd, "eventOp": () => eventOp, "kpis": () => kpis, "sceneInfo": () => sceneInfo, "actions": () => actions });
// Secteur soutien scolaire : inscriptions saisonnières, abonnements mensuels,
// capacité (profs × groupes × taille), sessions d'examens qui font la réputation.

const { SOUTIEN: D } = __m["src/data/sectors/soutien.js"];
const { dateOf, DAYS_PER_MONTH } = __m["src/engine/calendar.js"];
const { earn, spend } = __m["src/engine/ledger.js"];
const { upgradeEffect } = __m["src/engine/upgrades.js"];
const { modMult } = __m["src/engine/modifiers.js"];
const { productivity, countRole } = __m["src/engine/systems/staff.js"];
const { rateCustomer, changeReputation } = __m["src/engine/systems/company.js"];
const { htFromTtc, diffOf, playerMarket, baseWhy, prodMod } = __m["src/engine/sectors/common.js"];
const { log } = __m["src/engine/log.js"];
const { clamp } = __m["src/engine/money.js"];

const mainRole = 'enseignant';

function init(state) {
  state.sector = {
    price: D.refPrice,
    groupSize: D.groupSize.default,
    students: 8,
    discounted: 0, // élèves à tarif réduit (partenariat école)
    discountMult: 1,
    waitlist: 0,
    lastSuccess: null,
    results: [],
    stageStudents: 0,
    today: { joined: 0, capacity: 0 },
    month: { joined: 0, left: 0, turnedAway: 0 },
    stats: { maxStudents: 8, sessions: 0, bestSuccess: 0 },
  };
}

function refPrice() {
  return D.refPrice;
}

function priceIndex(state) {
  return state.sector.price / D.refPrice;
}

function marketMult(state) {
  return upgradeEffect(state, 'marketMult') || 1;
}

function marketValue(state) {
  return D.marketPool * 4 * marketMult(state) * diffOf(state).marketMult * htFromTtc(state, D.refPrice, D.vatRate);
}

/** Compétence moyenne des enseignants (fondateur inclus), pondérée par leurs groupes. */
function teachingSkill(state) {
  let w = 0;
  let sk = 0;
  if (state.staff.founder.active) {
    w += D.founderSlots;
    sk += state.staff.founder.skill * D.founderSlots;
  }
  for (const e of state.staff.employees) {
    const r = D.roles[e.role];
    if (r && r.teach) {
      const slots = r.slots * productivity(state, e);
      w += slots;
      sk += e.skill * slots;
    }
  }
  return w ? sk / w : 40;
}

/** Nombre d'élèves que l'équipe et les locaux peuvent accueillir. */
function capacity(state) {
  const s = state.sector;
  let slots = state.staff.founder.active ? D.founderSlots * (0.7 + 0.3 * state.staff.founder.energy / 100) : 0;
  for (const e of state.staff.employees) {
    const r = D.roles[e.role];
    if (r && r.teach) slots += r.slots * productivity(state, e);
  }
  slots *= upgradeEffect(state, 'slotsMult') * prodMod(state);
  const teach = Math.floor(slots * s.groupSize);
  const seats = Math.floor((D.baseSeats + upgradeEffect(state, 'seats')) * modMult(state, 'capacity'));
  return { teach, seats, total: Math.min(teach, seats) };
}

/** Taux de réussite attendu aux examens. */
function expectedSuccess(state) {
  const s = state.sector;
  const skill = teachingSkill(state);
  const coord = countRole(state, 'coordinateur') > 0 ? D.roles.coordinateur.success : 0;
  const group = (D.groupSize.default - s.groupSize) * 0.018;
  return clamp(0.52 + 0.36 * ((skill - 50) / 50) + group + coord + upgradeEffect(state, 'success'), 0.25, 0.97);
}

function quality(state) {
  return clamp((0.6 + expectedSuccess(state) * 0.55) * modMult(state, 'quality'), 0.3, 2);
}

function examBoost(state, month) {
  return month === 11 || month === 4 ? 1 + upgradeEffect(state, 'examBoost') : 1;
}

function enrollmentRate(state) {
  const d = dateOf(state.time.day);
  const extra = 1 + upgradeEffect(state, 'attraction') + (upgradeEffect(state, 'resultsVisible') && state.sector.lastSuccess > 0.8 ? 0.1 : 0);
  const m = playerMarket(state, D, state.sector.price, D.refPrice, extra);
  const season = D.seasonality[d.month] * examBoost(state, d.month);
  const perDay = (D.marketPool * marketMult(state) * diffOf(state).marketMult * season * m.eco * m.ev * m.share * modMult(state, 'enrollment')) / DAYS_PER_MONTH;
  return { perDay, m, season, location: marketMult(state) };
}

function daily(state, rng) {
  const s = state.sector;
  state.company.quality = quality(state);
  const er = enrollmentRate(state);
  const cap = capacity(state);
  const arrivals = rng.poisson(er.perDay);
  const room = Math.max(0, cap.total - s.students);
  const joined = Math.min(arrivals, room);
  s.students += joined;
  s.month.joined += joined;
  s.month.turnedAway += arrivals - joined;
  s.stats.maxStudents = Math.max(s.stats.maxStudents, s.students);
  s.today = { joined, capacity: cap.total, arrivals };
  // Satisfaction des familles : rapport qualité/prix et taille des groupes
  const score = 48 + 60 * (expectedSuccess(state) - 0.65) + 25 * (D.refPrice / s.price - 1) + 2 * (D.groupSize.default - s.groupSize);
  rateCustomer(state, clamp(score, 0, 100), 0.01);
  if (arrivals > joined) rateCustomer(state, 35, 0.01);
  // Fournitures
  spend(state, Math.round((s.students * D.materialPerStudent) / DAYS_PER_MONTH), 0.21, 'materiel');
  state.company.capacityUse = cap.total > 0 ? s.students / cap.total : 1;
  state.staff.lastWorkload = cap.teach > 0 ? s.students / cap.teach : 0;
  state.company.demandPerDay = er.perDay;
  state.company.why = [
    ...baseWhy(er.m, `Abonnement ${(s.price / 100).toFixed(0)} €/mois (marché 175 €).`),
    { label: 'Calendrier scolaire', value: er.season, hint: 'Rentrée et avant-examens : affluence. Été : désert.' },
    { label: 'Implantations', value: er.location, hint: 'Antenne, cours hybrides.' },
  ];
  state.company.bottleneck = arrivals > joined ? (cap.teach < cap.seats ? 'personnel' : 'places') : er.m.share < 0.12 ? 'demande' : null;
}

function monthEnd(state, rng) {
  const s = state.sector;
  const d = dateOf(state.time.day);
  // Facturation des abonnements (prélevés en début de mois suivant → encaissés ici)
  const full = Math.max(0, s.students - s.discounted);
  const ttc = full * s.price + s.discounted * Math.round(s.price * s.discountMult);
  if (ttc > 0) earn(state, htFromTtc(state, ttc, D.vatRate), D.vatRate, 'abonnements');
  // Stages d'été
  if (upgradeEffect(state, 'stages') > 0 && D.stage.month.includes(d.month)) {
    const m = playerMarket(state, D, s.price, D.refPrice, 1);
    const n = Math.min(capacity(state).total, rng.poisson(D.stage.pool * m.share * marketMult(state) * diffOf(state).marketMult * 2));
    if (n > 0) {
      earn(state, htFromTtc(state, n * D.stage.price, D.vatRate), D.vatRate, 'stages');
      s.stageStudents += n;
      log(state, 'good', `Stages d'été : ${n} participants.`);
    }
  }
  // Sessions d'examens → résultats → réputation
  if (D.examMonths.includes(d.month) && s.students > 0) {
    const success = clamp(expectedSuccess(state) + rng.normal(0, 0.04), 0.2, 0.99);
    s.lastSuccess = success;
    s.results.push({ day: state.time.day, success, students: s.students });
    if (s.results.length > 30) s.results.shift();
    s.stats.sessions++;
    s.stats.bestSuccess = Math.max(s.stats.bestSuccess, success);
    const delta = (success - 0.72) * 45;
    changeReputation(state, delta);
    rateCustomer(state, clamp(success * 100, 0, 100), 0.3);
    log(state, delta >= 0 ? 'good' : 'bad', `Session d'examens : ${Math.round(success * 100)} % de réussite (réputation ${delta >= 0 ? '+' : ''}${delta.toFixed(1).replace('.', ',')}).`, true);
  }
  // Désinscriptions
  const coord = countRole(state, 'coordinateur') > 0 ? 0.8 : 1;
  let churn = D.churnMonthly * upgradeEffect(state, 'churnMult') * coord;
  if (s.lastSuccess != null && s.lastSuccess < 0.6) churn *= 1.5;
  if (d.month === 5) churn = D.yearEndChurn; // fin de l'année scolaire
  const left = Math.min(s.students, Math.round(s.students * churn + rng.normal(0, 0.5)));
  s.students -= Math.max(0, left);
  s.discounted = Math.min(s.discounted, s.students);
  s.month = { joined: 0, left: 0, turnedAway: 0 };
}

function eventOp(state, e) {
  const s = state.sector;
  if (e.op === 'addStudents') {
    const room = Math.max(0, capacity(state).total - s.students);
    const n = Math.min(e.n, room);
    s.students += n;
    s.discounted += n;
    s.discountMult = e.priceMult;
    if (n < e.n) log(state, 'info', `Faute de place, seuls ${n} élèves du partenariat ont pu être accueillis.`);
  }
}

function kpis(state) {
  const s = state.sector;
  const cap = capacity(state);
  return [
    { label: 'Abonnement TTC', value: s.price, fmt: 'eur', suffix: '/mois' },
    { label: 'Élèves inscrits', value: s.students, fmt: 'int' },
    { label: 'Capacité', value: cap.total, fmt: 'int' },
    { label: 'Taille des groupes', value: s.groupSize, fmt: 'int' },
    { label: 'Réussite attendue', value: expectedSuccess(state), fmt: 'pct' },
    { label: 'Dernière session', value: s.lastSuccess ?? NaN, fmt: 'pct' },
  ];
}

function sceneInfo(state) {
  const s = state.sector;
  return { activity: Math.min(1, s.students / Math.max(1, capacity(state).total)), customers: Math.min(4, s.today.joined * 2 + 1), students: s.students };
}

const actions = {
  setPrice(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.price = clamp(v, D.minPrice, D.maxPrice);
    return { ok: true };
  },
  setGroupSize(state, a) {
    const v = Math.round(Number(a.value));
    if (!Number.isFinite(v)) return { ok: false, message: 'Valeur invalide.' };
    state.sector.groupSize = clamp(v, D.groupSize.min, D.groupSize.max);
    return { ok: true };
  },
};
return __exports;
})();

// ---- src/engine/sectors/index.js ----
__m["src/engine/sectors/index.js"] = (function () {
const __exports = {};
__def(__exports, { "SECTOR_MODULES": () => SECTOR_MODULES, "sectorModule": () => sectorModule });
// Registre de la LOGIQUE des secteurs (modules avec init/daily/monthEnd/actions…).

const agence = __m["src/engine/sectors/agence.js"];
const restaurant = __m["src/engine/sectors/restaurant.js"];
const ecommerce = __m["src/engine/sectors/ecommerce.js"];
const artisan = __m["src/engine/sectors/artisan.js"];
const soutien = __m["src/engine/sectors/soutien.js"];

const SECTOR_MODULES = { agence, restaurant, ecommerce, artisan, soutien };

function sectorModule(state) {
  const m = SECTOR_MODULES[state.meta.sector];
  if (!m) throw new Error(`Secteur inconnu : ${state.meta.sector}`);
  return m;
}
return __exports;
})();

// ---- src/engine/systems/competitors.js ----
__m["src/engine/systems/competitors.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "playerPriceIndex": () => playerPriceIndex, "updateAttraction": () => updateAttraction, "daily": () => daily, "monthEnd": () => monthEnd, "spawnCompetitor": () => spawnCompetitor });
// Concurrents IA : stratégies, ajustements mensuels, promos, faillites, nouveaux entrants.

const { STRATEGIES, COMPETITOR_PARAMS: P } = __m["src/data/competitors.js"];
const { COMPETITOR_NAMES } = __m["src/data/people.js"];
const { DIFFICULTIES } = __m["src/data/difficulty.js"];
const { sectorData } = __m["src/engine/sectors/registry.js"];
const { sectorModule } = __m["src/engine/sectors/index.js"];
const { attractiveness } = __m["src/engine/demand.js"];
const { ECONOMY } = __m["src/data/economy.js"];
const { clamp } = __m["src/engine/money.js"];
const { log } = __m["src/engine/log.js"];

function aggression(state) {
  return DIFFICULTIES[state.meta.difficulty].competitorAggression;
}

function marketValue(state) {
  const m = sectorModule(state);
  return m.marketValue ? m.marketValue(state) : 3_000_000;
}

function makeCompetitor(state, rng, strategyId, used) {
  const names = COMPETITOR_NAMES[state.meta.sector] || COMPETITOR_NAMES.agence;
  const free = names.filter((n) => !used.includes(n));
  const st = STRATEGIES[strategyId];
  state.compSeq = (state.compSeq || 0) + 1;
  return {
    id: state.compSeq,
    name: rng.pick(free.length ? free : names),
    strategy: strategyId,
    priceIdx: st.priceIdx * rng.range(0.95, 1.05),
    quality: st.quality * rng.range(0.92, 1.08),
    reputation: clamp(st.rep + rng.range(-8, 8), 10, 90),
    mkt: st.mkt * rng.range(0.8, 1.2),
    cash: Math.round(marketValue(state) * 0.3 * P.startCashMonths),
    alive: true,
    attraction: 1,
    share: 0,
    promoUntil: -1,
    born: state.time.day,
  };
}

function init(state, opts, diff, rng) {
  const [lo, hi] = diff.competitorCount;
  const n = rng.int(lo, hi);
  const ids = Object.keys(STRATEGIES);
  // stratégies distinctes autant que possible
  const order = [...ids].sort(() => rng.next() - 0.5);
  state.competitors = [];
  for (let i = 0; i < n; i++) {
    state.competitors.push(makeCompetitor(state, rng, order[i % order.length], state.competitors.map((c) => c.name)));
  }
  state.compRespawnDay = null;
  updateAttraction(state);
}

/** Prix « relatif » du joueur (1 = prix de référence du marché). */
function playerPriceIndex(state) {
  const m = sectorModule(state);
  return m.priceIndex ? m.priceIndex(state) : 1;
}

function updateAttraction(state) {
  const sd = sectorData(state);
  const day = state.time.day;
  for (const c of state.competitors) {
    if (!c.alive) {
      c.attraction = 0;
      continue;
    }
    const promo = c.promoUntil > day ? P.promoDiscount : 1;
    c.attraction = attractiveness({
      price: c.priceIdx * promo,
      refPrice: 1,
      elasticity: sd.elasticity,
      quality: c.quality,
      reputation: c.reputation,
      marketing: c.mkt,
      marketingRef: 1,
    }).value;
  }
  // parts de marché observables (joueur inclus)
  const pa = state.company.attraction || 0;
  const total = pa + state.competitors.reduce((s, c) => s + c.attraction, 0) + ECONOMY.outsideOption;
  for (const c of state.competitors) c.share = total > 0 ? c.attraction / total : 0;
}

function daily(state) {
  // Fin de promo → recalcul
  const day = state.time.day;
  if (state.competitors.some((c) => c.promoUntil === day)) updateAttraction(state);
}

function monthEnd(state, rng) {
  const a = aggression(state);
  const pShare = state.company.share || 0;
  const pIdx = playerPriceIndex(state);
  const mv = marketValue(state);
  for (const c of state.competitors) {
    if (!c.alive) continue;
    const st = STRATEGIES[c.strategy];
    // Ajustements selon la stratégie
    if (c.strategy === 'lowcost') {
      const target = pShare > c.share ? st.priceIdx - 0.06 * a : st.priceIdx;
      c.priceIdx += (target - c.priceIdx) * 0.25;
      c.priceIdx = clamp(c.priceIdx, 0.62, 1);
    } else if (c.strategy === 'premium') {
      c.quality = Math.min(1.5, c.quality + 0.004 * a);
      c.priceIdx += (st.priceIdx - c.priceIdx) * 0.2;
    } else if (c.strategy === 'marketing') {
      c.mkt += (st.mkt * a * (pShare > 0.3 ? 1.4 : 1) - c.mkt) * 0.3;
    } else if (c.strategy === 'suiveur') {
      c.priceIdx += (pIdx * 0.97 - c.priceIdx) * 0.3;
      c.quality += ((state.company.quality || 1) * 0.97 - c.quality) * 0.15;
    }
    // Réactions générales à un joueur dominant
    if (pShare > 0.4 && rng.chance(0.12 * a)) {
      c.mkt *= 1.15;
      c.quality = Math.min(1.5, c.quality + 0.03);
    }
    // Promotions
    if (c.promoUntil < state.time.day && rng.chance(st.promoChance * a)) {
      c.promoUntil = state.time.day + P.promoDays;
      log(state, 'market', `${c.name} lance une promotion agressive (−${Math.round((1 - P.promoDiscount) * 100)} % pendant ${P.promoDays} jours).`);
    }
    // Réputation : suit la qualité
    c.reputation = clamp(c.reputation + (50 + (c.quality - 1) * 60 - c.reputation) * 0.05 + rng.normal(0, 1.2), 5, 95);
    // Résultat financier simulé
    const revenue = c.share * mv * c.priceIdx;
    const margin = st.margin + (c.priceIdx - st.priceIdx) * 0.6;
    const fixed = mv * 0.03 + c.mkt * sectorData(state).marketingRef;
    c.cash += Math.round(revenue * margin - fixed + rng.normal(0, mv * 0.01));
    c.lastRevenue = Math.round(revenue);
    if (c.cash < mv * P.bankruptCashMonths * 0.3) {
      c.alive = false;
      c.deadDay = state.time.day;
      state.stats.competitorsBankrupt = (state.stats.competitorsBankrupt || 0) + 1;
      log(state, 'market', `${c.name} fait faillite ! Ses clients cherchent un nouveau fournisseur.`, true);
      if (state.compRespawnDay == null) state.compRespawnDay = state.time.day + rng.int(P.respawnDays[0], P.respawnDays[1]);
    }
  }
  // Nouvel entrant
  const alive = state.competitors.filter((c) => c.alive).length;
  const min = DIFFICULTIES[state.meta.difficulty].competitorCount[0];
  if (state.compRespawnDay != null && state.time.day >= state.compRespawnDay && alive < min + 1) {
    spawnCompetitor(state, rng);
    state.compRespawnDay = alive + 1 < min ? state.time.day + rng.int(P.respawnDays[0], P.respawnDays[1]) : null;
  }
  // Nettoyage des concurrents morts depuis longtemps
  state.competitors = state.competitors.filter((c) => c.alive || state.time.day - c.deadDay < 360);
  updateAttraction(state);
}

function spawnCompetitor(state, rng, strategyId) {
  const id = strategyId || rng.pick(Object.keys(STRATEGIES));
  const c = makeCompetitor(state, rng, id, state.competitors.map((x) => x.name));
  state.competitors.push(c);
  log(state, 'market', `Nouveau concurrent : ${c.name} (${STRATEGIES[id].label.toLowerCase()}) s'installe sur ton marché.`, true);
  updateAttraction(state);
  return c;
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

// ---- src/data/events.js ----
__m["src/data/events.js"] = (function () {
const __exports = {};
__def(__exports, { "EVENT_PARAMS": () => EVENT_PARAMS, "EVENTS": () => EVENTS });
// =============================================================================
//  Événements aléatoires (82). Effets DÉCLARATIFS interprétés par
//  src/engine/events.js. Montants en centimes ; un montant peut être relatif :
//  { of: 'revenue'|'cash'|'payroll', f: facteur, min, max }.
//
//  Champs : id, title, text, kind ('good'|'bad'|'neutral'), weight, cooldown
//  (jours), sectors, legal, minDay, once, when(state), target ('employee',
//  'keyEmployee', 'competitor'), choices [{label, effects}] OU effects,
//  botChoice (choix « raisonnable » utilisé par les bots), chainOnly.
//
//  Types d'effets : cash, personal, rep, sat, mod {key, mult, days}, motivation,
//  loseEmployee, employeeSkill, employeeRaise, employeeAbsent, salaryIndex,
//  candidate, fixedCost, chain {id, days}, flag, flagUntil, economyTrend,
//  baseRate, competitorPromo, competitorBankrupt, newCompetitor, investorOffer,
//  founderEnergy, stat, sector {op…}, chance {p, success, fail}, log.
// =============================================================================

const EVENT_PARAMS = {
  dailyChance: 0.05, // probabilité quotidienne de base (× fréquence de la difficulté)
  minGapDays: 7, // délai minimal entre deux événements aléatoires
  firstEventDay: 25, // pas d'événement aléatoire le premier mois
  defaultCooldown: 360,
};

const REV = (f, min, max) => ({ of: 'revenue', f, min, max });
const cash = (amount, cat) => ({ t: 'cash', amount, cat });
const rep = (v) => ({ t: 'rep', v });
const mod = (key, mult, days, label) => ({ t: 'mod', key, mult, days, label });
const chance = (p, success, fail, successText, failText) => ({ t: 'chance', p, success, fail, successText, failText });

const hasEmployees = (s) => s.staff.employees.length > 0;

const EVENTS = [
  // ===========================================================================
  //  COMMUNS
  // ===========================================================================
  {
    id: 'bouche_a_oreille', kind: 'good', weight: 3, cooldown: 120,
    title: 'Bon bouche-à-oreille',
    text: 'Des clients satisfaits parlent de toi autour d’eux. Les demandes affluent.',
    when: (s) => s.company.satisfaction > 62,
    effects: [rep(3), mod('demand', 1.15, 30, 'Bouche-à-oreille')],
  },
  {
    id: 'avis_negatif', kind: 'bad', weight: 2, cooldown: 200,
    title: 'Avis négatif viral',
    text: 'Un client mécontent publie un avis cinglant qui fait le tour des réseaux sociaux locaux.',
    botChoice: 1,
    choices: [
      { label: 'Ignorer, ça passera', effects: [rep(-6), mod('demand', 0.85, 30, 'Avis viral')] },
      { label: 'Répondre publiquement et offrir un geste commercial', effects: [cash(-25_000, 'evenements'), rep(-2), mod('demand', 0.95, 15, 'Avis viral')] },
      { label: 'Menacer de porter plainte', effects: [chance(0.3, [rep(1)], [rep(-10), mod('demand', 0.8, 45, 'Effet Streisand')], 'L’auteur retire son avis.', 'Effet Streisand : l’affaire prend de l’ampleur !')] },
    ],
  },
  {
    id: 'panne_informatique', kind: 'bad', weight: 2, cooldown: 240,
    title: 'Panne informatique',
    text: 'Ton ordinateur principal rend l’âme en plein rush.',
    botChoice: 0,
    choices: [
      { label: 'Racheter tout de suite du matériel (1 200 €)', effects: [cash(-120_000, 'materiel'), mod('productivity', 0.95, 3, 'Panne informatique')] },
      { label: 'Bricoler avec un vieux PC', effects: [mod('productivity', 0.75, 20, 'Vieux PC')] },
    ],
  },
  {
    id: 'hausse_energie', kind: 'bad', weight: 1.5, cooldown: 360,
    title: 'Flambée des prix de l’énergie',
    text: 'Les prix du gaz et de l’électricité s’envolent sur les marchés européens.',
    effects: [mod('energy', 1.6, 120, 'Prix de l’énergie')],
  },
  {
    id: 'greve_nationale', kind: 'bad', weight: 1.5, cooldown: 180,
    title: 'Grève nationale',
    text: 'Les syndicats bloquent le pays une journée : transports à l’arrêt, clients absents.',
    effects: [mod('demand', 0.6, 2, 'Grève nationale'), mod('productivity', 0.7, 2, 'Grève nationale')],
  },
  {
    id: 'controle_fiscal', kind: 'bad', weight: 1, cooldown: 720, minDay: 400,
    title: 'Contrôle fiscal',
    text: 'Le SPF Finances t’annonce un contrôle de tes comptes des deux dernières années.',
    botChoice: 1,
    choices: [
      {
        label: 'Coopérer avec ton comptable habituel',
        effects: [chance(0.6, [{ t: 'stat', key: 'taxAuditsSurvived' }], [cash(REV(0.25, 80_000, 2_500_000), 'amendes'), rep(-2)], 'Contrôle sans redressement : tes comptes sont propres.', 'Redressement fiscal : quelques dépenses rejetées et une amende.')],
      },
      {
        label: 'Engager un fiscaliste spécialisé (1 800 €)',
        effects: [cash(-180_000, 'comptable'), chance(0.88, [{ t: 'stat', key: 'taxAuditsSurvived' }], [cash(REV(0.12, 50_000, 1_200_000), 'amendes')], 'Ton fiscaliste défend parfaitement le dossier.', 'Malgré le fiscaliste, un petit redressement.')],
      },
    ],
  },
  {
    id: 'inspection_sociale', kind: 'bad', weight: 1, cooldown: 720, minDay: 200,
    title: 'Inspection sociale (ONSS)',
    text: 'Les inspecteurs sociaux vérifient tes contrats, horaires et déclarations Dimona.',
    when: hasEmployees,
    effects: [chance(0.7, [{ t: 'stat', key: 'socialAuditsSurvived' }], [cash({ of: 'payroll', f: 0.4, min: 60_000, max: 1_500_000 }, 'amendes')], 'Inspection sociale : tout est en ordre.', 'Inspection sociale : irrégularités dans les horaires, amende administrative.')],
  },
  {
    id: 'subvention_regionale', kind: 'good', weight: 1.2, cooldown: 540, minDay: 120,
    title: 'Aide régionale à l’investissement',
    text: 'La Région propose une prime aux PME qui investissent. Le dossier est long à monter.',
    botChoice: 0,
    choices: [
      { label: 'Monter le dossier (10 jours de ton temps)', effects: [{ t: 'founderEnergy', v: -10 }, mod('productivity', 0.9, 10, 'Dossier de subvention'), { t: 'chain', id: 'subvention_versee', days: 75, hint: 'Réponse dans ≈ 2,5 mois (75 % de chances).' }] },
      { label: 'Laisser tomber', effects: [] },
    ],
  },
  {
    id: 'subvention_versee', kind: 'good', chainOnly: true,
    title: 'Réponse de la Région',
    text: 'L’administration régionale a examiné ton dossier.',
    effects: [chance(0.75, [cash({ of: 'revenue', f: 0.5, min: 200_000, max: 1_500_000 }, 'subvention')], [], 'Prime accordée et versée sur ton compte !', 'Dossier refusé : critères non remplis.')],
  },
  {
    id: 'crise_economique', kind: 'bad', weight: 0.6, cooldown: 1800, minDay: 360,
    title: 'Crise économique',
    text: 'Récession en Europe : les ménages et les entreprises serrent la ceinture.',
    effects: [{ t: 'economyTrend', v: -0.004 }, mod('demand', 0.85, 240, 'Récession'), { t: 'flag', key: 'crisis' }, { t: 'chain', id: 'reprise_economique', days: 300 }],
  },
  {
    id: 'reprise_economique', kind: 'good', weight: 0.5, cooldown: 900,
    title: 'Reprise économique',
    text: 'La confiance revient, les carnets de commandes se remplissent.',
    when: (s) => s.world.economy < 1.02,
    effects: [{ t: 'economyTrend', v: 0.003 }, mod('demand', 1.08, 120, 'Reprise'), { t: 'stat', key: 'crisesSurvived' }],
  },
  {
    id: 'canicule', kind: 'neutral', weight: 1.2, cooldown: 300,
    title: 'Canicule',
    text: 'Plus de 35 °C pendant une semaine. Tout le monde tourne au ralenti.',
    when: (s) => [5, 6, 7].includes(Math.floor((s.time.day % 360) / 30)),
    effects: [mod('productivity', 0.85, 7, 'Canicule'), { t: 'sector', op: 'heatwave' }],
  },
  {
    id: 'vague_froid', kind: 'neutral', weight: 1.2, cooldown: 300,
    title: 'Vague de froid',
    text: 'Gel intense et neige : les routes sont glissantes, les chaudières lâchent.',
    when: (s) => [0, 1, 11].includes(Math.floor((s.time.day % 360) / 30)),
    effects: [mod('energy', 1.3, 20, 'Grand froid'), { t: 'sector', op: 'coldwave' }],
  },
  {
    id: 'inondation', kind: 'bad', weight: 0.5, cooldown: 1080,
    title: 'Inondation',
    text: 'Des pluies diluviennes inondent ton rez-de-chaussée.',
    botChoice: 0,
    choices: [
      { label: 'Faire appel à l’assurance (franchise 600 €)', effects: [cash(-60_000, 'evenements'), mod('capacity', 0.6, 10, 'Inondation'), mod('demand', 0.8, 10, 'Inondation')] },
      { label: 'Tout nettoyer toi-même', effects: [{ t: 'founderEnergy', v: -20 }, mod('capacity', 0.5, 20, 'Inondation'), cash(-20_000, 'evenements')] },
    ],
  },
  {
    id: 'cambriolage', kind: 'bad', weight: 0.8, cooldown: 720,
    title: 'Cambriolage',
    text: 'Des voleurs sont passés cette nuit : matériel et caisse envolés.',
    botChoice: 0,
    choices: [
      { label: 'Déclarer à l’assurance (franchise 400 €)', effects: [cash(-40_000, 'evenements'), mod('productivity', 0.9, 5, 'Cambriolage')] },
      { label: 'Installer en plus une alarme (1 500 €)', effects: [cash(-190_000, 'materiel'), { t: 'flag', key: 'alarm' }] },
    ],
  },
  {
    id: 'litige_client', kind: 'bad', weight: 1.2, cooldown: 300, minDay: 90,
    title: 'Litige avec un client',
    text: 'Un client conteste ta facture et menace d’aller au tribunal de l’entreprise.',
    botChoice: 0,
    choices: [
      { label: 'Négocier un rabais de 50 %', effects: [cash(REV(-0.08, -400_000, -20_000), 'evenements')] },
      { label: 'Aller au tribunal (avocat 1 500 €)', effects: [cash(-150_000, 'evenements'), chance(0.55, [cash(REV(0.15, 50_000, 800_000), 'autres_revenus')], [cash(REV(-0.1, -600_000, -30_000), 'amendes'), rep(-2)], 'Le tribunal te donne raison !', 'Tu perds le procès et paies les frais.')] },
    ],
  },
  {
    id: 'demission_cle', kind: 'bad', weight: 1.5, cooldown: 240, target: 'keyEmployee',
    title: '{employee} veut partir',
    text: '{employee}, ton élément le plus compétent, a reçu une offre d’un concurrent.',
    when: (s) => s.staff.employees.length >= 2,
    botChoice: 0,
    choices: [
      { label: 'Contre-offre : +15 % de salaire', effects: [{ t: 'employeeRaise', pct: 0.15 }] },
      { label: 'Le/la laisser partir', effects: [{ t: 'loseEmployee' }, { t: 'motivation', v: -4 }] },
    ],
  },
  {
    id: 'maladie_longue', kind: 'bad', weight: 1, cooldown: 300, target: 'employee',
    title: 'Maladie de longue durée',
    text: '{employee} est en incapacité de travail pour plusieurs semaines. Tu paies le salaire garanti du premier mois.',
    when: hasEmployees,
    effects: [{ t: 'employeeAbsent', days: 45 }],
  },
  {
    id: 'conflit_equipe', kind: 'bad', weight: 1.2, cooldown: 240,
    title: 'Conflit dans l’équipe',
    text: 'Deux collègues ne se parlent plus et l’ambiance se dégrade.',
    when: (s) => s.staff.employees.length >= 3,
    botChoice: 0,
    choices: [
      { label: 'Payer une médiation (900 €)', effects: [cash(-90_000, 'formation'), { t: 'motivation', v: 5 }] },
      { label: 'Laisser faire', effects: [{ t: 'motivation', v: -12 }, mod('productivity', 0.92, 30, 'Mauvaise ambiance')] },
    ],
  },
  {
    id: 'team_building', kind: 'good', weight: 1, cooldown: 300,
    title: 'Idée de team building',
    text: 'L’équipe propose une journée kayak sur la Lesse.',
    when: (s) => s.staff.employees.length >= 2,
    botChoice: 0,
    choices: [
      { label: 'Offrir la journée (100 € par personne)', effects: [cash({ of: 'payroll', f: -0.03, max: -20_000 }, 'formation'), { t: 'motivation', v: 12 }] },
      { label: 'Pas cette année', effects: [{ t: 'motivation', v: -3 }] },
    ],
  },
  {
    id: 'business_angel', kind: 'good', weight: 0.8, cooldown: 540, legal: 'srl', minDay: 360,
    title: 'Un investisseur s’intéresse à toi',
    text: 'Un business angel a repéré ta société et souhaite discuter d’une entrée au capital.',
    when: (s) => s.company.reputation > 45 && !s.offers.investor,
    effects: [{ t: 'investorOffer' }],
  },
  {
    id: 'credit_promo', kind: 'good', weight: 0.8, cooldown: 540,
    title: 'Offre de crédit avantageuse',
    text: 'Ta banque lance une campagne de crédits aux PME à taux réduit pendant un mois.',
    effects: [{ t: 'flagUntil', key: 'loanPromo', days: 30 }, { t: 'log', text: 'Taux de crédit −1 point pendant 30 jours (onglet Finances).' }],
  },
  {
    id: 'hausse_taux', kind: 'bad', weight: 0.8, cooldown: 360,
    title: 'La BCE relève ses taux',
    text: 'La Banque centrale européenne relève ses taux directeurs pour combattre l’inflation.',
    when: (s) => s.world.baseRate < 0.05,
    effects: [{ t: 'baseRate', v: 0.005 }],
  },
  {
    id: 'baisse_taux', kind: 'good', weight: 0.8, cooldown: 360,
    title: 'La BCE baisse ses taux',
    text: 'Pour relancer l’économie, la BCE abaisse ses taux directeurs.',
    when: (s) => s.world.baseRate > 0.01,
    effects: [{ t: 'baseRate', v: -0.005 }],
  },
  {
    id: 'indexation', kind: 'bad', weight: 1, cooldown: 330, minDay: 300,
    title: 'Indexation automatique des salaires',
    text: 'L’indice-santé a dépassé l’indice-pivot : les salaires sont indexés automatiquement (spécificité belge).',
    when: hasEmployees,
    effects: [{ t: 'salaryIndex', pct: 0.02 }],
  },
  {
    id: 'nouvelle_norme', kind: 'bad', weight: 1, cooldown: 540,
    title: 'Nouvelle réglementation',
    text: 'Une nouvelle norme européenne t’oblige à adapter tes process.',
    botChoice: 0,
    choices: [
      { label: 'Se mettre en conformité tout de suite (800 €)', effects: [cash(-80_000, 'autres')] },
      { label: 'Attendre et espérer ne pas être contrôlé', effects: [chance(0.6, [], [cash(-300_000, 'amendes')], 'Personne n’a rien vérifié.', 'Contrôle : amende pour non-conformité.')] },
    ],
  },
  {
    id: 'article_presse', kind: 'good', weight: 1.2, cooldown: 300,
    title: 'Article dans la presse locale',
    text: 'Un journaliste de la presse régionale consacre un portrait à ton entreprise.',
    when: (s) => s.company.reputation > 35,
    effects: [rep(5), mod('demand', 1.12, 45, 'Article de presse')],
  },
  {
    id: 'salon_pro', kind: 'neutral', weight: 1, cooldown: 360,
    title: 'Salon professionnel',
    text: 'On te propose un stand au salon des entrepreneurs à Brussels Expo.',
    botChoice: 0,
    choices: [
      { label: 'Prendre un stand (2 000 €)', effects: [cash(-200_000, 'marketing'), chance(0.65, [mod('demand', 1.25, 60, 'Contacts du salon'), rep(2)], [rep(1)], 'Le salon est un succès : beaucoup de contacts !', 'Salon décevant : peu de visiteurs.')] },
      { label: 'Juste visiter (gratuit)', effects: [mod('demand', 1.03, 30, 'Réseautage')] },
    ],
  },
  {
    id: 'stagiaire', kind: 'good', weight: 1, cooldown: 300,
    title: 'Demande de stage',
    text: 'Un étudiant de haute école cherche un stage non rémunéré de quelques mois.',
    effects: [{ t: 'candidate', skill: 30, salaryMult: 0, trait: 'ambitieux' }, { t: 'log', text: 'Un stagiaire est disponible dans l’onglet Équipe (coût : charges uniquement).' }],
  },
  {
    id: 'fournisseur_faillite', kind: 'bad', weight: 1, cooldown: 540,
    title: 'Faillite d’un fournisseur',
    text: 'Ton fournisseur principal ferme : il faut en trouver un autre, plus cher.',
    effects: [mod('unitCost', 1.15, 90, 'Nouveau fournisseur'), mod('materialCost', 1.15, 90, 'Nouveau fournisseur')],
  },
  {
    id: 'erreur_comptable', kind: 'bad', weight: 0.8, cooldown: 720,
    title: 'Erreur de ton comptable',
    text: 'Ton comptable a oublié une déclaration : amende administrative.',
    botChoice: 0,
    choices: [
      { label: 'Payer et changer de comptable (plus cher, plus rigoureux)', effects: [cash(-50_000, 'amendes'), { t: 'flag', key: 'comptaRigueur' }, { t: 'fixedCost', amount: 3_000 }] },
      { label: 'Payer et lui laisser une chance', effects: [cash(-50_000, 'amendes')] },
    ],
  },
  {
    id: 'remboursement_impot', kind: 'good', weight: 0.6, cooldown: 720,
    title: 'Bonne nouvelle du fisc',
    text: 'Une erreur en ta faveur est corrigée : le SPF Finances te rembourse un trop-perçu.',
    effects: [{ t: 'personal', amount: 60_000 }],
  },
  {
    id: 'retard_paiement', kind: 'bad', weight: 1.2, cooldown: 200, minDay: 90,
    title: 'Gros client en retard de paiement',
    text: 'Ton plus gros client repousse son paiement de deux mois.',
    effects: [{ t: 'sector', op: 'delayReceivables', days: 60, hint: 'Factures en attente retardées de 60 jours' }],
  },
  {
    id: 'mauvais_payeur', kind: 'bad', weight: 1, cooldown: 300, minDay: 120,
    title: 'Client mauvais payeur',
    text: 'Une facture importante reste impayée malgré trois rappels.',
    botChoice: 0,
    choices: [
      { label: 'Confier à un huissier (250 €)', effects: [cash(-25_000, 'evenements'), { t: 'chain', id: 'recouvrement', days: 45, hint: 'Résultat dans 45 jours.' }] },
      { label: 'Abandonner la créance', effects: [cash(REV(-0.15, -800_000, -30_000), 'creances')] },
    ],
  },
  {
    id: 'recouvrement', kind: 'neutral', chainOnly: true,
    title: 'Recouvrement par huissier',
    text: 'L’huissier revient vers toi.',
    effects: [chance(0.65, [], [cash(REV(-0.15, -800_000, -30_000), 'creances')], 'L’huissier a récupéré la somme !', 'Le client est insolvable : créance perdue.')],
  },
  {
    id: 'cyberattaque', kind: 'bad', weight: 0.8, cooldown: 720, minDay: 180,
    title: 'Cyberattaque',
    text: 'Un rançongiciel chiffre tous tes fichiers et réclame 3 000 € en bitcoins.',
    botChoice: 1,
    choices: [
      { label: 'Payer la rançon', effects: [cash(-300_000, 'evenements'), chance(0.6, [], [mod('productivity', 0.6, 10, 'Données perdues')], 'Les fichiers sont déchiffrés.', 'Les pirates ne rendent pas tout…')] },
      { label: 'Restaurer les sauvegardes (prestataire 1 200 €)', effects: [cash(-120_000, 'evenements'), mod('productivity', 0.7, 7, 'Restauration')] },
    ],
  },
  {
    id: 'concurrent_promo', kind: 'bad', weight: 1.5, cooldown: 120, target: 'competitor',
    title: '{competitor} casse ses prix',
    text: '{competitor} lance une campagne de promotions massive pour te prendre des clients.',
    effects: [{ t: 'competitorPromo', days: 30 }],
  },
  {
    id: 'nouveau_concurrent', kind: 'bad', weight: 0.8, cooldown: 540, minDay: 300,
    title: 'Un nouveau concurrent arrive',
    text: 'Une enseigne bien financée ouvre près de chez toi.',
    when: (s) => s.competitors.filter((c) => c.alive).length < 5,
    effects: [{ t: 'newCompetitor' }],
  },
  {
    id: 'concurrent_rachat', kind: 'good', weight: 0.6, cooldown: 720, target: 'competitor', minDay: 360,
    title: '{competitor} jette l’éponge',
    text: 'Le patron de {competitor} part à la retraite et propose de te céder sa clientèle.',
    botChoice: 0,
    choices: [
      { label: 'Racheter la clientèle', effects: [cash(REV(-1.2, -6_000_000, -300_000), 'investissement'), { t: 'competitorBankrupt' }, rep(3), mod('demand', 1.2, 90, 'Clientèle rachetée')] },
      { label: 'Laisser ses clients se disperser', effects: [{ t: 'competitorBankrupt' }] },
    ],
  },
  {
    id: 'epuisement', kind: 'bad', weight: 1, cooldown: 360,
    title: 'Tu frôles le burn-out',
    text: 'Des semaines à 60 heures… ton corps dit stop.',
    when: (s) => s.staff.founder.active && (s.staff.lastWorkload > 1.1 || s.staff.founder.energy < 50),
    botChoice: 0,
    choices: [
      { label: 'Prendre deux semaines de vacances', effects: [mod('productivity', 0.7, 14, 'Vacances du patron'), { t: 'founderEnergy', v: 40 }] },
      { label: 'Serrer les dents', effects: [chance(0.5, [{ t: 'founderEnergy', v: -10 }], [{ t: 'founderEnergy', v: -40 }, mod('productivity', 0.5, 30, 'Burn-out')], 'Tu tiens le coup… pour l’instant.', 'Burn-out : arrêt forcé d’un mois.')] },
    ],
  },
  {
    id: 'prix_jeune_entreprise', kind: 'good', weight: 0.7, once: true, minDay: 360,
    title: 'Prix « Jeune entreprise de l’année »',
    text: 'Ta croissance attire l’attention : tu remportes un prix régional !',
    when: (s) => s.company.reputation > 55,
    effects: [rep(8), mod('demand', 1.15, 90, 'Prix régional'), cash(250_000, 'subvention'), { t: 'stat', key: 'awards' }],
  },
  {
    id: 'influenceur', kind: 'neutral', weight: 1, cooldown: 300,
    title: 'Proposition d’un influenceur',
    text: 'Un influenceur belge (120 000 abonnés) propose de parler de toi contre rémunération.',
    botChoice: 1,
    choices: [
      { label: 'Accepter (1 500 €)', effects: [cash(-150_000, 'marketing'), chance(0.55, [mod('demand', 1.4, 30, 'Buzz influenceur'), rep(3)], [rep(-2)], 'Le post cartonne !', 'Flop : son audience n’est pas ta cible, et certains crient au placement de produit.')] },
      { label: 'Refuser poliment', effects: [] },
    ],
  },
  {
    id: 'travaux_voirie', kind: 'bad', weight: 1, cooldown: 720,
    title: 'Travaux de voirie',
    text: 'La commune éventre la rue devant chez toi pour trois mois.',
    sectors: ['restaurant', 'soutien'],
    botChoice: 0,
    choices: [
      { label: 'Demander l’indemnité communale (dossier)', effects: [mod('demand', 0.7, 90, 'Rue en travaux'), { t: 'chain', id: 'indemnite_travaux', days: 60, hint: 'Indemnité possible dans 2 mois.' }] },
      { label: 'Faire de la pub « on reste ouverts » (600 €)', effects: [cash(-60_000, 'marketing'), mod('demand', 0.82, 90, 'Rue en travaux')] },
    ],
  },
  {
    id: 'indemnite_travaux', kind: 'good', chainOnly: true,
    title: 'Indemnité pour travaux',
    text: 'La commune répond à ta demande d’indemnisation.',
    effects: [chance(0.6, [cash(200_000, 'subvention')], [], 'Indemnité accordée.', 'Demande refusée.')],
  },
  {
    id: 'assurance_hausse', kind: 'bad', weight: 1, cooldown: 540,
    title: 'Hausse des primes d’assurance',
    text: 'Ton assureur augmente ses tarifs après une année de sinistres records.',
    effects: [{ t: 'fixedCost', amount: 3_500 }],
  },
  {
    id: 'loyer_indexation', kind: 'bad', weight: 1, cooldown: 360, minDay: 360,
    title: 'Indexation du loyer',
    text: 'Ton propriétaire applique l’indexation annuelle du bail commercial.',
    when: (s) => s.upgrades.owned.length > 0,
    effects: [{ t: 'fixedCost', amount: 4_000 }],
  },
  {
    id: 'grippe', kind: 'bad', weight: 1.2, cooldown: 300,
    title: 'Épidémie de grippe',
    text: 'La grippe saisonnière décime ton équipe.',
    when: (s) => [0, 1, 10, 11].includes(Math.floor((s.time.day % 360) / 30)),
    effects: [mod('productivity', 0.75, 12, 'Grippe')],
  },
  {
    id: 'penurie_main_oeuvre', kind: 'bad', weight: 0.8, cooldown: 540,
    title: 'Pénurie de main-d’œuvre',
    text: 'Ton métier est en pénurie : les candidats se font rares et exigeants.',
    effects: [{ t: 'motivation', v: -4 }, { t: 'sector', op: 'clearCandidates', hint: 'Vivier de candidats vidé' }],
  },
  {
    id: 'coupure_courant', kind: 'bad', weight: 1, cooldown: 300,
    title: 'Coupure de courant',
    text: 'Une panne du réseau électrique paralyse ton quartier toute une journée.',
    effects: [mod('capacity', 0.3, 1, 'Coupure de courant'), mod('productivity', 0.3, 1, 'Coupure de courant')],
  },
  {
    id: 'mentor', kind: 'good', weight: 0.8, cooldown: 720,
    title: 'Un mentor te prend sous son aile',
    text: 'Une cheffe d’entreprise expérimentée te propose des conseils gratuits.',
    effects: [rep(2), { t: 'founderEnergy', v: 10 }, mod('productivity', 1.05, 90, 'Conseils du mentor')],
  },
  {
    id: 'sponsoring_club', kind: 'neutral', weight: 1, cooldown: 360,
    title: 'Le club de foot local cherche un sponsor',
    text: 'Le RFC du quartier te propose ton logo sur les maillots des jeunes.',
    botChoice: 1,
    choices: [
      { label: 'Sponsoriser (800 €)', effects: [cash(-80_000, 'marketing'), rep(3), mod('demand', 1.05, 120, 'Sponsoring local')] },
      { label: 'Décliner', effects: [] },
    ],
  },
  {
    id: 'reviseur', kind: 'neutral', weight: 0.6, cooldown: 720, legal: 'srl',
    title: 'Dépôt des comptes annuels',
    text: 'Rappel : les comptes de ta SRL doivent être déposés à la Banque nationale.',
    botChoice: 0,
    choices: [
      { label: 'Laisser le comptable s’en charger (300 €)', effects: [cash(-30_000, 'comptable')] },
      { label: 'Reporter à plus tard', effects: [chance(0.5, [], [cash(-120_000, 'amendes'), rep(-1)], 'Déposé de justesse dans les délais.', 'Dépôt tardif : amende de la BNB.')] },
    ],
  },
  {
    id: 'caution_personnelle', kind: 'neutral', weight: 0.6, cooldown: 900, legal: 'srl', minDay: 200,
    title: 'La banque exige une caution personnelle',
    text: 'Pour maintenir ta ligne de crédit, la banque veut que tu te portes caution personnellement.',
    when: (s) => s.loans.length > 0,
    botChoice: 1,
    choices: [
      { label: 'Signer la caution', effects: [{ t: 'log', text: 'Tu t’es porté caution : ta responsabilité limitée ne protège plus ce crédit.' }, { t: 'flag', key: 'personalGuarantee' }] },
      { label: 'Refuser : la banque réduit ton découvert', effects: [{ t: 'flagUntil', key: 'overdraftCut', days: 180 }] },
    ],
  },
  {
    id: 'lettre_caisse', kind: 'neutral', weight: 0.8, cooldown: 720, legal: 'independant', minDay: 300,
    title: 'Lettre de ta caisse d’assurances sociales',
    text: 'Ta caisse t’avertit : tes revenus réels semblent bien supérieurs à la base de tes cotisations provisoires.',
    when: (s) => s.tax.results.length > 0 && (s.tax.results[s.tax.results.length - 1].operating || 0) > 3_000_000,
    botChoice: 0,
    choices: [
      { label: 'Augmenter mes provisionnelles', effects: [{ t: 'sector', op: 'raiseSocialBase', hint: 'Base des provisionnelles = ton dernier bénéfice' }] },
      { label: 'Garder le minimum (et la régularisation plus tard)', effects: [] },
    ],
  },
  {
    id: 'plci', kind: 'neutral', weight: 0.6, cooldown: 1080, legal: 'independant', minDay: 360,
    title: 'Pension libre complémentaire (PLCI)',
    text: 'Ton assureur te propose une PLCI : versements déductibles fiscalement pour ta pension.',
    botChoice: 1,
    choices: [
      { label: 'Souscrire (1 500 €, déductible)', effects: [cash(-150_000, 'assurances'), { t: 'stat', key: 'pension', v: 150_000 }, { t: 'founderEnergy', v: 5 }] },
      { label: 'Plus tard', effects: [] },
    ],
  },
  {
    id: 'heritage', kind: 'good', weight: 0.25, once: true, minDay: 720,
    title: 'Petit héritage',
    text: 'Une grand-tante d’Ostende te lègue une somme (après droits de succession).',
    effects: [{ t: 'personal', amount: 1_200_000 }],
  },
  {
    id: 'panne_banque', kind: 'bad', weight: 0.7, cooldown: 540,
    title: 'Panne du terminal de paiement',
    text: 'Le réseau de paiement par carte est en panne pendant tout un week-end.',
    sectors: ['restaurant', 'ecommerce'],
    effects: [mod('demand', 0.75, 3, 'Paiements en panne')],
  },
  {
    id: 'opportunite_locaux', kind: 'good', weight: 0.6, cooldown: 900, minDay: 200,
    title: 'Bonne affaire immobilière',
    text: 'Un local voisin se libère : le propriétaire propose 3 mois de loyer offerts si tu t’agrandis.',
    effects: [{ t: 'sector', op: 'upgradeDiscount', pct: 0.25, days: 45, hint: '−25 % sur la prochaine amélioration de locaux (45 j)' }],
  },
  {
    id: 'don_asbl', kind: 'neutral', weight: 0.8, cooldown: 540,
    title: 'Appel aux dons',
    text: 'Une ASBL du quartier organise une collecte pour les familles en difficulté.',
    botChoice: 0,
    choices: [
      { label: 'Donner 300 €', effects: [cash(-30_000, 'autres'), rep(2), { t: 'motivation', v: 3 }] },
      { label: 'Ne rien donner', effects: [] },
    ],
  },
  {
    id: 'erreur_tarif', kind: 'bad', weight: 0.8, cooldown: 540,
    title: 'Erreur de facturation',
    text: 'Tu découvres que tu as sous-facturé plusieurs clients ces dernières semaines.',
    effects: [cash(REV(-0.05, -300_000, -10_000), 'evenements')],
  },

  // ===========================================================================
  //  AGENCE WEB
  // ===========================================================================
  {
    id: 'web_appel_offres', kind: 'good', weight: 1.2, cooldown: 240, sectors: ['agence'], minDay: 120,
    title: 'Appel d’offres d’une commune',
    text: 'La commune de Namur lance un marché public pour refaire son site et ses e-services.',
    botChoice: 0,
    choices: [
      { label: 'Répondre (dossier : 2 000 €, 40 % de chances)', effects: [cash(-200_000, 'marketing'), chance(0.4, [{ t: 'sector', op: 'bigProject', hours: 350, rateMult: 1.05 }, rep(4)], [], 'Marché remporté : 350 h de travail !', 'Marché attribué à un concurrent.')] },
      { label: 'Passer ton tour', effects: [] },
    ],
  },
  {
    id: 'web_scope_creep', kind: 'bad', weight: 1.5, cooldown: 120, sectors: ['agence'],
    title: 'Le client change tout',
    text: 'En plein projet, un client veut « juste quelques modifications »… qui doublent le travail.',
    when: (s) => s.sector.projects.some((p) => !p.internal),
    botChoice: 0,
    choices: [
      { label: 'Facturer un avenant', effects: [chance(0.6, [{ t: 'sector', op: 'scopeCreep', pct: 0.3, paid: true }], [{ t: 'sector', op: 'scopeCreep', pct: 0.1, paid: false }, rep(-2)], 'Le client accepte l’avenant.', 'Le client refuse et te fait une mauvaise pub.')] },
      { label: 'Absorber le travail en plus', effects: [{ t: 'sector', op: 'scopeCreep', pct: 0.3, paid: false }, rep(2)] },
    ],
  },
  {
    id: 'web_faille', kind: 'bad', weight: 1, cooldown: 360, sectors: ['agence'], minDay: 200,
    title: 'Faille de sécurité',
    text: 'Un site que tu as livré a été piraté. Le client est furieux.',
    botChoice: 0,
    choices: [
      { label: 'Corriger gratuitement en urgence', effects: [mod('productivity', 0.8, 7, 'Correctif en urgence'), rep(-1)] },
      { label: 'Facturer l’intervention', effects: [cash(80_000, 'projets'), rep(-6)] },
    ],
  },
  {
    id: 'web_ia', kind: 'neutral', weight: 0.7, once: true, sectors: ['agence'], minDay: 500,
    title: 'L’IA bouscule le marché',
    text: 'Les générateurs de sites par IA font baisser les prix du marché. Mais ils rendent aussi les développeurs plus rapides.',
    effects: [mod('refPrice', 0.92, 3600, 'Pression de l’IA'), mod('productivity', 1.06, 3600, 'Outils IA')],
  },
  {
    id: 'web_product_hunt', kind: 'good', weight: 1, cooldown: 360, sectors: ['agence'],
    title: 'Ton SaaS sur Product Hunt',
    text: 'Ton logiciel atteint le top du jour sur Product Hunt !',
    when: (s) => s.sector.saas && s.sector.saas.status === 'live',
    effects: [{ t: 'sector', op: 'saasBoost', n: 60, hint: '+60 abonnés' }, rep(3)],
  },
  {
    id: 'web_hebergeur', kind: 'bad', weight: 1, cooldown: 360, sectors: ['agence'],
    title: 'Panne de l’hébergeur',
    text: 'Ton hébergeur subit une panne de 36 heures : tous tes sites clients sont hors ligne.',
    when: (s) => s.sector.maint.contracts.length > 0 || s.sector.saas.status === 'live',
    effects: [rep(-3), mod('maintChurn', 3, 30, 'Clients échaudés'), mod('saasChurn', 2, 30, 'Clients échaudés')],
  },

  // ===========================================================================
  //  RESTAURANT / FRITERIE
  // ===========================================================================
  {
    id: 'resto_afsca', kind: 'bad', weight: 1.3, cooldown: 300, sectors: ['restaurant'], minDay: 60,
    title: 'Contrôle de l’AFSCA',
    text: 'Deux inspecteurs de l’AFSCA se présentent sans prévenir.',
    effects: [{ t: 'sector', op: 'afsca' }],
  },
  {
    id: 'resto_frigo', kind: 'bad', weight: 1.2, cooldown: 300, sectors: ['restaurant'],
    title: 'Panne du frigo',
    text: 'La chambre froide a lâché pendant la nuit.',
    botChoice: 0,
    choices: [
      { label: 'Tout jeter et réparer (900 €)', effects: [{ t: 'sector', op: 'stockLoss', pct: 1, hint: 'Tout le stock est perdu' }, cash(-90_000, 'materiel')] },
      { label: 'Garder ce qui « a l’air bon »', effects: [{ t: 'sector', op: 'stockLoss', pct: 0.4, hint: '40 % du stock perdu' }, chance(0.7, [], [{ t: 'chain', id: 'resto_intoxication', days: 3 }], 'Personne n’a été malade. Ouf.', 'Des clients se plaignent de maux de ventre…')] },
    ],
  },
  {
    id: 'resto_critique', kind: 'neutral', weight: 1, cooldown: 360, sectors: ['restaurant'], minDay: 120,
    title: 'Passage d’un critique',
    text: 'Un critique culinaire connu a mangé chez toi incognito.',
    effects: [
      {
        ...chance(0.5, [rep(8), mod('demand', 1.25, 60, 'Bonne critique')], [rep(-6), mod('demand', 0.88, 45, 'Mauvaise critique')], 'Critique élogieuse : « les meilleures frites de la région ».', 'Critique assassine dans la presse.'),
        pFn: (s) => Math.min(0.92, Math.max(0.1, (s.company.quality - 0.6) * 1.1)), // dépend de la qualité
      },
    ],
  },
  {
    id: 'resto_patates', kind: 'bad', weight: 1, cooldown: 540, sectors: ['restaurant'],
    title: 'Mauvaise récolte de pommes de terre',
    text: 'La sécheresse a ravagé les récoltes de Bintje : le prix des patates explose.',
    effects: [mod('unitCost', 1.3, 90, 'Prix des pommes de terre')],
  },
  {
    id: 'resto_diables', kind: 'good', weight: 1.2, cooldown: 180, sectors: ['restaurant'],
    title: 'Match des Diables Rouges',
    text: 'La Belgique joue ce soir : écran géant sur la place, foule affamée garantie !',
    effects: [mod('demand', 1.9, 2, 'Match des Diables Rouges'), { t: 'log', text: 'Astuce : vérifie ton stock, la demande va exploser.' }],
  },
  {
    id: 'resto_intoxication', kind: 'bad', weight: 0.6, cooldown: 720, sectors: ['restaurant'],
    title: 'Suspicion d’intoxication alimentaire',
    text: 'Plusieurs clients disent avoir été malades après un repas chez toi.',
    when: (s) => s.sector && s.sector.hygiene < 55,
    botChoice: 0,
    choices: [
      { label: 'Fermer 3 jours pour désinfecter (1 000 €)', effects: [cash(-100_000, 'materiel'), { t: 'sector', op: 'close', days: 3 }, { t: 'sector', op: 'hygiene', v: 30, hint: 'Hygiène +30' }, rep(-4)] },
      { label: 'Nier en bloc', effects: [chance(0.4, [rep(-2)], [rep(-15), cash(-400_000, 'amendes'), { t: 'sector', op: 'close', days: 7 }], 'L’affaire se tasse.', 'L’AFSCA confirme : amende et fermeture d’une semaine.')] },
    ],
  },
  {
    id: 'resto_livraison', kind: 'neutral', weight: 1, once: true, sectors: ['restaurant'], minDay: 90,
    title: 'Plateforme de livraison',
    text: 'Une plateforme de livraison te propose de rejoindre son appli (commission de 30 % sur ces commandes).',
    botChoice: 0,
    choices: [
      { label: 'Rejoindre la plateforme', effects: [{ t: 'flag', key: 'delivery' }, { t: 'log', text: 'Livraison activée : +demande, mais 30 % de commission sur ces ventes.' }] },
      { label: 'Rester indépendant', effects: [] },
    ],
  },

  // ===========================================================================
  //  E-COMMERCE
  // ===========================================================================
  {
    id: 'ecom_black_friday', kind: 'neutral', weight: 3, cooldown: 300, sectors: ['ecommerce'],
    title: 'Préparer le Black Friday',
    text: 'Le Black Friday approche. Tu fais quoi ?',
    when: (s) => Math.floor((s.time.day % 360) / 30) === 10 && (s.time.day % 30) < 15,
    botChoice: 0,
    choices: [
      { label: 'Grosse promo (−20 %) et budget pub doublé', effects: [mod('demand', 1.5, 10, 'Promo Black Friday'), mod('priceCut', 0.8, 10, 'Prix Black Friday'), cash(REV(-0.05, -500_000, -50_000), 'marketing')] },
      { label: 'Pas de promo, on garde nos marges', effects: [mod('demand', 0.9, 10, 'Clients partis chez les promos')] },
    ],
  },
  {
    id: 'ecom_greve_transport', kind: 'bad', weight: 1, cooldown: 300, sectors: ['ecommerce'],
    title: 'Grève des transporteurs',
    text: 'Les livreurs sont en grève : les colis s’entassent au dépôt.',
    effects: [mod('returns', 1.6, 20, 'Livraisons en retard'), rep(-3), mod('demand', 0.85, 20, 'Délais de livraison')],
  },
  {
    id: 'ecom_conteneur', kind: 'bad', weight: 1, cooldown: 360, sectors: ['ecommerce'],
    title: 'Conteneur bloqué',
    text: 'Ton conteneur est bloqué au port d’Anvers par un contrôle douanier.',
    effects: [{ t: 'sector', op: 'delayOrders', days: 20, hint: 'Commandes fournisseurs retardées de 20 jours' }],
  },
  {
    id: 'ecom_avis', kind: 'good', weight: 1.2, cooldown: 240, sectors: ['ecommerce'],
    title: 'Vague d’avis 5 étoiles',
    text: 'Tes clients laissent des avis élogieux sur Trustpilot.',
    when: (s) => s.company.satisfaction > 60,
    effects: [rep(4), mod('demand', 1.12, 45, 'Avis clients')],
  },
  {
    id: 'ecom_cpc', kind: 'bad', weight: 1, cooldown: 360, sectors: ['ecommerce'],
    title: 'Hausse des coûts publicitaires',
    text: 'Les enchères publicitaires flambent : chaque clic coûte plus cher.',
    effects: [mod('cpc', 1.35, 60, 'Enchères pub')],
  },
  {
    id: 'ecom_contrefacon', kind: 'bad', weight: 0.8, cooldown: 540, sectors: ['ecommerce'], minDay: 200,
    title: 'Contrefaçon sur une marketplace',
    text: 'Ton best-seller est copié et vendu moitié prix sur une grande marketplace.',
    botChoice: 0,
    choices: [
      { label: 'Mise en demeure par avocat (1 200 €)', effects: [cash(-120_000, 'evenements'), chance(0.6, [], [mod('demand', 0.85, 90, 'Contrefaçon')], 'La copie est retirée.', 'La copie reste en ligne.')] },
      { label: 'Ignorer', effects: [mod('demand', 0.8, 120, 'Contrefaçon')] },
    ],
  },
  {
    id: 'ecom_tiktok', kind: 'good', weight: 1, cooldown: 360, sectors: ['ecommerce'],
    title: 'Produit viral sur TikTok',
    text: 'Une vidéo montrant un de tes produits explose sur TikTok !',
    effects: [mod('demand', 1.8, 14, 'Viral sur TikTok'), rep(2), { t: 'log', text: 'Vérifie ton stock : la demande va exploser !' }],
  },

  // ===========================================================================
  //  ARTISANAT
  // ===========================================================================
  {
    id: 'art_camionnette', kind: 'bad', weight: 1.2, cooldown: 300, sectors: ['artisan'],
    title: 'Panne de la camionnette',
    text: 'Ta camionnette refuse de démarrer : boîte de vitesses HS.',
    botChoice: 0,
    choices: [
      { label: 'Réparer au garage (1 800 €)', effects: [cash(-180_000, 'materiel'), mod('capacity', 0.85, 4, 'Camionnette au garage')] },
      { label: 'Louer une camionnette en attendant (600 €)', effects: [cash(-60_000, 'deplacements'), mod('capacity', 0.7, 14, 'Camionnette de location')] },
    ],
  },
  {
    id: 'art_accident', kind: 'bad', weight: 0.7, cooldown: 540, sectors: ['artisan'], target: 'employee',
    title: 'Accident de chantier',
    text: '{employee} est tombé d’une échelle sur un chantier.',
    when: hasEmployees,
    effects: [{ t: 'employeeAbsent', days: 30 }, { t: 'motivation', v: -5 }, cash(-50_000, 'assurances')],
  },
  {
    id: 'art_primes', kind: 'good', weight: 1, cooldown: 540, sectors: ['artisan'],
    title: 'Primes régionales à la rénovation',
    text: 'La Région augmente ses primes à la rénovation énergétique : les particuliers se lancent.',
    effects: [mod('demand', 1.3, 120, 'Primes rénovation')],
  },
  {
    id: 'art_penurie', kind: 'bad', weight: 1, cooldown: 360, sectors: ['artisan'],
    title: 'Pénurie de matériaux',
    text: 'Le cuivre et les composants électroniques manquent : les prix grimpent.',
    effects: [mod('materialCost', 1.25, 90, 'Pénurie de matériaux')],
  },
  {
    id: 'art_promoteur', kind: 'good', weight: 1, cooldown: 300, sectors: ['artisan'], minDay: 150,
    title: 'Un promoteur te propose un gros chantier',
    text: 'Un promoteur immobilier cherche un sous-traitant pour 12 appartements neufs. Payeur réputé lent.',
    botChoice: 0,
    choices: [
      { label: 'Accepter le chantier', effects: [{ t: 'sector', op: 'bigJob', days: 40, valueMult: 1, payDelay: 75, hint: 'Gros chantier de 40 jours-homme, payé à 75 jours' }] },
      { label: 'Refuser (risque de dépendance)', effects: [] },
    ],
  },
  {
    id: 'art_malfacon', kind: 'bad', weight: 1, cooldown: 300, sectors: ['artisan'], minDay: 120,
    title: 'Réclamation pour malfaçon',
    text: 'Un client signale une fuite après ton intervention.',
    botChoice: 0,
    choices: [
      { label: 'Repasser gratuitement', effects: [mod('capacity', 0.92, 5, 'Retour sur chantier'), rep(1)] },
      { label: 'Contester', effects: [chance(0.4, [], [rep(-8), cash(-150_000, 'evenements')], 'Le client reconnaît une mauvaise utilisation.', 'L’expertise te donne tort : tu paies les dégâts.')] },
    ],
  },

  // ===========================================================================
  //  SOUTIEN SCOLAIRE
  // ===========================================================================
  {
    id: 'sco_record', kind: 'good', weight: 1, cooldown: 300, sectors: ['soutien'],
    title: 'Résultats record',
    text: 'Tes élèves cartonnent aux examens : les parents en parlent partout.',
    when: (s) => s.sector && s.sector.lastSuccess > 0.85,
    effects: [rep(6), mod('enrollment', 1.3, 60, 'Résultats record')],
  },
  {
    id: 'sco_reforme', kind: 'neutral', weight: 0.6, once: true, sectors: ['soutien'],
    title: 'Réforme du calendrier scolaire',
    text: 'La Fédération Wallonie-Bruxelles confirme son calendrier : rentrée fin août, deux semaines de congé à la Toussaint et au carnaval.',
    effects: [mod('enrollment', 1.1, 60, 'Stages de congés plus demandés')],
  },
  {
    id: 'sco_prof_star', kind: 'good', weight: 1, cooldown: 360, sectors: ['soutien'],
    title: 'Un prof star veut te rejoindre',
    text: 'Une professeure de maths réputée cherche un nouveau centre.',
    effects: [{ t: 'candidate', role: 'enseignant', skill: 92, salaryMult: 1.2, trait: 'perfectionniste' }, { t: 'log', text: 'Une candidate exceptionnelle t’attend dans l’onglet Équipe (20 jours).' }],
  },
  {
    id: 'sco_ecole', kind: 'good', weight: 1, cooldown: 540, sectors: ['soutien'], minDay: 150,
    title: 'Partenariat avec une école',
    text: 'Une école secondaire propose de t’envoyer ses élèves en difficulté, avec un tarif négocié.',
    botChoice: 0,
    choices: [
      { label: 'Accepter (+élèves, prix −15 %)', effects: [{ t: 'sector', op: 'addStudents', n: 15, priceMult: 0.85, hint: '+15 élèves à −15 %' }] },
      { label: 'Refuser', effects: [] },
    ],
  },
  {
    id: 'sco_plainte', kind: 'bad', weight: 1, cooldown: 300, sectors: ['soutien'],
    title: 'Plainte d’un parent',
    text: 'Un parent furieux accuse ton centre d’avoir mal préparé son enfant.',
    botChoice: 0,
    choices: [
      { label: 'Rembourser le trimestre', effects: [cash(-48_000, 'evenements'), rep(-1)] },
      { label: 'Défendre ton équipe', effects: [rep(-4), { t: 'motivation', v: 4 }] },
    ],
  },
  {
    id: 'sco_en_ligne', kind: 'bad', weight: 0.8, cooldown: 720, sectors: ['soutien'], minDay: 300,
    title: 'Cours en ligne gratuits',
    text: 'Une plateforme gratuite de cours en vidéo séduit beaucoup d’élèves.',
    effects: [mod('enrollment', 0.85, 180, 'Concurrence en ligne')],
  },
];
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
  if ((state.flags.overdraftCut || 0) > state.time.day) f.overdraftLimit = ECONOMY.overdraftStart;
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
  if ((state.flags.loanPromo || 0) > state.time.day) rate -= 0.01; // campagne promotionnelle de la banque
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

// ---- src/engine/events.js ----
__m["src/engine/events.js"] = (function () {
const __exports = {};
__def(__exports, { "eventById": () => eventById, "init": () => init, "resolveAmount": () => resolveAmount, "chanceOf": () => chanceOf, "applyEffects": () => applyEffects, "describeEffects": () => describeEffects, "trigger": () => trigger, "daily": () => daily, "decide": () => decide });
// Moteur d'événements aléatoires.
//
// Les événements sont des DONNÉES (src/data/events.js) avec des effets
// déclaratifs : l'interface peut afficher les conséquences de chaque choix
// avant de choisir (describeEffects), les bots peuvent décider, et tout reste
// sérialisable.
//
// Anti-répétition : pondération, cooldown propre à chaque événement, délai
// global entre deux événements, « once », chaînes programmées.

const { EVENTS, EVENT_PARAMS } = __m["src/data/events.js"];
const { DIFFICULTIES } = __m["src/data/difficulty.js"];
const { pay, receive, personalIn, personalOut } = __m["src/engine/ledger.js"];
const { addModifier } = __m["src/engine/modifiers.js"];
const { makeCandidate } = __m["src/engine/systems/staff.js"];
const { spawnCompetitor, updateAttraction } = __m["src/engine/systems/competitors.js"];
const { makeInvestorOffer } = __m["src/engine/systems/loans.js"];
const { sectorModule } = __m["src/engine/sectors/index.js"];
const { avgRevenue } = __m["src/engine/systems/finance.js"];
const { clamp } = __m["src/engine/money.js"];
const { log } = __m["src/engine/log.js"];

const BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));

function eventById(id) {
  return BY_ID[id];
}

function init(state) {
  state.events = { pending: [], scheduled: [], cooldowns: {}, lastDay: EVENT_PARAMS.firstEventDay - EVENT_PARAMS.minGapDays, history: [], uid: 0, counts: {} };
}

function severity(state) {
  return DIFFICULTIES[state.meta.difficulty].eventSeverity;
}

// --- Contexte (cible de l'événement) ------------------------------------------------

function pickContext(state, ev, rng) {
  const ctx = {};
  if (ev.target === 'employee' || ev.target === 'keyEmployee') {
    const list = [...state.staff.employees].filter((e) => e.role !== 'gerant' || ev.target === 'keyEmployee');
    if (!list.length) return null;
    const e = ev.target === 'keyEmployee' ? list.sort((a, b) => b.skill - a.skill)[0] : rng.pick(list);
    ctx.employeeId = e.id;
    ctx.employee = e.name;
  }
  if (ev.target === 'competitor') {
    const list = state.competitors.filter((c) => c.alive);
    if (!list.length) return null;
    const c = rng.pick(list);
    ctx.competitorId = c.id;
    ctx.competitor = c.name;
  }
  return ctx;
}

function fill(text, ctx) {
  return String(text).replace(/\{(\w+)\}/g, (_, k) => (ctx && ctx[k] != null ? ctx[k] : `{${k}}`));
}

// --- Montants ---------------------------------------------------------------------

/** Résout un montant déclaratif en centimes (avant sévérité). */
function resolveAmount(state, amt) {
  if (typeof amt === 'number') return amt;
  if (!amt) return 0;
  let base = 0;
  if (amt.of === 'revenue') base = Math.max(avgRevenue(state, 3), 300_000);
  else if (amt.of === 'payroll') base = state.staff.employees.reduce((s, e) => s + e.salary, 0);
  else if (amt.of === 'cash') base = Math.max(0, state.cash);
  let v = base * (amt.f || 0);
  if (amt.min != null) v = Math.max(v, amt.min);
  if (amt.max != null) v = Math.min(v, amt.max);
  return Math.round(v / 100) * 100;
}

function scaled(state, amount) {
  // Les pertes sont amplifiées par la difficulté, les gains atténués.
  const sev = severity(state);
  return amount < 0 ? Math.round(amount * sev) : Math.round(amount / Math.sqrt(sev));
}

function scaledMult(state, mult) {
  const sev = severity(state);
  if (mult < 1) return clamp(1 - (1 - mult) * sev, 0.05, 1);
  return 1 + (mult - 1) / Math.sqrt(sev);
}

// --- Effets -----------------------------------------------------------------------

/** Probabilité effective d'un effet « chance » (peut dépendre de l'état). */
function chanceOf(state, e, ctx) {
  let p = typeof e.p === 'number' ? e.p : 0.5;
  if (e.pFn) p = e.pFn(state, ctx);
  return clamp(p, 0, 1);
}

function applyEffects(state, effects, ctx, rng, src) {
  for (const e of effects || []) applyEffect(state, e, ctx, rng, src);
}

function applyEffect(state, e, ctx, rng, src) {
  switch (e.t) {
    case 'cash': {
      const v = scaled(state, resolveAmount(state, e.amount));
      if (v >= 0) receive(state, v, e.cat || 'autres_revenus', { taxable: e.taxable !== false });
      else pay(state, -v, e.cat || 'evenements');
      break;
    }
    case 'personal': {
      const v = scaled(state, resolveAmount(state, e.amount));
      if (v >= 0) personalIn(state, v, 'evenement');
      else personalOut(state, -v, 'evenement');
      break;
    }
    case 'rep':
      state.company.reputation = clamp(state.company.reputation + (e.v < 0 ? e.v * severity(state) : e.v), 0, 100);
      break;
    case 'sat':
      state.company.satisfaction = clamp(state.company.satisfaction + e.v, 0, 100);
      break;
    case 'mod':
      addModifier(state, { key: e.key, mult: e.mult != null ? scaledMult(state, e.mult) : 1, add: e.add || 0, days: e.days, label: e.label || src, source: src });
      break;
    case 'motivation':
      for (const emp of state.staff.employees) emp.motivation = clamp(emp.motivation + e.v, 0, 100);
      break;
    case 'loseEmployee': {
      const emp = state.staff.employees.find((x) => x.id === ctx.employeeId);
      if (emp) {
        state.staff.employees = state.staff.employees.filter((x) => x !== emp);
        state.stats.resignations = (state.stats.resignations || 0) + 1;
      }
      break;
    }
    case 'employeeSkill': {
      const emp = state.staff.employees.find((x) => x.id === ctx.employeeId);
      if (emp) emp.skill = clamp(emp.skill + e.v, 1, 100);
      break;
    }
    case 'employeeRaise': {
      const emp = state.staff.employees.find((x) => x.id === ctx.employeeId);
      if (emp) {
        emp.salary = Math.round((emp.salary * (1 + e.pct)) / 1000) * 1000;
        emp.motivation = clamp(emp.motivation + 20, 0, 100);
      }
      break;
    }
    case 'employeeAbsent': {
      const emp = state.staff.employees.find((x) => x.id === ctx.employeeId);
      if (emp) emp.absentUntil = Math.max(emp.absentUntil || 0, state.time.day + e.days);
      break;
    }
    case 'salaryIndex':
      for (const emp of state.staff.employees) emp.salary = Math.round((emp.salary * (1 + e.pct)) / 100) * 100;
      break;
    case 'candidate': {
      const c = makeCandidate(state, rng, e.role || sectorModule(state).mainRole || null, { skill: e.skill, salaryMult: e.salaryMult || 1, trait: e.trait });
      if (e.salaryMult === 0) c.salary = 0; // stagiaire non rémunéré (convention de stage)
      c.expires = state.time.day + 20;
      state.staff.candidates.push(c);
      break;
    }
    case 'fixedCost':
      state.company.extraFixed = (state.company.extraFixed || 0) + scaled(state, -Math.abs(e.amount)) * -1;
      break;
    case 'chain':
      state.events.scheduled.push({ id: e.id, day: state.time.day + (e.days || 30), ctx });
      break;
    case 'flag':
      state.flags[e.key] = e.value === undefined ? true : e.value;
      break;
    case 'flagUntil':
      state.flags[e.key] = state.time.day + e.days;
      break;
    case 'economyTrend':
      state.world.economyTrend += e.v;
      break;
    case 'baseRate':
      state.world.baseRate = clamp(state.world.baseRate + e.v, 0, 0.08);
      break;
    case 'competitorPromo': {
      const c = state.competitors.find((x) => x.id === ctx.competitorId);
      if (c) {
        c.promoUntil = state.time.day + (e.days || 21);
        updateAttraction(state);
      }
      break;
    }
    case 'competitorBankrupt': {
      const c = state.competitors.find((x) => x.id === ctx.competitorId);
      if (c && c.alive) {
        c.alive = false;
        c.deadDay = state.time.day;
        state.stats.competitorsBankrupt = (state.stats.competitorsBankrupt || 0) + 1;
        updateAttraction(state);
      }
      break;
    }
    case 'newCompetitor':
      spawnCompetitor(state, rng, e.strategy);
      break;
    case 'investorOffer':
      if (state.meta.legal === 'srl' && !state.offers.investor) makeInvestorOffer(state, rng);
      break;
    case 'founderEnergy':
      state.staff.founder.energy = clamp(state.staff.founder.energy + e.v, 10, 100);
      break;
    case 'stat':
      state.stats[e.key] = (state.stats[e.key] || 0) + (e.v ?? 1);
      break;
    case 'sector':
      if (!commonOp(state, e)) {
        const m = sectorModule(state);
        if (m.eventOp) m.eventOp(state, e, rng, ctx);
      }
      break;
    case 'chance': {
      const p = chanceOf(state, e, ctx);
      const ok = rng.chance(p);
      applyEffects(state, ok ? e.success : e.fail, ctx, rng, src);
      if (e.successText || e.failText) log(state, ok ? 'good' : 'bad', fill(ok ? e.successText : e.failText, ctx), true);
      break;
    }
    case 'log':
      log(state, e.kind || 'event', fill(e.text, ctx), !!e.toast);
      break;
    default:
      break;
  }
}

/** Opérations communes à tous les secteurs. Retourne vrai si gérée. */
function commonOp(state, e) {
  switch (e.op) {
    case 'delayReceivables':
      for (const r of state.finance.receivables) r.due += e.days;
      return true;
    case 'clearCandidates':
      state.staff.candidates = [];
      return true;
    case 'raiseSocialBase': {
      const last = state.tax.results[state.tax.results.length - 1];
      if (last) state.tax.social.chosenBase = Math.max(state.tax.social.chosenBase, Math.round(last.operating * 0.8));
      return true;
    }
    case 'upgradeDiscount':
      state.flags.upgradeDiscount = { pct: e.pct, until: state.time.day + e.days, cat: 'locaux' };
      return true;
    default:
      return false;
  }
}

// --- Aperçu des conséquences ---------------------------------------------------------

const MOD_LABELS = {
  demand: 'Demande', productivity: 'Productivité', quality: 'Qualité', unitCost: 'Coût des achats', energy: 'Coût de l’énergie',
  economy: 'Conjoncture', attraction: 'Attractivité', cpc: 'Coût par clic', defaultRisk: 'Risque d’impayés', motivation: 'Motivation',
  materialCost: 'Coût des matériaux', refPrice: 'Prix du marché', saasChurn: 'Résiliations SaaS', maintChurn: 'Résiliations maintenance',
  hygiene: 'Hygiène', capacity: 'Capacité', returns: 'Retours', delivery: 'Délais de livraison', enrollment: 'Inscriptions',
};

function eurTxt(c) {
  return `${Math.round(c / 100).toLocaleString('fr-BE')} €`;
}

/** Lignes lisibles décrivant les effets d'un choix (avec probabilités). */
function describeEffects(state, choice, ctx = {}) {
  const out = [];
  const walk = (effects, prefix = '') => {
    for (const e of effects || []) {
      switch (e.t) {
        case 'cash': {
          const v = scaled(state, resolveAmount(state, e.amount));
          out.push({ text: `${prefix}${v >= 0 ? '+' : '−'}${eurTxt(Math.abs(v))} (trésorerie)`, kind: v >= 0 ? 'good' : 'bad' });
          break;
        }
        case 'personal': {
          const v = scaled(state, resolveAmount(state, e.amount));
          out.push({ text: `${prefix}${v >= 0 ? '+' : '−'}${eurTxt(Math.abs(v))} (compte perso)`, kind: v >= 0 ? 'good' : 'bad' });
          break;
        }
        case 'rep':
          out.push({ text: `${prefix}Réputation ${e.v > 0 ? '+' : '−'}${Math.abs(Math.round(e.v < 0 ? e.v * severity(state) : e.v))}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'sat':
          out.push({ text: `${prefix}Satisfaction clients ${e.v > 0 ? '+' : '−'}${Math.abs(e.v)}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'mod': {
          const m = e.mult != null ? scaledMult(state, e.mult) : 1;
          const pct = Math.round((m - 1) * 100);
          const label = MOD_LABELS[e.key] || e.key;
          const goodDir = ['unitCost', 'energy', 'cpc', 'defaultRisk', 'materialCost', 'saasChurn', 'maintChurn', 'returns', 'delivery'].includes(e.key) ? pct < 0 : pct > 0;
          out.push({ text: `${prefix}${label} ${pct > 0 ? '+' : '−'}${Math.abs(pct)} % pendant ${e.days} jours`, kind: goodDir ? 'good' : 'bad' });
          break;
        }
        case 'motivation':
          out.push({ text: `${prefix}Motivation de l’équipe ${e.v > 0 ? '+' : '−'}${Math.abs(e.v)}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'loseEmployee':
          out.push({ text: `${prefix}${ctx.employee || 'L’employé'} quitte l’entreprise`, kind: 'bad' });
          break;
        case 'employeeRaise':
          out.push({ text: `${prefix}Salaire de ${ctx.employee || 'l’employé'} +${Math.round(e.pct * 100)} %`, kind: 'bad' });
          break;
        case 'employeeSkill':
          out.push({ text: `${prefix}Compétence de ${ctx.employee || 'l’employé'} ${e.v > 0 ? '+' : ''}${e.v}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'employeeAbsent':
          out.push({ text: `${prefix}${ctx.employee || 'L’employé'} absent ${e.days} jours`, kind: 'bad' });
          break;
        case 'salaryIndex':
          out.push({ text: `${prefix}Tous les salaires +${(e.pct * 100).toFixed(1).replace('.', ',')} %`, kind: 'bad' });
          break;
        case 'candidate':
          out.push({ text: `${prefix}Un nouveau candidat rejoint ton vivier`, kind: 'good' });
          break;
        case 'fixedCost':
          out.push({ text: `${prefix}Charges fixes +${eurTxt(Math.abs(scaled(state, -Math.abs(e.amount))))}/mois`, kind: 'bad' });
          break;
        case 'chance': {
          const p = Math.round(chanceOf(state, e, ctx) * 100);
          out.push({ text: `${prefix}${p} % de chances :`, kind: 'muted' });
          walk(e.success, '   ✔ ');
          out.push({ text: `${prefix}${100 - p} % de risques :`, kind: 'muted' });
          walk(e.fail, '   ✘ ');
          break;
        }
        case 'chain':
          if (e.hint) out.push({ text: `${prefix}${e.hint}`, kind: 'muted' });
          break;
        case 'investorOffer':
          out.push({ text: `${prefix}Une offre d’investissement arrive (onglet Finances)`, kind: 'good' });
          break;
        case 'founderEnergy':
          out.push({ text: `${prefix}Ton énergie ${e.v > 0 ? '+' : '−'}${Math.abs(e.v)}`, kind: e.v > 0 ? 'good' : 'bad' });
          break;
        case 'competitorBankrupt':
          out.push({ text: `${prefix}${ctx.competitor || 'Le concurrent'} disparaît`, kind: 'good' });
          break;
        case 'sector':
          if (e.hint) out.push({ text: `${prefix}${e.hint}`, kind: e.kind || 'muted' });
          break;
        case 'baseRate':
          out.push({ text: `${prefix}Taux d’intérêt ${e.v > 0 ? '+' : '−'}${Math.abs(e.v * 100).toFixed(2).replace('.', ',')} pt`, kind: e.v > 0 ? 'bad' : 'good' });
          break;
        default:
          if (e.hint) out.push({ text: `${prefix}${e.hint}`, kind: 'muted' });
      }
    }
  };
  walk(choice.effects);
  return out;
}

// --- Déclenchement --------------------------------------------------------------------

function eligible(state, ev) {
  const t = state.events;
  const day = state.time.day;
  if (ev.chainOnly) return false;
  if (ev.sectors && !ev.sectors.includes(state.meta.sector)) return false;
  if (ev.legal && ev.legal !== state.meta.legal) return false;
  if (ev.minDay && day < ev.minDay) return false;
  if (ev.once && t.counts[ev.id]) return false;
  if ((t.cooldowns[ev.id] || -1) > day) return false;
  if (ev.when && !ev.when(state)) return false;
  return true;
}

function weightOf(state, ev) {
  const sev = severity(state);
  let w = ev.weight || 1;
  if (ev.kind === 'bad') w *= sev;
  if (ev.kind === 'good') w /= sev;
  return w;
}

/** Déclenche un événement (immédiat ou en attente de décision). */
function trigger(state, ev, rng, ctxIn = null) {
  const ctx = ctxIn || pickContext(state, ev, rng);
  if (ctx === null) return false;
  const t = state.events;
  t.counts[ev.id] = (t.counts[ev.id] || 0) + 1;
  t.cooldowns[ev.id] = state.time.day + (ev.cooldown ?? EVENT_PARAMS.defaultCooldown);
  t.lastDay = state.time.day;
  const title = fill(ev.title, ctx);
  const text = fill(ev.text, ctx);
  if (ev.choices && ev.choices.length) {
    t.uid += 1;
    t.pending.push({
      uid: t.uid,
      id: ev.id,
      title,
      text,
      ctx,
      day: state.time.day,
      botChoice: ev.botChoice ?? 0,
      choices: ev.choices.map((c) => ({ label: fill(c.label, ctx), effects: c.effects || [] })),
    });
  } else {
    applyEffects(state, ev.effects, ctx, rng, title);
    t.history.push({ id: ev.id, day: state.time.day });
    log(state, ev.kind === 'good' ? 'good' : ev.kind === 'bad' ? 'bad' : 'event', `${title} — ${text}`, true);
  }
  if (t.history.length > 200) t.history.splice(0, t.history.length - 200);
  return true;
}

function daily(state, rng) {
  const t = state.events;
  if (state.status === 'bankrupt') return;
  // 1) Suites programmées (chaînes)
  const due = t.scheduled.filter((x) => x.day <= state.time.day);
  if (due.length) {
    t.scheduled = t.scheduled.filter((x) => x.day > state.time.day);
    for (const x of due) {
      const ev = BY_ID[x.id];
      if (ev) trigger(state, ev, rng, x.ctx || {});
    }
  }
  if (t.pending.length) return;
  // 2) Tirage aléatoire
  const diff = DIFFICULTIES[state.meta.difficulty];
  if (state.time.day - t.lastDay < EVENT_PARAMS.minGapDays) return;
  if (!rng.chance(EVENT_PARAMS.dailyChance * diff.eventFrequency)) return;
  const list = EVENTS.filter((ev) => eligible(state, ev));
  const ev = rng.weighted(list, (x) => weightOf(state, x));
  if (ev) trigger(state, ev, rng);
}

/** Action du joueur : choisir une option d'un événement en attente. */
function decide(state, uid, choiceIdx, rng) {
  const t = state.events;
  const i = t.pending.findIndex((p) => p.uid === uid);
  if (i < 0) return { ok: false, message: 'Décision introuvable.' };
  const p = t.pending[i];
  const c = p.choices[choiceIdx];
  if (!c) return { ok: false, message: 'Choix invalide.' };
  t.pending.splice(i, 1);
  t.history.push({ id: p.id, day: state.time.day, choice: choiceIdx });
  log(state, 'event', `${p.title} : « ${c.label} ».`);
  applyEffects(state, c.effects, p.ctx, rng, p.title);
  return { ok: true };
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
  const available = Math.max(0, Math.floor(state.cash + state.finance.overdraftLimit * 0.5));
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

// ---- src/data/investments.js ----
__m["src/data/investments.js"] = (function () {
const __exports = {};
__def(__exports, { "INVESTMENTS": () => INVESTMENTS });
// Placements du compte personnel. Rendements SIMULÉS (pas des prévisions !).
// Les frais et taxes viennent de fiscalite.js. Montants en centimes.

const INVESTMENTS = {
  savings: {
    label: 'Compte d’épargne réglementé',
    // [approx] taux de base + prime de fidélité ≈ 0,55 × taux directeur + 0,4 %
    rateFromBase: 0.55,
    rateAdd: 0.004,
  },
  etf: {
    label: 'ETF actions monde (capitalisant)',
    annualReturn: 0.07, // [approx] moyenne historique long terme des actions mondiales
    annualVol: 0.15,
    brokerFee: 0.001, // frais de courtage
    brokerMin: 100,
  },
  stocks: {
    label: 'Panier d’actions individuelles',
    annualReturn: 0.08,
    annualVol: 0.25,
    beta: 1.1, // sensibilité au marché
    dividendYield: 0.025,
    brokerFee: 0.002,
    brokerMin: 200,
  },
  crash: {
    monthlyProb: 0.004, // ≈ un krach tous les 20 ans
    drop: [0.18, 0.35],
  },
  safeWithdrawalRate: 0.04, // règle des 4 % (revenu passif « bourse »)
  realEstate: {
    mortgageSpread: 0.013, // taux hypothécaire = taux directeur + 1,3 % [approx]
    mortgageYears: 20,
    minDownPayment: 0.2, // apport minimum (hors frais)
    appreciation: 0.02, // hausse annuelle moyenne des prix [approx]
    appreciationVol: 0.03,
    maintenancePct: 0.01, // entretien annuel (% de la valeur)
    vacancyProbYearly: 0.15, // probabilité qu'un locataire parte dans l'année
    vacancyMonths: [1, 3],
    sellFeePct: 0.03, // agence immobilière à la revente
    rentIndexation: 0.02, // indexation annuelle des loyers
    catalog: [
      { id: 'studio', label: 'Studio à Liège', price: 14_500_000, rent: 65_000 },
      { id: 'appart', label: 'Appartement 2 chambres à Namur', price: 23_000_000, rent: 95_000 },
      { id: 'maison', label: 'Maison 3 façades à Charleroi', price: 21_000_000, rent: 105_000, maintenance: 0.015 },
      { id: 'ixelles', label: 'Appartement à Ixelles (Bruxelles)', price: 34_000_000, rent: 135_000 },
      { id: 'immeuble', label: 'Immeuble de rapport (4 logements) à Mons', price: 62_000_000, rent: 300_000, maintenance: 0.015 },
    ],
  },
};
return __exports;
})();

// ---- src/engine/systems/investments.js ----
__m["src/engine/systems/investments.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "savingsRate": () => savingsRate, "mortgageRate": () => mortgageRate, "tradeFees": () => tradeFees, "deposit": () => deposit, "withdraw": () => withdraw, "buy": () => buy, "sell": () => sell, "propertyQuote": () => propertyQuote, "buyProperty": () => buyProperty, "sellProperty": () => sellProperty, "monthlyPersonalIncome": () => monthlyPersonalIncome, "monthEnd": () => monthEnd, "yearEnd": () => yearEnd });
// Placements personnels : épargne réglementée, ETF, actions, immobilier locatif.
// Rendements simulés (log-normaux + krachs), frais (TOB, courtage, droits
// d'enregistrement) et fiscalité belge simplifiée.

const { INVESTMENTS: I } = __m["src/data/investments.js"];
const { FISCALITE: F } = __m["src/data/fiscalite.js"];
const { personalIn, personalOut } = __m["src/engine/ledger.js"];
const { annuity, clamp } = __m["src/engine/money.js"];
const { dateOf } = __m["src/engine/calendar.js"];
const { log } = __m["src/engine/log.js"];

function init(state) {
  state.investments = {
    savings: 0,
    etf: { value: 0, basis: 0 },
    stocks: { value: 0, basis: 0 },
    realEstate: [],
    reSeq: 0,
    index: { etf: 100, stocks: 100 },
    year: { interest: 0, dividends: 0, gains: 0, fees: 0, rent: 0 },
    lastMonth: { interest: 0, dividends: 0, rentNet: 0 },
    history: [],
  };
}

function savingsRate(state) {
  return clamp(state.world.baseRate * I.savings.rateFromBase + I.savings.rateAdd, 0.002, 0.05);
}

function mortgageRate(state) {
  return state.world.baseRate + I.realEstate.mortgageSpread;
}

/** Frais d'une transaction en bourse : TOB plafonnée + courtage. */
function tradeFees(kind, amount) {
  const tob = kind === 'etf' ? F.tob.etf : F.tob.actions;
  const cfg = I[kind];
  return Math.round(Math.min(amount * tob.rate, tob.max) + Math.max(cfg.brokerMin, amount * cfg.brokerFee));
}

// --- Actions -----------------------------------------------------------------

function deposit(state, amount) {
  amount = Math.round(amount);
  if (!(amount > 0) || amount > state.personal.cash) return { ok: false, message: 'Montant invalide ou compte perso insuffisant.' };
  personalOut(state, amount, 'epargne');
  state.investments.savings += amount;
  return { ok: true };
}

function withdraw(state, amount) {
  amount = Math.round(amount);
  const inv = state.investments;
  if (!(amount > 0) || amount > inv.savings) return { ok: false, message: 'Montant invalide.' };
  inv.savings -= amount;
  personalIn(state, amount, 'epargne');
  return { ok: true };
}

function buy(state, kind, amount) {
  amount = Math.round(amount);
  if (!['etf', 'stocks'].includes(kind)) return { ok: false, message: 'Produit inconnu.' };
  if (!(amount >= 10_000)) return { ok: false, message: 'Minimum 100 €.' };
  const fees = tradeFees(kind, amount);
  if (amount + fees > state.personal.cash) return { ok: false, message: 'Compte perso insuffisant (frais et TOB compris).' };
  personalOut(state, amount + fees, 'bourse');
  const p = state.investments[kind];
  p.value += amount;
  p.basis += amount;
  state.investments.year.fees += fees;
  state.stats.invested = (state.stats.invested || 0) + amount;
  return { ok: true };
}

function sell(state, kind, amount) {
  const p = state.investments[kind];
  if (!p) return { ok: false, message: 'Produit inconnu.' };
  amount = Math.min(Math.round(amount), p.value);
  if (!(amount > 0)) return { ok: false, message: 'Rien à vendre.' };
  const fees = tradeFees(kind, amount);
  const basisPart = Math.round((p.basis * amount) / p.value);
  state.investments.year.gains += amount - basisPart;
  p.basis -= basisPart;
  p.value -= amount;
  personalIn(state, amount - fees, 'bourse');
  state.investments.year.fees += fees;
  return { ok: true };
}

/** Coût total d'achat d'un bien (prix + droits + notaire) et prêt nécessaire. */
function propertyQuote(state, item, downPct) {
  const fees = Math.round(item.price * (F.immobilier.droitsEnregistrement + F.immobilier.fraisNotaire));
  const dp = clamp(downPct, I.realEstate.minDownPayment, 1);
  const loan = Math.round(item.price * (1 - dp));
  const cash = item.price - loan + fees;
  const rate = mortgageRate(state);
  const payment = loan > 0 ? annuity(loan, rate, I.realEstate.mortgageYears * 12) : 0;
  return { fees, loan, cash, rate, payment };
}

function buyProperty(state, id, downPct = 0.2) {
  const item = I.realEstate.catalog.find((x) => x.id === id);
  if (!item) return { ok: false, message: 'Bien inconnu.' };
  const q = propertyQuote(state, item, downPct);
  if (q.cash > state.personal.cash) return { ok: false, message: `Il te faut ${Math.round(q.cash / 100)} € sur ton compte perso (apport + droits d'enregistrement + notaire).` };
  // La banque vérifie que la mensualité reste supportable (≈ 1/3 des revenus mensuels connus).
  const income = monthlyPersonalIncome(state);
  const totalPay = state.investments.realEstate.reduce((s, p) => s + p.mortgage.payment, 0) + q.payment;
  if (q.loan > 0 && totalPay > income * 0.5 + q.payment * 0.7) return { ok: false, message: 'La banque refuse le crédit : tes revenus ne couvrent pas assez les mensualités (augmente ton apport).' };
  personalOut(state, q.cash, 'immobilier');
  state.investments.reSeq += 1;
  state.investments.realEstate.push({
    id: state.investments.reSeq,
    type: item.id,
    label: item.label,
    price: item.price,
    value: item.price,
    rent: item.rent,
    maintenance: item.maintenance || I.realEstate.maintenancePct,
    vacantUntil: state.time.day + 30, // le temps de trouver un locataire
    mortgage: { remaining: q.loan, rate: q.rate, payment: q.payment, monthsLeft: q.loan > 0 ? I.realEstate.mortgageYears * 12 : 0 },
    boughtDay: state.time.day,
  });
  state.stats.propertiesBought = (state.stats.propertiesBought || 0) + 1;
  log(state, 'invest', `Achat : ${item.label} pour ${Math.round(item.price / 100)} € (+ ${Math.round(q.fees / 100)} € de droits et frais).`, true);
  return { ok: true };
}

function sellProperty(state, pid) {
  const inv = state.investments;
  const p = inv.realEstate.find((x) => x.id === pid);
  if (!p) return { ok: false, message: 'Bien introuvable.' };
  const net = Math.round(p.value * (1 - I.realEstate.sellFeePct)) - p.mortgage.remaining;
  if (net < 0 && -net > state.personal.cash) return { ok: false, message: 'La vente ne couvre pas le crédit restant.' };
  if (net >= 0) personalIn(state, net, 'immobilier');
  else personalOut(state, -net, 'immobilier');
  inv.realEstate = inv.realEstate.filter((x) => x !== p);
  log(state, 'invest', `Vente : ${p.label} (${Math.round(net / 100)} € net après remboursement du crédit).`, true);
  return { ok: true };
}

/** Revenus mensuels connus du dirigeant (pour l'évaluation bancaire). */
function monthlyPersonalIncome(state) {
  const h = (state.personal.history || []).slice(-6);
  let inc = 0;
  for (const m of h) inc += Math.max(0, (m.revenu || 0) + (m.dividendes || 0) + (m.loyers || 0));
  return h.length ? inc / h.length : state.personal.draw;
}

// --- Simulation mensuelle ----------------------------------------------------------

function monthEnd(state, rng) {
  const inv = state.investments;
  const d = dateOf(state.time.day);
  // Marché : facteur commun (ETF) + spécifique (actions)
  const e = I.etf;
  const muE = Math.log(1 + e.annualReturn) / 12 - (e.annualVol * e.annualVol) / 24;
  const z = rng.normal(0, 1);
  let rE = muE + (e.annualVol / Math.sqrt(12)) * z + (state.world.economy - 1) * 0.01;
  if (rng.chance(I.crash.monthlyProb)) {
    const drop = rng.range(I.crash.drop[0], I.crash.drop[1]);
    rE += Math.log(1 - drop);
    state.stats.crashes = (state.stats.crashes || 0) + 1;
    log(state, 'invest', `Krach boursier : les marchés perdent ${Math.round(drop * 100)} % ! Garder son calme est souvent la meilleure stratégie.`, true);
  }
  const s = I.stocks;
  const muS = Math.log(1 + s.annualReturn) / 12 - (s.annualVol * s.annualVol) / 24;
  const idio = Math.sqrt(Math.max(0, (s.annualVol * s.annualVol) / 12 - (s.beta * s.beta * e.annualVol * e.annualVol) / 12));
  const rS = muS + s.beta * (rE - muE) + idio * rng.normal(0, 1);
  inv.index.etf *= Math.exp(rE);
  inv.index.stocks *= Math.exp(rS);
  inv.etf.value = Math.round(inv.etf.value * Math.exp(rE));
  inv.stocks.value = Math.round(inv.stocks.value * Math.exp(rS));
  // Dividendes trimestriels des actions (précompte 30 % retenu)
  let divNet = 0;
  if (d.month % 3 === 2 && inv.stocks.value > 0) {
    const gross = Math.round((inv.stocks.value * s.dividendYield) / 4);
    divNet = Math.round(gross * (1 - F.dividendes.precompte));
    personalIn(state, divNet, 'dividendes');
    inv.year.dividends += gross;
    state.tax.year.dividendsGross += gross;
    state.tax.year.dividendRateMax = Math.max(state.tax.year.dividendRateMax, F.dividendes.precompte);
  }
  // Épargne : intérêts capitalisés
  const interest = Math.round((inv.savings * savingsRate(state)) / 12);
  inv.savings += interest;
  inv.year.interest += interest;
  // Immobilier
  let rentNet = 0;
  const R = I.realEstate;
  for (const p of inv.realEstate) {
    const occupied = p.vacantUntil <= state.time.day;
    if (occupied) {
      personalIn(state, p.rent, 'loyers');
      inv.year.rent += p.rent;
      rentNet += p.rent;
      if (rng.chance(R.vacancyProbYearly / 12)) {
        p.vacantUntil = state.time.day + 30 * rng.int(R.vacancyMonths[0], R.vacancyMonths[1]);
        log(state, 'invest', `${p.label} : le locataire part, logement vide quelques mois.`);
      }
    }
    const maint = Math.round((p.value * p.maintenance) / 12);
    personalOut(state, maint, 'immobilier');
    rentNet -= maint;
    if (p.mortgage.remaining > 0) {
      const intr = Math.round((p.mortgage.remaining * p.mortgage.rate) / 12);
      const princ = Math.min(p.mortgage.remaining, p.mortgage.payment - intr);
      personalOut(state, intr + princ, 'credit_hypothecaire');
      p.mortgage.remaining -= princ;
      p.mortgage.monthsLeft -= 1;
      rentNet -= intr + princ;
    }
    // Précompte immobilier (septembre)
    if (d.month === 8) {
      const pi = Math.round(p.rent * F.immobilier.precompteMoisLoyer);
      personalOut(state, pi, 'impots_perso');
      rentNet -= pi;
    }
    const g = Math.log(1 + R.appreciation) / 12 + rng.normal(0, R.appreciationVol / Math.sqrt(12));
    p.value = Math.round(p.value * Math.exp(g));
  }
  inv.lastMonth = { interest, dividends: divNet, rentNet };
  inv.history.push({ m: Math.floor(state.time.day / 30), savings: inv.savings, etf: inv.etf.value, stocks: inv.stocks.value, re: inv.realEstate.reduce((t, p) => t + p.value - p.mortgage.remaining, 0) });
  if (inv.history.length > 600) inv.history.shift();
}

function yearEnd(state) {
  const inv = state.investments;
  // Épargne : 15 % au-delà de l'exonération
  const taxSav = Math.round(Math.max(0, inv.year.interest - F.epargne.exemptInterest) * F.epargne.taxRate);
  if (taxSav > 0) inv.savings = Math.max(0, inv.savings - taxSav);
  // Plus-values financières : 10 % au-delà de 10 000 €
  const taxGains = Math.round(Math.max(0, inv.year.gains - F.plusValues.exemption) * F.plusValues.rate);
  if (taxGains > 0) personalOut(state, taxGains, 'impots_perso');
  // Taxe sur les comptes-titres
  const titres = inv.etf.value + inv.stocks.value;
  let tact = 0;
  if (titres > F.tact.threshold) tact = Math.round(Math.min(titres * F.tact.rate, (titres - F.tact.threshold) * 0.1));
  if (tact > 0) personalOut(state, tact, 'impots_perso');
  // IPP approximé sur les loyers
  const taxRent = Math.round(inv.year.rent * F.immobilier.ippSurLoyer);
  if (taxRent > 0) personalOut(state, taxRent, 'impots_perso');
  // Indexation des loyers
  for (const p of inv.realEstate) p.rent = Math.round(p.rent * (1 + I.realEstate.rentIndexation));
  const total = taxSav + taxGains + tact + taxRent;
  if (total > 0) log(state, 'tax', `Fiscalité de tes placements ${dateOf(state.time.day).year} : ${Math.round(total / 100)} € (épargne, plus-values, comptes-titres, loyers).`);
  inv.year = { interest: 0, dividends: 0, gains: 0, fees: 0, rent: 0 };
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

// ---- src/engine/systems/passive.js ----
__m["src/engine/systems/passive.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "businessPassive": () => businessPassive, "computePassive": () => computePassive, "monthEnd": () => monthEnd });
// Revenu passif mensuel net, patrimoine, victoire (voir docs/DESIGN.md § 11.2).

const { INVESTMENTS: I } = __m["src/data/investments.js"];
const { FISCALITE: F } = __m["src/data/fiscalite.js"];
const { hasManager } = __m["src/engine/systems/staff.js"];
const { savingsRate } = __m["src/engine/systems/investments.js"];
const { netWorth } = __m["src/engine/selectors.js"];
const { ippTax, socialAnnualDue, socialBaseFromProfit, isocTax, reducedRateEligible, directorIpp } = __m["src/engine/taxmath.js"];
const { log } = __m["src/engine/log.js"];

function init(state) {
  state.passive = { total: 0, avg3: 0, parts: {}, history: [] };
}

/** Bénéfice net mensuel que l'entreprise verse au fondateur, après impôts (estimation). */
function businessPassive(state) {
  if (state.staff.founder.active || !hasManager(state)) return 0;
  const h = state.finance.history.slice(-6);
  if (!h.length) return 0;
  const profit = h.reduce((s, x) => s + x.profit, 0) / h.length;
  if (state.meta.legal === 'srl') {
    const pay = state.personal.draw;
    const annualProfit = Math.max(0, profit * 12);
    const isoc = isocTax(annualProfit, reducedRateEligible(pay * 12, annualProfit));
    const dividends = (annualProfit - isoc) * (1 - F.dividendes.vvprbisYear3) * state.ownership.founder;
    const salary = pay * 12 - directorIpp(pay * 12) - socialAnnualDue(socialBaseFromProfit(pay * 12));
    return Math.max(0, Math.round((dividends + Math.max(0, salary)) / 12));
  }
  const annual = Math.max(0, profit * 12);
  const social = socialAnnualDue(socialBaseFromProfit(annual));
  const net = annual - social - ippTax(Math.max(0, annual - social)).total;
  return Math.max(0, Math.round(net / 12));
}

/** Décomposition du revenu passif mensuel net. */
function computePassive(state) {
  const inv = state.investments;
  const epargne = Math.round((inv.savings * savingsRate(state) * (1 - (inv.savings * savingsRate(state) > F.epargne.exemptInterest ? F.epargne.taxRate : 0))) / 12);
  const portfolio = inv.etf.value + inv.stocks.value;
  // Règle des 4 % nette d'une taxe sur les plus-values estimée
  const bourse = Math.round((portfolio * I.safeWithdrawalRate * (1 - F.plusValues.rate * 0.5)) / 12);
  let immobilier = 0;
  for (const p of inv.realEstate) {
    const expectedRent = p.rent * (1 - I.realEstate.vacancyProbYearly * 0.17);
    const costs = (p.value * p.maintenance) / 12 + (p.rent * F.immobilier.precompteMoisLoyer) / 12 + p.rent * F.immobilier.ippSurLoyer;
    immobilier += expectedRent - costs - (p.mortgage.remaining > 0 ? p.mortgage.payment : 0);
  }
  immobilier = Math.round(immobilier);
  const entreprise = businessPassive(state);
  const parts = { epargne, bourse, immobilier, entreprise };
  return { parts, total: epargne + bourse + immobilier + entreprise };
}

function monthEnd(state) {
  const p = state.passive;
  const c = computePassive(state);
  p.parts = c.parts;
  p.total = c.total;
  p.history.push(c.total);
  if (p.history.length > 600) p.history.shift();
  const last3 = p.history.slice(-3);
  p.avg3 = Math.round(last3.reduce((a, b) => a + b, 0) / last3.length);
  // Compléter l'instantané du mois
  const snap = state.finance.history[state.finance.history.length - 1];
  if (snap) {
    snap.passive = p.total;
    snap.netWorth = netWorth(state);
  }
  // Victoire : moyenne sur 3 mois ≥ objectif
  if (state.status === 'playing' && last3.length === 3 && p.avg3 >= state.passiveTarget) {
    state.status = 'won';
    state.endgame.wonDay = state.time.day;
    log(state, 'good', 'LIBERTÉ FINANCIÈRE ! Tes revenus passifs couvrent ton objectif.', true);
  }
}
return __exports;
})();

// ---- src/data/achievements.js ----
__m["src/data/achievements.js"] = (function () {
const __exports = {};
__def(__exports, { "ACHIEVEMENTS": () => ACHIEVEMENTS });
// Succès (achievements). check(state) est évalué chaque fin de mois et après
// certaines actions. Les fonctions ne lisent que l'état (aucun effet de bord).

const revenue = (s) => s.finance.totals.revenue;
const profitMonths = (s, min) => s.finance.history.filter((h) => h.profit >= min).length;
const employees = (s) => s.staff.employees.length;
const inv = (s) => s.investments;
const portfolio = (s) => inv(s).etf.value + inv(s).stocks.value + inv(s).savings;
const years = (s) => s.time.day / 360;
const alive = (s) => s.status !== 'bankrupt';

const ACHIEVEMENTS = [
  { id: 'premiere_vente', icon: '🪙', label: 'Premier client', desc: 'Encaisser ta première vente.', check: (s) => revenue(s) > 0 },
  { id: 'ca_10k', icon: '💶', label: '10 000 € de chiffre d’affaires', desc: 'Atteindre 10 000 € de CA cumulé.', check: (s) => revenue(s) >= 1_000_000 },
  { id: 'ca_100k', icon: '💰', label: '100 000 € de chiffre d’affaires', desc: 'Atteindre 100 000 € de CA cumulé.', check: (s) => revenue(s) >= 10_000_000 },
  { id: 'ca_1m', icon: '🏆', label: 'Le million', desc: 'Atteindre 1 000 000 € de CA cumulé.', check: (s) => revenue(s) >= 100_000_000 },
  { id: 'premier_employe', icon: '🤝', label: 'Premier engagement', desc: 'Recruter ton premier salarié.', check: (s) => (s.stats.hires || 0) >= 1 },
  { id: 'equipe_5', icon: '👥', label: 'Une vraie équipe', desc: 'Avoir 5 employés en même temps.', check: (s) => (s.stats.maxEmployees || 0) >= 5 },
  { id: 'equipe_10', icon: '🏢', label: 'PME', desc: 'Avoir 10 employés en même temps.', check: (s) => (s.stats.maxEmployees || 0) >= 10 },
  { id: 'formation', icon: '🎓', label: 'Investir dans les gens', desc: 'Former 5 fois un employé.', check: (s) => (s.stats.trainings || 0) >= 5 },
  { id: 'controle_fiscal', icon: '🧾', label: 'Comptes impeccables', desc: 'Sortir indemne d’un contrôle fiscal.', check: (s) => (s.stats.taxAuditsSurvived || 0) >= 1 },
  { id: 'inspection', icon: '🔍', label: 'Tout est en règle', desc: 'Réussir une inspection sociale.', check: (s) => (s.stats.socialAuditsSurvived || 0) >= 1 },
  { id: 'tva_payee', icon: '📅', label: 'Premier trimestre', desc: 'Payer ta première déclaration de TVA.', check: (s) => (s.stats.vatPaid || 0) >= 1 },
  { id: 'annee_1', icon: '🎂', label: 'Un an déjà', desc: 'Survivre à ta première année.', check: (s) => years(s) >= 1 && alive(s) },
  { id: 'annee_5', icon: '🗓', label: 'Cap des 5 ans', desc: 'Toujours là après 5 ans (la moitié des entreprises n’y arrivent pas).', check: (s) => years(s) >= 5 && alive(s) },
  { id: 'mois_5k', icon: '📈', label: 'Rentable', desc: 'Un mois avec 5 000 € de bénéfice.', check: (s) => profitMonths(s, 500_000) >= 1 },
  { id: 'mois_20k', icon: '🚀', label: 'Machine à cash', desc: 'Un mois avec 20 000 € de bénéfice.', check: (s) => profitMonths(s, 2_000_000) >= 1 },
  { id: 'remontada', icon: '🧗', label: 'Remontada', desc: 'Sortir d’une trésorerie négative.', check: (s) => (s.endgame?.recoveredFromNegative || 0) >= 1 },
  { id: 'pret_rembourse', icon: '🏦', label: 'Dette remboursée', desc: 'Rembourser entièrement un prêt bancaire.', check: (s) => (s.stats.loansRepaid || 0) >= 1 },
  { id: 'zero_dette', icon: '🕊', label: 'Libre de dettes', desc: 'Plus aucun prêt après en avoir eu.', check: (s) => (s.stats.loansTaken || 0) >= 1 && s.loans.length === 0 },
  { id: 'levee_fonds', icon: '🦄', label: 'Levée de fonds', desc: 'Faire entrer un investisseur au capital.', check: (s) => (s.stats.fundraises || 0) >= 1 },
  { id: 'dividende', icon: '🍾', label: 'Premier dividende', desc: 'Te verser un dividende (SRL).', check: (s) => (s.stats.dividendsTotal || 0) > 0 },
  { id: 'premier_placement', icon: '🌱', label: 'Premier placement', desc: 'Acheter ton premier ETF ou tes premières actions.', check: (s) => (s.stats.invested || 0) > 0 },
  { id: 'portefeuille_100k', icon: '📊', label: 'Portefeuille à 100 000 €', desc: 'Épargne + bourse ≥ 100 000 €.', check: (s) => portfolio(s) >= 10_000_000 },
  { id: 'immo_1', icon: '🏠', label: 'Propriétaire bailleur', desc: 'Acheter ton premier bien locatif.', check: (s) => (s.stats.propertiesBought || 0) >= 1 },
  { id: 'immo_3', icon: '🏘', label: 'Petit empire immobilier', desc: 'Posséder 3 biens en même temps.', check: (s) => inv(s).realEstate.length >= 3 },
  { id: 'passif_1000', icon: '🌤', label: '1 000 € de revenu passif', desc: 'Revenu passif mensuel ≥ 1 000 €.', check: (s) => (s.passive?.total || 0) >= 100_000 },
  { id: 'liberte', icon: '🏝', label: 'Liberté financière', desc: 'Atteindre ton objectif de revenu passif.', check: (s) => s.endgame?.wonDay != null },
  { id: 'sans_credit', icon: '💪', label: 'Sans l’aide des banques', desc: 'Atteindre la liberté financière sans jamais emprunter.', check: (s) => s.endgame?.wonDay != null && !(s.stats.loansTaken > 0) },
  { id: 'millionnaire', icon: '💎', label: 'Millionnaire', desc: 'Patrimoine net ≥ 1 000 000 €.', check: (s) => s.finance.history.some((h) => (h.netWorth || 0) >= 100_000_000) },
  { id: 'reputation_80', icon: '⭐', label: 'Réputation en or', desc: 'Réputation ≥ 80.', check: (s) => s.company.reputation >= 80 },
  { id: 'leader', icon: '👑', label: 'Leader du marché', desc: 'Part de marché ≥ 40 %.', check: (s) => s.company.share >= 0.4 },
  { id: 'concurrent_ko', icon: '🥊', label: 'Survivant', desc: 'Voir un concurrent faire faillite.', check: (s) => (s.stats.competitorsBankrupt || 0) >= 1 },
  { id: 'ameliorations_10', icon: '🔧', label: 'Toujours mieux', desc: 'Acheter 10 améliorations.', check: (s) => (s.stats.upgradesBought || 0) >= 10 },
  { id: 'retraite', icon: '🧘', label: 'Délégation réussie', desc: 'Te retirer de l’opérationnel au profit d’un gérant.', check: (s) => s.stats.retiredDay != null },
  { id: 'crise', icon: '🌪', label: 'Tempête traversée', desc: 'Survivre à une crise économique.', check: (s) => (s.stats.crisesSurvived || 0) >= 1 && alive(s) },
  { id: 'krach', icon: '📉', label: 'Mains de diamant', desc: 'Garder ses placements pendant un krach boursier.', check: (s) => (s.stats.crashes || 0) >= 1 && inv(s).etf.value + inv(s).stocks.value > 0 },
  { id: 'fidele', icon: '❤️', label: 'Fidélité', desc: 'Un employé avec 3 ans d’ancienneté.', check: (s) => s.staff.employees.some((e) => s.time.day - e.hiredDay >= 1080) },
  // Un par secteur
  { id: 'saas', icon: '☁️', label: 'Éditeur de logiciel', desc: 'Agence : mettre ton SaaS en ligne.', sector: 'agence', check: (s) => s.flags.saasLive === true },
  { id: 'friterie_300', icon: '🍟', label: 'Rush du samedi', desc: 'Friterie : servir 300 clients en une journée.', sector: 'restaurant', check: (s) => (s.sector.stats?.bestDay || 0) >= 300 },
  { id: 'afsca', icon: '😊', label: 'Smiley AFSCA', desc: 'Friterie : réussir 3 contrôles AFSCA.', sector: 'restaurant', check: (s) => (s.stats.afscaOk || 0) >= 3 },
  { id: 'ecom_100', icon: '📦', label: 'Cent colis', desc: 'E-commerce : 100 commandes en une journée.', sector: 'ecommerce', check: (s) => (s.sector.stats?.bestDay || 0) >= 100 },
  { id: 'artisan_50', icon: '🛠', label: 'Artisan reconnu', desc: 'Artisan : terminer 50 chantiers.', sector: 'artisan', check: (s) => (s.sector.stats?.jobsDone || 0) >= 50 },
  { id: 'soutien_90', icon: '🎯', label: 'Taux de réussite record', desc: 'Soutien scolaire : 90 % de réussite à une session.', sector: 'soutien', check: (s) => (s.sector.stats?.bestSuccess || 0) >= 0.9 },
];
return __exports;
})();

// ---- src/engine/systems/achievements.js ----
__m["src/engine/systems/achievements.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "checkAchievements": () => checkAchievements, "monthEnd": () => monthEnd, "daily": () => daily });
// Déblocage des succès (vérifiés chaque jour de fin de mois et via checkAchievements).

const { ACHIEVEMENTS } = __m["src/data/achievements.js"];
const { log } = __m["src/engine/log.js"];

function init(state) {
  state.achievements = { unlocked: {} };
}

function checkAchievements(state) {
  const u = state.achievements.unlocked;
  for (const a of ACHIEVEMENTS) {
    if (u[a.id] != null) continue;
    if (a.sector && a.sector !== state.meta.sector) continue;
    let ok = false;
    try {
      ok = a.check(state);
    } catch {
      ok = false;
    }
    if (ok) {
      u[a.id] = state.time.day;
      log(state, 'good', `🏅 Succès débloqué : ${a.label}`, true);
    }
  }
}

function monthEnd(state) {
  checkAchievements(state);
}

/** Les plus rapides (première vente) sont aussi vérifiés chaque semaine. */
function daily(state) {
  if (state.time.day % 7 === 0) checkAchievements(state);
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
  if (state.events) state.events.pending = []; // plus aucune décision possible
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
const { decide } = __m["src/engine/events.js"];
const inv = __m["src/engine/systems/investments.js"];
const { checkAchievements } = __m["src/engine/systems/achievements.js"];
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
  decide(state, a, rng) {
    return decide(state, a.uid, a.choice, rng);
  },
  deposit(state, a) {
    return inv.deposit(state, Number(a.amount));
  },
  withdraw(state, a) {
    return inv.withdraw(state, Number(a.amount));
  },
  buyAsset(state, a) {
    const r = inv.buy(state, a.kind, Number(a.amount));
    if (r.ok) checkAchievements(state);
    return r;
  },
  sellAsset(state, a) {
    return inv.sell(state, a.kind, Number(a.amount));
  },
  buyProperty(state, a) {
    const r = inv.buyProperty(state, a.id, Number(a.downPct ?? 0.2));
    if (r.ok) checkAchievements(state);
    return r;
  },
  sellProperty(state, a) {
    return inv.sellProperty(state, a.id);
  },
  continueSandbox(state) {
    if (state.status !== 'won') return { ok: false, message: 'Disponible après la victoire.' };
    state.status = 'sandbox';
    log(state, 'info', 'Mode bac à sable : la partie continue sans fin. Les succès restent à débloquer !');
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
//   monde → entreprise → concurrents → secteur → équipe → événements → prêts → dirigeant → fiscalité
//   → placements → coût de la vie → finance → revenu passif → succès → fin de partie

const core = __m["src/engine/systems/core.js"];
const company = __m["src/engine/systems/company.js"];
const competitors = __m["src/engine/systems/competitors.js"];
const sector = __m["src/engine/systems/sector.js"];
const events = __m["src/engine/events.js"];
const staff = __m["src/engine/systems/staff.js"];
const loans = __m["src/engine/systems/loans.js"];
const owner = __m["src/engine/systems/owner.js"];
const tax = __m["src/engine/systems/tax.js"];
const investments = __m["src/engine/systems/investments.js"];
const living = __m["src/engine/systems/living.js"];
const finance = __m["src/engine/systems/finance.js"];
const passive = __m["src/engine/systems/passive.js"];
const achievements = __m["src/engine/systems/achievements.js"];
const endgame = __m["src/engine/systems/endgame.js"];


const SYSTEMS = [core, company, competitors, sector, staff, events, loans, owner, tax, investments, living, finance, passive, achievements, endgame];

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

// ---- src/engine/index.js ----
__m["src/engine/index.js"] = (function () {
const __exports = {};
__def(__exports, { "newGame": () => __m["src/engine/state.js"]["newGame"], "DEFAULT_OPTIONS": () => __m["src/engine/state.js"]["DEFAULT_OPTIONS"], "tick": () => __m["src/engine/tick.js"]["tick"], "advance": () => __m["src/engine/tick.js"]["advance"], "stepDay": () => __m["src/engine/tick.js"]["stepDay"], "isBlocked": () => __m["src/engine/tick.js"]["isBlocked"], "applyAction": () => __m["src/engine/actions.js"]["applyAction"], "knownActions": () => __m["src/engine/actions.js"]["knownActions"], "createRng": () => __m["src/engine/rng.js"]["createRng"], "hashSeed": () => __m["src/engine/rng.js"]["hashSeed"], "migrate": () => __m["src/engine/migrations.js"]["migrate"], "calendar": () => __m["src/engine/calendar.js"], "money": () => __m["src/engine/money.js"], "computeScore": () => __m["src/engine/score.js"]["computeScore"] });
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
function rangeInput(id, value, action, { min = 0, max = 100, step = 1, scale = 1, label = '', display = '', fmt = '' } = {}) {
  return `<label class="field range"><span>${label} <output for="${esc(id)}">${display}</output></span><input type="range" id="${esc(id)}" min="${min}" max="${max}" step="${step}" value="${value / scale}" data-input='${esc(JSON.stringify(action))}' data-scale="${scale}" data-fmt="${esc(fmt)}"></label>`;
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
  // Friterie
  fryer: ['llllllllll', 'lkFFkkFFkl', 'lkFkFFkFkl', 'llllllllll', 'lmmmmmmmml', 'lmRmmmmGml', 'lmmmmmmmml', 'lmmmmmmmml'],
  counter: ['wwwwwwwwwwwwwwwwwwwwwwwwwwww', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'rwwrrwwrrwwrrwwrrwwrrwwrrwwr', 'rwwrrwwrrwwrrwwrrwwrrwwrrwwr', 'RRRRRRRRRRRRRRRRRRRRRRRRRRRR', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrr', 'rrrrrrrrrrrrrrrrrrrrrrrrrrrr'],
  cone: ['.y.y.', 'FyFyF', 'yFyFy', '.www.', '.wRw.', '..w..'],
  menu: ['kkkkkkkkkkkk', 'kwwwwwwwwwwk', 'kwRRwwyyywwk', 'kwwwwwwwwwwk', 'kwyyywwRRwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk'],
  parasol: ['....RRRRRR....', '..RRwwRRwwRR..', '.RwwRRwwRRwwR.', '......dd......', '......dd......', '......dd......', '......dd......', '......dd......', '....dddddd....'],
  table2: ['WWWWWWWW', 'BBBBBBBB', '.B....B.', '.B....B.'],
  // E-commerce
  shelf: ['BBBBBBBBBBBBBB', 'B.ooo..ccc...B', 'BBBBBBBBBBBBBB', 'B..yyy.RR.ggGB', 'BBBBBBBBBBBBBB', 'B.WWW..WWW...B', 'BBBBBBBBBBBBBB', 'B............B', 'B............B'],
  box: ['WWWWWW', 'WBBBBW', 'WWyyWW', 'WWWWWW', 'WWWWWW'],
  laptop: ['.dddddd.', '.dCCCCd.', '.dCCCCd.', 'llllllll'],
  // Artisan
  van: [
    '....wwwwwwwwwwwwwwwwww....',
    '...wwwwwwwwwwwwwwwwwwww...',
    '..wwccccwwwwwwwwwwwwwwww..',
    '.wwwccccwwwwwwwwwwwwwwwww.',
    'wwwwwwwwwwbbbbbbbbbbbwwwww',
    'wwwwwwwwwwbbbbbbbbbbbwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwwwww',
    'mmmmmmmmmmmmmmmmmmmmmmmmmm',
    '..kkkk............kkkk....',
    '..kllk............kllk....',
  ],
  toolbox: ['..dddd..', '.d....d.', 'RRRRRRRR', 'RyRRRRyR', 'RRRRRRRR', 'rrrrrrrr'],
  pipe: ['llllllllllll', 'mmmmmmmmmmmm', '..........ll', '..........mm', '..........ll', '..........mm'],
  // Soutien scolaire
  board: [
    'BBBBBBBBBBBBBBBBBBBBBBBB',
    'BTTTTTTTTTTTTTTTTTTTTTTB',
    'BTwwTTwTwTTTwwwTTTTTTTTB',
    'BTTTTTTTTTTTTTTTTTTTTTTB',
    'BTwTwwTTwwwwTTwTTTwwTTTB',
    'BTTTTTTTTTTTTTTTTTTTTTTB',
    'BTTwwwTT=TTwwTTTTTTTTTTB',
    'BTTTTTTTTTTTTTTTTTTTTTTB',
    'BBBBBBBBBBBBBBBBBBBBBBBB',
  ],
  schoolDesk: ['WWWWWWWWWW', 'BBBBBBBBBB', '.B......B.', '.B......B.', '.B......B.'],
  books: ['RbGyo', 'RbGyo', 'RbGyo', 'BBBBB'],
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

// --- Aide commune ------------------------------------------------------------------

function staffIds(state) {
  const ids = [];
  if (state.staff.founder.active) ids.push('founder');
  for (const e of state.staff.employees) ids.push(e.id);
  return ids;
}

const FOUNDER_LOOK = { x: 'R', y: 'n', z: 'h', q: 's' };

/** Dessine les employés debout à des positions données (petite animation de travail). */
function drawStanding(ctx, state, positions, t, reduced, apron = null) {
  staffIds(state).forEach((id, i) => {
    const p = positions[i];
    if (!p) return;
    const lk = id === 'founder' ? { ...FOUNDER_LOOK } : look(id);
    if (apron) lk.x = apron;
    const act = state.company.capacityUse || 0;
    const frame = !reduced && act > 0.15 && Math.floor(t * 5 + i) % 4 === 0 ? 'person1' : 'person0';
    drawSprite(ctx, frame, p.x, p.y - 11 + (frame === 'person1' ? 0 : 0), lk, i % 2 === 1);
  });
}

// --- Friterie -------------------------------------------------------------------------

const restaurant = {
  wall: 'y',
  floor1: 'w',
  floor2: 'l',
  signColor: 'r',
  doorX: 182,
  doorY: FY + 34,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}`,
  background(b, state) {
    // carrelage mural
    for (let y = 4; y < FY - 2; y += 6) for (let x = 64; x < 176; x += 6) rect(b, x, y, 5, 5, (x + y) % 12 ? 'w' : 'F');
    drawSprite(b, 'menu', 70, 18);
    drawSprite(b, 'menu', 86, 18);
    drawSprite(b, 'fryer', 104, FY - 8);
    drawSprite(b, 'fryer', 116, FY - 8);
    if (hasUpgrade(state, 'friteuse')) drawSprite(b, 'fryer', 128, FY - 8);
    if (hasUpgrade(state, 'chambre_froide')) rect(b, 142, FY - 22, 14, 22, 'l');
    drawSprite(b, 'counter', 64, FY + 8);
    drawSprite(b, 'counter', 92, FY + 8);
    if (hasUpgrade(state, 'salle')) {
      drawSprite(b, 'table2', 12, FY + 30);
      drawSprite(b, 'table2', 30, FY + 36);
    }
    if (hasUpgrade(state, 'terrasse')) drawSprite(b, 'parasol', 150, FY + 22);
    if (hasUpgrade(state, 'enseigne')) rect(b, 64, 2, 2, 12, 'R');
    drawSprite(b, 'plant', 2, FY - 6);
  },
  animate(ctx, state, t, reduced) {
    const pos = [];
    for (let i = 0; i < 8; i++) pos.push({ x: 70 + i * 13, y: FY + 6 });
    drawStanding(ctx, state, pos, t, reduced, 'w');
    // vapeur des friteuses
    if (!reduced && (state.company.capacityUse || 0) > 0.1) {
      for (let i = 0; i < 3; i++) {
        const yy = FY - 12 - ((t * 10 + i * 5) % 14);
        rect(ctx, 108 + i * 6, Math.round(yy), 1, 2, 'w');
      }
    }
    const t0 = state.sector.today;
    if (t0 && t0.served > 0) drawSprite(ctx, 'cone', 96, FY + 2);
    // file d'attente quand des clients repartent faute de capacité
    if (t0 && t0.lostQueue > 0) {
      const n = Math.min(6, 1 + Math.floor(t0.lostQueue / 5));
      for (let i = 0; i < n; i++) drawSprite(ctx, 'person0', 160 - i * 9, FY + 44, look(`q${i}`));
    }
  },
  target(state, i) {
    return { x: 76 + (i % 6) * 9, y: FY + 32 + (i % 2) * 6 };
  },
  coinSpot() {
    return { x: 96, y: FY + 4 };
  },
  icon(ctx) {
    rect(ctx, 8, 4, 16, 6, 'y');
    for (let i = 0; i < 6; i++) rect(ctx, 9 + i * 2, 2 + (i % 2), 1, 8, 'F');
    rect(ctx, 6, 10, 20, 4, 'w');
    rect(ctx, 8, 14, 16, 14, 'R');
    rect(ctx, 10, 16, 12, 2, 'w');
    rect(ctx, 10, 20, 12, 2, 'w');
  },
};

// --- E-commerce ---------------------------------------------------------------------

const ecommerce = {
  wall: 'm',
  floor1: 'd',
  floor2: 'm',
  signColor: 'G',
  doorX: 182,
  doorY: FY + 34,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}|${Math.min(6, Math.round(Object.values(s.sector.stock).reduce((a, b) => a + b, 0) / 60))}`,
  background(b, state) {
    const big = hasUpgrade(state, 'entrepot');
    const shelves = big ? 5 : hasUpgrade(state, 'garage') ? 3 : 2;
    for (let i = 0; i < shelves; i++) drawSprite(b, 'shelf', 66 + i * 18, FY - 9);
    const stock = Object.values(state.sector.stock).reduce((a, c) => a + c, 0);
    const boxes = Math.min(18, Math.round(stock / 20));
    for (let i = 0; i < boxes; i++) drawSprite(b, 'box', 66 + (i % 9) * 7, FY + 34 - Math.floor(i / 9) * 5);
    drawSprite(b, 'table', 12, FY + 18);
    drawSprite(b, 'laptop', 16, FY + 14);
    if (hasUpgrade(state, 'logistique_3pl')) drawSprite(b, 'van', 150, FY + 20, { b: 'G' });
  },
  animate(ctx, state, t, reduced) {
    const pos = [{ x: 22, y: FY + 18 }];
    for (let i = 0; i < 10; i++) pos.push({ x: 70 + (i % 6) * 15, y: FY + 22 + Math.floor(i / 6) * 14 });
    drawStanding(ctx, state, pos, t, reduced);
    // colis qui partent
    const n = state.sector.today.shipped || 0;
    if (!reduced && n > 0) {
      const k = Math.min(4, Math.ceil(n / 10));
      for (let i = 0; i < k; i++) {
        const x = 120 + (((t * 25) + i * 18) % 60);
        drawSprite(ctx, 'box', Math.round(x), FY + 40);
      }
    }
  },
  target(state, i) {
    return { x: 150 + (i % 3) * 6, y: FY + 34 };
  },
  coinSpot() {
    return { x: 24, y: FY + 8 };
  },
  icon(ctx) {
    rect(ctx, 4, 10, 24, 18, 'W');
    rect(ctx, 4, 10, 24, 4, 'B');
    rect(ctx, 14, 10, 4, 18, 'y');
    rect(ctx, 22, 4, 8, 6, 'G');
    rect(ctx, 24, 2, 4, 2, 'G');
  },
};

// --- Artisan -------------------------------------------------------------------------

const artisan = {
  wall: 'W',
  floor1: 'm',
  floor2: 'd',
  signColor: 'b',
  doorX: 182,
  doorY: FY + 34,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}`,
  background(b, state) {
    // établi et outils au mur
    rect(b, 66, 26, 60, 3, 'B');
    for (let i = 0; i < 7; i++) rect(b, 70 + i * 8, 18, 2, 8, i % 2 ? 'l' : 'm');
    drawSprite(b, 'pipe', 130, 20);
    drawSprite(b, 'toolbox', 70, FY - 6);
    drawSprite(b, 'table', 80, FY + 6);
    const vans = 1 + (hasUpgrade(state, 'camionnette2') ? 1 : 0) + (hasUpgrade(state, 'camionnette3') ? 2 : 0);
    for (let i = 0; i < Math.min(vans, 3); i++) drawSprite(b, 'van', 8 + i * 30, FY + 30, hasUpgrade(state, 'lettrage') ? { b: 'R' } : null);
    drawSprite(b, 'plant', 2, FY - 6);
  },
  animate(ctx, state, t, reduced) {
    // les ouvriers sont « sur chantier » quand ils travaillent : on n'en montre que quelques-uns à l'atelier
    const act = state.company.capacityUse || 0;
    const pos = [{ x: 90, y: FY + 6 }, { x: 108, y: FY + 6 }, { x: 126, y: FY + 18 }, { x: 140, y: FY + 18 }];
    const ids = staffIds(state);
    const inShop = Math.max(1, Math.round(ids.length * (1 - act * 0.7)));
    ids.slice(0, Math.min(inShop, pos.length)).forEach((id, i) => {
      const lk = id === 'founder' ? { ...FOUNDER_LOOK, x: 'b' } : { ...look(id), x: 'b' };
      const frame = !reduced && act > 0.15 && Math.floor(t * 5 + i) % 4 === 0 ? 'person1' : 'person0';
      drawSprite(ctx, frame, pos[i].x, pos[i].y - 11, lk);
    });
    // camionnette qui part / revient
    if (!reduced && act > 0.3) {
      const x = 190 - ((t * 20) % 260);
      drawSprite(ctx, 'van', Math.round(x), FY + 44, hasUpgrade(state, 'lettrage') ? { b: 'R' } : null);
    }
  },
  target(state, i) {
    return { x: 120 + (i % 3) * 8, y: FY + 34 };
  },
  coinSpot() {
    return { x: 30, y: FY + 26 };
  },
  icon(ctx) {
    rect(ctx, 6, 22, 20, 6, 'm');
    rect(ctx, 14, 6, 4, 18, 'l');
    rect(ctx, 10, 4, 12, 4, 'l');
    rect(ctx, 8, 2, 4, 4, 'l');
    rect(ctx, 20, 2, 4, 4, 'l');
    rect(ctx, 22, 20, 6, 8, 'R');
  },
};

// --- Soutien scolaire -------------------------------------------------------------------

const soutien = {
  wall: 'G',
  floor1: 'W',
  floor2: 'B',
  signColor: 'p',
  doorX: 182,
  doorY: FY + 34,
  layoutKey: (s) => `${s.staff.employees.length}|${s.staff.founder.active}|${Math.min(12, Math.round(s.sector.students / 6))}`,
  background(b, state) {
    drawSprite(b, 'board', 70, 16);
    if (hasUpgrade(state, 'tableaux')) rect(b, 96, 18, 22, 12, 'C');
    drawSprite(b, 'books', 150, FY - 4);
    drawSprite(b, 'books', 156, FY - 4);
    const desks = Math.min(12, Math.max(2, Math.round(state.sector.students / 6)));
    for (let i = 0; i < desks; i++) drawSprite(b, 'schoolDesk', 66 + (i % 6) * 18, FY + 14 + Math.floor(i / 6) * 16);
    drawSprite(b, 'plant', 2, FY - 6);
  },
  animate(ctx, state, t, reduced) {
    // élèves assis
    const desks = Math.min(12, Math.max(2, Math.round(state.sector.students / 6)));
    const seated = Math.min(desks * 2, Math.ceil(state.sector.students / 3));
    for (let i = 0; i < seated; i++) {
      const d = i % desks;
      const x = 67 + (d % 6) * 18 + (i >= desks ? 5 : 0);
      const y = FY + 14 + Math.floor(d / 6) * 16;
      const bob = !reduced && Math.floor(t * 2 + i) % 7 === 0 ? 1 : 0;
      drawSprite(ctx, 'sitting', x, y - 6 + bob, look(`el${i}`));
    }
    // profs au tableau
    const pos = [{ x: 64, y: FY + 6 }, { x: 122, y: FY + 6 }, { x: 140, y: FY + 6 }, { x: 40, y: FY + 20 }];
    drawStanding(ctx, state, pos, t, reduced);
  },
  target(state, i) {
    return { x: 30 + (i % 3) * 8, y: FY + 36 };
  },
  coinSpot() {
    return { x: 90, y: FY - 6 };
  },
  icon(ctx) {
    rect(ctx, 4, 6, 24, 18, 'B');
    rect(ctx, 6, 8, 20, 14, 'T');
    rect(ctx, 8, 10, 10, 1, 'w');
    rect(ctx, 8, 13, 14, 1, 'w');
    rect(ctx, 8, 16, 8, 1, 'w');
    rect(ctx, 10, 24, 12, 4, 'R');
  },
};

const DECOR = { agence, restaurant, ecommerce, artisan, soutien };
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

// ---- src/ui/sectorui/restaurant.js ----
__m["src/ui/sectorui/restaurant.js"] = (function () {
const __exports = {};
__def(__exports, { "renderSector": () => renderSector });
// Contrôles de la friterie (onglet Entreprise).

const { eurInput, selectInput, rangeInput, bar, help } = __m["src/ui/dom.js"];
const { eur, num } = __m["src/ui/format.js"];
const { RESTAURANT: D } = __m["src/data/sectors/restaurant.js"];
const { capacities, stockQty, unitCost, blendedVat } = __m["src/engine/sectors/restaurant.js"];
const { formatDate } = __m["src/engine/calendar.js"];

function renderSector(state) {
  const s = state.sector;
  const caps = capacities(state);
  const t = s.today;
  return `
  <section class="card-block">
    <h3>Ta carte</h3>
    <div class="form-row">
      ${eurInput('price', s.price, { type: 'sector', name: 'setPrice' }, { min: D.minPrice / 100, max: D.maxPrice / 100, step: 0.1, label: `Ticket moyen TTC (marché ≈ ${eur(D.refPrice)})` })}
      ${selectInput('ingredient', String(s.ingredient), D.ingredients.map((i) => ({ value: String(i.level), label: `${i.label} — ${eur(i.cost)}/portion` })), { type: 'sector', name: 'setIngredient' }, { label: 'Qualité des ingrédients' })}
    </div>
    <p class="small muted">TVA moyenne du ticket : ${num(blendedVat() * 100, 1)} % (repas 12 %, boissons 21 %) ${help('TVA')} · coût matière actuel ${eur(unitCost(state))}/portion (${num((unitCost(state) / (s.price / (1 + blendedVat()))) * 100)} % du prix HT).</p>
  </section>
  <section class="card-block">
    <h3>Stock périssable</h3>
    ${rangeInput('stockdays', s.stockDays * 100, { type: 'sector', name: 'setStockDays' }, { min: 50, max: 400, step: 10, scale: 1, label: 'Commande quotidienne : jours de ventes à couvrir', display: `${num(s.stockDays, 1)} j`, fmt: 'days100' })}
    <p class="small">En stock : <strong>${stockQty(state)}</strong> portions (périment après ${D.shelfLife} jours) · gaspillées au total : ${s.stats.wasted} · ventes perdues (rupture ou file) : ${s.stats.lost}</p>
    <p class="small muted">Trop bas = ruptures et clients perdus ; trop haut = gaspillage. Le lundi est jour de fermeture.</p>
  </section>
  <section class="card-block">
    <h3>Service d'hier ${s.closedUntil > state.time.day ? `<span class="tag warn">Fermé jusqu’au ${formatDate(s.closedUntil)}</span>` : ''}</h3>
    <p>${t.served} clients servis sur ${t.demand} venus · ${t.lostQueue} partis à cause de la file · ${t.lostStock} faute de stock.</p>
    <p class="small">Capacité : cuisine ${num(caps.kitchen)} · comptoir ${num(caps.counter)} clients/jour → <strong>${num(caps.total)}</strong>.</p>
  </section>
  <section class="card-block">
    <h3>Hygiène ${help('AFSCA')}</h3>
    <p>${bar(s.hygiene, 100, s.hygiene < 55 ? 'bad' : '')} <strong>${num(s.hygiene)}/100</strong> ${s.hygiene < 55 ? '<span class="bad">— risque de sanction AFSCA !</span>' : ''}</p>
    ${eurInput('cleaning', s.cleaning, { type: 'sector', name: 'setCleaning' }, { min: 0, max: 5000, step: 10, label: 'Budget nettoyage mensuel HT' })}
  </section>`;
}
return __exports;
})();

// ---- src/ui/sectorui/ecommerce.js ----
__m["src/ui/sectorui/ecommerce.js"] = (function () {
const __exports = {};
__def(__exports, { "renderSector": () => renderSector });
// Contrôles de l'e-commerce (onglet Entreprise).

const { esc, actBtn, eurInput, help } = __m["src/ui/dom.js"];
const { eur, num, pct } = __m["src/ui/format.js"];
const { ECOMMERCE: D } = __m["src/data/sectors/ecommerce.js"];
const { slots, cpc, orderCapacity } = __m["src/engine/sectors/ecommerce.js"];
const { formatDate } = __m["src/engine/calendar.js"];

function renderSector(state) {
  const s = state.sector;
  const t = s.today;
  const rows = D.products
    .map((p) => {
      const listed = s.listed.includes(p.id);
      const inbound = s.pos.filter((x) => x.id === p.id);
      const ht = s.prices[p.id] / (1 + p.vat);
      const margin = ht - p.cost - p.ship - D.packing;
      return `<li class="row ${listed ? '' : 'dim'}">
        <div class="grow"><strong>${esc(p.label)}</strong> ${listed ? '<span class="tag good">en ligne</span>' : ''}<br>
        <span class="small">Achat ${eur(p.cost)} HT · prix conseillé ${eur(p.ref)} TTC · TVA ${pct(p.vat)} · retours ≈ ${pct(p.returns)} · marge/commande ≈ <span class="${margin > 0 ? 'good' : 'bad'}">${eur(Math.round(margin))}</span> (hors pub)</span><br>
        <span class="small">Stock : <strong>${s.stock[p.id] || 0}</strong>${inbound.length ? ` · en route : ${inbound.map((x) => `${x.qty} (le ${formatDate(x.arrive)})`).join(', ')}` : ''}</span></div>
        ${listed ? eurInput(`price-${p.id}`, s.prices[p.id], { type: 'sector', name: 'setProductPrice', id: p.id }, { min: 1, max: 999, step: 0.1, label: 'Prix TTC' }) : ''}
        <div class="btns">
          ${listed ? actBtn('Retirer', { type: 'sector', name: 'unlistProduct', id: p.id }, { cls: 'btn-small' }) : actBtn('Mettre en ligne', { type: 'sector', name: 'listProduct', id: p.id }, { cls: 'btn-small', disabled: s.listed.length >= slots(state) })}
          ${actBtn('Commander 50', { type: 'sector', name: 'orderStock', id: p.id, qty: 50 }, { cls: 'btn-small', title: `≈ ${eur(Math.round(p.cost * 50 * (1 + p.vat)), { decimals: false })} TTC, livré en ${D.leadTime} jours` })}
        </div></li>`;
    })
    .join('');
  return `
  <section class="card-block">
    <h3>Entonnoir de vente ${help('Taux de conversion')}</h3>
    <p>${t.visitors} visiteurs hier (${t.organic} gratuits, ${t.paid} payés à ${eur(Math.round(cpc(state)))}/clic) → conversion ${pct(t.conversion, 1)} → <strong>${t.orders}</strong> commandes${t.lostStock ? `, <span class="bad">${t.lostStock} perdues (rupture)</span>` : ''}.</p>
    <p class="small muted">Le budget marketing (plus bas) = ta publicité en ligne. Coût d'acquisition et panier moyen : surveille-les ${help('Coût d’acquisition client')}.</p>
    <p class="small">Préparation : ${num(orderCapacity(state))} commandes/jour · à expédier : ${s.backlog}${s.backlog > orderCapacity(state) ? ' <span class="bad">(retards !)</span>' : ''}.</p>
  </section>
  <section class="card-block">
    <h3>Réapprovisionnement</h3>
    <label class="check"><input type="checkbox" ${s.reorder ? 'checked' : ''} data-input='${esc(JSON.stringify({ type: 'sector', name: 'setReorder' }))}' data-raw="1" data-checkbox="1"> Commandes fournisseur automatiques (point de commande)</label>
    <label class="field"><span>Jours de ventes commandés à chaque réassort : ${s.coverDays}</span><input type="number" min="7" max="90" value="${s.coverDays}" data-input='${esc(JSON.stringify({ type: 'sector', name: 'setCoverDays' }))}' data-scale="1"></label>
    <p class="small muted">Le stock est payé à la commande et arrive après ≈ ${D.leadTime} jours : c'est de la trésorerie immobilisée ${help('Besoin en fonds de roulement')}.</p>
  </section>
  <section class="card-block">
    <h3>Catalogue (${s.listed.length}/${slots(state)} produits en ligne)</h3>
    <ul class="list">${rows}</ul>
  </section>`;
}
return __exports;
})();

// ---- src/ui/sectorui/artisan.js ----
__m["src/ui/sectorui/artisan.js"] = (function () {
const __exports = {};
__def(__exports, { "renderSector": () => renderSector });
// Contrôles de l'artisan (onglet Entreprise).

const { esc, eurInput, selectInput, rangeInput, bar, help } = __m["src/ui/dom.js"];
const { eur, num, pct } = __m["src/ui/format.js"];
const { ARTISAN: D } = __m["src/data/sectors/artisan.js"];
const { workforce, backlogDays, metier, vans } = __m["src/engine/sectors/artisan.js"];
const { formatDate } = __m["src/engine/calendar.js"];

function renderSector(state) {
  const s = state.sector;
  const m = metier(state);
  const quotes = s.quotes
    .slice(0, 8)
    .map((q) => `<li class="row"><div class="grow"><strong>${esc(q.label)}</strong> — devis ${eur(q.price, { decimals: false })} HT (TVA ${pct(q.vat)})<br><span class="small muted">Réponse du client le ${formatDate(q.decide)} · chances ≈ ${pct(q.p)}</span></div></li>`)
    .join('');
  const jobs = s.jobs
    .slice(0, 10)
    .map((j) => `<li class="row"><div class="grow"><strong>${esc(j.label)}</strong>${j.urgent ? ' <span class="tag warn">urgent</span>' : ''} — ${eur(j.price, { decimals: false })} HT<br>${bar(j.daysDone, j.daysTotal)} <span class="small muted">${num(j.daysDone, 1)} / ${num(j.daysTotal, 1)} jour(s)-homme · matériel ${eur(j.materials, { decimals: false })}${j.matPaid ? ' (payé)' : ''}</span></div></li>`)
    .join('');
  return `
  <section class="card-block">
    <h3>${esc(m.label)} — tes tarifs</h3>
    <div class="form-row">
      ${eurInput('rate', s.rate, { type: 'sector', name: 'setRate' }, { min: D.minRate / 100, max: D.maxRate / 100, label: `Taux horaire HT (marché ≈ ${eur(D.refRate, { decimals: false })})` })}
      ${rangeInput('margin', Math.round(s.margin * 100), { type: 'sector', name: 'setMargin' }, { min: 0, max: 60, step: 1, label: 'Marge sur le matériel', display: `${Math.round(s.margin * 100)} %`, fmt: 'pct' })}
      ${selectInput('policy', s.policy, [{ value: 'capacite', label: 'Ne pas faire de devis si carnet plein' }, { value: 'tout', label: 'Répondre à toutes les demandes' }], { type: 'sector', name: 'setPolicy' }, { label: 'Demandes' })}
    </div>
    <p class="small muted">TVA à 6 % pour la rénovation d'un logement privé de plus de 10 ans, sinon 21 % ${help('TVA')}. Les dépannages sont payés sur place, les chantiers à 30 jours.</p>
    <p class="small">Équipe : ${num(workforce(state), 1)} jour(s)-homme par jour ouvré · ${vans(state)} camionnette(s) (2 ouvriers par camionnette) · carnet : ${num(backlogDays(state), 1)} jours-homme · bouche-à-oreille : ${num(s.wom, 1)} · contrats d'entretien : ${s.contracts}.</p>
  </section>
  <section class="card-block">
    <h3>Devis en attente (${s.quotes.length})</h3>
    ${quotes ? `<ul class="list">${quotes}</ul>` : '<p class="muted">Aucun devis en attente.</p>'}
  </section>
  <section class="card-block">
    <h3>Planning des chantiers (${s.jobs.length})</h3>
    ${jobs ? `<ul class="list">${jobs}</ul>` : '<p class="muted">Aucun chantier planifié.</p>'}
  </section>`;
}
return __exports;
})();

// ---- src/ui/sectorui/soutien.js ----
__m["src/ui/sectorui/soutien.js"] = (function () {
const __exports = {};
__def(__exports, { "renderSector": () => renderSector });
// Contrôles du centre de soutien scolaire (onglet Entreprise).

const { eurInput, rangeInput, help } = __m["src/ui/dom.js"];
const { eur, num, pct } = __m["src/ui/format.js"];
const { SOUTIEN: D } = __m["src/data/sectors/soutien.js"];
const { capacity, expectedSuccess } = __m["src/engine/sectors/soutien.js"];
const { formatDate, MONTH_NAMES } = __m["src/engine/calendar.js"];

function renderSector(state) {
  const s = state.sector;
  const cap = capacity(state);
  const res = s.results.slice(-4).reverse();
  return `
  <section class="card-block">
    <h3>Ton offre</h3>
    <div class="form-row">
      ${eurInput('price', s.price, { type: 'sector', name: 'setPrice' }, { min: D.minPrice / 100, max: D.maxPrice / 100, label: `Abonnement mensuel TTC (marché ≈ ${eur(D.refPrice, { decimals: false })})` })}
      ${rangeInput('group', s.groupSize, { type: 'sector', name: 'setGroupSize' }, { min: D.groupSize.min, max: D.groupSize.max, step: 1, label: 'Élèves par groupe', display: `${s.groupSize}` })}
    </div>
    <p class="small muted">Petits groupes = meilleurs résultats mais moins d'élèves par enseignant. TVA à 21 % dans le jeu (exemption possible selon les cas) ${help('TVA')}.</p>
  </section>
  <section class="card-block">
    <h3>Élèves</h3>
    <p><strong>${s.students}</strong> inscrits · capacité ${cap.total} (enseignants : ${cap.teach}, places : ${cap.seats})${s.discounted ? ` · dont ${s.discounted} au tarif partenaire` : ''}.</p>
    <p class="small">Réussite attendue aux prochains examens : <strong>${pct(expectedSuccess(state))}</strong>. Sessions fin janvier et fin juin ; en juin, ≈ ${Math.round(D.yearEndChurn * 100)} % des élèves partent (fin d'année).</p>
    <p class="small muted">Inscriptions fortes en ${MONTH_NAMES[8]}, avant les examens (décembre, mai) ; creux en ${MONTH_NAMES[6]}.</p>
  </section>
  ${res.length ? `<section class="card-block"><h3>Résultats</h3><ul class="small">${res.map((r) => `<li>${formatDate(r.day)} : ${pct(r.success)} de réussite (${r.students} élèves)</li>`).join('')}</ul></section>` : ''}`;
}
return __exports;
})();

// ---- src/ui/sectorui/index.js ----
__m["src/ui/sectorui/index.js"] = (function () {
const __exports = {};
__def(__exports, { "SECTOR_UI": () => SECTOR_UI });
// Interfaces propres à chaque secteur.

const agence = __m["src/ui/sectorui/agence.js"];
const restaurant = __m["src/ui/sectorui/restaurant.js"];
const ecommerce = __m["src/ui/sectorui/ecommerce.js"];
const artisan = __m["src/ui/sectorui/artisan.js"];
const soutien = __m["src/ui/sectorui/soutien.js"];

const SECTOR_UI = { agence, restaurant, ecommerce, artisan, soutien };
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

// ---- src/ui/charts.js ----
__m["src/ui/charts.js"] = (function () {
const __exports = {};
__def(__exports, { "drawLines": () => drawLines, "drawBars": () => drawBars, "drawColumns": () => drawColumns, "legend": () => legend });
// Graphiques légers dessinés sur canvas, sans bibliothèque.
// Le canvas est redimensionné à sa taille affichée × devicePixelRatio pour
// rester net ; les couleurs suivent la palette du jeu.

const { eurShort, pct: fmtPct, num } = __m["src/ui/format.js"];

const AXIS = '#566c86';
const TEXT = '#94b0c2';
const GRID = '#29366f';
const FONT = '11px ui-monospace, Menlo, Consolas, monospace';

function setup(canvas) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = Math.round((cssW * canvas.height) / canvas.width) || canvas.height;
  if (!canvas.dataset.baseH) {
    canvas.dataset.baseW = canvas.width;
    canvas.dataset.baseH = canvas.height;
  }
  const ratio = Number(canvas.dataset.baseH) / Number(canvas.dataset.baseW);
  const h = Math.round(cssW * ratio);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, h);
  ctx.font = FONT;
  return { ctx, w: cssW, h };
}

function niceStep(range) {
  const raw = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9))));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}

/**
 * Courbes.
 * @param {HTMLCanvasElement} canvas
 * @param {{labels:string[], series:{name:string, color:string, values:number[], dashed?:boolean}[]}} data
 * @param {{format?:'eur'|'pct'|'num', zero?:boolean}} opts
 */
function drawLines(canvas, data, opts = {}) {
  const { ctx, w, h } = setup(canvas);
  const fmt = opts.format === 'pct' ? (v) => fmtPct(v) : opts.format === 'num' ? (v) => num(v) : (v) => eurShort(v);
  const padL = 58;
  const padR = 10;
  const padT = 10;
  const padB = 22;
  const all = data.series.flatMap((s) => s.values).filter(Number.isFinite);
  if (!all.length) {
    ctx.fillStyle = TEXT;
    ctx.fillText('Pas encore de données', padL, h / 2);
    return;
  }
  let min = Math.min(...all, opts.zero === false ? Infinity : 0);
  let max = Math.max(...all, opts.zero === false ? -Infinity : 0);
  if (min === max) max = min + 1;
  const step = niceStep(max - min);
  min = Math.floor(min / step) * step;
  max = Math.ceil(max / step) * step;
  const n = Math.max(...data.series.map((s) => s.values.length));
  const x = (i) => padL + (n <= 1 ? 0 : (i * (w - padL - padR)) / (n - 1));
  const y = (v) => padT + (1 - (v - min) / (max - min)) * (h - padT - padB);
  // Grille
  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  ctx.fillStyle = TEXT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let v = min; v <= max + step / 2; v += step) {
    const yy = Math.round(y(v)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(padL, yy);
    ctx.lineTo(w - padR, yy);
    ctx.stroke();
    ctx.fillText(fmt(v), padL - 4, yy);
  }
  if (min < 0 && max > 0) {
    ctx.strokeStyle = AXIS;
    ctx.beginPath();
    ctx.moveTo(padL, Math.round(y(0)) + 0.5);
    ctx.lineTo(w - padR, Math.round(y(0)) + 0.5);
    ctx.stroke();
  }
  // Étiquettes X (quelques-unes)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const every = Math.max(1, Math.ceil(n / 6));
  for (let i = 0; i < n; i += every) if (data.labels[i]) ctx.fillText(data.labels[i], x(i), h - padB + 6);
  // Séries
  for (const s of data.series) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.setLineDash(s.dashed ? [4, 3] : []);
    ctx.beginPath();
    let started = false;
    s.values.forEach((v, i) => {
      if (!Number.isFinite(v)) return;
      if (!started) ctx.moveTo(x(i), y(v));
      else ctx.lineTo(x(i), y(v));
      started = true;
    });
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

/** Barres horizontales (ex. parts de marché). items = [{label, value, color}] */
function drawBars(canvas, items, opts = {}) {
  const { ctx, w, h } = setup(canvas);
  const padL = 110;
  const rowH = Math.min(24, (h - 6) / Math.max(1, items.length));
  const max = Math.max(...items.map((i) => i.value), 1e-9);
  ctx.textBaseline = 'middle';
  items.forEach((it, i) => {
    const yy = 4 + i * rowH;
    ctx.fillStyle = TEXT;
    ctx.textAlign = 'right';
    ctx.fillText(it.label, padL - 6, yy + rowH / 2);
    const bw = Math.max(1, ((w - padL - 60) * it.value) / max);
    ctx.fillStyle = it.color;
    ctx.fillRect(padL, yy + 3, bw, rowH - 6);
    ctx.fillStyle = '#f4f4f4';
    ctx.textAlign = 'left';
    ctx.fillText(opts.pct ? fmtPct(it.value) : eurShort(it.value), padL + bw + 6, yy + rowH / 2);
  });
}

/** Barres verticales empilées (ex. composition du revenu passif). */
function drawColumns(canvas, data, opts = {}) {
  const { ctx, w, h } = setup(canvas);
  const padL = 58;
  const padB = 22;
  const padT = 8;
  const n = data.labels.length;
  if (!n) return;
  const totals = data.labels.map((_, i) => data.series.reduce((s, se) => s + Math.max(0, se.values[i] || 0), 0));
  const max = Math.max(...totals, opts.target || 0, 1);
  const bw = Math.max(2, (w - padL - 10) / n - 2);
  const y = (v) => padT + (1 - v / max) * (h - padT - padB);
  ctx.fillStyle = TEXT;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(eurShort(max), padL - 4, padT);
  ctx.fillText(eurShort(0), padL - 4, h - padB);
  data.labels.forEach((lab, i) => {
    let acc = 0;
    const xx = padL + i * (bw + 2);
    for (const se of data.series) {
      const v = Math.max(0, se.values[i] || 0);
      if (!v) continue;
      ctx.fillStyle = se.color;
      ctx.fillRect(xx, y(acc + v), bw, y(acc) - y(acc + v));
      acc += v;
    }
  });
  if (opts.target) {
    ctx.strokeStyle = '#ffcd75';
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, y(opts.target));
    ctx.lineTo(w - 4, y(opts.target));
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const every = Math.max(1, Math.ceil(n / 6));
  for (let i = 0; i < n; i += every) ctx.fillText(data.labels[i], padL + i * (bw + 2) + bw / 2, h - padB + 6);
}

/** Légende HTML pour un graphique. */
function legend(series) {
  return `<div class="chart-legend">${series.map((s) => `<span style="--c:${s.color}">${s.name}</span>`).join('')}</div>`;
}
return __exports;
})();

// ---- src/ui/panels/marche.js ----
__m["src/ui/panels/marche.js"] = (function () {
const __exports = {};
__def(__exports, { "panel": () => panel });
// Onglet Marché : concurrents, parts de marché, conjoncture.

const { esc, help } = __m["src/ui/dom.js"];
const { pct, num } = __m["src/ui/format.js"];
const { STRATEGIES } = __m["src/data/competitors.js"];
const { ECONOMY } = __m["src/data/economy.js"];
const { playerPriceIndex } = __m["src/engine/systems/competitors.js"];
const { drawBars } = __m["src/ui/charts.js"];

const panel = {
  id: 'marche',
  label: 'Marché',
  icon: '📈',
  render(state) {
    const comps = state.competitors;
    const pa = state.company.attraction || 0;
    const total = pa + comps.reduce((s, c) => s + (c.attraction || 0), 0) + ECONOMY.outsideOption;
    const playerShare = total ? pa / total : 0;
    const rows = comps
      .map((c) => {
        const st = STRATEGIES[c.strategy];
        const promo = c.promoUntil > state.time.day;
        return `<tr class="${c.alive ? '' : 'dim'}"><td><strong>${esc(c.name)}</strong>${c.alive ? '' : ' <span class="bad">(faillite)</span>'}${promo ? ' <span class="tag warn">promo</span>' : ''}<br><span class="small muted" title="${esc(st.desc)}">${esc(st.label)}</span></td>
          <td class="num">${num(c.priceIdx * 100)}</td><td class="num">${num(c.quality * 100)}</td><td class="num">${num(c.reputation)}</td><td class="num">${pct(c.alive ? c.share : 0)}</td></tr>`;
      })
      .join('');
    return `
    <section class="card-block">
      <h3>Parts de marché ${help('Part de marché')}</h3>
      <canvas id="share-chart" class="chart" width="560" height="160" aria-label="Graphique des parts de marché"></canvas>
      <p class="small muted">« Hors marché » = clients qui renoncent ou vont ailleurs (${pct(ECONOMY.outsideOption / total)}).</p>
    </section>
    <section class="card-block">
      <h3>Concurrents</h3>
      <table class="table"><thead><tr><th>Nom</th><th class="num" title="100 = prix du marché">Prix</th><th class="num" title="100 = qualité moyenne">Qualité</th><th class="num">Réput.</th><th class="num">Part</th></tr></thead>
      <tbody><tr><td><strong>${esc(state.meta.companyName)}</strong> <span class="tag good">toi</span></td><td class="num">${num(playerPriceIndex(state) * 100)}</td><td class="num">${num(state.company.quality * 100)}</td><td class="num">${num(state.company.reputation)}</td><td class="num">${pct(playerShare)}</td></tr>${rows}</tbody></table>
      <p class="small muted">Chaque concurrent suit une stratégie : bas prix, premium, marketing agressif ou suiveur. Ils réagissent à tes parts de marché et peuvent faire faillite.</p>
    </section>
    <section class="card-block">
      <h3>Conjoncture</h3>
      <p>Indice économique : <strong>${num(state.world.economy * 100)}</strong> (100 = normal) · taux directeur BCE simulé : ${(state.world.baseRate * 100).toFixed(2).replace('.', ',')} %</p>
      ${state.modifiers.filter((m) => m.label).length ? `<h4>Effets en cours</h4><ul class="small">${state.modifiers.filter((m) => m.label).map((m) => `<li>${esc(m.label)} : ${m.mult !== 1 ? `${m.mult > 1 ? '+' : '−'}${Math.abs(Math.round((m.mult - 1) * 100))} % ` : ''}(${esc(m.key)}) jusqu'au jour ${m.until}</li>`).join('')}</ul>` : ''}
    </section>`;
  },
  mount(el, state) {
    const cv = el.querySelector('#share-chart');
    if (!cv) return;
    const pa = state.company.attraction || 0;
    const comps = state.competitors.filter((c) => c.alive);
    const total = pa + comps.reduce((s, c) => s + c.attraction, 0) + ECONOMY.outsideOption;
    drawBars(cv, [
      { label: 'Toi', value: pa / total, color: '#a7f070' },
      ...comps.map((c, i) => ({ label: c.name.slice(0, 14), value: c.attraction / total, color: ['#ef7d57', '#41a6f6', '#b13e53', '#ffcd75', '#73eff7'][i % 5] })),
      { label: 'Hors marché', value: ECONOMY.outsideOption / total, color: '#566c86' },
    ], { pct: true });
  },
};
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

// ---- src/ui/panels/investissements.js ----
__m["src/ui/panels/investissements.js"] = (function () {
const __exports = {};
__def(__exports, { "panel": () => panel });
// Onglet Investissements : revenu passif, épargne, bourse, immobilier.

const { esc, help, actBtn, bar } = __m["src/ui/dom.js"];
const { eur, pct } = __m["src/ui/format.js"];
const { INVESTMENTS: I } = __m["src/data/investments.js"];
const { savingsRate, tradeFees, propertyQuote, mortgageRate } = __m["src/engine/systems/investments.js"];
const { passiveIncome } = __m["src/engine/selectors.js"];
const { hasManager } = __m["src/engine/systems/staff.js"];
const { drawLines } = __m["src/ui/charts.js"];
const { PART_LABELS } = __m["src/ui/screens/end.js"];
const { toast } = __m["src/ui/toast.js"];

const form = { amount: 100_000, down: 0.2 };

function amountField() {
  return `<label class="field"><span>Montant (€)</span><input type="number" id="inv-amount" min="100" step="100" value="${form.amount / 100}"></label>`;
}

const panel = {
  id: 'investissements',
  label: 'Placements',
  icon: '💹',
  render(state) {
    const inv = state.investments;
    const p = passiveIncome(state);
    const parts = Object.entries(p.parts);
    const gainEtf = inv.etf.value - inv.etf.basis;
    const gainSt = inv.stocks.value - inv.stocks.basis;
    const manager = hasManager(state);
    const props = inv.realEstate
      .map((x) => {
        const occupied = x.vacantUntil <= state.time.day;
        return `<li class="row"><div class="grow"><strong>${esc(x.label)}</strong> ${occupied ? '<span class="tag good">loué</span>' : '<span class="tag warn">vide</span>'}<br>
          <span class="small">Valeur ${eur(x.value, { decimals: false })} · loyer ${eur(x.rent, { decimals: false })}/mois · crédit restant ${eur(x.mortgage.remaining, { decimals: false })} (mensualité ${eur(x.mortgage.payment, { decimals: false })})</span></div>
          <button type="button" class="btn btn-small" data-act='${esc(JSON.stringify({ type: 'sellProperty', id: x.id }))}' data-confirm="Vendre ce bien ? (frais d'agence 3 %)">Vendre</button></li>`;
      })
      .join('');
    const catalog = I.realEstate.catalog
      .map((c) => {
        const q = propertyQuote(state, c, form.down);
        const yieldGross = (c.rent * 12) / c.price;
        const cashflow = c.rent - (c.price * (c.maintenance || I.realEstate.maintenancePct)) / 12 - c.rent / 12 - q.payment - c.rent * 0.08;
        return `<li class="row"><div class="grow"><strong>${esc(c.label)}</strong> — ${eur(c.price, { decimals: false })}<br>
          <span class="small">Loyer ${eur(c.rent, { decimals: false })}/mois · rendement brut ${pct(yieldGross, 1)} · à payer : ${eur(q.cash, { decimals: false })} (dont ${eur(q.fees, { decimals: false })} de droits et notaire) · crédit ${eur(q.loan, { decimals: false })} → ${eur(q.payment, { decimals: false })}/mois · cash-flow ≈ <span class="${cashflow >= 0 ? 'good' : 'bad'}">${eur(Math.round(cashflow), { decimals: false })}/mois</span></span></div>
          ${actBtn('Acheter', { type: 'buyProperty', id: c.id, downPct: form.down }, { cls: 'btn-small', disabled: q.cash > state.personal.cash })}</li>`;
      })
      .join('');
    return `
    <section class="card-block">
      <h3>Revenu passif ${help('Revenu passif')}</h3>
      <p>Moyenne 3 mois : <strong class="${p.total >= p.target ? 'good' : ''}">${eur(p.total, { decimals: false })}/mois</strong> sur un objectif de ${eur(p.target, { decimals: false })}/mois.</p>
      <p>${bar(Math.max(0, p.total), p.target)} ${pct(Math.max(0, p.total) / Math.max(1, p.target))}</p>
      <table class="table"><tbody>${parts.map(([k, v]) => `<tr><td>${esc(PART_LABELS[k] || k)}</td><td class="num ${v < 0 ? 'bad' : ''}">${eur(v, { decimals: false })}/mois</td></tr>`).join('')}</tbody></table>
      <p class="small muted">${state.staff.founder.active ? `Ton entreprise ne compte pas encore : il faut ${manager ? 'te retirer de l’opérationnel (onglet Équipe)' : 'recruter un·e gérant·e puis te retirer de l’opérationnel'} ${help('Gérant')}.` : 'Ton entreprise tourne sans toi : son bénéfice net compte comme revenu passif.'} La bourse compte pour 4 %/an de sa valeur ${help('Règle des 4 %')}.</p>
      <canvas id="passive-chart" class="chart" width="560" height="150" aria-label="Évolution du revenu passif"></canvas>
    </section>

    <section class="card-block">
      <h3>Ton compte personnel : ${eur(state.personal.cash, { decimals: false })}</h3>
      ${amountField()}
      <p class="small muted">Les placements se font avec ton argent personnel : sors d'abord l'argent de l'entreprise (prélèvement, rémunération ou dividendes, onglet Finances).</p>
    </section>

    <section class="card-block">
      <h3>Épargne réglementée ${help('Intérêts composés')}</h3>
      <p>Solde : <strong>${eur(inv.savings, { decimals: false })}</strong> · taux ${pct(savingsRate(state), 2)}/an · intérêts exonérés jusqu'à 1 020 €/an.</p>
      <div class="btns"><button type="button" class="btn btn-small" data-ui="inv" data-arg="deposit">Déposer</button><button type="button" class="btn btn-small" data-ui="inv" data-arg="withdraw">Retirer</button></div>
    </section>

    <section class="card-block">
      <h3>Bourse ${help('ETF')}</h3>
      <table class="table"><thead><tr><th>Placement</th><th class="num">Valeur</th><th class="num">Plus-value</th><th></th></tr></thead><tbody>
        <tr><td>${esc(I.etf.label)}<br><span class="small muted">≈ ${pct(I.etf.annualReturn)}/an en moyenne, volatilité ${pct(I.etf.annualVol)}</span></td><td class="num">${eur(inv.etf.value, { decimals: false })}</td><td class="num ${gainEtf < 0 ? 'bad' : 'good'}">${eur(gainEtf, { decimals: false })}</td>
          <td><div class="btns"><button type="button" class="btn btn-small" data-ui="inv" data-arg="buy:etf">Acheter</button><button type="button" class="btn btn-small" data-ui="inv" data-arg="sell:etf">Vendre</button></div></td></tr>
        <tr><td>${esc(I.stocks.label)}<br><span class="small muted">≈ ${pct(I.stocks.annualReturn)}/an, volatilité ${pct(I.stocks.annualVol)}, dividende ${pct(I.stocks.dividendYield, 1)}</span></td><td class="num">${eur(inv.stocks.value, { decimals: false })}</td><td class="num ${gainSt < 0 ? 'bad' : 'good'}">${eur(gainSt, { decimals: false })}</td>
          <td><div class="btns"><button type="button" class="btn btn-small" data-ui="inv" data-arg="buy:stocks">Acheter</button><button type="button" class="btn btn-small" data-ui="inv" data-arg="sell:stocks">Vendre</button></div></td></tr>
      </tbody></table>
      <p class="small muted">Frais sur ${eur(form.amount, { decimals: false })} : ETF ${eur(tradeFees('etf', form.amount))} · actions ${eur(tradeFees('stocks', form.amount))} (TOB + courtage) ${help('TOB')}. Plus-values taxées à 10 % au-delà de 10 000 €/an ${help('Taxe sur les plus-values')}. Rendements simulés, pas des prévisions.</p>
      <canvas id="market-chart" class="chart" width="560" height="140" aria-label="Indices boursiers"></canvas>
    </section>

    <section class="card-block">
      <h3>Immobilier locatif ${help('Droits d’enregistrement')}</h3>
      <label class="field"><span>Apport personnel (le reste en crédit hypothécaire à ${pct(mortgageRate(state), 2)} sur ${I.realEstate.mortgageYears} ans)</span>
        <select id="inv-down">${[0.2, 0.4, 0.6, 1].map((d) => `<option value="${d}" ${d === form.down ? 'selected' : ''}>${pct(d)}${d === 1 ? ' (sans crédit)' : ''}</option>`).join('')}</select></label>
      ${props ? `<h4>Tes biens</h4><ul class="list">${props}</ul>` : ''}
      <h4>À vendre</h4>
      <ul class="list">${catalog}</ul>
      <p class="small muted">Frais à l'achat : droits d'enregistrement 12,5 % + notaire ≈ 2 %. Précompte immobilier ≈ 1 mois de loyer/an, entretien ≈ 1 %/an, vide locatif possible ${help('Précompte immobilier')}.</p>
    </section>`;
  },
  mount(el, state) {
    const a = el.querySelector('#inv-amount');
    if (a) a.addEventListener('input', () => (form.amount = Math.max(0, Math.round(Number(a.value) * 100) || 0)));
    const d = el.querySelector('#inv-down');
    if (d) d.addEventListener('change', () => (form.down = Number(d.value)));
    const pc = el.querySelector('#passive-chart');
    if (pc) {
      const h = state.passive.history.slice(-36);
      drawLines(pc, { labels: h.map(() => ''), series: [{ name: 'Revenu passif', color: '#a7f070', values: h }, { name: 'Objectif', color: '#ffcd75', values: h.map(() => state.passiveTarget), dashed: true }] });
    }
    const mc = el.querySelector('#market-chart');
    if (mc) {
      const h = state.investments.history.slice(-36);
      drawLines(mc, { labels: h.map(() => ''), series: [{ name: 'ETF', color: '#41a6f6', values: h.map((x) => x.etf) }, { name: 'Actions', color: '#ef7d57', values: h.map((x) => x.stocks) }, { name: 'Épargne', color: '#a7f070', values: h.map((x) => x.savings) }] });
    }
  },
  ui(cmd, arg, app) {
    if (cmd !== 'inv') return;
    const input = document.getElementById('inv-amount');
    const amount = input ? Math.round(Number(input.value) * 100) : form.amount;
    if (!(amount > 0)) return toast('Montant invalide.', 'bad');
    form.amount = amount;
    const [op, kind] = arg.split(':');
    if (op === 'deposit') app.dispatch({ type: 'deposit', amount });
    if (op === 'withdraw') app.dispatch({ type: 'withdraw', amount });
    if (op === 'buy') app.dispatch({ type: 'buyAsset', kind, amount });
    if (op === 'sell') app.dispatch({ type: 'sellAsset', kind, amount });
  },
  live: false,
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

// ---- src/ui/panels/stats.js ----
__m["src/ui/panels/stats.js"] = (function () {
const __exports = {};
__def(__exports, { "panel": () => panel });
// Onglet Stats : graphiques (trésorerie, CA et charges, marge, parts de marché, patrimoine).

const { drawLines, drawBars, legend } = __m["src/ui/charts.js"];
const { eur, pct, num } = __m["src/ui/format.js"];
const { formatMonth } = __m["src/engine/calendar.js"];
const { netWorth } = __m["src/engine/selectors.js"];
const { computeScore } = __m["src/engine/score.js"];
const { CATEGORIES } = __m["src/data/economy.js"];

const COLORS = { cash: '#41a6f6', rev: '#a7f070', exp: '#ef7d57', profit: '#ffcd75', share: '#73eff7', nw: '#a7f070', passive: '#ffcd75', rep: '#e43b44' };

const panel = {
  id: 'stats',
  label: 'Stats',
  icon: '📊',
  render(state) {
    const sc = computeScore(state);
    const h = state.finance.history;
    const last12 = h.slice(-12);
    const rev12 = last12.reduce((s, x) => s + x.revenue, 0);
    const prof12 = last12.reduce((s, x) => s + x.profit, 0);
    return `
    <section class="card-block">
      <h3>En un coup d'œil</h3>
      <div class="stat-grid">
        <div><span class="muted">Patrimoine net</span><strong>${eur(netWorth(state), { decimals: false })}</strong></div>
        <div><span class="muted">CA 12 derniers mois</span><strong>${eur(rev12, { decimals: false })}</strong></div>
        <div><span class="muted">Marge nette 12 mois</span><strong>${rev12 ? pct(prof12 / rev12) : '—'}</strong></div>
        <div><span class="muted">CA cumulé</span><strong>${eur(state.finance.totals.revenue, { decimals: false })}</strong></div>
        <div><span class="muted">Score</span><strong>${num(sc.total)}</strong></div>
        <div><span class="muted">Ancienneté</span><strong>${num(state.time.day / 360, 1)} an(s)</strong></div>
      </div>
    </section>
    <section class="card-block"><h3>Trésorerie (180 derniers jours)</h3><canvas id="ch-cash" class="chart" width="560" height="150"></canvas></section>
    <section class="card-block"><h3>Chiffre d'affaires et charges (mensuels)</h3><canvas id="ch-rev" class="chart" width="560" height="160"></canvas>
      ${legend([{ name: 'CA', color: COLORS.rev }, { name: 'Charges', color: COLORS.exp }, { name: 'Résultat', color: COLORS.profit }])}</section>
    <section class="card-block"><h3>Marge nette (%)</h3><canvas id="ch-margin" class="chart" width="560" height="120"></canvas></section>
    <section class="card-block"><h3>Part de marché et réputation</h3><canvas id="ch-share" class="chart" width="560" height="130"></canvas>
      ${legend([{ name: 'Part de marché', color: COLORS.share }])}</section>
    <section class="card-block"><h3>Patrimoine net et revenu passif</h3><canvas id="ch-nw" class="chart" width="560" height="150"></canvas>
      ${legend([{ name: 'Patrimoine net', color: COLORS.nw }])}
      <canvas id="ch-passive" class="chart" width="560" height="110"></canvas>${legend([{ name: 'Revenu passif mensuel', color: COLORS.passive }])}</section>
    <section class="card-block"><h3>Où va l'argent (12 derniers mois)</h3><canvas id="ch-out" class="chart" width="560" height="200"></canvas></section>`;
  },
  mount(el, state) {
    const h = state.finance.history.slice(-36);
    const labels = h.map((x) => formatMonth(x.m));
    const dc = state.finance.dailyCash;
    drawLines(el.querySelector('#ch-cash'), { labels: dc.map(() => ''), series: [{ name: 'Trésorerie', color: COLORS.cash, values: dc }] });
    drawLines(el.querySelector('#ch-rev'), {
      labels,
      series: [
        { name: 'CA', color: COLORS.rev, values: h.map((x) => x.revenue) },
        { name: 'Charges', color: COLORS.exp, values: h.map((x) => x.expenses) },
        { name: 'Résultat', color: COLORS.profit, values: h.map((x) => x.profit), dashed: true },
      ],
    });
    drawLines(el.querySelector('#ch-margin'), { labels, series: [{ name: 'Marge', color: COLORS.profit, values: h.map((x) => (x.revenue > 0 ? x.profit / x.revenue : NaN)) }] }, { format: 'pct' });
    drawLines(el.querySelector('#ch-share'), { labels, series: [{ name: 'Part', color: COLORS.share, values: h.map((x) => x.share) }] }, { format: 'pct' });
    drawLines(el.querySelector('#ch-nw'), { labels, series: [{ name: 'Patrimoine', color: COLORS.nw, values: h.map((x) => (x.netWorth == null ? NaN : x.netWorth)) }] });
    drawLines(el.querySelector('#ch-passive'), { labels, series: [{ name: 'Passif', color: COLORS.passive, values: h.map((x) => (x.passive == null ? NaN : x.passive)) }] });
    const outs = {};
    for (const x of state.finance.history.slice(-12)) for (const [k, v] of Object.entries(x.byCat || {})) outs[k] = (outs[k] || 0) + v;
    const top = Object.entries(outs).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const pal = ['#ef7d57', '#41a6f6', '#ffcd75', '#a7f070', '#b13e53', '#73eff7', '#94b0c2', '#5d275d'];
    drawBars(el.querySelector('#ch-out'), top.map(([k, v], i) => ({ label: (CATEGORIES[k] || k).slice(0, 16), value: v, color: pal[i % pal.length] })));
  },
};
return __exports;
})();

// ---- src/ui/panels/succes.js ----
__m["src/ui/panels/succes.js"] = (function () {
const __exports = {};
__def(__exports, { "panel": () => panel });
// Onglet Succès.

const { esc } = __m["src/ui/dom.js"];
const { ACHIEVEMENTS } = __m["src/data/achievements.js"];
const { formatDate } = __m["src/engine/calendar.js"];

const panel = {
  id: 'succes',
  label: 'Succès',
  icon: '🏅',
  render(state) {
    const list = ACHIEVEMENTS.filter((a) => !a.sector || a.sector === state.meta.sector);
    const u = state.achievements.unlocked;
    const n = list.filter((a) => u[a.id] != null).length;
    return `<section class="card-block"><h3>Succès : ${n} / ${list.length}</h3>
      <ul class="ach-grid">${list
        .map((a) => {
          const ok = u[a.id] != null;
          return `<li class="ach ${ok ? 'ok' : 'locked'}"><span class="ach-icon" aria-hidden="true">${ok ? a.icon : '🔒'}</span><span><strong>${esc(a.label)}</strong><br><span class="small">${esc(a.desc)}</span>${ok ? `<br><span class="small muted">Débloqué le ${formatDate(u[a.id])}</span>` : ''}</span></li>`;
        })
        .join('')}</ul></section>`;
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
const { panel: marche } = __m["src/ui/panels/marche.js"];
const { panel: investissements } = __m["src/ui/panels/investissements.js"];
const { panel: evenements } = __m["src/ui/panels/evenements.js"];
const { panel: stats } = __m["src/ui/panels/stats.js"];
const { panel: succes } = __m["src/ui/panels/succes.js"];

const PANELS = [entreprise, finances, equipe, marche, investissements, evenements, stats, succes];
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
    this.root.querySelector('.tabs').addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const i = PANELS.findIndex((p) => p.id === this.tab);
      const n = PANELS.length;
      const j = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n;
      this.selectTab(PANELS[j].id);
      $(`#tab-${PANELS[j].id}`).focus();
      e.preventDefault();
    });
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
      const v = Number(el.value);
      if (out) out.textContent = fmt === 'eur' ? eur(v * Number(el.dataset.scale || 1), { decimals: false }) : fmt === 'pct' ? `${v} %` : fmt === 'days100' ? `${(v / 100).toFixed(1).replace('.', ',')} j` : el.value;
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
    const value = el.dataset.checkbox ? el.checked : el.dataset.raw ? el.value : Math.round(Number(String(el.value).replace(',', '.')) * Number(el.dataset.scale || 1));
    if (!el.dataset.raw && !el.dataset.checkbox && !Number.isFinite(value)) {
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
        b.tabIndex = p.id === id ? 0 : -1;
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
    ferme: 'Établissement fermé (sanction ou incident).',
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
