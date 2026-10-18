// Petits utilitaires DOM.

/** Échappe une chaîne pour l'insérer dans du HTML. */
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function $(sel, root = document) {
  return root.querySelector(sel);
}

export function $$(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

/** Bouton qui déclenche une action moteur (via délégation d'événements). */
export function actBtn(label, action, { cls = '', disabled = false, title = '' } = {}) {
  return `<button type="button" class="btn ${cls}" data-act='${esc(JSON.stringify(action))}' ${disabled ? 'disabled' : ''} ${title ? `title="${esc(title)}"` : ''}>${label}</button>`;
}

/** Bouton qui déclenche une commande d'interface (ouvrir une fenêtre…). */
export function uiBtn(label, cmd, { cls = '', disabled = false, title = '', arg = '' } = {}) {
  return `<button type="button" class="btn ${cls}" data-ui="${esc(cmd)}" data-arg="${esc(arg)}" ${disabled ? 'disabled' : ''} ${title ? `title="${esc(title)}"` : ''}>${label}</button>`;
}

/** Petite icône « ? » qui ouvre une notion du glossaire. */
export function help(term) {
  return `<button type="button" class="help" data-ui="glossary" data-arg="${esc(term)}" aria-label="Explication : ${esc(term)}">?</button>`;
}

/**
 * Champ numérique en euros relié à une action. L'action reçoit value en centimes.
 * action = { type, name? } ; on y ajoute value.
 */
export function eurInput(id, cents, action, { min = 0, max = 1e9, step = 1, label = '' } = {}) {
  return `<label class="field"><span>${label}</span><span class="input-eur"><input type="number" id="${esc(id)}" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${Math.round(cents) / 100}" data-input='${esc(JSON.stringify(action))}' data-scale="100"><span>€</span></span></label>`;
}

/** Curseur relié à une action (valeur brute ou multipliée par scale). */
export function rangeInput(id, value, action, { min = 0, max = 100, step = 1, scale = 1, label = '', display = '', fmt = '' } = {}) {
  return `<label class="field range"><span>${label} <output for="${esc(id)}">${display}</output></span><input type="range" id="${esc(id)}" min="${min}" max="${max}" step="${step}" value="${value / scale}" data-input='${esc(JSON.stringify(action))}' data-scale="${scale}" data-fmt="${esc(fmt)}"></label>`;
}

export function selectInput(id, value, options, action, { label = '' } = {}) {
  const opts = options.map((o) => `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.label)}</option>`).join('');
  return `<label class="field"><span>${label}</span><select id="${esc(id)}" data-input='${esc(JSON.stringify(action))}' data-raw="1">${opts}</select></label>`;
}

/** Barre de progression accessible. */
export function bar(value, max = 1, cls = '') {
  const p = Math.max(0, Math.min(1, max ? value / max : 0));
  return `<span class="bar ${cls}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(p * 100)}"><span style="width:${(p * 100).toFixed(1)}%"></span></span>`;
}
