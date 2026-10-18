// Adaptateur en mémoire (tests, simulations). Même contrat que LocalStorageAdapter.

import { LocalStorageAdapter } from './LocalStorageAdapter.js';

/** Petit Storage compatible (getItem/setItem/removeItem). */
export class MemoryStorage {
  constructor(quota = Infinity) {
    this.map = new Map();
    this.quota = quota;
  }
  getItem(k) {
    return this.map.has(k) ? this.map.get(k) : null;
  }
  setItem(k, v) {
    let size = String(v).length;
    for (const [key, val] of this.map) if (key !== k) size += val.length;
    if (size > this.quota) throw new Error('QuotaExceededError');
    this.map.set(k, String(v));
  }
  removeItem(k) {
    this.map.delete(k);
  }
}

export class MemoryAdapter extends LocalStorageAdapter {
  constructor(quota) {
    super(new MemoryStorage(quota));
  }
}
