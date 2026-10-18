// Onglet Événements : journal complet.

import { esc } from '../dom.js';
import { formatDate } from '../../engine/calendar.js';

const ICON = { good: '✅', bad: '⚠️', tax: '🧾', event: '🎲', staff: '👤', market: '📈', invest: '💹', info: 'ℹ️' };

export const panel = {
  id: 'evenements',
  label: 'Journal',
  icon: '📰',
  render(state) {
    const entries = [...state.log].reverse().slice(0, 120);
    return `<section class="card-block"><h3>Journal de l'entreprise</h3>
      <ul class="journal">${entries.map((e) => `<li class="j-${e.kind}"><span class="j-date">${formatDate(e.day)}</span> ${ICON[e.kind] || ''} ${esc(e.text)}</li>`).join('')}</ul></section>`;
  },
};
