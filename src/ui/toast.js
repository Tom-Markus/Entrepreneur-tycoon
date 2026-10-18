// Notifications non intrusives (coin de l'écran, disparaissent seules).

import { esc } from './dom.js';

const MAX = 4;

export function toast(text, kind = 'info', ms = 4500) {
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
