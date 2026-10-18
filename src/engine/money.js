// Tous les montants du jeu sont des CENTIMES ENTIERS.
// Ces fonctions garantissent qu'aucun flottant ne se glisse dans l'argent.

/** Euros (nombre, éventuellement décimal) → centimes entiers. */
export function eur(x) {
  return Math.round(x * 100);
}

/** Centimes × facteur, arrondi au centime. */
export function mul(cents, factor) {
  const r = Math.round(cents * factor);
  return r === 0 ? 0 : r; // évite -0
}

/** Centimes → euros (pour les calculs d'affichage uniquement). */
export function toEur(cents) {
  return cents / 100;
}

/** Borne un entier. */
export function clamp(x, min, max) {
  return x < min ? min : x > max ? max : x;
}

/** Somme de centimes. */
export function sum(arr) {
  let s = 0;
  for (const x of arr) s += x;
  return s;
}

/** Mensualité constante d'un prêt (centimes), taux annuel en décimal. */
export function annuity(principal, annualRate, months) {
  if (months <= 0) return principal;
  const r = annualRate / 12;
  if (r === 0) return Math.ceil(principal / months);
  return Math.round((principal * r) / (1 - Math.pow(1 + r, -months)));
}
