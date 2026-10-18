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

// ---- src/engine/systems/core.js ----
__m["src/engine/systems/core.js"] = (function () {
const __exports = {};
__def(__exports, { "init": () => init, "daily": () => daily });
// Système de base : conjoncture, statistiques de temps.

function init(state) {
  state.world = { economy: 1, weather: 'soleil', temp: 8 };
}

function daily() {}
return __exports;
})();

// ---- src/engine/hooks.js ----
__m["src/engine/hooks.js"] = (function () {
const __exports = {};
__def(__exports, { "SYSTEMS": () => SYSTEMS, "initHooks": () => initHooks });
// Registre ordonné des systèmes du moteur.
// Chaque système peut exposer : init(state, opts, diff, rng), daily(state, rng),
// monthEnd(state, rng), quarterEnd(state, rng), yearEnd(state, rng).
// L'ordre du tableau est l'ordre d'exécution (important pour le déterminisme).

const core = __m["src/engine/systems/core.js"];

const SYSTEMS = [core];

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

// ---- src/engine/index.js ----
__m["src/engine/index.js"] = (function () {
const __exports = {};
__def(__exports, { "newGame": () => __m["src/engine/state.js"]["newGame"], "DEFAULT_OPTIONS": () => __m["src/engine/state.js"]["DEFAULT_OPTIONS"], "tick": () => __m["src/engine/tick.js"]["tick"], "advance": () => __m["src/engine/tick.js"]["advance"], "stepDay": () => __m["src/engine/tick.js"]["stepDay"], "isBlocked": () => __m["src/engine/tick.js"]["isBlocked"], "applyAction": () => __m["src/engine/actions.js"]["applyAction"], "knownActions": () => __m["src/engine/actions.js"]["knownActions"], "createRng": () => __m["src/engine/rng.js"]["createRng"], "hashSeed": () => __m["src/engine/rng.js"]["hashSeed"], "migrate": () => __m["src/engine/migrations.js"]["migrate"], "calendar": () => __m["src/engine/calendar.js"], "money": () => __m["src/engine/money.js"] });
// API publique du moteur. L'interface et les outils n'importent que ce fichier.
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

// ---- src/main.js ----
__m["src/main.js"] = (function () {
const __exports = {};
// Point d'entrée de l'interface (phase 1 : squelette qui tourne).

const { newGame, advance } = __m["src/engine/index.js"];
const { formatDate } = __m["src/engine/calendar.js"];
const { GameLoop } = __m["src/ui/loop.js"];
const { CONFIG } = __m["src/data/config.js"];

const app = document.getElementById('app');
const state = newGame({ createdAt: new Date().toISOString() });
let speedIdx = 1;

app.innerHTML = `<h1>Entrepreneur Tycoon</h1><p id="date"></p><p id="speed"></p>`;
const dateEl = document.getElementById('date');
const speedEl = document.getElementById('speed');

const loop = new GameLoop({
  getSpeed: () => CONFIG.speeds[speedIdx],
  onAdvance: (dt) => advance(state, dt),
  onFrame: () => {
    dateEl.textContent = formatDate(state.time.day);
    speedEl.textContent = speedIdx === 0 ? 'Pause' : `Vitesse ×${CONFIG.speeds[speedIdx]}`;
  },
});
loop.start();

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    speedIdx = speedIdx === 0 ? 1 : 0;
    e.preventDefault();
  }
  if (e.key === '1') speedIdx = 1;
  if (e.key === '2') speedIdx = 2;
  if (e.key === '3') speedIdx = 3;
});
return __exports;
})();
})();
