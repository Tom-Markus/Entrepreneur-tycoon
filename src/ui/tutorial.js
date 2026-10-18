// Tutoriel court (premier lancement), rejouable depuis le menu.

import { TUTORIAL } from '../data/tutorial.js';
import { esc } from './dom.js';

export function startTutorial(app, force) {
  if (!force && app.settings.tutorialDone) return;
  app.setSpeed(0);
  let i = 0;
  const box = document.createElement('div');
  box.className = 'tutorial';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-live', 'polite');
  document.body.appendChild(box);
  let hl = null;
  const finish = () => {
    if (hl) hl.classList.remove('tuto-highlight');
    box.remove();
    app.settings.tutorialDone = true;
    app.saveSettings();
    document.removeEventListener('keydown', onKey, true);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      finish();
    }
  };
  document.addEventListener('keydown', onKey, true);
  const show = () => {
    const step = TUTORIAL[i];
    if (step.tab && app.game) app.game.selectTab(step.tab);
    if (hl) hl.classList.remove('tuto-highlight');
    hl = step.target ? document.querySelector(step.target) : null;
    if (hl) {
      hl.classList.add('tuto-highlight');
      hl.scrollIntoView({ block: 'nearest' });
    }
    box.innerHTML = `<div class="tuto-step">${i + 1}/${TUTORIAL.length}</div><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p>
      <div class="btns"><button type="button" class="btn btn-small" data-t="skip">Passer</button>
      ${i > 0 ? '<button type="button" class="btn btn-small" data-t="prev">← Précédent</button>' : ''}
      <button type="button" class="btn btn-small btn-primary" data-t="next">${i === TUTORIAL.length - 1 ? 'Jouer !' : 'Suivant →'}</button></div>`;
    box.querySelector('[data-t="next"]').focus();
  };
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    if (b.dataset.t === 'skip') return finish();
    if (b.dataset.t === 'prev') i = Math.max(0, i - 1);
    if (b.dataset.t === 'next') {
      if (i === TUTORIAL.length - 1) return finish();
      i++;
    }
    show();
  });
  show();
}
