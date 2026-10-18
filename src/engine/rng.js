// Générateur pseudo-aléatoire déterministe (mulberry32).
// Son état tient dans un entier 32 bits : il est sauvegardé dans state.rngState,
// ce qui rend toute partie reproductible à partir de sa seed.

/** Transforme une chaîne (seed saisie par le joueur) en entier 32 bits. */
export function hashSeed(str) {
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
export function createRng(state) {
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
