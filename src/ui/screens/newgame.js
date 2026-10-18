// Écran de création de partie.

import { esc } from '../dom.js';
import { eur } from '../format.js';
import { SECTOR_DATA } from '../../engine/sectors/registry.js';
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../../data/difficulty.js';
import { LEGAL } from '../../data/legal.js';
import { pixelTitle, mountPixelTitles } from '../pixelfont.js';
import { drawSectorIcon } from '../scene.js';

export function renderNewGame(app) {
  const sectors = Object.values(SECTOR_DATA);
  app.root.innerHTML = `
  <main class="newgame">
    ${pixelTitle('NOUVELLE ENTREPRISE', 'h1', 3)}
    <form id="ng-form" class="ng-form" autocomplete="off">
      <fieldset class="ng-sectors">
        <legend>1. Ton secteur</legend>
        <div class="card-grid">
        ${sectors
          .map(
            (s, i) => `<label class="card pick">
            <input type="radio" name="sector" value="${s.id}" ${i === 0 ? 'checked' : ''}>
            <canvas class="sector-icon" width="32" height="32" data-icon="${s.id}" aria-hidden="true"></canvas>
            <span class="card-title">${esc(s.label)}</span>
            <span class="card-text">${esc(s.tagline)}</span>
          </label>`,
          )
          .join('')}
        </div>
        <p class="ng-desc" id="ng-sector-desc"></p>
        <div id="ng-metier"></div>
      </fieldset>

      <fieldset>
        <legend>2. Ton statut juridique</legend>
        <div class="card-grid two">
        ${Object.values(LEGAL)
          .map(
            (l, i) => `<label class="card pick">
            <input type="radio" name="legal" value="${l.id}" ${i === 0 ? 'checked' : ''}>
            <span class="card-title">${esc(l.label)}</span>
            <ul class="card-list">${l.pros.map((p) => `<li class="good">+ ${esc(p)}</li>`).join('')}${l.cons.map((p) => `<li class="bad">− ${esc(p)}</li>`).join('')}</ul>
          </label>`,
          )
          .join('')}
        </div>
        <label class="check"><input type="checkbox" name="vatFranchise"> Régime de franchise TVA (si CA &lt; 25 000 €/an : pas de TVA facturée ni récupérée)</label>
      </fieldset>

      <fieldset>
        <legend>3. Difficulté</legend>
        <div class="card-grid four">
        ${DIFFICULTY_ORDER.map((id) => {
          const d = DIFFICULTIES[id];
          return `<label class="card pick small">
            <input type="radio" name="difficulty" value="${id}" ${id === 'normal' ? 'checked' : ''}>
            <span class="card-title">${esc(d.label)}</span>
            <span class="card-text">${esc(d.description)}</span>
            <span class="card-text"><strong>${eur(d.startingCapital, { decimals: false })}</strong> de départ · objectif ${eur(d.passiveTarget, { decimals: false })}/mois</span>
          </label>`;
        }).join('')}
        </div>
      </fieldset>

      <fieldset class="ng-names">
        <legend>4. Identité</legend>
        <label class="field"><span>Nom de l'entreprise</span><input name="companyName" maxlength="40" required value="${esc(defaultName())}"></label>
        <label class="field"><span>Ton prénom</span><input name="founderName" maxlength="30" required value="Tom"></label>
        <label class="field"><span>Graine (seed) — optionnel</span><input name="seed" maxlength="40" placeholder="ex : bruxelles2026"></label>
        <label class="field range"><span>Part du capital investie dans l'entreprise <output id="apport-out">70 %</output></span>
          <input type="range" name="apportPct" min="0" max="100" step="5" value="70"></label>
        <p class="muted small">La graine rend la partie reproductible : même graine + mêmes décisions = même partie.</p>
      </fieldset>

      <div class="ng-actions">
        <button type="button" class="btn" id="ng-back">← Retour</button>
        <button type="submit" class="btn btn-primary">Lancer l'entreprise ▶</button>
      </div>
    </form>
  </main>`;
  mountPixelTitles(app.root);
  app.root.querySelectorAll('canvas[data-icon]').forEach((c) => drawSectorIcon(c, c.dataset.icon));
  const form = document.getElementById('ng-form');
  const desc = document.getElementById('ng-sector-desc');
  const metierBox = document.getElementById('ng-metier');
  const updateSector = () => {
    const id = form.sector.value;
    const s = SECTOR_DATA[id];
    desc.textContent = s.description;
    if (s.metiers) {
      metierBox.innerHTML = `<label class="field"><span>Métier</span><select name="metier">${Object.values(s.metiers)
        .map((m) => `<option value="${m.id}">${esc(m.label)}</option>`)
        .join('')}</select></label>`;
    } else metierBox.innerHTML = '';
  };
  form.addEventListener('change', (e) => {
    if (e.target.name === 'sector') updateSector();
  });
  form.apportPct.addEventListener('input', () => {
    document.getElementById('apport-out').textContent = `${form.apportPct.value} %`;
  });
  updateSector();
  document.getElementById('ng-back').addEventListener('click', () => app.showTitle());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const opts = {
      sector: form.sector.value,
      legal: form.legal.value,
      difficulty: form.difficulty.value,
      companyName: form.companyName.value.trim() || 'Ma Boîte',
      founderName: form.founderName.value.trim() || 'Alex',
      seed: form.seed.value.trim(),
      vatFranchise: form.vatFranchise.checked,
      apportPct: Number(form.apportPct.value) / 100,
      metier: form.metier ? form.metier.value : null,
    };
    app.startNewGame(opts);
  });
}

function defaultName() {
  const names = ['Atomium Digital', 'Gaufre & Code', 'Les Frites d’Or', 'Belgian Hustle', 'Manneken Business'];
  return names[Math.floor(Math.random() * names.length)];
}
