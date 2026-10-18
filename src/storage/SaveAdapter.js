// Interface de sauvegarde. Toutes les méthodes renvoient des Promises pour
// qu'un adaptateur distant (cloud, V2) puisse respecter le même contrat.
//
// Une sauvegarde est une « enveloppe » :
//   { format, saveVersion, savedAt, summary, state }
// summary contient de quoi afficher la liste sans charger tout l'état.

import { migrate } from '../engine/migrations.js';
import { CONFIG } from '../data/config.js';

export const SAVE_FORMAT = 'entrepreneur-tycoon';

export class SaveError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'SaveError';
    this.code = code; // 'corrupt' | 'quota' | 'notfound' | 'format' | 'version' | 'unavailable'
  }
}

/** Contrat à implémenter par chaque adaptateur. */
export class SaveAdapter {
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
export function summarize(state) {
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
export function wrap(state, savedAt) {
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
export function unwrap(raw) {
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

export const SLOTS = ['auto', ...Array.from({ length: CONFIG.saveSlots }, (_, i) => String(i + 1))];
