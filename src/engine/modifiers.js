// Effets temporaires (ex. « demande ×0,8 pendant 30 jours »).
// state.modifiers = [{ key, mult, add, until, label, source }]

/** Ajoute un modificateur temporaire. days = durée en jours. */
export function addModifier(state, { key, mult = 1, add = 0, days = 30, label = '', source = '' }) {
  state.modifiers.push({ key, mult, add, until: state.time.day + Math.max(1, Math.round(days)), label, source });
}

/** Produit des multiplicateurs actifs pour une clé. */
export function modMult(state, key) {
  let m = 1;
  for (const x of state.modifiers) if (x.key === key) m *= x.mult;
  return m;
}

/** Somme des ajouts actifs pour une clé. */
export function modAdd(state, key) {
  let a = 0;
  for (const x of state.modifiers) if (x.key === key) a += x.add;
  return a;
}

/** Retire les modificateurs expirés (appelé chaque jour). */
export function expireModifiers(state) {
  const d = state.time.day;
  if (state.modifiers.some((m) => m.until <= d)) state.modifiers = state.modifiers.filter((m) => m.until > d);
}

/** Libellés des modificateurs actifs (pour le panneau « pourquoi ? »). */
export function activeModifiers(state) {
  return state.modifiers.filter((m) => m.label);
}
