// Sauvegarde dans le localStorage du navigateur.
// Clés : entrepreneur-tycoon:slot:<auto|1|2|3>

import { SaveAdapter, SaveError, wrap, unwrap, SLOTS } from './SaveAdapter.js';

const PREFIX = 'entrepreneur-tycoon:slot:';

export class LocalStorageAdapter extends SaveAdapter {
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
