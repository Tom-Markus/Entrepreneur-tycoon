// Contrôles du centre de soutien scolaire (onglet Entreprise).

import { eurInput, rangeInput, help } from '../dom.js';
import { eur, num, pct } from '../format.js';
import { SOUTIEN as D } from '../../data/sectors/soutien.js';
import { capacity, expectedSuccess, refPrice } from '../../engine/sectors/soutien.js';
import { formatDate, MONTH_NAMES } from '../../engine/calendar.js';

export function renderSector(state) {
  const s = state.sector;
  const cap = capacity(state);
  const res = s.results.slice(-4).reverse();
  return `
  <section class="card-block">
    <h3>Ton offre</h3>
    <div class="form-row">
      ${eurInput('price', s.price, { type: 'sector', name: 'setPrice' }, { min: D.minPrice / 100, max: D.maxPrice / 100, label: `Abonnement mensuel TTC (marché ≈ ${eur(refPrice(state), { decimals: false })})` })}
      ${rangeInput('group', s.groupSize, { type: 'sector', name: 'setGroupSize' }, { min: D.groupSize.min, max: D.groupSize.max, step: 1, label: 'Élèves par groupe', display: `${s.groupSize}` })}
    </div>
    <p class="small muted">Petits groupes = meilleurs résultats mais moins d'élèves par enseignant. TVA à 21 % dans le jeu (exemption possible selon les cas) ${help('TVA')}.</p>
  </section>
  <section class="card-block">
    <h3>Élèves</h3>
    <p><strong>${s.students}</strong> inscrits · capacité ${cap.total} (enseignants : ${cap.teach}, places : ${cap.seats})${s.discounted ? ` · dont ${s.discounted} au tarif partenaire` : ''}.</p>
    <p class="small">Réussite attendue aux prochains examens : <strong>${pct(expectedSuccess(state))}</strong>. Sessions fin janvier et fin juin ; en juin, ≈ ${Math.round(D.yearEndChurn * 100)} % des élèves partent (fin d'année).</p>
    <p class="small muted">Inscriptions fortes en ${MONTH_NAMES[8]}, avant les examens (décembre, mai) ; creux en ${MONTH_NAMES[6]}.</p>
  </section>
  ${res.length ? `<section class="card-block"><h3>Résultats</h3><ul class="small">${res.map((r) => `<li>${formatDate(r.day)} : ${pct(r.success)} de réussite (${r.students} élèves)</li>`).join('')}</ul></section>` : ''}`;
}
