// Onglet Succès.

import { esc } from '../dom.js';
import { ACHIEVEMENTS } from '../../data/achievements.js';
import { formatDate } from '../../engine/calendar.js';

export const panel = {
  id: 'succes',
  label: 'Succès',
  icon: '🏅',
  render(state) {
    const list = ACHIEVEMENTS.filter((a) => !a.sector || a.sector === state.meta.sector);
    const u = state.achievements.unlocked;
    const n = list.filter((a) => u[a.id] != null).length;
    return `<section class="card-block"><h3>Succès : ${n} / ${list.length}</h3>
      <ul class="ach-grid">${list
        .map((a) => {
          const ok = u[a.id] != null;
          return `<li class="ach ${ok ? 'ok' : 'locked'}"><span class="ach-icon" aria-hidden="true">${ok ? a.icon : '🔒'}</span><span><strong>${esc(a.label)}</strong><br><span class="small">${esc(a.desc)}</span>${ok ? `<br><span class="small muted">Débloqué le ${formatDate(u[a.id])}</span>` : ''}</span></li>`;
        })
        .join('')}</ul></section>`;
  },
};
