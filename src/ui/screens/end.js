// Écrans de fin : victoire (bilan) et faillite (post-mortem).

import { esc } from '../dom.js';
import { eur, pct } from '../format.js';
import { formatDate } from '../../engine/calendar.js';
import { computeScore } from '../../engine/score.js';
import { netWorth, passiveIncome } from '../../engine/selectors.js';
import { pixelTitle, mountPixelTitles } from '../pixelfont.js';
import { closeModal } from '../modal.js';

export function renderEnd(app) {
  const s = app.state;
  if (s.status === 'bankrupt') return renderPostMortem(app);
  if (s.status === 'won') return renderVictory(app);
}

function renderPostMortem(app) {
  const s = app.state;
  const pm = s.endgame.postmortem || { causes: [], outflows: [] };
  const years = (s.time.day / 360).toFixed(1).replace('.', ',');
  const m = app.openModal({
    title: 'Faillite',
    closable: false,
    cls: 'modal-wide',
    html: `${pixelTitle('POST-MORTEM', 'h2', 3, '#e43b44')}
    <p><strong>${esc(s.meta.companyName)}</strong> a fait faillite le ${formatDate(s.time.day)}, après ${years} an(s) d'activité.</p>
    ${pm.legal === 'independant' && pm.seized > 0 ? `<p class="bad">En tant qu'indépendant (responsabilité illimitée), ${eur(pm.seized, { decimals: false })} de ton épargne personnelle ont été saisis par les créanciers.</p>` : ''}
    ${pm.legal === 'srl' ? '<p class="good">Ta SRL t’a protégé : ton patrimoine personnel n’est pas saisi.</p>' : ''}
    <h3>Les causes principales</h3>
    <ol class="causes">${pm.causes.map((c) => `<li><strong>${esc(c.title)}</strong> — ${esc(c.detail)}<br><span class="advice">💡 ${esc(c.advice)}</span></li>`).join('')}</ol>
    <h3>Où est parti l'argent (4 derniers mois)</h3>
    <table class="table"><tbody>${pm.outflows.map((o) => `<tr><td>${esc(o.label)}</td><td class="num">${eur(o.amount, { decimals: false })}</td><td class="num muted">${pct(o.pct)}</td></tr>`).join('')}</tbody></table>
    <p>Score : <strong>${computeScore(s).total.toLocaleString('fr-BE')}</strong></p>
    <div class="btns"><button class="btn btn-primary" data-e="new">Recommencer</button><button class="btn" data-e="same">Rejouer la même graine</button><button class="btn" data-e="menu">Menu principal</button></div>`,
  });
  mountPixelTitles(m);
  bindEnd(app, m);
}

function renderVictory(app) {
  const s = app.state;
  const p = passiveIncome(s);
  const sc = computeScore(s);
  const years = (s.time.day / 360).toFixed(1).replace('.', ',');
  const m = app.openModal({
    title: 'Liberté financière !',
    closable: false,
    cls: 'modal-wide',
    html: `${pixelTitle('LIBERTÉ FINANCIÈRE !', 'h2', 3, '#a7f070')}
    <p>Félicitations ${esc(s.meta.founderName)} ! Après ${years} an(s), tes revenus passifs atteignent <strong>${eur(p.total, { decimals: false })}/mois</strong> (objectif ${eur(p.target, { decimals: false })}).</p>
    <div class="stat-grid">
      <div><span class="muted">Patrimoine net</span><strong>${eur(netWorth(s), { decimals: false })}</strong></div>
      <div><span class="muted">CA cumulé</span><strong>${eur(s.finance.totals.revenue, { decimals: false })}</strong></div>
      <div><span class="muted">Employés</span><strong>${s.staff.employees.length}</strong></div>
      <div><span class="muted">Succès</span><strong>${Object.keys(s.achievements?.unlocked || {}).length}</strong></div>
    </div>
    <h3>D'où vient ton revenu passif</h3>
    <ul>${Object.entries(p.parts).filter(([, v]) => v).map(([k, v]) => `<li>${esc(PART_LABELS[k] || k)} : ${eur(v, { decimals: false })}/mois</li>`).join('')}</ul>
    <p>Score : <strong>${sc.total.toLocaleString('fr-BE')}</strong></p>
    <div class="btns"><button class="btn btn-primary" data-e="sandbox">Continuer en bac à sable</button><button class="btn" data-e="new">Nouvelle partie</button><button class="btn" data-e="menu">Menu principal</button></div>`,
  });
  mountPixelTitles(m);
  bindEnd(app, m);
}

export const PART_LABELS = { epargne: 'Épargne', bourse: 'ETF et actions (règle des 4 %)', immobilier: 'Immobilier locatif', entreprise: 'Entreprise gérée sans toi' };

function bindEnd(app, m) {
  m.addEventListener('click', (e) => {
    const b = e.target.closest('[data-e]');
    if (!b) return;
    const c = b.dataset.e;
    closeModal(true);
    if (c === 'sandbox') {
      app.dispatch({ type: 'continueSandbox' });
      app.setSpeed(1);
    } else if (c === 'new') app.showNewGame();
    else if (c === 'same') {
      const meta = app.state.meta;
      app.startNewGame({ sector: meta.sector, legal: meta.legal, difficulty: meta.difficulty, companyName: meta.companyName, founderName: meta.founderName, seed: meta.seed, metier: meta.metier });
    } else app.showTitle();
  });
}
