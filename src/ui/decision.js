// Fenêtre de décision pour les événements à choix (le jeu est en pause).

import { esc } from './dom.js';
import { openModal, closeModal } from './modal.js';
import { describeEffects } from '../engine/events.js';

export function showDecisionModal(app, onDone) {
  const s = app.state;
  const ev = s.events.pending[0];
  if (!ev) return onDone();
  const choices = ev.choices
    .map((c, i) => {
      const lines = describeEffects(s, c);
      return `<li class="choice"><button type="button" class="btn choice-btn" data-choice="${i}">${esc(c.label)}</button>
        <ul class="effects">${lines.map((l) => `<li class="${l.kind}">${esc(l.text)}</li>`).join('') || '<li class="muted">Aucun effet direct.</li>'}</ul></li>`;
    })
    .join('');
  const m = openModal({
    title: esc(ev.title),
    closable: false,
    cls: 'modal-decision',
    html: `<p class="event-text">${esc(ev.text)}</p><ul class="choices">${choices}</ul>`,
  });
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-choice]');
    if (!b) return;
    const res = app.dispatch({ type: 'decide', uid: ev.uid, choice: Number(b.dataset.choice) });
    if (res.ok) {
      closeModal(true);
      onDone();
    }
  });
}
