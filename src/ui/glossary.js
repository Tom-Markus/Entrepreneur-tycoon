// Glossaire pédagogique (fenêtre modale avec recherche).

import { GLOSSARY } from '../data/glossary.js';
import { esc } from './dom.js';

export function openGlossary(app, term) {
  const keys = Object.keys(GLOSSARY).sort((a, b) => a.localeCompare(b, 'fr'));
  const render = (filter) =>
    keys
      .filter((k) => !filter || k.toLowerCase().includes(filter) || GLOSSARY[k].toLowerCase().includes(filter))
      .map((k) => `<dt id="g-${esc(k)}">${esc(k)}</dt><dd>${esc(GLOSSARY[k])}</dd>`)
      .join('');
  const m = app.openModal({
    title: 'Glossaire',
    cls: 'modal-wide',
    html: `<label class="field"><span>Rechercher</span><input type="search" id="g-search" value="" autofocus></label><dl class="glossary">${render('')}</dl>`,
  });
  const input = m.querySelector('#g-search');
  input.addEventListener('input', () => {
    m.querySelector('.glossary').innerHTML = render(input.value.trim().toLowerCase());
  });
  if (term && GLOSSARY[term]) {
    const el = m.querySelector(`[id="g-${CSS.escape(term)}"]`);
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.classList.add('highlight');
      el.nextElementSibling?.classList.add('highlight');
    }
  }
}
