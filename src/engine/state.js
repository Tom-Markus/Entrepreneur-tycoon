// Création d'une nouvelle partie. L'état produit est un objet JSON pur.

import { CONFIG } from '../data/config.js';
import { DIFFICULTIES } from '../data/difficulty.js';
import { hashSeed, createRng } from './rng.js';
import { initHooks } from './hooks.js';

export const DEFAULT_OPTIONS = {
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
export function newGame(opts = {}) {
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
